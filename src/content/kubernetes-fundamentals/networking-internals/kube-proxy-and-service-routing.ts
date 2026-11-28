import type { ConceptContentModule, LessonBody } from '../../types';
import { serviceRoutingScene } from '../security-scenes';

const kubeProxyDoesNotProxy: LessonBody = {
  learningObjectives: [
    'Describe what kube-proxy actually does (and doesn\'t) in its default modes',
    'Distinguish the "proxy" in the name from the historical userspace mode',
  ],
  sections: [
    {
      heading: 'The name is a historical misnomer',
      blocks: [
        {
          type: 'paragraph',
          text: 'kube-proxy\'s first release (pre-1.2) was a userspace proxy — a Go process that accepted connections on the ClusterIP and forwarded them to a Pod. The latency and context-switching cost of userspace proxying was prohibitive, so the project moved to kernel-mode implementations:',
        },
        {
          type: 'list',
          items: [
            'iptables mode (default since 1.2): kube-proxy programs netfilter rules that DNAT ClusterIP packets to Pod IPs. The kernel forwards; kube-proxy is not in the data path.',
            'IPVS mode: kube-proxy programs an in-kernel load balancer table. Same no-data-path property.',
            'nftables mode (beta): the successor to iptables, using the newer nftables backend.',
            'eBPF (via Cilium or kube-proxy-replacement): kube-proxy is removed entirely; eBPF programs on each network device handle Service DNAT.',
          ],
        },
        {
          type: 'paragraph',
          text: 'In every modern mode, kube-proxy watches the API Server (Services and EndpointSlices), compiles the current state into kernel rules, and goes back to sleep. Packets flow directly in the kernel from caller to chosen Pod.',
        },
      ],
    },
  ],
  visualization: serviceRoutingScene,
};

const serviceDnatTrace: LessonBody = {
  learningObjectives: ['Trace a Service → Pod DNAT in iptables mode'],
  sections: [
    {
      heading: 'What the rules look like',
      blocks: [
        {
          type: 'paragraph',
          text: 'For a Service web with ClusterIP 10.96.3.42:80 backed by three Pods, kube-proxy writes something like this (simplified):',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# PREROUTING chain: match ClusterIP, send to the service chain.
-A KUBE-SERVICES -d 10.96.3.42/32 -p tcp -m tcp --dport 80 -j KUBE-SVC-WEB

# Service chain: picks one endpoint at random.
-A KUBE-SVC-WEB -m statistic --mode random --probability 0.33333333349 -j KUBE-SEP-POD1
-A KUBE-SVC-WEB -m statistic --mode random --probability 0.50000000000 -j KUBE-SEP-POD2
-A KUBE-SVC-WEB -j KUBE-SEP-POD3

# Endpoint chain: actual DNAT to the Pod IP.
-A KUBE-SEP-POD1 -p tcp -m tcp -j DNAT --to-destination 10.244.1.7:8080`,
        },
        {
          type: 'paragraph',
          text: 'The three probabilities (1/3, 1/2, 1/1) combine to give each endpoint an equal 33% chance. This is why rebalancing happens probabilistically on every packet — a Service with 3 backends truly round-robins.',
        },
        {
          type: 'list',
          items: [
            'Not-Ready Pods are never in the rules — the EndpointSlice excludes them.',
            'Session affinity (`spec.sessionAffinity: ClientIP`) uses the recent conntrack entries table instead of the random-probability branch.',
            'externalTrafficPolicy: Local on a NodePort/LoadBalancer Service restricts DNAT targets to Pods on the receiving node — no second hop, but uneven load.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Why packets don\'t return via kube-proxy on the way back: conntrack. When the kernel sees the forward DNAT, it records the mapping. The reply packet (Pod → caller) is rewritten by conntrack with the original ClusterIP as source, invisible to the application.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'kube-proxy-does-not-proxy': kubeProxyDoesNotProxy,
    'service-dnat-trace': serviceDnatTrace,
  },
  labs: {},
  simulations: {},
};
