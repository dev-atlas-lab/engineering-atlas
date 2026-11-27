import type { ConceptContentModule, LessonBody } from '../../types';
import { apiRequestLifecycleScene } from '../scenes';

const apiServerRole: LessonBody = {
  learningObjectives: [
    'Describe the API Server\'s role in a Kubernetes cluster',
    'Explain why it is both the only etcd client and the hub for every other component',
  ],
  sections: [
    {
      heading: 'The front door — and the only door',
      blocks: [
        {
          type: 'paragraph',
          text: 'The API Server (kube-apiserver) is a stateless REST service. It serves every read and write of Kubernetes objects, from "kubectl get pods" to a kubelet reporting Pod status back home. If you can\'t talk to the API Server, you can\'t do anything with the cluster — and nothing in the cluster can update its view of the world.',
        },
        {
          type: 'paragraph',
          text: 'It is deliberately the only component that reads or writes etcd. Everything else (schedulers, controllers, kubelets, operators you write) interacts with cluster state through the API Server\'s REST interface. This separation lets etcd be treated as an implementation detail: the API surface is stable, the storage layer underneath is not something applications are allowed to touch.',
        },
      ],
    },
    {
      heading: 'Stateless by design, scalable horizontally',
      blocks: [
        {
          type: 'paragraph',
          text: 'The API Server itself holds no state — every write is persisted through etcd, every read goes back to etcd (or a local watch cache fed from it). That means you can run many API Server replicas behind a load balancer and they all behave identically. HA clusters typically have 3 API Server replicas.',
        },
      ],
    },
  ],
};

const requestLifecycle: LessonBody = {
  learningObjectives: [
    'List the stages a request passes through inside the API Server',
    'Describe what happens at each stage and what can reject the request',
  ],
  sections: [
    {
      heading: 'Four stages, in order',
      blocks: [
        {
          type: 'paragraph',
          text: 'An API Server request passes through four pipeline stages before etcd ever sees it. Each stage can reject the request. The ordering matters: each stage assumes the previous one has already done its job.',
        },
        {
          type: 'comparisonTable',
          headers: ['Stage', 'Decides', 'Rejection code'],
          rows: [
            ['Authentication', 'Who is making this request?', '401 Unauthorized'],
            ['Authorization', 'Is this identity allowed to do this action on this resource?', '403 Forbidden'],
            ['Admission', 'Mutate the object if needed; validate against cluster policy', '400 (validating), 500 (webhook timeout, usually)'],
            ['Schema validation', 'Does the object conform to its OpenAPI schema?', '400 Bad Request'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Authentication uses pluggable authenticators (client certs, bearer tokens, OIDC, service account tokens). Authorization is almost always RBAC in modern clusters. Admission is where most custom security and policy ends up: mutating and validating admission webhooks let you enforce "no privileged containers," "images must come from our registry," and similar rules.',
        },
      ],
    },
    {
      heading: 'What happens when the API Server is down',
      blocks: [
        {
          type: 'list',
          items: [
            'kubectl stops working — the user can\'t read or change anything.',
            'The scheduler and controllers can\'t re-establish their watches; they keep acting on cached state until that gets stale, then they stop making progress.',
            'The kubelet on each node loses its watch, so new assignments stop arriving — but existing Pods keep running.',
            'The cluster is frozen, not broken. When the API Server comes back, components reconnect and resume where they left off.',
          ],
        },
      ],
    },
  ],
  visualization: apiRequestLifecycleScene,
  knowledgeCheck: [
    {
      id: 'api-server-kc-1',
      type: 'single-choice',
      prompt: 'Why is admission the stage where custom cluster policy (e.g. "no privileged containers") is enforced?',
      difficulty: 'intermediate',
      learningObjective: 'List the stages a request passes through inside the API Server',
      options: [
        { id: 'a', label: 'Admission runs after authentication and authorization, has the full object in hand, and can mutate it or reject it before anything is persisted', correct: true, explanation: 'Correct. By admission time the request is known-safe (authenticated, authorized) but not yet written — the perfect point to inspect and gate it.' },
        { id: 'b', label: 'Admission is the only stage that can read the request body', correct: false, explanation: 'All stages can read the request; the question is what they are empowered to decide.' },
        { id: 'c', label: 'Admission runs on the kubelet', correct: false, explanation: 'Admission is inside the API Server, not on the node.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'api-server-role': apiServerRole,
    'request-lifecycle': requestLifecycle,
  },
  labs: {},
  simulations: {},
};
