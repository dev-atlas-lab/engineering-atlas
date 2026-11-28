# AGENTS.md — Engineering Atlas

This file is the entry point for AI coding agents (Google Antigravity, Cursor, Codex,
Aider, Copilot, etc.) working in this repository. It complements the existing
[CLAUDE.md](CLAUDE.md), which remains the canonical Claude Code instruction set.
When guidance here and in `CLAUDE.md` overlap, both apply; when they conflict,
`CLAUDE.md` takes precedence because it is reviewed as part of the codebase.

Before doing any non-trivial work, read:

1. This file.
2. [CLAUDE.md](CLAUDE.md) — repository-wide instructions, content standards, constraints.
3. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system layers and data flow.
4. [docs/CONTENT_MODEL.md](docs/CONTENT_MODEL.md) — how learning content is structured.
5. [docs/decisions/](docs/decisions/) — the accepted ADRs, especially ADR-007 (per-concept loading) and ADR-008 (SVG-first visualization).
6. [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md) — milestone status, current slice.

Then consult the relevant agent workflow in [docs/agents/](docs/agents/).

---

## 1. Project Identity

Engineering Atlas is an **English-language, frontend-only, educational visual
learning platform**. Its purpose is to teach complex engineering concepts
through structured lessons, SVG architecture diagrams, deterministic
simulations, hands-on labs, knowledge checks, and progressive learning paths.

It is **not** a static documentation website, a glossary, or a wiki.
It is **not** a product that provisions cloud resources; it never talks to
cloud accounts or executes shell commands on behalf of the learner.

Tagline: **Understand systems. Explore architecture. Master engineering.**

---

## 2. Technical Constraints

These are hard constraints. Do not change them without an ADR and user approval.

- Frontend-only single-page application. No backend, no authentication, no
  remote database, no server runtime, no CMS, no content API.
- No cloud account integration and no arbitrary shell execution.
- All persistence is local to the browser (IndexedDB / LocalStorage).
- Simulations must be deterministic: same inputs produce same outputs. All
  non-deterministic sources (randomness, time) must be seeded or injected.
- Simulated results must be clearly distinguished from actual infrastructure
  results. Never claim a local lab was automatically verified.
- Content language is English only.

---

## 3. Verified Tech Stack

Pinned versions are listed in [package.json](package.json). As of this file:

| Area | Choice | Version |
|---|---|---|
| Runtime | Node | `>=22.22.0` |
| Framework | React | 19.3 |
| Language | TypeScript (strict) | 6 |
| Build | Vite | 8.3 |
| Styling | Tailwind CSS | 4.3 (via `@tailwindcss/vite`) |
| State | Zustand | 5.1 |
| Routing | `react-router` | 8.5 |
| Graph views | `@xyflow/react` (React Flow) | 13 (lazy-loaded) |
| Visualizations | Declarative SVG (first-party primitives) | — |
| Icons | `lucide-react` | 1 |
| Class names | `clsx` + `tailwind-merge` + `class-variance-authority` | — |
| Local storage | `idb-keyval` | 6.3 |
| Test runner | Vitest + jsdom + Testing Library | 5.1 |
| Lint | ESLint + `typescript-eslint` + `eslint-plugin-react-hooks` | 10 / 8 / 7 |

**Notes for agents:**

- Do not install Motion, D3, shadcn/ui, or MDX; the current implementation
  does not depend on them. If a task genuinely needs one, propose an ADR
  first (see [docs/decisions/ADR-005-frontend-dependency-strategy.md](docs/decisions/ADR-005-frontend-dependency-strategy.md)).
- Lesson content is authored as **structured TypeScript modules**, not MDX
  (ADR-005).
- React Flow is **lazy-loaded** and only used for scenes that opt in with
  `interaction: 'graph'`. Default scene rendering is declarative SVG (ADR-008).

---

## 4. Architecture Map

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full picture. The
agent-sized summary:

