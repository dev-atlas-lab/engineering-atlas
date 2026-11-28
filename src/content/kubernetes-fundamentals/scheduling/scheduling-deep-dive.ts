import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { schedulerConstraintsScene } from '../operations-scenes';
import { schedulingConstraintsSimulation } from '../operations-simulations';
import { renderSchedulingState } from '../operations-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const filterAndScore: LessonBody = {
  learningObjectives: [
    'Describe the two-phase filter/score algorithm',
    'Enumerate the built-in plugins that run in each phase',
  ],
  sections: [
    {
      heading: 'One Pod at a time, one write at the end',
      blocks: [
        {
          type: 'paragraph',
          text: 'kube-scheduler watches Pods with no `spec.nodeName` set. For each such Pod it performs a two-phase decision — filter then score — and emits exactly one API write when it is done: a Binding that sets nodeName. Everything else (pulling images, starting containers) is the kubelet\'s job.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Filter (predicate plugins): each plugin either accepts or rejects a node. A node that is rejected by any plugin is dropped. Common filters: NodeResourcesFit (requests fit), NodeAffinity, VolumeBinding, PodAffinity, TaintToleration, NodeUnschedulable.',
            'Score (priority plugins): each surviving node gets a numeric score from every enabled plugin. Scores are weighted and summed. Common scorers: LeastAllocated (prefer less loaded nodes), BalancedAllocation (prefer nodes where CPU and memory utilization are balanced), ImageLocality (prefer nodes that already have the image), InterPodAffinity, PodTopologySpread.',
            'Select: the node with the highest total score is chosen. Ties are broken by a stable hash of the node name — deterministic, not random.',
            'Bind: the scheduler calls a small Binding API that sets `spec.nodeName`.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Scheduling is deliberately single-threaded per scheduler replica. Running multiple active schedulers against the same Pod set would require distributed coordination to prevent conflicting placements; instead, HA deployments use leader election so only one replica is active.',
        },
      ],
    },
    {
      heading: 'Plugins run in a defined order',
      blocks: [
        {
          type: 'paragraph',
          text: 'Filter plugins run sequentially, with cheaper predicates first. The moment one rejects a node, remaining filters do not run for that node — the scheduler is optimised to reject early. Score plugins all run (every surviving node is scored by every plugin) because the final rank depends on the sum.',
        },
      ],
    },
  ],
  visualization: schedulerConstraintsScene,
  knowledgeCheck: [
    {
      id: 'sched-kc-1',
      type: 'single-choice',
      prompt: 'Why does every score plugin always run against every surviving node, while filter plugins stop early?',
      difficulty: 'intermediate',
      learningObjective: 'Describe the two-phase filter/score algorithm',
      options: [
        { id: 'a', label: 'Filter plugins are predicates; one rejection eliminates the node. Score plugins contribute to a sum; all must run to compute it.', correct: true, explanation: 'Correct. Filter is OR-over-rejections; score is a weighted sum of signals.' },
        { id: 'b', label: 'Score plugins must run because the scheduler needs a random tiebreaker', correct: false, explanation: 'Tie-breaking is deterministic (node-name hash), not random.' },
        { id: 'c', label: 'Filter plugins are more expensive so they are optimised harder', correct: false, explanation: 'Filter plugins are cheaper in general; the real reason is predicate semantics.' },
      ],
    },
  ],
};

const bindingAndUnschedulable: LessonBody = {
  learningObjectives: [
    'Describe what happens when every node is filtered out',
    'Explain the backoff queue and why repeated scheduling attempts are paced',
  ],
  sections: [
    {
      heading: 'The Unschedulable path',
      blocks: [
        {
          type: 'paragraph',
          text: 'If every node fails filtering, the scheduler marks the Pod with a PodScheduled=False condition (reason: Unschedulable). The Pod stays Pending. The scheduler puts it on an internal backoff queue — it will try again, but not every tick.',
        },
        {
          type: 'list',
          items: [
            'Backoff starts at 1s and doubles up to 10s per Pod. A Pod that has been unschedulable for a long time is not re-evaluated on every scheduler iteration.',
            'Any cluster change that could help the Pod (a node added, a label changed, a Pod with blocking anti-affinity removed) moves the Pod out of backoff immediately.',
            'The event message on the Pod is the single best place to see why — kubectl describe pod lists every filter plugin that rejected every node.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          code: `$ kubectl get pods
NAME    READY   STATUS    AGE
web-0   0/1     Pending   2m

$ kubectl describe pod web-0 | grep -A5 Events
Events:
  Warning  FailedScheduling   kube-scheduler   0/5 nodes available:
    3 node(s) had untolerated taint {dedicated: gpu};
    2 Insufficient cpu.`,
        },
      ],
    },
    {
      heading: 'Who fixes it',
      blocks: [
        {
          type: 'paragraph',
          text: 'Nothing in the base scheduler adds nodes. If the cluster has no feasible node, the Pod stays Pending indefinitely unless the Cluster Autoscaler is installed and running — it watches for unschedulable Pods and provisions new nodes that would satisfy them.',
        },
      ],
    },
  ],
};

const schedulingLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Submit Pods with different scheduling constraints against four worker nodes. Observe which nodes are filtered out, how survivors are scored, and what makes a Pod unschedulable.',
  learningObjectives: [
    'See filter/score in action with real constraint combinations',
    'Diagnose an Unschedulable Pod and identify the relaxing constraint',
  ],
  prerequisites: [
    { type: 'knowledge', label: 'Node labels and taints', description: 'You should know how labels and taints work as prior concepts.' },
  ],
  content: {
    simulationId: 'scheduling-constraints-simulator',
    instructions: [
      { id: 'step-1', label: 'Baseline Pod', description: 'Submit a 1 CPU / 2 GiB Pod with no extra constraints. Multiple nodes are feasible; the least-loaded wins.' },
      { id: 'step-2', label: 'Require GPU', description: 'Enable nodeSelector gpu=true. Only node-c passes — but it has a NoSchedule taint, so without a toleration the Pod is Unschedulable.' },
      { id: 'step-3', label: 'Tolerate the taint', description: 'Add the dedicated=gpu toleration. Node-c becomes feasible and is chosen.' },
      { id: 'step-4', label: 'Prefer a zone (soft)', description: 'Set preferZone=zone-2 with no other constraints. Scoring now favors zone-2 nodes.' },
      { id: 'step-5', label: 'Cross the capacity cliff', description: 'Request 4 CPU with GPU required. Only node-c can fit it; without toleration, nothing can.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'bound-or-unschedulable',
        label: 'The scheduler reaches a deterministic outcome (bound or unschedulable)',
        check: (state) => {
          const s = state as { phase: string; chosenNodeId: string | null; unschedulable: boolean };
          return s.phase === 'bound' && (s.unschedulable || s.chosenNodeId !== null);
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'filter-and-score': filterAndScore,
    'binding-and-unschedulable': bindingAndUnschedulable,
  },
  labs: {
    'scheduling-constraints-simulator': schedulingLab,
  },
  simulations: {
    'scheduling-constraints-simulator': bindSimulation(schedulingConstraintsSimulation, renderSchedulingState),
  },
};
