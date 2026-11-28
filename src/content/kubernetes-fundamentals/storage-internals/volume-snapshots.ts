import type { ConceptContentModule, LessonBody } from '../../types';

const snapshotObjects: LessonBody = {
  learningObjectives: [
    'Describe the VolumeSnapshot, VolumeSnapshotContent, and VolumeSnapshotClass trio',
    'Explain how the CSI snapshot controller and external-snapshotter sidecar interact',
  ],
  sections: [
    {
      heading: 'The snapshot mirror of PVC / PV / StorageClass',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Live storage object', 'Snapshot counterpart', 'Scope'],
          rows: [
            ['PersistentVolumeClaim', 'VolumeSnapshot', 'Namespaced (tenant request for a point-in-time copy)'],
            ['PersistentVolume', 'VolumeSnapshotContent', 'Cluster-scoped (handle to the physical snapshot in storage)'],
            ['StorageClass', 'VolumeSnapshotClass', 'Cluster-scoped (names CSI driver, parameters, deletionPolicy)'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Snapshots are orchestrated by two pieces: a cluster-wide `snapshot-controller` (which binds `VolumeSnapshot` ↔ `VolumeSnapshotContent`) and the CSI driver’s `external-snapshotter` sidecar (which calls CSI `CreateSnapshot` / `DeleteSnapshot`). Snapshot CRDs and the common controller are installed separately from core Kubernetes.',
        },
      ],
    },
  ],
};

const restoreFromSnapshot: LessonBody = {
  learningObjectives: [
    'Restore a new PVC from a VolumeSnapshot using spec.dataSource',
    'Recognize what a CSI VolumeSnapshot does and does not protect against',
  ],
  sections: [
    {
      heading: 'Restoring creates a new PVC',
      blocks: [
        {
          type: 'paragraph',
          text: 'CSI snapshots do not overwrite an existing mounted PVC in place. Instead, you create a new PVC whose `spec.dataSource` references the `VolumeSnapshot` (and request capacity at least as large as `status.restoreSize`).',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-data-restored
spec:
  storageClassName: fast-ssd
  accessModes: [ReadWriteOnce]
  resources:
    requests: { storage: 20Gi }
  dataSource:
    name: db-snap-2026-11-28
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io`,
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A CSI snapshot on a running database is crash-consistent unless you quiesce/freeze writes first — and on many backends the snapshot still lives inside the same region or storage array. For true DR, replicate or export backups off-cluster.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'snapshots-kc-1',
      type: 'single-choice',
      prompt: 'How do you recover data from a `VolumeSnapshot` into a running cluster?',
      difficulty: 'beginner',
      learningObjective: 'Restore a new PVC from a VolumeSnapshot using spec.dataSource',
      options: [
        { id: 'a', label: 'Create a new PVC with `spec.dataSource` pointing to the VolumeSnapshot, then mount that new PVC in a Pod', correct: true, explanation: 'Correct — CSI restores by provisioning a new PV/PVC pre-populated from the snapshot.' },
        { id: 'b', label: 'Patch the existing bound PVC’s `spec.dataSource` while the Pod is mounted', correct: false, explanation: 'spec.dataSource is immutable after PVC creation; Kubernetes does not overwrite live mounted volumes from a snapshot.' },
        { id: 'c', label: 'Change the PV reclaimPolicy to Snapshot', correct: false, explanation: 'Reclaim policies are Retain or Delete; Snapshot is not a reclaimPolicy.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'snapshot-objects': snapshotObjects,
    'restore-from-snapshot': restoreFromSnapshot,
  },
  labs: {},
  simulations: {},
};
