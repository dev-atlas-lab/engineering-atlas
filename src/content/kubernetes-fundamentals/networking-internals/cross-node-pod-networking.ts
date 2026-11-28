import type { ConceptContentModule, LessonBody } from '../../types';
import { crossNodePodScene } from '../security-scenes';

const crossNodePath: LessonBody = {
  learningObjectives: [
    'Trace cross-node Pod traffic under overlay and under native routing',
    'Explain what the underlay sees in each case',
  ],
  sections: [
    {
      heading: 'The decision point is at the host',
      blocks: [
        {
          type: 'paragraph',
          text: 'Up to the node\'s bridge/host stack, the cross-node path is the same as same-node: Pod → veth → bridge. At that point the kernel looks up the route to the destination Pod IP. Where that route points is what differs between CNI dataplanes.',
        },
        {
          type: 'list',
          items: [
            'Overlay (VXLAN/Geneve): the route for the remote Pod CIDR points at a local tunnel device (e.g. flannel.1). The kernel wraps the packet in UDP and sends it with outer source=local node IP, dest=remote node IP.',
            'Native routing (BGP): the route for the remote Pod CIDR points at the remote node IP directly, with no encapsulation. The underlay routers (or the node\'s own route table) must know how to reach that Pod CIDR.',
            'VPC-native: in managed Kubernetes, the Pod IP is a real VPC IP. Routing is just normal VPC routing; the CNI\'s job is only to coordinate with the cloud API for IP allocation.',
          ],
        },
      ],
    },
    {
      heading: 'What the underlay sees',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Mode', 'Outer source', 'Outer dest', 'Inner Pod packet'],
          rows: [
            ['VXLAN overlay', 'node IP', 'node IP', 'Encapsulated inside UDP/VXLAN'],
            ['Native routing', 'Pod IP', 'Pod IP', 'Visible to the underlay'],
            ['IPsec overlay (Cilium, Calico option)', 'node IP', 'node IP', 'Encrypted + encapsulated'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The underlay only has to route node IPs in overlay mode — it never sees Pod addresses. That is the main reason VXLAN is the default in heterogeneous environments: it works regardless of what the underlay knows about Pod CIDRs.',
        },
      ],
    },
  ],
  visualization: crossNodePodScene,
};

const whereItBreaks: LessonBody = {
  learningObjectives: ['Identify where cross-node communication typically breaks'],
  sections: [
    {
      heading: 'Four common failures',
      blocks: [
        {
          type: 'list',
          items: [
            'MTU mismatch — VXLAN adds 50 bytes; if the underlay MTU is 1500 and Pods also set MTU 1500, large packets fragment or get dropped. Set Pod MTU to 1450 for VXLAN underlays, 1370 for IPsec.',
            'BGP peering down — a node without a working BGP session no longer has routes to other Pod CIDRs. All cross-node traffic to or from that node fails. `calicoctl node status` on Calico, Cilium BGP status on Cilium.',
            'Security group / firewall blocks VXLAN UDP 4789 — the overlay is dropped at the underlay. Pods can reach the control plane but not each other.',
            'kube-proxy rules not programmed — a node that boots without kube-proxy running will have Pods that work, but Services will not. Verify kube-proxy DaemonSet is Ready on every node.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The symptom "Pods on node A can reach API server but not other Pods" is almost always a CNI issue, not a general networking issue. The API Server is reachable via node IP, which uses the underlay directly — no CNI involvement.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'cross-node-path': crossNodePath,
    'where-it-breaks': whereItBreaks,
  },
  labs: {},
  simulations: {},
};
