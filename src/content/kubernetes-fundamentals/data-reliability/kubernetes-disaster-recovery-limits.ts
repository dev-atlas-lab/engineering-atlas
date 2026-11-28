import type { ConceptContentModule, LessonBody } from '../../types';

const clusterLossAndDrTiers: LessonBody = {
  learningObjectives: ['Compare cold backup-restore, warm standby, and active-active DR tiers for stateful apps'],
  sections: [
    {
      heading: 'Recovering when the whole cluster is gone',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['DR Tier', 'Mechanism', 'Typical RPO / RTO'],
          rows: [
            ['Cold (Backup & Restore)', 'GitOps provisions new cluster; restore tool restores manifests + off-cluster volume backups', 'RPO: minutes–hours · RTO: 30m–hours'],
            ['Warm Standby', 'Secondary cluster runs scaled-down workloads receiving asynchronous DB/WAL replication', 'RPO: seconds–minutes · RTO: minutes'],
            ['Active-Active', 'Multi-region database/app serving live traffic in multiple clusters simultaneously', 'RPO: ~0 · RTO: seconds (high complexity & cost)'],
          ],
        },
      ],
    },
  ],
};

const multiRegionDrTradeoffs: LessonBody = {
  learningObjectives: ['Identify Kubernetes-specific DR constraints around StorageClasses, CSI handles, and etcd'],
  sections: [
    {
      heading: 'Why PVs cannot simply "stretch" across regions',
      blocks: [
        {
          type: 'list',
          items: [
            'Cloud block volumes (EBS, Azure Managed Disk, GKE PD) are **single-AZ** resources; Kubernetes clusters generally cannot mount a block PV across regions due to speed-of-light latency and cloud API boundaries.',
            'Avoid restoring raw cluster-scoped `PersistentVolume` objects with hard-coded `volumeHandle` IDs from Region A into Region B — let dynamic provisioning or cross-region snapshot copies produce new Region B PVs.',
            'Rebuilding clusters declaratively via GitOps (Argo CD / Flux) + restoring only stateful data is usually cleaner and less error-prone than restoring stale full-cluster etcd snapshots across different infrastructure.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'For multi-region stateful systems, replicate at the **application/database layer** (or via managed regional cloud databases) rather than trying to stretch a single Kubernetes StatefulSet across continents.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'k8s-dr-kc-1',
      type: 'single-choice',
      prompt: 'A team wants zero-downtime disaster recovery if an entire AWS region fails, and proposes stretching one Kubernetes cluster across `us-east-1` and `eu-west-1` with a single StatefulSet mounting EBS volumes across regions. Why will this fail?',
      difficulty: 'intermediate',
      learningObjective: 'Identify Kubernetes-specific DR constraints around StorageClasses, CSI handles, and etcd',
      options: [
        { id: 'a', label: 'Cloud block PVs like EBS are zonal and cannot attach across regions (and cross-region etcd latency breaks control-plane consensus); use separate regional clusters with app/DB replication instead', correct: true, explanation: 'Correct — EBS volumes are pinned to a single availability zone, and cross-region etcd consensus fails or stalls under WAN latency.' },
        { id: 'b', label: 'Kubernetes Services only work inside a single availability zone', correct: false, explanation: 'Services span nodes within a cluster; the blocker here is zonal block storage and WAN latency on etcd.' },
        { id: 'c', label: 'StatefulSets are limited to 1 replica per region', correct: false, explanation: 'StatefulSets have no regional replica cap; the architectural boundary is storage locality and control-plane quorum.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'cluster-loss-and-dr-tiers': clusterLossAndDrTiers,
    'multi-region-dr-tradeoffs': multiRegionDrTradeoffs,
  },
  labs: {},
  simulations: {},
};
