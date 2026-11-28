import type { ConceptContentModule, LessonBody } from '../../types';

const denyingByDefault: LessonBody = {
  learningObjectives: [
    'Author default-deny-ingress and default-deny-egress policies',
    'Explain the mechanism — an empty allow-list is a deny-all',
  ],
  sections: [
    {
      heading: 'The idiom',
      blocks: [
        {
          type: 'paragraph',
          text: 'A NetworkPolicy selecting all Pods (`podSelector: {}`) with policyTypes but an empty ingress or egress list denies everything in that direction. There is no `deny` field in NetworkPolicy — "empty allow list for a selected Pod" IS the deny.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `kind: NetworkPolicy
metadata: { name: default-deny-all }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
  # no ingress, no egress → deny all in both directions
---
# Then layer explicit allows on top:
kind: NetworkPolicy
metadata: { name: allow-dns-egress }
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to: [{ namespaceSelector: { matchLabels: { role: shared-services } } }]
    ports: [{ port: 53, protocol: UDP }]`,
        },
      ],
    },
  ],
};

const avoidingLockouts: LessonBody = {
  learningObjectives: ['Avoid self-inflicted outages when rolling out default-deny'],
  sections: [
    {
      heading: 'Common lockouts',
      blocks: [
        {
          type: 'list',
          items: [
            'DNS — forgot to allow egress to kube-dns. Pods can\'t resolve anything.',
            'Metrics scraping — Prometheus can\'t scrape the Pod. Metrics gaps start appearing.',
            'Health check probes — the kubelet runs probes from the node IP. Some CNIs auto-allow probes; others require an explicit allow. Verify with an intentionally-failing probe that the policy isn\'t the reason.',
            'API Server access — if the workload talks to kube-apiserver (webhooks, controllers), egress to the kubernetes default Service must be allowed. The Service IP is usually the first IP in the Service CIDR.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Roll out default-deny namespace by namespace, not cluster-wide at once. Watch for probe failures and timeouts in the first 10 minutes. Have a rollback ready — `kubectl delete netpol default-deny-all -n <ns>` restores allow-all behavior instantly.',
        },
      ],
    },
    {
      heading: 'A tested default-deny baseline',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          code: `# Namespace-level: deny everything, allow DNS, allow intra-namespace,
# allow ingress from the ingress controller namespace.
---
kind: NetworkPolicy
metadata: { name: default-deny }
spec: { podSelector: {}, policyTypes: [Ingress, Egress] }
---
kind: NetworkPolicy
metadata: { name: allow-dns-egress }
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to: [{ namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } } }]
    ports: [{ port: 53, protocol: UDP }]
---
kind: NetworkPolicy
metadata: { name: allow-same-namespace }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
  ingress: [{ from: [{ podSelector: {} }] }]
  egress:  [{ to:   [{ podSelector: {} }] }]
---
kind: NetworkPolicy
metadata: { name: allow-ingress-from-controller }
spec:
  podSelector: {}
  policyTypes: [Ingress]
  ingress:
  - from: [{ namespaceSelector: { matchLabels: { name: ingress-nginx } } }]`,
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'denying-by-default': denyingByDefault,
    'avoiding-lockouts': avoidingLockouts,
  },
  labs: {},
  simulations: {},
};
