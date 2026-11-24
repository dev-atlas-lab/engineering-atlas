# M1A Implementation Plan — Application Foundation

## Scope

Build the application shell, navigation, design foundation, and Cloud Fundamentals domain explorer. No visualizations, simulations, labs, or complex state management.

**In scope:** Project init, Tailwind + shadcn/ui, routing, shell layout, sidebar, theme, domain explorer, placeholder pages.
**Out of scope:** Visualization engine, simulation engine, lab engine, Zustand, persistence, content rendering, MDX.

---

## M0 Review — Inconsistencies and Corrections

Before planning M1A, these issues in the M0 documents should be noted:

### 1. ARCHITECTURE.md commits to React Router without evaluation

ARCHITECTURE.md line 48 states "Top-level routing (React Router)" as a decision, but the M0 final report listed routing as an open question. **Resolution:** ADR-004 formally evaluates and selects React Router (v8 as installed; the evaluation was originally written against v7 and the reasoning carries forward unchanged — see ADR-004 "Why v8 Instead of v7").

### 2. Six Zustand stores defined prematurely

ARCHITECTURE.md defines `navigationStore`, `workspaceStore`, `visualizationStore`, `simulationStore`, `progressStore`, `preferencesStore`. M1A needs none of these — sidebar state is component-local, routing is handled by React Router, and theme is a CSS property with a small context. **Resolution:** Defer all Zustand stores to M1B. See ADR-005.

### 3. Routing hierarchy splits domains and concepts

ARCHITECTURE.md routes put concepts at `/concepts/:conceptId`, separate from `/domains/:domainId`. This breaks the URL-to-sidebar correspondence and makes breadcrumbs harder to derive. **Resolution:** ADR-004 proposes nested routes: `/cloud-fundamentals/compute/virtual-machines`. Concepts live under their domain and category in the URL.

### 4. Breadcrumb at bottom of shell

UX_PRINCIPLES.md places "Progress / Breadcrumb" at the bottom of the layout. Breadcrumbs are conventionally above the content (immediately after the header), which aids orientation. **Resolution:** Move breadcrumbs to the top of the main content area, below the header. The bottom bar can be used for progress indicators in M4.

### 5. Comparison is not a formal content model type

CONTENT_MODEL.md shows comparison data in the Virtual Machines example but has no `Comparison` type. The `/compare` route expects structured comparison data. **Resolution:** No change needed for M1A. When M1B builds the first concept page, comparison can be a section within the concept or a derived view. We shouldn't add a formal type until we know what comparison data actually looks like for a real concept.

### 6. CLAUDE.md project structure lists directories that shouldn't exist empty

The structure lists `engines/`, `features/`, `hooks/`, `types/`. Creating these empty creates the impression of a framework before there's anything to put in it. **Resolution:** Create directories only when the first file goes in them. The CLAUDE.md structure is a target, not a starting skeleton.

---

## Folder Structure

```
engineering-atlas/
├── docs/                           # (exists) Product and architecture docs
│   └── decisions/                  # (exists) ADRs
├── public/
├── vercel.json                     # SPA fallback rewrite (Vercel hosting target)
├── src/
│   ├── app/
│   │   ├── layout/
│   │   │   ├── app-shell.tsx       # Top-level layout grid
│   │   │   ├── header.tsx          # App header: logo, theme toggle
│   │   │   ├── sidebar.tsx         # Domain explorer sidebar
│   │   │   └── main-content.tsx    # Content area with route outlet
│   │   ├── routes.tsx              # Route tree definition
│   │   └── router.tsx              # Router instance
│   ├── components/
│   │   └── ui/                     # shadcn/ui copied components
│   │       ├── button.tsx
│   │       ├── scroll-area.tsx
│   │       ├── separator.tsx
│   │       └── tooltip.tsx
│   ├── content/
│   │   └── cloud-fundamentals/
│   │       └── index.ts            # Domain, category, concept hierarchy data
│   ├── lib/
│   │   └── utils.ts                # cn() helper (clsx + tailwind-merge)
│   ├── pages/
│   │   ├── home.tsx                # Landing / domain selection
│   │   ├── domain.tsx              # Domain overview
│   │   ├── category.tsx            # Category overview (concept list)
│   │   └── concept.tsx             # Concept placeholder (ready for M1B)
│   ├── styles/
│   │   └── globals.css             # Tailwind directives, @theme tokens, dark mode
│   ├── test/
│   │   └── setup.ts                # Vitest setup (jest-dom matchers)
│   ├── app.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   └── vite-env.d.ts               # Vite type declarations
├── index.html                      # Vite entry HTML
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── CLAUDE.md                       # (exists) Project instructions
└── .gitignore
```

