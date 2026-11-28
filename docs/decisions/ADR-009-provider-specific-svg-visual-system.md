# ADR-009: Provider-Specific SVG Visual System

## Status

Proposed

## Context

[ADR-008](ADR-008-svg-first-visualization.md) established declarative SVG as the default scene renderer with a single shared visual language (`src/engines/visualization/svg/svg-tokens.ts`) and kept React Flow as a lazy opt-in for graph-interaction scenes. Under that system, every node in topology scenes (`src/engines/visualization/svg/svg-primitives.tsx`), sequence scenes (`src/engines/visualization/svg/svg-sequence-scene.tsx`), the node inspector (`src/engines/visualization/component-inspector.tsx`), and the lazy React Flow view (`src/engines/visualization/react-flow-scene.tsx`) renders a generic monochrome Lucide icon mapped from `ScenePrimitive` in `src/engines/visualization/primitives.tsx`.

Generic primitives work well for concept-first architecture lessons where the goal is teaching an abstract pattern rather than a specific product. However, as Engineering Atlas has expanded across Cloud Fundamentals (Azure and AWS implementations) and Kubernetes Fundamentals (20 categories across Slices 3A–3D), generic icons have clear pedagogical limits when teaching concrete infrastructure components:

- A diagram of Azure RBAC scopes, an Azure Managed Identity flow, an AWS EC2-to-S3 IAM role sequence, or a Kubernetes CSI provisioning flow renders every cloud service and Kubernetes resource with the same abstract symbols (`server`, `storage`, `key`, `identity`, `scope`).
- Learners studying real-world cloud and Kubernetes architectures benefit from recognizing official service and resource iconography (for example, distinguishing Amazon S3 from Azure Blob Storage in a comparison scene, or recognizing Kubernetes Pods, Services, PVCs, and Ingresses in cluster diagrams) without losing the structural clarity of the existing SVG visual language.

Any solution must preserve ADR-008's invariants: declarative SVG remains the default, structural chrome stays themeable across light and dark modes, accessibility and keyboard navigation remain intact, bundle size stays disciplined ([ADR-007](ADR-007-per-concept-content-loading.md)), and the simulation engine remains completely decoupled from visual rendering.

## Decision

Introduce a **centralized, curated, provider-specific SVG visual system** layered on top of ADR-008's declarative SVG engine, driven by a strict scene-level `visualContext`, qualified node asset identifiers, a minimal runtime asset registry backed by external non-inlined SVG files (`?url&no-inline`), a pure visual resolver, and deterministic generic fallback at both resolution and runtime load boundaries.

This ADR extends [ADR-008](ADR-008-svg-first-visualization.md) and [docs/SVG_VISUALIZATION_STANDARD.md](../SVG_VISUALIZATION_STANDARD.md) without superseding either. Existing scenes without a `visualContext` continue to render identically using generic primitives.

### 1. Design Principles

1. **Generic concepts stay generic.** Concept-oriented lessons continue using the existing generic SVG primitives (`ScenePrimitive` + Lucide icons).
2. **Official provider icons are visual identity, not architectural semantics.** Connections, boundaries, grouping, statuses, and mandatory text labels explain architecture; icons never replace semantic labels.
3. **AWS-specific scenes use official AWS iconography** (subject to independent licensing clearance).
4. **Azure-specific scenes use official Azure iconography** (subject to independent licensing clearance).
5. **Kubernetes-specific scenes use official Kubernetes iconography** (subject to independent licensing clearance).
6. **Comparison scenes may combine visual systems.** Multi-provider or cross-platform comparison scenes may opt into a `mixed` visual context combining two or more provider visual systems.
7. **Lesson metadata alone does not choose the visual system.** Being located inside a provider tab or the Kubernetes domain does not automatically switch a scene away from generic primitives.
8. **Visual selection reflects the diagram's actual subject.** Authors declare a visual system only when the diagram depicts concrete services or resources from that system.
9. **Generic fallback is always available.** Every node retains its required semantic `ScenePrimitive` type so generic rendering remains available whenever an official asset is omitted, unverified, deferred, or fails to load at runtime.

**Illustrative examples:**

- An AWS lesson explaining general TLS handshake mechanics retains `generic` icons.
- A Kubernetes lesson explaining a general architectural pattern (such as replication vs. backup tradeoffs) retains `generic` icons.
- An AWS IAM role sequence diagram uses official AWS service icons (e.g., EC2, STS, S3) where verified, while keeping link-local IMDS generic.
- A comparison scene contrasting Amazon S3 and Azure Blob Storage uses a `mixed` visual context combining official AWS and Azure icons.

### 2. Scene and Node Type Model

Extend `src/engines/visualization/types.ts` with backward-compatible, optional visual-system fields designed so invalid scene contexts are unrepresentable and node metadata is never duplicated:

