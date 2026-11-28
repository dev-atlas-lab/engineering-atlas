# ADR-009: Provider-Specific SVG Visual System

## Status

Proposed

## Context

[ADR-008](ADR-008-svg-first-visualization.md) established declarative SVG as the default scene renderer with a single shared visual language (`src/engines/visualization/svg/svg-tokens.ts`) and kept React Flow as a lazy opt-in for graph-interaction scenes. Under that system, every node in topology scenes (`src/engines/visualization/svg/svg-primitives.tsx`), sequence scenes (`src/engines/visualization/svg/svg-sequence-scene.tsx`), the node inspector (`src/engines/visualization/component-inspector.tsx`), and the lazy React Flow view (`src/engines/visualization/react-flow-scene.tsx`) renders a generic monochrome Lucide icon mapped from `ScenePrimitive` in `src/engines/visualization/primitives.tsx`.

Generic primitives work well for concept-first architecture lessons where the goal is teaching an abstract pattern rather than a specific product. However, as Engineering Atlas has expanded across Cloud Fundamentals (Azure and AWS implementations) and Kubernetes Fundamentals (20 categories across Slices 3A–3D), generic icons have clear pedagogical limits when teaching concrete infrastructure components:

- A diagram of Azure RBAC scopes, an Azure Managed Identity flow, an AWS EC2-to-S3 IAM role sequence, or a Kubernetes CSI provisioning flow renders every cloud service and Kubernetes resource with the same abstract symbols (`server`, `storage`, `key`, `identity`, `scope`).
- Learners studying real-world cloud and Kubernetes architectures benefit from recognizing official service and resource iconography (for example, distinguishing Amazon S3 from Azure Blob Storage in a comparison scene, or recognizing Kubernetes Pods, Services, PVCs, and Ingresses in cluster diagrams) without losing the structural clarity of the existing SVG visual language.

Any solution must preserve ADR-008's invariants: declarative SVG remains the default, structural chrome stays themeable across light and dark modes, accessibility and keyboard navigation remain intact, bundle size stays disciplined, and the simulation engine remains completely decoupled from visual rendering.

## Decision

Introduce a **centralized, curated, provider-specific SVG visual system** layered on top of ADR-008's declarative SVG engine, driven by an explicit scene `visualContext`, qualified node asset identifiers, a central asset registry, and a pure visual resolver with guaranteed generic fallback.

This ADR extends [ADR-008](ADR-008-svg-first-visualization.md) and [docs/SVG_VISUALIZATION_STANDARD.md](../SVG_VISUALIZATION_STANDARD.md) without superseding either. Existing scenes without a `visualContext` continue to render identically using generic primitives.

### 1. Design Principles

1. **Generic concepts stay generic.** Concept-oriented lessons continue using the existing generic SVG primitives (`ScenePrimitive` + Lucide icons).
2. **AWS-specific scenes use official AWS iconography.** Architecture scenes whose subject is AWS infrastructure use official AWS Architecture Icons.
3. **Azure-specific scenes use official Azure iconography.** Architecture scenes whose subject is Microsoft Azure infrastructure use official Microsoft Azure Architecture Icons.
4. **Kubernetes-specific scenes use official Kubernetes iconography.** Architecture scenes whose subject is concrete Kubernetes resources and control-plane components use official Kubernetes visual assets.
5. **Comparison scenes may combine visual systems.** Multi-provider or cross-platform comparison scenes may opt into a `mixed` visual context combining multiple official systems.
6. **Lesson metadata alone does not choose the visual system.** Being located inside a provider tab or the Kubernetes domain does not automatically switch a scene away from generic primitives.
7. **Visual selection reflects the diagram's actual subject.** Authors declare a visual system only when the diagram depicts concrete services or resources from that system.
8. **Generic fallback is always available.** Every node retains its semantic `ScenePrimitive` type so generic rendering remains available whenever an official asset is absent, omitted, or intentionally generic.

**Illustrative examples:**

- An AWS lesson explaining general TLS handshake mechanics retains `generic` icons.
- A Kubernetes lesson explaining a general architectural pattern (such as replication vs. backup tradeoffs) retains `generic` icons.
- An AWS S3 request-signing or IAM role diagram uses the appropriate official AWS service icons (e.g., EC2, STS, S3).
- A comparison scene contrasting Amazon S3 and Azure Blob Storage uses a `mixed` visual context combining official AWS and Azure icons.

### 2. Proposed Scene and Node Model

