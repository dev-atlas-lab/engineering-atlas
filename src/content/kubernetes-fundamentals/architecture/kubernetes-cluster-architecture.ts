import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { clusterArchitectureScene } from '../scenes';
import { architectureExplorerSimulation } from '../simulations';
import { renderArchitectureExplorerState } from '../simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const controlPlaneAndNodes: LessonBody = {
  learningObjectives: [
    'Name the components that make up the control plane and the ones that run on every node',
    'Explain why the control plane is logically separate from the workloads it runs',
  ],
  sections: [
    {
      heading: 'Two tiers: control plane and worker nodes',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Kubernetes cluster has two kinds of machines: control plane nodes, which run the components that make decisions, and worker nodes, which run application Pods. They are separated logically so that workload failures cannot take the cluster\'s brain down with them, and so the control plane can be scaled and upgraded independently.',
        },
        {
          type: 'comparisonTable',
          headers: ['Tier', 'What runs here', 'Responsibility'],
          rows: [
            ['Control plane', 'API Server, etcd, Scheduler, Controller Manager', 'Decides what should run, where, and keeps the cluster\'s state'],
            ['Worker nodes', 'kubelet, kube-proxy, container runtime, your Pods', 'Actually runs containers and reports back'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'In a small cluster or a local one (kind, minikube), one machine can play both roles. In production, the control plane is on dedicated nodes — usually three of them for HA — and application workloads are kept off those nodes with a taint so they only run on real workers.',
        },
      ],
    },
    {
      heading: 'Why the split matters',
      blocks: [
        {
          type: 'list',
          items: [
            'Blast radius: a runaway Pod cannot starve the scheduler or the API Server if they are on different machines.',
            'HA: the control plane components can run in multiple replicas with their own leader election, independent of what workloads do.',
            'Upgrade independence: you can upgrade the control plane first, then roll worker nodes, because the control plane\'s API is versioned against the kubelets below it.',
          ],
        },
      ],
    },
  ],
  visualization: clusterArchitectureScene,
};

const componentCooperation: LessonBody = {
  learningObjectives: [
    'Trace how user intent travels from kubectl to a running container',
    'Explain why every component talks through the API Server rather than directly to each other',
  ],
  sections: [
    {
      heading: 'Follow the manifest',
      blocks: [
        {
          type: 'paragraph',
          text: 'The clearest way to see the architecture at work is to follow one request end-to-end. You run kubectl apply -f deployment.yaml. The request passes through a half-dozen components before a container actually starts.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'kubectl sends the Deployment object to the API Server.',
            'The API Server authenticates, authorizes, admits, validates, and writes the object to etcd.',
            'The Deployment controller (in the controller manager) sees the new Deployment via its watch, creates a ReplicaSet.',
            'The ReplicaSet controller sees the new ReplicaSet, creates N Pods (each with no node assigned).',
            'The scheduler sees Pods with no nodeName, picks a node for each, and updates each Pod with its assignment.',
            'The kubelet on the chosen node sees "a Pod is assigned to me," tells the container runtime to pull images and start containers.',
            'The kubelet reports Pod status back to the API Server; the ReplicaSet controller sees status.readyReplicas rise; eventually matches spec.replicas.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Every arrow in that list goes through the API Server. The scheduler does not call the kubelet; it writes a field on an object and the kubelet sees the write. This is sometimes called "pub/sub through the data store" — decoupling components by communicating only through shared state.',
        },
      ],
    },
    {
      heading: 'Why one shared store',
      blocks: [
        {
          type: 'paragraph',
          text: 'Routing every exchange through the API Server has a cost (one more hop, one more serialization) but a lot of benefit. Components can come and go independently without re-wiring anything else. The current state is always in one authoritative place. Each component is small and testable, because its input is just "what does the API Server say right now" and its output is "a write to the API Server."',
        },
      ],
    },
  ],
};

const clusterExplorerLab: LabBody = {
  difficulty: 'beginner',
  estimatedTime: '20 minutes',
  description:
    'Walk through each control plane and node component, examining what it does, how it does it, who it talks to, and what breaks when it is down.',
  learningObjectives: [
    'Name every control plane and node component and the job each owns',
    'Describe the failure behavior of each component so blast radius is concrete, not abstract',
  ],
  prerequisites: [{ type: 'knowledge', label: 'Cluster architecture lesson', description: 'You should have read the preceding lesson before using this lab.' }],
  content: {
    simulationId: 'cluster-architecture-explorer',
    instructions: [
      { id: 'step-1', label: 'Inspect each control plane component', description: 'Click through API Server, etcd, scheduler, and controller manager in turn, noting responsibilities and failure behavior.' },
      { id: 'step-2', label: 'Inspect each node component', description: 'Then kubelet, kube-proxy, and container runtime.' },
      { id: 'step-3', label: 'Compare failure behaviors', description: 'For each component, ask: what still works, what stops, what recovers once it\'s back?' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'all-inspected',
        label: 'Every component has been inspected at least once',
        check: (state) => {
          const s = state as { inspected: string[] };
          return s.inspected.length >= 7;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'control-plane-and-nodes': controlPlaneAndNodes,
    'component-cooperation': componentCooperation,
  },
  labs: {
    'cluster-architecture-explorer': clusterExplorerLab,
  },
  simulations: {
    'cluster-architecture-explorer': bindSimulation(architectureExplorerSimulation, renderArchitectureExplorerState),
  },
};
