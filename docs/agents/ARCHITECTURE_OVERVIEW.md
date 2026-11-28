# Architecture Overview — for Agents

A compact, agent-oriented summary of Engineering Atlas. For the human-authored
long form, read [../ARCHITECTURE.md](../ARCHITECTURE.md). Both are authoritative.

---

## Layers

```
Router (react-router, lazy routes)
  └── AppShell  (src/app/layout/app-shell.tsx)
        ├── Sidebar  (domain / category / concept browser)
        └── <Outlet />
              ├── HomePage           src/pages/home.tsx
              ├── DomainPage         src/pages/domain.tsx
              ├── CategoryPage       src/pages/category.tsx
              ├── ConceptPage        src/pages/concept.tsx
              ├── LessonPage         src/pages/lesson.tsx   → Lesson workspace
              │     ├── Lesson content (data-driven blocks)
              │     ├── Visualization region (scene renderer)
              │     └── Knowledge check
              └── LabPage            src/pages/lab.tsx     → Lab workspace
                    ├── Prerequisites
                    └── Simulation | Hands-on | Challenge view
```

## Content pipeline

```
Metadata (eager; in the entry bundle):
  src/content/<domain>/index.ts
  src/content/<domain>/<category>/meta.ts
  src/content/<domain>/<category>/index.ts
  → Domain, Category, ConceptMeta, LessonMeta[], LabMeta[]

Content (lazy; one chunk per concept):
  src/content/<domain>/<category>/<concept>.ts
  src/content/<domain>/<category>/<concept>.scenes.ts   (optional)
  → ConceptContentModule { lessons, labs, simulations }

Loader:
  src/content/cloud-fundamentals/concept-loaders.ts
  → one explicit dynamic import per concept with lessons
  → conceptContentLoader.load(conceptId) caches; a failure is NOT cached
  → useConceptContent(conceptId) exposes loading / ready / error to pages
```

Metadata files **never** import content modules. A test enforces this by
reading their source. Discovery pages read only metadata. Lesson and lab
pages render their heading, breadcrumbs, and navigation from metadata
immediately, then render the body when it resolves.

## Core types (src/content/types.ts)

- `Domain { id, title, description, categories }`
- `Category { id, title, description, concepts: ConceptMeta[] }`
- `ConceptMeta { id, title, status, learningObjectives?, prerequisites?, relatedConcepts?, lessons?: LessonMeta[], labs?: LabMeta[] }`
- `LessonMeta { id, title, kind, providerId? }` (eager navigation metadata)
- `LessonBody { learningObjectives, sections: LessonSection[], visualization?, knowledgeCheck?, providerDetails?, furtherReading? }`
- `LabMeta { id, title, type }`
- `LabBody { difficulty, estimatedTime, description, learningObjectives, prerequisites, content: SimulationLab | HandsOnLab | ChallengeLab }`
- `ContentBlock` (lesson DSL): `paragraph | list | code | callout | comparisonTable`
- `ConceptContentModule { lessons, labs, simulations }`
- `ConceptStatus = 'available' | 'in-development' | 'coming-soon'`
- `ProviderId = 'azure' | 'aws'`

## Visualization engine (src/engines/visualization/)

- `SceneDefinition` has `type: 'topology' | 'sequence'`, `nodes`, `edges`,
  `states`, optional `boundaries`, optional `interaction` (default static SVG;
  `'graph'` triggers React Flow, which is lazy-loaded).
- `scene-renderer.tsx` dispatches to the right strategy. SVG primitives,
  tokens, layout helpers, and legend live in `svg/`.
- `timeline-controller.tsx` steps through `states[]`. Sequence scenes require
  `states.length === edges.length + 1`.
- `component-inspector.tsx` renders details for a selected node.
- `resolveSceneAtState(scene, i)` merges `nodeOverrides` / `edgeOverrides`
  from state `i` onto the base nodes/edges.

## Simulation engine (src/engines/simulation/)

- `types.ts` defines `SimulationDefinition<TState>` with `id`, `title`,
  `description`, `parameters: SimulationParameter[]`,
  `createInitialState: (params: SimulationParams) => TState`, and
  `steps: (params: SimulationParams) => SimulationStep<TState>[]` (each step
  has `id`, `label`, `description`, and pure
  `apply: (state: TState, params: SimulationParams) => TState`).
