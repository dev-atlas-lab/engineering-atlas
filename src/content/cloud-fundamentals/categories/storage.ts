import type { Category } from '../../types';

export const storage: Category = {
  id: 'storage',
  title: 'Storage',
  description:
    'Persistent data storage — block devices for VMs, object stores for unstructured data, and file shares — along with the performance, durability, and lifecycle characteristics that distinguish them.',
  concepts: [
    {
      id: 'block-storage',
      title: 'Block Storage',
      description:
        'Low-level storage volumes attached to compute instances, including IOPS/throughput characteristics, durability and replication options, and lifecycle management.',
      status: 'coming-soon',
    },
    {
      id: 'object-storage',
      title: 'Object Storage',
      description:
        'Scalable storage for unstructured data accessed via HTTP APIs, organized in buckets, with tiered durability, availability, and lifecycle policies.',
      status: 'coming-soon',
    },
    {
      id: 'file-storage',
      title: 'File Storage',
      description:
        'Managed file systems accessible over standard protocols like NFS and SMB, including backup and recovery patterns.',
      status: 'coming-soon',
    },
  ],
};
