import type { Category } from '../../types';
import {
  podSecurityStandards,
  podSecurityAdmission,
  securityContext,
  linuxCapabilities,
  privilegedContainers,
  seccompAndApparmor,
  secretsSecurity,
  imageSecurity,
} from './meta';

export const workloadSecurity: Category = {
  id: 'workload-security',
  title: 'Workload Security',
  description:
    'Per-workload isolation and hardening — Pod Security Standards and the admission controller that enforces them, security contexts, Linux capabilities and privileged containers, seccomp/AppArmor, Secrets security, and the image supply chain.',
  concepts: [
    podSecurityStandards,
    podSecurityAdmission,
    securityContext,
    linuxCapabilities,
    privilegedContainers,
    seccompAndApparmor,
    secretsSecurity,
    imageSecurity,
  ],
};
