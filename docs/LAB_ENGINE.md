# Lab Engine — Engineering Atlas

## Purpose

The lab engine manages hands-on learning experiences: browser-based simulations, local labs with instructions, and architecture challenges. It provides the structure, tracking, and validation display for all three lab types.

---

## Lab Types

### 1. Interactive Simulation Lab

Runs entirely in the browser. The user modifies inputs and observes system behavior.

**Characteristics:**
- Deterministic behavior: same inputs produce same outputs.
- State managed by the simulation engine.
- Visualization engine renders the current state.
- User controls: parameter sliders, action buttons, step controls.
- Automatic validation against expected outcomes.
- Full step-back and replay support.

**Example:** "Design a VM Architecture" — user selects instance types, configures networking, and observes how the system handles load.

### 2. Local Hands-on Lab

The user executes commands on their own machine. The platform provides instructions and expected results.

**Characteristics:**
- The platform does **not** execute commands. It provides instructions.
- Prerequisites clearly listed (CLI tools, accounts, permissions).
- Starter configuration files downloadable when appropriate.
- Expected outputs shown so the user can self-validate.
- Validation is a checklist the user marks manually.
- Troubleshooting hints for common problems.

**Example:** "Launch and Configure a VM" — user follows Azure CLI or AWS CLI instructions to create and configure a virtual machine.

**Honesty rule:** The platform never claims to have verified a local lab result. It says "check that your output matches" or "confirm the following," not "verified" or "passed."

### 3. Architecture Challenge

Present a scenario and ask the user to make engineering decisions.

**Characteristics:**
- Real-world scenario description.
- Constraints and requirements.
- User selects or designs a solution.
- Multiple valid solutions may exist.
- Platform explains trade-offs for each approach.
- Objective validation where possible (e.g., "this design has a single point of failure").

**Example:** "Design for High Availability" — user is given requirements and must choose regions, instance counts, load balancing, and failover strategy.

---

## Lab Definition

```typescript
interface LabDefinition {
  id: string;
  title: string;
  type: 'simulation' | 'hands-on' | 'challenge';
  conceptId: string;
  providerId?: string;         // if provider-specific
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;       // e.g., "15 minutes"
  description: string;
  learningObjectives: string[];
  prerequisites: Prerequisite[];
  content: SimulationLab | HandsOnLab | ChallengeLab;
}

interface Prerequisite {
  type: 'concept' | 'tool' | 'account' | 'knowledge';
  id?: string;                 // concept id if type is 'concept'
  label: string;
  description: string;
  installUrl?: string;         // link to installation docs
}
```

### Simulation Lab Content

```typescript
interface SimulationLab {
  simulationId: string;        // references a SimulationDefinition
  sceneId: string;             // references a SceneDefinition
  instructions: LabStep[];
  parameters: ParameterConfig[];
  validationRules: ValidationRule[];
}

interface ParameterConfig {
  key: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  default: unknown;
  options?: { label: string; value: unknown }[];
  constraints?: { min?: number; max?: number };
  description: string;
}
```

### Hands-on Lab Content

```typescript
interface HandsOnLab {
  environment: EnvironmentRequirement[];
  tasks: LabTask[];
  starterFiles?: StarterFile[];
  cleanupInstructions?: string;
}

interface EnvironmentRequirement {
  tool: string;               // e.g., "Azure CLI"
  version?: string;
  installUrl: string;
  verifyCommand: string;      // command user can run to check
}

interface LabTask {
  id: string;
  title: string;
  instructions: string;       // markdown
  commands?: CommandBlock[];
  expectedOutput?: string;    // what the user should see
  hints: string[];
  validationChecklist: string[];  // items user checks off
}

interface CommandBlock {
  command: string;
  platform?: 'bash' | 'powershell' | 'any';
  description: string;
  expectedOutput?: string;
}

interface StarterFile {
  filename: string;
  content: string;
  description: string;
}
```

### Architecture Challenge Content