**What's absent and why:**

| Directory | Why Not Yet |
|---|---|
| `src/engines/` | No visualization, simulation, or lab engine in M1A |
| `src/features/` | No feature modules yet (workspace, labs, progress) |
| `src/hooks/` | No shared hooks yet — React Router hooks suffice |
| `src/types/` | Types live alongside their modules until shared widely |
| `src/stores/` | Zustand deferred to M1B |

---

## Dependencies

See ADR-005 for the full evaluation. This list matches `package.json` exactly as of M1A verification.

**Production (7):**
- `react` ^19
- `react-dom` ^19
- `react-router` ^8 — installed unpinned; resolved to the current major (v8) rather than the v7 originally evaluated. See ADR-004 "Why v8 Instead of v7."
- `lucide-react` — icons
- `clsx` — conditional classes
- `tailwind-merge` — Tailwind class conflict resolution
- `class-variance-authority` — component variants

**Development (17):**
- `typescript` ^6
- `vite` ^8
- `@vitejs/plugin-react` — official Vite React plugin. Originally `@vitejs/plugin-react-swc` was installed; switched during M1A verification. See "Vite React Plugin Choice" below.
- `tailwindcss` ^4 — CSS framework
- `@tailwindcss/vite` — Tailwind CSS Vite plugin (replaces PostCSS setup)
- `@types/react`, `@types/react-dom` — type definitions
- `@types/node` — required for `import.meta.dirname`/Node types in `vite.config.ts`; not in the original M1A plan, added when `tsc` required it
- `eslint`, `@eslint/js`, `typescript-eslint` — linting
- `eslint-plugin-react-hooks` — exhaustive-deps and rules-of-hooks linting; not in the original M1A plan, added for lint quality
- `vitest` — test runner
- `jsdom` — DOM environment for component tests
- `@testing-library/react` — component test utilities
- `@testing-library/jest-dom` — DOM assertion matchers
- `@testing-library/user-event` — realistic interaction simulation

This is 17 distinct devDependencies, not 16 as earlier reported — the original M1A plan enumerated 15, and `@types/node` and `eslint-plugin-react-hooks` were added during implementation but omitted from one summary count. This section is the corrected, authoritative count.

**Node.js runtime requirement:** `react-router` v8 requires Node >= 22.22.0 (`engines` field in its `package.json`). This is now declared in Engineering Atlas's own `package.json` `engines` field. See ADR-004 "Node.js Runtime Requirement."

**shadcn/ui components** (copied source, not npm packages):
- Button, ScrollArea, Separator, Tooltip

Each shadcn component pulls its Radix primitive as a dependency when copied. **Not yet copied as of M1A** — the shell was built with Tailwind utilities directly; these remain available for M1B.

## Vite React Plugin Choice

M1A originally installed `@vitejs/plugin-react-swc`. During M1A verification this was evaluated against the default `@vitejs/plugin-react`:

- The SWC plugin's own README states: "Most usages should now be covered in the default `@vitejs/plugin-react` plugin and we recommend using it instead."
- The Vite plugin's dev-server runtime itself emitted this exact recommendation on every `npm run dev` invocation, since Engineering Atlas uses no SWC-specific plugins or options.
- Vite's official plugin documentation notes SWC's speed advantage matters "for big projects that require custom plugins" with SWC-compatible equivalents — not the case here.
- No functional behavior in Engineering Atlas depends on SWC specifically; the original ADR-005 justification ("SWC compiles TypeScript and JSX significantly faster") is true in the abstract but doesn't apply at this project's current size, and upstream's own guidance for this exact situation is to use the default plugin.

