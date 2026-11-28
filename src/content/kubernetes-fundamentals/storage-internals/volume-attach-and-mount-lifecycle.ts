import type { ConceptContentModule, LessonBody } from '../../types';
import { volumeMountLifecycleScene } from '../storage-scenes';

const fourSteps: LessonBody = {
  learningObjectives: [
    'Order the four lifecycle steps: attach, stage, publish, and bind-mount',
    'Distinguish Filesystem vs Block volumeMode mounting behavior',
  ],
  visualization: volumeMountLifecycleScene,
  sections: [
    {
      heading: 'Four distinct handoffs before a container can read a byte',
      blocks: [
        {
          type: 'paragraph',
          text: 'Binding a PVC only creates metadata. Turning a bound PV into a writable path inside a container takes four sequential operations split between the control plane and the target worker node.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Attach (`ControllerPublishVolume`): kube-controller-manager’s attach-detach controller creates a VolumeAttachment; external-attacher tells the CSI controller plugin to attach the disk to the target VM/node.',
            'Stage (`NodeStageVolume`): kubelet asks the node’s CSI node plugin to format the block device (if unformatted, e.g. ext4/xfs) and mount it once to a node-global staging directory.',
            'Publish (`NodePublishVolume`): kubelet asks the CSI node plugin to bind-mount from the global staging directory into the Pod’s per-volume directory on the host.',
            'Container bind-mount: kubelet instructs the container runtime (containerd/CRI-O) to bind-mount that Pod directory into the container’s `volumeMounts[].mountPath`.',
          ],
        },
      ],
    },
    {
      heading: 'Filesystem vs Block volumeMode',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Aspect', 'volumeMode: Filesystem (default)', 'volumeMode: Block'],
          rows: [
            ['Formatting', 'CSI node plugin runs mkfs/fsck during NodeStageVolume', 'No filesystem created; raw block device passed through'],
            ['Container exposure', 'Directory mounted at container `volumeMounts[].mountPath`', 'Block device node mapped via `volumeDevices[].devicePath`'],
            ['Typical users', 'General apps, PostgreSQL, MySQL, config/state', 'Databases managing raw I/O, Ceph OSDs, VM-in-container (KubeVirt)'],
          ],
        },
      ],
    },
  ],
};

const nodeFailureWithVolume: LessonBody = {
  learningObjectives: [
    'Trace what fails at each step and how kubelet/CSI handle node crashes',
  ],
  sections: [
    {
      heading: 'Pinpointing failures by Event reason',
      blocks: [
        {
          type: 'list',
          items: [
            '`FailedAttachVolume` → Step 1 failed (Multi-Attach conflict on an RWO volume, cloud IAM error, or disk detach still pending from a dead node).',
            '`FailedMount` mentioning `fsck` or `mkfs` → Step 2 (NodeStageVolume) failed due to filesystem corruption or invalid `fsType` / `mountOptions`.',
            '`FailedMount` on target path → Step 3 (NodePublishVolume) failed (NFS export unreachable, bad subpath, or SELinux/permission error).',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'For ReadWriteOnce block disks, Kubernetes will not force-detach a VolumeAttachment immediately when a node stops heartbeating without confirmation that the node is truly down, to prevent two writers from corrupting the filesystem.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'attach-mount-kc-1',
      type: 'single-choice',
      prompt: 'A Pod is stuck in ContainerCreating with `FailedMount` reporting `wrong fs type, bad option, bad superblock` while staging `/dev/nvme1n1`. Which CSI operation failed?',
      difficulty: 'intermediate',
      learningObjective: 'Trace what fails at each step and how kubelet/CSI handle node crashes',
      options: [
        { id: 'a', label: 'NodeStageVolume (step 2), where the node plugin formats or mounts the block device onto the node staging path', correct: true, explanation: 'Correct — filesystem creation/checking/mounting of a block device happens during NodeStageVolume on the worker node.' },
        { id: 'b', label: 'ControllerPublishVolume (step 1), which attaches the disk to the cloud VM', correct: false, explanation: 'ControllerPublishVolume attaches the raw disk to the VM; it never mounts filesystems or parses superblocks.' },
        { id: 'c', label: 'CreateVolume in external-provisioner', correct: false, explanation: 'CreateVolume already succeeded earlier when the PV was provisioned.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'four-steps': fourSteps,
    'node-failure-with-volume': nodeFailureWithVolume,
  },
  labs: {},
  simulations: {},
};
