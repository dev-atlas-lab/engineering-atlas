import type { ConceptContentModule, LessonBody } from '../../types';

const qosIsDerived: LessonBody = {
  learningObjectives: [
    'Derive the QoS class from a container spec by hand',
    'Explain why QoS is a computed status, not a chosen field',
  ],
  sections: [
    {
      heading: 'There is no qosClass field you set',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Pod has a `status.qosClass` string set by the API Server when it admits the Pod. It is derived from the values of requests and limits across all containers in the Pod — it is not something the author declares.',
        },
        {
          type: 'comparisonTable',
          headers: ['Class', 'Condition on every container'],
          rows: [
            ['Guaranteed', 'Both CPU and memory have requests equal to limits, and both are set non-zero'],
            ['Burstable', 'At least one container has a request or limit set, but conditions for Guaranteed are not met'],
            ['BestEffort', 'No requests and no limits on any container, for either resource'],
          ],
        },
        {
          type: 'code',
          language: 'yaml',
          code: `# Guaranteed — request == limit for CPU AND memory.
resources:
  requests: { cpu: 1, memory: 512Mi }
  limits:   { cpu: 1, memory: 512Mi }

# Burstable — requests < limits, or only one of the pair set.
resources:
  requests: { cpu: 200m, memory: 256Mi }
  limits:   { cpu: 1,    memory: 1Gi }

# BestEffort — no requests, no limits anywhere.
resources: {}`,
        },
      ],
    },
  ],
};

const qosAndEviction: LessonBody = {
  learningObjectives: ['Describe how QoS affects eviction order and OOM scoring'],
  sections: [
    {
      heading: 'Eviction order under node pressure',
      blocks: [
        {
          type: 'paragraph',
          text: 'When a node approaches a configured threshold (default: memory.available < 100Mi, nodefs.available < 10%), the kubelet begins evicting Pods to recover resources — before the kernel\'s OOM-killer gets involved. The order is deterministic:',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'BestEffort Pods first — they made no promises and reserved nothing.',
            'Burstable Pods exceeding their memory requests — they consumed more than they reserved.',
            'Burstable Pods under their memory requests — reluctantly, if still needed.',
            'Guaranteed Pods — only if the node is still above threshold after all the above.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Within a tier, the kubelet prefers to evict Pods using more memory in absolute terms. An eviction is a Pod deletion, not a container restart — the Pod disappears and must be re-scheduled by its owning controller onto a different node.',
        },
      ],
    },
    {
      heading: 'oom_score_adj',
      blocks: [
        {
          type: 'paragraph',
          text: 'The kubelet writes `oom_score_adj` on every container\'s PID 1 to steer the kernel OOM-killer\'s victim choice when it does run. Guaranteed Pods get -997 (very low; killed last), BestEffort get 1000 (highest; killed first). Burstable Pods get a score in between, scaled by their memory request. This ensures that if the kernel OOM-killer must run, it selects less-important Pods first.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'LimitRange defaulting is the usual answer to "accidental BestEffort." A namespace LimitRange with defaultRequest set guarantees every unqualified Pod gets at least Burstable, improving eviction protection without each team authoring explicit requests.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'qos-kc-1',
      type: 'single-choice',
      prompt: 'A Pod has container A with Guaranteed-shaped requests and limits, and container B with no resources set. What QoS class does the Pod get?',
      difficulty: 'intermediate',
      learningObjective: 'Derive the QoS class from a container spec by hand',
      options: [
        { id: 'a', label: 'BestEffort — all containers must have requests/limits set for Guaranteed, and at least one container has none', correct: false, explanation: 'Not quite: BestEffort requires every container to have no requests/limits. Container A does have them.' },
        { id: 'b', label: 'Burstable — Guaranteed requires all containers to meet the strict condition; mixing kills it', correct: true, explanation: 'Correct. One container short of the Guaranteed condition drops the whole Pod to Burstable.' },
        { id: 'c', label: 'Guaranteed — the class is per-container', correct: false, explanation: 'QoS is a Pod-level classification derived from all containers.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'qos-is-derived': qosIsDerived,
    'qos-and-eviction': qosAndEviction,
  },
  labs: {},
  simulations: {},
};