**Decision:** Switched to `@vitejs/plugin-react`. Build, dev server, lint, typecheck, and the full test suite were re-verified after the switch (see M1A verification report).

---

## Design System Foundation

### Tailwind v4 Integration

Tailwind CSS v4 is integrated via `@tailwindcss/vite`, not PostCSS. No `tailwind.config.js` or `postcss.config.js` needed.

**Vite configuration:**

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
  /* Tokens defined here become both CSS custom properties
     and Tailwind utility classes (e.g., --color-accent → bg-accent, text-accent) */
  --color-bg: #fafafa;
  --color-accent: #2563eb;
  /* ... */
}
```

The `@import "tailwindcss"` directive replaces v3's `@tailwind base/components/utilities`. The `@theme` block defines design tokens that Tailwind exposes as utility classes.

**shadcn/ui token alignment:** shadcn/ui defines its own semantic tokens (`--background`, `--foreground`, `--primary`, etc.). Rather than maintaining two parallel token systems, shadcn component source files are adjusted when copied to reference Engineering Atlas tokens. One token system, not two.

### Design Tokens

Defined in the `@theme` block within `globals.css`. These are CSS custom properties and Tailwind utilities simultaneously.

```css
@theme {
  /* Neutral scale */
  --color-bg: #fafafa;
  --color-bg-subtle: #f4f4f5;
  --color-bg-muted: #e4e4e7;
  --color-surface: #ffffff;
  --color-border: #e4e4e7;
  --color-border-subtle: #f4f4f5;
  --color-text: #18181b;
  --color-text-secondary: #52525b;
  --color-text-muted: #a1a1aa;

  /* Accent */
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-text: #ffffff;

  /* Provider accents (used sparingly) */
  --color-azure: #0078d4;
  --color-aws: #ff9900;

  /* Semantic */
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: #2563eb;

  /* Typography — system font stacks, no web fonts */
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  /* Layout */
  --sidebar-width: 280px;
  --sidebar-width-collapsed: 0px;
  --header-height: 56px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}
```

Dark theme overrides the neutral scale and semantic colors via a `[data-theme="dark"]` attribute on the root element. Provider accent colors remain unchanged — they are brand colors, not theme-dependent.

Self-hosted web fonts (Inter, JetBrains Mono) can be evaluated in a later milestone when code-heavy content makes typographic precision more important. No external font loading in M1A.

### Typography Scale

All typography uses system font stacks. No web fonts loaded in M1A.

- **Sans:** `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Mono:** `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`

| Role | Size | Weight | Stack |
|---|---|---|---|
| Page title | 1.5rem (24px) | 600 | Sans |
| Section heading | 1.125rem (18px) | 600 | Sans |
| Body | 0.9375rem (15px) | 400 | Sans |
| Small / caption | 0.8125rem (13px) | 400 | Sans |
| Code / commands | 0.875rem (14px) | 400 | Mono |
| Sidebar item | 0.875rem (14px) | 400/500 | Sans |

### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | < 768px | Sidebar hidden, hamburger menu, stacked layout |
| Tablet | 768px – 1023px | Sidebar overlay on demand, single-column content |
| Desktop | >= 1024px | Sidebar persistent, full layout |

---

## Application Shell Components

### AppShell

The root layout component. Renders a CSS Grid layout:

```
┌──────────────────────────────────────────┐
│  Header (fixed, full width)              │
├────────────┬─────────────────────────────┤
│  Sidebar   │  MainContent               │
│  (fixed)   │  (scrollable)              │
│            │                             │
│            │  Breadcrumb                 │
│            │  RouteOutlet                │
│            │                             │
└────────────┴─────────────────────────────┘
```

Grid definition: `grid-template-columns: var(--sidebar-width) 1fr` on desktop, single column on mobile.

**Responsibilities:** Grid layout, responsive breakpoint handling, sidebar visibility.

### Header

Fixed top bar. Contains global controls only — no page-specific content.

**Contents:**
- Left: App logo/wordmark ("Engineering Atlas").
- Right: Theme toggle button.

