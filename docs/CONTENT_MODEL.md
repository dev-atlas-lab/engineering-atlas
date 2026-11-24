# Content Model — Engineering Atlas

## Overview

The content model defines how learning content is structured, organized, and related. It enforces the concept-first strategy: common engineering concepts are the primary organizing unit, and provider-specific implementations are linked to concepts rather than existing as independent hierarchies.

---

## Hierarchy

```
Domain
  └── Category
        └── Concept
              ├── Lesson(s)
              ├── Provider Implementation(s)
              └── Lab(s)
```

### Domain

The broadest subject area. Each domain is an independent learning track.

| Field | Description |
|---|---|
| `id` | Unique identifier (e.g., `cloud-fundamentals`) |
| `title` | Display name |
| `description` | One-paragraph summary |
| `categories` | Ordered list of categories |
| `icon` | Visual identifier |

**Phase 1 domain:** Cloud Fundamentals and Providers.

**Future domains:** Container Internals, Kubernetes, Database Internals, Distributed Systems, etc.

### Category

A grouping of related concepts within a domain.

| Field | Description |
|---|---|
| `id` | Unique identifier (e.g., `compute`) |
| `title` | Display name (e.g., "Compute") |
| `description` | What this category covers |
| `concepts` | Ordered list of concepts |
| `domainId` | Parent domain |

**Phase 1 categories:** Cloud Computing Models, Global Infrastructure, Compute, Storage, Networking, IAM, Security, Load Balancing, Scalability & Reliability, Monitoring & Observability.

### Concept

A single engineering idea that exists independent of any provider. This is the core learning unit.

| Field | Description |
|---|---|
| `id` | Unique identifier (e.g., `virtual-machines`) |
| `title` | Display name |
| `description` | What the concept is about |
| `categoryId` | Parent category |
| `lessons` | Ordered list of lessons |
| `providerImplementations` | Provider-specific implementations |
| `labs` | Associated labs |
| `prerequisites` | Concepts that should be understood first |
| `relatedConcepts` | Concepts that connect to this one |

A concept is **not** a provider service. "Virtual Machines" is a concept. "Azure Virtual Machines" and "Amazon EC2" are provider implementations of that concept.

### Provider

A technology provider whose implementations are covered.

| Field | Description |
|---|---|
| `id` | Unique identifier (e.g., `azure`, `aws`) |
| `name` | Display name |
| `color` | Brand color for UI distinction |
| `logo` | Provider logo asset |

### Provider Implementation

How a specific provider implements a concept.

| Field | Description |
|---|---|
| `id` | Unique identifier (e.g., `azure-virtual-machines`) |
| `conceptId` | The concept this implements |
| `providerId` | The provider |
| `serviceName` | Official service name (e.g., "Azure Virtual Machines") |
| `description` | How this provider approaches the concept |
| `keyFeatures` | Provider-specific capabilities |
| `terminology` | Provider-specific terms mapped to common terms |
| `architecturalNotes` | How this implementation differs architecturally |
| `limitations` | Known limitations or constraints |
| `lessons` | Provider-specific lesson content |

### Lesson

A structured learning unit within a concept or provider implementation.

| Field | Description |
|---|---|
| `id` | Unique identifier |
| `title` | Display name |
| `type` | `concept` or `provider` |
| `conceptId` | Parent concept |
| `providerId` | Provider (if provider-type) |
| `sections` | Ordered list of lesson sections |
| `visualizationType` | What kind of visualization fits this lesson |
| `learningObjectives` | What the learner should understand after |

### Lesson Section

A section within a lesson. Not all section types appear in every lesson.

| Type | Purpose |
|---|---|
| `introduction` | Why this concept matters, what problem it solves |
| `visual-exploration` | Interactive visualization with guided exploration |
| `core-concepts` | Fundamental principles and terminology |
| `internal-mechanics` | How the system works inside |
| `architecture-tradeoffs` | Design decisions, strengths, weaknesses |
| `interactive-experiment` | Browser-based simulation the user controls |
| `hands-on-lab` | Local lab with instructions |
| `expected-results` | What correct behavior looks like |
| `knowledge-check` | Questions to test understanding |

