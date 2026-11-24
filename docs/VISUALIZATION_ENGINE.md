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
ReactFlow    SVG/D3     Sequence
 Scene       Scene       Scene
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

The SceneRenderer reads the scene definition and delegates to the appropriate rendering strategy.

| Scene Type | Renderer | Technology | Use Case |
|---|---|---|---|
| `topology` | ReactFlowScene | React Flow | Infrastructure diagrams, network topologies |
| `sequence` | SequenceScene | SVG | Protocol sequences, request flows |
| `structure` | StructureScene | SVG / D3 | Data structures, trees, hierarchies |
| `flow` | FlowScene | SVG | Decision flows, permission chains |
| `timeline` | TimelineScene | SVG | Event timelines, state transitions over time |
| `custom` | CustomScene | Any | Concept-specific visualizations |

The renderer is selected automatically based on `scene.type`. Lessons do not need to specify rendering details.

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
- **Speed control** — Adjust animation speed.
- **State label** — Show what the current state represents.

```
◀◀  ◀  ▶  ▶▶   ━━━━●━━━━━━━━━   Step 3 of 7: "Client sends SYN"
```

---

## Visual Primitives

Reusable building blocks for constructing scenes.

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

- Render only visible nodes and edges (React Flow handles this for topology scenes).
- Throttle state transitions to 60fps maximum.
- Use CSS transforms for simple animations; reserve D3 transitions for complex ones.
- Lazy-load D3 and React Flow — they are only needed when a visualization is active.
