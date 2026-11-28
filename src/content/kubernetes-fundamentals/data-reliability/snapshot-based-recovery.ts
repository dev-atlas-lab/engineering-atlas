import type { ConceptContentModule, LessonBody } from '../../types';

const csiSnapshotWorkflows: LessonBody = {
  learningObjectives: ['Describe when CSI VolumeSnapshots provide fast recovery'],
  sections: [
    {
      heading: 'Incremental block snapshots for rapid rollback',
      blocks: [
        {
          type: 'paragraph',
          text: 'CSI `VolumeSnapshot` leverages the underlying storage backend (such as EBS Snapshots, Azure Disk Snapshots, or Ceph RBD snapshots) to capture incremental block-level copies. Restoring a multi-hundred-GiB volume from a snapshot is far faster than streaming a logical `pg_dump` over the network.',
        },
        {
          type: 'list',
          items: [
            'Good for rapid pre-migration checkpoints and fast in-region rollback.',
            'Pair with `VolumeSnapshotClass` `deletionPolicy: Retain` on backup-critical snapshots so deleting a namespace does not delete the `VolumeSnapshotContent` in the cloud backend.',
          ],
        },
      ],
    },
  ],
};

const snapshotLimitations: LessonBody = {
  learningObjectives: ['Explain why local storage snapshots are not enough for cluster or region loss'],
  sections: [
    {
      heading: 'Why in-cluster snapshots are only half a backup',
      blocks: [
        {
          type: 'list',
          items: [
            'Backend & region coupling: a Ceph/Longhorn snapshot stored on the same cluster’s nodes dies with the cluster; a cloud disk snapshot lives in one cloud account/region unless explicitly copied.',
            'Blast radius: shared cloud credentials or compromised admin access can delete both live volumes and snapshots in the same account.',
            'Off-cluster data movers (Velero + Kopia/Restic, Kasten, CloudNativePG Barman): read snapshot/PVC data, deduplicate, encrypt, and ship it to immutable cross-region object storage (e.g., Object Lock / WORM buckets).',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'For true 3-2-1 durability, treat CSI snapshots as Tier 1 (fast local restore) and off-cluster encrypted object-storage backups as Tier 2 (catastrophic/ransomware/account-loss recovery).',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'snap-rec-kc-1',
      type: 'single-choice',
      prompt: 'Your team stores PostgreSQL on local Ceph/Rook cluster volumes and takes hourly CSI VolumeSnapshots inside the same Ceph pool. Which failure scenario are you STILL unprotected against?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why local storage snapshots are not enough for cluster or region loss',
      options: [
        { id: 'a', label: 'A cluster-wide storage pool outage, datacenter failure, or destructive cluster deletion that wipes the underlying Ceph cluster', correct: true, explanation: 'Correct — snapshots living inside the same storage pool share the failure domain of that cluster; off-cluster export is required.' },
        { id: 'b', label: 'An accidental table drop while the Ceph cluster stays healthy', correct: false, explanation: 'In-pool snapshots can restore a pre-drop PVC when the cluster itself is healthy.' },
        { id: 'c', label: 'A single Pod crash on a healthy node', correct: false, explanation: 'A single Pod crash does not even require snapshot restore; the PV re-attaches.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'csi-snapshot-workflows': csiSnapshotWorkflows,
    'snapshot-limitations': snapshotLimitations,
  },
  labs: {},
  simulations: {},
};
