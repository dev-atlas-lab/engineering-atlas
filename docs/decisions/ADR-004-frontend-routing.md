# ADR-004: Frontend Routing — React Router v8

## Status

Accepted

## Context

Engineering Atlas needs client-side routing for navigating between domains, categories, concepts, lessons, and labs. ARCHITECTURE.md assumed React Router without formal evaluation.

The two leading options evaluated were **React Router v7** (library mode) and **TanStack Router v1**. At M1A implementation time, installing the unpinned `react-router` package resolved to **v8.5.2** — the current major at that time, which had superseded v7 on npm. v8 is a continuation of the same library-mode API evaluated below; see "Why v8 Instead of v7" for the compatibility review performed before accepting the version actually installed.

### Requirements

- URL-based navigation to any concept, lesson, or lab.
- Lazy loading of routes for code splitting.
- Breadcrumb generation from the route hierarchy.
- Search params for UI state (e.g., active provider tab, timeline position) — needed in M1B, not M1A.
- No server-side rendering. No data loading from APIs.
- TypeScript with strict mode.

## Options

### Option A: React Router v7 (Library Mode)

React Router v7 merged with Remix but can still be used as a plain SPA routing library in "library mode" (no framework features, no server).

**Pros:**
- Mature, battle-tested, widely used.
- Large community and extensive documentation.
- Simple mental model for SPA routing.
- Lazy loading with `React.lazy` and route-level code splitting.
- v7 added type generation for route params via `typegen`.
- Object-based route definitions for explicit control.

**Cons:**
- Search param handling is manual (`useSearchParams` returns `URLSearchParams`).
- Route param types require codegen step or manual type assertions.
- Loaders/actions pattern is designed for data fetching, which we don't use.

### Option B: TanStack Router v1

Purpose-built for type-safe routing in React + TypeScript applications.

**Pros:**
- Route params and search params are fully typed at the definition level.
- Built-in search param validation with schema libraries (Zod, Valibot).
- Excellent devtools for debugging route state.
- Fine-grained code splitting with route-level `lazy()`.

**Cons:**
- Smaller community and fewer examples.
- More complex initial setup (router definition, route tree generation).
- Steeper learning curve for contributors unfamiliar with it.
- Some patterns feel over-engineered for a static-content SPA with no data fetching.

## Decision

**React Router v8 in library mode.**

(The evaluation below was written against v7; the API surface Engineering Atlas uses — `createBrowserRouter`, `RouterProvider`, object-based routes, `Link`, `useParams`, `useLocation`, route-level `lazy`/`React.lazy` — is unchanged in v8. The reasoning is retained as originally written and applies to the installed version without modification.)

## Reasoning

1. **Simplicity matches scope.** Engineering Atlas is a static-content SPA. Routes load bundled content, not API data. React Router's core navigation, lazy loading, and nested routes are sufficient.

2. **Lower setup complexity.** React Router in library mode needs a route tree and an outlet. TanStack Router needs a router instance, route tree generation, and type-safe search param schemas before writing a single page.

3. **Contributor accessibility.** React Router is the most commonly known React routing library. New contributors can navigate the codebase without learning a new paradigm.

4. **Search params are deferrable.** M1A needs page navigation only. When M1B needs URL-encoded visualization state (provider tab, timeline position), a thin typed wrapper around `useSearchParams` handles it without changing the router.

5. **Migration is feasible.** If TanStack Router's type safety becomes a bottleneck later, migration is straightforward — both libraries use similar concepts (route trees, params, outlets, lazy loading). The investment in React Router is not a dead end.

## Why v8 Instead of v7

`react-router` was installed without a version pin during M1A implementation (`npm install react-router`), which resolved to v8.5.2 rather than the v7 evaluated in this ADR's original drafting. This was not a deliberate separate evaluation of v8 — it is what the package registry served as "current" at install time.

**Compatibility review performed after the fact:**

- The APIs Engineering Atlas actually uses in M1A — `createBrowserRouter`, `RouterProvider`, object-based `RouteObject[]` definitions, `Link`, `useParams`, `useLocation`, `Outlet`, and `React.lazy`-based route splitting — are present and unchanged in v8. No v7→v8 breaking change affects this subset.
- v8 does not reintroduce Remix framework coupling; library mode (no loaders/actions, no server) remains fully supported.
- Search param handling, deferred to M1B per this ADR, is unaffected — `useSearchParams` has the same shape in v8.

