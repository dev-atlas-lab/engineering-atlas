import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { reconciliationLoopScene } from '../scenes';
import { reconciliationSimulation } from '../simulations';
import { renderReconciliationState } from '../simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const controlLoop: LessonBody = {
  learningObjectives: [
    'Describe the observe-diff-act cycle every Kubernetes controller runs',
    'Explain why the loop never terminates even when the cluster is converged',
  ],
  sections: [
    {
      heading: 'Three steps, running forever',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Kubernetes controller runs a single, very simple loop over and over again for its entire lifetime: observe the current state (both desired and actual), compute the difference, and take action to close the difference. Nothing more clever is happening — the sophistication is in how many controllers run this loop at once and how they coordinate through the API Server.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Observe — read the current spec and status via the API Server.',
            'Diff — compare them. If spec == status, no action is needed.',
            'Act — if they differ, take an action that moves status toward spec: create a Pod, delete a Pod, update an Endpoints object.',
            'Repeat — the loop runs again, either on the next watch event or at a periodic resync.',
          ],
        },
      ],
    },
    {
      heading: 'Why it does not stop',
      blocks: [
        {
          type: 'paragraph',
          text: 'When desired and actual match, a controller does not stop running — it schedules another observation. This is deliberate. Reality drifts: a Pod dies, a node reboots, someone manually edits an object. The controller is only correct if it is continuously verifying, not just reacting. "Idling" for a reconciled object is still work — the work of confirming nothing has to change this tick.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'In code, this is called a "control loop" or "controller loop", and the pattern is sometimes called "level-triggered reconciliation" — the controller acts on the current level of state, not on the sequence of events that led to it. This makes controllers robust to missed events.',
        },
      ],
    },
  ],
  visualization: reconciliationLoopScene,
};

const selfHealing: LessonBody = {
  learningObjectives: ['Explain how self-healing is a consequence of continuous reconciliation'],
  sections: [
    {
      heading: 'Self-healing is a side effect, not a feature',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes markets "self-healing workloads." There is no special code path for healing — what Kubernetes calls self-healing is just the reconciliation loop reacting to drift it did not cause. A failed Pod is a drift from desired state; the controller reacts the same way it would if you had edited the manifest. Nothing distinguishes the two cases.',
        },
      ],
    },
    {
      heading: 'What the loop does and does not heal',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Scenario', 'Healed by Kubernetes?', 'Why'],
          rows: [
            ['A container inside a Pod crashes', 'Yes — the kubelet restarts it per the Pod\'s restartPolicy', 'This is handled by the kubelet directly on the node'],
            ['A Pod is deleted or OOM-killed by the kubelet', 'Yes, if managed by a ReplicaSet/Deployment — the controller creates a replacement', 'A Pod created by "kubectl run" alone is not managed, so nothing recreates it'],
            ['A node goes NotReady', 'Yes — its Pods are evicted and re-scheduled elsewhere after a toleration period', 'Node lifecycle controller reacts to node conditions'],
            ['A bad image reference in the spec', 'No — the control plane has no way to fix a wrong declaration', 'Self-healing closes gaps toward spec; a broken spec is the spec you asked for'],
            ['An application-level bug', 'No', 'Kubernetes does not understand your application logic, only container health'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'If you created a Pod directly (not through a Deployment/ReplicaSet), Kubernetes will not recreate it when it dies. The Pod has no owning controller — nothing to notice the gap. This is the single most common surprise for people new to the reconciliation model.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'reconciliation-kc-1',
      type: 'single-choice',
      prompt: 'A standalone Pod (created with `kubectl run`, not via a Deployment) is killed by a node failure. What does Kubernetes do?',
      difficulty: 'intermediate',
      learningObjective: 'Explain how self-healing is a consequence of continuous reconciliation',
      options: [
        { id: 'a', label: 'Nothing — no controller owns the Pod, so there is no spec to reconcile against', correct: true, explanation: 'Correct. Self-healing only works when an owning controller (ReplicaSet, Deployment, …) notices the gap.' },
        { id: 'b', label: 'Kubernetes automatically re-creates any Pod that dies', correct: false, explanation: 'This is a common misconception. Only Pods owned by a controller are recreated.' },
        { id: 'c', label: 'The scheduler schedules it onto a different node', correct: false, explanation: 'The scheduler only acts on Pods that exist. Without a controller creating a replacement Pod, the scheduler has nothing to schedule.' },
      ],
    },
  ],
};

const reconciliationLab: LabBody = {
  difficulty: 'beginner',
  estimatedTime: '10 minutes',
  description: 'Drive a controller through its observe-diff-act loop under configurable drift. See how a single reaction pattern produces self-healing.',
  learningObjectives: ['Observe the observe-diff-act loop reacting to drift at discrete ticks'],
  prerequisites: [{ type: 'knowledge', label: 'Spec vs status', description: 'You should know what the spec/status split means (prior concept).' }],
  content: {
    simulationId: 'reconciliation-simulator',
    instructions: [
      { id: 'step-1', label: 'Start in steady state', description: 'Desired and actual both match. No action is taken, but the loop is still running.' },
      { id: 'step-2', label: 'Introduce drift', description: 'A Pod fails at the configured tick. The controller observes the gap.' },
      { id: 'step-3', label: 'Watch the loop close the gap', description: 'The controller asks for a replacement Pod. Actual returns to desired in the same tick.' },
      { id: 'step-4', label: 'Try a second failure', description: 'Enable a second failure to see the loop reconverging without any new human action.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'returns-to-desired',
        label: 'The actual state returns to the desired state after every drift event',
        check: (state) => {
          const s = state as { desired: number; actual: number };
          return s.actual === s.desired;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'the-control-loop': controlLoop,
    'self-healing-in-practice': selfHealing,
  },
  labs: {
    'reconciliation-simulator': reconciliationLab,
  },
  simulations: {
    'reconciliation-simulator': bindSimulation(reconciliationSimulation, renderReconciliationState),
  },
};
