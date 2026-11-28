import type { ConceptContentModule, LessonBody } from '../../types';

const whatAPdbProtects: LessonBody = {
  learningObjectives: [
    'Distinguish voluntary from involuntary disruption',
    'Define a PDB with minAvailable or maxUnavailable',
  ],
  sections: [
    {
      heading: 'Only voluntary disruption',
      blocks: [
        {
          type: 'paragraph',
          text: 'A PodDisruptionBudget is a promise the API Server makes to Pod authors: no more than N replicas may be voluntarily disrupted at once, where "voluntary" means an action initiated by a controller or operator that goes through the API Server. Involuntary disruptions — node failure, kernel panic, network partition — are not governed by PDBs. PDBs cannot prevent crashes; they can prevent planned drains and rollouts from eating all your replicas at once.',
        },
        {
          type: 'comparisonTable',
          headers: ['Disruption source', 'Governed by PDB?'],
          rows: [
            ['kubectl drain / node upgrade', 'Yes'],
            ['API eviction (apps using evictions.policy/v1)', 'Yes'],
            ['Cluster Autoscaler scale-down', 'Yes'],
            ['Deployment rolling update', 'No — bounded by maxUnavailable on the Deployment itself, not PDB'],
            ['Node kernel panic', 'No (involuntary)'],
            ['Scheduler preemption', 'Best-effort only — preemption prefers to respect PDB but may breach it'],
          ],
        },
      ],
    },
    {
      heading: 'minAvailable or maxUnavailable, not both',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: web-pdb }
spec:
  minAvailable: 2          # at least 2 Pods must be available at all times
  selector:
    matchLabels: { app: web }`,
        },
        {
          type: 'list',
          items: [
            'minAvailable: 2 — at least 2 Pods must be Ready for a voluntary eviction to succeed.',
            'maxUnavailable: 1 — at most 1 Pod may be unavailable at a time.',
            'Both accept integers or percentages ("50%"). Percentages round UP for minAvailable, DOWN for maxUnavailable (toward preserving the promise).',
          ],
        },
      ],
    },
  ],
};

const pdbPitfalls: LessonBody = {
  learningObjectives: ['Avoid the common PDB traps'],
  sections: [
    {
      heading: 'The deadlock patterns',
      blocks: [
        {
          type: 'list',
          items: [
            'minAvailable: N on a Deployment with replicas: N. Any voluntary disruption is forever blocked; drains hang. Keep N < replicas.',
            'PDB selector matching more than one Deployment can produce surprising counts. Scope PDBs to one workload by matching labels unique to it.',
            'maxUnavailable: 0 is legal and means "no voluntary disruption ever." Rarely what the author intended; usually a leftover from paranoia.',
            'Removing a PDB does not re-evaluate pending evictions; kubectl drain re-requests the eviction, and only then does the PDB check pass.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The Pod eviction API returns 429 (Too Many Requests) when a PDB would be breached. Operators and CA retry eventually; look for that 429 in autoscaler logs when scale-down appears stuck.',
        },
      ],
    },
    {
      heading: 'A sane default',
      blocks: [
        {
          type: 'paragraph',
          text: 'For a Deployment with replicas=3 or more, start with maxUnavailable: 1 and raise only if the workload tolerates more. For stateful workloads where quorum matters (3-node etcd, Elasticsearch cluster), set maxUnavailable explicitly to the number quorum tolerates — typically 1 for a 3-node quorum.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-a-pdb-protects': whatAPdbProtects,
    'pdb-pitfalls': pdbPitfalls,
  },
  labs: {},
  simulations: {},
};
