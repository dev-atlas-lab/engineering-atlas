# UX Principles — Engineering Atlas

## Design Philosophy

Engineering Atlas is an **interactive technical learning experience**, not a documentation site or a SaaS dashboard.

The design draws inspiration from interactive technical storytelling — editorial layouts, illustration-driven exploration, and canvas-centric workspaces — rather than from generic web application templates.

**Reference inspiration:** Platforms like Designed to Scale that use visual storytelling to make complex systems explorable.

---

## Core Principles

### 1. Show the System, Don't Describe It

Every concept has an underlying system with components, connections, and behavior. The primary job of the UI is to make that system visible and explorable.

- Lead with a visual representation, not a wall of text.
- Use the visualization as the anchor — text explains what the visual shows.
- If a concept can't be meaningfully visualized, use structured walkthroughs instead of forcing a diagram.

### 2. Adapt the Visualization to the Concept

Different concepts require different visual approaches. Do not force every lesson into the same diagram template.

| Concept Type | Visual Approach |
|---|---|
| Infrastructure topology | Interactive node graph (React Flow) |
| Network protocols | Sequence diagram with timeline |
| Data structures | Animated structural diagram (SVG/D3) |
| State machines | State transition diagram |
| Multi-node systems | Distributed simulation view |
| Permission models | Flow diagram with decision points |
| Resource hierarchies | Tree/hierarchy visualization |

### 3. Make It Explorable

Engineers learn by investigating. The UI should support:

- **Inspection.** Click any component to see its details, configuration, and relationships.
- **Timeline controls.** Step forward, step backward, replay sequences.
- **Parameter modification.** Change inputs and observe different outcomes.
- **Zoom levels.** Overview for context, detail for understanding.

### 4. Minimize Cognitive Load

- One concept at a time. Don't split attention across unrelated information.
- Progressive disclosure. Show the essential first, reveal depth on demand.
- Consistent interaction patterns. Inspection, stepping, and navigation work the same everywhere.
- Clear labels. No jargon without definition. Provider-specific terms are always marked.

### 5. Distinguish Concepts from Implementations

The UI must visually separate:

- **Generic concepts** (what virtual machines are, how they work).
- **Provider implementations** (Azure VMs, EC2).
- **Comparisons** (how the two differ in architecture, capabilities, pricing).

Use layout, color coding, or tabs — but make the boundary unmistakable.

### 6. Honest Labs

- Simulations are labeled as simulations.
- Local labs explain what the user needs to do — the platform does not fake execution.
- Expected results are shown so the user can self-validate.
- Validation checklists are honest about what they can and cannot verify.

---

## Layout Structure

### Application Shell

```
┌─────────────────────────────────────────────┐
│  Navigation Bar                             │
├──────────┬──────────────────────────────────┤
│          │                                  │
│  Domain  │  Learning Workspace              │
│  Sidebar │                                  │
│          │  ┌────────────────────────────┐  │
│  - Domain│  │  Visualization / Canvas    │  │
│  - Cat.  │  │                            │  │
│  - Conc. │  │                            │  │
│          │  └────────────────────────────┘  │
│          │                                  │
│          │  Content / Explanation            │
│          │                                  │
│          │  Lab / Challenge                  │
│          │                                  │
├──────────┴──────────────────────────────────┤
│  Progress / Breadcrumb                      │
└─────────────────────────────────────────────┘
```

### Learning Workspace Zones

1. **Visualization zone** — the primary canvas for the current concept's visual.
2. **Content zone** — explanation text, code snippets, provider details.
3. **Interaction zone** — controls, parameters, step buttons, inspector panel.
4. **Lab zone** — instructions, tasks, expected results, validation.

Zones are fluid. A simulation-heavy lesson expands the visualization zone. A lab-heavy lesson expands the lab zone. Not all zones appear in every lesson.

---

## Visual Direction

### Typography

- Strong technical typography. Monospace for code, identifiers, and commands.
- Clear hierarchy: concept title, section headings, body text, annotations.
- Readable at all viewport sizes.

### Color

- Muted, professional palette. Not playful, not corporate.
- Semantic color usage: provider colors for provider-specific content (Azure blue, AWS orange) used sparingly and consistently.
- High contrast for accessibility. WCAG AA minimum.
- Support light and dark themes.

### Animation

- Purposeful animation only. Animate to show state changes, data flow, or sequence progression.
- Timeline-controlled. Users can pause, step, and replay.
- No decorative animation. No loading spinners disguised as content.

### Iconography

- Minimal icon usage. Prefer labels over icons.
- When icons are needed, use a consistent icon set.
- Provider logos used only in provider-specific contexts.

---

## Anti-Patterns

Avoid these in the Engineering Atlas UI:

- **Generic card grids.** Don't present concepts as a grid of identical cards with stock images.
- **Text-heavy lessons.** If the lesson is mostly paragraphs, the visualization is missing or wrong.
- **Decorative diagrams.** Every diagram must teach something. If removing it doesn't hurt understanding, remove it.
- **Dashboard aesthetic.** This is a learning platform, not an analytics product.
- **Excessive whitespace and padding.** Use space intentionally, not as filler.
- **AI-generated illustrations.** No decorative hero images. Use technical diagrams.
- **Gratuitous gradients and glass effects.** Clean, functional, technical.

---

## Responsive Behavior

- **Desktop-first** design. The visualization canvas needs screen real estate.
- **Tablet:** Collapse sidebar, stack zones vertically.
- **Mobile:** Simplified layout. Visualizations may switch to a scrollable view. Labs remain fully usable.
- Minimum supported width: 320px. Optimal experience: 1024px+.
