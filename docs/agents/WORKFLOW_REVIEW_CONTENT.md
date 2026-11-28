# Workflow — Review Educational Content

Use this workflow when asked to review existing or newly authored lessons,
provider details, labs, or assessments.

A good review raises issues the author can act on. Call out what is wrong
and what is missing; do not rewrite the content.

---

## Checklist

### 1. Technical accuracy

- Every factual claim is correct for the current version of the technology.
- No invented APIs, flags, SKUs, or service names.
- Version-specific behaviour is called out (e.g. "as of Kubernetes 1.29").
- Provider-specific claims match the vendor's own documentation.
- Terminology matches the vendor's current terminology, not legacy names.

### 2. Explanation depth

- The lesson answers at least: what, why, the problem it solves, how it
  works internally. Not every lesson needs every one of the ten points in
  `AGENTS.md` §6, but together a concept's lessons must cover them.
- Internal mechanics are explained, not just symptoms or UX.
- Trade-offs are explicit, not hedged into "it depends".

### 3. Learning progression

- Prerequisites are correct and realistic.
- Earlier lessons in the same concept do not assume material from later ones.
- A learner who has read the stated prerequisites can follow this lesson.

### 4. Practical examples

- Examples are concrete, not abstract.
- Code / command blocks compile or execute as written.
- Example configuration uses realistic names, numbers, and regions.

### 5. Internal mechanisms

- The lesson shows what the system actually does, not just the user-facing
  interface.
- Where appropriate, sequence scenes or state transitions illustrate the
  mechanism.

### 6. Failure scenarios

- Common failure modes are named.
- The learner is told how to recognise a failure (logs, metrics, symptoms).

### 7. Misconceptions

- Common wrong beliefs about the topic are called out and corrected.
- Where two provider services are often conflated, the real differences are
  explained.

### 8. Diagram accuracy

- Every node, edge, and label on a `SceneDefinition` reflects the real
  topology / sequence. No decorative or filler diagrams.
- `flow` is set correctly: `allow`, `deny`, `blocked`, `pending`.
- Boundaries (`trust`, `network`, `region`, `scope`, `zone`) are used where
  they clarify.
- Sequence scenes: `states.length === edges.length + 1`.
- Light and dark themes both render without hard-coded colours.

### 9. Assessment quality

- Each `KnowledgeCheckQuestion` has a non-trivial correct answer and
  plausible distractors.
- Every option has an `explanation` that teaches something, not just
  "correct" / "incorrect".
- `difficulty` matches the question's actual demand.
- `learningObjective` is a real objective, not a restatement of the question.

### 10. Duplicate / orphaned content

- The same concept is not taught in two places. Use cross-links
  (`relatedConcepts`, prose references) instead.
- No orphaned lesson files, scenes, or simulation views.
- No stale `providerDetails` for services that have been renamed or retired.

---

## Format of the review

Report findings grouped by severity. For each finding, name:

- The file path and the specific lesson / section / scene / question id.
- The issue in one sentence.
- A concrete suggestion (if obvious) or a question for the author (if the
  fix depends on intent).

Do not reorder or rewrite the content. The author decides what to accept.

Do not mark issues "fixed" during review — that belongs to a separate
implementation pass.
