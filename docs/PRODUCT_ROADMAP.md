# Product Roadmap — Engineering Atlas

## Note on M2–M4 Scope (added during M2)

A later brief ("Cloud Fundamentals master implementation") asked for the entire Cloud Fundamentals domain — all 10 categories, visualizations, simulations, Azure/AWS mappings, labs, knowledge checks, and local progress tracking — built end-to-end, rather than phased across M2 (domain content), M3 (labs/simulations), and M4 (progress tracking) as originally planned below. Per CLAUDE.md's instruction not to silently override an approved decision, this is recorded explicitly rather than just proceeding:

**Resolution:** For Cloud Fundamentals specifically, M2/M3/M4's content is delivered together under one initiative, sequenced internally as documented slices (see `docs/decisions/ADR-006-reduced-state-management-footprint.md` and the M2 implementation plan) rather than as three separate milestones with separate sign-off gates. Each slice (platform foundation + Compute category first, then the remaining categories in batches) still gets its own verification pass and milestone report — the compression is about not re-litigating architecture three times, not about skipping the discipline those gates existed for. **M5+ (future domains beyond Cloud Fundamentals) is unaffected and still follows the original phased model below.**

The exit criteria for M2/M3/M4 below should now be read as the cumulative exit criteria for this combined initiative, reached incrementally slice by slice rather than milestone by milestone.

**Slice progress:**

| Slice | Categories | Status |
|---|---|---|
| 1 | Platform foundation, Compute | Merged |
| 2A | Global Infrastructure, Storage, Networking; concept status labels | Merged |
| 2A.1 | Per-concept content lazy loading (ADR-007); no new content | Merged |
| 2B | Identity and Access Management, Security | Merged |
| Viz | SVG-first visualization system (ADR-008); no new content | Merged |
| 2C | Load Balancing; Scalability and Reliability (Auto-Scaling, High Availability) | Merged |
| 2D | Monitoring and Observability (Observability Fundamentals, Metrics and Alerting, Logging, Distributed Tracing) | Merged |
| Final QA | Cloud Fundamentals QA & hardening audit (no new concepts); see `docs/CLOUD_FUNDAMENTALS_QA_REPORT.md` | Merged (`8b8d84a`, PR #9) |
| Later | Cloud Computing Models; Disaster Recovery | Not started |

The visualization phase is cross-cutting, not a content slice: it makes declarative SVG the default scene renderer, adds reusable SVG primitives and a documented standard (`docs/SVG_VISUALIZATION_STANDARD.md`), and moves React Flow off the eager lesson path. It adds no concepts, lessons, routes, or status changes.

Concept-level coverage is tracked in `docs/CLOUD_FUNDAMENTALS_CURRICULUM.md`.

### Kubernetes Fundamentals Slice Progress (M5+ Domain)

| Slice | Categories | Status |
|---|---|---|
| 3A | Foundations, Architecture, Workloads, Networking, Configuration (5 categories, 4 simulation labs) | Merged (`990cbad`, PR #10) |
| 3B | Pod Lifecycle, Scheduling, Resource Management, Scaling, Deployment Strategies (5 categories, 5 simulation labs) | Merged (`eb97552`, PR #11) |
| 3C | Networking Internals, Ingress & Traffic, Network Security, Identity & Access, Workload Security (5 categories, 5 simulation labs) | Merged (`e6dc7ee`, PR #12) |
| 3D | Storage Fundamentals, Storage Internals, Stateful Workloads, Data Reliability & Recovery, Production Storage Operations (5 categories, 5 simulation labs) | Merged (`3705b27`, PR #15) |

### Cross-Cutting Initiative — Provider-specific SVG Visual System (ADR-009)

Proposed architecture to add curated, official AWS, Azure, and Kubernetes SVG icons to provider-specific and comparison diagrams while keeping generic concept scenes on the existing SVG primitives (`docs/decisions/ADR-009-provider-specific-svg-visual-system.md`).

| Stage | Scope | Status |
|---|---|---|
| 1 | Architecture decision and asset governance (ADR-009, licensing verification, manifest/attribution rules) | Proposed |
| 2 | Official SVG asset registry (curated assets, `MANIFEST.json`, `ATTRIBUTIONS.md`, registry metadata) | Planned |
| 3 | Centralized visual resolver (`resolveNodeVisual`, context/asset compatibility, generic fallback) | Planned |
| 4 | Renderer integration (SVG topology/sequence scenes, component inspector, lazy React Flow scene) | Planned |
| 5 | Selective scene migration (Tier 1 provider scenes, Tier 2 Kubernetes scenes, Tier 3 comparison scenes) | Planned |
| 6 | Visual and accessibility QA (light/dark themes, keyboard/ARIA, 390×844 and 1440×900 viewports) | Planned |

## Milestone Overview

| Milestone | Focus | Status |
|---|---|---|
| M0 | Product Foundation | Complete |
| M1 | Application Shell & Core Engines | Complete (delivered via M1A + Slice 1) |
| M2 | First Learning Domain — Cloud Fundamentals | Delivered incrementally (Slices 1–2D; 30/34 concepts active) |
| M3 | Interactive Labs & Simulations | Delivered incrementally (Slices 1–2D) |
| M4 | Progress Tracking & Knowledge Checks | Delivered incrementally (Slices 1–2D) |
| M5+ | Additional Domains (Kubernetes Fundamentals) | In progress (Slices 3A–3D merged) |

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