```typescript
interface ChallengeLab {
  scenario: string;            // markdown describing the situation
  requirements: string[];
  constraints: string[];
  decisions: ChallengeDecision[];
  solutions: ChallengeSolution[];
}

interface ChallengeDecision {
  id: string;
  question: string;
  type: 'single-choice' | 'multi-choice' | 'design';  // design = open-ended
  options?: ChallengeOption[];
}

interface ChallengeOption {
  id: string;
  label: string;
  description: string;
  // Optional, added in Slice 2B. Shown after evaluation for every selected
  // option, plus effective options the learner did not select.
  feedback?: { rating: 'effective' | 'partial' | 'ineffective'; text: string };
}

// A solution's verdict applies only to its exact decisionValues. When the
// learner's combination matches no solution, the view says that no authored
// overall assessment exists, and shows per-option feedback where authored.
interface ChallengeSolution {
  id: string;
  decisionValues: Record<string, string | string[]>;
  assessment: 'optimal' | 'acceptable' | 'suboptimal' | 'problematic';
  explanation: string;
  tradeoffs: string;
}
```

---

## Lab Lifecycle

```
                   ┌─────────┐
                   │  Ready  │
                   └────┬────┘
                        │ User starts lab
                   ┌────▼────┐
                   │  Active │
                   └────┬────┘
                        │ User completes tasks
              ┌─────────┼─────────┐
              ▼         ▼         ▼
        ┌──────────┐ ┌───────┐ ┌───────────┐
        │Simulation│ │Hands- │ │ Challenge │
        │ Engine   │ │on     │ │ Evaluate  │
        │ validates│ │self-  │ │ decisions │
        └────┬─────┘ │check  │ └─────┬─────┘
             │        └───┬───┘       │
             └────────────┼───────────┘
                     ┌────▼────┐
                     │Complete │
                     └─────────┘
```

### State Tracking

```typescript
interface LabProgress {
  labId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  taskProgress: Record<string, TaskProgress>;
  checkpointState?: unknown;   // simulation state snapshot
}

interface TaskProgress {
  taskId: string;
  completed: boolean;
  checklist: Record<string, boolean>;  // per checklist item
}
```

Progress is persisted to IndexedDB. Users can resume a lab where they left off.

---

## Validation Approach

| Lab Type | Validation | Automated? |
|---|---|---|
| Simulation | Compare final state against expected state | Yes |
| Hands-on | User checks off validation items | No — self-reported |
| Challenge | Evaluate decision combination against solution map | Partially — known combinations are evaluated; novel combinations get general feedback |

The platform never lies about what it verified. If the user self-reported completion, the UI says "self-reported" not "verified."

---

## Lab Display

### Simulation Lab View

```
┌──────────────────────────────────────┐
│  Visualization Canvas                │
│  (simulation state rendered here)    │
├──────────────────────────────────────┤
│  Parameters          │  Controls     │
│  ┌─────────────┐    │  [Step] [Run] │
│  │ Instances: 3│    │  [Reset]      │
│  │ Region: 2  │    │               │
│  └─────────────┘    │  State: 4/12  │
├──────────────────────┴───────────────┤
│  Instructions / Current Task         │
├──────────────────────────────────────┤
│  Validation Result                   │
└──────────────────────────────────────┘
```

### Hands-on Lab View

```
┌──────────────────────────────────────┐
│  Prerequisites Checklist             │
├──────────────────────────────────────┤
│  Task 1: Create Resource Group       │
│  Instructions...                     │
│  $ az group create --name ...        │
│  Expected output: {...}              │
│  ☑ Resource group appears in list    │
│  ☐ Location is correct              │
├──────────────────────────────────────┤
│  Task 2: ...                         │
├──────────────────────────────────────┤
│  💡 Hint: If you see error X...      │
├──────────────────────────────────────┤
│  Cleanup Instructions                │
└──────────────────────────────────────┘
```

### Architecture Challenge View

```
┌──────────────────────────────────────┐
│  Scenario Description                │
├──────────────────────────────────────┤
│  Requirements & Constraints          │
├──────────────────────────────────────┤
│  Decision 1: Choose region strategy  │
│  ○ Single region  ○ Multi-region     │
│                                      │
│  Decision 2: Instance count          │
│  ○ 1  ○ 2  ○ 3+                     │
├──────────────────────────────────────┤
│  [Evaluate My Design]                │
├──────────────────────────────────────┤
│  Assessment: Acceptable              │
│  Your design handles AZ failure but  │
│  not region failure. Trade-off: ...  │
└──────────────────────────────────────┘
```