### Lab

A hands-on learning experience associated with a concept.

| Field | Description |
|---|---|
| `id` | Unique identifier |
| `title` | Display name |
| `type` | `simulation`, `hands-on`, or `challenge` |
| `conceptId` | Parent concept |
| `providerId` | Provider (if provider-specific) |
| `difficulty` | `beginner`, `intermediate`, `advanced` |
| `estimatedTime` | Approximate duration |
| `prerequisites` | Required knowledge and tools |
| `metadata` | Lab-type-specific configuration |

---

## Cloud Content Model — Concept-First Structure

### Example: Virtual Machines

```
Concept: Virtual Machines
│
├── Lessons (concept-level):
│   ├── "What Are Virtual Machines?"
│   │   Sections: introduction, visual-exploration, core-concepts
│   ├── "Virtualization Internals"
│   │   Sections: internal-mechanics, architecture-tradeoffs
│   └── "Choosing VM Configurations"
│       Sections: interactive-experiment, knowledge-check
│
├── Provider Implementations:
│   ├── Azure Virtual Machines
│   │   ├── serviceName: "Azure Virtual Machines"
│   │   ├── terminology: { "instance" → "VM", "AMI" → "VM Image" }
│   │   ├── Lessons:
│   │   │   ├── "Azure VM Architecture"
│   │   │   └── "Azure VM Networking and Storage"
│   │   └── keyFeatures: [availability sets, proximity placement, ...]
│   │
│   └── Amazon EC2
│       ├── serviceName: "Amazon EC2"
│       ├── terminology: { "VM" → "instance", "VM Image" → "AMI" }
│       ├── Lessons:
│       │   ├── "EC2 Architecture"
│       │   └── "EC2 Instance Store vs EBS"
│       └── keyFeatures: [instance store, placement groups, ...]
│
├── Comparison:
│   ├── Instance type naming and sizing
│   ├── Networking models
│   ├── Storage architecture
│   ├── Availability mechanisms
│   └── Pricing models
│
└── Labs:
    ├── Simulation: "Design a VM Architecture" (browser-based)
    ├── Hands-on: "Launch and Configure a VM" (local CLI)
    └── Challenge: "Design for High Availability"
```

### Key Rules

1. **Concepts are provider-independent.** The concept "Virtual Machines" teaches what virtualization is, how hypervisors work, and what configuration decisions matter — without mentioning Azure or AWS.

2. **Provider implementations reference concepts.** Azure VMs and EC2 are implementations of the "Virtual Machines" concept, not independent topics.

3. **Terminology is mapped, not assumed equivalent.** A `terminology` field explicitly maps provider-specific terms to common terms. Azure calls it a "VM Image"; AWS calls it an "AMI." Neither term is treated as the default.

4. **Comparison is structured, not editorial.** Comparisons address specific dimensions (networking, storage, pricing) rather than declaring a winner.

5. **Not every concept maps 1:1.** Some concepts have one provider implementation. Some have many. Some providers have services that don't map neatly to a single concept. The model handles this through `relatedConcepts` and by allowing a provider implementation to reference multiple concepts.

---

## Content Authoring Format

Content can be authored as:

- **MDX files** — Markdown with embedded React components for interactive content.
- **Structured TypeScript modules** — For content that needs strong typing and programmatic access (lab definitions, simulation configs).

The choice will be evaluated during M1. Both approaches should be supported, with MDX for narrative content and TypeScript for structured data.

---

## Relationships

```
Domain ──1:N──> Category ──1:N──> Concept
Concept ──1:N──> Lesson
Concept ──1:N──> ProviderImplementation ──1:N──> Lesson
Concept ──1:N──> Lab
Concept ──N:N──> Concept (prerequisites, related)
ProviderImplementation ──N:1──> Provider
```

## Content Indexing

All content is statically defined and bundled at build time. There is no content API or CMS. Content is imported as TypeScript modules or MDX files, enabling:

- Type-safe content references.
- Build-time validation of relationships (no broken links).
- Tree-shaking of unused content.
- Fast navigation without network requests.
