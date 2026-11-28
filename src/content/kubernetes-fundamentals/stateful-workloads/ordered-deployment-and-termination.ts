import type { ConceptContentModule, LessonBody } from '../../types';

const sequentialStartupAndTeardown: LessonBody = {
  learningObjectives: ['Trace OrderedReady startup and reverse-ordinal termination'],
  sections: [
    {
      heading: 'Strict ordering gated by Readiness probes',
      blocks: [
        {
          type: 'paragraph',
          text: 'Under the default `podManagementPolicy: OrderedReady`, the StatefulSet controller advances one ordinal at a time. It creates `db-0`, waits until `db-0` is both `Running` AND `Ready` (passing its readinessProbe), and only then creates `db-1`. During scale-down or StatefulSet deletion, it terminates in reverse order (`db-2`, waits for full termination, then `db-1`, then `db-0`).',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'If `db-0` fails its readinessProbe (for example due to corrupt config or missing seed data), `db-1` and `db-2` are NEVER created under OrderedReady. Always separate startup/liveness failures from cluster-quorum dependencies.',
        },
      ],
    },
  ],
};

const podManagementPolicies: LessonBody = {
  learningObjectives: ['Decide when to switch podManagementPolicy from OrderedReady to Parallel'],
  sections: [
    {
      heading: 'OrderedReady vs Parallel',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Policy', 'Startup / Scale-Down Behavior', 'Best Fit'],
          rows: [
            ['OrderedReady (default)', 'Creates `0 → N-1` sequentially; deletes `N-1 → 0` sequentially, waiting for Ready/Terminated at each step', 'Primary-replica topologies where `pod-0` must initialize first'],
            ['Parallel', 'Creates and deletes all Pods simultaneously while still preserving ordinal names, DNS, and per-Pod PVCs', 'Peer-consensus clusters (etcd, Cassandra, CockroachDB) that elect leaders dynamically and recover faster in parallel'],
          ],
        },
        {
          type: 'paragraph',
          text: '`podManagementPolicy` only affects Pod creation/deletion ordering — it does NOT disable stable ordinals, Headless DNS, or per-ordinal PVCs. Note that `spec.podManagementPolicy` is immutable after StatefulSet creation.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'ordered-kc-1',
      type: 'single-choice',
      prompt: 'A StatefulSet `cache` (`replicas: 5`) uses `podManagementPolicy: OrderedReady`. You scale it down to `replicas: 2`. In what order are Pods terminated?',
      difficulty: 'beginner',
      learningObjective: 'Trace OrderedReady startup and reverse-ordinal termination',
      options: [
        { id: 'a', label: 'cache-4 terminates completely first, then cache-3, then cache-2', correct: true, explanation: 'Correct — OrderedReady terminates strictly in reverse ordinal order, waiting for each Pod to terminate before deleting the next.' },
        { id: 'b', label: 'cache-0, cache-1, and cache-2 are deleted first to keep higher ordinals', correct: false, explanation: 'Higher ordinals are always removed first so lower-ordinal leaders/primaries stay untouched.' },
        { id: 'c', label: 'All three excess Pods (2, 3, 4) are deleted simultaneously', correct: false, explanation: 'Simultaneous deletion only happens with `podManagementPolicy: Parallel`.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'sequential-startup-and-teardown': sequentialStartupAndTeardown,
    'pod-management-policies': podManagementPolicies,
  },
  labs: {},
  simulations: {},
};
