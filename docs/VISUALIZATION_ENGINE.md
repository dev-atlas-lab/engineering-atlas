# Visualization Engine — Engineering Atlas

## Purpose

The visualization engine renders interactive technical diagrams that adapt to the concept being taught. It is the primary mechanism through which engineers explore and understand systems.

---

## Design Principles

1. **The visualization is the lesson.** Text supports the visual, not the other way around.
2. **Adapt to the concept.** Different concepts demand different visual representations.
3. **Explorable, not decorative.** Every visual element should be inspectable and meaningful.
4. **State-driven.** Visualizations reflect data state, not hardcoded layouts.

---

## Architecture

```
┌─────────────────────────────────────────┐
│            Scene Definition             │
│  (nodes, edges, states, annotations)    │
└───────────────┬─────────────────────────┘
                │
        ┌───────▼───────┐
        │ SceneRenderer │
        └───┬───┬───┬───┘
            │   │   │
   ┌────────┘   │   └────────┐
   ▼            ▼            ▼
SvgTopology  SvgSequence  ReactFlow
  Scene        Scene     (lazy, opt-in)
   │            │            │
   └────────┐   │   ┌────────┘
            ▼   ▼   ▼
      ┌─────────────────┐
      │ ComponentInspector│
      └─────────────────┘
      ┌─────────────────┐
      │TimelineController│
      └─────────────────┘
```

### Scene Definition

A declarative data structure that describes what to render.

```typescript
interface SceneDefinition {
  id: string;
  type: 'topology' | 'sequence' | 'structure' | 'flow' | 'timeline' | 'custom';
  nodes: SceneNode[];
  edges: SceneEdge[];
  states: SceneState[];
  annotations: SceneAnnotation[];
  initialStateId: string;
  layout?: LayoutHint;
}

interface SceneNode {
  id: string;
  type: string;            // e.g., 'server', 'database', 'loadbalancer', 'client'
  label: string;
  position?: { x: number; y: number };
  data: Record<string, unknown>;  // concept-specific data for the inspector
  style?: NodeStyle;
}

interface SceneEdge {
  id: string;
  source: string;          // node id
  target: string;          // node id
  label?: string;
  type?: 'data' | 'request' | 'response' | 'dependency' | 'network';
  animated?: boolean;
  data?: Record<string, unknown>;
}

interface SceneState {
  id: string;
  label: string;
  description: string;
  nodeOverrides: Record<string, Partial<SceneNode>>;
  edgeOverrides: Record<string, Partial<SceneEdge>>;
  annotations: string[];   // annotation ids active in this state
}

interface SceneAnnotation {
  id: string;
  text: string;
  targetNodeId?: string;
  position?: { x: number; y: number };
  type: 'info' | 'warning' | 'highlight';
}
```

### Scene Renderer

The SceneRenderer reads the scene definition and delegates to the appropriate rendering strategy. Since Slice 2C (ADR-008), **declarative SVG is the default**; see `docs/SVG_VISUALIZATION_STANDARD.md` for the full standard.

| Scene Type / flag | Renderer | Technology | Use Case |
|---|---|---|---|
| `topology` | `SvgTopologyScene` | SVG | Infrastructure, topology, hierarchy, data flow |
| `sequence` | `SvgSequenceScene` | SVG | Protocol sequences, request and lifecycle flows |
| `interaction: 'graph'` | `ReactFlowScene` (lazy) | React Flow | Only when node-dragging / graph navigation is needed |

The renderer is selected automatically from `scene.type` and the optional `scene.interaction`. Lessons do not specify rendering details. React Flow is lazy-loaded and only for `interaction: 'graph'`, so `@xyflow/react` stays out of the eager lesson chunk (no current scene uses it). The SVG renderers share one visual language and set of primitives (`src/engines/visualization/svg/`): `svg-tokens` (node/edge/flow/boundary/status conventions), `svg-layout` (pure geometry), `svg-primitives` (`SvgNode`, `SvgEdge`, `SvgBoundary`), `svg-legend`, and the two scene renderers. The `structure` / `flow` / `timeline` / `custom` types remain reserved for a future scene that an SVG topology or sequence cannot express.

