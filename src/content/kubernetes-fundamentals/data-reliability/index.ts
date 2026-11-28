import type { Category } from '../../types';
import {
  backupFundamentals,
  snapshotBasedRecovery,
  backupConsistencyModels,
  rpoAndRtoInKubernetes,
  restoreWorkflowsAndVerification,
  kubernetesDisasterRecoveryLimits,
} from './meta';

export const dataReliability: Category = {
  id: 'data-reliability',
  title: 'Data Reliability & Recovery',
  description:
    'Backups vs replication, CSI snapshot workflows, crash- and application-consistent backups, RPO/RTO modeling, restore verification, and cluster DR limits.',
  concepts: [
    backupFundamentals,
    snapshotBasedRecovery,
    backupConsistencyModels,
    rpoAndRtoInKubernetes,
    restoreWorkflowsAndVerification,
    kubernetesDisasterRecoveryLimits,
  ],
};
