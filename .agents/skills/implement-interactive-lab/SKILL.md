---
name: implement-interactive-lab
description: Use when adding an interactive simulation, hands-on, or challenge lab to a concept in Engineering Atlas. Produces a pure deterministic simulation definition, a React lab view, a lab definition, tests, and loader bindings.
---

# Implement an Interactive Lab

Use this skill when the task asks for a new lab on an existing concept.
For a brand-new concept, use `implement-learning-domain` and come back
here for each lab.

## Before you start

Read `docs/LAB_ENGINE.md` and `src/engines/simulation/types.ts`. The glob
rule `simulation-engineering.md` loads when you touch simulation / lab /
view files. For simulation labs, sketch the state model, parameters, and
ordered steps before writing code.

## Simulation labs

1. **Learning objectives.** One sentence each — the `LabBody.learningObjectives`.
2. **State model and parameters.** Minimal, serializable TypeScript `TState`
   for the state the learner inspects. Define `SimulationParameter[]`
   (`'number' | 'select' | 'boolean' | 'text'`) for user-controllable
   parameters.
3. **Initial state and steps.** Author pure `createInitialState(params)` and
   `steps(params): SimulationStep<TState>[]` where each step's
   `apply(state, params) → nextState` is pure and never mutates `state` in
   place. No `Math.random`, `Date.now`, `fetch`, or module-level mutable state.
4. **Validation rules.** Define `ValidationRule[]` (`{ id, label, check: (state: unknown) => boolean }`)
   on `SimulationLab.validationRules` (`src/content/types.ts`). Ensure at
   least one authored parameter combination or intermediate step fails a rule
   or triggers an explicit failure state.
5. **Simulation definition.** Compose `id`, `title`, `description`,
   `parameters`, `createInitialState`, and `steps` into a
   `SimulationDefinition<TState>` (see `src/engines/simulation/types.ts`).
6. **Unit tests** in `*.simulations.test.ts` next to the module using
   `computeHistory(simulation, params)` from `src/engines/simulation/use-simulation.ts`:
   - Deterministic `params` → identical `history` and expected step states.
   - Immutability / history integrity: earlier `history[i].state` entries are
     not mutated by later steps, so step-forward and step-back stay exact.
   - Boundary parameters don't corrupt state.
   - Validation helpers / `ValidationRule.check` accept known-good and reject
     known-bad states.
7. **Lab view.** Add a pure presentation function
   `renderState(state: TState): ReactNode` (or an entry in `*-simulation-views.tsx`)
   using shared visual tokens. `SimulationLabView` automatically renders
   `ParameterControl` for `simulation.parameters`, `TimelineController` for
   stepping, `content.instructions`, and `content.validationRules`.
8. **Binding.** In the concept's content module, add to the `simulations`
   map via `bindSimulation(simulation, renderState)`. The simulation id
   must equal the lab's `content.simulationId`.
9. **Lab metadata and body.** Add `LabMeta` (id, title, type) to the
   concept's `ConceptMeta.labs`. Add the `LabBody` to the module's `labs`
   map, with `prerequisites`, `estimatedTime`, `difficulty`,
   `learningObjectives`, and `content: SimulationLab { simulationId,
   instructions, parameters, validationRules }` (`parameters` on `SimulationLab`
   is normally `[]` because `SimulationLabView` renders `simulation.parameters`).
10. **Failure scenarios.** Ensure the lab has at least one parameter
    combination that produces a failure state or fails a `ValidationRule`,
    and (where it fits) a progression gate the learner must clear.

## Hands-on labs

Fill a `HandsOnLab`:

- `environment`: each `EnvironmentRequirement` with `tool`, `version?`,
  `installUrl`, and a `verifyCommand` the learner can run.
- `tasks`: ordered `LabTask`s. For each — concrete instructions, optional
  `commands` (tag platform: `bash`, `powershell`, or `any`), a realistic
  `expectedOutput`, hints, and a `validationChecklist` the learner marks
  themselves.
- Optional `starterFiles` with realistic content.
- `cleanupInstructions` so the learner can tear down any resources.

Never claim the platform validated the result for the learner. Use
language like "check that your output matches", not "verified".

## Challenge labs

Fill a `ChallengeLab`:

- `scenario`, `requirements`, `constraints` — concrete, not generic.
- `decisions[]` with `options[]`. Each option can carry per-option
  `feedback` (`effective` / `partial` / `ineffective` + text) shown after
  evaluation.
- At least one `ChallengeSolution` with `decisionValues` referencing
  existing decision/option ids, `assessment`, `explanation`, and
  `tradeoffs`. Test enforces id integrity.
- Absence of an overall verdict never implies the learner's design is
  wrong — per-option feedback carries the message.

## Acceptance criteria

- `SimulationDefinition` (`createInitialState`, `steps`, `apply`) is pure,
  deterministic, and non-mutating; tests cover `computeHistory`, history
  immutability, boundary parameters, and validation checks.
- Lab view (`renderState`) is a thin presentation layer; no business logic in
  the view.
- Lab metadata and body ids match; simulation binding exists for simulation
  labs; `simulation.id` matches `content.simulationId`.
- Failure path exists and surfaces actionable feedback.
- Challenge solutions and option ids all resolve.
- Targeted vitest, lint, typecheck, build all pass.

## Stop and ask

- The state model depends on real-time or external events (there is no way
  to make this deterministic without a product-level decision).
- A simulation lab would require significant new engine code rather than
  reusing the existing engine.
- The scenario cannot fail — i.e. there is no meaningful failure path to
  author.
