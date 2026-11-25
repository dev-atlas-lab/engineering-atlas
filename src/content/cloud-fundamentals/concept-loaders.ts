import type { ConceptContentModule, ConceptMeta, LabDefinition, LabSimulationEntry, Lesson } from '../types';
import { findConceptById } from './index';

// Per-concept content loading. Each entry is a dynamic import, so Vite emits
// one chunk per concept and nothing here pulls a content module into the
// eager bundle. Concepts without lessons (Coming soon) have no entry.
// See docs/decisions/ADR-007-per-concept-content-loading.md.

export type ConceptModuleLoader = () => Promise<{ content: ConceptContentModule }>;

export const conceptLoaders: Record<string, ConceptModuleLoader> = {
  'virtual-machines': () => import('./compute/virtual-machines'),
  containers: () => import('./compute/containers'),
  'serverless-functions': () => import('./compute/serverless-functions'),
  'regions-and-availability-zones': () => import('./global-infrastructure/regions-and-availability-zones'),
  'data-centers-and-edge-locations': () => import('./global-infrastructure/data-centers-and-edge-locations'),
  'geographic-redundancy-and-data-residency': () =>
    import('./global-infrastructure/geographic-redundancy-and-data-residency'),
  'block-storage': () => import('./storage/block-storage'),
  'object-storage': () => import('./storage/object-storage'),
  'file-storage': () => import('./storage/file-storage'),
  'virtual-networks': () => import('./networking/virtual-networks'),
  'subnets-and-routing': () => import('./networking/subnets-and-routing'),
  'connecting-networks': () => import('./networking/connecting-networks'),
  'dns-and-content-delivery': () => import('./networking/dns-and-content-delivery'),
  'identity-and-authentication': () => import('./identity-and-access-management/identity-and-authentication'),
  'authorization-and-policies': () => import('./identity-and-access-management/authorization-and-policies'),
  'workload-and-federated-identity': () => import('./identity-and-access-management/workload-and-federated-identity'),
  'encryption-and-key-management': () => import('./security/encryption-and-key-management'),
};

/** A concept's metadata merged with its lazily loaded bodies, in metadata order. */
export interface LoadedConcept {
  conceptId: string;
  lessons: Lesson[];
  labs: LabDefinition[];
  simulations: Record<string, LabSimulationEntry>;
}

export type ContentLoadErrorKind =
  /** No concept with this id exists in the metadata index. */
  | 'unknown-concept'
  /** The concept lists lessons but no content module is registered for it. */
  | 'missing-module'
  /** The dynamic import itself failed — typically a network problem. */
  | 'import-failed'
  /** The module loaded, but its lesson or lab ids do not match the metadata. */
  | 'content-mismatch';

export class ContentLoadError extends Error {
  readonly kind: ContentLoadErrorKind;
  readonly conceptId: string;

  constructor(kind: ContentLoadErrorKind, conceptId: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ContentLoadError';
    this.kind = kind;
    this.conceptId = conceptId;
  }
}

function sameIds(expected: string[], actual: string[]): boolean {
  return expected.length === actual.length && expected.every((id) => actual.includes(id));
}

/** Merges metadata with a loaded module, verifying that every lesson and
 *  lab in the metadata has a body and that the module has no extras. */
export function assembleConcept(meta: ConceptMeta, module: ConceptContentModule): LoadedConcept {
  const lessonIds = (meta.lessons ?? []).map((l) => l.id);
  const labIds = (meta.labs ?? []).map((l) => l.id);
  if (!sameIds(lessonIds, Object.keys(module.lessons)) || !sameIds(labIds, Object.keys(module.labs))) {
    throw new ContentLoadError(
      'content-mismatch',
      meta.id,
      `The content for “${meta.title}” does not match its lesson and lab outline.`,
    );
  }
  return {
    conceptId: meta.id,
    lessons: (meta.lessons ?? []).map((m) => ({ ...m, ...module.lessons[m.id]! })),
    labs: (meta.labs ?? []).map((m) => ({ ...m, ...module.labs[m.id]! })),
    simulations: module.simulations,
  };
}

export interface ConceptContentLoader {
  /** Loads (or returns the cached) content for a concept. */
  load(conceptId: string): Promise<LoadedConcept>;
  /** Returns already-loaded content synchronously, if any. */
  peek(conceptId: string): LoadedConcept | undefined;
}

export function createConceptContentLoader(
  loaders: Record<string, ConceptModuleLoader>,
  lookupMeta: (conceptId: string) => ConceptMeta | undefined = findConceptById,
): ConceptContentLoader {
  const resolved = new Map<string, LoadedConcept>();
  const pending = new Map<string, Promise<LoadedConcept>>();

  async function fetchConcept(conceptId: string): Promise<LoadedConcept> {
    const meta = lookupMeta(conceptId);
    if (!meta) {
      throw new ContentLoadError('unknown-concept', conceptId, `There is no concept called “${conceptId}”.`);
    }
    const loader = loaders[conceptId];
    if (!loader) {
      throw new ContentLoadError('missing-module', conceptId, `No learning content is registered for “${meta.title}”.`);
    }
    let module: { content: ConceptContentModule };
    try {
      module = await loader();
    } catch (cause) {
      throw new ContentLoadError('import-failed', conceptId, `The content for “${meta.title}” could not be downloaded.`, {
        cause,
      });
    }
    return assembleConcept(meta, module.content);
  }

  return {
    load(conceptId) {
      const done = resolved.get(conceptId);
      if (done) return Promise.resolve(done);
      const inFlight = pending.get(conceptId);
      if (inFlight) return inFlight;

      const promise = fetchConcept(conceptId).then(
        (concept) => {
          resolved.set(conceptId, concept);
          pending.delete(conceptId);
          return concept;
        },
        (error: unknown) => {
          // Forget the failure so a retry starts a fresh import.
          pending.delete(conceptId);
          throw error;
        },
      );
      pending.set(conceptId, promise);
      return promise;
    },
    peek(conceptId) {
      return resolved.get(conceptId);
    },
  };
}

export const conceptContentLoader = createConceptContentLoader(conceptLoaders);
