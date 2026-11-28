import type { Category } from '../../types';
import {
  podLifecyclePhases,
  containerLifecycle,
  containerRestartPolicies,
  livenessProbes,
  readinessProbes,
  startupProbes,
  podTermination,
} from './meta';

export const podLifecycle: Category = {
  id: 'pod-lifecycle',
  title: 'Pod Lifecycle & Health Management',
  description:
    'Operations-level Pod behavior: the phases a Pod moves through, the container lifecycle inside it, the three probe kinds the kubelet runs, restart policies, and graceful termination.',
  concepts: [
    podLifecyclePhases,
    containerLifecycle,
    containerRestartPolicies,
    livenessProbes,
    readinessProbes,
    startupProbes,
    podTermination,
  ],
};
