import type { Category } from '../../types';
import {
  kubernetesAuthentication,
  kubernetesAuthorization,
  rbacArchitecture,
  roleAndClusterRole,
  roleBindingAndClusterRoleBinding,
  serviceAccounts,
  serviceAccountTokenProjection,
  authnAuthzAdmission,
} from './meta';

export const identityAndAccess: Category = {
  id: 'identity-and-access',
  title: 'Identity & Access Management',
  description:
    'Who may do what in the cluster: authentication, authorization, RBAC objects and their composition, ServiceAccounts and token projection, and the three gates every request passes through.',
  concepts: [
    authnAuthzAdmission,
    kubernetesAuthentication,
    kubernetesAuthorization,
    rbacArchitecture,
    roleAndClusterRole,
    roleBindingAndClusterRoleBinding,
    serviceAccounts,
    serviceAccountTokenProjection,
  ],
};
