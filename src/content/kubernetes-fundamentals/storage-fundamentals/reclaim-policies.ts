import type { ConceptContentModule, LessonBody } from '../../types';

const retainVsDelete: LessonBody = {
  learningObjectives: [
    'Distinguish Retain from Delete',
    'Choose a reclaim policy per workload',
  ],
  sections: [
    {
      heading: 'What happens when the PVC is deleted',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Policy', 'When PVC is deleted', 'Backing storage'],
          rows: [
            ['Delete', 'PV is deleted; backing volume is deleted via the CSI driver', 'Gone'],
            ['Retain', 'PV transitions to Released; backing storage is left intact', 'Still there; no claim can bind to it until the admin cleans up'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Dynamically provisioned volumes default to Delete — a convenience but also a sharp edge. Statically provisioned PVs default to Retain, because the admin created the backing storage by hand and does not want Kubernetes to delete it.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'For critical data, override Delete to Retain in the StorageClass (or edit the PV before deleting its PVC). A deleted PVC with policy Delete runs the CSI DeleteVolume call — there is no undo at the Kubernetes level; recovery depends on whether the cloud provider has backups.',
        },
      ],
    },
    {
      heading: 'Choosing between them',
      blocks: [
        {
          type: 'list',
          items: [
            'Delete: ephemeral workloads, test environments, caches. Save on storage cost; accept that deletion is final.',
            'Retain: databases, long-lived data, anything irreplaceable. Clean up explicitly after confirming you no longer need the data.',
            'Changing a PV\'s reclaim policy after creation: `kubectl patch pv <name> -p \'{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}\'`. Takes effect for future deletions; does not affect already-Released PVs.',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'reclaim-kc-1',
      type: 'single-choice',
      prompt: 'A production PostgreSQL PVC was provisioned dynamically with reclaimPolicy: Delete. Before deleting the PVC for a migration, how do you ensure the underlying cloud disk is NOT deleted?',
      difficulty: 'intermediate',
      learningObjective: 'Choose a reclaim policy per workload',
      options: [
        { id: 'a', label: 'Patch the bound PV to persistentVolumeReclaimPolicy: Retain before deleting the PVC', correct: true, explanation: 'Correct — changing the PV reclaim policy to Retain causes PVC deletion to leave the backing storage intact and transition the PV to Released.' },
        { id: 'b', label: 'Edit the StorageClass reclaimPolicy to Retain; existing PVs update automatically', correct: false, explanation: 'StorageClass reclaimPolicy is copied to PVs at creation time only; changing the StorageClass does not retroactively update existing PVs.' },
        { id: 'c', label: 'Set reclaimPolicy: Recycle on the PV so the data stays while resetting the claim', correct: false, explanation: 'Recycle is deprecated/removed for CSI drivers and previously wiped data rather than preserving it.' },
      ],
    },
  ],
};

const recycleHistory: LessonBody = {
  learningObjectives: ['Recognize Recycle as deprecated'],
  sections: [
    {
      heading: 'Recycle was removed',
      blocks: [
        {
          type: 'paragraph',
          text: 'There was a third reclaim policy, `Recycle`, that ran `rm -rf /thevolume/*` when the PVC was deleted, then marked the PV Available for the next claim. It was deprecated in Kubernetes 1.11 and removed from the in-tree hostPath / NFS plugins by 1.29. No CSI driver implements Recycle. Documentation references to it predate its removal.',
        },
        {
          type: 'paragraph',
          text: 'The modern equivalent of "wipe and reuse" is to use dynamic provisioning with Delete, so each claim gets a fresh volume and the old one is explicitly deleted. There is no supported way to "recycle" a PV today.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'If you see Recycle in a tutorial or older YAML, treat it as a signal that the content is stale. Modern clusters reject `persistentVolumeReclaimPolicy: Recycle` on CSI-provisioned PVs.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'retain-vs-delete': retainVsDelete,
    'recycle-history': recycleHistory,
  },
  labs: {},
  simulations: {},
};
