import type { ConceptContentModule, LessonBody } from '../../types';

const howExpansionWorks: LessonBody = {
  learningObjectives: [
    'Enable and execute PVC volume expansion via allowVolumeExpansion',
    'Distinguish backend volume resize from filesystem resize and recognize expansion limits',
  ],
  sections: [
    {
      heading: 'Two phases: backend disk resize, then filesystem resize',
      blocks: [
        {
          type: 'paragraph',
          text: 'Growing a PersistentVolumeClaim requires `allowVolumeExpansion: true` on its StorageClass. When you increase `spec.resources.requests.storage` on the PVC, external-resizer and kubelet coordinate a two-step resize.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Controller resize (`ControllerExpandVolume`): external-resizer calls the CSI controller plugin to grow the backing cloud/SAN disk to the new size and updates `pv.spec.capacity`.',
            'PVC condition `FileSystemResizePending`: if the volume is `volumeMode: Filesystem`, the disk is larger now, but the ext4/xfs filesystem inside it still has the old size.',
            'Node resize (`NodeExpandVolume`): kubelet (or the CSI node plugin) runs `resize2fs` / `xfs_growfs`. Drivers supporting online expansion do this while the Pod keeps running; older or offline-only drivers require restarting the Pod so `NodeExpandVolume` runs on mount.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          code: `# Request an increase from 20Gi to 50Gi (StorageClass must have allowVolumeExpansion: true)
kubectl patch pvc db-data -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'
kubectl get pvc db-data -w`,
        },
      ],
    },
    {
      heading: 'Hard limitations to plan around',
      blocks: [
        {
          type: 'list',
          items: [
            'Shrinking is NOT supported: Kubernetes rejects decreasing `spec.resources.requests.storage` on an existing PVC.',
            'Disk full blocks resize metadata or app recovery: if a volume hits 100% full before you expand, apps may still crash until space is freed or the filesystem resize completes; some filesystems need tiny free blocks or an unmounted fsck first.',
            'Cloud provider cooldowns: e.g. AWS EBS enforces a modification cooldown (typically 6 hours) between successive volume modifications.',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'expansion-kc-1',
      type: 'single-choice',
      prompt: 'After increasing a PVC from 20Gi to 50Gi, `kubectl get pv` shows 50Gi, but `df -h` inside the Pod still shows 20G and the PVC has condition `FileSystemResizePending`. What does this mean?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish backend volume resize from filesystem resize and recognize expansion limits',
      options: [
        { id: 'a', label: 'ControllerExpandVolume grew the backing disk, and Kubernetes is waiting for NodeExpandVolume (on the Pod’s node) to grow the filesystem', correct: true, explanation: 'Correct — FileSystemResizePending means the block device is already 50Gi and NodeExpandVolume still needs to run (often triggered automatically or on Pod restart if online resize is unsupported).' },
        { id: 'b', label: 'The StorageClass has allowVolumeExpansion: false so the backend call was ignored', correct: false, explanation: 'If allowVolumeExpansion were false, the API Server would have rejected the PVC patch at admission time.' },
        { id: 'c', label: 'Kubernetes is shrinking the volume back to 20Gi', correct: false, explanation: 'Kubernetes never shrinks PVCs.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'how-expansion-works': howExpansionWorks,
  },
  labs: {},
  simulations: {},
};