Extend `src/engines/visualization/types.ts` with backward-compatible, optional visual-system fields:

```ts
export type ConcreteVisualSystem =
  | 'generic'
  | 'aws'
  | 'azure'
  | 'kubernetes';

export type VisualSystem =
  | ConcreteVisualSystem
  | 'mixed';

export interface VisualContext {
  system: VisualSystem;
  /** Required when system === 'mixed' to declare the allowed official systems. */
  systems?: ConcreteVisualSystem[];
}
```

- `SceneDefinition` gains an optional `visualContext?: VisualContext`. When omitted, the scene defaults to `{ system: 'generic' }`, keeping all existing scenes 100% backward-compatible.
- `SceneNode` retains its required semantic `type: ScenePrimitive` and gains two optional properties:

```ts
export interface SceneNode {
  // existing fields: id, type, label, position, data, status?
  asset?: ComponentAssetId;
  visualSystem?: ConcreteVisualSystem;
}
```

- Asset identifiers use a **qualified `<system>:<name>` namespace** so collisions across providers are structurally impossible and the owning visual system is explicit:

```ts
// Illustrative examples only — not a finalized asset catalog.
export type ComponentAssetId =
  | 'aws:s3'
  | 'azure:blob-storage'
  | 'kubernetes:pod';
```

Retaining `type: ScenePrimitive` on every `SceneNode` preserves legend grouping (`primitiveRole`), semantic meaning, and deterministic generic fallback even when an official `asset` is declared.

### 3. Curated Asset Registry

Maintain a small, curated asset collection and a single typed registry module rather than vendoring entire third-party icon libraries into the repository.

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

Each entry in `asset-registry.ts` records:

- `id`: qualified `ComponentAssetId` (e.g. `'aws:s3'`).
- `visualSystem`: owning `ConcreteVisualSystem` (`'aws' | 'azure' | 'kubernetes'`).
- `assetUrl`: statically imported Vite asset reference (`?url`).
- `sourcePackage`: exact official icon package/repository name and version/release identifier.
- `sourceFilename`: verbatim filename inside the upstream package for traceability.
- `attribution`: copyright/attribution string and license identifier (referencing `ATTRIBUTIONS.md`).
- `darkModeBackdrop`: optional backdrop hint (e.g. `'none' | 'light-chip' | 'subtle-surface'`) for transparent vendor icons whose strokes or dark fills lose contrast on dark surfaces.

Only assets actually referenced by approved scenes are committed. Unused icons are not added speculatively.

### 4. Asset Rendering Strategy (Proposed — Pending Implementation Validation)

This ADR proposes keeping vendor SVGs as **external static asset files** imported via Vite `?url` rather than inlining third-party SVG markup into the main diagram DOM:

- **SVG topology and sequence scenes:** render resolved official assets with `<image href={resolved.assetUrl} width={...} height={...} preserveAspectRatio="xMidYMid meet" aria-hidden="true" />` inside the node box (with an optional backdrop `<rect>` when `darkModeBackdrop` requires contrast support).
- **HTML surfaces (`ComponentInspector` and `ReactFlowScene`):** render resolved official assets with `<img src={resolved.assetUrl} alt="" aria-hidden="true" className="..." />`, falling back to the generic Lucide icon component when resolved to `'generic'`.

**Why external asset files are preferred over inline SVG DOM injection:**

- **Isolation from ID, class, and `<defs>` collisions.** Vendor icon packages routinely contain generic internal IDs (`#a`, `#linear-gradient`, `#clip0`) and scoped `<style>` rules (`.cls-1`). Inlining multiple vendor icons into a single `<svg>` causes cross-icon gradient/clip corruption and CSS leakage across the page. External `<image href>` and `<img>` render each vendor SVG in an isolated document context.
- **Preserving brand fidelity without polluting structural chrome.** Official icons keep their original multi-color artwork intact, while structural diagram chrome (node cards, borders, selection outlines, focus rings, status indicators, edges, arrowheads, flow outcomes, and boundaries) remains controlled exclusively by `svg-tokens.ts` and theme CSS variables.
- **Light/dark theme legibility.** Transparent vendor SVGs with dark strokes or low-contrast fills can become unreadable on dark surfaces. An optional registry-declared neutral backdrop pill/chip behind the icon preserves legibility without editing vendor artwork or inverting brand colors.
- **Loading and fallback behavior.** Static Vite `?url` imports bundle locally from the same origin (zero external network fetches, honoring [ADR-001](ADR-001-frontend-only.md)), and because every node still carries `type: ScenePrimitive`, missing or unresolved assets deterministically fall back to the generic Lucide primitive.

