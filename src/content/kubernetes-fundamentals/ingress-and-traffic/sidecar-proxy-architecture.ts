import type { ConceptContentModule, LessonBody } from '../../types';

const howSidecarsIntercept: LessonBody = {
  learningObjectives: [
    'Describe the sidecar injection flow',
    'Explain iptables redirection into the proxy',
  ],
  sections: [
    {
      heading: 'An admission webhook rewrites the Pod',
      blocks: [
        {
          type: 'paragraph',
          text: 'When a Pod is created in a mesh-enabled namespace, a mutating admission webhook rewrites the PodSpec to inject a sidecar container (typically Envoy) and an init container. By the time the kubelet pulls the Pod, it contains the proxy and a setup step.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Init container runs with NET_ADMIN: installs iptables rules that redirect all outbound traffic from the main container into the sidecar on a loopback port, and all inbound traffic from the Pod IP to the sidecar as well.',
            'Main container starts. All its network traffic now transits the sidecar transparently.',
            'Sidecar (Envoy) has been configured by the mesh control plane with routes, upstream clusters, TLS material, policies.',
            'For outbound: sidecar decides target, applies retries/timeouts, originates mTLS, forwards.',
            'For inbound: sidecar terminates mTLS, enforces authorization policies, forwards to the main container.',
          ],
        },
      ],
    },
    {
      heading: 'Why this model',
      blocks: [
        {
          type: 'paragraph',
          text: 'The sidecar co-shares the Pod netns and runs as the same security boundary. The application does not have to know the mesh is there — it still makes plain HTTP requests, which the sidecar intercepts and upgrades to mTLS. This "transparent L7 proxy" is the mesh\'s core trick.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Pod startup now includes init-container setup and sidecar readiness. If your readiness probe depends on the sidecar being healthy (common in Istio), you must set `holdApplicationUntilProxyStarts: true` or the main container may try to make calls before the sidecar is up and iptables will drop them.',
        },
      ],
    },
  ],
};

const beyondSidecars: LessonBody = {
  learningObjectives: ['Compare sidecar to ambient mesh / eBPF approaches'],
  sections: [
    {
      heading: 'The per-Pod proxy is expensive at scale',
      blocks: [
        {
          type: 'paragraph',
          text: 'A thousand Pods means a thousand Envoy processes. Each one holds config for every destination it might call (xDS state), eats CPU and memory, and must be upgraded. Two newer architectures aim to reduce this.',
        },
        {
          type: 'comparisonTable',
          headers: ['Architecture', 'Where the proxy lives', 'Pros', 'Cons'],
          rows: [
            ['Sidecar (classic)', 'One container per Pod', 'Strong per-Pod isolation; portable', 'High resource cost at scale; slow upgrades'],
            ['Ambient mesh (Istio ambient, Linkerd2 "mesh")', 'Per-node L4 proxy + optional per-namespace L7 "waypoint"', 'Opt-in L7 cost; no per-Pod sidecar', 'Newer; different failure modes'],
            ['eBPF mesh (Cilium Service Mesh)', 'In-kernel eBPF programs + per-node Envoy', 'Minimal data-plane overhead; integrates with CNI', 'eBPF debugging is harder'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Ambient / eBPF do not yet replace sidecars for every use case. They work well for L4 mTLS and simple L7 policies but may require sidecars for complex request-level filtering. Evaluate against your actual feature needs, not the hype.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'how-sidecars-intercept': howSidecarsIntercept,
    'beyond-sidecars': beyondSidecars,
  },
  labs: {},
  simulations: {},
};
