// Eager metadata for this category's concepts: ids, titles, status, and
// lesson/lab ids, titles, and order. Never import concept content modules
// from here — they load per concept through ../concept-loaders.ts.

import type { ConceptMeta } from '../../types';

export const blockStorage: ConceptMeta = {
  id: 'block-storage',
  title: 'Block Storage',
  description:
    'Low-level storage volumes attached to compute instances, including IOPS/throughput characteristics, durability and replication options, and lifecycle management.',
  status: 'available',
  learningObjectives: [
    'Distinguish block, file, and object storage and match workloads to each',
    'Explain how network-attached block volumes work, including their zone scope',
    'Reason about IOPS, throughput, latency, and the limits that cap them',
    'Use snapshots and backups appropriately, and compare Azure Managed Disks with Amazon EBS',
  ],
  prerequisites: ['virtual-machines'],
  relatedConcepts: ['object-storage', 'file-storage', 'virtual-machines', 'regions-and-availability-zones'],
  estimatedMinutes: 75,
  lessons: [
    { id: 'storage-models-block-file-object', title: 'Storage Models: Block, File, and Object', kind: 'concept' },
    { id: 'how-block-storage-works', title: 'How Block Storage Works', kind: 'concept' },
    { id: 'block-storage-performance', title: 'Storage Performance: IOPS, Throughput, and Latency', kind: 'concept' },
    { id: 'snapshots-and-backup', title: 'Snapshots, Backup, and Recovery', kind: 'concept' },
    { id: 'azure-managed-disks', title: 'Azure Managed Disks', kind: 'provider', providerId: 'azure' },
    { id: 'aws-ebs', title: 'Amazon EBS', kind: 'provider', providerId: 'aws' },
    { id: 'block-storage-comparison', title: 'Comparison: Azure Managed Disks vs. Amazon EBS', kind: 'comparison' },
  ],
};

export const objectStorage: ConceptMeta = {
  id: 'object-storage',
  title: 'Object Storage',
  description:
    'Scalable storage for unstructured data accessed via HTTP APIs, organized in buckets, with tiered durability, availability, and lifecycle policies.',
  status: 'available',
  learningObjectives: [
    'Describe the object namespace and trace requests through authorization and storage',
    'Distinguish durability from availability and choose a redundancy strategy',
    'Use access tiers and lifecycle policies to match cost to access patterns',
    'Secure object storage and compare Azure Blob Storage with Amazon S3',
  ],
  prerequisites: ['block-storage'],
  relatedConcepts: ['block-storage', 'file-storage', 'geographic-redundancy-and-data-residency', 'encryption-and-key-management'],
  estimatedMinutes: 80,
  lessons: [
    { id: 'how-object-storage-works', title: 'How Object Storage Works', kind: 'concept' },
    { id: 'durability-availability-and-replication', title: 'Durability, Availability, and Replication', kind: 'concept' },
    { id: 'access-tiers-and-lifecycle', title: 'Access Tiers and Lifecycle Management', kind: 'concept' },
    { id: 'securing-object-storage', title: 'Securing Object Storage', kind: 'concept' },
    { id: 'azure-blob-storage', title: 'Azure Blob Storage', kind: 'provider', providerId: 'azure' },
    { id: 'amazon-s3', title: 'Amazon S3', kind: 'provider', providerId: 'aws' },
    { id: 'object-storage-comparison', title: 'Comparison: Azure Blob Storage vs. Amazon S3', kind: 'comparison' },
  ],
  labs: [
    { id: 'replication-and-durability-lab', title: 'Replication and Durability', type: 'simulation' },
  ],
};

export const fileStorage: ConceptMeta = {
  id: 'file-storage',
  title: 'File Storage',
  description:
    'Managed file systems accessible over standard protocols like NFS and SMB, including backup and recovery patterns.',
  status: 'available',
  learningObjectives: [
    'Explain how managed file shares provide shared access over NFS and SMB',
    'Choose between block, file, and object storage for a workload',
    'Compare Azure Files with Amazon EFS and FSx, including where the mapping is only partial',
  ],
  prerequisites: ['block-storage'],
  relatedConcepts: ['block-storage', 'object-storage', 'virtual-networks'],
  estimatedMinutes: 45,
  lessons: [
    { id: 'how-file-storage-works', title: 'How Managed File Storage Works', kind: 'concept' },
    { id: 'choosing-a-storage-model', title: 'Choosing a Storage Model', kind: 'concept' },
    { id: 'azure-files', title: 'Azure Files', kind: 'provider', providerId: 'azure' },
    { id: 'amazon-efs-and-fsx', title: 'Amazon EFS and Amazon FSx', kind: 'provider', providerId: 'aws' },
    { id: 'file-storage-comparison', title: 'Comparison: Azure Files vs. Amazon EFS', kind: 'comparison' },
  ],
  labs: [
    { id: 'storage-selection-challenge', title: 'Storage Selection Challenge', type: 'challenge' },
  ],
};