This rendering strategy is **proposed, not yet finalized**. Implementation must validate browser rendering (`<image href>` scaling, crispness at retina/standard DPI, Vite `assetsInlineLimit` data-URI vs. emitted-file behavior, and jsdom test ergonomics) before acceptance.

### 5. Centralized Visual Resolver

All visual-system selection flows through a single pure function in `src/engines/visualization/visual-resolver.ts`:

```ts
resolveNodeVisual(
  node: Pick<SceneNode, 'type' | 'asset' | 'visualSystem'>,
  visualContext?: VisualContext,
): ResolvedNodeVisual
```

**Expected behavior:**

1. **Generic context resolves to generic primitives.** When `visualContext` is omitted or `{ system: 'generic' }`, nodes resolve to their generic `ScenePrimitive` icon.
2. **Matching official assets resolve to registry entries.** When a node declares an `asset` whose system matches the active `visualContext`, the resolver returns the registered asset metadata and URL.
3. **Missing assets fall back gracefully.** If a node omits `asset` or references an unregistered asset at runtime, the resolver deterministically falls back to the generic `ScenePrimitive` icon rather than throwing or rendering a broken image.
4. **Mismatched asset/context combinations fail validation.** Validation tests (and a dedicated pure validator helper) reject scenes where a node declares an asset incompatible with `scene.visualContext` (for example, an `aws:*` asset inside an `{ system: 'azure' }` scene, or an undeclared provider inside a `mixed` scene).
5. **Mixed scenes support multiple qualified systems.** When `visualContext.system === 'mixed'`, nodes may resolve assets from any system listed in `visualContext.systems`.
6. **Generic actors may stay generic inside provider scenes.** Actors such as `User`, `Client`, or an external CI system can omit `asset` (or explicitly set `visualSystem: 'generic'`) and render with generic primitives alongside official provider icons.

Renderers must consume `ResolvedNodeVisual` from `resolveNodeVisual` rather than scattering `if (system === 'aws')` conditionals across components.

### 6. Integration Boundaries

Implementation will evaluate and integrate across the existing visualization modules while preserving all public contracts:

| File | Current responsibility | Proposed touchpoint |
|---|---|---|
| `src/engines/visualization/types.ts` | `SceneDefinition`, `SceneNode`, `ScenePrimitive`, `resolveSceneAtState` | Add optional `VisualContext`, `ConcreteVisualSystem`, `VisualSystem`, `ComponentAssetId`, and optional `asset` / `visualSystem` on `SceneNode`. |
| `src/engines/visualization/svg/svg-primitives.tsx` | Renders `SvgNode`, `SvgEdge`, `SvgBoundary` | Render `<image href>` (plus optional contrast backdrop) when `resolveNodeVisual` returns an official asset; otherwise render existing Lucide primitive. |
| `src/engines/visualization/svg/svg-topology-scene.tsx` | Computes topology layout and renders `SvgNode` | Pass `scene.visualContext` (or pre-resolved node visuals) to `SvgNode`. |
| `src/engines/visualization/svg/svg-sequence-scene.tsx` | Renders sequence actor headers, lifelines, messages, boundaries | Resolve each actor icon through `resolveNodeVisual` and render `<image href>` or Lucide fallback at sequence header icon geometry. |
| `src/engines/visualization/component-inspector.tsx` & `visualization-region.tsx` | Renders selected node header, status, data fields, connections | Pass `scene.visualContext` from `VisualizationRegion` to `ComponentInspector`; render `<img>` for official assets or Lucide fallback so inspector iconography matches the canvas. |
| `src/engines/visualization/react-flow-scene.tsx` | Lazy-loaded HTML node/edge renderer for `interaction: 'graph'` | Resolve node visual via `resolveNodeVisual` and render `<img>` or Lucide fallback inside `PrimitiveNode`. |
| `src/engines/visualization/scene-renderer.tsx` | Dispatches static SVG vs. lazy React Flow | Preserve existing dispatch contract (`SceneRendererProps`); no provider-specific branching here. |
| `src/engines/visualization/svg/svg-tokens.ts` & `svg-layout.ts` | Node geometry (`GEOMETRY.iconSize` = 15px in topology; 14px in sequence), padding, width calculation | Evaluate whether official icons need slightly larger icon box sizing (e.g. 18–20px) for legibility without breaking existing scene layouts. |

