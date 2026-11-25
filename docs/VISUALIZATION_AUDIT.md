# Visualization Audit — Engineering Atlas

A snapshot of the visualization system as it stood at the start of the SVG-first visualization phase (after Slice 2B, commit `8f83ab7`), and the recommendations that shape it. The resulting standard is in `docs/SVG_VISUALIZATION_STANDARD.md`; the architectural decision is ADR-008.

---

## 1. How visualization works today

Two independent systems render visuals:

| System | Data model | Rendered by | Used in |
|---|---|---|---|
| **Scenes** | `SceneDefinition` (nodes, edges, states) in `*.scenes.ts` | `VisualizationRegion` → `SceneRenderer` → `ReactFlowScene` (topology) or `SequenceScene` (sequence) | Lesson pages, via `lesson.visualization` |
| **Simulation views** | A simulation's `TState`, rendered by a `renderX(state)` function in `*-view.tsx` | `SimulationLabView` (+ `TimelineController`) | Lab pages, via `bindSimulation` |

Both are loaded inside each concept's own lazy chunk (ADR-007), so no visualization code is on the Home or category path.

- **Topology scenes** (11) render through **React Flow** (`@xyflow/react`). Nodes are HTML (`PrimitiveNode`), not SVG; edges are React Flow's SVG. React Flow and its stylesheet are statically imported, so they sit in the shared lesson chunk and load for every lesson — including the 12 that only show a sequence diagram.
- **Sequence scenes** (12) render through **`SequenceScene`**, hand-authored SVG with a fixed horizontal actor layout and one message per row.
- **Simulation views** (12) are **HTML** (grids, tables, ordered lists) that render deterministic simulation state. They are information-dense and stateful by design.

Shared machinery: `resolveSceneAtState` applies a state's node/edge overrides; `TimelineController` drives the step index; `ComponentInspector` shows a selected node's data; `primitives.tsx` maps each `ScenePrimitive` to a Lucide icon.

---

## 2. Inventory

### Scenes — topology (React Flow)

| Concept | Visualization | Purpose | Interaction | A11y | Responsive | Issues | Rec. |
|---|---|---|---|---|---|---|---|
| Virtual Machines | Hypervisor allocating VMs on a host | Show the hypervisor mediating guest VMs on one host | Select node → inspector; timeline; RF pan/zoom | RF nodes keyboard-selectable; no scene `<title>`/`<desc>` | RF `fitView`; controls overlay | HTML nodes aren't SVG; RF ships to every lesson; no trust/host boundary drawn | Improve (SVG) |
| Regions and Availability Zones | Region, 3 AZs, resource scopes | Distinguish zonal, regional, zone-redundant resources; walk a zone failure | same | same | same | Zone grouping only implied by position, not a drawn boundary | Improve (SVG) |
| Data Centers and Edge Locations | Physical hierarchy behind a region | Geography → region → zone → datacenter → rack, plus edge | same | same | same | Pure hierarchy; RF graph features unused | Improve (SVG) |
| Geographic Redundancy | Primary→secondary async replication + failover | Show DNS steering and replication lag across regions | same | same | same | Region boundaries not drawn; failover state subtle | Improve (SVG) |
| Authorization and Policies | Azure RBAC scopes and inheritance | Management group → subscription → RG → resource, with inheritance and a deny assignment | same | same | same | Scope nesting shown by position only; tallest diagram (y→510) | Improve (SVG) |
| Virtual Networks | VNet with subnets, route tables, gateways | Public vs private subnet, IGW/NAT paths | same | same | same | Subnet/VNet boundaries not drawn | Improve (SVG) |
| Subnets and Routing | Public vs private access | Why a private address is not the same as secure | same | same | same | Blocked/denied paths not visually distinct from allowed | Improve (SVG) |
| Connecting Networks | Hub-and-spoke peering + transit | Non-transitive peering; hub routing | same | same | same | Boundaries/transit not drawn | Improve (SVG) |
| Network Security | Layered edge, WAF, egress firewall | Which layer handles which traffic | same | same | same | Layer boundaries implied only | Improve (SVG) |
| Security Fundamentals | One attack, several layers | Defense in depth; assume breach | same | same | same | Compromise/containment states need clearer success/fail styling | Improve (SVG) |
| Storage | Block, file, object serving three workloads | Contrast the three storage models | same | same | same | — | Improve (SVG) |

### Scenes — sequence (hand-authored SVG)

