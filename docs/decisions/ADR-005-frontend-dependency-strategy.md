# ADR-005: Frontend Dependency Strategy

## Status

Proposed

## Context

CLAUDE.md lists a full tech stack (React, TypeScript, Vite, Tailwind, shadcn/ui, Motion, React Flow, D3, Zustand, IndexedDB). Installing everything upfront creates unnecessary complexity and couples the project to decisions that haven't been validated.

M1A builds the application shell and domain explorer. It does not render visualizations, run simulations, manage complex state, or persist data to IndexedDB.

## Decision

Install dependencies incrementally. Each dependency is added in the milestone phase that first needs it, not before.

### M1A Dependencies — Application Foundation

| Dependency | Purpose | Why Now |
|---|---|---|
| `react`, `react-dom` | UI framework | Core framework |
| `typescript` | Language | Core language |
| `vite` | Build tool and dev server | Core tooling |
| `@vitejs/plugin-react` | React Fast Refresh (official Vite plugin) | Originally `@vitejs/plugin-react-swc`; switched during M1A verification — see "Vite React Plugin Choice" below |
| `tailwindcss` v4 | Utility-first CSS | Styling from day one |
| `@tailwindcss/vite` | Tailwind CSS Vite plugin | Vite-native integration (replaces PostCSS setup) |
| `react-router` v8 | Client-side routing | Navigation from day one. Installed unpinned; resolved to v8, the current major, superseding the v7 originally evaluated in ADR-004. API used is unchanged between the two — see ADR-004. |
| `lucide-react` | Icons | Sidebar, header, theme toggle |
| `clsx` | Conditional class names | shadcn/ui dependency, used everywhere |
| `tailwind-merge` | Merge Tailwind classes without conflicts | shadcn/ui pattern |
| `class-variance-authority` | Component variant definitions | shadcn/ui pattern |

**shadcn/ui note:** shadcn/ui is not an npm package — it's a CLI that copies component source files into the project. We install the CLI tooling and copy only the components we need (Button, ScrollArea, Separator, Tooltip for M1A). The dependencies above (`clsx`, `tailwind-merge`, `class-variance-authority`) support these components.

**Radix UI primitives** are installed per-component as shadcn/ui requires them (e.g., `@radix-ui/react-scroll-area` when we copy the ScrollArea component). They are not installed upfront.

### M2 Dependencies — Installed

The M1B plan below listed these as "M1B dependencies" before M1B was re-scoped to documentation-only (see `docs/M1B_*` design docs). They were actually installed during M2 (Cloud Fundamentals platform foundation + Compute category), alongside one dependency originally deferred further:

| Dependency | Purpose | Installed version |
|---|---|---|
| `zustand` | State management | ^5.1.0 — see ADR-006 for why M2 introduces only one store (`progressStore`), not the six-store blueprint in `ARCHITECTURE.md` |
| `@xyflow/react` | Node-based graph visualization | ^13.0.3 — the package was renamed from `reactflow` to `@xyflow/react` at v11; "React Flow v12" in the original plan referred to the renamed package's then-current major, M2 installed the current major (v13) at install time |
| `idb-keyval` | IndexedDB convenience wrapper for `progressStore` | ^6.3.0 — **pulled forward from "Future Dependencies" below.** Originally gated on "only when persistence is implemented (M4)"; M2's scope (per the Cloud Fundamentals master implementation brief) makes lesson/lab progress tracking real now, satisfying this ADR's own adoption criterion ("is it needed now") ahead of schedule. This is a deliberate, documented pull-forward, not a silent scope change. |

**Sequence (SVG) scenes use no additional dependency.** The original plan assumed `d3` would be needed for non-topology scenes; M2's `SequenceScene` (used by the Serverless Functions concept) is hand-built inline SVG with no `d3` dependency, since the sequence-diagram layout needed is simple enough not to justify it. `d3` remains deferred below.

**`motion` was installed, then removed before this slice shipped.** It was pre-approved for M1B in the original table below and installed alongside the other three M2 dependencies — but a review before committing found it was never actually imported anywhere: every M2 animation (timeline step transitions, inspector reveal) turned out to need nothing beyond CSS transitions already available through Tailwind. Per this ADR's own standard ("is it needed now, not will it be useful"), an installed-but-unused dependency is exactly what M2 should not ship, so it was uninstalled rather than left in `package.json` against future need. It moves back to "Future Dependencies" below — a one-line reinstall whenever a concept's visualization actually needs JS-driven animation (e.g., spring physics, gesture-driven transitions) that CSS transitions can't express.

### Future Dependencies (Not Before M3+)

| Dependency | Purpose | Why Later |
|---|---|---|
| `d3` | Custom SVG visualizations needing real layout/scale computation | Only if a future concept's visualization genuinely needs it — M2's sequence scenes did not |
| `motion` | Animation beyond what CSS transitions can express | Re-evaluate when a concept's visualization has a concrete need for it — M2 had none |
| MDX tooling (`@mdx-js/rollup`, etc.) | Content authoring in MDX | Not planned — M2 decided structured TypeScript/TSX for lesson content instead (no new build-pipeline dependency); revisit only if TSX authoring proves insufficient for later categories |

## Consequences

**Benefits:**
- Smaller initial bundle. No dead code from unused libraries.
- Faster initial setup. Fewer configuration decisions upfront.
- Each dependency is validated against a concrete need before adoption.
- Easier to change direction. A dependency not yet installed is trivially swapped.

**Trade-offs:**
- Must add dependencies incrementally, which means additional setup work per phase.
- Risk that a later dependency has incompatibilities requiring structural changes. (Mitigated: React Flow, D3, Zustand, and Motion are all well-tested with React + Vite.)

