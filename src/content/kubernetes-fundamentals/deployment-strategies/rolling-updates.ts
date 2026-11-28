import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { rollingUpdateScene } from '../operations-scenes';
import { deploymentRolloutSimulation } from '../operations-simulations';
import { renderRolloutState } from '../operations-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const controllerAlgorithm: LessonBody = {
  learningObjectives: [
    'Describe how the Deployment controller executes a rolling update',
    'State the invariants it maintains throughout the rollout',
  ],
  sections: [
    {
      heading: 'Two ReplicaSets, one controller',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Deployment never creates Pods itself. When you edit its `spec.template` (e.g. `kubectl set image`), the Deployment controller creates a NEW ReplicaSet with the new template hash. The OLD ReplicaSet still exists and still owns its Pods. The rollout is the controlled transfer of replicas from old to new.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Controller computes: desired new RS replicas, desired old RS replicas, max allowed Pods (replicas + maxSurge), min allowed Ready Pods (replicas - maxUnavailable).',
            'If adding a new-RS replica would stay within max allowed Pods → scale new RS up by one. Wait for the new Pod to become Ready.',
            'If scaling the old RS down by one would still satisfy min allowed Ready → scale old RS down by one.',
            'Repeat until new RS is at the desired count and old RS is at zero.',
          ],
        },
        {
          type: 'paragraph',
          text: 'The invariants: total Pods ≤ replicas + maxSurge; Ready Pods ≥ replicas - maxUnavailable. The algorithm picks the step at each tick that advances the rollout without breaching either invariant.',
        },
      ],
    },
    {
      heading: 'What happens inside one reconcile tick',
      blocks: [
        {
          type: 'code',
          language: 'bash',
          code: `# Progress of a rolling update, replicas=5, maxSurge=1, maxUnavailable=1
# Start:  old=5 (5 ready), new=0
# t1:     old=5 (5 ready), new=1 (0 ready, pulling image)   # surged
# t2:     old=5 (5 ready), new=1 (1 ready)                  # new ready
# t3:     old=4 (4 ready), new=1 (1 ready)                  # scaled old down
# t4:     old=4 (4 ready), new=2 (1 ready)                  # surged
# ...and so on until old=0, new=5.`,
        },
      ],
    },
  ],
  visualization: rollingUpdateScene,
  knowledgeCheck: [
    {
      id: 'rolling-kc-1',
      type: 'single-choice',
      prompt: 'During a rolling update, a new v2 Pod never becomes Ready (readiness probe fails). What does the Deployment controller do?',
      difficulty: 'intermediate',
      learningObjective: 'State the invariants it maintains throughout the rollout',
      options: [
        { id: 'a', label: 'The rollout stalls — the controller will not scale the old ReplicaSet down until maxUnavailable permits, which it cannot because the new Pod is not Ready', correct: true, explanation: 'Correct. The invariant that Ready Pods ≥ replicas-maxUnavailable blocks further old-side scale-down.' },
        { id: 'b', label: 'The controller automatically rolls back to the previous revision', correct: false, explanation: 'There is no automatic rollback. kubectl rollout undo is explicit.' },
        { id: 'c', label: 'The new Pod is killed and replaced after failureThreshold', correct: false, explanation: 'Readiness failure does not kill the Pod. The rollout stalls indefinitely.' },
      ],
    },
  ],
};

const readinessGatesRollout: LessonBody = {
  learningObjectives: ['Explain why readiness probes are essential for a safe rollout'],
  sections: [
    {
      heading: 'Ready, not just started',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Deployment controller does not check "the new Pod is running." It checks "the new Pod is Ready." Without a readiness probe, a Pod becomes Ready as soon as its containers start — before the application can serve traffic. The rollout then races through, replacing all Pods in a few seconds, and the Service briefly points at Pods that have TCP ports listening but nothing serving yet.',
        },
        {
          type: 'list',
          items: [
            'Readiness probe + a real /readyz endpoint → the controller waits for actual readiness.',
            'minReadySeconds: 30 → the Pod must be Ready for at least 30s before counting; useful when readiness flaps on cold start.',
            'progressDeadlineSeconds (default 600) → if the rollout does not progress within this many seconds, the Deployment\'s Progressing condition goes False. Some CI systems watch this to fail the deploy.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The Deployment does NOT automatically roll back when progressDeadlineSeconds expires — it just marks the condition False and stops trying. Automated rollback is tooling your CI adds; Kubernetes itself does not do it.',
        },
      ],
    },
  ],
};

const rolloutLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '25 minutes',
  description:
    'Run a Deployment rollout step by step for Rolling, Blue-Green, and Canary strategies, including the "new version fails readiness" scenario that stalls each one differently.',
  learningObjectives: [
    'See the surge/scale-down alternation of a rolling update',
    'See the hard cutover of blue-green',
    'See the gradual promotion and bounded blast-radius of canary',
    'Experience what a failed readiness does to each strategy',
  ],
  prerequisites: [
    { type: 'knowledge', label: 'Deployment rolling updates', description: 'Read the controller-algorithm lesson first.' },
  ],
  content: {
    simulationId: 'deployment-rollout-simulator',
    instructions: [
      { id: 'step-1', label: 'Baseline rolling update', description: 'Replicas=5, maxSurge=1, maxUnavailable=1, v2 succeeds. Step through and count surges and scale-downs.' },
      { id: 'step-2', label: 'Make readiness fail', description: 'Enable "Simulate v2 failing readiness" — the rollout stalls at the first surged Pod.' },
      { id: 'step-3', label: 'Switch to Blue-Green', description: 'Same failing readiness — the full green stack is created, but the cutover refuses because Ready is never achieved.' },
      { id: 'step-4', label: 'Switch to Canary', description: 'Same failing readiness — only the canary slice is deployed, and the promotion step aborts it, leaving v1 serving 100%.' },
      { id: 'step-5', label: 'Compare wall-time and blast-radius', description: 'Re-run with v2 succeeding across all three strategies; the controller log shows the shape of each rollout.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'never-below-min-ready',
        label: 'During a successful rolling update, Ready replicas never drop below (total - maxUnavailable)',
        check: (state) => {
          const s = state as { oldRs: { ready: number }; newRs: { ready: number }; totalReplicas: number; maxUnavailable: number; phase: string; strategy: string };
          if (s.strategy !== 'rolling') return true;
          if (s.phase !== 'rolling-out') return true;
          return s.oldRs.ready + s.newRs.ready >= s.totalReplicas - s.maxUnavailable;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'the-controller-algorithm': controllerAlgorithm,
    'readiness-gates-the-rollout': readinessGatesRollout,
  },
  labs: {
    'deployment-rollout-simulator': rolloutLab,
  },
  simulations: {
    'deployment-rollout-simulator': bindSimulation(deploymentRolloutSimulation, renderRolloutState),
  },
};

