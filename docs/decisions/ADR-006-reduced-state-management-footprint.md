# ADR-006: Reduced State Management Footprint for M2

## Status

Accepted

## Context

`ARCHITECTURE.md` (written at M0, before any real workspace UI existed) defines six Zustand stores:

```
navigationStore, workspaceStore, visualizationStore, simulationStore, progressStore, preferencesStore
```

M2 builds the first real consumers of this part of the architecture: the Concept Learning Workspace, the visualization engine, the simulation engine, and lesson/lab progress tracking. This is the first point at which the six-store blueprint can be checked against actual, concrete UI needs rather than anticipated ones — and ADR-005 already established the project's standing bar for adopting any dependency: "is it needed now, not will it be useful."

Applying that same bar to each of the six stores individually, rather than adopting the blueprint wholesale, is the subject of this ADR.

## Decision

M2 introduces **one** Zustand store: `progressStore`. The other five are not built as global stores. Each was audited against its real, current UI need:

| Store (per `ARCHITECTURE.md`) | What actually needed the state | Where it lives instead |
|---|---|---|
| `progressStore` | Lesson/lab completion, read by the Level 2 nav dots, Concept Overview, and (in a later milestone) Home's "Continue" card; written by lesson/lab/knowledge-check views | **Built as planned** — genuinely cross-cutting, read and written from unrelated parts of the tree |
| `navigationStore` | Sidebar expanded/rail/hidden state | Lifted to local `useState` in `AppShell`, the common parent of `Sidebar` and `MainContent` — only two sibling components need it, one level of prop drilling is simpler than a store |
| `workspaceStore` | "Current lesson" | Already fully represented by the `:lessonId` route param — storing it again in Zustand would just be cache that could drift from the URL |
| `visualizationStore` | Timeline/step position, inspector-selected-node | Component-local state inside `VisualizationRegion` — scoped to whichever single visualization is mounted at a time, never read from outside it |
| `simulationStore` | Simulation parameters, step index, history | Component-local, inside the `useSimulation` hook — same reasoning as `visualizationStore` |
| `preferencesStore` | Theme | Already served by the existing `ThemeProvider` context from M1A; nothing new needed it |

## Reasoning

1. **Consistency with ADR-005's own standard.** ADR-005 deferred all of Zustand in M1A on exactly this basis ("is it needed now"). Adopting all six stores in M2 just because the UI finally exists would apply that standard to the dependency as a whole but not to its internal design — the same discipline belongs at the store level, not just the package level.
2. **State that duplicates the URL is a bug waiting to happen.** `workspaceStore`'s "current lesson" is already the `:lessonId` route param. A second, separately-updated copy of the same fact in a store risks the two disagreeing (e.g., after a browser back/forward navigation the store doesn't auto-sync). Reading the route param directly has no such failure mode.
3. **Global state for single-consumer data adds indirection without benefit.** Timeline position and simulation state are only ever read by the one component tree currently showing that visualization or simulation. A global store would make that data reachable from anywhere in the app — a capability nothing in M2 actually uses, and one that makes the component harder to reason about in isolation (CLAUDE.md: "avoid premature abstraction").
4. **`navigationStore` is two sibling components, not an app-wide concern.** Lifting state to the nearest common ancestor (`AppShell`) is the standard React answer to "two siblings need to share state" and doesn't require a dependency-backed store to do it cleanly.

## Consequences

**Benefits:**
- Five-sixths less global state surface area to reason about, test, and keep consistent with the URL and component tree.
- `progressStore`'s role stays unambiguous: it is the one place cross-cutting, persisted learning state lives. Nothing else competes with it for that description.
- Each of the five deferred stores can still be introduced later with no architectural rework, if a real cross-cutting need for that specific piece of state actually appears — the audit above is a snapshot of M2's needs, not a permanent ban.

**Trade-offs:**
- `ARCHITECTURE.md`'s state management section now describes a six-store design that doesn't match the implementation. That document should be read as the original M0 intent, superseded for M2 onward by this ADR — a follow-up edit to `ARCHITECTURE.md` itself noting the supersession is worth doing in a later documentation pass, but is not blocking M2's implementation.
- If a later category's content genuinely needs, say, cross-component visualization state (two different visualizations on one page needing to stay in sync, which no M2 concept does), that would be the concrete trigger to introduce `visualizationStore` — this ADR does not forbid it, it just declines to build it speculatively now.

## Reviewed Alternative

**Adopt all six stores now, even with only `progressStore` having real logic in it initially.** Rejected: an empty or near-empty store is not "future-ready," it's dead code with a misleading name — a future contributor finding `visualizationStore` would reasonably assume something currently reads from it. Better to add it when it has a real job.
