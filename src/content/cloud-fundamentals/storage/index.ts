import type { Category } from '../../types';
import { blockStorage, objectStorage, fileStorage } from './meta';

export const storage: Category = {
  id: 'storage',
  title: 'Storage',
  description:
    'Persistent data storage — block devices for VMs, object stores for unstructured data, and file shares — along with the performance, durability, and lifecycle characteristics that distinguish them.',
  concepts: [blockStorage, objectStorage, fileStorage],
};
