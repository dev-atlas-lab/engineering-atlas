import type { ConceptContentModule, LessonBody } from '../../types';

const whatMeshAdds: LessonBody = {
  learningObjectives: [
    'Enumerate the features a mesh adds beyond plain Services',
    'Decide when a mesh is worth its operational cost',
  ],
  sections: [
    {
      heading: 'Six things a mesh can give you',
      blocks: [
        {
          type: 'list',
          items: [
            'mTLS everywhere: every east-west call is encrypted and mutually authenticated using identity-aware certs issued per-workload.',
            'Retries, timeouts, and circuit breaking: applied transparently by the sidecar without changing application code.',
            'Traffic shifting: canary and blue-green by percentage or request-attribute-based routing.',
            'Observability: per-request metrics (RED — rate, errors, duration) and distributed tracing hooks for free.',
            'Authorization: AuthorizationPolicy objects that gate traffic by identity, path, method — enforced at the sidecar.',
            'Multi-cluster: service-to-service connectivity across clusters without cross-cluster VPN per workload.',
          ],
        },
      ],
    },
    {
      heading: 'And the cost',
      blocks: [
        {
          type: 'paragraph',
          text: 'A mesh adds a sidecar (or a per-node proxy) to every Pod. That is CPU and memory overhead per Pod (typically 20-100 MiB RSS, 50-200m CPU). It adds latency (small, usually < 1ms) and a very large amount of new API surface (CRDs, control-plane components). Incident response times grow — now every connectivity issue has a mesh layer to investigate.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'For a 10-service cluster, a mesh is almost always overkill. For a 200-service cluster with multi-team ownership, rolling your own mTLS and retries is more expensive than adopting a mesh. The inflection point varies; "we need mTLS on every call and we have more than 50 microservices" is a common trigger.',
        },
      ],
    },
  ],
};

const dataPlaneControlPlane: LessonBody = {
  learningObjectives: ['Describe the data plane / control plane split'],
  sections: [
    {
      heading: 'Two separate things, often confused',
      blocks: [
        {
          type: 'paragraph',
          text: 'A mesh has a data plane and a control plane, each with distinct responsibilities.',
        },
        {
          type: 'comparisonTable',
          headers: ['Plane', 'What it is', 'Examples'],
          rows: [
            ['Data plane', 'Proxies that sit on the data path and move bytes', 'Envoy, Linkerd2-proxy, eBPF programs'],
            ['Control plane', 'Issues certs, compiles config, pushes to proxies', 'istiod, Linkerd\'s controller, Cilium Operator'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The data plane is what bears request latency and traffic volume. The control plane is lower-volume (watches API, pushes config) but is what you must upgrade carefully — a bad control-plane version may push config that breaks every proxy at once.',
        },
      ],
    },
    {
      heading: 'The comparison that matters',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Mesh', 'Data plane', 'Signature'],
          rows: [
            ['Istio', 'Envoy sidecars (or ambient waypoint proxies)', 'Most featureful; highest operational complexity'],
            ['Linkerd', 'Linkerd2-proxy (Rust, purpose-built)', 'Smaller, simpler; opinionated defaults'],
            ['Cilium Service Mesh', 'Envoy via eBPF', 'Node-level — no sidecar per Pod, integrates with the CNI'],
            ['Consul Connect', 'Envoy sidecars', 'From HashiCorp; integrates with Consul service discovery'],
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-a-mesh-adds': whatMeshAdds,
    'data-plane-control-plane': dataPlaneControlPlane,
  },
  labs: {},
  simulations: {},
};
