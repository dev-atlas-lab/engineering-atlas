import type { ConceptContentModule, LessonBody } from '../../types';

const isolationPatterns: LessonBody = {
  learningObjectives: [
    'Apply layered policies for multi-tenant isolation',
    'Allow shared services (DNS, metrics) without breaking isolation',
  ],
  sections: [
    {
      heading: 'Three common patterns',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Pattern', 'Policy shape'],
          rows: [
            ['Namespace isolation', 'Default-deny all ingress and egress in every tenant namespace, plus explicit cross-namespace allows for the expected flows'],
            ['Tenant isolation', 'A tenant has multiple namespaces; policies allow inter-namespace traffic within the tenant but not across tenants. Uses a shared tenant label on namespaces.'],
            ['Shared services', 'kube-dns, Prometheus, logging — selected by a label; every namespace\'s default-deny policy includes an allow to these'],
          ],
        },
        {
          type: 'code',
          language: 'yaml',
          code: `# Boilerplate every tenant namespace gets.
kind: NetworkPolicy
metadata: { name: default-deny-all }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
---
kind: NetworkPolicy
metadata: { name: allow-dns-and-metrics-egress }
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to: [{ namespaceSelector: { matchLabels: { role: shared-services } } }]
    ports:
    - { port: 53, protocol: UDP }   # DNS
    - { port: 9090, protocol: TCP } # Prometheus
  - to: [{ namespaceSelector: { matchLabels: { role: shared-services } } }]
    # also allow Pod-to-Pod TCP to API server via the kubernetes Service
    # (CIDR-based; the kubernetes.default Service's IP is cluster-specific)`,
        },
      ],
    },
    {
      heading: 'Verifying isolation',
      blocks: [
        {
          type: 'list',
          items: [
            'Run a short-lived test Pod in a tenant namespace. `curl` another tenant\'s Pod — expect timeout, not refused.',
            'Timeout = traffic is dropped silently (NetworkPolicy behavior). Refused = destination exists but rejects. These feel similar but mean very different things.',
            'Use `kubectl exec -ti ...  -- traceroute -n <pod-ip>` to see where packets die; a single-hop loss with no response is the signature of policy-dropped traffic.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Policy-driven isolation does not isolate at the API Server. Service accounts in other namespaces can still enumerate your Services via the API — NetworkPolicy only governs runtime traffic between Pods. Full isolation needs RBAC too.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'isolation-patterns': isolationPatterns,
  },
  labs: {},
  simulations: {},
};
