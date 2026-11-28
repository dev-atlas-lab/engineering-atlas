import type { ConceptContentModule, LessonBody } from '../../types';

const theThreeEffects: LessonBody = {
  learningObjectives: [
    'Distinguish NoSchedule, PreferNoSchedule, and NoExecute',
    'Dedicate nodes to a workload class using taints',
  ],
  sections: [
    {
      heading: 'Taints are the inverse of affinity',
      blocks: [
        {
          type: 'paragraph',
          text: 'Affinity attracts Pods to nodes. Taints repel them. A taint is a triple (key, value, effect) attached to a node; a Pod must carry a matching toleration to be scheduled on (or stay on) that node.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# Taint a node so only GPU workloads with the matching toleration can land there.
$ kubectl taint nodes gpu-node-1 dedicated=gpu:NoSchedule

# A Pod that tolerates it.
tolerations:
- key: "dedicated"
  operator: "Equal"
  value: "gpu"
  effect: "NoSchedule"`,
        },
        {
          type: 'comparisonTable',
          headers: ['Effect', 'At scheduling time', 'During execution'],
          rows: [
            ['NoSchedule', 'Reject this node unless the Pod tolerates the taint', 'Existing Pods are unaffected'],
            ['PreferNoSchedule', 'Penalty in the score phase; use only as a last resort', 'Existing Pods are unaffected'],
            ['NoExecute', 'Reject at scheduling AND evict running Pods that do not tolerate it', 'Pods without toleration are evicted; tolerations can set tolerationSeconds for a grace period'],
          ],
        },
      ],
    },
    {
      heading: 'Operator: Equal vs Exists',
      blocks: [
        {
          type: 'list',
          items: [
            'operator: Equal — the Pod\'s toleration key, value, and effect must match the taint exactly.',
            'operator: Exists — the Pod\'s toleration matches any taint with the given key (value is ignored). Omitting the key entirely with operator: Exists tolerates ALL taints; used in rare system Pods like cluster-essential DaemonSets.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Toleration does not place the Pod on the node — it only permits the scheduler to consider the node. To actually target a tainted node class, combine toleration with nodeSelector or nodeAffinity. Otherwise the Pod is merely eligible to land there, not steered toward it.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'taint-kc-1',
      type: 'single-choice',
      prompt: 'An operator applies dedicated=gpu:NoExecute to an existing node running an untolerated Pod. What happens?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish NoSchedule, PreferNoSchedule, and NoExecute',
      options: [
        { id: 'a', label: 'The Pod is evicted immediately (or after tolerationSeconds if the Pod has a matching toleration with tolerationSeconds)', correct: true, explanation: 'Correct. NoExecute enforces at execution time, not just at scheduling.' },
        { id: 'b', label: 'The Pod stays — taints only affect new placements', correct: false, explanation: 'That is NoSchedule. NoExecute evicts running Pods too.' },
        { id: 'c', label: 'The Pod enters CrashLoopBackOff', correct: false, explanation: 'Eviction is a Pod-level deletion, not a container restart signal.' },
      ],
    },
  ],
};

const automaticTaints: LessonBody = {
  learningObjectives: ['Describe the node-condition taints Kubernetes applies automatically'],
  sections: [
    {
      heading: 'Built-in taints track node conditions',
      blocks: [
        {
          type: 'paragraph',
          text: 'The node controller in kube-controller-manager automatically applies NoExecute taints for abnormal node conditions. These are the mechanism behind "Pods got evicted when my node went down" — it is not a special path, it is a taint + toleration with a timer.',
        },
        {
          type: 'comparisonTable',
          headers: ['Taint', 'Applied when', 'Effect'],
          rows: [
            ['node.kubernetes.io/not-ready', 'Node Ready condition is False', 'NoExecute (and NoSchedule)'],
            ['node.kubernetes.io/unreachable', 'Node Ready condition is Unknown', 'NoExecute'],
            ['node.kubernetes.io/memory-pressure', 'Node is low on memory', 'NoSchedule for BestEffort Pods'],
            ['node.kubernetes.io/disk-pressure', 'Node is low on disk', 'NoSchedule'],
            ['node.kubernetes.io/unschedulable', 'Node is cordoned (unschedulable: true)', 'NoSchedule'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Every Pod is admission-mutated to receive default tolerations for the first two taints with tolerationSeconds=300 (5 minutes). That is where the famous "node goes down, Pods take ~5 minutes to re-schedule elsewhere" number comes from — it is the tolerationSeconds on the auto-added toleration.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Reducing tolerationSeconds moves Pods off a NotReady node faster, at the cost of reacting to brief node blips. For stateless workloads 30–60s is a common tune; for StatefulSets with attached volumes, slower is safer.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-three-effects': theThreeEffects,
    'automatic-taints': automaticTaints,
  },
  labs: {},
  simulations: {},
};
