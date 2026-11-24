# M1B — Concept Learning Workspace Spec

## Status

Proposal. Documentation only.

## Scope Note

This spec describes the **workspace components and their states**, not specific lesson content. As of this writing, every concept in `src/content/cloud-fundamentals/index.ts` has `status: 'coming-soon'`, so the "has lessons" states described below have no real content to render yet — that's M2 scope. What M1B specifies is the shape those states take so M2 content has a correct, honest place to land, and so the existing `ConceptPage` placeholder behavior (M1A) degrades gracefully into it rather than being thrown away.

---

## 1. Workspace Structure

```
┌───────────────────────────────────────────────────────────────┐
│ Concept Header                                                 │
│  Title · Learning Objectives · Status (if not fully available) │
├───────────────┬─────────────────────────────────────────────────┤
│ Lesson Nav    │ Main Content Area                               │
│ (Level 2)     │  ┌─────────────────────────────────────────┐    │
│               │  │ Visualization Region                    │    │
│  1. ...       │  │ (adaptive — see §3)                      │    │
│  2. ...       │  └─────────────────────────────────────────┘    │
│  3. ...  ←cur │  ┌─────────────────────────────────────────┐    │
│  ...          │  │ Technical Inspector (contextual, §4)    │    │
│  9. Lab       │  └─────────────────────────────────────────┘    │
│               │  Lesson text / explanation                      │
│               │  Walkthrough controls (if stepped content, §5)  │
│               │  Knowledge check (if present, §6)               │
│               │  Lab entry point (if present, §7)               │
├───────────────┴─────────────────────────────────────────────────┤
│ ◀ Previous Lesson                           Next Lesson ▶        │
└───────────────────────────────────────────────────────────────┘
```

Not every zone appears in every lesson — this is a direct continuation of `UX_PRINCIPLES.md`'s "zones are fluid" rule, now made concrete per lesson type.

---

## 2. Concept Header

