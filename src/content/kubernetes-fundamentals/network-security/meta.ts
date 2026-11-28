import type { ConceptMeta } from '../../types';

export const networkPolicy: ConceptMeta = {
  id: 'kubernetes-networkpolicy',
  title: 'Kubernetes NetworkPolicy',
  description: 'A namespaced, label-selected policy object that restricts Pod traffic. Selected Pods go from "allow everything" to "only what policies allow."',
  status: 'available',
  learningObjectives: [
    'Describe the structure of a NetworkPolicy object',
    'Explain how podSelector picks the affected Pods',
    'Describe additive policy semantics',
  ],
  prerequisites: ['service', 'pod-networking'],
  relatedConcepts: ['ingress-and-egress-policies', 'network-isolation', 'default-deny-policies'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'what-a-netpol-is', title: 'What a NetworkPolicy Is', kind: 'concept' },
    { id: 'additive-semantics', title: 'Additive Semantics and Selection', kind: 'concept' },
  ],
  labs: [
    { id: 'networkpolicy-simulator', title: 'NetworkPolicy Simulator', type: 'simulation' },
  ],
};

export const ingressEgressPolicies: ConceptMeta = {
  id: 'ingress-and-egress-policies',
  title: 'Ingress and Egress Policies',
  description: 'The two directions a NetworkPolicy may filter, plus the full peer-selection vocabulary (podSelector, namespaceSelector, ipBlock).',
  status: 'available',
  learningObjectives: [
    'Write ingress and egress rules with each peer kind',
    'Describe the port+peer conjunction semantics',
  ],
  prerequisites: ['kubernetes-networkpolicy'],
  relatedConcepts: ['kubernetes-networkpolicy', 'default-deny-policies'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'ingress-vs-egress', title: 'Ingress vs Egress', kind: 'concept' },
    { id: 'peer-selectors', title: 'podSelector, namespaceSelector, ipBlock', kind: 'concept' },
  ],
};

export const networkIsolation: ConceptMeta = {
  id: 'kubernetes-network-isolation',
  title: 'Network Isolation',
  description: 'Patterns for isolating workloads at the network layer — tenant isolation, environment separation, shared-services patterns.',
  status: 'available',
  learningObjectives: [
    'Apply layered policies for multi-tenant isolation',
    'Allow shared infrastructure (DNS, monitoring) while enforcing isolation',
  ],
  prerequisites: ['ingress-and-egress-policies'],
  relatedConcepts: ['default-deny-policies', 'namespace-network-segmentation'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'isolation-patterns', title: 'Isolation Patterns', kind: 'concept' },
  ],
};

export const defaultDeny: ConceptMeta = {
  id: 'default-deny-policies',
  title: 'Default Deny Policies',
  description: 'The idiom that flips Kubernetes from allow-all to deny-all, so explicit allow rules become the only way traffic flows.',
  status: 'available',
  learningObjectives: [
    'Author default-deny-ingress and default-deny-egress policies',
    'Pair default-deny with specific allow rules without lock-outs',
  ],
  prerequisites: ['kubernetes-networkpolicy'],
  relatedConcepts: ['kubernetes-networkpolicy', 'network-policy-enforcement-by-cni'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'denying-by-default', title: 'How Default-Deny Works', kind: 'concept' },
    { id: 'avoiding-lockouts', title: 'Avoiding Self-Inflicted Lockouts', kind: 'concept' },
  ],
};

export const namespaceSegmentation: ConceptMeta = {
  id: 'namespace-network-segmentation',
  title: 'Namespace Network Segmentation',
  description: 'Using namespaceSelector and namespace labels to enforce cross-namespace boundaries.',
  status: 'available',
  learningObjectives: [
    'Label namespaces consistently so policies can select them',
    'Author cross-namespace allow rules with namespaceSelector',
  ],
  prerequisites: ['ingress-and-egress-policies', 'namespaces'],
  relatedConcepts: ['network-isolation', 'namespaces'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'labels-on-namespaces', title: 'Namespace Labels Are the Lever', kind: 'concept' },
  ],
};

export const netpolEnforcementByCni: ConceptMeta = {
  id: 'network-policy-enforcement-by-cni',
  title: 'Network Policy Enforcement by CNI',
  description: 'The API Server stores NetworkPolicy objects regardless of enforcement; it is the CNI that actually filters packets. Mismatch is a frequent silent failure.',
  status: 'available',
  learningObjectives: [
    'Verify that the installed CNI enforces NetworkPolicy',
    'Explain why YAML applying is not evidence of enforcement',
  ],
  prerequisites: ['container-network-interface', 'kubernetes-networkpolicy'],
  relatedConcepts: ['cni-plugin-architecture', 'kubernetes-networkpolicy'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'who-enforces', title: 'The CNI Enforces, Not the API Server', kind: 'concept' },
  ],
};
