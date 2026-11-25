import type { Category } from '../../types';
import { identityAndAuthentication, authorizationAndPolicies, workloadAndFederatedIdentity } from './meta';

export const identityAndAccessManagement: Category = {
  id: 'identity-and-access-management',
  title: 'Identity and Access Management',
  description: 'Authentication, authorization, and access control for cloud resources.',
  concepts: [identityAndAuthentication, authorizationAndPolicies, workloadAndFederatedIdentity],
};
