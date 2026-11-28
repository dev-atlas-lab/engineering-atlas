import type { ConceptContentModule, LessonBody } from '../../types';

const kubeletAndCsiMetrics: LessonBody = {
  learningObjectives: ['Select the key kubelet and CSI metrics to alert on in production'],
  sections: [
    {
      heading: 'Catching storage failures before Pods crash',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Metric / Signal', 'Source', 'Alert threshold / meaning'],
          rows: [
            ['`kubelet_volume_stats_available_bytes / capacity_bytes`', 'kubelet', 'Alert at <15% free and <5% critical (prevents silent ENOSPC outages)'],
            ['`kubelet_volume_stats_inodes_free`', 'kubelet', 'Catches inode exhaustion when millions of tiny files fill a volume that still shows free GiB'],
            ['`storage_operation_duration_seconds` / `errors_total`', 'kubelet / controller-manager', 'Detects spiking attach, detach, or mount latency and failing CSI calls'],
            ['`csi_sidecar_operations_seconds`', 'CSI sidecars', 'Isolates slow CreateVolume, ControllerPublishVolume, or CreateSnapshot calls'],
          ],
        },
      ],
    },
  ],
};

const storageIncidentRunbook: LessonBody = {
  learningObjectives: ['Execute a structured incident runbook from symptom to verified fix'],
  sections: [
    {
      heading: 'Layer-by-layer triage checklist',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            '**Claim layer (`kubectl get pvc`, `describe pvc`):** Is the PVC Bound? If Pending, inspect StorageClass, provisioner logs, or Pod scheduling.',
            '**Attachment layer (`kubectl get volumeattachment`, `describe pod`):** Is it stuck on `FailedAttachVolume` or `Multi-Attach`? Check node health and rollout strategy.',
            '**Node mount layer (`describe pod`, CSI node DaemonSet logs):** Is it stuck on `FailedMount`? Check filesystem type, fsck, mount options, and network storage reachability.',
            '**Runtime capacity & I/O layer (kubelet volume stats, `df -ih`, `iostat`):** Check bytes, inodes, node DiskPressure, and cloud IOPS/throughput limits.',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'obs-kc-1',
      type: 'single-choice',
      prompt: 'An application writes millions of tiny session files to a 100 GiB ext4 PVC. `df -h` shows 65 GiB free, yet new file creation fails with `No space left on device`. Which metric catches this before failure?',
      difficulty: 'intermediate',
      learningObjective: 'Select the key kubelet and CSI metrics to alert on in production',
      options: [
        { id: 'a', label: '`kubelet_volume_stats_inodes_free` (inode exhaustion)', correct: true, explanation: 'Correct — ext4 pre-allocates a finite inode table; exhausting inodes produces ENOSPC even with plenty of free bytes.' },
        { id: 'b', label: '`kubelet_volume_stats_capacity_bytes`', correct: false, explanation: 'Total capacity bytes stays constant and says nothing about remaining inodes.' },
        { id: 'c', label: '`apiserver_request_duration_seconds`', correct: false, explanation: 'API Server latency does not track filesystem inode utilization inside worker-node volumes.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'kubelet-and-csi-metrics': kubeletAndCsiMetrics,
    'storage-incident-runbook': storageIncidentRunbook,
  },
  labs: {},
  simulations: {},
};
