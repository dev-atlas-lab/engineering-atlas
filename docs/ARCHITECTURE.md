# Architecture — Engineering Atlas

## System Overview

Engineering Atlas is a frontend-only single-page application. All content is bundled at build time. All state is local to the browser.

```
┌──────────────────────────────────────────────────────┐
│                    Browser                           │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Application Shell                  │ │
│  │  ┌──────────┬───────────────────────────────┐   │ │
│  │  │  Domain  │      Active Workspace         │   │ │
│  │  │ Explorer │                               │   │ │
│  │  │          │  ┌─────────────────────────┐  │   │ │
│  │  │          │  │  Visualization Engine   │  │   │ │
│  │  │          │  │  (React Flow / SVG / D3)│  │   │ │
│  │  │          │  └─────────────────────────┘  │   │ │
│  │  │          │  ┌─────────────────────────┐  │   │ │
│  │  │          │  │  Content Renderer       │  │   │ │
│  │  │          │  │  (MDX / Components)     │  │   │ │
│  │  │          │  └─────────────────────────┘  │   │ │
│  │  │          │  ┌─────────────────────────┐  │   │ │
│  │  │          │  │  Lab / Simulation       │  │   │ │
│  │  │          │  │  Engine                 │  │   │ │
│  │  │          │  └─────────────────────────┘  │   │ │
│  │  └──────────┴───────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Persistence Layer                  │ │
│  │         (IndexedDB / LocalStorage)              │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## Application Layers

### 1. Application Shell

The outermost layer. Handles routing, layout, navigation, and global state.

**Responsibilities:**
- Top-level routing (React Router).
- Responsive layout: navigation bar, sidebar, main content area.
- Domain explorer sidebar: browse domains, categories, concepts.
- Breadcrumb and progress indicators.
- Theme management (light/dark).
- Global keyboard shortcuts.

**Key decisions:**
- File-system routing vs. centralized route config — recommend centralized for explicit control over learning paths.
- Sidebar state managed with Zustand.

### 2. Domain Explorer

The navigation layer for browsing learning content.

**Responsibilities:**
- Render domain > category > concept hierarchy.
- Show completion state per concept.
- Support search and filtering.
- Handle concept prerequisites (show recommended learning order).

**Data source:** Static content index generated at build time.

### 3. Learning Workspace

The primary content area where a learner studies a concept.

**Responsibilities:**
- Load and render lesson content (MDX or TypeScript-driven).
- Mount the appropriate visualization for the current lesson.
- Provide section navigation within a lesson.
- Handle provider tab switching (concept vs. Azure vs. AWS vs. comparison).
- Coordinate between visualization, content, and lab zones.

**Layout modes:**
- **Visualization-primary:** Canvas takes most of the viewport. Text alongside or below.
- **Content-primary:** Text-driven lesson with inline visualizations.
- **Lab-primary:** Lab instructions and simulation controls dominate.
- **Split:** Side-by-side visualization and content (desktop only).

### 4. Visualization Engine

Renders interactive technical diagrams and architecture views.

**Responsibilities:**
- Accept a scene definition (nodes, edges, annotations, state).
- Render using the appropriate technology (React Flow, SVG/D3, or custom).
- Support component inspection (click to see details).
- Support state transitions (animate between states).
- Support timeline control (play, pause, step, scrub).
- Provide reusable visual primitives (server, database, network, queue, etc.).

**Architecture:**

```
Scene Definition (data)
  │
  ├── SceneRenderer (picks rendering strategy)
  │     ├── ReactFlowScene (node-based graphs)
  │     ├── SVGScene (custom diagrams, D3)
  │     └── SequenceScene (protocol sequences)
  │
  ├── ComponentInspector (detail panel)
  │
  └── TimelineController (step/play/scrub)
        └── StateManager (tracks scene states)
```

See [VISUALIZATION_ENGINE.md](VISUALIZATION_ENGINE.md) for full specification.

### 5. Simulation Engine

Manages deterministic, steppable simulations.

**Responsibilities:**
- Define simulation state and transition rules.
- Execute transitions deterministically (same inputs → same outputs).
- Support step-forward, step-backward, and replay.
- Expose user-controllable parameters.
- Validate simulation outcomes against expected results.

**Architecture:**

```
SimulationDefinition
  ├── initialState
  ├── parameters (user-controllable)
  ├── transitions[] (state → event → state)
  └── validationRules[]

