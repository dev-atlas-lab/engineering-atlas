import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { schedulerWorkflowScene } from '../scenes';
import { schedulerSimulation } from '../simulations';
import { renderSchedulerState } from '../simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const howSchedulingWorks: LessonBody = {
  learningObjectives: [
    'Trace a Pod from Pending to a node assignment',
    'Explain filtering and scoring as two distinct phases',
  ],
  sections: [
    {
      heading: 'The scheduler\'s only job',
      blocks: [
        {
          type: 'paragraph',
          text: 'The scheduler does exactly one thing: it finds Pods with no node assigned and gives each one a nodeName. It does not run containers. It does not allocate resources on the node — that is the kubelet\'s job. It writes a single field, "pod.spec.nodeName", via the API Server, and that write is what tells the chosen node\'s kubelet to pick up the Pod.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The scheduler watches for Pending Pods on a long-lived watch connection, not a poll. The latency from "a Pod becomes schedulable" to "it has a nodeName" is usually milliseconds, not seconds.',
        },
      ],
    },
    {
      heading: 'Filter, then score',
      blocks: [
        {
          type: 'paragraph',
          text: 'For each unscheduled Pod, the scheduler runs a two-phase process over all available nodes.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Filtering (predicates): each node is checked against hard constraints — does it have enough free CPU and memory to satisfy the Pod\'s requests? Does it match nodeSelector? Does it tolerate the Pod\'s required taints? Any node that fails any predicate is removed from consideration.',
            'Scoring (priorities): each remaining node is scored by weighted priority functions — least-loaded (LeastAllocated), spread (prefer nodes with fewer Pods from the same service), image locality (prefer nodes that already have the image). Scores are summed; the highest wins.',
            'Binding: the scheduler writes nodeName onto the Pod. That is the entire output. The kubelet on that node sees the update and proceeds.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Scheduling is based on resource *requests*, not observed usage. A Pod that requests 100m CPU but actually uses 2000m is scheduled on the lower number — which is why over-committing requests is dangerous: the scheduler will pack the node as if everyone is using what they asked for.',
        },
      ],
    },
  ],
  visualization: schedulerWorkflowScene,
};

const whenNothingFits: LessonBody = {
  learningObjectives: ['Describe what happens when no node can run a Pod'],
  sections: [
    {
      heading: 'The Pod stays Pending',
      blocks: [
        {
          type: 'paragraph',
          text: 'If every candidate node fails the filter phase, the scheduler cannot bind the Pod. It does not pick "the closest" node and overload it. The Pod remains Pending. The scheduler emits an event ("Insufficient cpu", "No nodes available", …) and tries again the next time the cluster state changes.',
        },
        {
          type: 'paragraph',
          text: 'The scheduler is not giving up — it is waiting. If a node is added (by the cluster autoscaler, or manually), the scheduler will see it on its next watch event and retry. If another Pod is deleted, freeing up capacity, same thing. "Pending" is not a failure state; it is "waiting for the cluster to make room."',
        },
      ],
    },
    {
      heading: 'Preemption changes the picture',
      blocks: [
        {
          type: 'paragraph',
          text: 'If a Pending Pod has a higher priority (via priorityClass) than some Pod already on a node, the scheduler may preempt — evict — one or more lower-priority Pods to make room. The evicted Pods become Pending themselves and will be re-scheduled if possible. This is off by default for user Pods; cluster-level system Pods use it to guarantee they get scheduled.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'scheduler-kc-1',
      type: 'single-choice',
      prompt: 'A Pod requests 2 CPU but every node has at most 1.5 CPU free. What does the scheduler do?',
      difficulty: 'intermediate',
      learningObjective: 'Describe what happens when no node can run a Pod',
      options: [
        { id: 'a', label: 'The Pod stays Pending. No node passes the filter; the scheduler waits for the cluster to change', correct: true, explanation: 'Correct. The scheduler does not relax the request or pick a node that would be oversubscribed.' },
        { id: 'b', label: 'The scheduler picks the node with the most free CPU anyway', correct: false, explanation: 'This would violate the Pod\'s request. The scheduler does not do it.' },
        { id: 'c', label: 'The scheduler reduces the Pod\'s request to fit', correct: false, explanation: 'The scheduler never edits the Pod spec; it only binds a node.' },
      ],
    },
  ],
};

const schedulerLab: LabBody = {
  difficulty: 'beginner',
  estimatedTime: '15 minutes',
  description:
    'Define a Pod with CPU and memory requests, and watch the scheduler filter and score a fixed set of nodes before binding. Try values that exceed every node.',
  learningObjectives: [
    'Observe the filter-and-score process on a concrete, deterministic example',
    'Reproduce an Unschedulable Pod by over-requesting resources',
  ],
  prerequisites: [{ type: 'knowledge', label: 'How scheduling works', description: 'You should know what "filter" and "score" phases mean (prior lesson).' }],
  content: {
    simulationId: 'scheduler-simulator',
    instructions: [
      { id: 'step-1', label: 'Pick a reasonable Pod request', description: 'Start with 1 CPU / 2 GiB — small enough that multiple nodes can run it.' },
      { id: 'step-2', label: 'Advance through filtering', description: 'Watch each node be evaluated. Nodes that can\'t fit the Pod are filtered; the rest get a score.' },
      { id: 'step-3', label: 'Bind the Pod', description: 'The binding step picks the highest-scoring feasible node.' },
      { id: 'step-4', label: 'Try an unschedulable request', description: 'Set the request to 3 CPU and re-run — every node should be filtered, leaving the Pod Unschedulable.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'bound-or-unschedulable',
        label: 'The Pod reaches a definitive outcome — bound to one node, or marked Unschedulable',
        check: (state) => {
          const s = state as { chosenNodeId: string | null; unschedulable: boolean };
          return s.chosenNodeId !== null || s.unschedulable;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'how-scheduling-works': howSchedulingWorks,
    'when-nothing-fits': whenNothingFits,
  },
  labs: {
    'scheduler-simulator': schedulerLab,
  },
  simulations: {
    'scheduler-simulator': bindSimulation(schedulerSimulation, renderSchedulerState),
  },
};
