# ADR-007: Per-Concept Content Loading

## Status

Accepted

## Context

Through Slice 2A, every page imported the Cloud Fundamentals content index synchronously. That index held each concept's metadata together with its full lesson bodies, scenes, labs, knowledge checks and simulation bindings. So the whole domain's learning content was downloaded on every page, Home included. After Slice 2A this came to 397 KB raw (119 KB gzip) of content, and it would grow with each of the six categories still to author.

Two things depend on content synchronously and cannot wait for a download:

- **Discovery pages:** Home, domain and category pages, including status badges.
- **Navigation chrome:** breadcrumbs, the Level 2 lesson nav, and previous/next links.

All of them need only titles, IDs, order and status. None of them need lesson bodies.

## Decision

Split content into eager **metadata** and lazy **per-concept content**.

**Metadata (eager)**
- Files: `src/content/cloud-fundamentals/index.ts`, `*/index.ts` and `*/meta.ts`.
- Contents: domains, categories, `ConceptMeta`, and each concept's `LessonMeta[]` and `LabMeta[]`.
- This is the single source of truth for every id, title, kind/type, status and order.
- These files must never import a content module. A test reads their source and fails if they do.

**Content (lazy, one chunk per concept)**
- Each active concept's module, e.g. `compute/virtual-machines.ts`, exports a `ConceptContentModule`.
- That module is a set of maps keyed by id: lesson bodies (`LessonBody`), lab bodies (`LabBody`) and simulation bindings.
- Bodies carry no title or order, so they cannot drift from metadata.

**Loader**
- `concept-loaders.ts` holds an explicit registry of `() => import('./category/concept')`, one entry per concept that has lessons.
- The registry is not a glob or a barrel, so the build gives each concept its own chunk.
- `conceptContentLoader.load(conceptId)` checks the requested concept against metadata, imports it, and checks that the module's lesson and lab ids exactly match the metadata.
- It returns lessons and labs in metadata order.
- Results are cached per concept, and concurrent loads of the same concept share one request.
- A failed load is not cached.
- Failures are a typed `ContentLoadError`, with `kind` set to `unknown-concept`, `missing-module`, `import-failed` or `content-mismatch`.

**Pages**
- Lesson and lab pages render the title, breadcrumbs, lesson nav and pagination from metadata immediately, then load the body with `useConceptContent`.
- A lesson or lab id that is not in the metadata shows Not Found, without downloading anything.
- The concept overview prefetches its own concept.
- Discovery pages load no concept content.

**Error recovery**
- An `import-failed` error offers **"Reload and try again"**, which is a full page reload on the same URL.
- Chromium-based browsers cache a failed dynamic import for the life of the page. In Edge, an in-place retry made no new request and failed again immediately.
- Progress is in IndexedDB, so a reload loses nothing.

## Reasoning

- Splitting by concept matches how learners use the app: one concept at a time, several lessons in a row. Within a concept, moving to the next lesson needs no further download.
- Keeping metadata eager keeps every route's frame (heading, breadcrumbs, navigation) synchronous. Deep links, refresh and back/forward work the same way they did before.
- An explicit registry costs one line per concept. In exchange, chunk boundaries are visible in code review, and a test checks that the registry covers exactly the concepts that have lessons.
- No new dependency or state layer was needed. The cache is a pair of `Map`s inside the loader, and the hook uses plain `useState`/`useEffect`.

## Consequences

**Measured gzip JavaScript per page, cold cache**

| Page | Before | After |
|---|---|---|
| Home | 194.6 KB | 118.4 KB |
| Domain | 194.6 KB | 118.4 KB |
| Category | 195.0 KB | 118.8 KB |
| Concept overview | 197.0 KB | 135.3 KB |
| Lesson | 282.7 KB | 221.7 KB |
| Lab | 201.0 KB | 136.4 KB |

- Each concept chunk is 12.8–32.6 KB raw (4.7–10.5 KB gzip).
- The entry chunk now contains React, React DOM, React Router and shared UI code that used to sit in the content chunk. The metadata in it is about 23 KB raw.
- Opening a concept for the first time shows a short loading state ("Loading lesson content…" / "Loading lab…") on a slow connection. Within a concept, there is no loading state after the first load.
- Adding a concept now means editing three places:
  - its metadata in the category's `meta.ts`;
  - its content module exporting `content`;
  - one entry in `conceptLoaders`.

  Tests fail if these disagree.
- Lesson views mark a lesson viewed only once its body has rendered. A failed load does not record progress.

**Related fix: progress store race**
- Before this change, a progress write made before IndexedDB finished loading could overwrite the stored snapshot. The merged state was also never written back.
- Lazy loading makes this window more likely, so it is fixed here. Writes made before load are kept, merged with the snapshot, and then persisted.

## Reviewed Alternatives

- **Glob-based registry (`import.meta.glob`)**
  - Less boilerplate.
  - Hides the chunk boundaries.
  - Ties concept ids to file paths implicitly.
  - Rejected while the registry is small and explicit lines are cheap.
- **Route-level data loaders (React Router `loader`)**
  - Would block the whole route, including the metadata frame, until content arrives.
  - Would couple content loading to the router API.
  - The page-level hook keeps the frame instant and is easier to test.
- **Split by category instead of by concept**
  - Fewer chunks.
  - Most of what a learner downloads would be concepts they are not studying.
  - Category chunks would grow with every new concept.
