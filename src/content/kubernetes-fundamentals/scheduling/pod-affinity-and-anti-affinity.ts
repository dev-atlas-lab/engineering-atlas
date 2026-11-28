import type { ConceptContentModule, LessonBody } from '../../types';

const affinityByOtherPods: LessonBody = {
  learningObjectives: [
    'Co-locate Pods for latency using pod affinity',
    'Spread Pods across nodes/zones using pod anti-affinity',
  ],
  sections: [
    {
      heading: 'Placement by what already runs there',
      blocks: [
        {
          type: 'paragraph',
          text: 'Unlike node affinity (which looks at node labels), pod affinity looks at *other Pods*. The constraint says "schedule me on a node where a Pod matching this label selector is already running" (affinity) or "where it is NOT running" (anti-affinity).',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels: { app: payments }
      topologyKey: kubernetes.io/hostname`,
        },
        {
          type: 'paragraph',
          text: 'The example above means: do not place this Pod on a node that already has a Pod with label app=payments. The classic use is to spread replicas of one Deployment across nodes so a single node failure cannot take out the whole workload.',
        },
      ],
    },
    {
      heading: 'Common patterns',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Goal', 'Direction', 'topologyKey'],
          rows: [
            ['Replicas of one workload on different nodes', 'podAntiAffinity (self)', 'kubernetes.io/hostname'],
            ['Replicas spread across zones', 'podAntiAffinity (self)', 'topology.kubernetes.io/zone'],
            ['Co-locate frontend with backend for low latency', 'podAffinity', 'kubernetes.io/hostname'],
            ['Dedicate a node to one tenant', 'podAntiAffinity (cross-tenant)', 'kubernetes.io/hostname'],
          ],
        },
      ],
    },
  ],
};

const theTopologyKey: LessonBody = {
  learningObjectives: [
    'Explain how topologyKey groups nodes into equivalence classes',
    'Describe why pod affinity is expensive to evaluate at scale',
  ],
  sections: [
    {
      heading: 'topologyKey partitions nodes',
      blocks: [
        {
          type: 'paragraph',
          text: 'The topologyKey is a node label. Nodes that share the value of that label form one topology — one host, one zone, one rack, one failure domain. "Must not co-locate at topologyKey" means "no two Pods of this selector may land in nodes sharing that key\'s value."',
        },
        {
          type: 'list',
          items: [
            'topologyKey: kubernetes.io/hostname — each node is its own topology. One Pod per node.',
            'topologyKey: topology.kubernetes.io/zone — each AZ is one topology. Spread across zones.',
            'topologyKey: topology.kubernetes.io/region — rarer; for multi-region clusters.',
          ],
        },
      ],
    },
    {
      heading: 'Why pod affinity is costly',
      blocks: [
        {
          type: 'paragraph',
          text: 'To evaluate pod affinity, the scheduler must list every running Pod that matches the label selector and check the topology of every candidate node. On clusters with thousands of nodes and tens of thousands of Pods, this inflates scheduling latency quickly. This is why pod anti-affinity with required semantics is one of the main reasons large clusters introduce scheduler extenders or move to PodTopologySpread (which uses summary counters per topology rather than full label-selector scans).',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Required pod anti-affinity at hostname granularity hard-caps your replica count to the node count. A Deployment of 50 replicas on a 20-node cluster will be permanently Unschedulable for the extra 30 — teams often hit this before they realise they did not actually need "required."',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'affinity-by-other-pods': affinityByOtherPods,
    'the-topology-key': theTopologyKey,
  },
  labs: {},
  simulations: {},
};