| Concept | Visualization | Purpose | Issues | Rec. |
|---|---|---|---|---|
| Serverless Functions | Request triggering a function (cold start) | Trigger → platform → instance → response | No `<title>`/`<desc>`; actor role not iconified; labels can crowd | Improve |
| Data Centers and Edge | Edge cache miss then hit | TTL caching at the edge | same | Improve |
| Identity and Authentication | Access decision lifecycle (sign-in → audit) | AuthN vs AuthZ vs audit in one request | Denied step (`l5`, `l7`) not styled as a failure | Improve |
| Identity and Authentication | OIDC single sign-on (auth code flow) | Front-channel code vs back-channel token | Front/back channel not visually distinguished | Improve |
| Workload and Federated Identity | CI/CD workload identity federation | Token exchange, no stored secret | same crowding | Improve |
| Workload and Federated Identity | Azure managed identity token flow | IMDS → Entra → Key Vault | same | Improve |
| Workload and Federated Identity | EC2 IMDSv2 role credentials | Session-token handshake | same | Improve |
| DNS and Content Delivery | Recursive DNS resolution | Root → TLD → authoritative | Longest flow; label legibility at 320px | Improve |
| Encryption and Key Management | Envelope encryption | DEK wrapped by KEK; KEK stays in the KMS | Key relationships not emphasised | Improve |
| Encryption and Key Management | Secret retrieval at runtime | Workload identity → secret store → DB; rotation | same | Improve |
| Security Monitoring | Governance loop around one change | Guardrail → detect → remediate → learn | same | Improve |
| Storage | Upload then retrieve an object | Endpoint → auth → index → data | same | Improve |

### Simulation views (HTML)

`vm-allocation`, `zone-failure`, `credential-lifecycle`, `policy-evaluation`, `rbac-scope`, `cidr`, `routing`, `control-response`, `edge-protection`, `envelope-encryption`, `secret-retrieval`, `replication`.

These render per-step simulation state as grids, tables, and ordered lists. They are dense, textual, and already synchronized to the simulation engine through `SimulationLabView`. **Recommendation: keep as HTML.** SVG would reduce legibility and add no educational value; this is the "choose the correct rendering model" case. Where a lab's concept also needs a spatial picture, the concept's lesson already carries an SVG scene (for example, Envelope Encryption, Zone Failure, and WAF each have a matching scene).

---

## 3. Classification

1. **Static conceptual illustrations** — none authored as standalone; concepts open with a scene or prose.
2. **Architecture topology diagrams** — the 11 topology scenes.
3. **Sequence and lifecycle diagrams** — the 12 sequence scenes.
4. **Data-flow diagrams** — expressed within topology scenes via `edgeType: 'data'`.
5. **Infrastructure hierarchy diagrams** — Data Centers, Regions/AZs, RBAC scopes (topology with nesting).
6. **Interactive simulation visualizations** — the 12 simulation views.
7. **Comparison diagrams** — authored as `comparisonTable` content blocks, not visualizations.

---

## 4. Cross-cutting findings

**Strengths.** One declarative scene model with state overrides; timeline and inspector already shared; deterministic simulations already separated from rendering; everything already lazy per concept.

**Gaps against the SVG-first requirements:**

1. **Topology is not SVG and is not free.** React Flow renders HTML nodes and loads for every lesson. For fixed educational diagrams its drag/connect/graph-navigation features are unused, so it is cost without benefit on the critical path.
2. **No scene-level accessible description.** Neither renderer emits `<title>`/`<desc>`, so a screen reader announces only a group label.
3. **No drawn boundaries.** Trust boundaries, network boundaries, regions, and scopes are implied by node position only — a technical-accuracy gap the brief calls out explicitly.
4. **Flow outcome is binary.** Edges are either animated or not; denied, blocked, and failed paths look like ordinary ones, blurring allow-vs-deny and authentication-vs-authorization distinctions.
5. **Inconsistent visual language.** Topology (React Flow styling) and sequence (bespoke SVG) share no node, edge, state, or colour conventions, and no legend explains them.
6. **Inspector shows attributes, not relationships.** A selected node lists its data but not what it connects to.
7. **No visualization tests.** Only Playwright browser checks touch visuals; there are no component tests for selection, keyboard access, state rendering, or theme.

---

## 5. Recommendation

Adopt an **SVG-first scene system** (ADR-008):

- A single declarative **SVG topology renderer** replaces React Flow for all current topology scenes, reusing their existing `SceneDefinition` data unchanged. It adds `<title>`/`<desc>`, drawn boundaries, keyboard-accessible focusable nodes, visible focus, explicit allow/deny/blocked/pending flow styling, and a shared legend.
- The **sequence renderer** is rebuilt on the same shared primitives and visual language, so topology and sequence diagrams read as one system.
- **React Flow is retained but lazy**, selected only by a scene opting in (`interaction: 'graph'`) for genuine graph navigation. No current scene needs it, so it leaves the eager lesson chunk — a measured bundle win — while remaining the documented choice for future drag/connect diagrams.
- **Simulation views stay HTML.** They are the correct model for dense, stateful, textual output.
- The scene model gains **optional, backward-compatible** fields — `boundaries`, edge `flow` state, and `scene.interaction` — so existing scenes render unchanged until deliberately enhanced.

No concept, lesson, route, status, or simulation changes. Per-concept lazy loading and the inspector/timeline/simulation contracts are preserved.
