---
name: implement-learning-domain
description: Use when a task adds or extends a learning domain, category, or concept with lesson content, visualizations, labs, or assessments in Engineering Atlas. Covers the full flow from outlining metadata through authoring content, wiring the loader, and validating.
---

# Implement a Learning Domain or Slice

Use this skill when the task is "add / extend a concept / category / domain"
or a slice of the curriculum in the Engineering Atlas repository. Do not use
it for bug fixes, infrastructure work, or isolated UI tweaks.

## Before you start

Read `docs/agents/ARCHITECTURE_OVERVIEW.md` and `docs/CONTENT_MODEL.md`.
The glob-triggered `content-authoring.md` and `visualization.md` rules will
load automatically for the files you touch.

If the proposed structure materially changes category composition, concept
boundaries, prerequisites, or promotes concepts to `available` status, stop
after step 2 and confirm the outline with the user before authoring.

## Procedure

1. **Audit the surface area.** Read `src/content/<domain>/index.ts`, the
   relevant `<category>/meta.ts` files, and
   `src/content/cloud-fundamentals/concept-loaders.ts` (the shared loader
   registry). Read `src/content/types.ts` for the exact shape of every
   record. Check `docs/CLOUD_FUNDAMENTALS_CURRICULUM.md` for Cloud
   Fundamentals coverage (no equivalent curriculum doc exists yet for
   Kubernetes Fundamentals).
2. **Propose the outline.** For each new/changed concept, list: id, title,
   description, status, prerequisites, related concepts, estimated minutes,
   `LessonMeta[]` (id/title/kind/providerId?), `LabMeta[]` (id/title/type).
   See `references/content-quality.md` for depth expectations.
3. **Add metadata first.** Create/update `<category>/meta.ts` and
   `<category>/index.ts`. Wire into `<domain>/index.ts` if adding a category.
   Concept ids must be globally unique across every domain.
4. **Author the content modules.** For each `available` concept, create
   `<category>/<concept>.ts` exporting `content: ConceptContentModule`.
   Author every lesson body matching the metadata ids. Use the
   `ContentBlock` DSL (`paragraph`, `list`, `code`, `callout`,
   `comparisonTable`). Attach `visualization`, `knowledgeCheck`,
   `providerDetails` where applicable.
5. **Author scenes.** Default to declarative SVG topology or sequence
   scenes. Factor large sets into `<concept>.scenes.ts`. Follow the
   visualization rule. For sequence scenes:
   `states.length === edges.length + 1`.
6. **Author labs** if the slice includes any. For simulation labs invoke
   the `implement-interactive-lab` skill. For hands-on and challenge labs,
   author the `HandsOnLab` / `ChallengeLab` record directly.
7. **Register in the loader.** Add
   `'<concept-id>': () => import('./<category>/<concept>')` to
   `src/content/cloud-fundamentals/concept-loaders.ts`. The loader registry
   is shared across domains (ids are globally unique). Coming-soon concepts
   get no entry.
8. **Integrate.** Set `prerequisites` and `relatedConcepts` on each
   `ConceptMeta`. For Cloud Fundamentals, if promoting to `available`, add
   the id to `ACTIVE_CONCEPTS` in `src/content/cloud-fundamentals/index.test.ts`.
   For Kubernetes Fundamentals, update the category list and lab id
   assertions in `src/content/kubernetes-fundamentals/index.test.ts` (note:
   Kubernetes does not yet run `ACTIVE_CONCEPTS`, loaded-content, or
   metadata/body boundary tests — those are planned work). See
   `references/domain-integration.md` for cross-linking patterns.
9. **Unit tests.** Only for new simulation definitions (`computeHistory`),
   new utilities, or new visualization primitives. Do not duplicate what
   `index.test.ts` and `concept-loaders.test.ts` already enforce.
10. **Validate.** Invoke the `validate-and-prepare-commit` skill. At
    minimum: targeted vitest (`npm test -- src/content/<domain>`, plus
    `npm test -- src/content/cloud-fundamentals/concept-loaders.test.ts`),
    `npm run lint`, `npm run typecheck`, `npm run build` (use `cmd /c npm ...`
    on Windows PowerShell if execution policy blocks `npm.ps1`).

## Acceptance criteria

- Every lesson/lab id in metadata has a matching body in the module.
- Every concept with lessons has exactly one loader entry; every
  coming-soon concept has none.
- Every simulation lab has a matching binding in the concept's
  `simulations` map, and the simulation id matches.
- Sequence scenes have `states.length === edges.length + 1`.
- Challenge solutions reference only existing decision/option ids.
- `npm run build` succeeds; targeted tests, lint, typecheck pass.
- No unrelated files were modified.

## Stop and ask

- The outline changes category composition or concept boundaries.
- A concept would be promoted to `available` and it was not explicitly
  requested.
- You need to add a new runtime dependency.
- Two concepts could reasonably own the same material and it is not clear
  which.
