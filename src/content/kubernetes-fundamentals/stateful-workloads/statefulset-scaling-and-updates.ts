import type { ConceptContentModule, LessonBody } from '../../types';

const scalingStatefulClusters: LessonBody = {
  learningObjectives: ['Explain why scaling a StatefulSet down can strand uncleaned PVCs'],
  sections: [
    {
      heading: 'Symmetric ordinals vs asymmetric data',
      blocks: [
        {
          type: 'paragraph',
          text: 'Scaling a StatefulSet up adds ordinals sequentially (`3 → 4 → 5`) and provisions new PVCs. Scaling down terminates the highest ordinals (`5 → 4 → 3`) and leaves their PVCs behind by default. Before scaling down a distributed database, drain shards/data off the highest ordinals first so you do not silently drop quorum or un-replicated partitions.',
        },
      ],
    },
  ],
};

const updateStrategiesAndOndelete: LessonBody = {
  learningObjectives: ['Use spec.updateStrategy.rollingUpdate.partition for staged canary upgrades'],
  sections: [
    {
      heading: 'Reverse-ordinal RollingUpdate, Partition, and OnDelete',
      blocks: [
        {
          type: 'paragraph',
          text: 'StatefulSet `RollingUpdate` replaces Pods in **reverse ordinal order** (`N-1` down to `0`), waiting for each Pod to become Ready before moving to the next. Setting `rollingUpdate.partition: P` updates ONLY Pods whose ordinal is `>= P`, leaving `0..(P-1)` on the old template.',
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'Canary update on db-2 only (in a 3-replica StatefulSet 0, 1, 2)',
          code: `spec:
  replicas: 3
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 2    # Only ordinal >= 2 (db-2) receives the new Pod spec`,
        },
        {
          type: 'list',
          items: [
            'Canary rollout: set `partition: 2` on a 3-replica set, validate `db-2`, then lower `partition` to `0` to finish `db-1` and `db-0`.',
            '`type: OnDelete`: the controller updates NO Pods automatically when the template changes; each Pod upgrades only when an operator or script manually deletes it (useful when primary failover must precede upgrading the primary Pod).',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'sts-update-kc-1',
      type: 'single-choice',
      prompt: 'A StatefulSet `kafka` has `replicas: 4` (`kafka-0`..`kafka-3`) and `updateStrategy.rollingUpdate.partition: 3`. You update the container image tag. Which Pods get updated?',
      difficulty: 'intermediate',
      learningObjective: 'Use spec.updateStrategy.rollingUpdate.partition for staged canary upgrades',
      options: [
        { id: 'a', label: 'Only `kafka-3` (ordinal >= 3) is updated; `kafka-0`, `kafka-1`, and `kafka-2` stay on the old image', correct: true, explanation: 'Correct — partition acts as a floor on the ordinal index; Pods with ordinal >= partition update while lower ordinals remain untouched.' },
        { id: 'b', label: '`kafka-0`, `kafka-1`, and `kafka-2` update while `kafka-3` stays on the old image', correct: false, explanation: 'Partition protects ordinals strictly less than the partition value, not greater than or equal to it.' },
        { id: 'c', label: 'Three Pods are updated in parallel', correct: false, explanation: 'partition is an ordinal threshold, not a concurrency count (unlike maxSurge/maxUnavailable).' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'scaling-stateful-clusters': scalingStatefulClusters,
    'update-strategies-and-ondelete': updateStrategiesAndOndelete,
  },
  labs: {},
  simulations: {},
};
