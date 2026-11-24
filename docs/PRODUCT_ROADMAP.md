# Product Roadmap — Engineering Atlas

## Milestone Overview

| Milestone | Focus | Status |
|---|---|---|
| M0 | Product Foundation | Complete |
| M1 | Application Shell & Core Engines | Planned |
| M2 | First Learning Domain — Cloud Fundamentals | Planned |
| M3 | Interactive Labs & Simulations | Planned |
| M4 | Progress Tracking & Knowledge Checks | Planned |
| M5+ | Additional Domains | Future |

---

## M0 — Product Foundation

Establish product direction, architecture, and content model.

**Deliverables:**
- Product brief and roadmap.
- UX principles and visual direction.
- Architecture documentation.
- Content model and cloud content structure.
- Visualization and lab engine specifications.
- Architecture Decision Records.
- Project-level CLAUDE.md.

**No code. No dependencies. No UI.**

---

## M1 — Application Shell & Core Engines

Build the foundational application structure and core engine interfaces.

**Planned scope:**
- Project initialization (Vite + React + TypeScript + Tailwind).
- Application shell: layout, navigation, routing.
- Domain explorer: browse domains, categories, concepts.
- Learning workspace: render lesson content and visualizations.
- Visualization engine: scene definition, component rendering, state transitions.
- Simulation engine: deterministic state, step controls, replay.
- Lab engine: metadata, instructions, task tracking, validation display.
- Persistence layer: local storage for progress and preferences.
- Base component library setup (shadcn/ui).

**Exit criteria:**
- An engineer can navigate to a concept and see a placeholder lesson.
- Visualization engine can render a simple scene with state transitions.
- Simulation engine supports step-forward/backward on a trivial simulation.
- Lab engine can display instructions and track task completion.

---

## M2 — First Learning Domain: Cloud Fundamentals

Build the first complete learning path.

**Planned scope:**
- Cloud Computing Models concept (full lesson).
- Global Infrastructure concept (interactive topology visualization).
- Virtual Machines concept (Azure VMs + EC2 comparison).
- At least one concept per remaining category (storage, networking, IAM, etc.).
- Provider comparison views.
- Content authoring workflow established.

**Exit criteria:**
- A complete learning path exists for Cloud Fundamentals.
- Each concept has at least: introduction, core concepts, provider implementations, and comparison.
- At least 3 concepts include interactive visualizations.

---

## M3 — Interactive Labs & Simulations

Add hands-on learning experiences.

**Planned scope:**
- At least 2 interactive simulation labs (browser-based).
- At least 2 local hands-on labs with full instructions.
- At least 2 architecture challenges.
- Lab completion tracking.
- Simulation replay and parameter controls.

**Exit criteria:**
- Engineers can complete a simulation lab entirely in the browser.
- Local labs have prerequisites, instructions, expected results, and validation checklists.
- Architecture challenges provide meaningful feedback on decisions.

---

## M4 — Progress Tracking & Knowledge Checks

Add learning continuity and self-assessment.

**Planned scope:**
- Learning progress persistence (IndexedDB).
- Concept completion tracking.
- Lab checkpoint saving.
- Knowledge check questions per concept.
- Learning path progress visualization.
- User preferences (theme, last visited).

**Exit criteria:**
- Progress persists across sessions.
- Engineers can see what they've completed and what remains.
- Knowledge checks provide immediate feedback.

---

## M5+ — Future Domains

The architecture supports expansion. Potential domains (not committed):

- Google Cloud Platform (third provider for cloud concepts).
- Docker & Container Internals.
- Kubernetes.
- Networking & Security.
- Backend Engineering.
- Database Internals.
- Distributed Systems.
- System Design.
- DevOps & Observability.

Each domain follows the same concept-first structure and reuses the core engines.

---

## Principles

- Each milestone is independently useful. No milestone depends on a future one being completed.
- Architecture decisions made early must support future domains without requiring rewrites.
- Content quality over content quantity. One excellent concept beats five shallow ones.
- Do not start a milestone without completing and reviewing the previous one.
