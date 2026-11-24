# M1B — UX Wireframes

## Status

Proposal. ASCII wireframes for structure and behavior, not pixel-accurate layout. Documentation only.

## Notation

- Desktop: ≥1024px (`lg:`, matches M1A's existing breakpoint)
- Tablet: 768–1023px (new treatment — M1A has none)
- Mobile: <768px (matches M1A's existing drawer breakpoint)
- `[x]` = honest current content state as of this writing (every concept is `coming-soon`)

---

## 1. Home

### Desktop

```
┌──────────────────────────────────────────────────────────────┐
│  ☰  Engineering Atlas                                   ☾    │  Header (unchanged from M1A)
├──────────────────────────────────────────────────────────────┤
│                                                                │
│   Engineering Atlas                                           │
│   Understand systems. Explore architecture. Master eng.       │
│                                                                │
│   [Continue learning →]   ← only if a real last-visited       │
│                              signal exists; absent otherwise   │
│                                                                │
│   Learning Domains                                            │
│   ┌──────────────────────────────────────────────────────┐    │
│   │ 📘 Cloud Fundamentals                                  │    │
│   │    10 categories · 25 concepts                        │    │
│   │    [x] 0 available · 25 coming soon                    │    │  honest availability line —
│   │                                                        │    │  NEW vs. M1A, which shows
│   └──────────────────────────────────────────────────────┘    │  category/concept counts only
│                                                                │
│   More domains in development — not shown as cards yet        │  no fake "coming soon" domain
│                                                                │  tiles; a line of text, not cards
└──────────────────────────────────────────────────────────────┘
```

### Tablet

Same single-column structure as desktop, narrower max-width. No layout branch needed.

### Mobile

```
┌───────────────────────┐
│ ☰  Engineering Atlas ☾ │
├───────────────────────┤
│ Engineering Atlas      │
│ Understand systems...  │
│                        │
│ Learning Domains       │
│ ┌────────────────────┐ │
│ │ 📘 Cloud            │ │
│ │    Fundamentals     │ │
│ │    10 cat · 25 conc │ │
│ │    [x] 0 available  │ │
│ └────────────────────┘ │
└───────────────────────┘
```

---

## 2. Domain Explorer (`/:domainId`)

### Desktop

```
┌──────────────────────────────────────────────────────────────┐
│  ☰ Engineering Atlas                                     ☾    │
├─────────────┬──────────────────────────────────────────────────┤
│ Cloud        │ Home › Cloud Fundamentals                       │
│ Fundamentals │                                                 │
│              │ Cloud Fundamentals                              │
│ › Cloud      │ Core cloud computing concepts across Azure/AWS. │
│   Computing  │                                                 │
│   Models     │ ┌───────────────────────────────────────────┐  │
│ › Global     │ │ Cloud Computing Models          2 concepts │  │
│   Infra.     │ │ Service/deployment models...               │  │
│ › Compute    │ └───────────────────────────────────────────┘  │
│ › Storage    │ ┌───────────────────────────────────────────┐  │
│ › ...        │ │ Global Infrastructure           2 concepts │  │
│ (categories  │ │ ...                                         │  │
│  only — no   │ └───────────────────────────────────────────┘  │
│  concepts    │ ... (one card per category, same pattern      │
│  listed —    │      M1A's DomainPage already uses)            │
│  CHANGE)     │                                                 │
└─────────────┴──────────────────────────────────────────────────┘
```

Sidebar here is the Level 1 global nav, collapsed to categories only (`M1B_UX_ARCHITECTURE.md` §2) — the main content area reuses M1A's existing `DomainPage` card list unchanged.

### Tablet

```
┌────────────────────────────────────────────┐
│ ☰ Engineering Atlas                     ☾   │
├───┬──────────────────────────────────────────┤
│ ▤ │ Home › Cloud Fundamentals                │  compact rail: icon-only
│ ▤ │ Cloud Fundamentals                        │  column, tap to expand
│ ▤ │ ...                                       │  a category flyout
│ ▤ │ (category cards, same as desktop,        │
│ ▤ │  narrower)                                │
└───┴──────────────────────────────────────────┘
```

### Mobile

```
┌───────────────────────┐
│ ☰ Engineering Atlas ☾ │
├───────────────────────┤
│ Home › Cloud Fund.     │
│ Cloud Fundamentals     │
│ Core cloud computing...│
│ ┌────────────────────┐│
│ │ Cloud Computing     ││
│ │ Models   2 concepts ││
│ └────────────────────┘│
│ (stacked cards,        │
│  sidebar is a drawer   │
│  behind ☰)             │
└───────────────────────┘
```

---

## 3. Category Page (`/:domainId/:categoryId`)

Identical structural pattern to Domain Explorer, one level deeper — M1A's existing `CategoryPage` already renders exactly this (concept cards with status badges) and needs no structural change. Reproduced once, desktop only, for completeness:

```
┌──────────────────────────────────────────────────────────────┐
│  ☰ Engineering Atlas                                     ☾    │
├─────────────┬──────────────────────────────────────────────────┤
│ (Level 1    │ Home › Cloud Fundamentals › Compute             │
│  sidebar,   │                                                 │
│  Compute    │ Compute                                         │
│  active)    │ Processing resources — from VMs to serverless.  │
│              │                                                 │
│              │ ┌───────────────────────────────────────────┐  │
│              │ │ Virtual Machines              Coming Soon  │  │
│              │ │ Virtualized servers...                     │  │
│              │ └───────────────────────────────────────────┘  │
│              │ ┌───────────────────────────────────────────┐  │
│              │ │ Containers                    Coming Soon  │  │
│              │ └───────────────────────────────────────────┘  │
│              │ ┌───────────────────────────────────────────┐  │
│              │ │ Serverless Functions          Coming Soon  │  │
│              │ └───────────────────────────────────────────┘  │
└─────────────┴──────────────────────────────────────────────────┘
```

Tablet/mobile follow the same rail/drawer pattern as §2 — not reproduced again.

---

## 4. Concept Overview (`/:domainId/:categoryId/:conceptId`)

### Desktop — current real state (every concept today)

```
┌──────────────────────────────────────────────────────────────┐
│  ☰ Engineering Atlas                                     ☾    │
├─────────────┬──────────────────────────────────────────────────┤
│ (Level 1    │ Home › Cloud Fundamentals › Compute › Virtual.. │
│  sidebar)   │                                                 │
│              │ Virtual Machines                                │
│              │ Virtualized servers that provide full OS-level │
│              │ control over compute resources.                 │
│              │                                                 │
│              │ ┌───────────────────────────────────────────┐  │
│              │ │ 🕐 Coming Soon                              │  │
│              │ │ Learning content for this concept is       │  │
│              │ │ planned but not yet started.                │  │
│              │ └───────────────────────────────────────────┘  │
│              │                                                 │
│              │ (no Level 2 nav, no lesson list, no viz —      │
│              │  this is the honest state, reusing M1A's        │
│              │  ConceptPage status branch unchanged)           │
└─────────────┴──────────────────────────────────────────────────┘
```

### Desktop — future state, once a concept has lessons (M2 content)

```
┌──────────────────────────────────────────────────────────────┐
│  ☰ Engineering Atlas                                     ☾    │
├─────────────┬───────────┬──────────────────────────────────────┤
│ (Level 1    │ Virtual   │ Home › ... › Virtual Machines         │
│  sidebar)   │ Machines  │                                       │
│              │           │ Virtual Machines                     │
│              │ 1. Intro  │ Learning objectives:                 │
│              │ 2. Virt.  │  • Explain what a hypervisor does    │
│              │    Fund.  │  • Compare VM vs. container isolation│
│              │ 3. VM     │                                       │
│              │    Arch.  │ [ Start: Introduction to VMs → ]      │
│              │ 4. ...    │                                       │
│              │ 5. ...    │ (Level 2 rail at left of content;    │
│              │ 6. Azure  │  clicking "Start" or any item opens   │
│              │ 7. AWS    │  the Lesson Workspace, §5)            │
│              │ 8. Comp.  │                                       │
│              │ 9. 🧪 Lab │                                       │
└─────────────┴───────────┴──────────────────────────────────────┘
```

### Tablet / Mobile — future state

Level 2 rail collapses to a horizontal scroller (tablet) or an accordion list above the content (mobile), per `M1B_UX_ARCHITECTURE.md` §5. Today's actual coming-soon state is identical to desktop, just narrower — no structural branch needed since there's no Level 2 nav to collapse.

---

## 5. Lesson Workspace (`/:domainId/:categoryId/:conceptId/:lessonId`)

### Desktop — split layout (visualization + content)

```
┌──────────────────────────────────────────────────────────────┐
│  ☰ Engineering Atlas                                     ☾    │
├───────────┬──────────────────────────────────────────────────┤
│ Virtual   │ Home › ... › Virtual Machines › VM Architecture   │
│ Machines  │                                                   │
│           │ ┌───────────────────────────┐ ┌─────────────────┐│
│ 1. Intro  │ │                           │ │ Inspector        ││
│ 2. V.Fund │ │  Visualization Region     │ │ (click a node    ││
│ 3.▶VM Arch│ │  (React Flow / SVG, per   │ │  to populate)    ││
│ 4. ...    │ │  lesson's scene type)     │ │                  ││
│ 5. ...    │ │                           │ │                  ││
│ ...       │ └───────────────────────────┘ └─────────────────┘│
│ 9. Lab    │ ◀◀ ◀ ▶ ▶▶  ━━●━━━━━  Step 3 of 7: "Hypervisor..." │
│           │                                                   │
│           │ Lesson text / explanation continues here...       │
│           │                                                   │
│           │ ◀ Previous: Virtualization Fundamentals           │
│           │                     Next: Compute, Memory › ▶    │
└───────────┴──────────────────────────────────────────────────┘
```

### Desktop — content-primary layout (no natural visual)

```
┌──────────────────────────────────────────────────────────────┐
│ ...header, Level 2 rail unchanged...                          │
│           │ Lesson text, flows top to bottom.                 │
│           │ No visualization region, no inspector —           │
│           │ per UX_PRINCIPLES.md §1, not forced.               │
│           │ Knowledge check, if present, appears inline here.  │
│           │ ◀ Previous                           Next ▶       │
└───────────┴──────────────────────────────────────────────────┘
```

### Tablet

```
┌────────────────────────────────────────────┐
│ ☰ Engineering Atlas                     ☾   │
├──────────────────────────────────────────────┤
│ VM Architecture        [ ‹ Lessons ▾ ]       │  horizontal scroller /
│                                               │  dropdown instead of rail
│ ┌──────────────────────────────────────────┐ │
│ │ Visualization Region (full width)         │ │
│ └──────────────────────────────────────────┘ │
│ ◀◀ ◀ ▶ ▶▶  ━━●━━━━━  Step 3 of 7            │
│ Inspector (below, not beside — no room)      │
│ Lesson text...                               │
│ ◀ Previous              Next ▶               │
└────────────────────────────────────────────┘
```

### Mobile

```
┌───────────────────────┐
│ ☰ Engineering Atlas ☾ │
├───────────────────────┤
│ VM Architecture        │
│ [ ▾ Lesson list ]      │  collapsed accordion, tap to expand
│ ┌─────────────────────┐│
│ │ Visualization        ││  full width, may scroll
│ │ (simplified/scroll)  ││  horizontally if the diagram is wide
│ └─────────────────────┘│
│ ◀◀ ◀ ▶ ▶▶ Step 3/7     │
│ [ Inspector ▾ ]         │  bottom sheet, collapsed by default
│ Lesson text...          │
│ ◀ Prev        Next ▶    │
└───────────────────────┘
```

---

## 6. Interactive Visualization — Expanded Mode

A user-triggered full-bleed mode for the visualization region, from any lesson layout.

### Desktop

```
┌──────────────────────────────────────────────────────────────┐
│  VM Architecture — Expanded                      [ ✕ Close ] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│               Visualization Region (full viewport)            │
│               Inspector opens as an overlay panel              │
│               anchored to the clicked node, not a             │
│               fixed sidebar (there's no sidebar in this mode) │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  ◀◀ ◀ ▶ ▶▶   ━━━●━━━━━━━━━   Step 3 of 7                     │
└──────────────────────────────────────────────────────────────┘
```

Lesson text, Level 1/Level 2 nav, and header chrome are hidden. `✕ Close` (or `Esc`) returns to the normal lesson layout at the same step/state.

### Tablet

Same pattern, same full-bleed behavior — there's no reason to withhold expanded mode on tablet; it's the one place extra width helps most.

### Mobile

```
┌───────────────────────┐
│ VM Architecture    ✕   │
├───────────────────────┤
│                        │
│  Visualization         │
│  (pinch-zoom/pan       │
│   enabled; this is     │
│   the primary way to   │
│   see detail on small  │
│   screens)             │
│                        │
├───────────────────────┤
│ ◀◀ ◀ ▶ ▶▶  Step 3/7    │
└───────────────────────┘
```

Inspector on mobile expanded mode opens as a bottom sheet over the visualization, same pattern as the inline lesson view (§5).

---

## 7. Hands-on Lab Workspace (`/:domainId/:categoryId/:conceptId/labs/:labId`)

Reuses `LAB_ENGINE.md`'s three lab-type views (Simulation / Hands-on / Challenge) directly — this wireframe shows only the frame around them, which is new for M1B (routing + header + exit path).

### Desktop (Hands-on type shown; Simulation/Challenge follow `LAB_ENGINE.md`'s existing layouts verbatim)

```
┌──────────────────────────────────────────────────────────────┐
│  ☰ Engineering Atlas                                     ☾    │
├──────────────────────────────────────────────────────────────┤
│ Home › ... › Virtual Machines › Lab: Launch and Configure a VM│
│                                                                │
│ Prerequisites:  ☑ Azure CLI installed   ☐ Azure subscription  │
├──────────────────────────────────────────────────────────────┤
│ Task 1: Create Resource Group                                 │
│ $ az group create --name ...                                  │
│ Expected output: {...}                                        │
│ ☐ Resource group appears in list                               │
│ ☐ Location is correct                                          │
├──────────────────────────────────────────────────────────────┤
│ 💡 Hint: if you see error X...                                 │
├──────────────────────────────────────────────────────────────┤
│                                    [ Self-reported — not       │
│                                      automatically verified ]  │  honesty label, always visible
│ ◀ Back to Virtual Machines                                     │
└──────────────────────────────────────────────────────────────┘
```

No Level 2 lesson rail here — a lab is a focused, full-width task flow, consistent with `ARCHITECTURE.md`'s "Lab-primary" layout mode. "Back to [Concept]" replaces Previous/Next, since a lab isn't itself part of the lesson sequence it's attached to.

### Tablet

Same single-column structure as desktop — this page is already narrow-friendly (it's a vertical task list, not a wide canvas).

### Mobile

```
┌───────────────────────┐
│ ☰ ... Lab: Launch VM ☾ │
├───────────────────────┤
│ Prerequisites           │
│ ☑ Azure CLI              │
│ ☐ Subscription           │
├───────────────────────┤
│ Task 1: Create RG       │
│ $ az group create ...   │
│ ☐ Appears in list        │
│ ☐ Location correct       │
├───────────────────────┤
│ [Self-reported, not      │
│  verified]                │
│ ◀ Back to VMs             │
└───────────────────────┘
```
