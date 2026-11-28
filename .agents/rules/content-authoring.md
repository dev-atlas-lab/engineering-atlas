---
trigger: glob
description: Rules for authoring educational content in Engineering Atlas (concepts, lessons, labs, assessments).
globs: src/content/**/*.ts, src/content/**/*.tsx
---

# Educational Content — Authoring Rules

Applies when editing files under `src/content/`. Read
`docs/CONTENT_MODEL.md` and `docs/agents/ARCHITECTURE_OVERVIEW.md` before
non-trivial edits.

## Concept-first strategy

Every concept exists independent of any provider. "Virtual Machines" is a
concept; "Azure VMs" and "Amazon EC2" are provider implementations of that
concept. Provider-specific terminology is **mapped**, not assumed equivalent.

## Depth and coverage

Together, a concept's lessons should answer: what it is, why it exists, the
problem it solves, how it works internally, its architecture and lifecycle,
practical examples, failure modes, troubleshooting, misconceptions, and
knowledge checks. Not every lesson needs every point; the concept as a whole
must.

Prioritise mechanism and trade-offs over definitions. Shallow glossary
lessons are rejected.

## Technical accuracy

- No invented APIs, flags, SKUs, or service names.
- Version-specific behaviour is called out (e.g. "as of Kubernetes 1.29").
- Never claim two provider services are technically identical unless they
  genuinely are. When comparing, be honest about architectural differences.
- Code / command blocks compile or execute as written.

## Metadata/body split (ADR-007) — authoring invariants

- `<domain>/<category>/meta.ts` holds `ConceptMeta[]` with `lessons:
  LessonMeta[]` and `labs: LabMeta[]`.
- `<domain>/<category>/<concept>.ts` exports `content: ConceptContentModule`
  (`lessons`, `labs`, `simulations` maps keyed by id).
- Metadata is the single source of truth for id, title, order, kind, status.
  Bodies never repeat titles, kinds, or order.
- Metadata files **never** import content modules (barrel or direct).
  Enforced by `src/content/cloud-fundamentals/index.test.ts`; parity tests
  for Kubernetes Fundamentals are planned work.
- Lesson/lab ids in a module must exactly match the metadata (checked at
  load time by `assembleConcept` and across Cloud Fundamentals by
  `cloud-fundamentals/index.test.ts`).
- Every concept with lessons has exactly one entry in the shared registry
  `src/content/cloud-fundamentals/concept-loaders.ts`. Coming-soon concepts
  have no entry. Enforced by tests in both domains.
- Lesson, lab, and concept ids are globally unique across the whole index
  (enforced for Cloud Fundamentals in `cloud-fundamentals/index.test.ts`, and
  for Kubernetes concept/lab ids in `kubernetes-fundamentals/index.test.ts`;
  full Kubernetes lesson/lab cross-domain collision checks are planned work).
- Simulation labs: the lab's `simulationId` must match a binding in the
  concept module's `simulations` map (use `bindSimulation`). Enforced for
  Cloud Fundamentals; planned for Kubernetes.
- Active status in Cloud Fundamentals is listed explicitly in
  `src/content/cloud-fundamentals/index.test.ts` (`ACTIVE_CONCEPTS`);
  promoting a Cloud Fundamentals concept to `available` is a deliberate edit
  to that list. `src/content/kubernetes-fundamentals/index.test.ts` does not
  currently use an `ACTIVE_CONCEPTS` allow-list.

## Cross-linking, not duplication

- Use `prerequisites` and `relatedConcepts` on `ConceptMeta`.
- Reference other lessons/concepts; do not repeat their explanations.
- No orphaned lesson files, scenes, or simulation views.

## Knowledge checks

- Non-trivial correct answer, plausible distractors.
- Every option has an `explanation` that teaches — not just "correct".
- `difficulty` matches the question's actual demand.
- `learningObjective` is a real objective, not a restatement of the question.

## Provider lessons

- `kind: 'provider'` lessons require `providerDetails:
  ProviderImplementationDetails` with real `terminology`,
  `architecturalNotes`, and `limitations`.
- Use the vendor's current terminology, not legacy names.
