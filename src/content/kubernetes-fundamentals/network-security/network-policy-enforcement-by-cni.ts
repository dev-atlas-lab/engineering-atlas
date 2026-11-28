import type { ConceptContentModule, LessonBody } from '../../types';

const whoEnforces: LessonBody = {
  learningObjectives: [
    'Verify that the installed CNI enforces NetworkPolicy',
    'Explain why YAML applying is not evidence of enforcement',
  ],
  sections: [
    {
      heading: 'The API Server is a storage layer for policy',
      blocks: [
        {
          type: 'paragraph',
          text: 'kubectl apply on a NetworkPolicy object always succeeds — the API Server validates the schema and writes it to etcd. Whether that policy actually filters any packets is up to the CNI plugin\'s data plane. Several widely-used CNIs do not implement NetworkPolicy at all; the applied objects become decorative records.',
        },
        {
          type: 'comparisonTable',
          headers: ['CNI', 'NetworkPolicy support'],
          rows: [
            ['Calico', 'Yes — full support, including vendor extensions'],
            ['Cilium', 'Yes — plus CiliumNetworkPolicy with L7 matching'],
            ['Flannel (bare)', 'No — Flannel is dataplane only'],
            ['Flannel + Calico (canal)', 'Yes — Calico\'s policy engine with Flannel\'s dataplane'],
            ['Weave Net', 'Yes'],
            ['AWS VPC CNI', 'No by itself — pairs with Calico or Cilium for policy'],
          ],
        },
      ],
    },
    {
      heading: 'How to verify enforcement',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Apply a deny-all ingress policy to a test namespace.',
            'Deploy two Pods; from one, curl the other\'s IP.',
            'Expected: timeout (policy drops). If the curl succeeds, the CNI is NOT enforcing.',
            'Repeat with an allow policy added; the curl should succeed.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: '"The team applied NetworkPolicies but we got breached laterally" is a specific auditor finding that frequently comes back to this: the policies exist as objects but the CNI isn\'t enforcing. A security review MUST include the deny/allow smoke test, not just a kubectl get.',
        },
      ],
    },
    {
      heading: 'Enforcement model varies',
      blocks: [
        {
          type: 'paragraph',
          text: 'Even among enforcing CNIs, the mechanism differs. Calico in iptables mode compiles policies into iptables rules on each node; in eBPF mode it compiles them into BPF maps. Cilium always uses BPF. Each has different performance characteristics at scale — eBPF typically has lower overhead per-connection and is the direction most vendors have moved.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'who-enforces': whoEnforces,
  },
  labs: {},
  simulations: {},
};
