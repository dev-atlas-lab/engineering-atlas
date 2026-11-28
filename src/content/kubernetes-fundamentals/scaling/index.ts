import type { Category } from '../../types';
import {
  horizontalPodAutoscaler,
  verticalPodAutoscaler,
  clusterAutoscaler,
  podDisruptionBudget,
  highAvailability,
  replicationAndRecovery,
} from './meta';

export const scaling: Category = {
  id: 'scaling',
  title: 'Scaling & Availability',
  description:
    'Elastic replica count (HPA, VPA), node count (Cluster Autoscaler), and the patterns that keep a workload available across node and zone failures — PodDisruptionBudget, spread, and replication.',
  concepts: [
    horizontalPodAutoscaler,
    verticalPodAutoscaler,
    clusterAutoscaler,
    podDisruptionBudget,
    highAvailability,
    replicationAndRecovery,
  ],
};
