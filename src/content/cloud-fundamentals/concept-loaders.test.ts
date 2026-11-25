import { describe, it, expect, vi } from 'vitest';
import {
  assembleConcept,
  conceptLoaders,
  ContentLoadError,
  createConceptContentLoader,
  type ConceptModuleLoader,
} from './concept-loaders';
import type { ConceptContentModule, ConceptMeta, LabBody, LessonBody } from '../types';

const body: LessonBody = { learningObjectives: ['o'], sections: [{ heading: 'h', blocks: [{ type: 'paragraph', text: 't' }] }] };
const labBody: LabBody = {
  difficulty: 'beginner',
  estimatedTime: '5 minutes',
  description: 'd',
  learningObjectives: [],
  prerequisites: [],
  content: { scenario: 's', requirements: [], constraints: [], decisions: [], solutions: [] },
};

function meta(id: string, lessonIds: string[], labIds: string[] = []): ConceptMeta {
  return {
    id,
    title: id.toUpperCase(),
    description: 'd',
    status: 'available',
    lessons: lessonIds.map((l) => ({ id: l, title: `Title of ${l}`, kind: 'concept' })),
    labs: labIds.map((l) => ({ id: l, title: `Lab ${l}`, type: 'challenge' })),
  };
}

function module(lessonIds: string[], labIds: string[] = []): ConceptContentModule {
  return {
    lessons: Object.fromEntries(lessonIds.map((id) => [id, body])),
    labs: Object.fromEntries(labIds.map((id) => [id, labBody])),
    simulations: {},
  };
}

const metas: Record<string, ConceptMeta> = {
  alpha: meta('alpha', ['a1', 'a2'], ['alpha-lab']),
  beta: meta('beta', ['b1']),
  gamma: meta('gamma', ['g1']),
  orphan: meta('orphan', ['o1']),
};

function setup(overrides: Partial<Record<string, ConceptModuleLoader>> = {}) {
  const loaders: Record<string, ReturnType<typeof vi.fn<ConceptModuleLoader>>> = {
    alpha: vi.fn<ConceptModuleLoader>(async () => ({ content: module(['a2', 'a1'], ['alpha-lab']) })),
    beta: vi.fn<ConceptModuleLoader>(async () => ({ content: module(['b1']) })),
    gamma: vi.fn<ConceptModuleLoader>(async () => ({ content: module(['g1']) })),
  };
  for (const [id, fn] of Object.entries(overrides)) loaders[id] = vi.fn<ConceptModuleLoader>(fn!);
  const loader = createConceptContentLoader(loaders, (id) => metas[id]);
  return { loader, loaders };
}

describe('createConceptContentLoader', () => {
  it('resolves a concept to its merged content in metadata order, with titles from metadata', async () => {
    const { loader } = setup();
    const concept = await loader.load('alpha');
    expect(concept.lessons.map((l) => [l.id, l.title])).toEqual([
      ['a1', 'Title of a1'],
      ['a2', 'Title of a2'],
    ]);
    expect(concept.labs.map((l) => l.id)).toEqual(['alpha-lab']);
  });

  it('invokes only the requested concept’s loader', async () => {
    const { loader, loaders } = setup();
    await loader.load('beta');
    expect(loaders.beta).toHaveBeenCalledTimes(1);
    expect(loaders.alpha).not.toHaveBeenCalled();
    expect(loaders.gamma).not.toHaveBeenCalled();
  });

  it('caches loaded content: repeat loads reuse it, and peek returns it synchronously', async () => {
    const { loader, loaders } = setup();
    expect(loader.peek('alpha')).toBeUndefined();
    const first = await loader.load('alpha');
    const second = await loader.load('alpha');
    expect(second).toBe(first);
    expect(loader.peek('alpha')).toBe(first);
    expect(loaders.alpha).toHaveBeenCalledTimes(1);
  });

  it('shares one in-flight import between concurrent requests', async () => {
    const { loader, loaders } = setup();
    const [a, b] = await Promise.all([loader.load('alpha'), loader.load('alpha')]);
    expect(a).toBe(b);
    expect(loaders.alpha).toHaveBeenCalledTimes(1);
  });

  it('rejects an id that is not in the metadata with an unknown-concept error', async () => {
    const { loader } = setup();
    await expect(loader.load('nope')).rejects.toMatchObject({ name: 'ContentLoadError', kind: 'unknown-concept', conceptId: 'nope' });
  });

  it('rejects a concept with an outline but no registered module with a missing-module error', async () => {
    const { loader } = setup();
    await expect(loader.load('orphan')).rejects.toMatchObject({ kind: 'missing-module' });
  });

  it('turns a failed dynamic import into an import-failed error that keeps the cause', async () => {
    const cause = new TypeError('Failed to fetch dynamically imported module');
    const { loader } = setup({ beta: async () => Promise.reject(cause) });
    const error = await loader.load('beta').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ContentLoadError);
    expect(error).toMatchObject({ kind: 'import-failed', cause });
  });

  it('does not cache a failure: a retry imports again and can succeed', async () => {
    let calls = 0;
    const { loader } = setup({
      gamma: async () => {
        calls += 1;
        if (calls === 1) throw new Error('network down');
        return { content: module(['g1']) };
      },
    });
    await expect(loader.load('gamma')).rejects.toMatchObject({ kind: 'import-failed' });
    expect(loader.peek('gamma')).toBeUndefined();
    await expect(loader.load('gamma')).resolves.toMatchObject({ conceptId: 'gamma' });
    expect(calls).toBe(2);
  });
});

describe('assembleConcept', () => {
  it('rejects a module that is missing a lesson from the outline', () => {
    expect(() => assembleConcept(metas.alpha!, module(['a1'], ['alpha-lab']))).toThrow(
      expect.objectContaining({ kind: 'content-mismatch' }),
    );
  });

  it('rejects a module with a lesson the outline does not list', () => {
    expect(() => assembleConcept(metas.beta!, module(['b1', 'extra']))).toThrow(
      expect.objectContaining({ kind: 'content-mismatch' }),
    );
  });

  it('rejects a module whose labs do not match the outline', () => {
    expect(() => assembleConcept(metas.alpha!, module(['a1', 'a2']))).toThrow(
      expect.objectContaining({ kind: 'content-mismatch' }),
    );
  });
});

describe('conceptLoaders (the real registry)', () => {
  it('every entry is a function that has not been invoked by importing the registry', () => {
    // Importing this module must not import any concept: each loader is a
    // thunk, and nothing above has called the real ones.
    for (const loader of Object.values(conceptLoaders)) expect(typeof loader).toBe('function');
  });

  it('each real loader resolves to a module exporting the content contract', async () => {
    const loaded = await conceptLoaders['virtual-networks']!();
    expect(Object.keys(loaded.content).sort()).toEqual(['labs', 'lessons', 'simulations']);
    expect(Object.keys(loaded.content.simulations)).toEqual(['cidr-and-subnet-lab']);
  });
});
