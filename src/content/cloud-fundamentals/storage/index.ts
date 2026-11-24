import type { Category } from '../../types';
import { blockStorage } from './block-storage';
import { objectStorage } from './object-storage';
import { fileStorage } from './file-storage';

export const storage: Category = {
  id: 'storage',
  title: 'Storage',
  description:
    'Persistent data storage — block devices for VMs, object stores for unstructured data, and file shares — along with the performance, durability, and lifecycle characteristics that distinguish them.',
  concepts: [blockStorage, objectStorage, fileStorage],
};
