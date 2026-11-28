import type { ConceptContentModule, LessonBody } from '../../types';

const agentAndDataplane: LessonBody = {
  learningObjectives: ['Describe the agent/dataplane split and where state lives'],
  sections: [
    {
      heading: 'Three pieces per node',
      blocks: [
        {
          type: 'paragraph',
          text: 'A production CNI is more than a binary the kubelet calls. It is typically a DaemonSet running a node-agent plus a dataplane, plus a small set of cluster-wide controllers.',
        },
        {
          type: 'list',
          items: [
            'Node agent — a long-running process on each node that watches Pod and NetworkPolicy objects via the API Server, compiles them into node-level rules, and manages the local dataplane.',
            'Dataplane — the actual packet forwarding logic. In Calico: iptables or eBPF. In Cilium: eBPF. In Flannel: Linux bridge + VXLAN. In AWS VPC CNI: VPC-native (no overlay).',
            'Controllers — cluster-wide controllers that manage IPAM blocks, BGP peering, routes, or policy aggregation.',
          ],
        },
        {
          type: 'paragraph',
          text: 'The CNI binary the kubelet invokes is a thin shim — in Calico\'s case it is a small Go program that writes a request to a unix socket on the node agent and waits for the result.',
        },
      ],
    },
    {
      heading: 'State and watches',
      blocks: [
        {
          type: 'paragraph',
          text: 'The agent is the live view of what should be configured on this node. It holds watches on Pods (to know which ones live here), NetworkPolicies (to compile allow/deny rules), and often its own CRDs for IPAM blocks or BGP peers. When any of these changes, it reprograms the dataplane.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The agent is the component that has to be upgraded carefully. A version mismatch between the agent and the dataplane (e.g. rolling out an eBPF program incompatible with the agent\'s view) is the main way CNI upgrades cause packet loss.',
        },
      ],
    },
  ],
};

const threeFamilies: LessonBody = {
  learningObjectives: ['Compare Calico, Cilium, and Flannel architecturally'],
  sections: [
    {
      heading: 'Three families',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Plugin', 'Dataplane', 'Policy engine', 'Typical IPAM', 'Signature feature'],
          rows: [
            ['Flannel', 'Linux bridge + VXLAN', 'None (needs an overlay like Calico or none at all)', 'host-local', 'Simplicity — the on-ramp CNI'],
            ['Calico', 'iptables or eBPF; BGP optional', 'Native', 'calico-ipam (IPAM blocks)', 'BGP route distribution — no encap on the right fabric'],
            ['Cilium', 'eBPF everywhere', 'Native, L7-aware', 'Cluster-scope pool or VPC-native', 'eBPF kernel programs replace iptables/kube-proxy'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Flannel is the shortest path to a working cluster. Calico is the long-standing production choice for on-prem and bare metal where BGP is available. Cilium has become the default in newer clusters for eBPF performance and visibility (Hubble, Tetragon).',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The CNI is the hardest component to change post-install. Pick based on your underlay (does it support BGP? run in public cloud?), your scale, and whether you need NetworkPolicy — not on fashion.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'agent-and-dataplane': agentAndDataplane,
    'three-families': threeFamilies,
  },
  labs: {},
  simulations: {},
};
