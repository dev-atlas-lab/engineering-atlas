import type { ConceptContentModule, LessonBody } from '../../types';
import { storageFailureRecoveryScene } from '../storage-scenes';

const ungracefulNodeShutdown: LessonBody = {
  learningObjectives: ['Trace attach-detach behavior when a node stops heartbeating'],
  visualization: storageFailureRecoveryScene,
  sections: [
    {
      heading: 'Why Kubernetes waits before force-detaching',
      blocks: [
        {
          type: 'paragraph',
          text: 'When a worker node loses power abruptly or suffers a kernel panic, kubelet never sends a graceful shutdown signal. The node becomes `Ready=Unknown`. Even after the node controller marks Pods for eviction, the attach-detach controller refuses to force-detach RWO volumes immediately unless it knows the volume is unmounted (after a conservative timeout, typically ~6 minutes, or only after Pod deletion).',
        },
        {
          type: 'paragraph',
          text: 'Worse, for StatefulSet Pods or Volumes stuck with `VolumeAttachment` objects referencing the dead node, workloads stay blocked until an operator or node-health controller confirms the node is genuinely powered off.',
        },
      ],
    },
  ],
};

const nonGracefulNodeShutdownTaint: LessonBody = {
  learningObjectives: ['Use the out-of-service taint safely to recover workloads after confirmed node failure'],
  sections: [
    {
      heading: 'Non-Graceful Node Shutdown (`out-of-service` taint)',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes (GA in 1.28+) provides a supported recovery path once you verify via the cloud/hypervisor that a failed node is powered off or fenced:',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# 1. FIRST confirm node-4 is powered off / fenced in your cloud or BMC!
# 2. Apply the out-of-service taint:
kubectl taint nodes node-4 node.kubernetes.io/out-of-service=nodeshutdown:NoExecute

# Controllers immediately force-delete terminating Pods without waiting
# and detach VolumeAttachments so RWO volumes can re-attach elsewhere.

# 3. Once node-4 is repaired or replaced, remove the taint (if reusing node name):
kubectl taint nodes node-4 node.kubernetes.io/out-of-service-`,
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Never apply `node.kubernetes.io/out-of-service` while the node is merely experiencing a temporary API-server network blip and still running containers — doing so risks dual-mounting RWO volumes.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'node-rec-kc-1',
      type: 'single-choice',
      prompt: 'After confirming in AWS EC2 that `node-4` is permanently terminated (powered off), Pods from a StatefulSet remain stuck in `Terminating` with RWO EBS volumes still attached in `VolumeAttachment`. Which supported Kubernetes mechanism clears both the stuck Pods and their VolumeAttachments safely?',
      difficulty: 'advanced',
      learningObjective: 'Use the out-of-service taint safely to recover workloads after confirmed node failure',
      options: [
        { id: 'a', label: 'Apply `node.kubernetes.io/out-of-service=nodeshutdown:NoExecute` to `node-4`', correct: true, explanation: 'Correct — the Non-Graceful Node Shutdown taint signals the Pod GC and attach-detach controllers to force-clean Pods and detach VolumeAttachments on a confirmed-down node.' },
        { id: 'b', label: 'Delete the StorageClass used by those PVCs', correct: false, explanation: 'Deleting a StorageClass does not detach existing PVs or clean up VolumeAttachments.' },
        { id: 'c', label: 'Restart CoreDNS in kube-system', correct: false, explanation: 'CoreDNS has no involvement in VolumeAttachment lifecycle or node shutdown cleanup.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'ungraceful-node-shutdown': ungracefulNodeShutdown,
    'non-graceful-node-shutdown-taint': nonGracefulNodeShutdownTaint,
  },
  labs: {},
  simulations: {},
};