Breadcrumbs are **not** in the header. They appear in MainContent, above the route outlet.

**No search in M1A.** Search is a future feature.

### Sidebar

Collapsible tree navigation showing the domain > category > concept hierarchy.

**Behavior:**
- Desktop: Always visible. Can be collapsed by user.
- Tablet: Hidden by default. Opens as overlay when toggled.
- Mobile: Hidden by default. Opens as overlay when toggled.

**Tree structure:**
- Domain name at the top (non-clickable label or link to domain overview).
- Categories as expandable sections.
- Concepts as leaf items within categories.
- Active concept highlighted.
- Categories expand/collapse on click.

**State:** Component-local `useState` for expanded categories. Active item derived from current route via React Router's `useLocation` or `useMatch`.

### MainContent

Scrollable area that renders the route outlet. Contains the breadcrumb above the route content.

### Breadcrumb

Rendered inside MainContent, above the route outlet. Derived from the current route path. Each segment links to its parent.

```
Cloud Fundamentals / Compute / Virtual Machines
```

**Metadata resolution:**

Breadcrumb labels come from the content index, not from raw URL segments or hardcoded per-route labels. The resolution chain:

1. React Router's `useMatches()` provides the matched route segments and their params (e.g., `domainId: "cloud-fundamentals"`, `categoryId: "compute"`, `conceptId: "virtual-machines"`).
2. A `resolveBreadcrumbs(matches, contentIndex)` utility looks up each param ID in the content index to get the display title.
3. The result is an array of `{ label: string, path: string }` objects rendered as linked segments.

This keeps URL identifiers (kebab-case slugs) separate from display labels (title-case names). Adding a new domain or concept requires no changes to the breadcrumb logic — the content index is the single source of truth for display names.

**Edge case:** The home page (`/`) has no breadcrumb. The domain page (`/cloud-fundamentals`) shows no breadcrumb or just the domain name as a non-linked label, since there's no meaningful parent to navigate to.

---

## Cloud Fundamentals Explorer — Information Architecture

The initial content index for the sidebar and route structure. This is the **minimum** data needed to populate navigation — not the full content model from CONTENT_MODEL.md.

### Minimal Content Index Type

```typescript
interface Domain {
  id: string;
  title: string;
  description: string;
  categories: Category[];
}

interface Category {
  id: string;
  title: string;
  description: string;
  concepts: ConceptMeta[];
}

type ConceptStatus = 'available' | 'in-development' | 'coming-soon';

interface ConceptMeta {
  id: string;
  title: string;
  description: string;
  status: ConceptStatus;
}
```

**Content availability status:**

| Status | Meaning | Sidebar | Category Page | Concept Page |
|---|---|---|---|---|
| `available` | Full learning content exists | Normal link | Normal entry | Full content rendered |
| `in-development` | Content is being built | Visible, dimmed, with badge | Listed with "In Development" label | Placeholder with description and status |
| `coming-soon` | Planned but not started | Visible, dimmed, with badge | Listed with "Coming Soon" label | Placeholder with description and status |

**M1A state:** All 25 concepts start as `coming-soon`. When M1B builds the first real concept, that concept moves to `available`. The UI clearly distinguishes available content from placeholders — no concept page should imply that a completed lesson exists when it does not.

**Interaction:** `coming-soon` and `in-development` concepts are navigable (the user can reach the placeholder page) but visually distinct from `available` concepts. This avoids dead links while being honest about content readiness.

No `prerequisites`, `relatedConcepts`, `providerImplementations`, `lessons`, `labs`, `icon`, or `visualizationType` fields yet. These are added when M1B needs them.

### Cloud Fundamentals Data

