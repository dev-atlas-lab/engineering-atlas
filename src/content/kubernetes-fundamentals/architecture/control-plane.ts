import type { ConceptContentModule, LessonBody } from '../../types';

const whatItDoes: LessonBody = {
  learningObjectives: ['Identify each control plane component and the job it owns'],
  sections: [
    {
      heading: 'Four core components',
      blocks: [
        {
          type: 'paragraph',
          text: 'The control plane is a set of processes — not one program. Four pieces together handle everything from accepting user requests to deciding which worker node runs each Pod.',
        },
        {
          type: 'comparisonTable',
          headers: ['Component', 'Role', 'Writes to etcd?'],
          rows: [
            ['API Server (kube-apiserver)', 'REST entry point; validates, authenticates, authorizes, admits', 'Yes — the only one'],
            ['etcd', 'Strongly-consistent key-value store for cluster state', 'Is the store'],
            ['Scheduler (kube-scheduler)', 'Picks a node for each Pending Pod', 'No — writes go through the API Server'],
            ['Controller Manager (kube-controller-manager)', 'Hosts the built-in controllers (ReplicaSet, Deployment, Node, …)', 'No — writes go through the API Server'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'On a managed Kubernetes service (EKS, GKE, AKS), the provider runs the control plane for you — you don\'t see those processes, you only see the API endpoint. The component model is identical underneath.',
        },
      ],
    },
  ],
};

const hubAndSpoke: LessonBody = {
  learningObjectives: ['Explain why control plane components talk to each other only through the API Server'],
  sections: [
    {
      heading: 'The API Server is the hub',
      blocks: [
        {
          type: 'paragraph',
          text: 'The scheduler does not call the controller manager. The controller manager does not call the kubelet. Nothing except the API Server talks directly to etcd. Every exchange goes through the API Server, and components learn about changes by holding long-lived "watch" connections to it. This is a hub-and-spoke topology, and it is intentional.',
        },
        {
          type: 'list',
          items: [
            'One component (API Server) owns all authorization, auditing, and validation — not ten.',
            'etcd\'s performance constraints only apply to one caller — the API Server — not every component.',
            'Components are independent. A failed scheduler does not cascade into the controller manager; it just means new Pods stay Pending for a while.',
            'Adding a new controller (your own CRD controller, for example) does not require re-wiring any other component. It watches the API Server like all the others.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The flip side: the API Server is the single point of load for the whole cluster. If it is slow (overloaded, under-provisioned), every controller\'s reconciliation gets slow with it. This is why API Server latency is one of the first SLIs any serious operator measures.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'control-plane-kc-1',
      type: 'single-choice',
      prompt: 'Which control plane component is the only one that reads from and writes to etcd directly?',
      difficulty: 'beginner',
      learningObjective: 'Identify each control plane component and the job it owns',
      options: [
        { id: 'a', label: 'The API Server', correct: true, explanation: 'Correct. etcd is reached through the API Server; no other component speaks to it.' },
        { id: 'b', label: 'The scheduler', correct: false, explanation: 'The scheduler reads and writes via the API Server, like every other component.' },
        { id: 'c', label: 'The controller manager', correct: false, explanation: 'Same — controllers go through the API Server.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-the-control-plane-does': whatItDoes,
    'hub-and-spoke': hubAndSpoke,
  },
  labs: {},
  simulations: {},
};
