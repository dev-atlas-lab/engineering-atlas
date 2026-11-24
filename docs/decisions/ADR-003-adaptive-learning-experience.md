# ADR-003: Adaptive Learning Experience

## Status

Accepted

## Context

The platform covers diverse technical concepts: infrastructure topologies, network protocols, data structures, permission models, distributed systems, and more. Each concept has a natural visual representation and interaction model.

We must decide between:

**Option A — Uniform template:** Every lesson uses the same layout and visualization framework. Consistent but potentially a poor fit for some concepts.

**Option B — Adaptive experience:** Each concept uses the visualization and interaction model best suited to its content. More development effort but better learning outcomes.

## Decision

Use an **adaptive learning experience** where the visualization approach, layout, and interaction model are selected per concept based on what best serves understanding.

| Concept Type | Visualization | Interaction Model |
|---|---|---|
| Cloud global infrastructure | Interactive topology map | Pan, zoom, click regions |
| Virtual machines | Infrastructure architecture diagram | Inspect components, modify config |
| Network protocols (TCP) | Packet sequence diagram | Step through sequence |
| IAM / permissions | Identity and permission flow | Trace a request through policies |
| Kubernetes scheduling | Cluster topology simulation | Submit pods, observe scheduling |
| B-Tree index | Animated data structure | Insert/delete, observe rebalancing |
| Database transactions | Timeline with state transitions | Step through transaction lifecycle |
| Distributed systems | Multi-node event simulation | Trigger failures, observe consensus |

The visualization engine provides the rendering infrastructure. Content authors specify a `visualizationType` per lesson. The engine selects the appropriate renderer.

## Consequences

**Benefits:**
- Each concept is taught using the visual language most natural to it. Protocol sequences look like sequences, not force-fit node graphs.
- Engineers develop varied mental models rather than mapping everything to one diagram type.
- The platform feels like exploring different systems, not clicking through a template.

**Trade-offs:**
- Higher development cost per concept type. Each new visualization type requires building a renderer.
- Less visual consistency across the platform (mitigated by shared primitives and design system).
- Content authoring requires choosing and configuring the right visualization, increasing authoring complexity.

**Mitigations:**
- Start with 3-4 visualization types that cover the initial cloud fundamentals scope: topology (React Flow), sequence (SVG), structure (SVG/D3), and flow (SVG). Add more types as new domains require them.
- Shared visual primitives (server, database, network, etc.) maintain visual consistency across different renderers.
- Scene definitions abstract over rendering details — content authors declare nodes, edges, and states, not rendering instructions.
- The SceneRenderer automatically picks the renderer from the scene type, so most authoring decisions are about content structure, not rendering.

## Reviewed Alternatives

**Uniform React Flow for everything:** React Flow handles topology well but is a poor fit for sequence diagrams, data structure animations, and timeline views. It would require awkward workarounds for non-graph concepts.

**Uniform SVG/D3 for everything:** Maximum flexibility but requires building graph layout from scratch (which React Flow provides for free). Also loses React Flow's built-in pan/zoom, minimap, and interaction handling for topology views.

**Chosen approach** uses both, with a renderer abstraction that picks the right tool per scene type.