```ts
export type ProviderVisualSystem = 'aws' | 'azure' | 'kubernetes';
export type VisualSystem = 'generic' | ProviderVisualSystem;

/**
 * Strict discriminated union. Invalid combinations (such as a single provider
 * paired with a conflicting `systems` list, or `mixed` with fewer than two
 * provider systems) are rejected by TypeScript.
 */
export type VisualContext =
  | { readonly system: 'generic' }
  | { readonly system: ProviderVisualSystem }
  | {
      readonly system: 'mixed';
      readonly systems: readonly [
        ProviderVisualSystem,
        ProviderVisualSystem,
        ...ProviderVisualSystem[],
      ];
    };

/**
 * Qualified `<provider>:<asset-name>` identifier. In implementation,
 * `ComponentAssetId` is derived from the curated keys of the runtime asset
 * registry (constrained to `${ProviderVisualSystem}:${string}`).
 */
export type QualifiedAssetId = `${ProviderVisualSystem}:${string}`;
```

- **`SceneDefinition`** gains an optional `visualContext?: VisualContext`. When omitted, the scene defaults to `{ system: 'generic' }`, keeping all existing scene modules 100% backward-compatible with zero changes required.
- **`SceneNode`** retains its required semantic `type: ScenePrimitive` and gains a single optional property:

```ts
export interface SceneNode {
  id: string;
  type: ScenePrimitive;
  label: string;
  position: { x: number; y: number };
  data: Record<string, string | number | boolean>;
  status?: 'active' | 'inactive' | 'error';
  /** Optional official asset ID; omit to render the generic ScenePrimitive. */
  asset?: ComponentAssetId;
}
```

- **No node-level `visualSystem` field.** A node's visual system is deterministically derived from the prefix of its qualified `asset` identifier (`'aws:s3'` → `'aws'`, `'azure:key-vault'` → `'azure'`, `'kubernetes:pod'` → `'kubernetes'`). Omitting `asset` unambiguously selects the generic `ScenePrimitive` icon — generic actors (such as `User`, `Client`, or `IMDS`) do not need an extra flag to remain generic inside a provider scene.
- **`SceneState.nodeOverrides` excludes `asset`.** `SceneState['nodeOverrides']` remains `Record<string, Partial<Pick<SceneNode, 'status' | 'data' | 'label'>>>`. Component identity does not morph across timeline steps.
- **Compile-time vs. test-time validation:**
  - `VisualContext` (discriminated union) and `ComponentAssetId` (derived from registered asset keys via `keyof typeof ASSET_REGISTRY`) give immediate compile-time checks for valid context shapes and valid asset IDs without altering `SceneDefinition`'s non-generic consumer signature across `resolveSceneAtState`, `SvgNode`, `ComponentInspector`, and existing scene modules.
  - Compile-time cross-checking between `scene.visualContext` and `node.asset` prefixes is a desirable authoring goal (for example, via a small optional authoring helper if it proves ergonomic without complicating existing callers), **without** over-engineering generic parameters onto `SceneDefinition`.
  - Cross-field invariants — including verifying that every `node.asset` prefix is permitted by `scene.visualContext` and that `mixed.systems` contains at least two *distinct* provider systems — are enforced uniformly across all scenes by a pure validator (`validateSceneVisuals`) executed in automated tests.

### 3. Curated Asset Registry and Vite Bundling

Maintain a small, curated asset collection with strict separation between **runtime rendering data** and **governance/provenance documentation**. Do not vendor entire upstream icon libraries and do not introduce a complex asset-loading framework prematurely.

**Proposed directory layout:**

```text
src/engines/visualization/
  assets/
    MANIFEST.json
    ATTRIBUTIONS.md
    aws/
    azure/
    kubernetes/
  asset-registry.ts
  visual-resolver.ts
```

**Runtime vs. provenance separation:**

- **`asset-registry.ts` (runtime — minimal):** Maps each `ComponentAssetId` to only what the browser needs to render:
  - `url`: statically imported via Vite **`?url&no-inline`** (e.g. `import awsS3Url from './assets/aws/s3.svg?url&no-inline'`).
  - `opticalInset?`: optional bounded inset (`0 | 1 | 2` px) to optically normalize full-bleed square icons against silhouetted icons inside the fixed icon slot without modifying the vendor SVG.
  - `darkBackdrop?`: optional override (`'default' | 'none'`) when an icon explicitly opts out of the uniform dark-mode icon container.
  - The owning `ProviderVisualSystem` is derived from the `<provider>:` key prefix, never duplicated as a separate mutable property.
  - Legal notices, source filenames, and upstream package versions do **not** live in `asset-registry.ts`, keeping audit strings out of the client JS bundle.
