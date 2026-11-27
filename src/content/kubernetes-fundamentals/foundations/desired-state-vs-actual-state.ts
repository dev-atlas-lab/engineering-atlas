import type { ConceptContentModule, LessonBody } from '../../types';

const specAndStatus: LessonBody = {
  learningObjectives: ['Identify spec and status in any Kubernetes object'],
  sections: [
    {
      heading: 'Every object has two kinds of state',
      blocks: [
        {
          type: 'paragraph',
          text: 'Open any Kubernetes object — a Pod, a Deployment, a Node — and you will see two subtrees that matter: spec and status. The spec is the desired state you asked for; the status is the actual state the cluster currently has. The split is not cosmetic — it is the architectural separation between intent (which you own) and observation (which the control plane owns).',
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'A Pod: spec (desired, by you) and status (actual, by the system)',
          code: `apiVersion: v1
kind: Pod
metadata:
  name: web-abc
spec:            # desired — what you asked for
  containers:
    - name: nginx
      image: nginx:1.26
status:          # actual — what is really happening, filled in by the system
  phase: Running
  podIP: 10.244.1.17
  containerStatuses:
    - name: nginx
      ready: true
      restartCount: 0`,
        },
      ],
    },
    {
      heading: 'Who writes what',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Field', 'Who writes it', 'What it means'],
          rows: [
            ['spec', 'The user (kubectl, CI pipeline)', 'Intent — what should be true'],
            ['status', 'The control plane / kubelet', 'Observation — what currently is true'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'You almost never edit "status" by hand — the API Server rejects most writes to it from clients. Status is for the system to tell you what it sees; spec is for you to tell the system what you want.',
        },
      ],
    },
  ],
};

const driftAndReconciliation: LessonBody = {
  learningObjectives: ['Describe what happens when desired and actual state diverge'],
  sections: [
    {
      heading: 'Drift is normal',
      blocks: [
        {
          type: 'paragraph',
          text: 'In a real cluster, actual state is constantly drifting away from desired state: Pods crash, nodes reboot, disks fill, containers get OOM-killed. The design response is not to prevent drift — that is impossible — but to make closing the gap a continuous automatic activity. Controllers watch both spec and status and take action whenever they diverge.',
        },
      ],
    },
    {
      heading: 'A concrete example',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'You apply a Deployment with replicas: 3. spec says 3; status eventually reports 3 running.',
            'A worker node reboots. One of the Pods on it dies with it. status now reports 2 running.',
            'The ReplicaSet controller watches this. It sees spec (from its parent Deployment) says 3, status says 2 — a gap of 1.',
            'It asks the API Server to create a new Pod from the template. The scheduler picks a node; the kubelet there starts it.',
            'A few seconds later, status reports 3 again. Gap closed. The loop goes quiet — until the next thing drifts.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'This continuous loop is the Kubernetes reconciliation loop, covered in the next concept. "Self-healing" is marketing; the real thing is just this loop doing its job.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'desired-actual-kc-1',
      type: 'single-choice',
      prompt: 'If pod.spec.replicas is 3 and pod.status.readyReplicas is 2, who is responsible for closing the gap?',
      difficulty: 'intermediate',
      learningObjective: 'Describe what happens when desired and actual state diverge',
      options: [
        { id: 'a', label: 'The ReplicaSet controller, running as part of the controller manager', correct: true, explanation: 'Correct. Each controller watches its resource type and reconciles spec with status.' },
        { id: 'b', label: 'The user — you should kubectl delete and re-apply', correct: false, explanation: 'The whole point of declarative + reconciliation is that users don\'t do this manually.' },
        { id: 'c', label: 'The scheduler', correct: false, explanation: 'The scheduler only picks nodes for Pods. The ReplicaSet controller is what decides a new Pod needs to exist in the first place.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'spec-and-status': specAndStatus,
    'drift-and-reconciliation': driftAndReconciliation,
  },
  labs: {},
  simulations: {},
};
