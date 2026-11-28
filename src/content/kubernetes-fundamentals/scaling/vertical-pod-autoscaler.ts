import type { ConceptContentModule, LessonBody } from '../../types';

const whatVpaDoes: LessonBody = {
  learningObjectives: [
    'Describe the three VPA components',
    'Distinguish the three update modes',
  ],
  sections: [
    {
      heading: 'An add-on, not a core controller',
      blocks: [
        {
          type: 'paragraph',
          text: 'VPA is not in-tree. It is a CNCF project composed of three pieces: a Recommender (observes historical CPU/memory usage and computes recommendations), an Updater (evicts Pods whose current requests are far from the recommendation), and an Admission Plugin (rewrites new Pods\' requests to the recommendation at admission time).',
        },
        {
          type: 'comparisonTable',
          headers: ['updateMode', 'What the Updater does', 'Admission plugin does'],
          rows: [
            ['Off', 'Nothing (recommender still records)', 'Nothing — recommendations are viewable but not applied'],
            ['Initial', 'Nothing', 'Applies recommendation only to NEW Pods at creation'],
            ['Auto / Recreate', 'Evicts out-of-band Pods so they are recreated with new requests', 'Rewrites new Pods at creation'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Auto mode causes disruption — the Updater evicts Pods to apply changes, which is a full Pod restart. Respect PDBs, and avoid Auto on stateful or in-flight-sensitive workloads. Off or Initial is safer in most places.',
        },
      ],
    },
    {
      heading: 'In-place resize (newer alternative)',
      blocks: [
        {
          type: 'paragraph',
          text: 'Since 1.27 (beta in 1.33) Kubernetes supports in-place resize of container resources — editing `resources.requests` on a running Pod without restarting it. VPA\'s traditional eviction-and-recreate behavior is being supplanted by this where available. Check your cluster version before assuming Auto mode must restart Pods.',
        },
      ],
    },
  ],
};

const vpaVsHpa: LessonBody = {
  learningObjectives: ['Explain why VPA and HPA on the same metric conflict'],
  sections: [
    {
      heading: 'The direct conflict',
      blocks: [
        {
          type: 'paragraph',
          text: 'The HPA computes desiredReplicas from per-Pod CPU utilization, which is CPU use divided by CPU request. If VPA is also moving the CPU request, the denominator keeps changing, so the HPA\'s decisions become erratic. The upstream recommendation is: HPA and VPA on the same resource (CPU) at the same time is unsupported.',
        },
        {
          type: 'list',
          items: [
            'HPA on CPU + VPA on memory → fine. They move independent axes.',
            'HPA on a custom metric (requests/s) + VPA on CPU → fine. Scaling signal is decoupled from the resize signal.',
            'HPA on CPU + VPA on CPU → conflict. One of them must give up CPU.',
          ],
        },
      ],
    },
    {
      heading: 'When to use each',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Pattern', 'HPA', 'VPA'],
          rows: [
            ['Stateless, horizontally parallel', 'Yes (scale out under load)', 'Rarely — HPA handles it'],
            ['Stateful / single-replica', 'Hard (StatefulSets scale up more carefully)', 'Good fit — size the single replica right'],
            ['Spiky traffic with high per-request CPU', 'HPA on CPU or RPS', 'No'],
            ['Long-running workers with slowly growing memory footprint', 'HPA on queue depth', 'VPA on memory (Off mode for recommendations only; apply periodically)'],
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-vpa-does': whatVpaDoes,
    'vpa-vs-hpa': vpaVsHpa,
  },
  labs: {},
  simulations: {},
};
