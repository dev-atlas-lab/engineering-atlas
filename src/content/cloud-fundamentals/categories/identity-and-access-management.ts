import type { Category } from '../../types';

export const identityAndAccessManagement: Category = {
  id: 'identity-and-access-management',
  title: 'Identity and Access Management',
  description: 'Authentication, authorization, and access control for cloud resources.',
  concepts: [
    {
      id: 'identity-and-authentication',
      title: 'Identity and Authentication',
      description:
        'How users, services, and applications prove their identity to access cloud resources.',
      status: 'coming-soon',
    },
    {
      id: 'authorization-and-policies',
      title: 'Authorization and Policies',
      description:
        'Role-based and policy-based access control, and the principle of least privilege that governs how permissions should be scoped.',
      status: 'coming-soon',
    },
    {
      id: 'workload-and-federated-identity',
      title: 'Workload and Federated Identity',
      description:
        'Managed identities, service principals, and workload identity for non-human principals, plus federation and temporary credentials for cross-boundary access.',
      status: 'coming-soon',
    },
  ],
};
