import { describe, it, expect } from 'vitest';
import { kubernetesFundamentals } from './index';
import { domains } from '../cloud-fundamentals/index';
import { conceptLoaders } from '../cloud-fundamentals/concept-loaders';
import type { ConceptMeta } from '../types';

const allConcepts: ConceptMeta[] = kubernetesFundamentals.categories.flatMap((c) => c.concepts);

describe('Kubernetes Fundamentals metadata index', () => {
  it('is registered as a second domain alongside Cloud Fundamentals', () => {
    expect(domains.map((d) => d.id)).toContain('kubernetes-fundamentals');
  });

  it('has ten categories in the expected order', () => {
    expect(kubernetesFundamentals.categories.map((c) => c.id)).toEqual([
      'foundations',
      'architecture',
      'workloads',
      'networking',
      'configuration',
      'pod-lifecycle',
      'scheduling',
      'resource-management',
      'scaling',
      'deployment-strategies',
    ]);
  });

  it('every concept has a non-empty description and at least one lesson', () => {
    for (const concept of allConcepts) {
      expect(concept.description.length).toBeGreaterThan(0);
      expect(concept.lessons?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('concept ids are unique across the domain', () => {
    const ids = allConcepts.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every concept has a registered content loader', () => {
    for (const concept of allConcepts) {
      expect(conceptLoaders[concept.id], `missing loader for ${concept.id}`).toBeDefined();
    }
  });

  it('every lab id is registered on a concept that owns it', () => {
    const labIds = allConcepts.flatMap((c) => (c.labs ?? []).map((l) => l.id));
    expect(new Set(labIds).size).toBe(labIds.length);
    // The four Slice 3A labs exist.
    expect(labIds).toContain('cluster-architecture-explorer');
    expect(labIds).toContain('scheduler-simulator');
    expect(labIds).toContain('deployment-scaling-simulator');
    expect(labIds).toContain('reconciliation-simulator');
    // The five Slice 3B labs exist.
    expect(labIds).toContain('pod-health-probe-simulator');
    expect(labIds).toContain('scheduling-constraints-simulator');
    expect(labIds).toContain('resource-management-simulator');
    expect(labIds).toContain('hpa-scaling-simulator');
    expect(labIds).toContain('deployment-rollout-simulator');
  });

  it('every kubernetes concept id is distinct from every cloud-fundamentals concept id', () => {
    const cloud = domains.find((d) => d.id === 'cloud-fundamentals')!;
    const cloudIds = new Set(cloud.categories.flatMap((c) => c.concepts.map((con) => con.id)));
    for (const concept of allConcepts) {
      expect(cloudIds.has(concept.id), `collision on ${concept.id}`).toBe(false);
    }
  });

  it('slice 3B adds at least 30 concepts across five operations categories', () => {
    const operationsCategories = ['pod-lifecycle', 'scheduling', 'resource-management', 'scaling', 'deployment-strategies'];
    const operationsConcepts = kubernetesFundamentals.categories
      .filter((c) => operationsCategories.includes(c.id))
      .flatMap((c) => c.concepts);
    expect(operationsConcepts.length).toBeGreaterThanOrEqual(30);
  });
});
