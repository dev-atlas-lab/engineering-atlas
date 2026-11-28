---
trigger: always_on
description: Core project invariants for Engineering Atlas that must always apply.
---

# Engineering Atlas — Core Invariants

Engineering Atlas is an English-language, frontend-only educational visual
learning platform. It teaches complex engineering concepts through structured
lessons, SVG diagrams, deterministic simulations, hands-on labs, and knowledge
checks. It is not a documentation site, a glossary, or a wiki.

## Hard constraints (do not change without an ADR + user approval)

- Frontend-only SPA. No backend, no server runtime, no remote database, no
  authentication, no CMS, no content API.
- No cloud-account integration and no arbitrary shell execution on behalf of
  the learner.
- Persistence is local to the browser only (IndexedDB via `idb-keyval`,
  LocalStorage for small values).
- Simulations are deterministic. No `Math.random()`, no `Date.now()`, no
  `fetch` inside simulation reducers. Seed or inject non-determinism.
- Simulated results must be visibly distinct from real infrastructure
  results. Never claim a local hands-on lab was automatically verified.
- Content language is English only.

## Architectural posture

- Work with the existing architecture before introducing new abstractions.
  Three similar lines is better than a premature abstraction.
- Named exports. Default exports only for route-level page components.
- TypeScript strict is on. Types explicit at module boundaries. Avoid `any`.
- Composition over inheritance. One responsibility per component.
- Preserve existing domain / category / concept registrations.
- Concept IDs are globally unique across the whole content index (progress
  is keyed by bare lesson/lab id — collisions corrupt progress).

## Decisions that belong to the user

- Product scope and milestone definition.
- Architecture choices (ADR-level decisions).
- Adding or removing a dependency.
- Promoting a concept to `available` status.
- Anything that changes product behaviour not explicitly requested.

For normal non-destructive implementation tasks, proceed autonomously.

## Required reading before non-trivial work

- `AGENTS.md`
- `CLAUDE.md`
- `docs/ARCHITECTURE.md` and `docs/agents/ARCHITECTURE_OVERVIEW.md`
- `docs/CONTENT_MODEL.md`
- The accepted ADRs in `docs/decisions/`, especially ADR-007 (per-concept
  content loading) and ADR-008 (SVG-first visualization).