```
Cloud Fundamentals
├── Cloud Computing Models
│   ├── Cloud Service Models
│   └── Cloud Deployment Models
├── Global Infrastructure
│   ├── Regions and Availability Zones
│   └── Edge Locations and CDN
├── Compute
│   ├── Virtual Machines
│   ├── Containers
│   └── Serverless Functions
├── Storage
│   ├── Block Storage
│   ├── Object Storage
│   └── File Storage
├── Networking
│   ├── Virtual Networks
│   ├── Subnets and Routing
│   └── DNS and Content Delivery
├── Identity and Access Management
│   ├── Identity and Authentication
│   └── Authorization and Policies
├── Security
│   ├── Encryption and Key Management
│   └── Network Security
├── Load Balancing
│   ├── Application Load Balancing
│   └── Network Load Balancing
├── Scalability and Reliability
│   ├── Auto-Scaling
│   ├── High Availability
│   └── Disaster Recovery
└── Monitoring and Observability
    ├── Metrics and Alerting
    ├── Logging
    └── Distributed Tracing
```

10 categories, 25 concepts. Each concept has an `id`, `title`, and `description`. No lessons or provider implementations yet — those are M1B/M2 content.

---

## Page Components

### Home Page (`/`)

Displays the available learning domains. For Phase 1, this is just Cloud Fundamentals.

**Layout:** Centered content with a brief introduction to Engineering Atlas and a card/link for the Cloud Fundamentals domain. Not a card grid — it's one domain. Keep it simple.

**Future:** When more domains exist, this becomes a domain selection page.

### Domain Page (`/cloud-fundamentals`)

Overview of the Cloud Fundamentals domain.

**Layout:** Domain title, description, and a list of its categories with their concept counts. Clicking a category navigates to the category page. This is a lightweight overview, not a dashboard.

### Category Page (`/cloud-fundamentals/compute`)

Overview of a category and its concepts.

**Layout:** Category title, description, and a list of concepts with brief descriptions. Clicking a concept navigates to the concept page.

### Concept Page (`/cloud-fundamentals/compute/virtual-machines`)

**In M1A:** Renders based on the concept's `status` field:

- **`available`**: Full learning content (not applicable in M1A — no concepts have content yet).
- **`in-development`**: Concept title, description, and an "In Development" status indicator. Clear visual signal that content is being built.
- **`coming-soon`**: Concept title, description, and a "Coming Soon" status indicator. All 25 concepts start in this state.

This page is the mount point for M1B's learning workspace. When a concept gains real content, its `status` changes to `available` and the placeholder is replaced.

**What it proves:** The full navigation chain works — from domain explorer to concept page, with breadcrumbs and sidebar highlighting the active concept. Status indicators are honest about content availability.

---

## Implementation Tasks (Dependency Order)

### Phase 1: Project Bootstrap

| # | Task | Depends On | Acceptance |
|---|---|---|---|
| 1 | Initialize Vite + React + TypeScript project | — | `npm run dev` serves a blank page |
| 2 | Configure TypeScript strict mode | 1 | `tsconfig.json` has `strict: true`, no type errors |
| 3 | Configure ESLint | 1 | `npm run lint` runs clean |
| 4 | Set up `.gitignore` | 1 | `node_modules`, `dist`, `.env` excluded |

### Phase 2: Styling Foundation

| # | Task | Depends On | Acceptance |
|---|---|---|---|
| 5 | Install Tailwind CSS v4 + `@tailwindcss/vite`, configure Vite plugin | 1 | Tailwind classes render correctly in dev; no PostCSS config needed |
| 6 | Define design tokens in `@theme` block in `globals.css` | 5 | Tokens available as CSS custom properties and Tailwind utilities |
| 7 | Implement dark/light theme toggle | 6 | Theme switches via `data-theme` attribute, persists via `localStorage`, falls back to OS preference |
| 8 | Initialize shadcn/ui, align tokens, copy base components | 5, 6 | Button, ScrollArea, Separator, Tooltip render using our token system |

### Phase 3: Routing and Shell

| # | Task | Depends On | Acceptance |
|---|---|---|---|
| 9 | Install React Router (v8), define route tree | 1 | Routes defined for `/`, `/:domainId`, `/:domainId/:categoryId`, `/:domainId/:categoryId/:conceptId` |
| 10 | Build AppShell layout component | 5, 9 | CSS Grid layout renders with header, sidebar, main content areas |
| 11 | Build Header component | 8, 10 | Logo/wordmark and theme toggle visible |
| 12 | Build Sidebar component | 8, 10 | Sidebar renders with expand/collapse tree structure |
| 13 | Implement responsive sidebar behavior | 12 | Sidebar hides on mobile, overlay on tablet, persistent on desktop |

