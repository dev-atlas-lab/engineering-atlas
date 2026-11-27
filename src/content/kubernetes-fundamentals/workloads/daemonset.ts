import type { ConceptContentModule, LessonBody } from '../../types';

const onePodPerNode: LessonBody = {
  learningObjectives: ['Explain the "one Pod per matching node" guarantee'],
  sections: [
    {
      heading: 'DaemonSet — tied to the node, not to a replica count',
      blocks: [
        {
          type: 'paragraph',
          text: 'A DaemonSet ensures exactly one Pod of its template runs on every (matching) node. There is no spec.replicas — the count is driven by the number of nodes. When a new node joins the cluster, the DaemonSet controller places a Pod on it automatically; when a node is drained, the Pod is removed.',
        },
        {
          type: 'list',
          items: [
            'Log collectors (Fluent Bit, Vector) that need to read every node\'s container logs',
            'Metrics agents (node_exporter, Prometheus node agent) collecting per-node metrics',
            'CNI network plugins that must run on every node to wire Pod networking',
            'Security agents inspecting container activity on each host',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'DaemonSets commonly use tolerations so their Pods can run on control plane nodes as well (which carry a taint that keeps regular workloads off). This is why node agents work everywhere — they explicitly tolerate the control-plane taint.',
        },
      ],
    },
    {
      heading: 'Selecting a subset of nodes',
      blocks: [
        {
          type: 'paragraph',
          text: 'A DaemonSet can target a subset of nodes with a nodeSelector or nodeAffinity. A GPU monitoring agent, for example, would select only nodes with "gpu=true" — ignored by all other nodes, present on every matching node.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'daemonset-kc-1',
      type: 'single-choice',
      prompt: 'Which of these is the best fit for a DaemonSet?',
      difficulty: 'beginner',
      learningObjective: 'Explain the "one Pod per matching node" guarantee',
      options: [
        { id: 'a', label: 'A log-shipping agent that must read every node\'s container logs', correct: true, explanation: 'Correct — DaemonSet is designed for node-local agents that need coverage on every node.' },
        { id: 'b', label: 'A web application you want to scale from 3 replicas to 10 under load', correct: false, explanation: 'Use a Deployment. DaemonSet count is driven by node count, not load.' },
        { id: 'c', label: 'A database with persistent per-replica storage', correct: false, explanation: 'Use a StatefulSet for identity and per-Pod PVCs.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'one-pod-per-node': onePodPerNode,
  },
  labs: {},
  simulations: {},
};
