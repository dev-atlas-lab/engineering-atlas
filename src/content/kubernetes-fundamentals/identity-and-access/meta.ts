import type { ConceptMeta } from '../../types';

export const kubernetesAuthentication: ConceptMeta = {
  id: 'kubernetes-authentication',
  title: 'Kubernetes Authentication',
  description: 'How the API Server identifies "who is calling": client certs, service account tokens, OIDC, webhook authenticators.',
  status: 'available',
  learningObjectives: [
    'Enumerate the authentication methods the API Server supports',
    'Explain how a certificate CN becomes a user and O becomes a group',
  ],
  prerequisites: ['kubernetes-api-server'],
  relatedConcepts: ['kubernetes-authorization', 'serviceaccounts', 'authn-authz-admission'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'the-authenticators', title: 'The Chain of Authenticators', kind: 'concept' },
    { id: 'tokens-and-certs', title: 'Tokens, Certs, and OIDC', kind: 'concept' },
  ],
};

export const kubernetesAuthorization: ConceptMeta = {
  id: 'kubernetes-authorization',
  title: 'Kubernetes Authorization',
  description: 'The decision step after authentication: is the authenticated subject allowed to do this on this resource? RBAC is one of several authz modes.',
  status: 'available',
  learningObjectives: [
    'Enumerate the authorization modes',
    'Describe why RBAC is default-deny',
  ],
  prerequisites: ['kubernetes-authentication'],
  relatedConcepts: ['rbac-architecture', 'authn-authz-admission'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'authz-modes', title: 'Authorization Modes', kind: 'concept' },
    { id: 'union-of-allows', title: 'Union of Allows, Default Deny', kind: 'concept' },
  ],
};

export const rbacArchitecture: ConceptMeta = {
  id: 'rbac-architecture',
  title: 'RBAC Architecture',
  description: 'Four object kinds that compose to grant API permissions: Role, ClusterRole, RoleBinding, ClusterRoleBinding.',
  status: 'available',
  learningObjectives: [
    'Describe how the four RBAC objects interact',
    'Explain why there are two Role kinds and two Binding kinds',
  ],
  prerequisites: ['kubernetes-authorization'],
  relatedConcepts: ['role-and-clusterrole', 'rolebinding-and-clusterrolebinding'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'four-kinds', title: 'Four Kinds, Two Scopes', kind: 'concept' },
    { id: 'walking-the-binding', title: 'How a Request Is Authorized', kind: 'concept' },
  ],
  labs: [
    { id: 'rbac-permission-simulator', title: 'RBAC Permission Simulator', type: 'simulation' },
  ],
};

export const roleAndClusterRole: ConceptMeta = {
  id: 'role-and-clusterrole',
  title: 'Role and ClusterRole',
  description: 'The permission containers — rules of (apiGroups, resources, verbs). Role is namespaced; ClusterRole is cluster-scoped.',
  status: 'available',
  learningObjectives: [
    'Author Role and ClusterRole with the correct scope',
    'Describe ClusterRole aggregation',
  ],
  prerequisites: ['rbac-architecture'],
  relatedConcepts: ['rbac-architecture', 'rolebinding-and-clusterrolebinding'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'rules-and-verbs', title: 'Rules, Verbs, and Resources', kind: 'concept' },
    { id: 'aggregation', title: 'ClusterRole Aggregation', kind: 'concept' },
  ],
};

export const roleBindingAndClusterRoleBinding: ConceptMeta = {
  id: 'rolebinding-and-clusterrolebinding',
  title: 'RoleBinding and ClusterRoleBinding',
  description: 'Objects that bind a subject (user, group, serviceaccount) to a Role or ClusterRole, granting its permissions.',
  status: 'available',
  learningObjectives: [
    'Decide between RoleBinding and ClusterRoleBinding for a given scope',
    'Describe the subtle case: RoleBinding referring to a ClusterRole',
  ],
  prerequisites: ['role-and-clusterrole'],
  relatedConcepts: ['role-and-clusterrole', 'serviceaccounts'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'binding-forms', title: 'The Four Binding Forms', kind: 'concept' },
  ],
};

export const serviceAccounts: ConceptMeta = {
  id: 'serviceaccounts',
  title: 'ServiceAccounts',
  description: 'The identity for in-cluster workloads. Every Pod has a ServiceAccount; the API Server authenticates it by the mounted token.',
  status: 'available',
  learningObjectives: [
    'Describe what a ServiceAccount is and how a Pod uses one',
    'Author a Pod that uses a specific ServiceAccount',
  ],
  prerequisites: ['kubernetes-authentication'],
  relatedConcepts: ['serviceaccount-token-projection', 'rbac-architecture'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'what-a-sa-is', title: 'The Workload Identity', kind: 'concept' },
    { id: 'default-sa', title: 'The default ServiceAccount Trap', kind: 'concept' },
  ],
};

export const serviceAccountTokenProjection: ConceptMeta = {
  id: 'serviceaccount-token-projection',
  title: 'ServiceAccount Token Projection',
  description: 'How modern Pods receive short-lived, audience-scoped tokens via projected volumes — not forever-valid tokens in a Secret.',
  status: 'available',
  learningObjectives: [
    'Describe projected token volumes (expirationSeconds, audience)',
    'Explain why legacy "token in a Secret" is a security problem',
  ],
  prerequisites: ['serviceaccounts'],
  relatedConcepts: ['serviceaccounts', 'kubernetes-authentication'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'projected-tokens', title: 'Projected, Short-Lived, Audience-Scoped', kind: 'concept' },
  ],
};

export const authnAuthzAdmission: ConceptMeta = {
  id: 'authn-authz-admission',
  title: 'Authentication vs Authorization vs Admission Control',
  description: 'The three ordered gates every API request passes through — distinct responsibilities, distinct failure codes.',
  status: 'available',
  learningObjectives: [
    'Order the three gates and name what each checks',
    'Identify which gate is responsible for a given error',
  ],
  prerequisites: ['kubernetes-authentication', 'kubernetes-authorization'],
  relatedConcepts: ['kubernetes-api-server', 'pod-security-admission'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'three-gates', title: 'Three Gates, Three Jobs', kind: 'concept' },
  ],
};
