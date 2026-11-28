import type { ConceptContentModule, LessonBody } from '../../types';

const fourAccessModes: LessonBody = {
  learningObjectives: [
    'Distinguish the four access modes precisely',
    'Describe the node-level semantics behind each',
  ],
  sections: [
    {
      heading: 'Modes talk about nodes, mostly',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Mode', 'Semantics (node-level)', 'Typical backing'],
          rows: [
            ['ReadWriteOnce (RWO)', 'May be mounted read-write by a single node', 'Cloud block storage: EBS, Azure Disk, GCE PD'],
            ['ReadOnlyMany (ROX)', 'May be mounted read-only by many nodes', 'Read-only NFS, immutable snapshots'],
            ['ReadWriteMany (RWX)', 'May be mounted read-write by many nodes', 'NFS, Ceph RBD-FS, cloud file storage (EFS, Azure Files, Filestore)'],
            ['ReadWriteOncePod (RWOP)', 'May be mounted read-write by a single POD (even on the same node)', 'Any CSI driver that supports it'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Access modes describe what the backing storage can support. Picking a mode does not force a driver to behave differently — it filters which PVs can match which PVCs. If a PV supports both RWO and ROX, a claim requesting either can bind.',
        },
      ],
    },
  ],
};

const rwoPitfalls: LessonBody = {
  learningObjectives: ['Avoid the RWO misconception'],
  sections: [
    {
      heading: 'RWO ≠ "one Pod"',
      blocks: [
        {
          type: 'paragraph',
          text: 'ReadWriteOnce means "one NODE" — not one Pod. Two Pods on the same node can both open a ReadWriteOnce volume read-write simultaneously. This usually does not matter because almost every real workload schedules at most one Pod per node for a given StatefulSet member, but it is a sharp edge.',
        },
        {
          type: 'paragraph',
          text: 'If you truly need "at most one Pod can write to this volume at a time, ever," use ReadWriteOncePod (1.22 beta, 1.29 GA). The attach layer refuses to admit a second Pod that references the same claim.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A corruption scenario: during a rolling update, the old Pod and new Pod can briefly co-exist on the same node, both writing. RWO permits this; RWOP does not. For database Pods in particular, consider RWOP.',
        },
      ],
    },
    {
      heading: 'Other common misunderstandings',
      blocks: [
        {
          type: 'list',
          items: [
            'ReadWriteMany is NOT a Kubernetes feature — it is a storage feature. If the backing store cannot do cross-node writes, declaring RWX does nothing useful. Cloud block storage (EBS, Azure Disk, GCE PD) is RWO only.',
            'A Pod with a ROX mount can co-exist with a Pod on another node with a RWO mount on the same PV — but writes to the RWO mount may not be immediately visible on the ROX side; that\'s backend-dependent.',
            'A multi-attach error (`Multi-Attach error for volume ... Volume is already exclusively attached to one node`) is RWO protection kicking in during Pod rescheduling.',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'am-kc-1',
      type: 'single-choice',
      prompt: 'Two Pods of the same Deployment land on the same node and both reference a PVC with accessMode: ReadWriteOnce. What happens?',
      difficulty: 'intermediate',
      learningObjective: 'Avoid the RWO misconception',
      options: [
        { id: 'a', label: 'Both mount read-write — RWO is node-level, not Pod-level', correct: true, explanation: 'Correct. ReadWriteOncePod is the mode that prevents this.' },
        { id: 'b', label: 'Second Pod fails to mount — only one Pod can use RWO', correct: false, explanation: 'This is the common misconception; RWO is at node granularity.' },
        { id: 'c', label: 'The Pods are rescheduled to different nodes', correct: false, explanation: 'Access mode does not drive scheduling decisions.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'four-access-modes': fourAccessModes,
    'rwo-pitfalls': rwoPitfalls,
  },
  labs: {},
  simulations: {},
};
