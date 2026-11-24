import { describe, it, expect } from 'vitest';
import {
  cloudFundamentals,
  domains,
  findDomain,
  findCategory,
  findConcept,
  findLesson,
  findLab,
} from './index';
import { labSimulations } from './lab-simulations';
import { providers } from '../providers';
import type { ChallengeLab, ConceptMeta, Lesson, LabDefinition, SimulationLab } from '../types';

const validStatuses = ['available', 'in-development', 'coming-soon'];

// Categories whose concepts are fully authored. Every concept in these is
// expected to be Active; every concept elsewhere is expected to be Coming soon.
const ACTIVE_CATEGORIES = ['compute', 'global-infrastructure', 'storage'];

describe('Cloud Fundamentals content index — structure', () => {
  it('has exactly 10 categories', () => {
    expect(cloudFundamentals.categories).toHaveLength(10);
  });

  it('every category has at least one concept', () => {
    for (const category of cloudFundamentals.categories) {
      expect(category.concepts.length).toBeGreaterThan(0);
    }
  });

  it('every concept has a valid status', () => {
    for (const category of cloudFundamentals.categories) {
      for (const concept of category.concepts) {
        expect(validStatuses).toContain(concept.status);
      }
    }
  });

  it('every concept has a non-empty description', () => {
    for (const category of cloudFundamentals.categories) {
      for (const concept of category.concepts) {
        expect(concept.description.length).toBeGreaterThan(0);
      }
    }
  });

  it('all category and concept IDs are unique within their scope', () => {
    const categoryIds = cloudFundamentals.categories.map((c) => c.id);
    expect(new Set(categoryIds).size).toBe(categoryIds.length);

    for (const category of cloudFundamentals.categories) {
      const conceptIds = category.concepts.map((c) => c.id);
      expect(new Set(conceptIds).size).toBe(conceptIds.length);
    }
  });

  it('concept IDs are unique across the whole domain, so no two routes share a concept id', () => {
    const ids = cloudFundamentals.categories.flatMap((c) => c.concepts.map((concept) => concept.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only the authored categories are Active — every other concept stays Coming soon', () => {
    for (const category of cloudFundamentals.categories) {
      for (const concept of category.concepts) {
        const expected = ACTIVE_CATEGORIES.includes(category.id) ? 'available' : 'coming-soon';
        expect({ id: concept.id, status: concept.status }).toEqual({ id: concept.id, status: expected });
      }
    }
  });
});

describe('content schema validation — domain-wide identity', () => {
  const allLessons = cloudFundamentals.categories.flatMap((c) => c.concepts.flatMap((concept) => concept.lessons ?? []));
  const allLabs = cloudFundamentals.categories.flatMap((c) => c.concepts.flatMap((concept) => concept.labs ?? []));

  // progressStore keys completion by bare lesson/lab id, so ids must be
  // unique across the domain, not just within their concept.
  it('lesson IDs are unique across the whole domain', () => {
    const ids = allLessons.map((l) => l.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('lab IDs are unique across the whole domain and never collide with lesson IDs', () => {
    const labIds = allLabs.map((l) => l.id);
    expect(new Set(labIds).size).toBe(labIds.length);
    const lessonIds = new Set(allLessons.map((l) => l.id));
    expect(labIds.filter((id) => lessonIds.has(id))).toEqual([]);
  });

  it('every simulation lab has a registered simulation whose id matches the lab content', () => {
    for (const lab of allLabs.filter((l) => l.type === 'simulation')) {
      const entry = labSimulations[lab.id];
      expect(entry, `no simulation registered for ${lab.id}`).toBeDefined();
      expect(entry?.simulationId).toBe((lab.content as SimulationLab).simulationId);
    }
  });

  it('the simulation registry has no entries for labs that do not exist', () => {
    const simulationLabIds = new Set(allLabs.filter((l) => l.type === 'simulation').map((l) => l.id));
    for (const id of Object.keys(labSimulations)) expect(simulationLabIds.has(id)).toBe(true);
  });

  it('every provider lesson references a registered provider', () => {
    const providerIds = new Set(providers.map((p) => p.id));
    for (const lesson of allLessons.filter((l) => l.kind === 'provider')) {
      expect(providerIds.has(lesson.providerId!)).toBe(true);
    }
  });

  it('every lesson has at least one learning objective', () => {
    for (const lesson of allLessons) expect(lesson.learningObjectives.length, lesson.id).toBeGreaterThan(0);
  });

  it('every visualization has at least one state, and sequence scenes have one state per message plus the initial state', () => {
    for (const lesson of allLessons) {
      const scene = lesson.visualization;
      if (!scene) continue;
      expect(scene.states.length, scene.id).toBeGreaterThan(0);
      if (scene.type === 'sequence') expect(scene.states.length, scene.id).toBe(scene.edges.length + 1);
      const nodeIds = new Set(scene.nodes.map((n) => n.id));
      for (const edge of scene.edges) {
        expect(nodeIds.has(edge.source) && nodeIds.has(edge.target), `${scene.id}:${edge.id}`).toBe(true);
      }
    }
  });

  it('every challenge lab solution only uses decision and option ids that exist', () => {
    for (const lab of allLabs.filter((l) => l.type === 'challenge')) {
      const content = lab.content as ChallengeLab;
      for (const solution of content.solutions) {
        for (const [decisionId, value] of Object.entries(solution.decisionValues)) {
          const decision = content.decisions.find((d) => d.id === decisionId);
          expect(decision, `${lab.id}:${solution.id}:${decisionId}`).toBeDefined();
          for (const optionId of Array.isArray(value) ? value : [value]) {
            expect(decision!.options.some((o) => o.id === optionId), `${lab.id}:${solution.id}:${optionId}`).toBe(true);
          }
        }
      }
    }
  });
});

describe('content lookup functions', () => {
  it('findDomain returns the domain for a valid ID', () => {
    expect(findDomain('cloud-fundamentals')).toBe(cloudFundamentals);
  });

  it('findDomain returns undefined for invalid ID', () => {
    expect(findDomain('nonexistent')).toBeUndefined();
  });

  it('findCategory returns the category for valid IDs', () => {
    const cat = findCategory('cloud-fundamentals', 'compute');
    expect(cat?.title).toBe('Compute');
  });

  it('findCategory returns undefined for invalid IDs', () => {
    expect(findCategory('cloud-fundamentals', 'nope')).toBeUndefined();
    expect(findCategory('nope', 'compute')).toBeUndefined();
  });

  it('findConcept returns the concept for valid IDs', () => {
    const concept = findConcept('cloud-fundamentals', 'compute', 'virtual-machines');
    expect(concept?.title).toBe('Virtual Machines');
  });

  it('findConcept returns undefined for invalid IDs', () => {
    expect(findConcept('cloud-fundamentals', 'compute', 'nope')).toBeUndefined();
  });

  it('findLesson resolves a lesson within an available concept', () => {
    const lesson = findLesson('cloud-fundamentals', 'compute', 'virtual-machines', 'vm-architecture');
    expect(lesson?.title).toBe('VM Architecture');
  });

  it('findLesson returns undefined for an unknown lesson id', () => {
    expect(findLesson('cloud-fundamentals', 'compute', 'virtual-machines', 'nope')).toBeUndefined();
  });

  it('findLab resolves a lab within an available concept', () => {
    const lab = findLab('cloud-fundamentals', 'compute', 'virtual-machines', 'vm-resource-allocation-lab');
    expect(lab?.title).toBe('Design a VM Architecture');
  });

  it('domains array contains cloud-fundamentals', () => {
    expect(domains).toHaveLength(1);
    expect(domains[0]?.id).toBe('cloud-fundamentals');
  });
});

describe('content schema validation — available concepts', () => {
  const availableConcepts: ConceptMeta[] = cloudFundamentals.categories
    .flatMap((c) => c.concepts)
    .filter((c) => c.status === 'available');

  it('at least one concept is available', () => {
    expect(availableConcepts.length).toBeGreaterThan(0);
  });

  it('every available concept declares learning objectives and at least one lesson', () => {
    for (const concept of availableConcepts) {
      expect(concept.learningObjectives?.length).toBeGreaterThan(0);
      expect(concept.lessons?.length).toBeGreaterThan(0);
    }
  });

  it('lesson IDs are unique within each concept', () => {
    for (const concept of availableConcepts) {
      const ids = (concept.lessons ?? []).map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('lab IDs are unique within each concept', () => {
    for (const concept of availableConcepts) {
      const ids = (concept.labs ?? []).map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('every provider-kind lesson declares a providerId and matching providerDetails', () => {
    const allLessons: Lesson[] = availableConcepts.flatMap((c) => c.lessons ?? []);
    for (const lesson of allLessons) {
      if (lesson.kind === 'provider') {
        expect(lesson.providerId).toBeDefined();
        expect(lesson.providerDetails?.providerId).toBe(lesson.providerId);
        expect(lesson.providerDetails?.serviceName.length).toBeGreaterThan(0);
        expect(lesson.providerDetails?.documentationUrl).toMatch(/^https:\/\//);
      }
    }
  });

  it('every lesson has at least one section with at least one block', () => {
    const allLessons: Lesson[] = availableConcepts.flatMap((c) => c.lessons ?? []);
    for (const lesson of allLessons) {
      expect(lesson.sections.length).toBeGreaterThan(0);
      for (const section of lesson.sections) {
        expect(section.blocks.length).toBeGreaterThan(0);
      }
    }
  });

  it('every knowledge check question has exactly one correct option for single-choice/scenario, at least one for multi-select', () => {
    const allLessons: Lesson[] = availableConcepts.flatMap((c) => c.lessons ?? []);
    for (const lesson of allLessons) {
      for (const question of lesson.knowledgeCheck ?? []) {
        const correctCount = question.options.filter((o) => o.correct).length;
        if (question.type === 'multi-select') {
          expect(correctCount).toBeGreaterThan(0);
        } else {
          expect(correctCount).toBe(1);
        }
        for (const option of question.options) {
          expect(option.explanation.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every lab’s content shape matches its declared type', () => {
    const allLabs: LabDefinition[] = availableConcepts.flatMap((c) => c.labs ?? []);
    for (const lab of allLabs) {
      if (lab.type === 'simulation') {
        expect('instructions' in lab.content).toBe(true);
      } else if (lab.type === 'hands-on') {
        expect('tasks' in lab.content).toBe(true);
      } else if (lab.type === 'challenge') {
        expect('decisions' in lab.content).toBe(true);
      }
    }
  });

  it('every concept listed in relatedConcepts/prerequisites resolves to a real concept in the domain', () => {
    const allConceptIds = new Set(cloudFundamentals.categories.flatMap((c) => c.concepts).map((c) => c.id));
    for (const concept of availableConcepts) {
      for (const relatedId of [...(concept.relatedConcepts ?? []), ...(concept.prerequisites ?? [])]) {
        expect(allConceptIds.has(relatedId)).toBe(true);
      }
    }
  });
});
