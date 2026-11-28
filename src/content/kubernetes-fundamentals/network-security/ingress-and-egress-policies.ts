import type { ConceptContentModule, LessonBody } from '../../types';

const ingressVsEgress: LessonBody = {
  learningObjectives: [
    'Write ingress and egress rules',
    'Understand why egress policies are much harder to get right',
  ],
  sections: [
    {
      heading: 'Direction is from the selected Pod\'s point of view',
      blocks: [
        {
          type: 'paragraph',
          text: 'Ingress = "who may connect TO the selected Pods." Egress = "where may the selected Pods connect OUT to." The direction is always relative to the selected Pod — a policy selecting the api Pod with an ingress rule from web means "web → api is allowed"; the same traffic from api\'s outbound perspective is not governed by that policy.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `# Egress-only policy — selected Pods may only reach these destinations.
spec:
  podSelector:
    matchLabels: { app: web }
  policyTypes: [Egress]
  egress:
  - to:
    - podSelector: { matchLabels: { app: api } }
    ports: [{ port: 8080, protocol: TCP }]
  # Also allow DNS (otherwise the Pod cannot resolve anything).
  - to:
    - namespaceSelector: {}
      podSelector: { matchLabels: { k8s-app: kube-dns } }
    ports: [{ port: 53, protocol: UDP }]`,
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Forgetting DNS is the #1 egress-policy mistake. Without an explicit allow to kube-dns, the Pod can\'t resolve ANY hostname — including the ones you did allow. Pods appear hung with no obvious error.',
        },
      ],
    },
    {
      heading: 'Ports are a conjunction with peers',
      blocks: [
        {
          type: 'paragraph',
          text: 'A rule can list both `from`/`to` peers and `ports`. The rule matches only when the PEER matches AND the destination port matches. Ports alone (no peer) is a syntax error. To allow "from anywhere on port 80," use an empty peer selector plus a port:',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `ingress:
- from: [{}]              # from anywhere in the cluster
  ports: [{ port: 80 }]`,
        },
      ],
    },
  ],
};

const peerSelectors: LessonBody = {
  learningObjectives: ['Enumerate the three peer selector kinds and their combinations'],
  sections: [
    {
      heading: 'podSelector, namespaceSelector, ipBlock',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Peer', 'Meaning'],
          rows: [
            ['podSelector only', 'Pods in THIS namespace with matching labels'],
            ['namespaceSelector only', 'Any Pod in a namespace with matching labels'],
            ['podSelector + namespaceSelector', 'Pods with matching labels in matching namespaces (intersection)'],
            ['ipBlock', 'An external CIDR (and optional except list) — the only way to express external destinations'],
          ],
        },
        {
          type: 'code',
          language: 'yaml',
          code: `# Allow only specific IPs out (egress to a managed DB).
egress:
- to:
  - ipBlock:
      cidr: 10.100.0.0/24
      except: [10.100.0.5/32]
  ports: [{ port: 5432, protocol: TCP }]`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The peer forms a one-level selector. There is no "AND podSelector OR namespaceSelector" at the rule level. If you want to allow from two unrelated sources, author two separate `from` entries — a list of peers is OR\'d.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'ingress-vs-egress': ingressVsEgress,
    'peer-selectors': peerSelectors,
  },
  labs: {},
  simulations: {},
};
