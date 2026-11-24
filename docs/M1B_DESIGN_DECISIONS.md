# M1B — Design Decisions

## Status

Proposal. Documentation only. Decisions below are recommendations pending approval — none have been implemented.

---

## 1. Level 1 sidebar stops at Category (not Concept)

**Decision:** Change the global sidebar (`src/app/layout/sidebar.tsx`) to list Domain → Category only. Remove the current behavior where expanding a category reveals every individual concept as a direct link.

**Alternative considered:** Keep M1A's current behavior (categories expand to show concepts inline).

**Trade-off:** M1A's current sidebar is more convenient *today*, when there are only 2–3 concepts per category — one extra click (sidebar → Category page → concept) is overhead for no real benefit yet. But the brief is explicit: "Domain navigation must not become an excessively long list of individual lessons," and categories expanding to concepts is the same failure mode one level early. Since the Category page already lists concepts with status badges (M1A, unchanged), the "extra click" lands on a page that already does this job well — nothing new has to be built to absorb the removed sidebar behavior.

**Recommendation:** Proceed with the change. It costs one click today and avoids a navigation redesign later when more categories/concepts exist.

---

## 2. Home page: no fabricated "coming soon" domain cards

**Decision:** Home lists only domains that exist (today: one), with an honest availability line ("0 available · 25 coming soon") rather than presenting all 25 concepts as browsable content. No placeholder cards for future domains (Kubernetes, Database Internals, etc. from `PRODUCT_ROADMAP.md`'s M5+ list).

**Alternative considered:** Show a grid of all planned domains/concepts with "Coming Soon" overlays, to communicate platform ambition.

**Trade-off:** A bigger grid looks more impressive on a first visit, but it's exactly the anti-pattern CLAUDE.md warns against ("Do not claim two provider services are technically identical," and more directly, the brief's "Avoid showing 25 coming-soon concepts as if they were completed lessons"). A card grid of unstarted content reads as content; a text line reads as a status.

**Recommendation:** Proceed with the honest line. Revisit only when there's a second real domain to show — then it becomes a two-card decision, not a 25-card one.

---

## 3. Domain switcher is a placeholder affordance, not a built feature

**Decision:** The sidebar's top-level domain header gets a visual affordance that *could* become a switcher (e.g., a chevron) but with only one domain, it does nothing yet — clicking it does not need to open a menu with one disabled item.

**Alternative considered:** Build a full dropdown switcher now, "future-ready."

**Trade-off:** A dropdown with exactly one entry is dead UI — worse than no switcher, because it invites a click that goes nowhere useful. CLAUDE.md: "Do not add features... beyond what the task requires."

**Recommendation:** Leave the domain header as a static, non-interactive label (current M1A behavior, just restyled per the wireframes) until a second domain actually ships. No code to write now, nothing to approve beyond "don't build this yet."

---

## 4. Previous/Next lesson navigation stays within a concept

**Decision:** Previous/Next (per `M1B_LEARNING_WORKSPACE_SPEC.md` §7) only sequences through the current concept's lesson list. It does not chain into the next concept in the category.

**Alternative considered:** Continuous "Next" across concept boundaries, turning the whole category into one long path (common in course platforms).

**Trade-off:** Continuous chaining is familiar from course UIs, and would make "keep going" easier. But `CONTENT_MODEL.md` doesn't define an order *between* concepts within a category — only within a concept's lesson list. Inventing a cross-concept order in the UI would silently assert a learning sequence the content model doesn't actually model, which risks becoming a de facto lock-in later (hard to remove an implied order once learners rely on it).

**Recommendation:** Keep Previous/Next concept-scoped for M1B. If a true multi-concept learning *path* becomes a real product feature later, it should be its own explicit content-model concept (e.g., a "Path" entity), not an implicit side effect of Next button wiring.

**Unresolved — flagging for explicit input:** should categories eventually support an authored concept order (today `concepts` is just an array with no stated sequencing intent) so a future "path" feature has something to build on? Not needed for M1B; worth deciding before M2 content authoring locks in an unordered mental model.

---

## 5. Progress indicator: honest skeleton, not deferred entirely

**Decision:** Build the Level 2 nav's progress affordance (empty/filled dot per lesson) now, in M1B, wired to nothing persistent — every dot renders empty every time, with no `localStorage`/IndexedDB read. Persistence lands in M4 per `PRODUCT_ROADMAP.md`; M1B just reserves the visual slot.

**Alternative considered A:** Omit the progress affordance entirely until M4, to avoid building UI for data that doesn't exist yet.
**Alternative considered B:** Wire it to a quick `localStorage` flag now, ahead of M4's planned IndexedDB-based `progressStore`.

