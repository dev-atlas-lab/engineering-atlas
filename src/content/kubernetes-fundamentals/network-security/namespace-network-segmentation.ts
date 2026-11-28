import type { ConceptContentModule, LessonBody } from '../../types';

const labelsOnNamespaces: LessonBody = {
  learningObjectives: [
    'Label namespaces consistently so policies can select them',
    'Author cross-namespace allow rules with namespaceSelector',
  ],
  sections: [
    {
      heading: 'namespaceSelector matches namespace labels',
      blocks: [
        {
          type: 'paragraph',
          text: 'NetworkPolicy\'s namespaceSelector selects namespaces by label, exactly like podSelector selects Pods. For namespaceSelector to be useful, your namespaces must carry labels that describe their role.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# Label namespaces with their role.
kubectl label ns payments-prod tier=prod env=prod team=payments
kubectl label ns payments-stg  tier=stg  env=nonprod team=payments
kubectl label ns shared-obs    role=shared-services env=prod`,
        },
        {
          type: 'paragraph',
          text: 'Kubernetes auto-adds `kubernetes.io/metadata.name=<ns>` on every namespace (since 1.21). That gives you a name-based selector without extra labels — useful for referencing specific namespaces like kube-system.',
        },
      ],
    },
    {
      heading: 'Cross-namespace allow pattern',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          code: `# In payments-prod: allow ingress from everything labelled role=shared-services.
kind: NetworkPolicy
spec:
  podSelector: {}
  policyTypes: [Ingress]
  ingress:
  - from:
    - namespaceSelector: { matchLabels: { role: shared-services } }`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'namespaceSelector: {} (empty selector) means "any namespace," including kube-system. Narrow it with a specific label or the matchExpressions operator when you mean something more specific.',
        },
      ],
    },
    {
      heading: 'Combining namespaceSelector and podSelector',
      blocks: [
        {
          type: 'paragraph',
          text: 'Specify both in the same peer entry: the match is the intersection. "Pods labelled app=web in namespaces labelled tier=frontend" — a single peer entry with both selectors. Putting them in separate list entries produces the union.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'labels-on-namespaces': labelsOnNamespaces,
  },
  labs: {},
  simulations: {},
};