SimulationRuntime
  ├── currentState
  ├── history[] (all past states for step-back)
  ├── step(direction)
  ├── reset()
  ├── setParameter(key, value)
  └── validate() → ValidationResult
```

The simulation engine is **decoupled from the visualization engine**. A simulation produces state; the visualization engine renders it. This allows the same simulation to power different visual representations.

### 6. Lab Engine

Manages lab experiences: instructions, tasks, validation, and progress.

**Responsibilities:**
- Load lab definitions.
- Render prerequisites, instructions, and tasks.
- Track task completion (user self-reports).
- Display expected results and validation criteria.
- Provide hints and troubleshooting guidance.
- Save lab progress.

See [LAB_ENGINE.md](LAB_ENGINE.md) for full specification.

### 7. Persistence Layer

All data is stored locally in the browser.

**Storage strategy:**

| Data | Storage | Reason |
|---|---|---|
| User preferences (theme, sidebar) | LocalStorage | Small, simple key-value |
| Learning progress | IndexedDB | Structured, queryable |
| Lab checkpoints | IndexedDB | May include complex state |
| Last visited concept | LocalStorage | Quick access |

**Constraints:**
- No server sync. Data exists only in this browser.
- Graceful degradation if storage is unavailable (private browsing).
- Export/import progress as JSON (future consideration).

---

## State Management

> **Superseded for M2 onward** by `docs/decisions/ADR-006-reduced-state-management-footprint.md`. The six-store design below was the M0 intent; M2 implemented only `progressStore`, with the other five deferred until a real cross-cutting need for each appears. The table is kept here as the original design record.

**Zustand** for application state, organized by concern:

| Store | Responsibility |
|---|---|
| `navigationStore` | Sidebar state, current route, breadcrumb |
| `workspaceStore` | Current concept, active lesson, active tab |
| `visualizationStore` | Current scene, timeline position, inspector state |
| `simulationStore` | Simulation state, parameters, history |
| `progressStore` | Completion state, lab progress |
| `preferencesStore` | Theme, layout preferences |

Stores are independent. No store imports another store. Cross-store coordination happens in React components or hooks.

---

## Content Pipeline

```
Content Source Files (.tsx / .mdx)
  │
  ├── Build-time: Vite bundles content into the app
  │     ├── TypeScript modules: type-checked, tree-shaken
  │     └── MDX files: compiled to React components
  │
  └── Runtime: Content loaded via dynamic import
        └── Code splitting by domain/concept for performance
```

No runtime content fetching. No CMS. Content is code.

---

## Routing

```
/                                   → Home / Domain Explorer
/domains/:domainId                  → Domain overview
/domains/:domainId/:categoryId      → Category overview
/concepts/:conceptId                → Concept (default lesson)
/concepts/:conceptId/lessons/:id    → Specific lesson
/concepts/:conceptId/providers/:id  → Provider implementation
/concepts/:conceptId/compare        → Provider comparison
/concepts/:conceptId/labs/:id       → Lab
```

---

## Performance Considerations

- **Code splitting:** Each domain and its concepts are lazy-loaded.
- **Visualization lazy loading:** Heavy visualization libraries (D3, React Flow) are loaded only when needed.
- **Static content:** No API calls. Navigation is instant after initial load.
- **Asset optimization:** SVG for diagrams (scalable, small). Raster images only when necessary.

---

## Testing Strategy

| Layer | Testing Approach |
|---|---|
| Content model | Unit tests — validate structure, relationships, no broken links |
| Simulation engine | Unit tests — deterministic input/output, step-back correctness |
| Visualization engine | Component tests — renders without error, responds to state changes |
| Lab engine | Component tests — task tracking, validation display |
| Application shell | Integration tests — navigation, routing, layout |
| Full learning flow | E2E tests — navigate to concept, view lesson, complete lab |