- **`assets/MANIFEST.json` (source of truth for provenance — test/audit only, never imported by runtime app code):** Maps each `ComponentAssetId` to its committed file path, upstream package name, pinned package version/tag/commit SHA, verbatim upstream filename, license/terms reference, and verification date.
- **`assets/ATTRIBUTIONS.md` (human-readable legal notices):** One concise section per upstream icon package (AWS, Azure, Kubernetes) containing required trademark notices, attribution text, and links to upstream license/brand terms.

**Why `?url&no-inline` is mandatory:**

[vite.config.ts](../../vite.config.ts) uses Vite's default `build.assetsInlineLimit` (`4096` bytes). Most Kubernetes SVGs (0.8–3 KB) and many AWS/Azure SVGs (1.5–4 KB) are smaller than 4 KB. Plain `?url` imports would silently inline them as `data:image/svg+xml` strings inside the shared Lesson JS chunk, and a central lookup map prevents tree-shaking. Using `?url&no-inline` forces Vite to emit content-hashed `.svg` files into `dist/assets/` so the shared Lesson chunk stores only short hashed URL strings and browsers fetch only the icons rendered by the active scene.

**Automated parity checks:**

An automated Vitest test enforces 1:1 parity across:
1. Every key in `asset-registry.ts`,
2. Every entry in `assets/MANIFEST.json`, and
3. Every committed `.svg` file under `src/engines/visualization/assets/`.

Only assets referenced by approved scenes are committed; unused assets are not added speculatively.

### 4. Asset Rendering Strategy and Runtime Fallback (Proposed — Pending Implementation Validation)

Vendor SVGs remain **external static asset files** rather than inlined DOM markup:

- **SVG topology and sequence scenes:** Render resolved official assets with `<image href={resolved.url} width={...} height={...} preserveAspectRatio="xMidYMid meet" aria-hidden="true" />` inside a small fallback wrapper (`SvgAssetIcon`) using integer coordinates inside the node's icon slot.
- **HTML surfaces (`ComponentInspector` and `ReactFlowScene`):** Render resolved official assets with `<img src={resolved.url} alt="" aria-hidden="true" decoding="async" />` inside a matching fallback wrapper (`HtmlAssetIcon`).

**Key rendering requirements:**

- **Isolation from SVG DOM collisions and theme-token compliance:** Vendor SVGs frequently reuse generic internal IDs (`#a`, `#linear-gradient`, `#clip0`) and class names (`.cls-1`), and embed hardcoded `#hex` brand fills. External `<image href>` and `<img>` isolate each vendor SVG in its own document context, preventing cross-icon gradient/clip corruption and preserving the existing `svg-scene.test.tsx` invariant that host SVG chrome contains zero hardcoded `#hex` fill/stroke values.
- **Runtime `onError` fallback:** Resolver-level fallback catches omitted or unregistered asset IDs, while `onError` handlers on `<image>` and `<img>` catch runtime fetch or decode failures (such as network drops or stale deployment chunks) and cleanly fall back to the node's generic Lucide `ScenePrimitive` icon rather than leaving an empty box or broken image icon.
- **Consistent dark-mode icon container:** Dark mode (`src/styles/globals.css`) sets `--color-surface` to `#0a0a0a`. Rather than scattering ad-hoc white chips behind individual assets, render a **uniform, theme-tokenized icon container** (defined via CSS token in `globals.css` / `svg-tokens.ts` — subtle/transparent in light mode, soft neutral elevated tile in dark mode) behind official icons so dark-stroke vendor artwork remains legible and adjacent icons share a cohesive visual rhythm.
- **Optical sizing normalization:** Official AWS icons are typically full-bleed colored squares, whereas Azure and Kubernetes icons are irregular silhouettes with varying internal margins. Bounding optional `opticalInset` (`0–2 px`) inside the fixed icon slot balances visual weight across providers in `mixed` scenes without altering any vendor SVG file.
- **Vercel asset paths, SPA rewrites, and immutable caching:** Content-hashed `.svg` files emitted to `dist/assets/` are served directly from the filesystem by Vercel with long-lived immutable browser caching. Note that `vercel.json` currently uses a catch-all rewrite (`"/(.*)" -> "/index.html"`). During implementation (not in this ADR task), `vercel.json` should be reviewed so missing `/assets/*` requests return a real `404` instead of `200 text/html` — ensuring stale-chunk misses trigger `onError` fallback reliably — and explicit `Cache-Control: public, max-age=31536000, immutable` headers on `/assets/*` should be verified.

This rendering strategy remains **proposed until validated** in real browsers and production builds before ADR acceptance or pilot rollout.

### 5. Centralized Visual Resolver

