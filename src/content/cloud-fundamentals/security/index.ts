import type { Category } from '../../types';
import { securityFundamentals, encryptionAndKeyManagement, networkSecurity, securityMonitoringAndCompliance } from './meta';

export const security: Category = {
  id: 'security',
  title: 'Security',
  description:
    'Protecting data and network traffic — defense in depth, encryption, key and secrets management, network-level controls, and security monitoring.',
  concepts: [securityFundamentals, encryptionAndKeyManagement, networkSecurity, securityMonitoringAndCompliance],
};
