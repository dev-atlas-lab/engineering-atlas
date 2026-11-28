import type { ConceptContentModule, LessonBody } from '../../types';

const vctMechanics: LessonBody = {
  learningObjectives: ['Trace PVC naming and re-attachment across Pod rescheduling'],
  sections: [
    {
      heading: 'Templates stamp out one claim per ordinal',
      blocks: [
        {
          type: 'paragraph',
          text: 'Unlike a Deployment volume reference where every Pod shares the same `claimName`, `volumeClaimTemplates` is a blueprint inside the StatefulSet spec. Before creating `db-2`, the controller checks whether `data-db-2` exists; if not, it creates the PVC from the template and mounts it into `db-2`.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `volumeClaimTemplates:
- metadata:
    name: data
  spec:
    accessModes: ["ReadWriteOnce"]
    storageClassName: fast-ssd
    resources:
      requests:
        storage: 50Gi`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'StatefulSet `spec.volumeClaimTemplates` is immutable on existing StatefulSets. Expanding PVC sizes requires editing the generated PVCs directly (when `allowVolumeExpansion: true` is set on the StorageClass).',
        },
      ],
    },
  ],
};

const pvcRetentionPolicy: LessonBody = {
  learningObjectives: ['Configure persistentVolumeClaimRetentionPolicy intentionally'],
  sections: [
    {
      heading: 'Why PVCs outlive scale-down by default',
      blocks: [
        {
          type: 'paragraph',
          text: 'Historically, StatefulSet never deleted PVCs created from `volumeClaimTemplates` — neither on scale-down nor when the StatefulSet itself was deleted. That protects production databases from accidental `kubectl scale --replicas=0` or `helm uninstall` disasters, at the cost of orphaned PVCs accumulating storage charges.',
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'StatefulSet PVC retention policy (stable in Kubernetes 1.32; beta since 1.27)',
          code: `spec:
  persistentVolumeClaimRetentionPolicy:
    whenDeleted: Retain    # Retain (default) | Delete
    whenScaled: Retain     # Retain (default) | Delete`,
        },
        {
          type: 'list',
          items: [
            '`whenScaled: Retain, whenDeleted: Retain` — safest default for databases; requires explicit operator cleanup.',
            '`whenScaled: Delete` — deletes the ordinal’s PVC when scaled down (useful for ephemeral caches or auto-rebalancing distributed stores like Elasticsearch/Kafka where data has already been drained).',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'vct-kc-1',
      type: 'single-choice',
      prompt: 'You scale a 3-replica StatefulSet down to 1 replica (with default retention policy) and later scale it back up to 3 replicas. What happens to `data-app-1` and `data-app-2`?',
      difficulty: 'beginner',
      learningObjective: 'Configure persistentVolumeClaimRetentionPolicy intentionally',
      options: [
        { id: 'a', label: 'The original PVCs remained retained during scale-down and re-attach to the recreated `app-1` and `app-2` Pods on scale-up', correct: true, explanation: 'Correct — default retention keeps orphaned PVCs on scale-down so scaling back up reconnects existing data (note: clustered apps may still need to catch up stale data!).' },
        { id: 'b', label: 'Both PVCs were deleted immediately during scale-down and fresh empty disks are provisioned', correct: false, explanation: 'Automatic PVC deletion on scale-down only happens if `whenScaled: Delete` is explicitly configured.' },
        { id: 'c', label: 'Their data is automatically merged into `data-app-0`', correct: false, explanation: 'Kubernetes never merges or migrates filesystem contents between PVCs.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'vct-mechanics': vctMechanics,
    'pvc-retention-policy': pvcRetentionPolicy,
  },
  labs: {},
  simulations: {},
};