### Phase 4: Content and Navigation

| # | Task | Depends On | Acceptance |
|---|---|---|---|
| 14 | Define Cloud Fundamentals content index | — | TypeScript data file with 10 categories, 25 concepts |
| 15 | Populate sidebar from content index | 12, 14 | Sidebar tree reflects domain > category > concept hierarchy |
| 16 | Build Breadcrumb component | 11, 14 | Breadcrumb shows correct path, each segment links to parent |
| 17 | Build Home page | 9 | Shows domain card for Cloud Fundamentals |
| 18 | Build Domain page | 9, 14 | Shows category list from content index |
| 19 | Build Category page | 9, 14 | Shows concept list from content index |
| 20 | Build Concept placeholder page | 9, 14 | Shows concept title and description |

### Phase 5: Polish and Validation

| # | Task | Depends On | Acceptance |
|---|---|---|---|
| 21 | Sidebar active state highlighting + concept status styling | 15, 9 | Active concept highlighted; `coming-soon` concepts visually dimmed with badge |
| 22 | Navigation integration test | 17–21 | Full flow: home → domain → category → concept with correct breadcrumbs and sidebar state |
| 23 | Responsive layout testing | 13, 17–21 | Layout works at 320px, 768px, and 1280px widths |
| 24 | Add SPA fallback (`vercel.json` rewrite) | 1 | Deep links work in `vite preview` after build and on Vercel |
| 25 | Verify build output and deep-link behavior | All | `npm run build` succeeds; `vite preview` serves all routes correctly including direct deep-link access |

---

## Static Hosting and Deep-Link Behavior

React Router uses client-side routing. All routes resolve to the same `index.html` — the server must return it for any path, not just `/`.

**Requirements:**
- Opening a nested URL directly (e.g., `/cloud-fundamentals/compute/virtual-machines`) in a fresh browser tab renders the correct page.
- Refreshing any page does not produce a 404.
- Internal navigation between pages works without full page reloads.

**M1A approach (revised at verification):** The hosting target is Vercel. `vercel.json` at the project root defines a catch-all rewrite to `index.html`. The earlier `public/_redirects` (Netlify-specific) has been removed since it had no effect on the actual target.

**Development:** `vite dev` and `vite preview` handle SPA fallback automatically.

See ADR-004 for the full hosting matrix and fallback methods per platform.

---

## Persistence Scope in M1A

M1A has exactly one piece of persisted state: **theme preference** (light/dark).

**Implementation:** A `data-theme` attribute on the document root, toggled by a small React context. The preference is read from and written to `localStorage` directly — no abstraction layer, no wrapper library, no generic persistence engine.

```typescript
const THEME_KEY = 'engineering-atlas-theme';
localStorage.getItem(THEME_KEY);  // 'light' | 'dark' | null
localStorage.setItem(THEME_KEY, theme);
```

**Explicitly out of scope:**
- Learning progress persistence (M4).
- Simulation state checkpoints (M3).
- Lab completion tracking (M3).
- IndexedDB usage (M4).
- Any generic persistence layer or storage abstraction.

If `localStorage` is unavailable (e.g., private browsing with storage blocked), the theme defaults to the OS preference via `prefers-color-scheme`. No error is thrown.

---

## Testing Strategy for M1A

### Vitest Configuration

Tests use Vitest with jsdom for DOM simulation. Configuration lives in `vite.config.ts`:

```typescript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.ts'],
}
```

The setup file (`src/test/setup.ts`) registers `@testing-library/jest-dom/vitest` matchers globally.

### Unit Tests (Vitest)

- Content index: validate structure (every concept has a category, every category has a domain, every concept has a valid `status`).
- Breadcrumb utility: `resolveBreadcrumbs()` returns correct labels and paths for given route matches.
- Theme toggle: switching theme sets the correct `data-theme` attribute and `localStorage` value.

### Component Tests (Vitest + Testing Library + user-event)