- Title (concept name, provider-independent — never a provider service name here).
- Learning objectives: a short list, sourced from the concept's (future) `learningObjectives` field. If absent (current reality — the field doesn't exist in code yet), the header omits the objectives block entirely rather than showing an empty heading.
- Status strip: only rendered when the concept is not fully `available` (reuses M1A's existing `statusConfig` pattern from `ConceptPage` — `coming-soon` / `in-development` with icon + description). This is the **only** thing most concepts render today, and that's correct, not a degraded state.

---

## 3. Lesson Navigation (Level 2)

Covered structurally in `M1B_UX_ARCHITECTURE.md` §2. Workspace-level detail:

- Rendered as a persistent rail on desktop/tablet-with-space, collapsible list on mobile (see wireframes).
- Each entry shows: order number, title, type tag (`Lesson` / `Lesson · Provider` / `Lesson · Comparison` / `Lab` / `Knowledge Check`), and a progress affordance (empty circle / filled circle — never fabricated, see `M1B_UX_ARCHITECTURE.md` §6).
- Clicking any entry navigates directly — no sequence lock.
- The current entry is visually distinct and auto-scrolls into view on mobile's collapsed list.

---

## 4. Main Content Area

### Visualization Region

- Adaptive per lesson, not a fixed canvas type. Mapping (carried from `UX_PRINCIPLES.md` §2 and ADR-003, not redefined here):

| Lesson content | Visualization |
|---|---|
| Infrastructure topology | React Flow node graph |
| Protocol / request sequence | SVG sequence diagram with timeline |
| Data structure | Animated SVG/D3 structure |
| State machine / lifecycle | State transition diagram |
| Permission / decision flow | SVG flow diagram |
| Before/after or multi-provider | Side-by-side or tabbed comparison view |
| Resource allocation | Interactive table or resource map |

- If a lesson has no natural visual (per `UX_PRINCIPLES.md` §1: "If a concept can't be meaningfully visualized, use structured walkthroughs instead of forcing a diagram"), this region is simply absent — the lesson is content-primary instead.
- Layout mode per lesson (visualization-primary / content-primary / lab-primary / split) is a property of the lesson's content, decided at authoring time — the workspace just honors it, per `ARCHITECTURE.md` §3's four layout modes.

### Technical Inspector

- A contextual panel, not always open. Appears when the visualization region is present and the user clicks a node/component (per `VISUALIZATION_ENGINE.md`'s Component Inspector).
- On desktop: side panel beside or below the visualization. On mobile: a bottom sheet / expandable drawer rather than a fixed side panel, since there's no horizontal room for both.
- Shows component name, type, data fields, and — when viewing a provider lesson — provider-specific details, per `VISUALIZATION_ENGINE.md`.

### Walkthrough Controls

- Only present when the lesson's visualization has multiple states (a sequence, a failover scenario, a step-by-step build-up).
- Reuses `VISUALIZATION_ENGINE.md`'s Timeline Controller spec verbatim: play/pause, step forward/back, scrub, speed, current-state label. This spec does not redefine that control — it specifies *where it sits* in the workspace: directly beneath the visualization region, always visible when applicable, never hidden behind a menu.

---

## 5. Knowledge Check Interaction

- Appears as a lesson-list entry type (`Knowledge Check`) or as a section within a lesson (per `CONTENT_MODEL.md`'s `knowledge-check` section type) — both are valid; which one a given lesson uses is a content decision, not a workspace one.
- Interaction: question → user selects an answer → immediate inline feedback (correct/incorrect + a short explanation). No submission delay, no "grading."
- **Honesty constraint (CLAUDE.md, Content Quality Standards):** a knowledge check result is session-only until real persistence exists. The UI must not claim a score was "saved" or contribute to a visible progress percentage anywhere until that's actually true. In M1B, a completed knowledge check can update the in-session Level 2 progress dot, but that state is lost on reload — this is consistent with M1A/M1B having no IndexedDB yet (that's M4, per `PRODUCT_ROADMAP.md`), and is preferable to faking persistence.

---

## 6. Lab Entry Points

- A concept with an associated lab shows a **Lab entry card** at the appropriate point in its lesson list (per the Virtual Machines example, position 9 — but position is content-defined, not always last).
- The card states the lab type (`Simulation` / `Hands-on` / `Challenge`, per `LAB_ENGINE.md`), estimated time, and difficulty — all drawn directly from `LabDefinition`.
- Clicking it navigates to the Lab Workspace (`/:domainId/:categoryId/:conceptId/labs/:labId`), which renders one of the three views already fully specified in `LAB_ENGINE.md` §Lab Display. This spec does not redefine those views — it only confirms the entry point and routing.
- **Honesty constraint carried forward:** hands-on labs never claim verification; the Lab Workspace must use `LAB_ENGINE.md`'s exact language ("self-reported," "confirm the following") — this is a hard carry-over, not a new decision.

---

## 7. Previous / Next Lesson Navigation

- Scope: **within the current concept's lesson list only.** Reaching the previous/next *concept* happens via the Category page, not via this control.
  - Rationale: a concept's lesson list has a real, authored order (introduction → mechanics → providers → comparison → lab). The order *between* concepts in a category has no equivalent authored meaning — categories list concepts, they don't sequence them. Chaining Next across concept boundaries would silently invent a learning path the content model doesn't actually define. See `M1B_DESIGN_DECISIONS.md` for the alternative considered.
- At the first lesson, "Previous" is disabled (not hidden — so the control's position is stable). At the last lesson, "Next" is replaced with a "Back to [Concept]" or "Back to [Category]" link, since there's nowhere further to sequence to.

---

## 8. Empty, Loading, Unavailable, and Error States

This is the most immediately relevant section, since it covers the state **every single concept is in today.**

| State | Trigger | Behavior |
|---|---|---|
| **Unavailable (coming-soon / in-development)** | `concept.status !== 'available'` — true for all 25 concepts today | Reuse M1A's existing `ConceptPage` status card verbatim (icon, label, description). This is not a "degraded" workspace — it's the correct, honest rendering of current content reality. No Level 2 nav, no empty visualization placeholder, no lesson list skeleton implying content exists. |
| **Available but no lessons array populated** | Should not occur once `status === 'available'` is set (that's the content-authoring signal that lessons exist) — but if it does, the workspace must render the same "unavailable" state rather than a blank page. This is a defensive guard, not a designed user-facing flow. |
| **Loading** | Route-level code-split chunk for a concept/lesson hasn't resolved yet | A minimal skeleton matching the Concept Header + Lesson Nav shape (no spinner-as-content, per `UX_PRINCIPLES.md`'s anti-pattern list) |
| **Invalid route (bad `:conceptId`/`:lessonId`/`:labId`)** | `findConcept`/future `findLesson`/`findLab` returns `undefined` | Existing `NotFound` component, same as M1A's current behavior for bad domain/category/concept params |
| **Lesson exists but references a visualization/lab type not yet implemented** | Future-proofing for content authored ahead of engine capability | Content-primary fallback: render the lesson's text content without the visualization region, rather than erroring — matches `UX_PRINCIPLES.md` §1's fallback rule |

No new component is required for the unavailable state — this section exists to make explicit that M1A's `ConceptPage` status branch *is* the correct empty-state design for the workspace, and M1B's new "has lessons" branch is strictly additive.
