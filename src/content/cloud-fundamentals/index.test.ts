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
import type { ConceptMeta, Lesson, LabDefinition } from '../types';

const validStatuses = ['available', 'in-development', 'coming-soon'];

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

  it('exactly the Compute concepts are available in this slice — everything else remains coming-soon', () => {
    const available: string[] = [];
    for (const category of cloudFundamentals.categories) {
      for (const concept of category.concepts) {
        if (concept.status === 'available') available.push(concept.id);
      }
    }
    expect(available.sort()).toEqual(['containers', 'serverless-functions', 'virtual-machines']);
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
