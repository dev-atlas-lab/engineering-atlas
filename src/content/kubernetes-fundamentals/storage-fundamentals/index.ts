import type { Category } from '../../types';
import {
  containerFilesystem,
  kubernetesVolumes,
  emptyDir,
  hostPath,
  persistentVolumes,
  persistentVolumeClaims,
  storageClassConcept,
  accessModes,
  reclaimPolicies,
  volumeLifecycle,
} from './meta';

export const storageFundamentals: Category = {
  id: 'storage-fundamentals',
  title: 'Storage Fundamentals',
  description:
    'Container filesystems, Pod-scoped volumes, and persistent storage objects — the vocabulary every other storage concept builds on.',
  concepts: [
    containerFilesystem,
    kubernetesVolumes,
    emptyDir,
    hostPath,
    persistentVolumes,
    persistentVolumeClaims,
    storageClassConcept,
    accessModes,
    reclaimPolicies,
    volumeLifecycle,
  ],
};
