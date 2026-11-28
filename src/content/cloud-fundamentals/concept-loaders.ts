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

  // --- Kubernetes Fundamentals: Operations (Slice 3B) --------------------
  // Pod lifecycle & health management
  'pod-lifecycle-phases': () => import('../kubernetes-fundamentals/pod-lifecycle/pod-lifecycle-phases'),
  'container-lifecycle': () => import('../kubernetes-fundamentals/pod-lifecycle/container-lifecycle'),
  'container-restart-policies': () => import('../kubernetes-fundamentals/pod-lifecycle/container-restart-policies'),
  'liveness-probes': () => import('../kubernetes-fundamentals/pod-lifecycle/liveness-probes'),
  'readiness-probes': () => import('../kubernetes-fundamentals/pod-lifecycle/readiness-probes'),
  'startup-probes': () => import('../kubernetes-fundamentals/pod-lifecycle/startup-probes'),
  'pod-termination-and-graceful-shutdown': () =>
    import('../kubernetes-fundamentals/pod-lifecycle/pod-termination-and-graceful-shutdown'),

  // Scheduling & placement
  'scheduling-deep-dive': () => import('../kubernetes-fundamentals/scheduling/scheduling-deep-dive'),
  'node-selectors': () => import('../kubernetes-fundamentals/scheduling/node-selectors'),
  'node-affinity-and-anti-affinity': () =>
    import('../kubernetes-fundamentals/scheduling/node-affinity-and-anti-affinity'),
  'pod-affinity-and-anti-affinity': () =>
    import('../kubernetes-fundamentals/scheduling/pod-affinity-and-anti-affinity'),
  'taints-and-tolerations': () => import('../kubernetes-fundamentals/scheduling/taints-and-tolerations'),
  'priority-classes-and-preemption': () =>
    import('../kubernetes-fundamentals/scheduling/priority-classes-and-preemption'),
  'topology-spread-constraints': () => import('../kubernetes-fundamentals/scheduling/topology-spread-constraints'),

  // Resource management
  'cpu-requests-and-limits': () => import('../kubernetes-fundamentals/resource-management/cpu-requests-and-limits'),
  'memory-requests-and-limits': () =>
    import('../kubernetes-fundamentals/resource-management/memory-requests-and-limits'),
  'resource-qos-classes': () => import('../kubernetes-fundamentals/resource-management/resource-qos-classes'),
  oomkilled: () => import('../kubernetes-fundamentals/resource-management/oomkilled'),
  'cpu-throttling': () => import('../kubernetes-fundamentals/resource-management/cpu-throttling'),
  limitrange: () => import('../kubernetes-fundamentals/resource-management/limitrange'),
  resourcequota: () => import('../kubernetes-fundamentals/resource-management/resourcequota'),

  // Scaling & availability
  'horizontal-pod-autoscaler': () => import('../kubernetes-fundamentals/scaling/horizontal-pod-autoscaler'),
  'vertical-pod-autoscaler': () => import('../kubernetes-fundamentals/scaling/vertical-pod-autoscaler'),
  'cluster-autoscaler': () => import('../kubernetes-fundamentals/scaling/cluster-autoscaler'),
  'pod-disruption-budget': () => import('../kubernetes-fundamentals/scaling/pod-disruption-budget'),
  'kubernetes-high-availability': () => import('../kubernetes-fundamentals/scaling/kubernetes-high-availability'),
  'replication-and-failure-recovery': () =>
    import('../kubernetes-fundamentals/scaling/replication-and-failure-recovery'),

  // Deployment strategies & rollouts
  'rolling-updates': () => import('../kubernetes-fundamentals/deployment-strategies/rolling-updates'),
  rollback: () => import('../kubernetes-fundamentals/deployment-strategies/rollback'),
  'deployment-revision-history': () =>
    import('../kubernetes-fundamentals/deployment-strategies/deployment-revision-history'),
  'blue-green-deployment': () => import('../kubernetes-fundamentals/deployment-strategies/blue-green-deployment'),
  'canary-deployment': () => import('../kubernetes-fundamentals/deployment-strategies/canary-deployment'),
  'maxsurge-and-maxunavailable': () =>
    import('../kubernetes-fundamentals/deployment-strategies/maxsurge-and-maxunavailable'),
  'zero-downtime-deployment': () =>
    import('../kubernetes-fundamentals/deployment-strategies/zero-downtime-deployment'),

  // --- Kubernetes Fundamentals: Networking & Security (Slice 3C) --------
  // Networking internals
  'kubernetes-network-model': () =>
    import('../kubernetes-fundamentals/networking-internals/kubernetes-network-model'),
  'container-network-interface': () =>
    import('../kubernetes-fundamentals/networking-internals/container-network-interface'),
  'cni-plugin-architecture': () =>
    import('../kubernetes-fundamentals/networking-internals/cni-plugin-architecture'),
  'pod-to-pod-communication': () =>
    import('../kubernetes-fundamentals/networking-internals/pod-to-pod-communication'),
  'cross-node-pod-networking': () =>
    import('../kubernetes-fundamentals/networking-internals/cross-node-pod-networking'),
  'network-routing-and-encapsulation': () =>
    import('../kubernetes-fundamentals/networking-internals/network-routing-and-encapsulation'),
  'kube-proxy-and-service-routing': () =>
    import('../kubernetes-fundamentals/networking-internals/kube-proxy-and-service-routing'),
  'iptables-vs-ipvs': () =>
    import('../kubernetes-fundamentals/networking-internals/iptables-vs-ipvs'),
  'network-troubleshooting-fundamentals': () =>
    import('../kubernetes-fundamentals/networking-internals/network-troubleshooting-fundamentals'),

  // Ingress & traffic management
  'ingress-architecture': () =>
    import('../kubernetes-fundamentals/ingress-and-traffic/ingress-architecture'),
  'ingress-controller': () =>
    import('../kubernetes-fundamentals/ingress-and-traffic/ingress-controller'),
  'ingress-rules-and-path-routing': () =>
    import('../kubernetes-fundamentals/ingress-and-traffic/ingress-rules-and-path-routing'),
  'tls-termination': () =>
    import('../kubernetes-fundamentals/ingress-and-traffic/tls-termination'),
  'gateway-api': () =>
    import('../kubernetes-fundamentals/ingress-and-traffic/gateway-api'),
  'north-south-vs-east-west-traffic': () =>
    import('../kubernetes-fundamentals/ingress-and-traffic/north-south-vs-east-west-traffic'),
  'service-mesh-fundamentals': () =>
    import('../kubernetes-fundamentals/ingress-and-traffic/service-mesh-fundamentals'),
  'sidecar-proxy-architecture': () =>
    import('../kubernetes-fundamentals/ingress-and-traffic/sidecar-proxy-architecture'),

  // Network security
  'kubernetes-networkpolicy': () =>
    import('../kubernetes-fundamentals/network-security/kubernetes-networkpolicy'),
  'ingress-and-egress-policies': () =>
    import('../kubernetes-fundamentals/network-security/ingress-and-egress-policies'),
  'kubernetes-network-isolation': () =>
    import('../kubernetes-fundamentals/network-security/kubernetes-network-isolation'),
  'default-deny-policies': () =>
    import('../kubernetes-fundamentals/network-security/default-deny-policies'),
  'namespace-network-segmentation': () =>
    import('../kubernetes-fundamentals/network-security/namespace-network-segmentation'),
  'network-policy-enforcement-by-cni': () =>
    import('../kubernetes-fundamentals/network-security/network-policy-enforcement-by-cni'),

  // Identity & access management
  'authn-authz-admission': () =>
    import('../kubernetes-fundamentals/identity-and-access/authn-authz-admission'),
  'kubernetes-authentication': () =>
    import('../kubernetes-fundamentals/identity-and-access/kubernetes-authentication'),
  'kubernetes-authorization': () =>
    import('../kubernetes-fundamentals/identity-and-access/kubernetes-authorization'),
  'rbac-architecture': () =>
    import('../kubernetes-fundamentals/identity-and-access/rbac-architecture'),
  'role-and-clusterrole': () =>
    import('../kubernetes-fundamentals/identity-and-access/role-and-clusterrole'),
  'rolebinding-and-clusterrolebinding': () =>
    import('../kubernetes-fundamentals/identity-and-access/rolebinding-and-clusterrolebinding'),
  serviceaccounts: () =>
    import('../kubernetes-fundamentals/identity-and-access/serviceaccounts'),
  'serviceaccount-token-projection': () =>
    import('../kubernetes-fundamentals/identity-and-access/serviceaccount-token-projection'),

  // Workload security
  'pod-security-standards': () =>
    import('../kubernetes-fundamentals/workload-security/pod-security-standards'),
  'pod-security-admission': () =>
    import('../kubernetes-fundamentals/workload-security/pod-security-admission'),
  'security-context': () =>
    import('../kubernetes-fundamentals/workload-security/security-context'),
  'linux-capabilities': () =>
    import('../kubernetes-fundamentals/workload-security/linux-capabilities'),
  'privileged-containers': () =>
    import('../kubernetes-fundamentals/workload-security/privileged-containers'),
  'seccomp-and-apparmor': () =>
    import('../kubernetes-fundamentals/workload-security/seccomp-and-apparmor'),
  'secrets-security': () =>
    import('../kubernetes-fundamentals/workload-security/secrets-security'),
  'image-security-and-supply-chain-basics': () =>
    import('../kubernetes-fundamentals/workload-security/image-security-and-supply-chain-basics'),
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
