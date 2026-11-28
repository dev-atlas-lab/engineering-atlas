import type { Category } from '../../types';
import {
  csi,
  csiArchitecture,
  csiControllerPlugin,
  csiNodePlugin,
  volumeProvisioning,
  staticProvisioning,
  dynamicProvisioning,
  immediateBinding,
  waitForFirstConsumer,
  volumeAttachMount,
  volumeExpansion,
  volumeSnapshots,
} from './meta';

export const storageInternals: Category = {
  id: 'storage-internals',
  title: 'Storage Internals',
  description:
    'How Kubernetes actually talks to storage: the CSI spec and its deployment pattern, provisioning modes, the attach/mount lifecycle, expansion, and snapshots.',
  concepts: [
    csi,
    csiArchitecture,
    csiControllerPlugin,
    csiNodePlugin,
    volumeProvisioning,
    staticProvisioning,
    dynamicProvisioning,
    immediateBinding,
    waitForFirstConsumer,
    volumeAttachMount,
    volumeExpansion,
    volumeSnapshots,
  ],
};
