import type { ConceptMeta } from '../../types';

export const backupFundamentals: ConceptMeta = {
  id: 'backup-fundamentals',
  title: 'Kubernetes Backup Fundamentals',
  description: 'Why Kubernetes backups must capture both cluster manifests/etcd state and PersistentVolume data — and why storage replication is not a backup.',
  status: 'available',
  learningObjectives: [
    'Distinguish high-availability replication from point-in-time backup',
    'Enumerate the two halves of a Kubernetes backup: API objects and persistent volumes',
  ],
  prerequisites: ['persistent-volume-claims', 'etcd'],
  relatedConcepts: ['snapshot-based-recovery', 'rpo-and-rto-in-kubernetes', 'disaster-recovery'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'why-backups-matter-in-k8s', title: 'Replication Mirrors Mistakes; Backups Preserve Time', kind: 'concept' },
    { id: 'backup-vs-replication', title: 'Cluster State vs Volume Data Backups', kind: 'concept' },
  ],
};

export const snapshotBasedRecovery: ConceptMeta = {
  id: 'snapshot-based-recovery',
  title: 'Snapshot-Based Recovery',
  description: 'Orchestrating CSI VolumeSnapshots for fast local recovery, and exporting snapshot data off-cluster when regional durability is required.',
  status: 'available',
  learningObjectives: [
    'Describe when CSI VolumeSnapshots provide fast recovery',
    'Explain why local storage snapshots are not enough for cluster or region loss',
  ],
  prerequisites: ['volume-snapshots', 'backup-fundamentals'],
  relatedConcepts: ['backup-consistency-models', 'restore-workflows-and-verification'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'csi-snapshot-workflows', title: 'CSI Snapshots in Backup Pipelines', kind: 'concept' },
    { id: 'snapshot-limitations', title: 'Locality Limits and Off-Cluster Export', kind: 'concept' },
  ],
};

export const backupConsistencyModels: ConceptMeta = {
  id: 'backup-consistency-models',
  title: 'Backup Consistency Models',
  description: 'Crash-consistent vs application-consistent backups, filesystem freeze hooks, and why live database pages need coordination or WAL archiving.',
  status: 'available',
  learningObjectives: [
    'Distinguish crash-consistent snapshots from application-consistent backups',
    'Design pre/post backup quiescing hooks and WAL-based recovery',
  ],
  prerequisites: ['snapshot-based-recovery'],
  relatedConcepts: ['rpo-and-rto-in-kubernetes', 'running-databases-on-kubernetes'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'crash-vs-application-consistent', title: 'Crash-Consistent vs Application-Consistent', kind: 'concept' },
    { id: 'quiescing-and-hooks', title: 'Quiescing Hooks and WAL Archiving', kind: 'concept' },
  ],
};

export const rpoAndRtoInKubernetes: ConceptMeta = {
  id: 'rpo-and-rto-in-kubernetes',
  title: 'RPO and RTO in Kubernetes',
  description: 'Quantifying tolerable data loss (RPO) and recovery downtime (RTO), and trading off backup frequency, retention depth, and restore speed.',
  status: 'available',
  learningObjectives: [
    'Calculate RPO and RTO from backup cadence, failure time, and restore duration',
    'Tune retention windows to survive delayed detection of silent corruption',
  ],
  prerequisites: ['backup-consistency-models'],
  relatedConcepts: ['restore-workflows-and-verification', 'kubernetes-disaster-recovery-limits'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'measuring-rpo-and-rto', title: 'RPO vs RTO: Data Loss vs Downtime', kind: 'concept' },
    { id: 'designing-backup-schedules', title: 'Retention Windows and Corruption Detection', kind: 'concept' },
  ],
  labs: [
    { id: 'backup-recovery-simulator', title: 'Backup & Recovery Simulator', type: 'simulation' },
  ],
};

export const restoreWorkflowsAndVerification: ConceptMeta = {
  id: 'restore-workflows-and-verification',
  title: 'Restore Workflows and Verification',
  description: 'Restoring into clean namespaces or replacement clusters, handling silent logical corruption, and proving backups actually work before an incident.',
  status: 'available',
  learningObjectives: [
    'Execute an isolated namespace or cluster restore safely',
    'Design automated restore verification tests to catch broken backups early',
  ],
  prerequisites: ['rpo-and-rto-in-kubernetes'],
  relatedConcepts: ['kubernetes-disaster-recovery-limits', 'backup-consistency-models'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'restore-execution-paths', title: 'Namespace, PVC, and Cross-Cluster Restores', kind: 'concept' },
    { id: 'testing-backups-and-corruption', title: 'Verification Drills and Logical Corruption', kind: 'concept' },
  ],
};

export const kubernetesDisasterRecoveryLimits: ConceptMeta = {
  id: 'kubernetes-disaster-recovery-limits',
  title: 'Kubernetes Disaster Recovery Limits',
  description: 'What happens when an entire cluster, control plane, or region disappears — DR tiers, cross-region storage realities, and recovery boundaries.',
  status: 'available',
  learningObjectives: [
    'Compare cold backup-restore, warm standby, and active-active DR tiers for stateful apps',
    'Identify Kubernetes-specific DR constraints around StorageClasses, CSI handles, and etcd',
  ],
  prerequisites: ['restore-workflows-and-verification'],
  relatedConcepts: ['disaster-recovery', 'high-availability'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'cluster-loss-and-dr-tiers', title: 'Recovering From Full Cluster Loss', kind: 'concept' },
    { id: 'multi-region-dr-tradeoffs', title: 'Multi-Region Stateful DR Trade-offs', kind: 'concept' },
  ],
};
