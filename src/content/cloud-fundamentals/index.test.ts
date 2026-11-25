import { describe, it, expect, beforeAll } from 'vitest';
import {
  cloudFundamentals,
  domains,
  findDomain,
  findCategory,
  findConcept,
  findConceptById,
  findLessonMeta,
  findLabMeta,
} from './index';
import { conceptLoaders, createConceptContentLoader, type LoadedConcept } from './concept-loaders';
import { providers } from '../providers';
import type { ChallengeLab, ConceptMeta, LabDefinition, Lesson, SimulationLab } from '../types';

const validStatuses = ['available', 'in-development', 'coming-soon'];

// Concepts whose content is fully authored. Each is expected to be Active;
// every other concept is expected to be Coming soon. A status change must be
// a deliberate edit here, never a side effect.
const ACTIVE_CONCEPTS = [
  'regions-and-availability-zones', 'data-centers-and-edge-locations', 'geographic-redundancy-and-data-residency',
  'virtual-machines', 'containers', 'serverless-functions',
  'block-storage', 'object-storage', 'file-storage',
  'virtual-networks', 'subnets-and-routing', 'connecting-networks', 'dns-and-content-delivery',
  'identity-and-authentication', 'authorization-and-policies',
];

// Concept ids are route segments; changing one breaks links and progress.
const EXPECTED_CONCEPT_IDS = [
  'what-is-cloud-computing', 'cloud-service-models', 'cloud-deployment-models',
  'regions-and-availability-zones', 'data-centers-and-edge-locations', 'geographic-redundancy-and-data-residency',
  'virtual-machines', 'containers', 'serverless-functions',
  'block-storage', 'object-storage', 'file-storage',
  'virtual-networks', 'subnets-and-routing', 'connecting-networks', 'dns-and-content-delivery',
  'identity-and-authentication', 'authorization-and-policies', 'workload-and-federated-identity',
  'security-fundamentals', 'encryption-and-key-management', 'network-security', 'security-monitoring-and-compliance',
  'load-balancing-fundamentals', 'application-load-balancing', 'network-load-balancing', 'global-traffic-distribution',
  'auto-scaling', 'high-availability', 'disaster-recovery',
  'observability-fundamentals', 'metrics-and-alerting', 'logging', 'distributed-tracing',
];

const allConcepts: ConceptMeta[] = cloudFundamentals.categories.flatMap((c) => c.concepts);
const authoredConcepts = allConcepts.filter((c) => (c.lessons?.length ?? 0) > 0);

describe('Cloud Fundamentals metadata index — structure', () => {
  it('has exactly 10 categories', () => {
    expect(cloudFundamentals.categories).toHaveLength(10);
  });

  it('keeps all 34 concept ids unchanged and in place', () => {
    expect(allConcepts.map((c) => c.id)).toEqual(EXPECTED_CONCEPT_IDS);
  });

  it('every category has at least one concept', () => {
    for (const category of cloudFundamentals.categories) expect(category.concepts.length).toBeGreaterThan(0);
  });

  it('every concept has a valid status and a non-empty description', () => {
    for (const concept of allConcepts) {
      expect(validStatuses).toContain(concept.status);
      expect(concept.description.length).toBeGreaterThan(0);
    }
  });

  it('category ids, and concept ids across the whole domain, are unique', () => {
    const categoryIds = cloudFundamentals.categories.map((c) => c.id);
    expect(new Set(categoryIds).size).toBe(categoryIds.length);
    const conceptIds = allConcepts.map((c) => c.id);
    expect(new Set(conceptIds).size).toBe(conceptIds.length);
  });

  it('only the authored concepts are Active — every other concept stays Coming soon', () => {
    for (const concept of allConcepts) {
      const expected = ACTIVE_CONCEPTS.includes(concept.id) ? 'available' : 'coming-soon';
      expect({ id: concept.id, status: concept.status }).toEqual({ id: concept.id, status: expected });
    }
  });

  it('every Active concept has learning objectives and a lesson outline in its metadata', () => {
    for (const concept of allConcepts.filter((c) => c.status === 'available')) {
      expect(concept.learningObjectives?.length, concept.id).toBeGreaterThan(0);
      expect(concept.lessons?.length, concept.id).toBeGreaterThan(0);
    }
  });

  // progressStore keys completion by bare lesson/lab id, so ids must be
  // unique across the domain, not just within their concept.
  it('lesson and lab ids are unique across the whole domain and never collide', () => {
    const lessonIds = authoredConcepts.flatMap((c) => (c.lessons ?? []).map((l) => l.id));
    const labIds = authoredConcepts.flatMap((c) => (c.labs ?? []).map((l) => l.id));
    expect(lessonIds.filter((id, i) => lessonIds.indexOf(id) !== i)).toEqual([]);
    expect(labIds.filter((id, i) => labIds.indexOf(id) !== i)).toEqual([]);
    expect(labIds.filter((id) => lessonIds.includes(id))).toEqual([]);
  });

  it('every provider lesson in the outline names a registered provider', () => {
    const providerIds = new Set(providers.map((p) => p.id));
    for (const lesson of authoredConcepts.flatMap((c) => c.lessons ?? []).filter((l) => l.kind === 'provider')) {
      expect(providerIds.has(lesson.providerId!), lesson.id).toBe(true);
    }
  });

  it('every concept listed in relatedConcepts/prerequisites resolves to a real concept', () => {
    const ids = new Set(allConcepts.map((c) => c.id));
    for (const concept of allConcepts) {
      for (const relatedId of [...(concept.relatedConcepts ?? []), ...(concept.prerequisites ?? [])]) {
        expect(ids.has(relatedId), `${concept.id} → ${relatedId}`).toBe(true);
      }
    }
  });
});