**Explicitly preserved invariants:**

- Backward compatibility for all existing `SceneDefinition` modules (no required field changes).
- Topology and sequence scene semantics (including `edges.length + 1` sequence state arity).
- Node selection, `ComponentInspector` connection derivation, and timeline stepping (`TimelineController`).
- Keyboard navigation (`Tab`, `Enter`, `Space`), visible focus rings distinct from selection borders, and SVG `<title>`/`<desc>` accessibility.
- **Zero changes to the simulation engine** (`src/engines/simulation/`) or simulation lab bindings.

### 7. Asset Governance and Licensing

Candidate upstream sources to evaluate before adding any file:

- **AWS:** Official AWS Architecture Icons package.
- **Azure:** Official Microsoft Azure Architecture Icons package.
- **Kubernetes:** Official Kubernetes community icon repository (`kubernetes/community/icons`).

**Mandatory pre-addition verification gate** — before any asset is committed to the repository, implementation must verify and document:

1. Authentic official upstream source URL.
2. Exact package release version, tag, or commit SHA.
3. License terms and mandatory attribution text.
4. Brand, trademark, and visual usage guidelines (including clear-space, color preservation, and non-endorsement rules).
5. Explicit confirmation that redistributing the SVG files inside a public/open repository and frontend bundle is permitted.

**Governance artifacts required in `src/engines/visualization/assets/`:**

- `MANIFEST.json` — machine-readable inventory mapping each committed asset path and `ComponentAssetId` to its upstream package version, original filename, license, and verification date.
- `ATTRIBUTIONS.md` — human-readable trademark notices, license texts/links, and provider attribution statements.

**Strict governance rules:**

- Do **not** assume every file in an upstream repository carries the same license; verify per-package and per-asset terms.
- Do **not** modify vendor SVG artwork (paths, colors, proportions) and do **not** misrepresent third-party products or imply official endorsement.

## Consequences

### Benefits

- Concrete cloud and Kubernetes diagrams become immediately recognizable to practicing engineers while retaining Engineering Atlas's clean, consistent diagram chrome.
- Concept-first generic lessons stay visually uncluttered and distinct from provider-specific architecture scenes.
- A single registry and pure resolver prevent ad-hoc icon imports, duplicated conditionals, and provider drift across SVG topology, SVG sequence, inspector, and React Flow surfaces.
- Keeping vendor SVGs as external curated assets prevents SVG DOM ID/style collisions and avoids bloating the repository or bundle with thousands of unused icons.
- Governance artifacts (`MANIFEST.json`, `ATTRIBUTIONS.md`) make license compliance auditable in code review.

### Trade-offs

- **Geometry tension:** Current SVG nodes allocate 15×15 px (`svg-tokens.ts`) in topology scenes and 14×14 px in sequence actor headers (`svg-sequence-scene.tsx`). Detailed multi-color provider icons may lose legibility at 14–15 px, potentially requiring careful geometry tuning during implementation.
- **Theme contrast complexity:** Multi-color vendor icons cannot inherit `currentColor` like monochrome Lucide icons; dark-mode legibility depends on explicit backdrop metadata and visual QA.
- **Maintenance surface:** Official cloud icon sets evolve periodically; keeping the catalog curated reduces churn, but updates still require manual verification against `MANIFEST.json`.
- **Two-part authoring model:** Provider scenes require declaring both `visualContext` and per-node `asset` IDs (validated by tests), adding a small authoring step over generic scenes.

### Mitigations

- Enforce registry integrity, `MANIFEST.json` parity, and `visualContext`–`asset` compatibility via automated Vitest checks.
- Keep `ScenePrimitive` mandatory on every node so generic fallback is always deterministic and zero-crash.
- Migrate scenes selectively in tiers rather than rewriting existing scenes wholesale.
- Validate light/dark contrast and icon legibility on real viewports before promoting the initiative past pilot scenes.

## Alternatives Considered

### 1. Keep generic monochrome Lucide icons everywhere (status quo)

Continue representing all AWS, Azure, and Kubernetes services with the 19 generic `ScenePrimitive` icons in `src/engines/visualization/primitives.tsx`.

- **Cost:** Zero new assets, zero licensing review, and uniform monochrome theming.
- **Why not preferred:** Fails to build visual pattern recognition for real infrastructure services, particularly in provider-specific identity/storage flows and side-by-side AWS vs. Azure comparisons where identical generic icons obscure architectural distinctions.

