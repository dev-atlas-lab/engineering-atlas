import type { ConceptContentModule, LessonBody } from '../../types';

const identityAndOrdering: LessonBody = {
  learningObjectives: ['Explain what a StatefulSet provides that a Deployment does not'],
  sections: [
    {
      heading: 'Stable identity, ordered startup',
      blocks: [
        {
          type: 'paragraph',
          text: 'A StatefulSet is for workloads whose Pods need to be distinguishable from each other and to have persistent, stable identity across restarts. Database replicas, message queues, consensus-based systems — these cannot be treated as interchangeable like a stateless web server\'s Pods can.',
        },
        {
          type: 'comparisonTable',
          headers: ['Property', 'Deployment', 'StatefulSet'],
          rows: [
            ['Pod names', 'Random suffix (web-6c9-abc123)', 'Ordinal (db-0, db-1, db-2)'],
            ['Pod identity after restart', 'New name, new IP, not tracked', 'Same name, same storage, same DNS entry'],
            ['Startup order', 'Parallel', 'Strictly sequential (db-0, then db-1, then db-2)'],
            ['Scale-down order', 'Arbitrary', 'Reverse ordinal (db-2 first, then db-1, …)'],
            ['Per-Pod persistent storage', 'Not by default', 'Yes — each Pod has its own PVC via volumeClaimTemplates'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Each StatefulSet Pod also gets a stable DNS entry via a headless Service: db-0.db.default.svc.cluster.local. That hostname is how one replica addresses another, independent of IP changes, which is what makes replication topologies possible.',
        },
      ],
    },
  ],
};

const perPodStorage: LessonBody = {
  learningObjectives: ['Describe per-Pod persistent storage via volumeClaimTemplates'],
  sections: [
    {
      heading: 'One PVC per Pod, kept across restarts',
      blocks: [
        {
          type: 'paragraph',
          text: 'A StatefulSet\'s volumeClaimTemplates describes a PersistentVolumeClaim shape. Kubernetes materializes one PVC per Pod ordinal — db-0 gets data-db-0, db-1 gets data-db-1, and so on. If db-1 is deleted and re-scheduled to another node, it is reattached to data-db-1. The data moves with the identity.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Scaling a StatefulSet down does NOT delete the PVCs. This is deliberate: you probably didn\'t mean "throw away the database" when you ran kubectl scale. Cleaning up the PVCs is a separate, explicit step.',
        },
      ],
    },
    {
      heading: 'When not to use a StatefulSet',
      blocks: [
        {
          type: 'paragraph',
          text: 'StatefulSets are not a general-purpose replacement for Deployments. Ordered startup is costly — one Pod can delay all the others. If your workload does not need stable network identity or per-Pod persistent storage, a Deployment is simpler and faster. Reach for a StatefulSet only when the workload would break without the guarantees it provides.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'identity-and-ordering': identityAndOrdering,
    'statefulset-storage': perPodStorage,
  },
  labs: {},
  simulations: {},
};
