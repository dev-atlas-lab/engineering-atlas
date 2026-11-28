import type { ConceptContentModule, LessonBody } from '../../types';

const whyMultiAttachHappens: LessonBody = {
  learningObjectives: ['Explain why Deployment RollingUpdate deadlocks with a ReadWriteOnce PVC'],
  sections: [
    {
      heading: 'Two Pods, two nodes, one exclusive disk',
      blocks: [
        {
          type: 'paragraph',
          text: 'Block storage volumes (EBS, Azure Disk, GCE PD) only attach in `ReadWriteOnce` mode — one node at a time. When you deploy a single-replica Deployment with `strategy.type: RollingUpdate` (and default `maxSurge: 25%`, which rounds up to 1 extra Pod), updating the Deployment creates the **new** Pod before terminating the **old** Pod.',
        },
        {
          type: 'paragraph',
          text: 'If the scheduler places the new Pod onto Node B while the old Pod still runs on Node A with the RWO disk attached, the new Pod blocks in `ContainerCreating` (`Multi-Attach error`), fails readiness, and the rollout stalls indefinitely because `RollingUpdate` waits for the new Pod to become Ready before deleting the old Pod!',
        },
      ],
    },
  ],
};

const resolvingRwoRolloutDeadlocks: LessonBody = {
  learningObjectives: ['Resolve Multi-Attach errors cleanly without corrupting filesystems'],
  sections: [
    {
      heading: 'Three clean architectural fixes',
      blocks: [
        {
          type: 'list',
          items: [
            '**Use `strategy.type: Recreate` on single-replica RWO Deployments:** terminates the old Pod and detaches the volume completely before starting the replacement Pod (accepting brief downtime during rollout).',
            '**Use a StatefulSet if you need multiple replicas:** each ordinal receives its own dedicated RWO PVC rather than competing for one claim.',
            '**Switch to `ReadWriteMany` (NFS/EFS/Azure Files/CephFS):** if the application genuinely needs concurrent multi-node access across rolling Pods.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Never disable Multi-Attach safety checks or force-detach an RWO disk while the old Pod is still writing on Node A — concurrent block writes from two kernels immediately corrupt ext4/xfs metadata.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'multi-attach-kc-1',
      type: 'single-choice',
      prompt: 'A single-replica Deployment mounting an RWO EBS PVC hangs on every `kubectl set image` rollout with `Multi-Attach error for volume ... Volume is already exclusively attached to one node`. What is the cleanest fix?',
      difficulty: 'beginner',
      learningObjective: 'Explain why Deployment RollingUpdate deadlocks with a ReadWriteOnce PVC',
      options: [
        { id: 'a', label: 'Change the Deployment update strategy to `Recreate` (or migrate to a StatefulSet / RWX volume if zero downtime is required)', correct: true, explanation: 'Correct — `Recreate` terminates the old Pod and allows the RWO volume to detach before starting the new Pod.' },
        { id: 'b', label: 'Set `maxSurge: 2` on the RollingUpdate strategy', correct: false, explanation: 'Increasing maxSurge spawns even more competing Pods while the old Pod still holds the disk.' },
        { id: 'c', label: 'Change the PVC accessMode to `ReadWriteOncePod`', correct: false, explanation: 'ReadWriteOncePod is even stricter (one Pod total), so a surge Pod still cannot start concurrently.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'why-multi-attach-happens': whyMultiAttachHappens,
    'resolving-rwo-rollout-deadlocks': resolvingRwoRolloutDeadlocks,
  },
  labs: {},
  simulations: {},
};
