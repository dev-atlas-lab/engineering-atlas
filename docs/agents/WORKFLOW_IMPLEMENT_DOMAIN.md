# Workflow — Implement a Learning Domain (or slice)

Use this workflow whenever a task adds or extends a learning domain, category,
or concept with lesson content, visualisations, labs, or assessments.

> Preconditions: you have read [../../AGENTS.md](../../AGENTS.md),
> [../ARCHITECTURE.md](../ARCHITECTURE.md), [../CONTENT_MODEL.md](../CONTENT_MODEL.md),
> [./ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md),
> and the relevant ADRs (especially ADR-007 and ADR-008).
> Primary Antigravity skill: [.agents/skills/implement-learning-domain/SKILL.md](../../.agents/skills/implement-learning-domain/SKILL.md).

---

## Steps

### 1. Inspect current architecture

- Read `src/content/<domain>/index.ts` and the category files already in place.
- Read `src/content/types.ts` for the exact shape of every record you will author.
- Read `src/content/cloud-fundamentals/concept-loaders.ts` — the shared loader registry across domains.

### 2. Review relevant existing concepts

- `git grep -n "<topic>"` across `src/content/` to find overlapping material.
- Open the neighbouring concept files for tone, depth, and formatting cues.
- Check `docs/CLOUD_FUNDAMENTALS_CURRICULUM.md` (and any domain-specific
  curriculum document) for the agreed coverage of the topic.

### 3. Identify gaps and duplicates

- Which concepts are missing from this domain or slice?
- Which concepts already partially cover this material? Cross-link instead
  of duplicating.
- Which concepts should be prerequisites or related concepts?

### 4. Propose the structure

Before writing code, write down (in your reply to the user) the proposed
Domain → Category → Concept → Lesson/Lab outline:

- Category id, title, description.
- Each concept's id, title, description, status, prerequisites, related
  concepts, estimated minutes.
- Each concept's lesson outline: `LessonMeta[]` — id, title, kind
  (`concept` | `provider` | `comparison`), optional `providerId`.
- Each concept's lab outline: `LabMeta[]` — id, title, type.

Pause here if the outline is non-trivial and ask the user to confirm,
especially if it changes category composition or concept boundaries.

### 5. Add metadata first (eager, type-checked)

- Create / update `src/content/<domain>/<category>/meta.ts` exporting
  `ConceptMeta[]` with the full outline.
- Create / update `src/content/<domain>/<category>/index.ts` exporting the
  `Category`.
- If adding a new category, wire it into `src/content/<domain>/index.ts`.
- Keep all concept ids globally unique across every domain (the test
  enforces this).

### 6. Author concept content modules

For each concept with status `available`:

- Create `src/content/<domain>/<category>/<concept>.ts` exporting
  `content: ConceptContentModule`.
- Author every lesson body matching the `LessonMeta` ids. Use the
  `ContentBlock` DSL (`paragraph`, `list`, `code`, `callout`,
  `comparisonTable`) in `LessonSection.blocks`.
- For each lesson, write content that covers: what, why, the problem it
  solves, internal mechanics, architecture and lifecycle, examples, failure
  modes, troubleshooting, misconceptions. Depth proportional to the topic —
  not every lesson needs every point, but every concept as a whole should.
- Attach a `visualization: SceneDefinition` to lessons that benefit from one
  (see step 7).
- Attach a `knowledgeCheck: KnowledgeCheckQuestion[]` with meaningful
  distractors and per-option explanations.
- Add provider details (`providerDetails: ProviderImplementationDetails`)
  for lessons of `kind: 'provider'` — Azure and AWS, with real
  `terminology`, `architecturalNotes`, and `limitations`.

### 7. Implement SVG scenes

- Default to declarative SVG: `type: 'topology'` or `type: 'sequence'`.
- Use node primitives, edge types, flows, and boundaries from
  `src/engines/visualization/types.ts`. Read
  [../SVG_VISUALIZATION_STANDARD.md](../SVG_VISUALIZATION_STANDARD.md).
- Lay out topology top-to-bottom or left-to-right; positions are abstract
  (roughly 0–700 × 0–520). Let the renderer size nodes and compute the viewBox.
- `states[0]` is the initial view; add state overrides to animate.
- For sequence scenes, `states.length === edges.length + 1` (enforced).
- Explicitly mark denied / blocked paths with the `flow` field.
- Use React Flow (`interaction: 'graph'`) **only** when node dragging or
  graph navigation is part of the lesson.
- Factor large scene sets into `<concept>.scenes.ts`.

### 8. Implement interactive labs

If the slice includes a simulation lab, follow
[./WORKFLOW_IMPLEMENT_LAB.md](./WORKFLOW_IMPLEMENT_LAB.md) and merge the
resulting `LabBody` into this concept's `labs` map and the simulation into
its `simulations` map via `bindSimulation`.

For hands-on labs: list exact prerequisites, commands (tagged `bash` /
`powershell`), expected output, and a validation checklist the learner will
mark themselves. Never claim validation was automatic.

For challenge labs: scenario, requirements, constraints, decisions with
options, and at least one `ChallengeSolution` (with `tradeoffs`). Add
per-option `feedback` where authored.

### 9. Register the concept in the loader

Add an entry to `src/content/cloud-fundamentals/concept-loaders.ts` (the
shared loader registry across all domains):

```ts
'<concept-id>': () => import('./<category>/<concept>'),
```

Concept ids are globally unique, so the registry is shared across domains
(it already imports from `../kubernetes-fundamentals/...` for concepts in
that domain). Coming-soon concepts have no entry.

### 10. Add unit tests for new logic

- Simulation definitions: deterministic `computeHistory(def, params)` output
  for known inputs, history immutability, boundary parameters, and validation checks.
- Any new content utility.
- Any new visualisation primitive (component test).

Do **not** add tests that duplicate what `index.test.ts` and
`concept-loaders.test.ts` already enforce.

### 11. Integrate navigation and cross-links

- Set `prerequisites` and `relatedConcepts` on each `ConceptMeta`.
- For Cloud Fundamentals, if promoting a concept to `available`, add its id
  to `ACTIVE_CONCEPTS` in `src/content/cloud-fundamentals/index.test.ts`.
  For Kubernetes Fundamentals, update the category list and lab id assertions
  in `src/content/kubernetes-fundamentals/index.test.ts` (deeper loaded-content,
  boundary, cross-link, and scene-arity parity checks are planned work).
- Make sure lesson order makes pedagogical sense (prerequisites flow forward).

### 12. Validate

Follow [./WORKFLOW_VALIDATE_COMMIT.md](./WORKFLOW_VALIDATE_COMMIT.md):

- `npm test -- src/content/<domain>` and the tests for any engine code you
  touched.
- `npm run lint`.
- `npm run typecheck`.
- `npm run build`.
- Spot-check the new pages in `npm run dev` if the task changes rendering.

### 13. Report

Summarise: concepts added, their status, visualisations added, labs added,
any pre-existing failures surfaced, any follow-up work.
