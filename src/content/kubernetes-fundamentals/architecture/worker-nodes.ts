import type { ConceptContentModule, LessonBody } from '../../types';

const whatANodeIs: LessonBody = {
  learningObjectives: ['Explain what makes a machine a Kubernetes node'],
  sections: [
    {
      heading: 'A node is a machine registered with the control plane',
      blocks: [
        {
          type: 'paragraph',
          text: 'A worker node is any machine — physical server, VM, or even a nested VM — that has three things installed and registered with the cluster: a container runtime (so it can run containers), a kubelet (so the control plane can tell it what to run), and kube-proxy (so Services work on this node\'s network namespace).',
        },
        {
          type: 'paragraph',
          text: 'The cluster treats a node as a disposable pool of CPU, memory, disk, and network. Nothing about an individual node is precious — if it fails, its workloads are re-scheduled elsewhere. If you add more nodes, they are picked up automatically and used immediately.',
        },
      ],
    },
    {
      heading: 'The Node object',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every physical node is represented by a Node object in the API. That object has spec (set mostly at join time: labels, taints) and status (continuously updated: capacity, allocatable, conditions, addresses). "kubectl get nodes" is reading that object. A node going offline is the status.conditions field changing — the machine itself is just gone.',
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'Status fragment on a Node object',
          code: `status:
  capacity: { cpu: "8", memory: "32Gi", pods: "110" }
  allocatable: { cpu: "7.8", memory: "30Gi" }
  conditions:
    - type: Ready
      status: "True"
    - type: MemoryPressure
      status: "False"`,
        },
      ],
    },
  ],
};

const heartbeat: LessonBody = {
  learningObjectives: ['Describe how a node reports itself as healthy and what happens when it stops'],
  sections: [
    {
      heading: 'How "the node is up" is communicated',
      blocks: [
        {
          type: 'paragraph',
          text: 'The kubelet on each node sends two kinds of heartbeats to the API Server: a frequent, lightweight lease update (every few seconds) and a less frequent, heavier status update (when conditions change, or on a longer timer). The lease is the cheap signal — "I am alive, latest-noticed-at this timestamp." The status update is the detailed picture — resource usage, conditions, container statuses.',
        },
      ],
    },
    {
      heading: 'When a node stops reporting',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'After the lease hasn\'t been updated for a grace period (roughly 40 seconds by default), the node-lifecycle controller marks the Node\'s Ready condition as Unknown.',
            'Once the Node is Unknown for a configurable period (typically 5 minutes), its Pods are marked for eviction and re-scheduled elsewhere.',
            'If the node comes back during that window, nothing drastic happens — it resumes reporting and its Pods stay put.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'This delay is deliberate. Networks blip; nodes occasionally pause under load. Immediately evicting on the first missed heartbeat would cause thrash. The tunables (node-monitor-grace-period, pod-eviction-timeout) trade recovery time against false-positive evictions.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-a-node-is': whatANodeIs,
    'node-heartbeat-and-conditions': heartbeat,
  },
  labs: {},
  simulations: {},
};