describe('metadata/content boundary', () => {
  // The source of every module in the eager index graph: the domain index,
  // each category's index and meta, and the Coming-soon category stubs.
  const eagerSources = import.meta.glob<string>(['./index.ts', './*/index.ts', './*/meta.ts', './categories/*.ts'], {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  it('the eager index graph imports only metadata modules — never a concept content module', () => {
    expect(Object.keys(eagerSources).length).toBeGreaterThan(10);
    const allowed = /^(\.\.\/types|\.\.\/\.\.\/types|\.\/meta|\.\/categories\/[\w-]+|\.\/(compute|global-infrastructure|storage|networking|identity-and-access-management|security))$/;
    const offenders: string[] = [];
    for (const [file, source] of Object.entries(eagerSources)) {
      for (const [, specifier] of source.matchAll(/from '([^']+)'/g)) {
        if (!allowed.test(specifier!)) offenders.push(`${file} → ${specifier}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('there is a loader for every concept with a lesson outline, and no other loaders', () => {
    expect(Object.keys(conceptLoaders).sort()).toEqual(authoredConcepts.map((c) => c.id).sort());
  });
});

describe('content lookup functions', () => {
  it('findDomain, findCategory, and findConcept resolve valid ids and reject invalid ones', () => {
    expect(findDomain('cloud-fundamentals')).toBe(cloudFundamentals);
    expect(findDomain('nonexistent')).toBeUndefined();
    expect(findCategory('cloud-fundamentals', 'compute')?.title).toBe('Compute');
    expect(findCategory('cloud-fundamentals', 'nope')).toBeUndefined();
    expect(findCategory('nope', 'compute')).toBeUndefined();
    expect(findConcept('cloud-fundamentals', 'compute', 'virtual-machines')?.title).toBe('Virtual Machines');
    expect(findConcept('cloud-fundamentals', 'compute', 'nope')).toBeUndefined();
  });

  it('findConceptById resolves any concept by id alone', () => {
    expect(findConceptById('dns-and-content-delivery')?.title).toBe('DNS and Content Delivery');
    expect(findConceptById('nope')).toBeUndefined();
  });

  it('findLessonMeta and findLabMeta resolve outline entries without loading content', () => {
    const vm = findConceptById('virtual-machines')!;
    expect(findLessonMeta(vm, 'vm-architecture')?.title).toBe('VM Architecture');
    expect(findLessonMeta(vm, 'nope')).toBeUndefined();
    expect(findLabMeta(vm, 'vm-resource-allocation-lab')?.title).toBe('Design a VM Architecture');
  });

  it('domains array contains cloud-fundamentals', () => {
    expect(domains).toHaveLength(1);
    expect(domains[0]?.id).toBe('cloud-fundamentals');
  });
});

describe('content schema validation — loaded concept content', () => {
  let loaded: LoadedConcept[] = [];
  let allLessons: Lesson[] = [];
  let allLabs: LabDefinition[] = [];

  beforeAll(async () => {
    const loader = createConceptContentLoader(conceptLoaders);
    loaded = await Promise.all(authoredConcepts.map((c) => loader.load(c.id)));
    allLessons = loaded.flatMap((c) => c.lessons);
    allLabs = loaded.flatMap((c) => c.labs);
  });

  it('every authored concept loads, with lessons and labs in metadata order', () => {
    expect(loaded).toHaveLength(authoredConcepts.length);
    for (const concept of loaded) {
      const meta = findConceptById(concept.conceptId)!;
      expect(concept.lessons.map((l) => l.id)).toEqual((meta.lessons ?? []).map((l) => l.id));
      expect(concept.labs.map((l) => l.id)).toEqual((meta.labs ?? []).map((l) => l.id));
    }
  });

  it('loaded lessons carry their title and kind from the metadata, not a second copy', () => {
    for (const concept of loaded) {
      const meta = findConceptById(concept.conceptId)!;
      concept.lessons.forEach((lesson, i) => {
        expect({ id: lesson.id, title: lesson.title, kind: lesson.kind }).toEqual({
          id: meta.lessons![i]!.id,
          title: meta.lessons![i]!.title,
          kind: meta.lessons![i]!.kind,
        });
      });
    }
  });

  it('every simulation lab has a simulation, owned by its concept, whose id matches the lab content', () => {
    for (const concept of loaded) {
      for (const lab of concept.labs.filter((l) => l.type === 'simulation')) {
        const entry = concept.simulations[lab.id];
        expect(entry, `no simulation for ${lab.id}`).toBeDefined();
        expect(entry?.simulationId).toBe((lab.content as SimulationLab).simulationId);
      }
      const simulationLabIds = new Set(concept.labs.filter((l) => l.type === 'simulation').map((l) => l.id));
      for (const id of Object.keys(concept.simulations)) expect(simulationLabIds.has(id), id).toBe(true);
    }
  });

  it('every provider-kind lesson has matching providerDetails', () => {
    for (const lesson of allLessons.filter((l) => l.kind === 'provider')) {
      expect(lesson.providerId, lesson.id).toBeDefined();
      expect(lesson.providerDetails?.providerId, lesson.id).toBe(lesson.providerId);
      expect(lesson.providerDetails?.serviceName.length).toBeGreaterThan(0);
      expect(lesson.providerDetails?.documentationUrl).toMatch(/^https:\/\//);
    }
  });

  it('every lesson has learning objectives and at least one section with at least one block', () => {
    for (const lesson of allLessons) {
      expect(lesson.learningObjectives.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.sections.length, lesson.id).toBeGreaterThan(0);
      for (const section of lesson.sections) expect(section.blocks.length, lesson.id).toBeGreaterThan(0);
    }
  });

  it('every knowledge check question has exactly one correct option for single-choice/scenario, at least one for multi-select', () => {
    for (const lesson of allLessons) {
      for (const question of lesson.knowledgeCheck ?? []) {
        const correctCount = question.options.filter((o) => o.correct).length;
        if (question.type === 'multi-select') expect(correctCount, question.id).toBeGreaterThan(0);
        else expect(correctCount, question.id).toBe(1);
        for (const option of question.options) expect(option.explanation.length).toBeGreaterThan(0);
      }
    }
  });

  it('every visualization has states, sequence scenes have one state per message plus the initial state, and edges reference real nodes', () => {
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

  it('every lab’s content shape matches its declared type', () => {
    for (const lab of allLabs) {
      if (lab.type === 'simulation') expect('instructions' in lab.content, lab.id).toBe(true);
      else if (lab.type === 'hands-on') expect('tasks' in lab.content, lab.id).toBe(true);
      else expect('decisions' in lab.content, lab.id).toBe(true);
    }
  });

  it('every challenge solution only uses decision and option ids that exist', () => {
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
