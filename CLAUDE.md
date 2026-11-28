# Engineering Atlas — Project Instructions

## Product Vision

Engineering Atlas is an interactive software engineering learning platform.
It helps engineers understand how technologies, infrastructure, and complex systems work internally through interactive visualizations, step-by-step walkthroughs, browser-based experiments, and hands-on labs.

Tagline: **Understand systems. Explore architecture. Master engineering.**

## Technical Constraints

- Frontend-only application. No backend, no authentication, no remote database.
- No cloud account integration or arbitrary shell execution.
- Local persistence only (IndexedDB / LocalStorage).
- Simulations must be deterministic where applicable.
- Always distinguish simulated results from actual infrastructure results.
- Content language: English only.

## Tech Stack

- React + TypeScript (strict) + Vite
- Tailwind CSS + `lucide-react` + `clsx` / `tailwind-merge` / `class-variance-authority`
- Declarative SVG (first-party visualization primitives)
- React Flow (`@xyflow/react`, lazy-loaded for `interaction: 'graph'` scenes)
- Zustand (state management)
- IndexedDB (`idb-keyval`) / LocalStorage (persistence)
- Structured TypeScript content modules (per-concept lazy loading)

## Coding Principles

- Keep the architecture simple. Avoid premature abstraction.
- Do not add features, refactoring, or abstractions beyond what the task requires.
- Evaluate dependencies before installing them.
- Write TypeScript with strict mode enabled.
- Prefer composition over inheritance.
- Keep components focused — one responsibility per component.
- Use named exports. Avoid default exports except for pages/routes.
- Do not generate placeholder content or mock data beyond what is needed for the current task.

## Documentation Requirements

- Keep documentation concise, actionable, and technically accurate.
- Architecture Decision Records (ADRs) live in `docs/decisions/`.
- Product and design docs live in `docs/`.
- Do not create README files unless explicitly requested.

## Content Quality Standards

- Technical content must be accurate. Do not invent technical facts.
- Distinguish common engineering concepts from provider-specific implementations.
- Distinguish provider-specific terminology from generic terminology.
- Do not claim two provider services are technically identical unless they are.
- When comparing providers, explain architectural differences honestly.
- Labs must clearly state prerequisites, expected results, and validation criteria.
- Do not pretend a lab was automatically verified when the platform only provides instructions.

## Testing Expectations

- Unit tests for state logic, simulation engines, and content model utilities.
- Component tests for interactive visualizations and lab controls.
- Integration tests for learning flows and lab sequences.
- Visual regression tests for key visualization components.
- Test deterministic simulations with known inputs and expected outputs.

## Agent Workflow

- For major architectural decisions: identify the problem, present alternatives, explain trade-offs, recommend an approach, and wait for approval when necessary.
- Do not start a new milestone without explicit approval.
- Do not install dependencies or implement UI during documentation milestones.
- Keep commits focused. One logical change per commit.

## Content Model

Learning content follows a concept-first strategy:

1. Introduce a common engineering concept.
2. Explain the underlying problem and fundamental principles.
3. Show how each provider implements the concept.
4. Compare architectural approaches, capabilities, limitations, and trade-offs.
5. Provide interactive experiments and practical labs.

Hierarchy: Domain > Category > Concept > Lesson
Provider implementations are linked to concepts, not to the top-level hierarchy.

## Project Structure

```
docs/                    # Product and architecture documentation
  decisions/             # Architecture Decision Records
src/
  app/                   # Application shell, routing, layout, theme
  content/               # Learning domain content, metadata, and loaders
  engines/               # Core engines (visualization, simulation, lab, assessment)
  components/            # Shared UI components
  hooks/                 # Shared React hooks
  lib/                   # Utilities and helpers
  pages/                 # Route-level page components
  stores/                # Zustand state stores (local persistence)
  styles/                # Global CSS and Tailwind tokens
  test/                  # Vitest / jsdom test setup
public/                  # Static assets
```
