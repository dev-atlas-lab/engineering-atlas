import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { hpaScalingScene } from '../operations-scenes';
import { hpaScalingSimulation } from '../operations-simulations';
import { renderHpaState } from '../operations-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const hpaAlgorithm: LessonBody = {
  learningObjectives: [
    'State the HPA desired-replicas formula',
    'Explain why the HPA edits spec.replicas on the Deployment',
  ],
  sections: [
    {
      heading: 'desiredReplicas = ceil(currentReplicas × currentMetric / targetMetric)',
      blocks: [
        {
          type: 'paragraph',
          text: 'Once per reconcile period (default 15s), the HPA controller: reads the metric across the workload\'s Pods; computes the formula above; clamps to [minReplicas, maxReplicas]; applies stabilization rules; and if the result differs from the current spec.replicas, edits the target\'s spec.replicas via the API Server. The actual Pod creation is done by the Deployment/ReplicaSet controller — the HPA does not create Pods itself.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: web }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: web }
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target: { type: Utilization, averageUtilization: 70 }`,
        },
        {
          type: 'list',
          items: [
            'Utilization is per-Pod CPU use as a percentage of the CPU REQUEST (not the limit). A target of 70 means "scale so that the average Pod uses 70% of its request."',
            'AverageValue is an absolute per-Pod number — e.g. 100 requests-per-second per Pod.',
            'Multiple metrics can be configured; the HPA computes a desired count for each and picks the highest — "scale to whichever signal demands the most."',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Utilization against CPU request means the request must be set — if you have no CPU request, Utilization has no denominator and the metric is unavailable. The HPA falls back to leaving replicas unchanged and emits an event.',
        },
      ],
    },
  ],
  visualization: hpaScalingScene,
};

const metricsSources: LessonBody = {
  learningObjectives: ['Choose the right metrics API for the signal you want to scale on'],
  sections: [
    {
      heading: 'Three APIs behind one HPA',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['API', 'Server', 'Use for'],
          rows: [
            ['metrics.k8s.io (resource metrics)', 'Metrics Server (an in-cluster component)', 'CPU and memory utilization'],
            ['custom.metrics.k8s.io', 'Adapter (e.g. prometheus-adapter)', 'Any Pod-level metric you emit (requests/s, queue depth)'],
            ['external.metrics.k8s.io', 'Adapter', 'Signals outside the cluster — SQS depth, CloudWatch metric'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The HPA controller does not care which API serves the metric; it just reads the requested metric. Which adapter you deploy determines what you can scale on.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'For a REST service, scaling on requests-per-second via a Prometheus-backed custom metric usually tracks saturation better than CPU utilization. CPU is a lagging indicator: by the time utilization climbs, latency has already slipped.',
        },
      ],
    },
  ],
};

const stabilizationAndBehavior: LessonBody = {
  learningObjectives: ['Configure the behavior block to shape scale-up and scale-down rates'],
  sections: [
    {
      heading: 'behavior: fine-grained speed control',
      blocks: [
        {
          type: 'paragraph',
          text: 'Since autoscaling/v2, the `behavior` field on the HPA lets you tune scale-up and scale-down independently. Each side has a stabilization window (minimum time before applying a direction) and policies (per-period caps).',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `behavior:
  scaleDown:
    stabilizationWindowSeconds: 300    # don't act on scale-down recommendations younger than 5m
    policies:
    - type: Percent
      value: 10
      periodSeconds: 60
    - type: Pods
      value: 2
      periodSeconds: 60
    selectPolicy: Min                   # pick the slowest (most conservative) policy
  scaleUp:
    stabilizationWindowSeconds: 0
    policies:
    - type: Percent
      value: 100
      periodSeconds: 15                 # can double every 15s
    selectPolicy: Max                   # pick the fastest policy`,
        },
        {
          type: 'list',
          items: [
            'Scale-down defaults to a 300s stabilization window — the HPA tracks all recommendations in that window and uses the HIGHEST. This absorbs brief dips.',
            'Scale-up defaults to 0s stabilization and a 100%/15s policy — it reacts fast.',
            'Policies cap how much you may scale per period; selectPolicy picks between them (Min for safety, Max for aggression).',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'hpa-kc-1',
      type: 'single-choice',
      prompt: 'Current replicas = 4; currentUtilization = 90%; targetUtilization = 60%. What does the HPA compute as desiredReplicas before clamping?',
      difficulty: 'intermediate',
      learningObjective: 'State the HPA desired-replicas formula',
      options: [
        { id: 'a', label: '6 — ceil(4 × 90/60) = ceil(6) = 6', correct: true, explanation: 'Correct. The HPA ceilings the ratio, so even small overshoots round up.' },
        { id: 'b', label: '4 — the HPA scales conservatively', correct: false, explanation: 'The formula is explicit; conservatism lives in stabilization and policies, not in the formula.' },
        { id: 'c', label: '7 — the ceiling plus a safety margin', correct: false, explanation: 'There is no safety-margin addition; the ceiling is the whole adjustment.' },
      ],
    },
  ],
};

const hpaLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '15 minutes',
  description:
    'Run the HPA algorithm against a configurable workload curve. Watch desired-replica computation, clamping to [min, max], and stabilization windows.',
  learningObjectives: [
    'See the formula compute desired replicas for each tick',
    'See scale-down stabilization in action',
    'Appreciate the difference between a spike-and-settle curve and a ramp-up curve',
  ],
  prerequisites: [
    { type: 'knowledge', label: 'HPA formula', description: 'You should know the desiredReplicas formula before running the lab.' },
  ],
  content: {
    simulationId: 'hpa-scaling-simulator',
    instructions: [
      { id: 'step-1', label: 'Baseline: spike and settle', description: 'targetUtil=50, stabilizationDown=3. Watch replicas climb fast and fall slowly.' },
      { id: 'step-2', label: 'Remove stabilization', description: 'Set stabilizationDown=0 and run spike-and-settle again. Replicas now oscillate downward each tick.' },
      { id: 'step-3', label: 'Try oscillating load', description: 'With oscillating load and stabilization=0, the HPA bounces every tick — a case for stabilization.' },
      { id: 'step-4', label: 'Hit the ceiling', description: 'Set maxReplicas=5 and run ramp-up. Observe that desiredReplicas can exceed max but applied replicas never do.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'within-bounds',
        label: 'Applied replicas always stay within [min, max]',
        check: (state) => {
          const s = state as { currentReplicas: number };
          return s.currentReplicas >= 0 && s.currentReplicas <= 20;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'hpa-algorithm': hpaAlgorithm,
    'metrics-sources': metricsSources,
    'stabilization-and-behavior': stabilizationAndBehavior,
  },
  labs: {
    'hpa-scaling-simulator': hpaLab,
  },
  simulations: {
    'hpa-scaling-simulator': bindSimulation(hpaScalingSimulation, renderHpaState),
  },
};
