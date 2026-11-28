import { describe, it, expect, beforeAll } from 'vitest';
import { kubernetesFundamentals } from './index';
import { domains, findConceptById } from '../cloud-fundamentals/index';
import { conceptLoaders, createConceptContentLoader, type LoadedConcept } from '../cloud-fundamentals/concept-loaders';
import type { ConceptMeta, SimulationLab } from '../types';

const allConcepts: ConceptMeta[] = kubernetesFundamentals.categories.flatMap((c) => c.concepts);

describe('Kubernetes Fundamentals metadata index', () => {
  it('is registered as a second domain alongside Cloud Fundamentals', () => {
    expect(domains.map((d) => d.id)).toContain('kubernetes-fundamentals');
  });

  it('has twenty categories in the expected order', () => {
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
      'networking-internals',
      'ingress-and-traffic',
      'network-security',
      'identity-and-access',
      'workload-security',
      'storage-fundamentals',
      'storage-internals',
      'stateful-workloads',
      'data-reliability',
      'storage-operations',
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
    // The five Slice 3C labs exist.
    expect(labIds).toContain('cni-networking-explorer');
    expect(labIds).toContain('ingress-routing-simulator');
    expect(labIds).toContain('networkpolicy-simulator');
    expect(labIds).toContain('rbac-permission-simulator');
    expect(labIds).toContain('workload-security-simulator');
    // The five Slice 3D labs exist.
    expect(labIds).toContain('pv-pvc-binder-simulator');
    expect(labIds).toContain('dynamic-provisioning-simulator');
    expect(labIds).toContain('statefulset-storage-simulator');
    expect(labIds).toContain('backup-recovery-simulator');
    expect(labIds).toContain('storage-troubleshooting-lab');
  });

  it('every kubernetes concept id is distinct from every cloud-fundamentals concept id', () => {
    const cloud = domains.find((d) => d.id === 'cloud-fundamentals')!;
    const cloudIds = new Set(cloud.categories.flatMap((c) => c.concepts.map((con) => con.id)));
    for (const concept of allConcepts) {
      expect(cloudIds.has(concept.id), `collision on ${concept.id}`).toBe(false);
    }
  });

  it('slice 3C adds at least 35 concepts across five networking & security categories', () => {
    const sliceCategories = [
      'networking-internals',
      'ingress-and-traffic',
      'network-security',
      'identity-and-access',
      'workload-security',
    ];
    const sliceConcepts = kubernetesFundamentals.categories
      .filter((c) => sliceCategories.includes(c.id))
      .flatMap((c) => c.concepts);
    expect(sliceConcepts.length).toBeGreaterThanOrEqual(35);
  });

  it('slice 3D adds at least 40 concepts across five storage & reliability categories', () => {
    const sliceCategories = [
      'storage-fundamentals',
      'storage-internals',
      'stateful-workloads',
      'data-reliability',
      'storage-operations',
    ];
    const sliceConcepts = kubernetesFundamentals.categories
      .filter((c) => sliceCategories.includes(c.id))
      .flatMap((c) => c.concepts);
    expect(sliceConcepts.length).toBeGreaterThanOrEqual(40);
  });
});

describe('Slice 3D loaded content & cross-reference integrity', () => {
  const slice3DCategories = [
    'storage-fundamentals',
    'storage-internals',
    'stateful-workloads',
    'data-reliability',
    'storage-operations',
  ];
  const slice3DConcepts = kubernetesFundamentals.categories
    .filter((c) => slice3DCategories.includes(c.id))
    .flatMap((c) => c.concepts);

  let loaded: LoadedConcept[] = [];

  beforeAll(async () => {
    const loader = createConceptContentLoader(conceptLoaders);
    loaded = await Promise.all(slice3DConcepts.map((c) => loader.load(c.id)));
  });

  it('every Slice 3D concept loads with lessons and labs matching metadata order', () => {
    expect(loaded).toHaveLength(slice3DConcepts.length);
    for (const concept of loaded) {
      const meta = findConceptById(concept.conceptId)!;
      expect(concept.lessons.map((l) => l.id)).toEqual((meta.lessons ?? []).map((l) => l.id));
      expect(concept.labs.map((l) => l.id)).toEqual((meta.labs ?? []).map((l) => l.id));
    }
  });

  it('every Slice 3D simulation lab has a matching simulation binding', () => {
    for (const concept of loaded) {
      for (const lab of concept.labs.filter((l) => l.type === 'simulation')) {
        const entry = concept.simulations[lab.id];
        expect(entry, `missing simulation binding for ${lab.id}`).toBeDefined();
        expect(entry?.simulationId).toBe((lab.content as SimulationLab).simulationId);
      }
    }
  });

  it('every Slice 3D visualization satisfies sequence arity and valid node/boundary refs', () => {
    for (const concept of loaded) {
      for (const lesson of concept.lessons) {
        const scene = lesson.visualization;
        if (!scene) continue;
        expect(scene.states.length, scene.id).toBeGreaterThan(0);
        if (scene.type === 'sequence') {
          expect(scene.states.length, `${scene.id} sequence arity`).toBe(scene.edges.length + 1);
        }
        const nodeIds = new Set(scene.nodes.map((n) => n.id));
        for (const edge of scene.edges) {
          expect(nodeIds.has(edge.source) && nodeIds.has(edge.target), `${scene.id}:${edge.id}`).toBe(true);
        }
        for (const boundary of scene.boundaries ?? []) {
          expect(boundary.nodeIds.length, `${scene.id}:${boundary.id}`).toBeGreaterThan(0);
          for (const id of boundary.nodeIds) {
            expect(nodeIds.has(id), `${scene.id}:${boundary.id}:${id}`).toBe(true);
          }
        }
      }
    }
  });

  it('every Slice 3D knowledge check has valid options and explanations', () => {
    for (const concept of loaded) {
      for (const lesson of concept.lessons) {
        for (const q of lesson.knowledgeCheck ?? []) {
          const correctCount = q.options.filter((o) => o.correct).length;
          if (q.type === 'multi-select') expect(correctCount, q.id).toBeGreaterThan(0);
          else expect(correctCount, q.id).toBe(1);
          for (const opt of q.options) expect(opt.explanation.length, `${q.id}:${opt.id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every Slice 3D prerequisite and relatedConcept resolves across domains, and lesson/lab ids never collide globally', () => {
    const allIndexConcepts = domains.flatMap((d) => d.categories.flatMap((c) => c.concepts));
    const allConceptIds = new Set(allIndexConcepts.map((c) => c.id));
    for (const concept of slice3DConcepts) {
      for (const ref of [...(concept.prerequisites ?? []), ...(concept.relatedConcepts ?? [])]) {
        expect(allConceptIds.has(ref), `${concept.id} -> ${ref}`).toBe(true);
      }
    }

    const allLessonIds = allIndexConcepts.flatMap((c) => (c.lessons ?? []).map((l) => l.id));
    const allLabIds = allIndexConcepts.flatMap((c) => (c.labs ?? []).map((l) => l.id));
    expect(new Set(allLessonIds).size).toBe(allLessonIds.length);
    expect(new Set(allLabIds).size).toBe(allLabIds.length);
    expect(allLabIds.filter((id) => allLessonIds.includes(id))).toEqual([]);
  });
});
