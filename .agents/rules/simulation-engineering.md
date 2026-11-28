---
trigger: glob
description: Deterministic simulation and interactive-lab engineering rules for Engineering Atlas.
globs: src/engines/simulation/**, src/engines/lab/**, src/content/**/*simulations.ts, src/content/**/*simulation-views.tsx
---

# Simulation Engineering — Rules

Applies when editing the simulation / lab engines or authoring per-concept
simulations and lab views. Read `docs/LAB_ENGINE.md` before non-trivial
changes.

## Determinism is a hard requirement

- `createInitialState(params)` and every step's `apply(state, params)` in
  `SimulationDefinition<TState>` (`src/engines/simulation/types.ts`) are
  **pure** functions of `params` (and prior `state`).
- No `Math.random()`, `Date.now()`, `fetch`, timers, file I/O, or module-level
  mutable state inside `createInitialState`, `steps`, `apply`, or
  `SimulationLab.validationRules`.
- If randomness or time is needed, seed it (or inject it as a parameter) so
  the same inputs produce the same outputs.
- Never mutate `state` in place inside `apply`: `computeHistory(def, params)`
  computes the entire `SimulationHistoryEntry<TState>[]` upfront and
  `useSimulation` steps forward/back by indexing into `history`. Mutating
  `state` in place corrupts earlier history entries and breaks step-back.

## Separation of concerns

- **Pure simulation logic** lives in a plain `.ts` file next to the concept
  module (e.g. `storage-simulations.ts`).
- **React rendering** lives in `*-simulation-views.tsx` (or in the concept's
  `simulations` map via `bindSimulation(simulation, renderState)`).
- A simulation's id must match the lab's `content.simulationId` and the
  concept's binding.
- Do **not** put simulation business logic inside `renderState`; drive state
  only through `SimulationDefinition` parameters and steps.

## Lab substance

- Model real state transitions and real decisions, not cosmetic ones. A lab
  that only changes labels is a diagram.
- Include at least one authored failure scenario or parameter combination that
  a `ValidationRule` on `SimulationLab.validationRules` rejects (or flags).
- Include a progression gate — a step the learner must perform before the
  simulation reaches a valid final state — where it matters.
- `SimulationStep.description` and `LabStep.description` explain what to
  observe, not just "click".
- Surface validation status via `SimulationLab.validationRules` (`ValidationRule[]`
  with `{ id, label, check(state) }`) and clear state feedback in `renderState`
  so the learner sees which rule passed or failed and why.

## Hands-on labs

- List exact prerequisites (tool, version, install URL, verify command).
- Commands are tagged by platform (`bash` | `powershell` | `any`) and show
  realistic names, numbers, regions.
- `expectedOutput` shows the learner what success looks like.
- Validation is a `validationChecklist` the learner marks manually.
- The platform never claims it validated the result for the learner.

## Challenge labs

- `scenario`, `requirements`, `constraints`, `decisions` (each with
  `options`), and at least one `ChallengeSolution` with `tradeoffs`.
- `ChallengeSolution.decisionValues` and `ChallengeOption.id`s must
  reference ids that exist (enforced by tests in Cloud Fundamentals;
  planned for Kubernetes).
- Per-option `feedback` is shown whether or not the learner's combination
  matches a solution. Absence of a verdict does not imply the design is
  wrong.

## Tests

- Unit tests next to the pure logic (`*.simulations.test.ts`), covering:
  `computeHistory(sim, params)` determinism (same params → identical history),
  step-by-step history integrity / immutability (earlier states remain intact
  after later steps so step-back works), boundary parameters, and exported
  helper functions or `ValidationRule.check` on known-good and known-bad states.
- Do not duplicate what `index.test.ts` already enforces.
