# M1B — UX Architecture

## Status

Proposal. Documentation only — no implementation in this milestone's planning phase.

## 0. Grounding in M1A Reality

Before proposing anything, here is what M1A actually built (not what earlier docs aspired to):

- **Content model in code** (`src/content/cloud-fundamentals/index.ts`): `Domain > Category > ConceptMeta`. `ConceptMeta` has `id`, `title`, `description`, `status` only. There is no `Lesson`, `ProviderImplementation`, or `Lab` type in code yet — those exist only as aspirational schemas in `CONTENT_MODEL.md` and `LAB_ENGINE.md`.
- **Every concept (all 25) has `status: 'coming-soon'`.** Zero concepts are `available`. `ConceptPage` already renders an honest "Coming Soon" state for anything not `available`.
- **Routes** (`src/app/routes.tsx`, ADR-004): `/`, `/:domainId`, `/:domainId/:categoryId`, `/:domainId/:categoryId/:conceptId`. There is no lesson- or lab-level route.
- **Sidebar** (`src/app/layout/sidebar.tsx`): a single global domain header, an accordion of categories, and — when a category is expanded — the **full list of individual concepts** inside it, each as a direct link. This already violates the M1B brief's "must not become an excessively long list of individual lessons" constraint, just one level up (concepts, not lessons).
- **Breakpoints**: only `lg:` (1024px) is used to switch between a fixed desktop sidebar and a mobile overlay drawer. There is no distinct tablet treatment.
- **State**: no Zustand yet. Sidebar open/close is local `useState`; theme is a small context + `localStorage`. ADR-005 has already pre-approved `zustand`, `@xyflow/react`, and `motion` for M1B — this document does not re-litigate that, only specifies which stores/usages M1B's UX actually needs.

Everything below is scoped against this baseline, not a green field.

---

## 1. Information Architecture

```
Domain
 └─ Category
     └─ Concept
         ├─ Lesson(s)              — ordered, concept-level and provider-level
         ├─ Provider Implementation(s)  — linked to the concept, not top-level
         ├─ Comparison              — a lesson-like entry, not a separate hierarchy
         └─ Lab(s)                  — simulation / hands-on / challenge
```

This matches `CONTENT_MODEL.md` exactly. M1B's job is to decide how this hierarchy surfaces as navigation and pages — not to change the hierarchy itself.

**Key architectural rule carried forward:** a Lesson belongs to a Concept. Provider implementations and comparisons are *presented as lessons within a concept's lesson list*, not as siblings of Category in the global nav. This is what keeps Level 1 navigation short regardless of how much content a concept eventually has.

---

## 2. Navigation Hierarchy — Two Levels

### Level 1 — Domain Navigation (global sidebar)

**Change from M1A:** the sidebar stops at **Category**. It no longer expands to list individual concepts.

```
Cloud Fundamentals
 › Cloud Computing Models
 › Global Infrastructure
 › Compute
 › Storage
 › Networking
 › Identity and Access Management
 › Security
 › Load Balancing
 › Scalability and Reliability
 › Monitoring and Observability
```

Clicking a category navigates to the Category page (already built), which lists that category's concepts with their status badges. This is one extra click versus M1A's current "jump straight to a concept from the sidebar," but it's the only way to satisfy the brief's explicit constraint ("must not become an excessively long list of individual lessons") once a domain has more categories or a category has more concepts than today's 2–3. See `M1B_DESIGN_DECISIONS.md` §1 for the full trade-off.

Requirements carried from the brief:
- Sidebar collapses completely (full-width → hidden) on desktop, with a compact rail remaining as the collapsed affordance (see §5, Responsive Behavior).
- Mobile uses the existing overlay/drawer pattern (`Sidebar` component already does this — reused as-is, content changed).
- Current domain and category are visually marked (reuse the existing `activeDomainId`/`activeCategoryId` logic in `Sidebar`).
- A domain switcher affordance is included at the top of the sidebar, even though only one domain (`Cloud Fundamentals`) exists today — see `M1B_DESIGN_DECISIONS.md` §3.

### Level 2 — Learning Navigation (in-workspace, per concept)

Appears only inside a Concept's workspace, not in the global sidebar. Example:

```
Virtual Machines
 1. Introduction to Virtual Machines         Lesson
 2. Virtualization Fundamentals              Lesson
 3. VM Architecture                          Lesson
 4. Compute, Memory and Storage              Lesson
 5. Networking and Security                  Lesson
 6. Azure Virtual Machines                   Lesson · Provider
 7. AWS EC2                                  Lesson · Provider
 8. Architecture Comparison                  Lesson · Comparison
 9. Hands-on Lab                             Lab
```

Requirements:
- Items have a recommended order (position in the array) but are all independently clickable — no locking.
- Each item is visually typed: `Lesson`, `Lesson · Provider` (tagged with provider color per `UX_PRINCIPLES.md` §Color), `Lesson · Comparison`, `Lab`, `Knowledge Check`.
- The current item is highlighted.
- A progress affordance exists per item (see §6) but never fabricates completion — every item starts and stays "not viewed" until a real view/persistence signal exists.

---

## 3. Page Hierarchy

