import type { ConceptContentModule, LessonBody } from '../../types';

const ephemeralStorageEviction: LessonBody = {
  learningObjectives: ['Prevent ephemeral-storage evictions with requests, limits, and emptyDir.sizeLimit'],
  sections: [
    {
      heading: 'How one noisy Pod can evict neighbors on the same node',
      blocks: [
        {
          type: 'paragraph',
          text: 'Container writable layers, container logs, and disk-backed `emptyDir` volumes all share the node’s root/kubelet filesystem. When node free disk drops below kubelet’s `evictionHard` threshold (e.g. `nodefs.available<10%`), kubelet sets `DiskPressure=True` and evicts Pods starting with those exceeding `ephemeral-storage` requests.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `resources:
  requests:
    ephemeral-storage: 1Gi
  limits:
    ephemeral-storage: 2Gi
volumes:
- name: tmp-cache
  emptyDir:
    sizeLimit: 1Gi`,
        },
      ],
    },
  ],
};

const pvcFullAndExpansionRunbook: LessonBody = {
  learningObjectives: ['Execute an online or offline recovery runbook when a PVC hits 100% usage'],
  sections: [
    {
      heading: 'When a PersistentVolume fills to 100%',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Verify whether the StorageClass supports `allowVolumeExpansion: true`.',
            'Patch `pvc.spec.resources.requests.storage` upward (remembering cloud modification cooldowns like EBS’s 6-hour limit!).',
            'Wait for `FileSystemResizePending` to clear; if the CSI driver needs a Pod restart for `NodeExpandVolume` or the filesystem has 0 free blocks for journal recovery, briefly free temporary files (e.g. old logs/temp files) or restart the Pod after controller resize.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Never wait until 99% full to trigger expansion on EBS/cloud disks — if you already expanded within the last 6 hours, a second resize request will be rate-limited while the database halts on `ENOSPC`.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'cap-press-kc-1',
      type: 'single-choice',
      prompt: 'Several unrelated Pods on `node-3` are abruptly `Evicted` with message `The node was low on resource: ephemeral-storage`. What is the most common cause?',
      difficulty: 'beginner',
      learningObjective: 'Prevent ephemeral-storage evictions with requests, limits, and emptyDir.sizeLimit',
      options: [
        { id: 'a', label: 'Unbounded writes to container rootfs, logs, or an `emptyDir` without `sizeLimit` filled the node’s local disk and triggered kubelet DiskPressure eviction', correct: true, explanation: 'Correct — container rootfs, logs, and disk emptyDir share node ephemeral storage; exceeding thresholds triggers DiskPressure eviction.' },
        { id: 'b', label: 'A StatefulSet PVC reached 100% capacity on an external EBS disk', correct: false, explanation: 'Filling an external network PV affects writes inside that PV; it does not exhaust the worker node’s local ephemeral-storage pool.' },
        { id: 'c', label: 'The cluster ran out of ClusterIP addresses', correct: false, explanation: 'Service CIDR exhaustion affects Service creation, not node DiskPressure.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'ephemeral-storage-eviction': ephemeralStorageEviction,
    'pvc-full-and-expansion-runbook': pvcFullAndExpansionRunbook,
  },
  labs: {},
  simulations: {},
};
