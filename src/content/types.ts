// Content model — see docs/CONTENT_MODEL.md and docs/LAB_ENGINE.md for the
// design this implements. Authoring format is structured TypeScript, not
// MDX (see docs/decisions/ADR-005-frontend-dependency-strategy.md).

import type { ReactNode } from 'react';
import type { SceneDefinition } from '../engines/visualization/types';

export type ConceptStatus = 'available' | 'in-development' | 'coming-soon';

export type ProviderId = 'azure' | 'aws';

// --- Lesson content blocks -------------------------------------------------
// A small, data-driven content DSL rather than freeform JSX per lesson, so
// content stays type-checked, testable (schema validation), and consistent
// across lessons without a repetitive-boilerplate feel — section headings
// and block mix are chosen per lesson, not forced into one template.

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'code'; code: string; language?: string; caption?: string }
  | { type: 'callout'; tone: 'info' | 'warning' | 'success'; text: string }
  | { type: 'comparisonTable'; headers: string[]; rows: string[][] };

export interface LessonSection {
  heading: string;
  blocks: ContentBlock[];
}

export interface ReferenceLink {
  label: string;
  url: string;
}

// --- Knowledge checks --------------------------------------------------

export type QuestionType = 'single-choice' | 'multi-select' | 'scenario';
export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuestionOption {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
}

export interface KnowledgeCheckQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: QuestionOption[];
  difficulty: QuestionDifficulty;
  learningObjective: string;
}

// --- Provider implementation details (attached to a 'provider' lesson) ----

export interface ProviderImplementationDetails {
  providerId: ProviderId;
  serviceName: string;
  keyFeatures: string[];
  terminology: Record<string, string>; // common term -> provider-specific term
  architecturalNotes: string[];
  limitations: string[];
  documentationUrl: string;
}

// --- Lessons ----------------------------------------------------------

export type LessonKind = 'concept' | 'provider' | 'comparison';

/** Eager metadata — enough for navigation, breadcrumbs, and prev/next.
 *  This is the single authoritative source of a lesson's id, title, kind,
 *  and (by array position) order. */
export interface LessonMeta {
  id: string;
  title: string;
  kind: LessonKind;
  providerId?: ProviderId; // required when kind === 'provider'
}

/** Lazy body — loaded with the lesson's concept, keyed by lesson id. */
export interface LessonBody {
  learningObjectives: string[];
  analogy?: string;
  sections: LessonSection[];
  providerDetails?: ProviderImplementationDetails;
  visualization?: SceneDefinition;
  knowledgeCheck?: KnowledgeCheckQuestion[];
  furtherReading?: ReferenceLink[];
}

export type Lesson = LessonMeta & LessonBody;

// --- Labs — verbatim from docs/LAB_ENGINE.md --------------------------

export type LabType = 'simulation' | 'hands-on' | 'challenge';
export type LabDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Prerequisite {
  type: 'concept' | 'tool' | 'account' | 'knowledge';
  id?: string;
  label: string;
  description: string;
  installUrl?: string;
}

export interface ParameterConfig {
  key: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  default: unknown;
  options?: { label: string; value: unknown }[];
  constraints?: { min?: number; max?: number };
  description: string;
}

export interface LabStep {
  id: string;
  label: string;
  description: string;
}

export interface ValidationRule {
  id: string;
  label: string;
  check: (state: unknown) => boolean;
}

export interface SimulationLab {
  simulationId: string;
  instructions: LabStep[];
  parameters: ParameterConfig[];
  validationRules: ValidationRule[];
}

export interface CommandBlock {
  command: string;
  platform?: 'bash' | 'powershell' | 'any';
  description: string;
  expectedOutput?: string;
}

export interface EnvironmentRequirement {
  tool: string;
  version?: string;
  installUrl: string;
  verifyCommand: string;
}

export interface LabTask {
  id: string;
  title: string;
  instructions: string;
  commands?: CommandBlock[];
  expectedOutput?: string;
  hints: string[];
  validationChecklist: string[];
}

export interface StarterFile {
  filename: string;
  content: string;
  description: string;
}

export interface HandsOnLab {
  environment: EnvironmentRequirement[];
  tasks: LabTask[];
  starterFiles?: StarterFile[];
  cleanupInstructions?: string;
}

export interface ChallengeDecision {
  id: string;
  question: string;
  type: 'single-choice' | 'multi-choice';
  options: { id: string; label: string; description: string }[];
}

export interface ChallengeSolution {
  id: string;
  decisionValues: Record<string, string | string[]>;
  assessment: 'optimal' | 'acceptable' | 'suboptimal' | 'problematic';
  explanation: string;
  tradeoffs: string;
}

export interface ChallengeLab {
  scenario: string;
  requirements: string[];
  constraints: string[];
  decisions: ChallengeDecision[];
  solutions: ChallengeSolution[];
}

/** Eager metadata for a lab — the single source of its id, title, and type. */
export interface LabMeta {
  id: string;
  title: string;
  type: LabType;
}

/** Lazy body — loaded with the lab's concept, keyed by lab id. */
export interface LabBody {
  difficulty: LabDifficulty;
  estimatedTime: string;
  description: string;
  learningObjectives: string[];
  prerequisites: Prerequisite[];
  content: SimulationLab | HandsOnLab | ChallengeLab;
}

export type LabDefinition = LabMeta & LabBody;

/** A simulation lab's runtime binding: the live simulation plus the
 *  lab-specific view of its state, owned by the concept that uses it. */
export interface LabSimulationEntry {
  simulationId: string;
  render: (content: SimulationLab) => ReactNode;
}

// --- Content hierarchy --------------------------------------------------

/** Eager concept metadata. Contains no lesson or lab bodies, so the whole
 *  curriculum index stays small enough to load on every page. */
export interface ConceptMeta {
  id: string;
  title: string;
  description: string;
  status: ConceptStatus;
  learningObjectives?: string[];
  prerequisites?: string[]; // concept ids
  relatedConcepts?: string[]; // concept ids
  estimatedMinutes?: number;
  lessons?: LessonMeta[];
  labs?: LabMeta[];
}

/** What a lazily loaded concept module exports. Keys must match the ids in
 *  the concept's metadata exactly; the loader verifies this. */
export interface ConceptContentModule {
  lessons: Record<string, LessonBody>;
  labs: Record<string, LabBody>;
  simulations: Record<string, LabSimulationEntry>;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  concepts: ConceptMeta[];
}

export interface Domain {
  id: string;
  title: string;
  description: string;
  categories: Category[];
}
