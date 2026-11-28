import type { Category } from '../../types';
import {
  statefulsetArchitecture,
  stableNetworkIdentity,
  orderedDeploymentAndTermination,
  volumeClaimTemplatesConcept,
  runningDatabasesOnKubernetes,
  statefulsetScalingAndUpdates,
  statefulFailureAndRecovery,
} from './meta';

export const statefulWorkloads: Category = {
  id: 'stateful-workloads',
  title: 'Stateful Workloads',
  description:
    'StatefulSets, stable network identity via Headless Services, ordered lifecycle management, per-replica PVCs, scaling, and split-brain-safe recovery.',
  concepts: [
    statefulsetArchitecture,
    stableNetworkIdentity,
    orderedDeploymentAndTermination,
    volumeClaimTemplatesConcept,
    runningDatabasesOnKubernetes,
    statefulsetScalingAndUpdates,
    statefulFailureAndRecovery,
  ],
};