```
src/
├── app/                      Application shell, router, layout, theme
│   ├── router.tsx            Entry: wraps BrowserRouter and routes
│   ├── routes.tsx            Lazy page imports and route table
│   ├── layout/               AppShell (header, sidebar, outlet)
│   ├── breadcrumbs.ts        Deriving breadcrumbs from metadata
│   └── theme-context.tsx     Light/dark theme
├── content/                  Learning content — the curriculum
│   ├── types.ts              Content model types (single source of truth)
│   ├── providers.ts          Azure / AWS identifiers
│   ├── status.ts             ConceptStatus labels
│   ├── cloud-fundamentals/   Domain: Cloud Fundamentals
│   │   ├── index.ts          Eager metadata graph (no body imports)
│   │   ├── concept-loaders.ts  Per-concept dynamic imports (ADR-007)
│   │   ├── <category>/meta.ts  ConceptMeta[] for that category
│   │   └── <category>/<concept>.ts  Lesson/lab/simulation bodies
│   └── kubernetes-fundamentals/  Domain: Kubernetes Fundamentals
├── engines/
│   ├── visualization/        SVG + React Flow scene rendering (ADR-008)
│   │   ├── scene-renderer.tsx  Picks topology / sequence / graph
│   │   ├── svg/              Tokens, layout, primitives, legend
│   │   ├── react-flow-scene.tsx  Lazy-loaded graph scene
│   │   ├── timeline-controller.tsx  Step / scrub
│   │   └── component-inspector.tsx  Node details
│   ├── simulation/           Deterministic simulation engine
│   │   ├── types.ts          SimulationDefinition, SimulationParameter, SimulationStep
│   │   └── use-simulation.ts  computeHistory + React runtime hook
│   ├── lab/                  Lab UI
│   │   ├── simulation-lab-view.tsx
│   │   ├── hands-on-lab-view.tsx
│   │   ├── challenge-lab-view.tsx
│   │   ├── bind-simulation.tsx  Binds a sim to a per-lab render
│   │   └── lab-prerequisites.tsx
│   └── assessment/
│       └── knowledge-check.tsx  Question renderer and scoring
├── components/               Shared, non-engine UI (badges, status chips)
├── hooks/                    Shared React hooks
├── lib/                      Utility functions
├── pages/                    Route-level components (home, domain,
│                             category, concept, lesson, lab, not-found)
├── stores/                   Zustand stores — currently only progressStore
├── styles/                   Global CSS / Tailwind tokens
└── test/                     Test setup (jsdom, Testing Library matchers)
```

**Key architectural rules (authoring invariants — enforced by tests as noted):**

1. **Metadata/body split** (ADR-007). `content/<domain>/<category>/meta.ts`
   holds `ConceptMeta` with `lessons: LessonMeta[]` and `labs: LabMeta[]`.
   Bodies live in `content/<domain>/<category>/<concept>.ts` as a
   `ConceptContentModule`. Metadata never imports bodies; the eager index
   never pulls a content module. In Cloud Fundamentals,
   `src/content/cloud-fundamentals/index.test.ts` reads the source to enforce
   this; parity enforcement for Kubernetes Fundamentals is planned work.
2. **Concept IDs are globally unique across the whole index.** Progress is
   keyed by bare lesson and lab id, so collisions silently corrupt progress.
   Enforced across both domains by `cloud-fundamentals/index.test.ts` and
   `kubernetes-fundamentals/index.test.ts`.
3. **Each concept with lessons must have exactly one entry in
   `src/content/cloud-fundamentals/concept-loaders.ts`.** `coming-soon`
   concepts have no entry. Enforced by tests in both domains.
4. **Simulation labs' simulation id must match a binding in the concept's own
   `simulations` map.** Bind via `bindSimulation(simulation, renderState)` so
   each simulation's code ships only in that concept's chunk. Enforced by
   `cloud-fundamentals/index.test.ts`; parity enforcement for Kubernetes is
   planned work.
5. **Sequence scenes have exactly `edges.length + 1` states.** Topology
   scenes may have any number ≥1; `states[0]` is always the initial view.
   Enforced by `cloud-fundamentals/index.test.ts`; parity enforcement for
   Kubernetes is planned work.
6. **Active status is listed explicitly (Cloud Fundamentals).**
   `src/content/cloud-fundamentals/index.test.ts` keeps an `ACTIVE_CONCEPTS`
   allow-list; changing a Cloud Fundamentals concept to `available` is a
   deliberate edit to that list, not a side effect.
   `src/content/kubernetes-fundamentals/index.test.ts` currently enforces
   domain registration, category order, non-empty descriptions and lessons,
   concept ID uniqueness, loader presence, and expected lab IDs — it does
   not yet run an `ACTIVE_CONCEPTS` allow-list or deep loaded-content,
   metadata/body boundary, cross-link, scene-arity, or simulation-binding
   checks (those remain planned test coverage).

---

## 5. Routing

Centralised in [src/app/routes.tsx](src/app/routes.tsx). All pages are lazy
imports. URLs:

```
/                                                 Home / Domain Explorer
/:domainId                                        Domain overview
/:domainId/:categoryId                            Category overview
/:domainId/:categoryId/:conceptId                 Concept (default lesson)
/:domainId/:categoryId/:conceptId/:lessonId       Specific lesson
/:domainId/:categoryId/:conceptId/labs/:labId     Lab
```

