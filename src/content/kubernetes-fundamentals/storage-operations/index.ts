import type { Category } from '../../types';
import {
  pvcPendingTroubleshooting,
  volumeAttachAndMountFailures,
  multiAttachAndRwoConstraints,
  nodeFailureAndVolumeRecovery,
  storageCapacityAndDiskPressure,
  storagePerformanceTuning,
  storageObservabilityAndDiagnostics,
} from './meta';

export const storageOperations: Category = {
  id: 'storage-operations',
  title: 'Production Storage Operations',
  description:
    'Day-two storage troubleshooting and reliability engineering: Pending PVCs, FailedAttach/FailedMount, RWO Multi-Attach deadlocks, node failures, DiskPressure, performance, and observability.',
  concepts: [
    pvcPendingTroubleshooting,
    volumeAttachAndMountFailures,
    multiAttachAndRwoConstraints,
    nodeFailureAndVolumeRecovery,
    storageCapacityAndDiskPressure,
    storagePerformanceTuning,
    storageObservabilityAndDiagnostics,
  ],
};
