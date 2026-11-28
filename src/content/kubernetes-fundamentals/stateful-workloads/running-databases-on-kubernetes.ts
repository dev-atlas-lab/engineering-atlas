import type { ConceptContentModule, LessonBody } from '../../types';

const operatorPatternForStatefulApps: LessonBody = {
  learningObjectives: ['Identify the gap between StatefulSet primitives and database-level operations'],
  sections: [
    {
      heading: 'What StatefulSet does NOT know about your database',
      blocks: [
        {
          type: 'paragraph',
          text: 'StatefulSet knows about Pods, DNS names, and PVCs — it knows nothing about PostgreSQL replication slots, Raft quorum, primary failover, or shard rebalancing. If `db-0` (the primary) dies, StatefulSet restarts `db-0`; it does NOT promote `db-1` to primary or reconfigure clients.',
        },
        {
          type: 'list',
          items: [
            'Primary election & failover: requires application-level coordination (Patroni, Raft, Paxos) or a Kubernetes Operator (CloudNativePG, Strimzi, Vitess).',
            'Safe scale-down: StatefulSet blindly deletes the highest ordinal (`db-2`), even if `db-2` holds the only un-replicated copy of a shard or is currently the cluster leader unless an Operator or PreStop hook drains it first.',
            'Logical backups & major upgrades: `pg_upgrade` or snapshot quiescing require database-aware orchestration.',
          ],
        },
      ],
    },
  ],
};

const statefulStorageDesignTradeoffs: LessonBody = {
  learningObjectives: ['Evaluate storage and placement trade-offs for databases on Kubernetes'],
  sections: [
    {
      heading: 'Network block storage vs local NVMe',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Option', 'Pros', 'Cons / Risks'],
          rows: [
            ['Network Block CSI (EBS, Azure Disk, Ceph RBD)', 'Volume survives node loss and follows rescheduled Pod across nodes in the same zone', 'Network I/O latency; single-zone attachment; RWO attach/detach delay on failover'],
            ['Local NVMe PV + App Replication', 'Ultra-low latency, high IOPS, zero network storage tax', 'Volume dies with the node; requires application-level replication and Operator automation to rebuild lost replicas'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Combine StatefulSets with `podAntiAffinity` (or `topologySpreadConstraints`) and a `PodDisruptionBudget` (`minAvailable` / `maxUnavailable`) so voluntary node drains never knock out quorum.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'db-k8s-kc-1',
      type: 'single-choice',
      prompt: 'You run a 3-node replicated database on Kubernetes using local NVMe PersistentVolumes (`kubernetes.io/no-provisioner`). One worker node suffers permanent hardware failure. What happens when the StatefulSet recreates the lost Pod?',
      difficulty: 'intermediate',
      learningObjective: 'Evaluate storage and placement trade-offs for databases on Kubernetes',
      options: [
        { id: 'a', label: 'The Pod stays Pending because its local PV is pinned by nodeAffinity to the dead node; an Operator or admin must replace the PVC and resync from surviving replicas', correct: true, explanation: 'Correct — local PVs cannot detach and follow a Pod to another node; application-level replication must rebuild state onto a new local PV.' },
        { id: 'b', label: 'CSI automatically copies the NVMe blocks over the network to a healthy node', correct: false, explanation: 'Local PVs have no network replication layer; data recovery depends entirely on the database’s own replication or backups.' },
        { id: 'c', label: 'The Pod binds to another replica’s local PV on a surviving node', correct: false, explanation: 'Each replica has its own bound PV; it never steals another ordinal’s claim.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'operator-pattern-for-stateful-apps': operatorPatternForStatefulApps,
    'stateful-storage-design-tradeoffs': statefulStorageDesignTradeoffs,
  },
  labs: {},
  simulations: {},
};