- Sidebar: renders categories and concepts, expand/collapse works via user-event click.
- Breadcrumb: renders correct segments for a given route.
- Page components: render with correct content from route params.
- Concept page: displays appropriate status indicator for `coming-soon` concepts.

### Manual Testing

- Navigate the full hierarchy in a browser.
- Test responsive behavior at mobile, tablet, desktop widths.
- Verify dark/light theme toggle persists across page refresh.
- Verify build produces a working static site.
- Open a deep link directly and verify correct rendering.

**No E2E tests in M1A.** The application is too small to justify Playwright/Cypress setup overhead. E2E testing is introduced when there are interactive flows to test (M1B).

---

## Acceptance Criteria

M1A is complete when:

1. `npm run dev` starts a working development server.
2. `npm run build` produces a deployable static site.
3. The application shell renders with header, sidebar, and main content area.
4. The header contains the Engineering Atlas wordmark and theme toggle. No breadcrumb in the header.
5. The sidebar shows the Cloud Fundamentals domain hierarchy (10 categories, 25 concepts).
6. Concepts display their content availability status (`coming-soon` in M1A) — visually distinct from available content.
7. Clicking a concept in the sidebar navigates to the concept page.
8. Breadcrumbs appear in the main content area (above the route outlet), reflect the current navigation path, and each segment links to its parent. Labels come from the content index, not URL slugs.
9. The theme toggle switches between light and dark themes and persists via `localStorage`.
10. The sidebar collapses on mobile and tablet viewports.
11. All routes render the correct page content.
12. Opening a deep link directly (e.g., `/cloud-fundamentals/compute/virtual-machines`) renders the correct page. Refreshing any nested page does not produce a 404 (verified via `vite preview`).
13. Typography uses system font stacks only. No external font loading.
14. The design follows Engineering Atlas visual direction: clean, technical, editorial — not a SaaS dashboard.
15. TypeScript strict mode is enabled with no errors.
16. ESLint runs clean.
17. Unit and component tests pass (`npm run test`).

---

## Resolved Questions

### Web fonts

**Decision:** System font stacks only in M1A. No Inter, no JetBrains Mono, no external font loading. Self-hosted fonts can be evaluated in a later milestone when code-heavy content makes typographic precision more important.

### Breadcrumb placement

**Decision:** Breadcrumbs appear in MainContent (above the route outlet), not in the Header. The Header contains only the wordmark and global controls.

### Persistence scope

**Decision:** Only theme preference uses `localStorage`. No IndexedDB, no abstraction layer.

## Open Questions

### 1. shadcn/ui initialization method

shadcn/ui has a CLI (`npx shadcn@latest init`) that scaffolds configuration. The CLI supports Tailwind v4 initialization. Options:
- **Use CLI** — fastest; generates `components.json`, `lib/utils.ts`, and CSS variables.
- **Manual setup** — copy the utility function and component files directly if CLI output conflicts with our token naming.

**Recommendation:** Use the CLI with Tailwind v4 options selected. Adjust generated token names to match our `--color-*` convention. If the CLI generates a parallel token system that conflicts, strip it and configure manually.

### 2. Lazy loading granularity

Should route-level code splitting happen at the page level or the domain level?
- **Page-level** (each page is a lazy chunk): More chunks, finer splitting, but Cloud Fundamentals pages are small.
- **Domain-level** (all Cloud Fundamentals pages in one chunk): Simpler, one load gets all navigation pages.

**Recommendation:** Page-level lazy loading at the route definition. Vite handles chunk splitting well, and this pattern scales when content gets heavier in M1B/M2.

---

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Tailwind v4 + shadcn/ui incompatibility | Styling setup delays | Manual component setup as fallback; shadcn components are just source files |
| Route structure doesn't accommodate future needs (labs, providers) | Restructuring later | ADR-004 defines the structure with M1B routes in mind; nested routes extend naturally |
| Design tokens evolve significantly during M1B | Rework of M1A styling | Tokens are CSS custom properties — changing values is trivial; adding new tokens doesn't break existing ones |
| Content hierarchy changes as real content is authored | Sidebar and routing changes | Content index is a single TypeScript file — changes are localized |