All visual resolution flows through a single pure function in `src/engines/visualization/visual-resolver.ts`:

```ts
resolveNodeVisual(
  node: Pick<SceneNode, 'type' | 'asset'>,
  visualContext?: VisualContext,
): ResolvedNodeVisual
```

**Expected behavior:**

1. **Generic context resolves to generic primitives.** When `visualContext` is omitted or `{ system: 'generic' }`, nodes resolve to their generic `ScenePrimitive` Lucide icon.
2. **Matching official assets resolve to registry entries.** When `node.asset` is present, registered, and its `<provider>:` prefix is permitted by `visualContext`, the resolver returns the registered asset entry (URL + optional optical/backdrop hints) alongside the fallback `ScenePrimitive`.
3. **Missing or unknown assets fall back deterministically.** When `node.asset` is omitted or not present in the registry, the resolver returns the generic `ScenePrimitive` without throwing.
4. **Incompatible asset/context pairs fail validation and fall back safely.** `validateSceneVisuals(scene)` rejects any scene where a node's `asset` prefix does not match `scene.visualContext` (or where `mixed.systems` has duplicate/insufficient providers). If reached defensively at runtime, `resolveNodeVisual` falls back to generic rather than rendering a mismatched icon.
5. **Mixed scenes allow declared provider systems.** When `visualContext.system === 'mixed'`, nodes may resolve registered assets from any provider listed in `visualContext.systems`.
6. **Generic actors remain generic inside provider scenes.** Any node omitting `asset` resolves to its generic `ScenePrimitive` icon alongside official provider nodes.

Renderers must consume `ResolvedNodeVisual` from `resolveNodeVisual` rather than scattering provider conditionals across components.

### 6. Layout Geometry, Status Semantics, and Integration Boundaries

Integrating official icons introduces two concrete UI/layout requirements identified in the existing codebase:

1. **Preserve generic geometry; add a dedicated provider-icon slot:**
   - Keep `GEOMETRY.iconSize = 15` (`src/engines/visualization/svg/svg-tokens.ts`) unchanged for generic Lucide nodes so zero existing generic scenes shift or regress.
   - Define a dedicated provider-icon slot (e.g., `20×20` glyph inside a `24×24` container) for nodes rendering an official asset, accounted for in `svg-layout.ts` / `nodeWidth()` so edges clip cleanly to node borders and labels never collide.
   - Update `SvgSequenceScene` (`src/engines/visualization/svg/svg-sequence-scene.tsx`), which currently hardcodes `ACTOR_W = 150`, `ACTOR_H = 40`, `14×14` icons, and `x + 8` centered text. Actor header width/height and text alignment must accommodate the provider-icon slot so wrapped two-line labels (such as `"Instance Metadata Service"` and `"Instance metadata (IMDSv2)"`) never overlap the icon.
2. **Non-`currentColor` status indicators:**
   - External `<image>` icons cannot inherit `currentColor`, so Lucide `style.icon` tinting no longer conveys status (`active`, `inactive`, `error`) on official-icon nodes.
   - Both `SvgNode` and `SvgSequenceScene` must convey status through non-icon signals: node border/fill tokens, `nodeOpacity(status)` for `inactive`, and a consistent status indicator badge/dot for `active` and `error` (bringing `SvgSequenceScene` up to parity with `SvgNode`), keeping color paired with distinct shape/border cues.

**Module touchpoints:**

| File | Current responsibility | Proposed touchpoint |
|---|---|---|
| `src/engines/visualization/types.ts` | `SceneDefinition`, `SceneNode`, `ScenePrimitive`, `resolveSceneAtState` | Add `ProviderVisualSystem`, `VisualSystem`, discriminated `VisualContext`, `QualifiedAssetId` / `ComponentAssetId`, optional `SceneDefinition.visualContext`, optional `SceneNode.asset`. Keep `SceneState.nodeOverrides` unchanged. |
| `src/engines/visualization/svg/svg-tokens.ts` & `svg-layout.ts` | Generic `GEOMETRY.iconSize = 15`, `nodeWidth()`, edge clipping, boundaries | Preserve generic geometry; add provider-icon slot metrics and dark-mode icon container token. |
| `src/engines/visualization/svg/svg-primitives.tsx` | `SvgNode`, `SvgEdge`, `SvgBoundary` | Render `SvgAssetIcon` (`<image href>` + `onError` fallback + uniform container) for resolved official assets; ensure status indicators do not rely on icon tinting. |
| `src/engines/visualization/svg/svg-topology-scene.tsx` | Computes layout and renders `SvgNode` | Pass `scene.visualContext` (or pre-resolved visuals) into layout and `SvgNode`. |
| `src/engines/visualization/svg/svg-sequence-scene.tsx` | Sequence actor headers, lifelines, messages, boundaries | Resolve actor visuals via `resolveNodeVisual`, update actor header geometry for provider-icon slots, and add status dot + `nodeOpacity` parity. |
| `src/engines/visualization/visualization-region.tsx` & `component-inspector.tsx` | Selected node header, status, data fields, connections | Pass optional `visualContext` from `VisualizationRegion` to `ComponentInspector`; render `HtmlAssetIcon` (`<img>` + `onError` fallback) matching the canvas. |
| `src/engines/visualization/react-flow-scene.tsx` | Lazy-loaded HTML node/edge renderer (`interaction: 'graph'`) | Resolve node visuals via `resolveNodeVisual` and render `HtmlAssetIcon` inside `PrimitiveNode`. |
| `src/engines/visualization/scene-renderer.tsx` | Dispatches static SVG vs. lazy React Flow | Preserve existing `SceneRendererProps` dispatch contract; zero provider-specific branching here. |
| `src/engines/visualization/svg/svg-legend.tsx` | Renders flows, statuses, boundaries legend | **Unchanged** unless future implementation evidence demonstrates a concrete requirement; node text labels remain mandatory. |

