import type { ConceptContentModule, LessonBody } from '../../types';

const atMostOneSemantics: LessonBody = {
  learningObjectives: ['Explain why StatefulSet enforces at-most-one semantics per ordinal'],
  sections: [
    {
      heading: 'Why Kubernetes refuses to replace an unreachable Pod',
      blocks: [
        {
          type: 'paragraph',
          text: 'In a Deployment, if a worker node loses network contact with the control plane, the ReplicaSet controller creates a replacement Pod on a healthy node once the node taint triggers eviction — briefly tolerating two copies of the app running at once. For a StatefulSet, running two `db-0` Pods simultaneously while both write to replicated state or a shared volume causes **split-brain corruption**.',
        },
        {
          type: 'paragraph',
          text: 'Therefore, StatefulSet enforces **at-most-one semantics**: when a node becomes `Unknown`, the node lifecycle controller marks `db-0` as `Terminating` (with a deletion timestamp), and the StatefulSet controller waits indefinitely for the kubelet on that node to confirm `db-0` actually exited before creating a new `db-0`.',
        },
      ],
    },
  ],
};

const stuckTerminatingStatefulPods: LessonBody = {
  learningObjectives: ['Diagnose and safely recover a StatefulSet Pod stuck in Terminating on a dead node'],
  sections: [
    {
      heading: 'Never force-delete blindly',
      blocks: [
        {
          type: 'paragraph',
          text: 'Running `kubectl delete pod db-0 --force --grace-period=0` deletes the Pod object from etcd without waiting for kubelet confirmation. If the old node was merely partitioned (not powered off), the old `db-0` process is STILL running and writing while a brand-new `db-0` starts elsewhere — guaranteeing data corruption or Multi-Attach errors on RWO disks.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Confirm the old node is truly dead, fenced, or powered off in your cloud/hypervisor control plane.',
            'Verify whether `VolumeAttachment` objects for that node are still blocking RWO disk reattachment.',
            'Prefer Kubernetes Non-Graceful Node Shutdown (`node.kubernetes.io/out-of-service=nodeshutdown:NoExecute`) so controllers safely clean up both Pods and VolumeAttachments.',
            'Only force-delete the Pod after confirming the old container cannot possibly still be running.',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'sts-fail-kc-1',
      type: 'single-choice',
      prompt: 'Node-2 loses network connectivity to the API Server. `db-1` on Node-2 enters `Terminating` and stays there, preventing `db-1` from starting on a healthy node. Why should you NOT immediately run `kubectl delete pod db-1 --force --grace-period=0` before checking Node-2?',
      difficulty: 'advanced',
      learningObjective: 'Diagnose and safely recover a StatefulSet Pod stuck in Terminating on a dead node',
      options: [
        { id: 'a', label: 'Node-2 might still be running the old `db-1` container across a network partition, causing split-brain or RWO disk corruption if a second `db-1` starts', correct: true, explanation: 'Correct — force-deleting removes only the API object; if the old node is still alive, two `db-1` instances would violate at-most-one semantics.' },
        { id: 'b', label: 'Force-deleting a StatefulSet Pod automatically deletes its PVC as well', correct: false, explanation: 'Force-deleting a Pod does not delete its PVC, though the orphaned VolumeAttachment can still block reattachment.' },
        { id: 'c', label: 'Force-deleting resets all other StatefulSet ordinals back to 0', correct: false, explanation: 'Other ordinals keep their identities; the danger is running two instances of `db-1` simultaneously.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'at-most-one-semantics': atMostOneSemantics,
    'stuck-terminating-stateful-pods': stuckTerminatingStatefulPods,
  },
  labs: {},
  simulations: {},
};
