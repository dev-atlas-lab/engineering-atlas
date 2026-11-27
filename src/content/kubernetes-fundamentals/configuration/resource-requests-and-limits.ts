import type { ConceptContentModule, LessonBody } from '../../types';

const requestsAndLimits: LessonBody = {
  learningObjectives: [
    'Distinguish a request (used for scheduling) from a limit (used at runtime)',
    'Describe how they interact with the scheduler',
  ],
  sections: [
    {
      heading: 'Two numbers with different jobs',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every container in a Pod can declare two resource amounts per resource (CPU, memory, ephemeral storage): a request and a limit. They are not the same thing, and treating them as the same causes most of the resource-related problems in production clusters.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'request', 'limit'],
          rows: [
            ['What it means', 'Minimum the container is guaranteed to be able to use', 'Maximum the container is allowed to use'],
            ['Who reads it', 'The scheduler — to decide if the Pod fits on a node', 'The kubelet / container runtime — to throttle or kill at runtime'],
            ['When it is enforced', 'At scheduling time', 'Continuously, while the container runs'],
          ],
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'A container with explicit requests and limits',
          code: `resources:
  requests:
    cpu: "500m"
    memory: "256Mi"
  limits:
    cpu: "1"
    memory: "512Mi"`,
        },
      ],
    },
  ],
};

const whatLimitsFeelLike: LessonBody = {
  learningObjectives: [
    'Describe what happens when a container exceeds its memory limit',
    'Describe what happens when a container exceeds its CPU limit',
  ],
  sections: [
    {
      heading: 'CPU and memory enforce their limits differently',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Resource', 'What happens at the limit'],
          rows: [
            ['CPU', 'The container is throttled. It does not crash — it just gets less CPU time this period. Latency rises; CPU-bound work slows down.'],
            ['Memory', 'The container is OOMKilled by the kernel the moment it tries to allocate past the limit. The container\'s process dies abruptly; the kubelet will usually restart it.'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The asymmetry matters for tuning. Setting a tight CPU limit causes slowness but not crashes. Setting a tight memory limit causes abrupt crashes under load — and once the Pod restarts, it has lost all in-memory state. Memory limits require careful observation of actual working-set size.',
        },
      ],
    },
    {
      heading: 'QoS classes',
      blocks: [
        {
          type: 'paragraph',
          text: 'Based on the requests/limits pattern, Kubernetes assigns a Pod one of three QoS classes. Guaranteed: every container has requests == limits for all resources. Burstable: at least one container has a request, but request != limit somewhere. BestEffort: no requests or limits anywhere. Under memory pressure on a node, the kubelet evicts BestEffort Pods first, Burstable next, Guaranteed last. If you want a workload to survive node-level memory pressure, make it Guaranteed.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'requests-limits-kc-1',
      type: 'single-choice',
      prompt: 'A container requests 100m CPU but consistently uses 1500m. How does the scheduler see it?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish a request (used for scheduling) from a limit (used at runtime)',
      options: [
        { id: 'a', label: 'As a 100m-CPU Pod — the scheduler packs nodes based on requests, so this node is over-committed', correct: true, explanation: 'Correct. This is the classic "requests too low" problem: the scheduler packs nodes as if everyone uses what they ask for, and performance suffers when they don\'t.' },
        { id: 'b', label: 'As a 1500m-CPU Pod — the scheduler measures actual usage', correct: false, explanation: 'The scheduler never measures. It scores based on requests.' },
        { id: 'c', label: 'The Pod cannot be scheduled because the request is less than actual usage', correct: false, explanation: 'There is no such check.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'requests-and-limits': requestsAndLimits,
    'what-limits-feel-like': whatLimitsFeelLike,
  },
  labs: {},
  simulations: {},
};
