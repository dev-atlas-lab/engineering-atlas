import type { ConceptContentModule, LessonBody } from '../../types';

const spreadVsAntiAffinity: LessonBody = {
  learningObjectives: [
    'Compare topology spread with pod anti-affinity',
    'Explain why spread handles imbalance rather than rejecting placements',
  ],
  sections: [
    {
      heading: 'Spread, not exclusion',
      blocks: [
        {
          type: 'paragraph',
          text: 'Pod anti-affinity is a predicate: "no two matching Pods may share a topology." It is binary, and once the first Pod per topology is placed, further Pods can only land in the remaining topologies. Topology spread is a scoring constraint: "the counts across topologies must stay within maxSkew of each other." It penalises imbalance, it does not forbid co-location.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: ScheduleAnyway
  labelSelector:
    matchLabels: { app: web }`,
        },
        {
          type: 'comparisonTable',
          headers: ['Property', 'podAntiAffinity (required)', 'topologySpreadConstraints'],
          rows: [
            ['Semantics', 'Reject nodes that violate', 'Score / optionally reject'],
            ['Hits scheduler limits at scale', 'Yes (label-selector scan per Pod)', 'No (summary counters per topology)'],
            ['Handles imbalance', 'Only through filtering; new topologies only', 'Explicitly, via maxSkew'],
            ['Replica count may exceed topology count', 'No (hard-caps at topology count)', 'Yes, as long as skew bound holds'],
          ],
        },
      ],
    },
  ],
};

const maxSkewAndWhenUnsat: LessonBody = {
  learningObjectives: ['Configure maxSkew and whenUnsatisfiable for the common HA cases'],
  sections: [
    {
      heading: 'maxSkew explained',
      blocks: [
        {
          type: 'paragraph',
          text: 'maxSkew = max(count across topologies) − min(count across topologies). Picking a node that would push skew above the limit is either filtered (whenUnsatisfiable: DoNotSchedule) or scored low (whenUnsatisfiable: ScheduleAnyway). The counter is over Pods matching the labelSelector.',
        },
        {
          type: 'comparisonTable',
          headers: ['Skew currently', 'maxSkew=1 and new Pod would land in topology A', 'Action'],
          rows: [
            ['A=1, B=1, C=1', 'Lands in A → skew becomes A=2,B=1,C=1 = skew 1', 'Allowed'],
            ['A=1, B=2, C=1', 'Lands in A → A=2,B=2,C=1 = skew 1', 'Allowed'],
            ['A=1, B=2, C=1', 'Lands in B → A=1,B=3,C=1 = skew 2', 'Disallowed (DoNotSchedule) or scored low (ScheduleAnyway)'],
          ],
        },
      ],
    },
    {
      heading: 'Choosing the mode',
      blocks: [
        {
          type: 'list',
          items: [
            'DoNotSchedule — strict: spread or stay Pending. Use when your SLO really depends on multi-zone presence and you prefer an Unschedulable Pod to a lopsided placement.',
            'ScheduleAnyway — advisory: the scheduler tries to spread, but places the Pod anyway if spread is impossible. Use for best-effort HA that should not block rollouts during partial zone outages.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Combine topology spread at zone level (DoNotSchedule for HA) with spread at hostname level (ScheduleAnyway for packing efficiency). This gives strong cross-zone guarantees while allowing the scheduler to make reasonable per-host packing choices.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'spread-vs-anti-affinity': spreadVsAntiAffinity,
    'maxskew-and-whenunsat': maxSkewAndWhenUnsat,
  },
  labs: {},
  simulations: {},
};
