import type { ConceptContentModule, LessonBody } from '../../types';

const whatKubeProxyDoes: LessonBody = {
  learningObjectives: ['Explain what kube-proxy implements and what it does not'],
  sections: [
    {
      heading: 'kube-proxy programs rules; it does not proxy traffic',
      blocks: [
        {
          type: 'paragraph',
          text: 'The name is misleading. In its common modes (iptables and IPVS), kube-proxy does not sit in the data path and forward packets. It programs kernel-level packet-rewriting rules on the node so that packets destined for a Service\'s ClusterIP are rewritten (DNAT\'d) to a specific backing Pod\'s IP. The actual forwarding happens in the kernel; kube-proxy is just the thing that keeps the rules up to date.',
        },
        {
          type: 'list',
          items: [
            'Watches Services and EndpointSlices via the API Server.',
            'When Services or their Endpoints change, updates iptables or IPVS rules on this node.',
            'Rules translate traffic to ClusterIP:port into traffic to a specific Pod IP:port, picked round-robin by default.',
            'Returns traffic skips kube-proxy entirely — the kernel just reverses the DNAT.',
          ],
        },
      ],
    },
    {
      heading: 'What breaks when kube-proxy is down',
      blocks: [
        {
          type: 'paragraph',
          text: 'If kube-proxy on a node stops, existing Service rules keep working (they are in the kernel, not in the kube-proxy process) but new rules — reflecting Pod churn — stop being written. Services will start sending traffic to Pod IPs that no longer exist. This is a slow degradation, not an instant outage; the node is in a "Service traffic works but may blackhole to dead Pods" state.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Direct Pod-to-Pod traffic (by Pod IP) does not involve kube-proxy and continues working regardless of its state. kube-proxy only matters for Services.',
        },
      ],
    },
  ],
};

const iptablesVsIpvs: LessonBody = {
  learningObjectives: ['Describe how iptables and IPVS modes differ for kube-proxy'],
  sections: [
    {
      heading: 'Two kernel mechanisms, different cost curves',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Mode', 'Rule structure', 'Cost per Service', 'Load balancing'],
          rows: [
            ['iptables', 'Linear chain of rules', 'O(N) — each Service adds rules walked on every packet', 'Random selection weighted by probabilities'],
            ['IPVS', 'In-kernel hash table', 'O(1) — lookups are constant-time', 'Round-robin, least-conn, source-hash, …'],
          ],
        },
        {
          type: 'paragraph',
          text: 'For a few dozen Services the difference is invisible. Above a few thousand Services on a node, iptables rule-set size becomes a measurable problem: both rule-update time and per-packet latency grow. IPVS handles the same scale with constant overhead and offers more load-balancing modes. Most large clusters use IPVS; small clusters default to iptables.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Newer alternatives (Cilium with eBPF) can replace kube-proxy entirely — the rules move to eBPF programs attached to the kernel\'s networking hooks. Functionally equivalent at the Service level, often much faster at scale. The kube-proxy model is the baseline, not the ceiling.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'kube-proxy-role': whatKubeProxyDoes,
    'iptables-vs-ipvs': iptablesVsIpvs,
  },
  labs: {},
  simulations: {},
};
