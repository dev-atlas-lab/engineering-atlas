# Domain Integration Reference

How a new or extended domain/category/concept is wired into Engineering
Atlas. Load when touching metadata or the loader.

## Metadata/body split — the invariants

In Cloud Fundamentals, these invariants are enforced by
`src/content/cloud-fundamentals/index.test.ts` and `concept-loaders.test.ts`.
In Kubernetes Fundamentals, `kubernetes-fundamentals/index.test.ts` currently
checks domain registration, category list/order, non-empty descriptions and
lessons, concept id uniqueness across both domains, loader presence, and
expected lab ids; deeper loaded-content, metadata/body boundary, cross-link,
scene-arity, and simulation-binding tests for Kubernetes are planned work. Do
not try to work around these invariants in either domain.

- Metadata is the single source of truth for id, title, kind/type, order,
  and status.
- `src/content/<domain>/index.ts` and `<category>/meta.ts` **never** import
  content modules. `cloud-fundamentals/index.test.ts` reads their source and
  fails if they do (planned for Kubernetes).
- `ConceptContentModule` maps are keyed by id and merged with metadata at
  load time. A body never repeats a title, kind, or order.
- Bodies and metadata must list exactly the same lesson and lab ids
  (`content-mismatch` error otherwise).

## Loader registry

`src/content/cloud-fundamentals/concept-loaders.ts` has one explicit entry
per concept that has lessons. The paths can cross domains because concept
ids are globally unique (e.g. a Kubernetes concept imported from
`../kubernetes-fundamentals/...`).

```ts
'<concept-id>': () => import('./<category>/<concept>'),
```

- Coming-soon concepts have no entry.
- Do not use a glob or barrel — the registry's explicitness is what gives
  each concept its own Vite chunk.
- Failed loads are not cached; a reload resets.

## Status promotion

- `ConceptStatus.status` is the only availability field driving UI labels.
- For Cloud Fundamentals, promoting to `available` is a deliberate edit to
  `ACTIVE_CONCEPTS` in `src/content/cloud-fundamentals/index.test.ts`.
  `src/content/kubernetes-fundamentals/index.test.ts` does not currently keep
  an `ACTIVE_CONCEPTS` allow-list.
- Do not promote as a side effect of another change.

## Cross-linking

- `prerequisites: string[]` — concept ids the learner should understand
  first. Keep this tight and realistic; three prerequisites is usually
  plenty.
- `relatedConcepts: string[]` — concepts that a reader of this one may also
  want. Not transitive; keep direct neighbours only.
- Lesson text should reference related concepts in prose when they come up,
  not repeat their explanations.

## Lesson ordering within a concept

- `LessonMeta[]` order is the pedagogical order.
- The first lesson is usually a `kind: 'concept'` introduction grounded in
  the mechanism.
- Provider lessons (`kind: 'provider'`) come after the concept basics so
  terminology differences land on top of a common mental model.
- `kind: 'comparison'` lessons come after the provider lessons.

## Simulation binding

- The simulation lab's `content.simulationId` must match `simulation.id` and
  a key in the concept module's `simulations` map.
- Each entry uses `bindSimulation(simulation, renderState)` so the
  simulation's code ships only in that concept's chunk.
- Keep the pure `SimulationDefinition` in a plain `.ts` file (e.g.
  `storage-simulations.ts`) next to the concept module. The view in a
  `*-simulation-views.tsx` or inlined in the binding.

## Category folders

- Categories with authored content have their own folder:
  `<category>/meta.ts`, `<category>/index.ts`, one module per concept.
- Categories that are entirely coming soon stay as single files in
  `categories/`.
- Keep category-level descriptions one paragraph. They appear on the
  category landing page.
