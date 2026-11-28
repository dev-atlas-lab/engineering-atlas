import type { ConceptContentModule, LessonBody } from '../../types';

const nodeRpcs: LessonBody = {
  learningObjectives: [
    'Describe NodeStageVolume vs NodePublishVolume',
    'Explain why the node plugin is a DaemonSet',
  ],
  sections: [
    {
      heading: 'Per-node work: stage then publish',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['RPC', 'When called', 'What the driver does'],
          rows: [
            ['NodeStageVolume', 'First time a volume lands on this node', 'Format (if needed); mount to a global staging path /var/lib/kubelet/plugins/.../globalmount'],
            ['NodePublishVolume', 'Each time a Pod on this node starts using the volume', 'Bind-mount staging path into /var/lib/kubelet/pods/<pod>/volumes/.../mount'],
            ['NodeUnpublishVolume', 'Pod that used the volume is deleted', 'Unmount the Pod bind mount'],
            ['NodeUnstageVolume', 'Last Pod on the node using this volume is deleted', 'Unmount the global mount'],
            ['NodeGetVolumeStats', 'kubelet polls for metrics', 'Report used/available bytes and inodes'],
            ['NodeExpandVolume', 'Node side of online expansion', 'Resize the filesystem to use the new block device size'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The stage/publish distinction matters because two Pods on one node sharing the same volume (RWO is node-scoped, after all) use ONE stage and TWO publishes. Staging is expensive (filesystem format, kernel mount); publishing is cheap (bind mount). Separating them means the first Pod pays the stage cost and the second shares it.',
        },
      ],
    },
    {
      heading: 'DaemonSet, privileged',
      blocks: [
        {
          type: 'paragraph',
          text: 'The node plugin runs on every eligible node as a DaemonSet. The container is privileged — it needs to call `mount` / `umount`, access `/var/lib/kubelet`, interact with the host\'s device tree. This is one of a few legitimate uses of `privileged: true`.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A failed node plugin on one node means Pods that need volumes cannot start on that node. The node is still Ready for non-volume Pods but should be cordoned for stateful workloads until the plugin recovers.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'node-rpcs': nodeRpcs,
  },
  labs: {},
  simulations: {},
};
