import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { deploymentReplicaSetScene } from '../scenes';
import { deploymentScalingSimulation } from '../simulations';
import { renderDeploymentState } from '../simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const deploymentOverReplicaSet: LessonBody = {
  learningObjectives: [
    'Explain the relationship between Deployment, ReplicaSet, and Pod',
    'Trace a scaling operation through the object hierarchy',
  ],
  sections: [
    {
      heading: 'Three tiers, one hierarchy',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Deployment owns one or more ReplicaSets; each ReplicaSet owns zero or more Pods. In steady state, one Deployment has exactly one active ReplicaSet with the current Pod template, and the previous ReplicaSets (from earlier rollouts) exist with replicas: 0 for rollback. Scaling, updates, and rollbacks all flow through this hierarchy — the Deployment never creates Pods directly.',
        },
      ],
    },
    {
      heading: 'What happens when you change replicas',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'You run "kubectl scale deployment/web --replicas=5". That updates deployment.spec.replicas via the API Server.',
            'The Deployment controller sees the change on its watch. It updates the active ReplicaSet\'s spec.replicas to 5.',
            'The ReplicaSet controller sees that change. It creates (or deletes) Pods until its matching-Pod count is 5.',
            'The scheduler assigns the new Pods to nodes; the kubelets start them.',
            'Each component is watching; the chain happens in milliseconds end to end.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'You can edit deployment.spec.replicas via kubectl scale, kubectl edit, kubectl patch, or a GitOps apply of a new manifest. All four routes end up in the same place: a field value in etcd, with controllers reacting to it.',
        },
      ],
    },
  ],
  visualization: deploymentReplicaSetScene,
};

const rollingUpdates: LessonBody = {
  learningObjectives: [
    'Describe the rolling update strategy (maxSurge, maxUnavailable)',
    'Trace a rollout and a rollback through the Deployment hierarchy',
  ],
  sections: [
    {
      heading: 'Rolling update, one Pod at a time',
      blocks: [
        {
          type: 'paragraph',
          text: 'A rolling update replaces old Pods with new ones gradually. The Deployment controller creates a new ReplicaSet for the new Pod template and scales it up while scaling the old ReplicaSet down. Two settings control the pace: maxSurge (how many extra Pods can temporarily exist above spec.replicas) and maxUnavailable (how many Pods can be missing below spec.replicas during the rollout).',
        },
        {
          type: 'comparisonTable',
          headers: ['Setting', 'Default', 'Effect'],
          rows: [
            ['maxSurge', '25%', 'During a rollout, at most this many extra Pods exist above the replica target'],
            ['maxUnavailable', '25%', 'During a rollout, at most this many Pods are below the replica target'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'With both at 25% and replicas=4, the rollout can run with 5 Pods temporarily (maxSurge) and 3 Pods at minimum (maxUnavailable). Setting maxUnavailable=0 is a common choice — a strict "never drop below spec.replicas" rollout, at the cost of needing capacity for the surge.',
        },
      ],
    },
    {
      heading: 'Rollback: just change the old ReplicaSet',
      blocks: [
        {
          type: 'paragraph',
          text: '"kubectl rollout undo deployment/web" does not restore the old Deployment manifest. It reactivates the previous ReplicaSet — scaling the new one down and the old one back up. That old ReplicaSet was sitting with replicas: 0 but its Pod template intact, waiting for exactly this.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'deployment-kc-1',
      type: 'single-choice',
      prompt: 'Why does a Deployment create a brand new ReplicaSet when you change the Pod template image, rather than editing the old ReplicaSet in place?',
      difficulty: 'intermediate',
      learningObjective: 'Trace a rollout and a rollback through the Deployment hierarchy',
      options: [
        { id: 'a', label: 'Keeping both ReplicaSets lets the Deployment roll out gradually and roll back instantly by re-scaling', correct: true, explanation: 'Correct. The old ReplicaSet is retained (at replicas=0 after rollout) specifically to enable rollback.' },
        { id: 'b', label: 'A ReplicaSet\'s template is immutable, so a new one is the only option', correct: false, explanation: 'ReplicaSet templates can technically be changed, but the Deployment controller does not change them — it creates a new one on purpose.' },
        { id: 'c', label: 'ReplicaSets have a size limit of one template over their lifetime', correct: false, explanation: 'There is no such limit; the pattern is a choice.' },
      ],
    },
  ],
};

const scalingLab: LabBody = {
  difficulty: 'beginner',
  estimatedTime: '20 minutes',
  description:
    'Start a Deployment, scale it up and down, kill a Pod to see the ReplicaSet self-heal, and perform a rolling update to v2. Watch the Pod list react at each step.',
  learningObjectives: [
    'Observe a Deployment scaling via its ReplicaSet',
    'See self-healing happen automatically when a Pod fails',
    'Perform a rolling update and understand that it creates a new ReplicaSet',
  ],
  prerequisites: [{ type: 'knowledge', label: 'ReplicaSet concept', description: 'You should know what a ReplicaSet is before working through a Deployment.' }],
  content: {
    simulationId: 'deployment-scaling-simulator',
    instructions: [
      { id: 'step-1', label: 'Scale the Deployment', description: 'Advance one step to scale from the initial replica count to the configured target.' },
      { id: 'step-2', label: 'Kill a running Pod', description: 'Advance again (if enabled) to see one Pod fail and the ReplicaSet create a replacement without any human intervention.' },
      { id: 'step-3', label: 'Roll out to v2', description: 'Advance once more (if enabled) to perform a rolling update — every Pod ends up on the new image.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'running-matches-desired',
        label: 'The number of running Pods equals the Deployment\'s desired replicas',
        check: (state) => {
          const s = state as { desiredReplicas: number; pods: { health: string }[] };
          return s.pods.filter((p) => p.health === 'running').length === s.desiredReplicas;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'deployment-over-replicaset': deploymentOverReplicaSet,
    'rolling-updates-and-rollbacks': rollingUpdates,
  },
  labs: {
    'deployment-scaling-simulator': scalingLab,
  },
  simulations: {
    'deployment-scaling-simulator': bindSimulation(deploymentScalingSimulation, renderDeploymentState),
  },
};
