import type { ConceptContentModule, LessonBody } from '../../types';

const priorityAndValue: LessonBody = {
  learningObjectives: [
    'Attach a PriorityClass to a Pod',
    'Describe how Pod priority interacts with other scheduler signals',
  ],
  sections: [
    {
      heading: 'Priority is an integer on the Pod',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every Pod has an integer `spec.priority` field, defaulting to 0. Higher means more important. Priority is set indirectly: a PriorityClass cluster-scoped object carries a name and a value; a Pod references the PriorityClass by name and admission mutates the Pod to carry the resulting integer.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata: { name: critical-platform }
value: 1000000
globalDefault: false
description: "Core platform services that must preempt lower-priority workloads."
---
apiVersion: v1
kind: Pod
metadata: { name: ingress-controller }
spec:
  priorityClassName: critical-platform
  containers: [...]`,
        },
      ],
    },
    {
      heading: 'Two system-reserved classes',
      blocks: [
        {
          type: 'list',
          items: [
            'system-cluster-critical — value 2,000,000,000. Reserved for add-ons that keep the cluster itself alive (CNI, kube-proxy where applicable, DNS).',
            'system-node-critical — value 2,000,001,000. The highest valid priority; used by node-essential DaemonSets that cannot be evicted.',
            'User PriorityClasses must keep below 1,000,000,000 — the admission controller enforces this.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Priority influences two things: the order in which the scheduler considers Pods out of its queue (higher first), and whether preemption is attempted (described in the next lesson). It does not influence scoring on nodes — a feasible node is still picked by the usual score plugins.',
        },
      ],
    },
  ],
};

const preemptionFlow: LessonBody = {
  learningObjectives: [
    'Describe the preemption algorithm step by step',
    'Explain how PodDisruptionBudgets interact with preemption',
  ],
  sections: [
    {
      heading: 'Preemption step by step',
      blocks: [
        {
          type: 'paragraph',
          text: 'When a Pod cannot be scheduled on any node, the scheduler asks: "could I make room by evicting lower-priority Pods somewhere?" This is the preemption path. It only runs when the Pod carries a priorityClassName with `preemptionPolicy: PreemptLowerPriority` (the default; `Never` disables).',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'For each node that failed filter, compute the set of lower-priority Pods on it whose removal would make this Pod fit.',
            'Pick the node where the total disruption (number of Pods, their priority, their PDB impact) is smallest.',
            'If no such node exists, the pending Pod stays Unschedulable.',
            'Set `nominatedNodeName` on the incoming Pod so other scheduler cycles can see what it is targeting.',
            'Delete the chosen victim Pods (respecting their terminationGracePeriodSeconds).',
            'The incoming Pod is re-queued. Next cycle, it will likely fit on the newly cleared node.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Preemption is best-effort, not transactional. Between the time the scheduler kills victims and the time it re-schedules the preemptor, another Pod could win the cleared space. This is rare in practice but is why preemption is not a strict guarantee.',
        },
      ],
    },
    {
      heading: 'PodDisruptionBudgets and preemption',
      blocks: [
        {
          type: 'paragraph',
          text: 'PDBs are considered during preemption but do not block it. The scheduler prefers not to breach a PDB (it ranks nodes where it would breach one lower), but when there is no other choice it will still evict and breach — on the theory that a high-priority pending Pod is more important than one more replica of a lower-priority workload. PDBs are hard only against voluntary disruptions (drain, API eviction); preemption is a scheduler-driven exception.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'priority-and-value': priorityAndValue,
    'preemption-flow': preemptionFlow,
  },
  labs: {},
  simulations: {},
};