**Runtime requirement:** `react-router` v8 declares `"engines": { "node": ">=22.22.0" }` in its own `package.json`. This is a **harder requirement than v7**, which supported older Node 18/20 LTS lines. Engineering Atlas's development machine runs **Node v26.13.1** (installed via winget during M1A bootstrap), which satisfies this. This minimum is now recorded as the project's Node requirement — see "Node.js Runtime Requirement" below.

**Conclusion:** No change to the decision rationale is needed. The reasoning in this ADR (simplicity, lower setup complexity vs. TanStack, contributor familiarity, deferred search params, feasible future migration) applies identically to v8. The version number in this ADR's title and decision has been corrected to reflect what is actually installed, rather than silently diverging from documentation.

## Node.js Runtime Requirement

React Router v8 requires **Node.js >= 22.22.0**. This is the binding minimum for Engineering Atlas's toolchain as of M1A, driven by this dependency (Vite 8 and other M1A devDependencies are also compatible with this floor; none require a higher minimum).

- Verified installed version: **Node v26.13.1**, **npm 11.20.0**.
- This requirement should be added to `package.json`'s `engines` field (done in M1A verification) so `npm install` warns on an incompatible Node version instead of failing opaquely at dependency resolution or runtime.
- CI and contributor onboarding docs (when they exist) must state Node >= 22.22.0 as a prerequisite.

## Route Structure

```
/                                        → Home
/cloud-fundamentals                      → Domain overview
/cloud-fundamentals/compute              → Category overview
/cloud-fundamentals/compute/virtual-machines         → Concept
/cloud-fundamentals/compute/virtual-machines/azure   → Provider impl
/cloud-fundamentals/compute/virtual-machines/aws     → Provider impl
/cloud-fundamentals/compute/virtual-machines/compare → Comparison
/cloud-fundamentals/compute/virtual-machines/labs/:labId → Lab
```

**Change from M0:** The route structure now nests concepts under their domain and category path instead of splitting `/domains/` and `/concepts/` into separate hierarchies. This makes URLs self-describing, enables breadcrumbs from route segments, and matches how the sidebar represents the hierarchy.

The trade-off is longer URLs, but these are technical learning paths — descriptive URLs are a feature, not a problem.

## SPA Fallback for Static Hosting

React Router uses client-side routing. When a user opens a deep link (e.g., `/cloud-fundamentals/compute/virtual-machines`) directly or refreshes a nested page, the static file server must return `index.html` for all paths — not a 404.

**Requirement:** The build output must include the SPA fallback configuration appropriate for the hosting platform.

**Common hosting solutions:**

| Host | Fallback Method |
|---|---|
| Netlify | `_redirects` file: `/* /index.html 200` |
| **Vercel (chosen target)** | `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` |
| GitHub Pages | `404.html` as a copy of `index.html` (workaround) |
| Cloudflare Pages | Automatic SPA fallback for single-page apps |
| Local preview (`vite preview`) | Works by default — Vite handles fallback |

**M1A approach (revised at verification):** The hosting target is **Vercel**. The project uses `vercel.json` with a catch-all rewrite to `index.html`, not the Netlify `_redirects` file. The `public/_redirects` file from initial M1A implementation has been removed since it has no effect on Vercel and left a stale, platform-mismatched artifact in the repo.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This file lives at the project root (not `public/`) since Vercel reads `vercel.json` from the project root, not from the static asset directory.

**Acceptance criteria:**
- Opening a nested URL directly (e.g., `/cloud-fundamentals/compute/virtual-machines`) in a fresh browser tab renders the correct page.
- Refreshing any page does not produce a 404.
- Internal navigation between pages works without full page reloads.
- `vite preview` serves all routes correctly after `npm run build`.
- `vercel.json` rewrite is present and correctly scoped (does not interfere with static asset serving under `/assets/`).

## Consequences

- React Router v8 installed in library mode (no Remix framework features).
- Route definitions use the object-based API for explicit control.
- Route-level code splitting via `React.lazy`.
- Breadcrumbs derived from route matches.
- Search param handling deferred to M1B; will use a typed utility wrapper, not raw `useSearchParams`.
- Node.js >= 22.22.0 is now a binding toolchain requirement, driven by this dependency.
- Hosting target is Vercel; SPA fallback is handled via `vercel.json` rewrites, not a `_redirects` file.