**Explicitly preserved invariants:**

- Backward compatibility for all existing `SceneDefinition` modules.
- Topology and sequence scene semantics (including `edges.length + 1` sequence state arity).
- Node selection, `ComponentInspector` connection derivation, and timeline stepping (`TimelineController`).
- Keyboard navigation (`Tab`, `Enter`, `Space`), visible focus rings distinct from selection borders, and SVG `<title>`/`<desc>` accessibility.
- **Zero changes to the simulation engine** (`src/engines/simulation/`) or simulation lab bindings.

### 7. Asset Governance and Independent Provider Adoption Policy

Candidate upstream sources to evaluate before adding any file:

- **AWS:** Official AWS Architecture Icons package.
- **Azure:** Official Microsoft Azure Architecture Icons package.
- **Kubernetes:** Official Kubernetes community icon repository (`kubernetes/community/icons`).

**Mandatory pre-addition verification gate** — before any asset is committed, implementation must verify and record in `MANIFEST.json` and `ATTRIBUTIONS.md`:

1. Authentic official upstream source URL.
2. Exact package release version, tag, or commit SHA.
3. Applicable license or terms of use and mandatory attribution text.
4. Brand, trademark, and visual usage guidelines (clear-space, color preservation, non-endorsement).
5. Explicit confirmation that redistributing unmodified SVG files inside this repository and its built frontend bundle is permitted under those terms.

*Note:* AWS Architecture Icons and Microsoft Azure Architecture Icons are distributed under vendor brand/usage terms rather than standard OSI open-source licenses, and Kubernetes community icons are subject to both repository licensing and CNCF trademark guidelines. This ADR makes **no legal conclusion**; each provider's terms must be verified against the exact downloaded package before any file is added.

**Independent per-provider adoption policy:**

Each provider visual system (`aws`, `azure`, `kubernetes`) is cleared and adopted **independently**. If a provider's license or redistribution terms cannot be verified:

1. **Defer that provider** — do not commit any of its SVG assets.
2. **Keep its scenes generic** — all scenes for that provider continue using generic `ScenePrimitive` icons cleanly.
3. **Do not block other independently cleared providers** — cleared providers (for example, Kubernetes or another verified package) may proceed independently.
4. **Never hotlink third-party assets** — do not work around redistribution limits by loading vendor SVGs from remote URLs or CDNs (violates [ADR-001](ADR-001-frontend-only.md)).

**Strict artwork rules:**

- Do **not** assume every file in an upstream repository carries identical licensing terms.
- Do **not** modify vendor SVG artwork (paths, colors, proportions) and do **not** misrepresent third-party products or imply vendor endorsement.

### 8. Performance and Scalability Expectations

- **Initial bundle impact:** With `?url&no-inline`, vendor SVG bodies never enter the shared Lesson JS chunk. Each registered entry contributes only a small hashed URL string and optional layout hint (~50–80 bytes raw). At 100–200 curated icons, total registry overhead in the Lesson chunk remains roughly 5–15 KB raw (~2–4 KB gzip).
- **Network requests and caching:** Unused icons trigger **zero** network requests. Opening a migrated scene fetches only the unique SVGs rendered by that scene (typically 3–8 small files, 1–5 KB each, multiplexed over HTTP/2 and cached immutably by content hash).
- **SVG rendering and React re-renders:** `resolveNodeVisual` is an `O(1)` map lookup; external `<image>` nodes add no inline `<path>`/`<defs>` DOM trees to the SVG, keeping DOM size and React reconciliation costs flat.
- **Threshold for future registry splitting:** Do **not** build a dynamic asset-loading framework upfront. Revisit splitting `asset-registry.ts` into per-provider dynamic loaders only if measured growth crosses a concrete threshold — specifically, **>200 registered assets** or **>15 KB raw registry overhead** in the shared Lesson chunk.