- `use-simulation.ts` provides pure `computeHistory(def, params)` (builds the
  full `SimulationHistoryEntry<TState>[]` deterministically from
  `createInitialState` and `steps`) and the React hook `useSimulation(def)`:
  `stepForward`, `stepBackward`, `stepTo`, `reset`, `setParameter`, `history`.
- `parameter-control.tsx` renders `SimulationParameter` controls
  (`'number' | 'select' | 'boolean' | 'text'`).
- A simulation is pure TypeScript. The lab view binds it to UI through
  `bindSimulation(simulation, renderState)` in the concept's content module,
  so each simulation's code is in that concept's chunk.
- Validation rules (`ValidationRule[]` with `check: (state: unknown) => boolean`)
  live on `SimulationLab.validationRules` (`src/content/types.ts`) and are
  evaluated against `sim.current.state` by `SimulationLabView`.

## Lab engine (src/engines/lab/)

- `simulation-lab-view.tsx` — hosts a bound simulation.
- `hands-on-lab-view.tsx` — prerequisites, tasks, commands, expected output,
  validation checklist (self-marked).
- `challenge-lab-view.tsx` — scenario + decision options; authored solutions
  trigger an overall verdict when the combination matches; per-option feedback
  is shown whether or not a solution matched (so absence of verdict never
  implies the learner was wrong).
- `lab-prerequisites.tsx` — prerequisite rendering.

## Assessment engine (src/engines/assessment/)

- `knowledge-check.tsx` — renders `KnowledgeCheckQuestion[]`, supports
  single-choice, multi-select, and scenario questions, shows per-option
  explanations after submission.

## Persistence

- `stores/progress-store.ts` — Zustand store for completion state, backed by
  `idb-keyval` for durability.
- Preferences and theme live in LocalStorage via `app/theme-context.tsx`.
- No server sync. Graceful degradation when storage is unavailable.

## Routing (src/app/routes.tsx)

```
/
/:domainId
/:domainId/:categoryId
/:domainId/:categoryId/:conceptId
/:domainId/:categoryId/:conceptId/:lessonId
/:domainId/:categoryId/:conceptId/labs/:labId
```

All page components are lazy. The `AppShell` wraps them.

## Tests (collocated `*.test.ts(x)` + src/test/)

- `src/content/cloud-fundamentals/index.test.ts` — enforces unique ids,
  metadata/body split, loader registry completeness, explicit `ACTIVE_CONCEPTS`
  allow-list, `prerequisites`/`relatedConcepts` integrity, sequence scene
  arity, simulation binding integrity, and challenge solution integrity.
- `src/content/kubernetes-fundamentals/index.test.ts` — currently enforces
  domain registration, category list/order, non-empty descriptions and lessons,
  concept id uniqueness (within Kubernetes and against Cloud Fundamentals),
  loader registration, and lab ids. Deep loaded-content, metadata/body split,
  cross-link, scene-arity, and simulation-binding parity tests for Kubernetes
  are planned work (not yet enforced by `kubernetes-fundamentals/index.test.ts`).
- `src/content/cloud-fundamentals/concept-loaders.test.ts` — loader registry
  matches metadata; failures are typed `ContentLoadError`.
- `src/engines/**/.test.tsx` — component tests for the engines.
- `src/stores/progress-store.test.ts` — progress persistence.
- `src/pages/**/*.test.tsx` — page-level integration tests for the main
  learning flows.
- `src/app/content-loading.test.tsx` — end-to-end content loading via hook.
- `src/test/` — jsdom setup and Testing Library matchers.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server. |
| `npm run build` | `tsc -b && vite build`. Required pre-commit for features. |
| `npm run preview` | Preview the production build. |
| `npm run lint` | ESLint over `src/`. |
| `npm test` | `vitest run` — single pass. |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run typecheck` | `tsc -b --noEmit`. |

## Deployment

`vercel.json` is present. The build output goes to `dist/`. Static hosting;
no server component.
