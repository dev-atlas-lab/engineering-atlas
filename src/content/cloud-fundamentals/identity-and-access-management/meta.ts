// Eager metadata for this category's concepts: ids, titles, status, and
// lesson/lab ids, titles, and order. Never import concept content modules
// from here — they load per concept through ../concept-loaders.ts.

import type { ConceptMeta } from '../../types';

export const identityAndAuthentication: ConceptMeta = {
  id: 'identity-and-authentication',
  title: 'Identity and Authentication',
  description:
    'How users, services, and applications prove their identity to access cloud resources.',
  status: 'available',
  learningObjectives: [
    'Trace an access request through its whole lifecycle: identity, authentication, authorization, and audit',
    'Distinguish authentication from authorization, and human identities from workload identities',
    'Explain how identity providers, tokens, multi-factor authentication, and single sign-on fit together',
    'Compare Microsoft Entra ID with AWS IAM and IAM Identity Center',
  ],
  relatedConcepts: ['authorization-and-policies', 'workload-and-federated-identity', 'security-fundamentals'],
  estimatedMinutes: 80,
  lessons: [
    { id: 'iam-fundamentals', title: 'Identity and Access Management Fundamentals', kind: 'concept' },
    { id: 'how-authentication-works', title: 'How Authentication Works: Credentials, MFA, and Tokens', kind: 'concept' },
    { id: 'identity-providers-and-sso', title: 'Identity Providers, Federation, and Single Sign-On', kind: 'concept' },
    { id: 'microsoft-entra-id', title: 'Microsoft Entra ID', kind: 'provider', providerId: 'azure' },
    { id: 'aws-iam-identities', title: 'AWS IAM Identities and IAM Identity Center', kind: 'provider', providerId: 'aws' },
    { id: 'identity-comparison', title: 'Comparison: Entra ID vs. AWS IAM and IAM Identity Center', kind: 'comparison' },
  ],
};

export const authorizationAndPolicies: ConceptMeta = {
  id: 'authorization-and-policies',
  title: 'Authorization and Policies',
  description:
    'Role-based and policy-based access control, and the principle of least privilege that governs how permissions should be scoped.',
  status: 'available',
  learningObjectives: [
    'Explain RBAC, ABAC, identity-based policies, and resource-based policies',
    'Evaluate an access request step by step, including default deny, explicit deny, and permission guardrails',
    'Explain how Azure role assignments inherit down the management group, subscription, resource group, and resource hierarchy',
    'Explain how AWS combines identity policies, resource policies, SCPs, permissions boundaries, and session policies',
    'Design and review permissions for least privilege',
  ],
  prerequisites: ['identity-and-authentication'],
  relatedConcepts: ['identity-and-authentication', 'workload-and-federated-identity', 'security-monitoring-and-compliance'],
  estimatedMinutes: 110,
  lessons: [
    { id: 'authorization-models', title: 'Authorization Models: RBAC, ABAC, and Policies', kind: 'concept' },
    { id: 'how-policy-evaluation-works', title: 'How Policy Evaluation Works', kind: 'concept' },
    { id: 'designing-for-least-privilege', title: 'Designing for Least Privilege', kind: 'concept' },
    { id: 'azure-rbac', title: 'Azure RBAC: Roles, Assignments, and Scopes', kind: 'provider', providerId: 'azure' },
    { id: 'aws-iam-policies', title: 'AWS IAM Policies and Policy Evaluation', kind: 'provider', providerId: 'aws' },
    { id: 'authorization-comparison', title: 'Comparison: Azure RBAC vs. AWS IAM', kind: 'comparison' },
  ],
};

export const workloadAndFederatedIdentity: ConceptMeta = {
  id: 'workload-and-federated-identity',
  title: 'Workload and Federated Identity',
  description:
    'Managed identities, service principals, and workload identity for non-human principals, plus federation and temporary credentials for cross-boundary access.',
  status: 'coming-soon',
};