**Trade-off:** Omitting it (A) means M4 has to retrofit space into a layout that wasn't designed for it. Wiring real persistence now (B) duplicates M4's planned work with a throwaway mechanism and risks a half-real feature ("looks like it's tracking something" when it's just a flag with no cross-device/cross-session guarantees users would reasonably assume).

**Recommendation:** Build the empty/static version now (as specified in `M1B_UX_ARCHITECTURE.md` §6), activate it for real in M4 without a layout change. This is the "future-ready progress indicator without introducing backend requirements" the brief explicitly asks for — read literally, it means reserve the shape, not fabricate the data.

---

## 6. Routing extension: path segments for lesson and lab, not query params

**Decision:** Extend routes to `/:domainId/:categoryId/:conceptId/:lessonId` and `/:domainId/:categoryId/:conceptId/labs/:labId` (new path segments), rather than encoding the active lesson/lab as a query param on the existing concept route.

**Alternative considered:** `?lesson=vm-architecture` query param on the concept route, avoiding a route table change.

**Trade-off:** ADR-004 already established the project's URL philosophy: "descriptive URLs are a feature, not a problem," specifically to make breadcrumbs and shareable links self-describing. A query param would contradict that ADR for no real savings — the route table change is small (two new leaf routes, both lazy-loaded the same way existing routes are).

**Recommendation:** Proceed with path segments. This is a direct, consistent extension of ADR-004, not a new routing decision requiring separate deliberation.

---

## 7. Implementation Awareness (per brief §7)

This section is the "what changes when M1B actually gets built" inventory. No code changes are made now — this is the map for the next milestone's implementation planning.

### Components — reused as-is
- `AppShell`, `Header`, `MainContent`, `ThemeProvider` — no structural change needed; `MainContent`'s breadcrumb logic (`resolveBreadcrumbs`) extends naturally once `lessonId`/`labId` params exist.
- `DomainPage`, `CategoryPage` — reused unchanged; they already render exactly what §2–3 of the wireframes specify.
- `ConceptPage`'s unavailable-status branch (`statusConfig`, the "Coming Soon"/"In Development" card) — reused unchanged as the honest empty state for every concept today.
- `NotFound` — reused unchanged for bad route params at any depth.

### Components — need modification
- `Sidebar` — remove the concept-expansion branch; keep the category-accordion shell, domain header, and active-state logic (`activeDomainId`/`activeCategoryId`), since those are unaffected by dropping concept listing. Needs a new collapse state (`'expanded' | 'rail' | 'hidden'`) for the compact-rail behavior (§5 of the architecture doc).
- `ConceptPage` — gains a second branch: when `status === 'available'` *and* lessons exist, render Concept Overview (objectives + Level 2 lesson list + entry point) instead of the current single-paragraph `available` branch (which has never actually been exercised, since no concept is `available`).
- `breadcrumbs.ts` (`resolveBreadcrumbs`) — extend to accept `lessonId`/`labId` and look them up once those content types exist.

### New components required
- Level 2 lesson navigation rail/list (desktop rail, tablet scroller/dropdown, mobile accordion — one component, responsive variants).
- Lesson Workspace page (new route component).
- Lab Workspace page (new route component) — thin frame around the three views `LAB_ENGINE.md` already specifies in full.
- Visualization Region + Scene Renderer + Component Inspector + Timeline Controller — per `VISUALIZATION_ENGINE.md`, not re-specified here; this is the single largest new build in M1B and depends on `@xyflow/react`/`motion` per ADR-005's existing M1B dependency plan.
- Progress-dot indicator (static/empty-only per §5 above).

### Routing changes
- Add `:lessonId` and `labs/:labId` leaf routes under the existing `:conceptId` route, lazy-loaded the same way as current routes (`src/app/routes.tsx`).
- `ConceptPage`'s route stays the same path; its render branch changes based on content, not the route.

### Content model changes
- Add `Lesson`, `ProviderImplementation`, `Lab`/`LabDefinition` TypeScript types to the content layer — these are already fully designed in `CONTENT_MODEL.md` and `LAB_ENGINE.md`, just not yet implemented in `src/content/`. M1B's job is to confirm the UI's data needs match those existing designs (they do — no changes to those docs were needed while writing this spec).
- `ConceptMeta` needs a `lessons: Lesson[]` (or similar) field, currently absent.

### State management requirements
- Per ADR-005 (already accepted, not re-decided here): `zustand` arrives in M1B for `workspaceStore` (current lesson/tab) and `visualizationStore` (scene/timeline/inspector state), per the six-store design in `ARCHITECTURE.md`.
- `navigationStore` absorbs the sidebar's expand/rail/hidden state — currently local `useState` in `Sidebar`, promoted to Zustand only if/when it needs to be read outside the sidebar (e.g., to adjust main content width). If nothing outside `Sidebar` needs it, local state remains correct per CLAUDE.md's anti-premature-abstraction rule — this should be confirmed against the actual implementation, not decided speculatively here.
- `progressStore` is scaffolded (per §5) but not backed by IndexedDB until M4.

### Testing implications
- Component tests for the new Level 2 nav (responsive variants, active-state highlighting, no-lock-sequence behavior).
- Component tests confirming `ConceptPage`'s unavailable branch is untouched by the new available branch (regression guard — this is the state 100% of real content is in today, it must not break).
- Integration test: deep link directly to a lesson/lab route with invalid params renders `NotFound`, matching existing M1A route-param tests.
- Visual regression baseline for the Visualization Region once it exists (per `ARCHITECTURE.md`'s testing strategy table — not new, just newly applicable).

---

## 8. Open Questions Requiring Explicit Approval

1. **Cross-concept ordering** (§4): should `Category.concepts` eventually carry an authored sequencing intent for a future "learning path" feature? No action needed for M1B; flagged so M2 content authoring doesn't silently assume one answer or the other.
2. **Compact rail iconography** (desktop/tablet collapsed sidebar): the wireframes use a generic icon placeholder per category. No icon field exists in the content model today, and inventing one now would be adding a feature ahead of need. Recommend: ship the compact rail with category-initial letters (no new content field) until/unless real icons are commissioned as part of a future visual-design pass.
3. **Scope confirmation:** this milestone produces the four documents above only. No dependency installation, no route code, no new components. Explicit sign-off requested before any M1B implementation planning begins, per CLAUDE.md's "Do not start a new milestone without explicit approval."
