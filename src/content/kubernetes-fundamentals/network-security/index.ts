import type { Category } from '../../types';
import {
  networkPolicy,
  ingressEgressPolicies,
  networkIsolation,
  defaultDeny,
  namespaceSegmentation,
  netpolEnforcementByCni,
} from './meta';

export const networkSecurity: Category = {
  id: 'network-security',
  title: 'Network Security',
  description:
    'Pod-level network filtering with NetworkPolicy — ingress/egress direction, additive selection, default-deny patterns, namespace segmentation, and the CNI\'s enforcement role.',
  concepts: [
    networkPolicy,
    ingressEgressPolicies,
    networkIsolation,
    defaultDeny,
    namespaceSegmentation,
    netpolEnforcementByCni,
  ],
};
