---
trigger: glob
description: SVG scene authoring rules for Engineering Atlas visualizations.
globs: src/engines/visualization/**, src/content/**/scenes.ts, src/content/**/*scenes.ts, src/content/**/*.scenes.ts
---

# Visualizations — SVG Scene Rules

Applies when editing visualization engine code or authoring
`SceneDefinition`s in content modules. Read
`docs/SVG_VISUALIZATION_STANDARD.md` and
`docs/VISUALIZATION_ENGINE.md` before non-trivial changes.

## Rendering strategy (ADR-008)

- **SVG topology** (`type: 'topology'`) for architectures, hierarchies, data
  flow.
- **SVG sequence** (`type: 'sequence'`) for protocol or lifecycle exchanges.
- **React Flow** (`interaction: 'graph'`) **only** when node dragging or
  graph navigation is part of the lesson. React Flow is lazy-loaded; keep it
  out of the eager lesson path.
- **HTML simulation view** (`*-simulation-views.tsx`) for dense tabular
  simulation state — not SVG.

Do not turn a diagram into a simulation when a static or stepped scene
explains it. Do not render dense tabular state as SVG.

## Scene integrity

- `nodes` carry `position: { x, y }` as abstract top-left coordinates
  (roughly 0–700 × 0–520). Let the renderer size nodes and compute the
  viewBox. Lay out top-to-bottom or left-to-right so straight edges read.
- `states` drives the timeline. `states[0]` is always the initial view.
- **Sequence scenes: `states.length === edges.length + 1`.** Enforced by test.
- `edges[].source` and `edges[].target` must reference existing node ids.
- Overrides in `SceneState` reference only existing node/edge ids.

## Visual language — do not invent one

Use the shared tokens in `src/engines/visualization/svg/svg-tokens.ts`. Do
not hard-code colours or add per-diagram palettes.

- **Node primitives:** `client`, `user`, `server`, `function`, `host`,
  `database`, `storage`, `queue`, `key`, `secret`, `policy`, `firewall`,
  `identity`, `gateway`, `loadbalancer`, `network`, `region`,
  `availabilityZone`, `scope`.
- **Edge types:** `request`, `response`, `data`, `dependency` (dashed,
  no arrow — structural "contains / belongs to"), `network` (dotted).
- **Flows (technical accuracy requirement):** `allow` (accent/blue), `deny`
  (error/red), `blocked` (error/red + dashed), `pending` (warning/amber,
  dashed, animated). **Mark denied and blocked paths explicitly** — never
  leave a denial looking like an ordinary edge.
- **Boundaries:** `trust`, `network`, `region`, `scope`, `zone`.
- **Status:** `active`, `inactive`, `error`.

## Accessibility

- Set `description` (one sentence); it becomes the SVG `<desc>`.
- Light and dark themes must render without hard-coded colours.
- Avoid decorative diagrams that do not improve understanding.

## Attaching to a lesson

Set `visualization: myScene` in the `LessonBody`. Nothing else is required —
the lesson workspace renders diagram, timeline, step text, and inspector.

## Factoring

Large scene sets live in `<concept>.scenes.ts` next to the concept module.
