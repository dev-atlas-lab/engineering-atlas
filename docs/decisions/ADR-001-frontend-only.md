# ADR-001: Frontend-Only Architecture

## Status

Accepted

## Context

Engineering Atlas is an interactive learning platform. We need to decide whether to build a backend service or operate as a frontend-only application.

A backend would enable: user accounts, server-side progress sync, content management system, server-side rendering, and real cloud resource provisioning.

However, the initial product scope does not require any of these capabilities. The platform teaches engineering concepts through visualizations, simulations, and locally-executed labs.

## Decision

Build Engineering Atlas as a **frontend-only single-page application** with no backend service.

- All content is bundled at build time.
- All user data (progress, preferences) is stored in the browser via IndexedDB and LocalStorage.
- Simulations run entirely in the browser.
- Labs provide instructions; they do not execute commands or provision cloud resources.
- The application is served as static files from a CDN.

## Consequences

**Benefits:**
- Zero infrastructure cost (static hosting only).
- No authentication complexity.
- Instant navigation after initial load (no API calls).
- No data privacy concerns — user data never leaves their browser.
- Simpler deployment: build, upload, done.
- Lower barrier to contribution — no backend setup required.

**Trade-offs:**
- No cross-device progress sync. If a user switches browsers, they start over.
- No server-side content search or filtering (must be client-side).
- Content updates require a new deployment (no hot content updates).
- No analytics on learning patterns (unless a third-party service is added).
- Initial bundle size may be significant with all content included (mitigated by code splitting).

**Mitigations:**
- Progress export/import as JSON (future feature) for portability.
- Aggressive code splitting by domain and concept to reduce initial load.
- Build-time content validation to catch errors before deployment.

## Future Considerations

If the product needs user accounts, cross-device sync, or real cloud sandboxes, a backend can be introduced incrementally. The frontend architecture should not assume a backend exists but should not prevent one from being added.
