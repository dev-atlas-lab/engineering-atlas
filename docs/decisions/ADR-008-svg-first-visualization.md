# ADR-008: SVG-First Visualization with Lazy React Flow

## Status

Accepted

## Context

Through Slice 2B, topology scenes rendered with React Flow (`@xyflow/react`) and sequence scenes with a separate hand-authored SVG renderer. The visualization audit (`docs/VISUALIZATION_AUDIT.md`) found:

- React Flow renders HTML nodes, not SVG, and is statically imported, so it ships in the shared lesson chunk and loads for every lesson — including the 12 that show only a sequence diagram.
- None of the 11 topology scenes use React Flow's distinctive features (dragging nodes, drawing connections, graph navigation). They are fixed educational diagrams.
- Topology and sequence diagrams share no visual language; neither emits accessible `<title>`/`<desc>`; boundaries and denied/blocked flows are not drawn.

The brief's own guidance is to use "React Flow for node-edge architecture topology where dragging, connecting, and graph navigation provide real value," and SVG as the default otherwise.

## Decision

Make **declarative SVG** the default renderer for scenes, and keep **React Flow as a lazily loaded opt-in**.

1. A new SVG renderer (`SvgTopologyScene`) renders topology scenes from the unchanged `SceneDefinition` model (`nodes`, `edges`, `states`, plus new optional `boundaries`). The sequence renderer is rebuilt on the same shared primitives (`src/engines/visualization/svg/`) and visual language (`svg-tokens.ts`).
2. `SceneRenderer` dispatches on a new optional `scene.interaction`:
   - `undefined` or `'static'` → SVG (topology or sequence by `scene.type`).
   - `'graph'` → React Flow, imported with `React.lazy` inside a `Suspense` boundary.
3. No current scene sets `interaction: 'graph'`, so the bundler splits `@xyflow/react` and its stylesheet into a separate async chunk that current routes never fetch.
4. The scene model gains optional, backward-compatible fields: `boundaries` (drawn trust/network/region/scope containers), edge `flow` (`allow` | `deny` | `blocked` | `pending`), and `interaction`. Existing scenes render unchanged until enhanced.

The `VisualizationRegion` contract (scene in, inspector + timeline out), the simulation/lab engines, per-concept lazy loading, and all concept IDs, routes, and statuses are unchanged. Simulation views remain HTML.

## Reasoning

- SVG is the correct model for fixed technical diagrams: it is scalable, themeable with the existing CSS tokens, accessible (`<title>`/`<desc>`, focusable `<g>` elements), and light. Choosing it here is discriminate, not indiscriminate — it follows the brief's own "real value" test, which none of the current topology scenes meet.
- Retaining React Flow behind a lazy flag honours "do not replace React Flow indiscriminately": the capability stays documented and available for a future scene that genuinely needs graph interaction, at zero cost to today's routes.
- One renderer family for both scene types gives a single visual language across the product, which was the phase's goal.
- Backward-compatible optional fields let the eleven-plus existing scenes keep working and be enhanced where it adds accuracy (boundaries, denied flows), rather than rewritten.

## Consequences

**Positive**

- `@xyflow/react` leaves the eager lesson path; measured per-page bundle sizes are recorded in `docs/CLOUD_FUNDAMENTALS_CURRICULUM.md`.
- Topology and sequence diagrams share node, edge, state, boundary, and legend conventions.
- Scenes gain accessible descriptions, drawn boundaries, visible focus, and explicit allow/deny/blocked/pending styling.
- Visualizations become unit-testable (plain SVG in jsdom) in addition to the browser checks.

**Negative / trade-offs**

- The SVG renderer computes its own node sizes and straight-line edge routing rather than relying on React Flow's layout engine. It is tuned for the current scene sizes (≤ ~12 nodes); very large graphs would want the `interaction: 'graph'` path.
- Instead of React Flow's pan/zoom, wide diagrams scale to fit and scroll horizontally inside their own container on narrow screens (the proven sequence-scene pattern), keeping labels readable and the page free of horizontal overflow.
- `@xyflow/react` stays in `package.json` with no eager consumer. This is deliberate: it is a retained capability, not dead code, and it is exercised by a renderer-selection test.

## Alternatives considered

- **Keep React Flow for topology.** Rejected: it keeps HTML nodes, the eager-chunk cost, and the two-renderer split, none of which the phase can accept.
- **Remove React Flow entirely.** Rejected: it discards a capability the brief says to keep for genuine graph-navigation scenes.
- **Build pan/zoom into the SVG renderer.** Deferred: current scene sizes do not need it, and custom touch gesture handling is a bug surface. The `interaction: 'graph'` path covers the case that does need it.