The lesson workspace, visualisation region, and lab view are rendered inside
these pages; they are not routes of their own.

---

## 6. Content Authoring Rules

See [docs/CONTENT_MODEL.md](docs/CONTENT_MODEL.md) and
[docs/LAB_ENGINE.md](docs/LAB_ENGINE.md) for the full model. Every lesson
should answer, in some order and at the depth the topic deserves:

1. What the concept is.
2. Why it exists.
3. What problem it solves.
4. How it works internally.
5. Its architecture and lifecycle.
6. Practical examples.
7. Failure modes.
8. Troubleshooting.
9. Common misconceptions.
10. Knowledge checks.

Do not write shallow glossary-style lessons. Prioritise understanding
mechanisms and trade-offs over definitions. When comparing providers, be
honest about architectural differences — never claim two services are
"basically the same" unless they genuinely are.

Cross-link related concepts via `prerequisites` and `relatedConcepts` in
`ConceptMeta`. Do not duplicate explanations across concepts.

---

## 7. Visualization Rules

See [docs/SVG_VISUALIZATION_STANDARD.md](docs/SVG_VISUALIZATION_STANDARD.md).
The summary:

- Prefer declarative SVG scenes built from `SceneDefinition` in
  [src/engines/visualization/types.ts](src/engines/visualization/types.ts).
- Use `type: 'topology'` for architectures, `type: 'sequence'` for protocol /
  lifecycle exchanges, and `interaction: 'graph'` (React Flow) **only** when
  node dragging or graph navigation is part of the lesson.
- Use the shared visual language: node primitives (`server`, `database`,
  `loadbalancer`, …), `edgeType` (`request`, `response`, `data`, `dependency`,
  `network`), `flow` (`allow`, `deny`, `blocked`, `pending`), and `boundaries`.
  Do not hard-code colours — the SVG tokens adapt to light/dark.
- Explicitly mark denied and blocked paths; never leave a denial looking like
  an ordinary edge.
- Diagrams must be responsive and accessible (a `description` becomes the
  SVG `<desc>`). Avoid decorative diagrams that do not improve understanding.

---

## 8. Interactive Lab Rules

See [docs/LAB_ENGINE.md](docs/LAB_ENGINE.md). The rules:

- A lab's simulation logic is **pure TypeScript**, separate from React. Put
  the `SimulationDefinition<TState>` (`createInitialState`, `steps`/`apply`)
  next to its concept module, keep the view in a `*-simulation-views.tsx`
  (or in the concept's `simulations` map via `bindSimulation`), and write
  unit tests against `computeHistory` and helper logic.
- Simulations must be deterministic and non-mutating. Expose user-controllable
  parameters via `SimulationParameter[]`, and validate state via
  `SimulationLab.validationRules`. Step-forward, step-back, and reset (via
  `useSimulation`) must preserve earlier history snapshots accurately.
- Real state transitions, not cosmetic ones. A lab that only changes labels
  or colours does not model anything and should be a diagram instead.
- Model realistic failure scenarios and provide contextual feedback.
- Hands-on labs state prerequisites, exact commands (with platform where
  relevant), expected output, and a validation checklist the learner self-marks.
  The platform never claims it has verified the result for the learner.

---

## 9. Engineering Standards

- Work **with** the existing architecture before introducing new abstractions.
  Three similar lines is better than a premature abstraction.
- Do not add dependencies lightly. Evaluate alternatives, check bundle cost,
  record the decision in an ADR if it is material (ADR-005).
- TypeScript strict mode is on. Types are explicit at module boundaries;
  avoid `any`.
- Prefer composition over inheritance. One responsibility per component.
- Named exports. Default exports only for route-level page components (so the
  lazy router can `import()` them).
- Reuse shared components, hooks, and SVG primitives.
- Do not refactor unrelated code during a feature task.
- Do not introduce a backend runtime, server endpoint, or build-time content
  API.
- Do not change product behaviour unless the task explicitly asks for it.
- Keep content IDs globally unique and preserve existing domain / category /
  concept registrations.

---

## 10. Git Workflow

- Branch names describe the work: `feat/<domain>-<slice>`, `fix/<area>-<issue>`,
  `docs/<area>`, `chore/<area>`.
- Current main branch: `main`.
- Conventional commit messages: `feat(scope): …`, `fix(scope): …`,
  `docs(scope): …`, `refactor(scope): …`, `test(scope): …`, `chore(scope): …`.
- One logical change per commit.
- **Never commit directly to `main`** unless the user explicitly requests it.
- **Never force-push, never rewrite history, never skip hooks** unless the
  user explicitly asks.
- **Never merge branches or create pull requests unless explicitly requested.**
- Run `git status` before any command that could discard uncommitted work.

Before making changes:

1. Confirm the current branch.
2. Read `git status` and `git log --oneline -20`.
3. Identify the latest appropriate base.

---

## 11. Validation Policy

Do **not** run the entire test suite for ordinary feature tasks. Prefer:

- Vitest for the files directly affected and any related simulation / content
  module tests: `npm test -- <path-pattern>`.
- `npm run lint`.
- `npm run typecheck`.
- `npm run build` — a successful production build is mandatory before
  committing feature work (it runs `tsc -b` then `vite build`, so it also
  guards against type regressions in the whole project).

On Windows PowerShell, if execution policy blocks `npm.ps1` / `npx.ps1`, run
commands via `cmd /c npm ...` (for example `cmd /c npm run lint`). Do not
modify the user's PowerShell execution policy.

If pre-existing baseline failures surface:

- Identify whether they are pre-existing (`git stash && npm test -- …`).
- Do **not** modify unrelated tests to hide them.
- Report them honestly in the final summary.

Never claim tests passed unless they actually ran.

---

## 12. Agent Behaviour

Behave as an engineering collaborator, not an auto-completer:

- Read the project instructions and the relevant code **before** proposing or
  making changes.
- Understand existing patterns and extend them; do not re-invent them.
- Challenge technically incorrect assumptions (including the user's) politely
  and with evidence from the code.
- Explain material trade-offs when choosing between approaches.
- Avoid scope expansion; implement the requested change, not its neighbours.
- Implement authorised tasks end-to-end without re-asking permission for
  every small step.
- Report incomplete work honestly, including skipped checks.

**Approval required** before:

- Deleting or renaming any important file.
- Overwriting any important configuration file.
- Removing an existing ADR, architecture document, or agent instruction.
- Any destructive git operation (`reset --hard`, `clean -f`, `checkout --`,
  force-push, history rewrite).
- Removing or downgrading a dependency.
- Changing product behaviour not explicitly requested.
- Introducing a backend, a build-time content API, or any new dependency.

For normal, non-destructive implementation tasks, proceed autonomously.

Important files include, but are not limited to: `CLAUDE.md`, `AGENTS.md`,
`README.md` (if added), `package.json`, `package-lock.json`, `tsconfig*.json`,
`vite.config.ts`, `eslint.config.js`, `vercel.json`, every file under `docs/`
and `docs/decisions/`, every file under `src/content/**/meta.ts` and
`src/content/**/index.ts`, and `src/content/types.ts`.

---

## 13. Reusable Workflows

Prescriptive, step-by-step playbooks for the recurring tasks in this
repository. Native Antigravity Skills under [.agents/skills/](.agents/skills/)
are the primary way to invoke these. The Phase 1 workflow documents in
[docs/agents/](docs/agents/) are preserved as reference material — the
Skills summarise them and, where useful, link out to deeper reference
files inside the skill directory.

### Native Antigravity Skills (invoke these)

- **implement-learning-domain** — [.agents/skills/implement-learning-domain/SKILL.md](.agents/skills/implement-learning-domain/SKILL.md)
  — authoring or extending a concept, category, or domain. References:
  [content-quality.md](.agents/skills/implement-learning-domain/references/content-quality.md),
  [domain-integration.md](.agents/skills/implement-learning-domain/references/domain-integration.md).
- **review-educational-content** — [.agents/skills/review-educational-content/SKILL.md](.agents/skills/review-educational-content/SKILL.md)
  — reviewing lessons, provider details, scenes, and knowledge checks.
- **implement-interactive-lab** — [.agents/skills/implement-interactive-lab/SKILL.md](.agents/skills/implement-interactive-lab/SKILL.md)
  — adding a simulation, hands-on, or challenge lab to an existing concept.
- **validate-and-prepare-commit** — [.agents/skills/validate-and-prepare-commit/SKILL.md](.agents/skills/validate-and-prepare-commit/SKILL.md)
  — targeted vitest / lint / typecheck / build run plus git review, before
  any commit suggestion.
- **write-architecture-decision** — [.agents/skills/write-architecture-decision/SKILL.md](.agents/skills/write-architecture-decision/SKILL.md)
  — drafting a new ADR for a material architectural change. Starts
  `Proposed`; the user promotes to `Accepted`.

### Historical workflow documents (reference)

- [docs/agents/ARCHITECTURE_OVERVIEW.md](docs/agents/ARCHITECTURE_OVERVIEW.md)
  — agent-oriented architecture map (still the fastest briefing).
- [docs/agents/WORKFLOW_IMPLEMENT_DOMAIN.md](docs/agents/WORKFLOW_IMPLEMENT_DOMAIN.md)
- [docs/agents/WORKFLOW_REVIEW_CONTENT.md](docs/agents/WORKFLOW_REVIEW_CONTENT.md)
- [docs/agents/WORKFLOW_IMPLEMENT_LAB.md](docs/agents/WORKFLOW_IMPLEMENT_LAB.md)
- [docs/agents/WORKFLOW_VALIDATE_COMMIT.md](docs/agents/WORKFLOW_VALIDATE_COMMIT.md)

## 14. Native Antigravity Customization

This workspace is configured for Google Antigravity's native customization
layout under [.agents/](.agents/). The structure:

```
.agents/
├── rules/                    Always-on invariants + glob-scoped rules
│   ├── project-core.md                  (trigger: always_on)
│   ├── testing-and-git.md               (trigger: always_on)
│   ├── content-authoring.md             (trigger: glob — src/content/**)
│   ├── visualization.md                 (trigger: glob — scenes + engine)
│   └── simulation-engineering.md        (trigger: glob — sim + lab engine)
├── skills/                   Reusable, slash-invokable procedures (see §13)
│   ├── implement-learning-domain/
│   ├── review-educational-content/
│   ├── implement-interactive-lab/
│   ├── validate-and-prepare-commit/
│   └── write-architecture-decision/
├── agents/                   Specialised custom subagents the main agent delegates to
│   ├── educational-content-reviewer.md
│   ├── architecture-reviewer.md
│   ├── simulation-engineer.md
│   └── qa-reviewer.md
├── mcp_config.example.json   Committed template for workspace MCP servers (GitHub + Playwright)
└── mcp_config.json           Gitignored active config — holds the GitHub PAT; copy from .example
```

**MCP servers** (see `docs/agents/MCP_INTEGRATION.md`):

- `github` (stdio, Docker) — read-only inspection of the repo, PRs,
  issues, Actions. Requires a minimally-scoped GitHub PAT.
- `playwright` (stdio, npx) — browser automation against the local dev
  server for UI/accessibility checks. No credentials.

**Operations and orchestration documentation:**

- [docs/agents/ANTIGRAVITY_OPERATIONS.md](docs/agents/ANTIGRAVITY_OPERATIONS.md)
  — opening the repo, invoking skills, delegating to agents, using the
  MCP servers, recommended flow for a slice.
- [docs/agents/AGENT_ORCHESTRATION.md](docs/agents/AGENT_ORCHESTRATION.md)
  — how the main agent delegates to the review agents and resolves
  conflicts.
- [docs/agents/MCP_INTEGRATION.md](docs/agents/MCP_INTEGRATION.md) —
  per-server setup, credential handling, verification, troubleshooting.

**How to use it in Antigravity.**

- **Rules** load automatically. The two `always_on` rules are in context
  every turn. The three `glob` rules activate when matching files are
  touched (content, visualization, simulation). Nothing to invoke.
- **Skills** can be invoked implicitly (the agent picks one that fits) or
  explicitly by slash command — `/implement-learning-domain`,
  `/review-educational-content`, `/implement-interactive-lab`,
  `/validate-and-prepare-commit`, `/write-architecture-decision`. Run
  `/skills reload` after editing a skill file.
- **Custom agents** are invoked by the main agent via
  `invoke_subagent` (or selected in `/agents`). Use
  `educational-content-reviewer` for content QA, `architecture-reviewer`
  for architectural soundness, `simulation-engineer` for simulation/lab
  engineering review, and `qa-reviewer` for running targeted validation
  commands. They report to the main agent, which integrates and talks to
  the user.

## 15. Claude Code Compatibility

[CLAUDE.md](CLAUDE.md) remains the canonical Claude Code instruction set
and is aligned with `AGENTS.md` on the verified tech stack and `src/` layout.
This `AGENTS.md`, the `docs/agents/` workflow documents, and the `.agents/`
native layout are additive. There is no conflict in practice; when guidance
overlaps, both apply, and when it diverges, `CLAUDE.md` takes precedence
because it is reviewed as part of the codebase (also stated at the top of
this file).

---

## 16. Roadmap Context

The current active work is the Cloud Fundamentals + Kubernetes Fundamentals
curriculum. See [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md) for the
slice breakdown and [docs/CLOUD_FUNDAMENTALS_CURRICULUM.md](docs/CLOUD_FUNDAMENTALS_CURRICULUM.md)
for concept-level coverage. Do not start a new milestone without explicit
approval. Do not retroactively change milestone exit criteria.
