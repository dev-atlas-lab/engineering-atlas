# SVG Visualization Standard — Engineering Atlas

How visualizations are built. This is the actionable reference: read it before adding or changing a diagram. Background and the decision to adopt it are in `docs/VISUALIZATION_AUDIT.md` and ADR-008.

---

## 1. Choosing a rendering model

| You are showing… | Use | Why |
|---|---|---|
| A fixed architecture, topology, hierarchy, or data flow | **SVG topology scene** (`type: 'topology'`) | Scalable, themeable, accessible, light; no graph-editing needed |
| A request / lifecycle / protocol exchange over time | **SVG sequence scene** (`type: 'sequence'`) | Actors + ordered messages read naturally |
| A graph the learner drags, connects, or navigates | **React Flow** (`interaction: 'graph'`) | Only here does node-dragging / graph navigation earn its weight |
| Dense, stateful, textual output of a simulation | **HTML simulation view** (`*-view.tsx`) | Tables and lists are clearer than SVG for per-step data |

SVG is the default. Reach for React Flow only when dragging or graph navigation is genuinely part of the lesson — no current scene does. Do not turn a diagram into a simulation when a static or stepped scene explains it; do not turn dense tabular state into SVG.

---

## 2. The scene model

A scene is a `SceneDefinition` (`src/engines/visualization/types.ts`):

```ts
{
  id, type: 'topology' | 'sequence', title,
  description?,                 // one sentence -> SVG <desc> (falls back to title)
  nodes: SceneNode[],          // id, type (ScenePrimitive), label, position {x,y}, data, status?
  edges: SceneEdge[],          // id, source, target, label?, edgeType?, animated?, flow?
  states: SceneState[],        // states[0] is the initial view; overrides per step
  boundaries?: SceneBoundary[],// drawn containers: trust | network | region | scope | zone
  interaction?: 'static' | 'graph',
}
```

- **Positions** are the node's top-left in an abstract coordinate space (roughly 0–700 × 0–520 today). The renderer sizes each node box from its label and computes the viewBox; you only place top-left corners. Lay topology out top-to-bottom or left-to-right so straight edges read cleanly.
- **States** drive the timeline. Each state has a `label`, a `description` (shown under the diagram, `aria-live`), and optional `nodeOverrides` / `edgeOverrides`. For a **sequence** scene there must be exactly `edges.length + 1` states (initial + one per message); this is enforced by a test.
- **Status** (`active` | `inactive` | `error`) styles a node: green / faded / red. Use it, and state overrides, to show a system changing — a failure, a compromise, a zone going offline.

Attach a scene to a lesson with `visualization: myScene` in its `LessonBody`. Nothing else is needed; the lesson workspace renders the diagram, timeline, step text, and inspector.

---

## 3. The visual language

All conventions live in `src/engines/visualization/svg/svg-tokens.ts`. Do not hard-code colours or add per-diagram palettes — use node kinds, edge kinds, flow, status, and boundaries, which map to the theme tokens and adapt to light and dark automatically.

**Node kinds** (`ScenePrimitive`, icon from `primitives.ts`): actors (`client`, `user`), compute (`server`, `function`, `host`), data (`database`, `storage`, `queue`), security (`key`, `secret`, `policy`, `firewall`), identity (`identity`), network (`gateway`, `loadbalancer`, `network`), infrastructure (`region`, `availabilityZone`, `scope`).

**Edges.** `edgeType` sets the base line: `dependency` is a structural "contains / belongs to" (dashed, no arrow); `request` / `response` / `data` are communicating links (solid, arrow); `network` is a network link (dotted). `flow` sets the **outcome**, and this is a technical-accuracy requirement:

| `flow` | Means | Looks like |
|---|---|---|
| `allow` | An allowed/approved path | Accent (blue) |
| `deny` | A policy said no | Error (red) |
| `blocked` | A control dropped it | Error (red), dashed |
| `pending` | In progress | Warning (amber), dashed, animated |

Mark denied and blocked paths explicitly — never leave a denial looking like an ordinary line. `animated: true` (or the current timeline step) emphasises an edge as active (accent, drifting dashes).

**Boundaries.** Draw a `trust`, `network`, `region`, `scope`, or `zone` boundary around the nodes it contains (`nodeIds`). Make trust boundaries explicit wherever a lesson turns on them (an identity provider, a VNet, a management scope).

**Legend.** Generated automatically from the flows, statuses, and boundaries a scene uses. You do not author it; just use the conventions and it explains them.

---

## 4. Interaction contract

- **Selection.** Every node/actor is a focusable `role="button"` (`Tab` to it, `Enter`/`Space` to select). Selecting populates the shared `ComponentInspector` from the node's `data` and its connections (derived from edges). Put the details worth inspecting in `data`; never rely on hover — there is no hover-only information.
- **Stepping.** The `TimelineController` drives `stateIndex`; the renderer highlights the current step and the step `description` is shown and announced. Keep simulation logic out of SVG event handlers — SVG renders state; the simulation engine owns behaviour.
- **Responsiveness.** The SVG scales to fit its container and, on narrow screens, scrolls horizontally inside its own box so labels stay readable and the page never overflows. No pan/zoom is built in; a scene that truly needs it sets `interaction: 'graph'`.

---

## 5. Accessibility and motion

- Each scene emits `<title>` (the scene title) and `<desc>` (the `description`), and is a `role="group"` labelled by them.
- Interactive nodes are keyboard-reachable with a visible focus ring, distinct from the selection border.
- Colour is never the only signal: status also changes the border and an icon tint, flows change dash and arrow, and the legend names every convention in text.
- Motion (active/pending flow dashes) uses the `.atlas-flow` class, which `prefers-reduced-motion: reduce` disables.
- Boundaries are decorative (`aria-hidden`); their meaning is also in the step text and inspector.

---

## 6. Performance and lazy loading

- Scenes live in their concept's `*.scenes.ts`, inside that concept's lazy chunk. Nothing visualization-specific loads on Home or category pages.
- The SVG renderers are small and ship in the lesson chunk. **React Flow is loaded only for `interaction: 'graph'`** (ADR-008); keep it that way, so `@xyflow/react` stays out of the eager path.
- Avoid SVG filters, large numbers of DOM nodes, and continuous animation beyond the flow dashes. Do not add visualization dependencies — the primitives cover node/edge/boundary/legend needs.

---

## 7. Adding a new visualization

1. Decide the model (§1). For most diagrams it is an SVG topology or sequence scene.
2. Author a `SceneDefinition` in the concept's `*.scenes.ts`: place nodes, connect edges (set `flow` on denied/blocked paths), add `boundaries` where a boundary matters, and write one `state` per step with a clear `description`. Add a `description` for the diagram as a whole.
3. Put inspectable detail in each node's `data`.
4. Attach it to the lesson with `visualization`.
5. Verify: `npm run typecheck`, `npm run lint`, `npm run test` (the schema test checks states and that edges/boundaries reference real nodes), `npm run build`. Check it at 320/390/768/1280 in light and dark, and tab through the nodes.

Do not introduce a new colour, a bespoke renderer, or a dependency. If a diagram genuinely needs graph dragging or navigation, set `interaction: 'graph'` and document why.
