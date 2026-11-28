import type { ConceptContentModule, LessonBody } from '../../types';

const canaryMechanics: LessonBody = {
  learningObjectives: [
    'Describe the pod-weight and ingress-weight canary patterns',
    'Explain why ratios depend on the splitting layer',
  ],
  sections: [
    {
      heading: 'Two ways to split traffic',
      blocks: [
        {
          type: 'paragraph',
          text: 'Canary deployments run a small slice of the new version alongside the full old version and shift traffic over time. Plain Kubernetes offers two splitting layers.',
        },
        {
          type: 'comparisonTable',
          headers: ['Layer', 'Mechanism', 'Granularity'],
          rows: [
            ['Service / kube-proxy', 'Both versions share Service labels; Service load-balances by endpoint count', 'Pod-proportional — N v2 Pods out of M+N total Pods = N/(M+N) of traffic'],
            ['Ingress controller', 'Two Services, Ingress annotations set a percentage weight', 'Explicit — set 1%, 5%, 25% weights independently of replica count'],
            ['Service mesh (Istio, Linkerd)', 'VirtualService / TrafficSplit rules', 'Explicit; also supports header-based (route beta testers to v2)'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The Service-level pattern — same labels, different versions — is simple but lossy: you can only pick ratios that match the integer Pod counts. To get 10% canary with Service-level splitting, you need 9 Pods on v1 and 1 Pod on v2, which is nine times more infrastructure than you probably want to pay.',
        },
      ],
    },
  ],
};

const canaryPromotionAndAutomation: LessonBody = {
  learningObjectives: ['Describe promotion, abort, and the metrics checks that drive automation'],
  sections: [
    {
      heading: 'Canary needs a verdict function',
      blocks: [
        {
          type: 'paragraph',
          text: 'The hard part of canary is not splitting traffic — it is deciding whether the canary is healthy. "Did the pipeline succeed" is not an answer: the pipeline succeeds if Pods are Ready. You need an error-rate or latency check comparing v2 to v1 over a measurement window. Argo Rollouts, Flagger, and service meshes provide this as a built-in "analysis" step; without them, canaries are mostly manual.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Deploy canary (1% weight).',
            'Wait a measurement window (10–60 minutes typical).',
            'Compare error rate and latency of v2 versus v1 (e.g. Prometheus queries).',
            'If v2 is as good or better → promote to next stage (5%, 25%, 50%, 100%).',
            'If v2 is worse by a configured margin → abort: delete the canary ReplicaSet.',
            'Promotion = scale v2 up to full, scale v1 down to zero.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Canary without a verdict function is just "I deployed it and hoped for the best." A canary stage that always proceeds after a fixed wait is marginally better than a straight rollout, but not by much — it just gives you a smaller window to notice problems in.',
        },
      ],
    },
    {
      heading: 'Argo Rollouts and Flagger',
      blocks: [
        {
          type: 'paragraph',
          text: 'Argo Rollouts replaces Deployment with its own `kind: Rollout` CRD that supports canary and blue-green natively with declared steps and AnalysisRuns (Prometheus-backed verdicts). Flagger works differently: it drives a progressive delivery by editing a service mesh\'s weights and watching Prometheus. Both are much better defaults for serious canary workflows than hand-rolled Deployment acrobatics.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'canary-mechanics': canaryMechanics,
    'canary-promotion-and-automation': canaryPromotionAndAutomation,
  },
  labs: {},
  simulations: {},
};