### 2. Inline vendor SVGs directly into the main SVG DOM (or wrap as JSX components)

Import vendor SVGs as React components (e.g., via SVGR or manual TSX conversion) and render their `<path>`/`<defs>` elements directly inside the host `<svg>`.

- **Cost:** Avoids `<image href>` indirection and theoretically permits CSS targeting.
- **Why not preferred:** Introduces high risk of internal SVG `id` (`#a`, `#grad-1`), `<clipPath>`, and `<style>` class collisions across multiple icons in the same SVG; risks violating vendor trademark rules against altering artwork; adds a build plugin or manual conversion step; and increases JS bundle overhead compared to static asset references.

### 3. Runtime URL or CDN lookup instead of compile-time Vite imports

Load official icons at runtime from a remote CDN or an unverified `public/` string path.

- **Cost:** Keeps asset paths out of the TypeScript module graph.
- **Why not preferred:** Remote CDNs violate Engineering Atlas's self-contained, same-origin frontend posture ([ADR-001](ADR-001-frontend-only.md)) and create broken-diagram failure modes offline or behind corporate proxies. Untyped `public/` strings bypass Vite hashing and TypeScript existence checks, allowing broken asset links to ship silently.

### 4. Scattered provider conditionals in renderers instead of a central registry and resolver

Let each renderer (`SvgNode`, `SvgSequenceScene`, `ComponentInspector`, `ReactFlowScene`) inspect provider fields or import icons directly.

- **Cost:** Appears faster for the first single scene.
- **Why not preferred:** Duplicates fallback logic, dark-mode backdrop rules, and asset mapping across four surfaces, virtually guaranteeing visual divergence between the diagram canvas and the component inspector. A centralized registry and pure `resolveNodeVisual` function keep all four surfaces consistent and trivially unit-testable.

## Migration Strategy and Compatibility

All schema additions are optional and backward-compatible. No existing scene breaks when the engine lands. Scene adoption proceeds selectively in three tiers:

### Tier 1 — Existing Provider-Specific Scenes

Verified existing provider-specific scenes in `src/content/cloud-fundamentals/identity-and-access-management/` to evaluate first:

- **Azure RBAC:** `rbacScopeScene` (`id: 'azure-rbac-scope-explorer'` in `authorization-and-policies.scenes.ts`) — topology of Azure Management Group, Subscriptions, Resource Groups, Web App, SQL Database, Key Vault, and Virtual Machine.
- **Azure Managed Identities:** `managedIdentityScene` (`id: 'azure-managed-identity-flow'` in `workload-and-federated-identity.scenes.ts`) — sequence showing an Azure VM, IMDS, Microsoft Entra ID, and Key Vault.
- **AWS Workload Identity / IAM Roles:** `instanceRoleScene` (`id: 'aws-instance-role-flow'` in `workload-and-federated-identity.scenes.ts`) — sequence showing an EC2 instance, IMDSv2, AWS STS, and Amazon S3. *(Note: `federationScene` in the same file is provider-agnostic and stays generic; no dedicated AWS EKS IRSA scene currently exists in the repo, so future IRSA or workload-identity scenes would be evaluated when authored.)*

Each candidate's actual node list must be verified against the curated asset catalog before migration so every migrated node has an accurate official icon or an intentionally generic fallback (such as IMDS if no official icon exists).

### Tier 2 — Kubernetes-Specific Scenes

Selectively migrate scenes across `src/content/kubernetes-fundamentals/` (`scenes.ts`, `operations-scenes.ts`, `security-scenes.ts`, `storage-scenes.ts`) that depict concrete Kubernetes objects and control-plane components (for example, `clusterArchitectureScene`, `deploymentReplicaSetScene`, `serviceNetworkingScene`, `pvPvcStorageClassScene`, `ingressLifecycleScene`, `networkPolicyScene`, `rbacFlowScene`).

Do **not** migrate conceptual scenes merely because they live in the Kubernetes domain (for example, general replication vs. backup tradeoffs or abstract failure-mode diagrams where generic primitives communicate the concept more clearly).

### Tier 3 — New Comparison Scenes (Selective)

Consider authoring targeted `mixed` comparison scenes only where side-by-side visual contrast materially improves understanding, such as:

- Amazon EC2 vs. Azure Virtual Machines
- Amazon S3 vs. Azure Blob Storage
- Amazon VPC vs. Azure Virtual Network
- AWS Application Load Balancer vs. Azure Application Gateway

**Semantic accuracy rule:** Never substitute a visually similar but semantically wrong official asset. For example, do not represent an Azure Blob Container using the Azure Storage Account icon, and do not represent a Kubernetes Pod using a Virtual Machine icon. When no semantically accurate official asset exists for a specific sub-resource or abstract actor, fall back to the generic `ScenePrimitive`.

## Validation and Testing Expectations

Implementation must ship with automated tests and manual QA covering:

1. **Registry metadata and key validation:** Every registry entry has a well-formed `<system>:<name>` ID matching its `visualSystem`, complete attribution/source metadata, and a matching entry in `MANIFEST.json`.
2. **SVG asset validity:** Committed `.svg` files are valid XML/SVG, contain no `<script>` tags or external `http(s)://` references, and have an explicit `viewBox`.
3. **Deterministic resolver behavior:** Pure unit tests for `resolveNodeVisual` covering identical input → identical output across all visual systems.
4. **Context/asset compatibility:** Scene validation tests reject incompatible `asset` + `visualContext` combinations across all registered scenes.
5. **Generic fallback behavior:** Omitted `visualContext`, omitted `asset`, explicit `visualSystem: 'generic'`, and unknown asset IDs all deterministically resolve to `ScenePrimitive` fallback.
6. **Mixed-system scenes:** `visualContext: { system: 'mixed', systems: [...] }` resolves qualified assets from declared systems while rejecting undeclared systems.
7. **Icon sizing and layout geometry:** Unit tests verify node widths, icon bounds, and label alignment do not clip or overlap in topology and sequence scenes.
8. **Renderer, inspector, and React Flow integration:** Component tests verify `<image href>` in `SvgTopologyScene` and `SvgSequenceScene`, and `<img>` in `ComponentInspector` and `ReactFlowScene`, with matching fallback behavior.
9. **Keyboard and ARIA behavior:** Focus order (`Tab`), activation (`Enter`/`Space`), `aria-pressed`, `<title>`/`<desc>`, and `aria-hidden` on decorative icons remain intact.
10. **Light and dark theme visual QA:** Verify every migrated official asset (with and without dark-mode backdrop) has clear visual contrast in both themes.
11. **Responsive visual QA:** Verify layout, readability, and horizontal scroll containment at `390×844` (mobile) and `1440×900` (desktop).

## Open Questions and Future Considerations

Because this ADR is **Proposed**, the following decisions remain open and must be resolved explicitly before implementation begins:

1. **Final upstream package versions:** Which exact AWS Architecture Icons release, Microsoft Azure Architecture Icons release, and Kubernetes community icon commit/tag will be pinned in `MANIFEST.json`?
2. **Curated initial inventory:** Which exact `ComponentAssetId` entries make up the Tier 1 and Tier 2 launch set, and which nodes (e.g., IMDS, generic client/user, external CI) intentionally stay generic?
3. **Rendering strategy validation:** Does Vite `?url` + SVG `<image href>` render crisply across Chromium, Firefox, and WebKit (including under Vite's `assetsInlineLimit` data-URI vs. emitted-file behavior and in jsdom/Vitest), and should official icons use a larger icon slot than the current 14–15 px?
4. **Redistribution and trademark clearance:** Do the current license and trademark guidelines for AWS, Microsoft Azure, and Kubernetes icons all permit committing curated unmodified SVGs into this repository and serving them in the built frontend bundle? If any provider restricts redistribution, that provider's icons must be deferred or omitted.
5. **Mixed-system validation rules:** Should `visualContext.systems` be strictly required whenever `system === 'mixed'` (with at least two distinct non-generic systems), and is `'generic'` implicitly always allowed for actors inside `'mixed'` and single-provider scenes?
6. **Dark-mode treatment for transparent vendor assets:** What uniform backdrop token (e.g., a subtle light badge or surface chip from `svg-tokens.ts`) provides adequate contrast for dark-line Azure/AWS/Kubernetes icons in dark mode without clashing with light mode?
7. **Follow-up documentation updates:** Once this ADR is accepted and implemented, `docs/SVG_VISUALIZATION_STANDARD.md` and `docs/ARCHITECTURE.md` should be updated to document `visualContext`, `asset`, and governance procedures; [ADR-008](ADR-008-svg-first-visualization.md) remains `Accepted` and requires no modification.