## Consequences

### Benefits

- Concrete cloud and Kubernetes diagrams become immediately recognizable to practicing engineers while retaining Engineering Atlas's clean, themeable diagram chrome and mandatory text labels.
- Concept-first generic lessons remain uncluttered and visually distinct from provider-specific architecture scenes.
- A strict discriminated `VisualContext` and prefix-derived `ComponentAssetId` eliminate redundant node fields and illegal context states.
- `?url&no-inline` prevents silent data-URI bundle bloat in the shared Lesson chunk while enabling immutable browser caching.
- Independent per-provider licensing clearance ensures a licensing block on one vendor never stalls the entire initiative.
- Separating runtime registry data from `MANIFEST.json` and `ATTRIBUTIONS.md` avoids triple maintenance and keeps legal provenance strings out of client JS.

### Trade-offs

- **Geometry maintenance:** Supporting a larger provider-icon slot alongside `15 px` generic icons adds a conditional geometry path in `svg-layout.ts` and requires updating `SvgSequenceScene` actor header sizing plus fixing existing tight coordinates (such as `rbacScopeScene`).
- **Status signaling:** Losing `currentColor` icon tinting on official assets requires explicit non-tint status indicators across both topology and sequence renderers.
- **Runtime fetch surface:** External `.svg` files introduce a network load boundary (mitigated by `onError` fallback and Vite content hashing) and require static disk/build tests since jsdom does not decode `<image>` URLs.
- **Catalog curation overhead:** Official cloud icon sets evolve over time; updating pinned releases requires re-verifying `MANIFEST.json` and visual contrast.

### Mitigations

- Enforce registry/manifest/disk 1:1 parity, SVG XML security validation, non-inlining build checks, and cross-domain scene validation (including Kubernetes Slices 3A–3D) in CI.
- Keep `ScenePrimitive` mandatory and pair resolver fallback with runtime `onError` fallback so a missing or failed icon never breaks a lesson.
- Roll out selectively in small, independently reviewable slices.

## Alternatives Considered

### 1. Keep generic monochrome Lucide icons everywhere (status quo)

Continue representing all AWS, Azure, and Kubernetes services with the 19 generic `ScenePrimitive` icons in `src/engines/visualization/primitives.tsx`.

- **Cost:** Zero new assets, zero licensing review, uniform monochrome theming.
- **Why not preferred:** Fails to build visual pattern recognition for real infrastructure services, especially in provider-specific IAM/storage flows and AWS vs. Azure comparisons where identical generic symbols obscure concrete resource distinctions.

### 2. Inline vendor SVGs into the main SVG DOM (SVGR / JSX components)

Convert vendor SVGs into React components and render their `<path>`/`<defs>` elements directly inside the host `<svg>`.

- **Cost:** Avoids external asset requests and renders inline DOM in jsdom.
- **Why not preferred:** High risk of internal SVG `id` (`#a`, `#grad-1`), `<clipPath>`, and `.cls-*` collisions across icons in the same diagram; injects hardcoded `#hex` fills into the host SVG DOM (breaking the `svg-scene.test.tsx` token invariant); increases JS bundle size; and risks violating vendor brand rules against modifying SVG markup.

### 3. Runtime CDN or untyped `public/` URL lookup

Load official icons from remote vendor URLs/CDNs or unverified string paths under `public/`.

- **Cost:** Keeps assets outside Vite's module graph.
- **Why not preferred:** Remote CDNs violate [ADR-001](ADR-001-frontend-only.md) (offline/self-contained frontend) and fail behind restricted networks. Untyped `public/` strings bypass TypeScript existence checks and Vite content hashing, risking silent broken images and stale browser caches.

### 4. Dynamic per-provider asset-loading framework upfront

Build an async registry loader that fetches per-provider manifests/chunks on demand before rendering a scene.

- **Cost:** Avoids even ~5–15 KB of URL map strings in the shared Lesson chunk.
- **Why not preferred:** Introduces async loading states, flash-of-fallback-icon jitter, and unnecessary state complexity when `?url&no-inline` already keeps SVG payloads out of JS. Deferred unless the catalog crosses the measured threshold (>200 assets or >15 KB raw registry overhead).

## Migration Strategy and Compatibility

All schema additions are optional and backward-compatible. No existing scene breaks when the visualization engine is updated.

### Semantic Selection Rules (All Tiers)

An official provider icon may be used on a node **only** when all four conditions hold:

1. **Exact resource match:** The icon represents the exact concrete service or resource named by the node. Never substitute a visually similar but semantically different resource (for example, do not represent an Azure Blob Container as an Azure Storage Account, or a Kubernetes Pod as a Virtual Machine).
2. **Verified rights:** The asset's upstream source, version, license, and redistribution rights have been verified and recorded in `MANIFEST.json` and `ATTRIBUTIONS.md`.
3. **Pedagogical value:** Using the official icon materially improves recognition or comprehension beyond a generic primitive.
4. **No false vendor ownership:** Using vendor iconography does not imply that a universal engineering concept or abstract actor belongs exclusively to one vendor.

Nodes that do not satisfy all four rules omit `asset` and stay on their semantic `ScenePrimitive`.

### Tier 1 — Existing Provider-Specific Scenes

Verified existing provider-specific scenes in `src/content/cloud-fundamentals/identity-and-access-management/` to evaluate first (each subject to independent provider licensing clearance and exact asset verification):

- **Azure RBAC:** `rbacScopeScene` (`id: 'azure-rbac-scope-explorer'` in `authorization-and-policies.scenes.ts`) — topology of Azure Management Group, Subscriptions, Resource Groups, Web App, SQL Database, Key Vault, and Virtual Machine.
  - *Required layout fix:* The bottom row currently places `appWeb`, `sqlOrders`, `kvProd`, and `vmTest` at `x: 0, 140, 280, 400` (`y: 390`). With `nodeMinWidth = 124`, `kvProd` (`280..404`) already overlaps `vmTest` (`400..524`) by `4 px`. Bottom-row horizontal spacing (and parent alignment) must be corrected during migration so larger provider-icon nodes have clean separation.
- **Azure Managed Identities:** `managedIdentityScene` (`id: 'azure-managed-identity-flow'` in `workload-and-federated-identity.scenes.ts`) — sequence depicting an Azure VM, Instance Metadata Service (IMDS), Microsoft Entra ID, and Key Vault.
  - `imds` represents the link-local endpoint (`169.254.169.254`), not a standalone Azure service resource, and should remain generic (`gateway`) rather than using a substituted Azure icon.
- **AWS Workload Identity / IAM Roles:** `instanceRoleScene` (`id: 'aws-instance-role-flow'` in `workload-and-federated-identity.scenes.ts`) — sequence depicting an EC2 instance, IMDSv2, AWS STS, and Amazon S3.
  - `imds` remains generic (`gateway`). `sts` uses an official AWS STS icon only if an exact verified STS asset exists in the pinned AWS package (do not silently substitute a generic IAM icon if STS is distinct).
  - *Note:* `federationScene` in the same file is provider-agnostic and remains `generic`. No dedicated AWS EKS IRSA scene currently exists in the repository.

### Tier 2 — Kubernetes-Specific Scenes

Selectively evaluate scenes across `src/content/kubernetes-fundamentals/` (`scenes.ts`, `operations-scenes.ts`, `security-scenes.ts`, `storage-scenes.ts`) using the four semantic selection rules above — never by an arbitrary percentage cutoff or merely because a scene lives in the Kubernetes domain.

- Strong candidates depict concrete Kubernetes control-plane components and API objects (for example, `clusterArchitectureScene`, `deploymentReplicaSetScene`, `serviceNetworkingScene`, `pvPvcStorageClassScene`, `ingressLifecycleScene`, `networkPolicyScene`, `rbacFlowScene`).
- Conceptual diagrams dominated by abstract lifecycle stages or patterns (for example, `apiRequestLifecycleScene`, `reconciliationLoopScene`, `replicationVsBackupScene`, `blueGreenCanaryScene`) should remain `generic`.

### Tier 3 — New Comparison Scenes (Selective)

Consider authoring targeted `mixed` comparison scenes only where side-by-side visual contrast materially improves learning and both providers are independently cleared, such as:

- Amazon EC2 vs. Azure Virtual Machines
- Amazon S3 vs. Azure Blob Storage
- Amazon VPC vs. Azure Virtual Network
- AWS Application Load Balancer vs. Azure Application Gateway

## Validation and Testing Expectations

Validation is split explicitly between **automated CI checks** and **manual visual/accessibility QA** because jsdom does not fetch, decode, or rasterize external SVG `<image>` URLs.

### Automated Testing

