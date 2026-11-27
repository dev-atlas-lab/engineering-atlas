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
  'security-fundamentals': () => import('./security/security-fundamentals'),
  'encryption-and-key-management': () => import('./security/encryption-and-key-management'),
  'network-security': () => import('./security/network-security'),
  'security-monitoring-and-compliance': () => import('./security/security-monitoring-and-compliance'),
  'load-balancing-fundamentals': () => import('./load-balancing/load-balancing-fundamentals'),
  'application-load-balancing': () => import('./load-balancing/application-load-balancing'),
  'network-load-balancing': () => import('./load-balancing/network-load-balancing'),
  'global-traffic-distribution': () => import('./load-balancing/global-traffic-distribution'),
  'auto-scaling': () => import('./scalability-and-reliability/auto-scaling'),
  'high-availability': () => import('./scalability-and-reliability/high-availability'),
  'observability-fundamentals': () => import('./monitoring-and-observability/observability-fundamentals'),
  'metrics-and-alerting': () => import('./monitoring-and-observability/metrics-and-alerting'),
  logging: () => import('./monitoring-and-observability/logging'),
  'distributed-tracing': () => import('./monitoring-and-observability/distributed-tracing'),

  // --- Kubernetes Fundamentals --------------------------------------------
  // Concept ids are unique across the whole index (see findConceptById),
  // so they can share one loader registry with the Cloud Fundamentals
  // concepts. The paths point at the kubernetes-fundamentals tree.
  'what-is-kubernetes': () => import('../kubernetes-fundamentals/foundations/what-is-kubernetes'),
  'why-container-orchestration': () => import('../kubernetes-fundamentals/foundations/why-container-orchestration'),
  'kubernetes-vs-docker': () => import('../kubernetes-fundamentals/foundations/kubernetes-vs-docker'),
  'declarative-vs-imperative-configuration': () =>
    import('../kubernetes-fundamentals/foundations/declarative-vs-imperative-configuration'),
  'desired-state-vs-actual-state': () => import('../kubernetes-fundamentals/foundations/desired-state-vs-actual-state'),
  'kubernetes-reconciliation-loop': () => import('../kubernetes-fundamentals/foundations/kubernetes-reconciliation-loop'),
  'kubernetes-cluster-architecture': () =>
    import('../kubernetes-fundamentals/architecture/kubernetes-cluster-architecture'),
  'control-plane': () => import('../kubernetes-fundamentals/architecture/control-plane'),
  'worker-nodes': () => import('../kubernetes-fundamentals/architecture/worker-nodes'),
  'kubernetes-api-server': () => import('../kubernetes-fundamentals/architecture/kubernetes-api-server'),
  etcd: () => import('../kubernetes-fundamentals/architecture/etcd'),
  scheduler: () => import('../kubernetes-fundamentals/architecture/scheduler'),
  'controller-manager': () => import('../kubernetes-fundamentals/architecture/controller-manager'),
  kubelet: () => import('../kubernetes-fundamentals/architecture/kubelet'),
  'kube-proxy': () => import('../kubernetes-fundamentals/architecture/kube-proxy'),
  'container-runtime': () => import('../kubernetes-fundamentals/architecture/container-runtime'),
  pod: () => import('../kubernetes-fundamentals/workloads/pod'),
  'multi-container-pods': () => import('../kubernetes-fundamentals/workloads/multi-container-pods'),
  replicaset: () => import('../kubernetes-fundamentals/workloads/replicaset'),
  deployment: () => import('../kubernetes-fundamentals/workloads/deployment'),
  statefulset: () => import('../kubernetes-fundamentals/workloads/statefulset'),
  daemonset: () => import('../kubernetes-fundamentals/workloads/daemonset'),
  'job-and-cronjob': () => import('../kubernetes-fundamentals/workloads/job-and-cronjob'),
  'pod-networking': () => import('../kubernetes-fundamentals/networking/pod-networking'),
  service: () => import('../kubernetes-fundamentals/networking/service'),
  clusterip: () => import('../kubernetes-fundamentals/networking/clusterip'),
  nodeport: () => import('../kubernetes-fundamentals/networking/nodeport'),
  'loadbalancer-service': () => import('../kubernetes-fundamentals/networking/loadbalancer-service'),
  'service-discovery': () => import('../kubernetes-fundamentals/networking/service-discovery'),
  coredns: () => import('../kubernetes-fundamentals/networking/coredns'),
  'kubernetes-objects': () => import('../kubernetes-fundamentals/configuration/kubernetes-objects'),
  'yaml-manifests': () => import('../kubernetes-fundamentals/configuration/yaml-manifests'),
  'labels-and-selectors': () => import('../kubernetes-fundamentals/configuration/labels-and-selectors'),
  namespaces: () => import('../kubernetes-fundamentals/configuration/namespaces'),
  configmaps: () => import('../kubernetes-fundamentals/configuration/configmaps'),
  secrets: () => import('../kubernetes-fundamentals/configuration/secrets'),
  'resource-requests-and-limits': () => import('../kubernetes-fundamentals/configuration/resource-requests-and-limits'),
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
