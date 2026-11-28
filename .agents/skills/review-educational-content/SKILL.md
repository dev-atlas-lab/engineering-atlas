---
name: review-educational-content
description: Use when asked to review existing or newly authored lessons, provider details, labs, assessments, or scenes in Engineering Atlas. Reports findings with file references and suggested fixes; does not rewrite content.
---

# Review Educational Content

Use this skill when the task is a content review — "review the lessons for
X", "check the Kubernetes networking slice", "QA this concept". Do not use
it for implementation; rewriting is the author's call.

## Before you start

Read `docs/agents/ARCHITECTURE_OVERVIEW.md` and `docs/CONTENT_MODEL.md`.
When reviewing scenes, read `docs/SVG_VISUALIZATION_STANDARD.md`. The
glob-triggered rules for content, visualization, and simulation files will
load as you open them.

## Checklist (apply what fits the scope)

1. **Technical accuracy.** No invented APIs, flags, service names. Version
   claims are grounded. Terminology matches the vendor's current usage.
   Code / command blocks compile or execute as written.
2. **Depth and coverage.** Together a concept's lessons cover: what, why,
   problem, internal mechanism, architecture/lifecycle, examples, failure
   modes, troubleshooting, misconceptions, knowledge checks. Note missing
   points.
3. **Learning progression.** Prerequisites are realistic. Earlier lessons
   don't assume later material. A learner who knows the stated prereqs can
   follow.
4. **Practical examples.** Concrete, not abstract. Realistic names,
   numbers, regions.
5. **Internal mechanisms.** The lesson shows what the system does, not just
   the UX.
6. **Failure scenarios.** Named, with how to recognize them.
7. **Misconceptions.** Common wrong beliefs are called out.
8. **Diagram accuracy.** Nodes, edges, labels reflect the real topology or
   sequence. `flow` set correctly (`allow`/`deny`/`blocked`/`pending`).
   Denied/blocked paths explicitly marked. Sequence scenes have
   `states.length === edges.length + 1`.
9. **Assessment quality.** Plausible distractors; every option's
   `explanation` teaches; `difficulty` matches real demand;
   `learningObjective` is a real objective.
10. **Duplicates and orphans.** Same material taught in two places (cross-
    link instead). Orphan lesson / scene / view files. Stale
    `providerDetails` for renamed/retired services.

## Output format

Group by severity: **blocking**, **should-fix**, **nit**. For each finding:

- Exact file path + lesson/section/scene/question id (e.g.
  `src/content/.../virtual-machines.ts → lesson 'what-are-vms' → section 2`).
- Issue in one sentence.
- Concrete suggestion (if obvious) or a question for the author (if intent
  is unclear).
- Keep findings specific and actionable.

## Do not

- Rewrite the content in place. Report; let the author decide.
- Reorder lessons without flagging it as a structural suggestion.
- Mark findings "fixed" during a review pass. Fixes belong to a separate
  implementation pass.
- Hide a pre-existing issue because it is "not part of the change".

## Stop and ask

- The review scope is ambiguous (which concept, which domain).
- A finding would require a product-level decision (reshaping a category,
  retiring a concept).
- You find a factual claim you cannot verify from the repo or vendor docs
  and the author's intent is unclear.