### Component Inspector

When a user clicks on a node or edge, the inspector panel shows:

- Component name and type.
- Configuration details from `node.data`.
- Current state information.
- Connections to other components.
- Provider-specific details when viewing a provider implementation.

The inspector adapts its content to the node type. A "server" node shows CPU, memory, OS. A "database" node shows engine, storage, connections.

### Timeline Controller

For scenes with multiple states, the timeline controller provides:

- **Play/Pause** — Auto-advance through states.
- **Step Forward/Backward** — Move one state at a time.
- **Scrub** — Jump to any state in the sequence.
- **Connections** — Selecting a node also lists its connections (from the scene's edges) in the inspector, not only its attributes.
- **Speed control** — Adjust animation speed.
- **State label** — Show what the current state represents.

```
◀◀  ◀  ▶  ▶▶   ━━━━●━━━━━━━━━   Step 3 of 7: "Client sends SYN"
```

---

## Visual Primitives

Reusable building blocks for constructing scenes.

The identity and security primitives (`User` through `Scope`) were added in Slice 2B for the IAM and Security categories.

| Primitive | Represents | Visual |
|---|---|---|
| `Server` | Compute instance | Rounded rect with status indicator |
| `Database` | Storage system | Cylinder |
| `LoadBalancer` | Traffic distribution | Diamond or hexagon |
| `Client` | User/requester | Person or browser icon |
| `Network` | Network boundary | Dashed container |
| `Queue` | Message queue | Horizontal pipe |
| `Function` | Serverless function | Lightning bolt rect |
| `Storage` | Object/blob storage | Stacked rect |
| `Gateway` | API gateway | Shield rect |
| `Region` | Cloud region | Large container with label |
| `AvailabilityZone` | AZ | Container within region |
| `User` | Human principal | Person icon |
| `Identity` | Identity provider or token service | Fingerprint icon |
| `Key` | Cryptographic key or key vault | Key icon |
| `Policy` | Policy, guardrail, or authorization engine | Document icon |
| `Firewall` | Firewall, WAF, or filtering layer | Wall icon |
| `Secret` | Secret store | Padlock icon |
| `Scope` | Management scope (management group, subscription, resource group) | Folder-tree icon |

Each primitive has:
- A consistent visual identity across all scenes.
- Light and dark theme variants.
- An active, inactive, and error state.
- A hover state that previews inspector content.

---

## State Transitions

State transitions define how the scene changes over time (e.g., during a request flow or failover scenario).

```typescript
interface StateTransition {
  from: string;    // state id
  to: string;      // state id
  trigger: 'auto' | 'user' | 'timer';
  animation: {
    duration: number;        // ms
    edgeAnimations?: EdgeAnimation[];  // e.g., data flowing along an edge
    nodeAnimations?: NodeAnimation[];  // e.g., node changing color/status
  };
}
```

Transitions are purely visual. The simulation engine handles the actual state logic.

---

## Integration with Simulation Engine

The visualization engine renders; the simulation engine computes.

```
Simulation Engine                 Visualization Engine
┌──────────────┐                 ┌──────────────────┐
│ currentState  │───── maps to ──▶│  SceneState       │
│ parameters    │                 │  nodeOverrides    │
│ history       │                 │  edgeOverrides    │
└──────────────┘                 └──────────────────┘
```

A mapping function converts simulation state into scene state. This keeps the simulation logic independent of rendering concerns.

---

## Performance

- SVG scenes are small; node sizing and edge routing are computed once per state in a pure layout pass (`svg-layout`).
- Throttle state transitions to 60fps maximum.
- Use CSS transforms for simple animations; reserve D3 transitions for complex ones.
- Lazy-load React Flow — it loads only for a scene with `interaction: 'graph'`, never on the default SVG path.