## Evaluation Criteria for Future Dependencies

Before adding any dependency:

1. **Is it needed now?** Not "will it be useful" — is there a concrete feature in the current phase that requires it?
2. **What's the bundle cost?** Check bundlephobia. Reject libraries that add disproportionate weight for the feature they provide.
3. **Is there a simpler alternative?** A 20-line utility beats a 50KB library for a narrow use case.
4. **Is it maintained?** Check release frequency, open issues, and bus factor.
5. **Does it compose?** Prefer libraries that don't take over the architecture (Zustand over Redux, Motion over GSAP, Radix over Material UI).

## Decisions on Specific Libraries

### Zustand: Deferred past M1A, introduced in M2 with reduced scope

ARCHITECTURE.md defines six Zustand stores. This was premature for M1A, which has three pieces of state:

- Sidebar open/closed (component-local `useState`).
- Current route (React Router handles this).
- Theme preference (CSS custom property + `localStorage` via a small context).

**Update at M2:** Zustand was introduced, but for only one of the six originally-planned stores (`progressStore`). The other five were audited against the same "is there a concrete need now" bar this ADR uses for every dependency, and each turned out to have a real but *local* need better served without global state (route params, component-local state lifted one level, or a typed URL search-param wrapper). See ADR-006 for the full reasoning — this is a deliberate reduction of `ARCHITECTURE.md`'s original blueprint, not an oversight.

### Tailwind CSS v4 with Vite Plugin

Tailwind v4 uses a CSS-first configuration model and provides a dedicated Vite plugin (`@tailwindcss/vite`) as the preferred integration method.

**Vite integration:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

**CSS entry point** (`src/styles/globals.css`):

```css
@import "tailwindcss";

@theme {
  --color-bg: #fafafa;
  --color-surface: #ffffff;
  --color-border: #e4e4e7;
  --color-text: #18181b;
  --color-accent: #2563eb;
  /* ... additional tokens */
}
```

The `@import "tailwindcss"` directive replaces the v3 `@tailwind base/components/utilities` directives. The `@theme` block defines design tokens as CSS custom properties that are also available as Tailwind utility classes (e.g., `--color-accent` becomes `bg-accent`, `text-accent`).

**Why the Vite plugin instead of PostCSS:**
- `@tailwindcss/vite` replaces `@tailwindcss/postcss`. Do not use both.
- The Vite plugin integrates directly with Vite's transform pipeline — no separate PostCSS config needed.
- Faster rebuilds since it avoids the PostCSS intermediary.
- No `postcss.config.js` or `tailwind.config.js` files required.

**shadcn/ui token alignment:** shadcn/ui uses semantic token names like `--background`, `--foreground`, `--primary`, etc. Engineering Atlas defines its own token names (`--color-bg`, `--color-text`, `--color-accent`). The shadcn component source files will be adjusted to reference our token names when copied into the project, maintaining one consistent token system rather than two parallel ones.

**Benefits over v3:**
- Configuration via `@theme` in CSS instead of `tailwind.config.js`.
- Native CSS cascade layers for style ordering.
- Faster build performance (Rust-based engine).
- Simpler setup — single CSS file defines both Tailwind and custom tokens.

Risk: Tailwind v4 is newer and some shadcn/ui examples still reference v3 patterns. Mitigation: shadcn/ui's core Radix primitives are style-agnostic; the Tailwind classes in copied components are straightforward to adjust. The shadcn CLI supports Tailwind v4 initialization.

### Testing Environment

Component tests require a DOM environment. The M1A testing stack:

| Dependency | Role | Why |
|---|---|---|
| `vitest` | Test runner | Vite-native, shares the same config and transforms |
| `jsdom` | DOM environment | Required for rendering React components in tests |
| `@testing-library/react` | Component test utilities | Renders components, queries by accessible roles |
| `@testing-library/jest-dom` | DOM assertion matchers | `toBeInTheDocument()`, `toHaveTextContent()`, etc. |
| `@testing-library/user-event` | Interaction simulation | Realistic event sequences (click, type, tab) |

**Vitest configuration** (`vitest.config.ts` or in `vite.config.ts`):

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

**Shared test setup** (`src/test/setup.ts`):

```typescript
import '@testing-library/jest-dom/vitest';
```

This registers jest-dom matchers globally so individual test files don't need to import them.

### Vite React Plugin Choice: `@vitejs/plugin-react` (revised from SWC)

M1A originally installed `@vitejs/plugin-react-swc` on the premise that SWC compiles TypeScript and JSX significantly faster than Babel, with no functional difference for this project's use case.

This was revisited during M1A verification:

- The SWC plugin's own README now states: "Most usages should now be covered in the default `@vitejs/plugin-react` plugin and we recommend using it instead."
- Vite's dev server itself warned on every `npm run dev` run: "We recommend switching to `@vitejs/plugin-react` for improved performance as no swc plugins are used."
- Official Vite plugin documentation frames SWC's advantage as mattering "for big projects that require custom plugins" with SWC equivalents — Engineering Atlas uses no such plugins and is not at that scale.

**Revised decision:** Use `@vitejs/plugin-react` (the default, Oxc/Babel-based plugin per current Vite tooling), not the SWC variant. The original premise (SWC is faster) is not wrong in the abstract, but it doesn't apply to this project's actual plugin usage, and upstream's own guidance for this exact situation points to the default. If a future milestone adds custom SWC-compatible plugins or build performance becomes a measured bottleneck, this can be revisited — the swap is a one-line import change in `vite.config.ts`.
