# Workflow — Implement an Interactive Lab

Use this workflow for simulation labs (browser-only, deterministic). For
hands-on labs the user runs on their own machine, author the `HandsOnLab`
record directly inside the concept's content module and skip the simulation
engine steps. For challenge labs, author `ChallengeLab` directly.

> Read [../LAB_ENGINE.md](../LAB_ENGINE.md) and `src/engines/simulation/types.ts` first.
> Primary Antigravity skill: [.agents/skills/implement-interactive-lab/SKILL.md](../../.agents/skills/implement-interactive-lab/SKILL.md).

---

## Steps

### 1. Define learning objectives

Write down, in one sentence each, what the learner should be able to do or
explain after completing the lab. These become `LabBody.learningObjectives`.

### 2. Define simulation state and parameters

- What are the entities the learner inspects?
- What is the minimal state (`TState`) that captures them?
- What are the user-controllable parameters (`SimulationParameter[]` in
  `src/engines/simulation/types.ts`, supporting `'number' | 'select' | 'boolean' | 'text'`)?

State shape goes in a plain TypeScript type next to the concept module, or
in the concept module itself. Keep it small and serialisable.

### 3. Define domain rules, initial state, and steps

- How is initial state derived from parameters (`createInitialState(params)`)?
- What ordered steps occur (`steps(params): SimulationStep<TState>[]`)?
- How does `apply(state, params)` transform state at each step?
- Which rules on `SimulationLab.validationRules` (`ValidationRule[]` with
  `check(state) => boolean` in `src/content/types.ts`) verify a valid state?

`createInitialState` and each step's `apply(state, params)` must be **pure**
and **deterministic** — no `Math.random()`, no `Date.now()`, no `fetch`, and
no in-place state mutation (so `computeHistory` history entries stay intact
for step-back). If you need randomness or time, seed it or inject it as a
parameter.

### 4. Implement pure, testable simulation logic

- Put `createInitialState`, `steps`, `apply`, and exported domain helpers in
  a plain `.ts` file next to the concept module.
- Expose them through a `SimulationDefinition<TState>` object
  (see `src/engines/simulation/types.ts`).
- `useSimulation(def)` (`src/engines/simulation/use-simulation.ts`) calls
  `computeHistory(def, params)` for the React runtime (`stepForward`,
  `stepBackward`, `stepTo`, `reset`, `setParameter`, `history`).

### 5. Write unit tests against the pure logic

- Deterministic `computeHistory(def, params)` output for known inputs.
- History immutability across steps so step-forward and step-back preserve
  earlier snapshots.
- Boundary parameters do not corrupt state.
- Exported helper logic / `ValidationRule.check` accepts known-good states
  and rejects known-bad ones.

Put the tests in `*.simulations.test.ts` next to the simulation file (the
existing Kubernetes `simulations.test.ts`, `operations-simulations.test.ts`,
and `security-simulations.test.ts` files are examples of this layout).

### 6. Build the UI

- Create a pure `renderState(state: TState)` view function (or add an entry
  to `*-simulation-views.tsx` in the domain/concept folder).
- Bind the simulation to the lab in the concept's `simulations` map via
  `bindSimulation(simulation, renderState)`. The simulation's `id` must match
  the `LabBody.content.simulationId` (and the key in `simulations`).
- Use shared visualisation primitives/tokens where they fit. Do not hard-code
  colours.
- `SimulationLabView` (`src/engines/lab/simulation-lab-view.tsx`) renders
  `ParameterControl` automatically from `simulation.parameters` alongside
  `TimelineController` and `content.validationRules`.

### 7. Add failure scenarios

A lab that only shows the happy path teaches less. Include:

- A parameter combination that leads to a failure state or fails a
  `ValidationRule` on `SimulationLab.validationRules`.
- A progression gate where earlier steps must complete before the final
  state satisfies the validation rule.

### 8. Add contextual feedback

- Per-step `SimulationStep.description` and `LabStep.description` explain
  what to observe, not just "click".
- `SimulationLabView` renders `SimulationLab.validationRules` automatically,
  and `renderState` surfaces clear diagnostic reasons when a step fails.

### 9. Final wiring

- Add the `LabMeta` to the concept's `ConceptMeta.labs` in
  `<category>/meta.ts`.
- Add the `LabBody` to the concept module's `labs` map.
- Add the simulation binding to the module's `simulations` map.
- Ensure every lab referenced in metadata has a body, and every simulation
  referenced by a lab has a binding (tests enforce this).

### 10. Validate

- Vitest for the simulation tests and the concept's test file.
- Lint, typecheck, build.
- Open the lab in the dev server and run through it manually, including at
  least one failing path.