1. **Type compatibility:** Verify strict discriminated `VisualContext` union behavior, registry-derived `ComponentAssetId` typing, exclusion of `asset` from `SceneState.nodeOverrides`, and backward compatibility of existing scenes under `tsc -b --noEmit`.
2. **Resolver behavior:** Pure unit tests for `resolveNodeVisual` covering determinism, omitted/generic contexts, matching single-provider and `mixed` contexts, generic actors omitting `asset`, unknown asset fallback, and defensive fallback on context mismatch.
3. **Registry, manifest, and file parity:** Verify 1:1 parity across `asset-registry.ts` keys, `assets/MANIFEST.json` entries, and `.svg` files on disk, plus `<provider>:<name>` prefix validity and complete provenance fields in `MANIFEST.json`.
4. **SVG XML validity and security checks:** Node-side static tests parse every committed `.svg` file and assert well-formed XML, explicit `viewBox`, zero `<script>` elements, zero inline event-handler attributes (`on*`), and zero external `http(s)://` references.
5. **Runtime loading fallback:** Component tests for `SvgTopologyScene`, `SvgSequenceScene`, `ComponentInspector`, and `ReactFlowScene` verify `<image href>` / `<img>` rendering with `aria-hidden="true"` / `alt=""` and verify that dispatching an `error` event falls back cleanly to the generic Lucide `ScenePrimitive`.
6. **Cross-domain scene validation (including Kubernetes Slices 3A–3D):** Run `validateSceneVisuals` across every loaded concept in **both** Cloud Fundamentals and Kubernetes Fundamentals — closing the existing gap where `src/content/kubernetes-fundamentals/index.test.ts` currently validates only Slice 3D loaded scenes while skipping Slices 3A–3C.
7. **Layout and status invariants:** Unit tests confirm generic node geometry is unchanged, provider-icon slot widths/edge clipping work without overlap (including fixed `rbacScopeScene` coordinates and `SvgSequenceScene` headers), host SVG chrome retains zero hardcoded `#hex` fills/strokes, and status badges/opacity render on official-icon nodes.
8. **Vite non-inlining and production build checks:** Verify `npm run build` emits content-hashed `.svg` files under `dist/assets/` and that vendor SVG payloads are not base64/UTF-8 data-URI inlined into the shared Lesson JS chunk.

### Manual QA

1. **Light and dark mode:** Visually inspect every migrated official asset in both themes to confirm contrast inside the uniform dark-mode icon container without harsh clashing in light mode.
2. **Optical sizing:** Compare icon visual weight across AWS, Azure, and Kubernetes icons (especially in `mixed` scenes) and tune bounded `opticalInset` values where needed.
3. **Responsive viewports:** Verify readability, icon crispness, and horizontal scroll containment at `390×844` (mobile) and `1440×900` (desktop).
4. **Keyboard and accessibility:** Tab through migrated topology and sequence diagrams, verify visible focus rings distinct from selection borders, `Enter`/`Space` selection, `ComponentInspector` parity, and screen-reader announcements (confirming decorative icons are silent and labels remain primary).
5. **Vercel preview deployment:** Verify hashed `.svg` assets load with expected caching headers on a real Vercel preview build and confirm missing/stale `/assets/*` paths do not break fallback behavior.

## Unresolved Decisions and Prerequisites for Acceptance

This ADR remains **`Proposed`**. It must not be promoted to `Accepted` — and no vendor SVG assets or renderer changes may land — until the following prerequisites are resolved explicitly:

1. **Per-provider licensing and redistribution verification:** Complete legal/policy review of the exact AWS Architecture Icons package, Microsoft Azure Architecture Icons package, and Kubernetes community icons (`kubernetes/community/icons`). Record which providers are cleared for repository redistribution and which (if any) must be deferred under the independent adoption policy.
2. **Pinned upstream package versions and initial curated inventory:** Pin exact release versions/tags/commit SHAs in `MANIFEST.json` and finalize the exact `ComponentAssetId` list for Tier 1 (and any cleared Tier 2 pilot), confirming which nodes (such as `imds`) stay generic.
3. **Rendering strategy and Vite `?url&no-inline` validation:** Verify in a spike or pilot build that Vite 8 emits separate hashed `.svg` files for `?url&no-inline` imports (zero data-URI inlining into JS) and that SVG `<image href>` renders crisply across Chromium, Firefox, and WebKit.
4. **Geometry and dark-mode container validation:** Confirm exact provider-icon slot dimensions (`20×20` / `24×24`), updated `SvgSequenceScene` actor box sizing, and the exact CSS token for the uniform dark-mode icon container against `#0a0a0a` surfaces.
5. **Vercel rewrite and caching review:** Confirm whether `vercel.json` should exclude `/assets/*` from the SPA HTML rewrite and set explicit immutable `Cache-Control` headers as part of renderer implementation.
6. **Follow-up documentation updates:** Once accepted and implemented, update [docs/SVG_VISUALIZATION_STANDARD.md](../SVG_VISUALIZATION_STANDARD.md) and [docs/ARCHITECTURE.md](../ARCHITECTURE.md) to document `visualContext`, `asset`, and asset governance. [ADR-008](ADR-008-svg-first-visualization.md) remains `Accepted` and requires no modification.
