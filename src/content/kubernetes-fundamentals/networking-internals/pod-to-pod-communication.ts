import type { ConceptContentModule, LessonBody } from '../../types';

const sameNodePath: LessonBody = {
  learningObjectives: [
    'Trace a same-node Pod-to-Pod packet hop by hop',
    'Describe the role of veth pairs and the CNI bridge',
  ],
  sections: [
    {
      heading: 'The six hops',
      blocks: [
        {
          type: 'paragraph',
          text: 'Two Pods on the same node send traffic to each other without ever leaving the host network stack. The path has fewer hops than cross-node, and does not depend on which CNI you use beyond the choice of a bridge, routing, or veth-to-veth model.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'App in Pod A writes to a socket. The kernel packet exits via eth0 in the Pod netns.',
            'eth0 in the Pod netns is one end of a veth pair. The packet appears on the other end — which lives in the host netns.',
            'The host-side veth is attached to the node\'s CNI bridge (cni0 in Flannel, calico-managed or BPF on others).',
            'The bridge looks at the destination MAC/IP. The other Pod\'s host-side veth is on the same bridge.',
            'The packet is forwarded directly to Pod B\'s host-side veth.',
            'It appears inside Pod B\'s netns on its eth0.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          code: `# Inspecting the wiring on a node (requires nsenter or crictl)
$ ip link
cni0: <BROADCAST,MULTICAST,UP,LOWER_UP>
vetha1b2c3@if4: <...>  # host end of pod A's veth
vethd4e5f6@if5: <...>  # host end of pod B's veth

$ bridge link
vetha1b2c3 state forwarding priority 32 cost 100
vethd4e5f6 state forwarding priority 32 cost 100`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Same-node traffic doesn\'t traverse IP routing — the bridge is L2. This makes it fast: ~15 Gb/s on a single core is typical. Cross-node adds encap/decap or routing hops.',
        },
      ],
    },
    {
      heading: 'What NetworkPolicy adds',
      blocks: [
        {
          type: 'paragraph',
          text: 'With a CNI that enforces NetworkPolicy, the same-node path includes a policy decision on the bridge or, with eBPF, on the veth itself. The decision happens in iptables rules (FORWARD chain) or BPF maps and is invisible to the application beyond the "connection refused" signal if the policy denies.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-same-node-path': sameNodePath,
  },
  labs: {},
  simulations: {},
};
