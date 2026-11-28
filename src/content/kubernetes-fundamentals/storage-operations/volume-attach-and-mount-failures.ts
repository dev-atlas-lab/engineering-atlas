import type { ConceptContentModule, LessonBody } from '../../types';

const diagnosingFailedAttach: LessonBody = {
  learningObjectives: ['Distinguish FailedAttachVolume from FailedMount in Pod Events'],
  sections: [
    {
      heading: 'Control-plane attachment failures',
      blocks: [
        {
          type: 'paragraph',
          text: '`FailedAttachVolume` occurs before the worker node even touches the disk. The attach-detach controller or `external-attacher` calls CSI `ControllerPublishVolume` and fails.',
        },
        {
          type: 'list',
          items: [
            '**Multi-Attach error:** volume is ReadWriteOnce and still attached to another node.',
            '**Cloud API / IAM error:** controller lacks `ec2:AttachVolume` or Azure Disk attach permissions.',
            '**Per-node disk limit exceeded:** cloud VMs cap how many EBS/Azure disks can attach to one instance (for example 28 or 39 attachments including root/ENI limits).',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          code: `kubectl get volumeattachment
kubectl describe volumeattachment <va-name>
kubectl logs -n kube-system deploy/ebs-csi-controller -c csi-attacher`,
        },
      ],
    },
  ],
};

const diagnosingFailedMount: LessonBody = {
  learningObjectives: ['Inspect CSI controller vs CSI node DaemonSet logs based on failure layer'],
  sections: [
    {
      heading: 'Node-plane stage and publish failures',
      blocks: [
        {
          type: 'paragraph',
          text: '`FailedMount` means the volume attached (or requires no attach, like NFS), and either `kubelet` or the **CSI node plugin DaemonSet** on that specific node failed during `NodeStageVolume` or `NodePublishVolume`.',
        },
        {
          type: 'list',
          items: [
            'Inspect the CSI node Pod running **on the Pod’s scheduled node**, not the controller Deployment.',
            'Common causes: wrong `fsType` or unsupported `mountOptions`, corrupt ext4 superblock requiring `fsck`, unreachable NFS server / blocked TCP port 2049, or `fsGroup` recursive `chown` timeouts on millions of files (mitigate with `fsGroupChangePolicy: OnRootMismatch`).',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'attach-fail-kc-1',
      type: 'single-choice',
      prompt: 'A Pod scheduled on `node-7` fails with `FailedMount: MountVolume.SetUp failed ... mount failed: exit status 32` on an NFS-backed PVC. Where should you look first for detailed mount errors?',
      difficulty: 'intermediate',
      learningObjective: 'Inspect CSI controller vs CSI node DaemonSet logs based on failure layer',
      options: [
        { id: 'a', label: 'The CSI node DaemonSet Pod (and kubelet logs) on `node-7`, plus network reachability from `node-7` to the NFS server', correct: true, explanation: 'Correct — FailedMount executes on the target worker node inside kubelet and the CSI node plugin DaemonSet.' },
        { id: 'b', label: 'kube-scheduler logs', correct: false, explanation: 'The Pod is already scheduled onto `node-7`; scheduling completed before mounting began.' },
        { id: 'c', label: 'external-provisioner logs', correct: false, explanation: 'Provisioning creates the PV; mounting an already-bound PV happens via kubelet and the node plugin.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'diagnosing-failed-attach': diagnosingFailedAttach,
    'diagnosing-failed-mount': diagnosingFailedMount,
  },
  labs: {},
  simulations: {},
};