```
/                                                    Home
/:domainId                                           Domain Explorer
/:domainId/:categoryId                               Category Page
/:domainId/:categoryId/:conceptId                     Concept Overview
/:domainId/:categoryId/:conceptId/:lessonId           Lesson Workspace
/:domainId/:categoryId/:conceptId/labs/:labId         Lab Workspace
```

Changes from M1A's route table (ADR-004):
- `/:domainId/:categoryId/:conceptId` **changes meaning**: today it renders either a one-paragraph description (for `available` concepts, which don't exist yet) or a status card (for everything else). In M1B it becomes **Concept Overview**: objectives, the Level 2 lesson list, and entry points — but *only once a concept actually has lessons*. Until then, it still renders the same honest "Coming Soon / In Development" state M1A already built. No route changes are needed to support this — `ConceptPage` grows a second branch for "has lessons," the existing status branch is untouched.
- Two new route segments are added: `:lessonId` and `labs/:labId`. This extends ADR-004's self-describing URL philosophy rather than contradicting it.
- No concept today has any lesson, so these new routes have no real destination yet in M1B's *content*. The routes and the Lesson/Lab workspace *components* are what M1B's UX architecture specifies; populating them with real lesson content is M2 scope (per `PRODUCT_ROADMAP.md`). This document specifies the shape so M2 content has somewhere correct to land.

---

## 4. User Journeys

**New visitor, discovering the platform.**
Home → sees what Engineering Atlas is, that Cloud Fundamentals is the one available domain, and an honest count of what's actually buildable today (see `M1B_DESIGN_DECISIONS.md` §2 on not overselling 25 "coming soon" concepts as content). → Domain Explorer → Category → Concept Overview, which — for every concept today — shows the "Coming Soon" state, same as M1A.

**Learner with an available concept (future state, once M2 ships content).**
Sidebar category → Category page → clicks a concept with `status: 'available'` → Concept Overview (objectives + lesson list) → clicks lesson 1 → Lesson Workspace → uses Previous/Next to move through the list → reaches "Architecture Comparison" → reaches "Hands-on Lab" entry → Lab Workspace.

**Learner comparing providers mid-lesson.**
Inside a Lesson Workspace, the Level 2 nav is always visible (desktop: persistent rail beside content; mobile: collapsible list, see §5), so jumping from "VM Architecture" to "Azure Virtual Machines" to "AWS EC2" is a direct click, not a back-out-and-reselect.

**Learner returning later.**
Home shows a "Continue" affordance only if a real last-visited signal exists (localStorage, already part of M1A's persistence plan per `ARCHITECTURE.md`). If none exists (first visit, cleared storage, private browsing), Home shows the normal domain list with no fabricated "continue" card — this is the same honesty rule as the progress indicator (§6).

---

## 5. Responsive Navigation Behavior

| Breakpoint | Level 1 (global sidebar) | Level 2 (lesson nav) |
|---|---|---|
| Desktop (`lg:` ≥1024px, same breakpoint M1A already uses) | Persistent sidebar, full width; user-toggleable to a **compact rail** (category initials/icons + tooltip on hover) that stays visible rather than fully hiding | Persistent secondary rail alongside workspace content |
| Tablet (768–1023px) — **new, M1A has no tablet treatment** | Defaults to the **compact rail** (not full drawer) — there's enough width for a narrow persistent affordance, and a full overlay would eat too much of the already-constrained content width | Collapses into a single-row horizontal scroller above the workspace content, or a dropdown — see wireframes |
| Mobile (<768px, same as M1A's existing drawer breakpoint) | Overlay/drawer, exactly as M1A's `Sidebar` already behaves | A collapsible list (accordion) at the top of the workspace, collapsed by default to keep content above the fold |

The desktop "compact rail" and tablet default are the same visual component — tablet just starts in that state instead of requiring a toggle. This reuses one additional sidebar state (`'expanded' | 'rail' | 'hidden'`) instead of inventing a separate tablet-only component.

---

## 6. UX Interaction Principles (M1B-specific additions)

`UX_PRINCIPLES.md` already defines the product's design philosophy, visual direction, and anti-patterns — this document does not repeat it. M1B adds the following, specific to navigation and the learning workspace:

1. **Never imply progress that isn't tracked.** A progress indicator exists in the UI (Level 2 nav, Concept Overview) because the brief asks for a "future-ready" one, but it must render as an honest, static "0 of N" or unfilled state until persistence (M4) actually exists. No placeholder animation implying activity, no randomly pre-filled demo state.
2. **Category, not concept, is the unit of global navigation.** This is the specific interaction consequence of §2's structural decision — reinforced here because it's easy to regress toward M1A's current concept-listing sidebar under time pressure.
3. **Lesson order is a recommendation rendered as a number, not a gate.** Every Level 2 item is a real link at all times, consistent with `UX_PRINCIPLES.md`'s existing rule against locked sequences.
4. **Status badges travel with content, not navigation chrome.** `coming-soon` / `in-development` badges stay on Category and Concept Overview pages (as M1A already does) — the global sidebar shows categories without per-item status noise, since a category is never itself "coming soon," only the concepts inside it are.
