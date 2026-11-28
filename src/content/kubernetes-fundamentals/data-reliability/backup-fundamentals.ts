import type { ConceptContentModule, LessonBody } from '../../types';
import { replicationVsBackupScene } from '../storage-scenes';

const whyBackupsMatterInK8s: LessonBody = {
  learningObjectives: ['Distinguish high-availability replication from point-in-time backup'],
  visualization: replicationVsBackupScene,
  sections: [
    {
      heading: 'Replication protects against hardware; backups protect against humans and bugs',
      blocks: [
        {
          type: 'paragraph',
          text: 'A common misconception is "we have three database replicas and RAID/replicated cloud disks, so we do not need backups." Synchronous or asynchronous replication dutifully copies every `DROP TABLE`, bad schema migration, or ransomware write to every replica within milliseconds.',
        },
        {
          type: 'paragraph',
          text: 'A backup is an **isolated, immutable point-in-time copy** stored outside the live write path. Only a backup taken before a destructive change or logical corruption allows you to roll back time.',
        },
      ],
    },
  ],
};

const backupVsReplication: LessonBody = {
  learningObjectives: ['Enumerate the two halves of a Kubernetes backup: API objects and persistent volumes'],
  sections: [
    {
      heading: 'Two halves: Kubernetes state + volume bytes',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Layer', 'What lives there', 'How it is backed up'],
          rows: [
            ['Cluster / Namespace API objects', 'Deployments, StatefulSets, Services, ConfigMaps, Secrets, PVC definitions', 'GitOps source of truth + Velero-style API object export (or etcd snapshot for control-plane recovery)'],
            ['PersistentVolume bytes', 'Database pages, uploaded files, queue logs', 'CSI VolumeSnapshot + off-cluster object-store data mover, or database-native dumps/WAL shipping'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Backing up etcd alone backs up the PVC/PV metadata objects — it NEVER backs up the bytes sitting inside your PersistentVolumes. Restoring etcd without volume backups leaves Pods pointing to missing or stale disks.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'backup-fund-kc-1',
      type: 'single-choice',
      prompt: 'An engineer accidentally runs `DROP TABLE customers;` on a 3-replica PostgreSQL StatefulSet backed by replicated cloud block storage. Why does database replication NOT recover the table?',
      difficulty: 'beginner',
      learningObjective: 'Distinguish high-availability replication from point-in-time backup',
      options: [
        { id: 'a', label: 'Replication propagates the destructive SQL change to all replicas, so every replica loses the table too', correct: true, explanation: 'Correct — replication mirrors live writes (including mistakes); only an independent point-in-time backup predating the drop can restore the data.' },
        { id: 'b', label: 'Kubernetes automatically pauses replication for 24 hours whenever a table is dropped', correct: false, explanation: 'Kubernetes has no visibility into SQL statements executed inside containers.' },
        { id: 'c', label: 'PVC reclaimPolicy: Retain restores deleted SQL tables automatically', correct: false, explanation: 'Retain preserves the volume if the PVC is deleted; it does not undo logical writes inside the filesystem.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'why-backups-matter-in-k8s': whyBackupsMatterInK8s,
    'backup-vs-replication': backupVsReplication,
  },
  labs: {},
  simulations: {},
};
