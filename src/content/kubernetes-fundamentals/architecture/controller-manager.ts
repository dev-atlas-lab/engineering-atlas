import type { ConceptContentModule, LessonBody } from '../../types';

const manySmallControllers: LessonBody = {
  learningObjectives: ['Explain what a controller is and why there are many of them'],
  sections: [
    {
      heading: 'One process, many loops',
      blocks: [
        {
          type: 'paragraph',
          text: 'The controller manager (kube-controller-manager) is a single process that hosts dozens of built-in controllers. Each controller watches one resource type and reconciles it toward its desired state. They share a process for operational convenience — there would be no architectural problem running each as its own binary — but each controller\'s loop is independent.',
        },
        {
          type: 'paragraph',
          text: 'Every controller follows the same structure: watch the API Server for its resource type, compute a diff between spec and status, write actions back through the API Server, repeat. The pattern is so uniform that writing a custom controller (via a Kubernetes Operator) is largely boilerplate — the "operator SDKs" exist because the shape is so standardized.',
        },
      ],
    },
    {
      heading: 'A built-in controller walkthrough: ReplicaSet',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Watch: establish a watch on ReplicaSet objects and on Pods matching any ReplicaSet\'s selector.',
            'Observe: for each ReplicaSet, count how many matching Pods currently exist (actual).',
            'Diff: compare to spec.replicas (desired). Compute the signed gap.',
            'Act: if gap > 0, create new Pods from the template (and let the scheduler assign them). If gap < 0, delete surplus Pods.',
            'Loop: wait for the next watch event. Any change to the ReplicaSet or any matching Pod wakes it up.',
          ],
        },
      ],
    },
  ],
};

const builtInControllers: LessonBody = {
  learningObjectives: ['Identify a handful of the built-in controllers and the objects they manage'],
  sections: [
    {
      heading: 'Who watches what',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Controller', 'Watches', 'What it does'],
          rows: [
            ['ReplicaSet', 'ReplicaSets and their Pods', 'Keeps Pod count equal to spec.replicas'],
            ['Deployment', 'Deployments and their ReplicaSets', 'Creates new ReplicaSets, ramps them up/down for rolling updates'],
            ['Node Lifecycle', 'Node objects and their leases', 'Marks NotReady nodes; evicts their Pods after a grace period'],
            ['Endpoints / EndpointSlice', 'Services and matching Pods', 'Keeps Endpoints in sync with Pods matching each Service\'s selector'],
            ['Job', 'Jobs and their Pods', 'Starts Pods until the Job\'s completions target is met; retries failed Pods per backoffLimit'],
            ['CronJob', 'CronJobs', 'Creates a Job object on schedule'],
            ['ServiceAccount', 'ServiceAccount creations', 'Creates the associated token Secret (historically; token format changed in 1.24)'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Several controllers that originally ran here have been split out: cloud-controller-manager hosts the ones that talk to a specific cloud provider\'s APIs (loadbalancer provisioning, node lifecycle driven by cloud VM state). The split lets Kubernetes stay cloud-agnostic at the core.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'controller-manager-kc-1',
      type: 'single-choice',
      prompt: 'Why is a Deployment implemented as a controller over ReplicaSets rather than directly over Pods?',
      difficulty: 'intermediate',
      learningObjective: 'Identify a handful of the built-in controllers and the objects they manage',
      options: [
        { id: 'a', label: 'It lets the Deployment do rolling updates by scaling one ReplicaSet up while scaling another down, reusing the ReplicaSet controller for Pod-count management', correct: true, explanation: 'Correct — Deployment delegates Pod lifecycle to ReplicaSet and only orchestrates the rollout between versions.' },
        { id: 'b', label: 'Deployments were added before ReplicaSets, so this is historical', correct: false, explanation: 'The opposite — ReplicaSet came first (as ReplicationController). Deployment was built on top of it.' },
        { id: 'c', label: 'Deployments can only manage one Pod', correct: false, explanation: 'They manage many, but through the ReplicaSet layer.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'many-small-controllers': manySmallControllers,
    'built-in-controllers': builtInControllers,
  },
  labs: {},
  simulations: {},
};
