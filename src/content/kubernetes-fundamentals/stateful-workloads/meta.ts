import type { ConceptMeta } from '../../types';

export const statefulsetArchitecture: ConceptMeta = {
  id: 'statefulset-architecture',
  title: 'StatefulSet Architecture',
  description: 'How the StatefulSet controller pairs deterministic Pod ordinals, Headless Service DNS, and per-replica PVCs to support stateful distributed systems.',
  status: 'available',
  learningObjectives: [
    'Explain how a StatefulSet differs architecturally from a Deployment and ReplicaSet',
    'Describe the three guarantees StatefulSet maintains: identity, ordering, and stable storage',
  ],
  prerequisites: ['statefulset', 'persistent-volume-claims'],
  relatedConcepts: ['stable-network-identity', 'volumeclaimtemplates-and-per-replica-storage'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'sts-why-not-deployment', title: 'Why Deployments Break Stateful Systems', kind: 'concept' },
    { id: 'sts-controller-guarantees', title: 'The StatefulSet Controller Loop', kind: 'concept' },
  ],
  labs: [
    { id: 'statefulset-storage-simulator', title: 'StatefulSet Storage Simulator', type: 'simulation' },
  ],
};

export const stableNetworkIdentity: ConceptMeta = {
  id: 'stable-network-identity',
  title: 'Stable Network Identity and Headless Services',
  description: 'Ordinal Pod names combined with a ClusterIP: None Service give every replica a predictable DNS record that survives rescheduling.',
  status: 'available',
  learningObjectives: [
    'Construct the FQDN for a specific StatefulSet replica Pod',
    'Explain why a Headless Service (clusterIP: None) is required for peer-to-peer addressing',
  ],
  prerequisites: ['statefulset-architecture', 'coredns'],
  relatedConcepts: ['statefulset-architecture', 'ordered-deployment-and-termination'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'ordinal-identities', title: 'Deterministic Ordinal Naming', kind: 'concept' },
    { id: 'headless-service-dns', title: 'Headless Services and Peer DNS', kind: 'concept' },
  ],
};

export const orderedDeploymentAndTermination: ConceptMeta = {
  id: 'ordered-deployment-and-termination',
  title: 'Ordered Deployment and Termination',
  description: 'Sequential Pod creation and reverse-ordinal teardown, plus when podManagementPolicy: Parallel is safer or faster.',
  status: 'available',
  learningObjectives: [
    'Trace OrderedReady startup and reverse-ordinal termination',
    'Decide when to switch podManagementPolicy from OrderedReady to Parallel',
  ],
  prerequisites: ['statefulset-architecture'],
  relatedConcepts: ['statefulset-scaling-and-updates', 'readiness-probes'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'sequential-startup-and-teardown', title: 'Sequential Startup and Reverse Teardown', kind: 'concept' },
    { id: 'pod-management-policies', title: 'OrderedReady vs Parallel Management', kind: 'concept' },
  ],
};

export const volumeClaimTemplatesConcept: ConceptMeta = {
  id: 'volumeclaimtemplates-and-per-replica-storage',
  title: 'VolumeClaimTemplates and Per-Replica Storage',
  description: 'How volumeClaimTemplates generate dedicated PVCs per ordinal and why Kubernetes retains those claims across scale-down and deletion.',
  status: 'available',
  learningObjectives: [
    'Trace PVC naming and re-attachment across Pod rescheduling',
    'Configure persistentVolumeClaimRetentionPolicy intentionally',
  ],
  prerequisites: ['statefulset-architecture', 'persistent-volume-claims'],
  relatedConcepts: ['reclaim-policies', 'statefulset-scaling-and-updates'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'vct-mechanics', title: 'How volumeClaimTemplates Bind Ordinals to Storage', kind: 'concept' },
    { id: 'pvc-retention-policy', title: 'PVC Retention Across Scale-Down and Deletion', kind: 'concept' },
  ],
};

export const runningDatabasesOnKubernetes: ConceptMeta = {
  id: 'running-databases-on-kubernetes',
  title: 'Stateful Application and Database Patterns',
  description: 'What StatefulSet does NOT solve on its own: leader election, replication topology, schema migrations, and why operators exist.',
  status: 'available',
  learningObjectives: [
    'Identify the gap between StatefulSet primitives and database-level operations',
    'Evaluate storage and placement trade-offs for databases on Kubernetes',
  ],
  prerequisites: ['stable-network-identity', 'volumeclaimtemplates-and-per-replica-storage'],
  relatedConcepts: ['stateful-failure-and-recovery', 'backup-fundamentals'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'operator-pattern-for-stateful-apps', title: 'Where StatefulSet Stops and Operators Begin', kind: 'concept' },
    { id: 'stateful-storage-design-tradeoffs', title: 'Storage and Placement Design Trade-offs', kind: 'concept' },
  ],
};

export const statefulsetScalingAndUpdates: ConceptMeta = {
  id: 'statefulset-scaling-and-updates',
  title: 'StatefulSet Scaling and Rolling Updates',
  description: 'How StatefulSets scale one ordinal at a time and perform partitioned canary rollouts or manual OnDelete upgrades.',
  status: 'available',
  learningObjectives: [
    'Use spec.updateStrategy.rollingUpdate.partition for staged canary upgrades',
    'Explain why scaling a StatefulSet down can strand uncleaned PVCs',
  ],
  prerequisites: ['ordered-deployment-and-termination', 'volumeclaimtemplates-and-per-replica-storage'],
  relatedConcepts: ['stateful-failure-and-recovery', 'pod-disruption-budget'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'scaling-stateful-clusters', title: 'Scaling StatefulSets Safely', kind: 'concept' },
    { id: 'update-strategies-and-ondelete', title: 'RollingUpdate Partitions and OnDelete', kind: 'concept' },
  ],
};

export const statefulFailureAndRecovery: ConceptMeta = {
  id: 'stateful-failure-and-recovery',
  title: 'Stateful Failure and Recovery Semantics',
  description: 'At-most-one Pod semantics, why a partitioned node freezes StatefulSet recreation, and how to recover safely without split-brain corruption.',
  status: 'available',
  learningObjectives: [
    'Explain why StatefulSet enforces at-most-one semantics per ordinal',
    'Diagnose and safely recover a StatefulSet Pod stuck in Terminating on a dead node',
  ],
  prerequisites: ['statefulset-scaling-and-updates'],
  relatedConcepts: ['node-failure-and-volume-recovery', 'multi-attach-and-rwo-constraints'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'at-most-one-semantics', title: 'At-Most-One Semantics and Split-Brain Prevention', kind: 'concept' },
    { id: 'stuck-terminating-stateful-pods', title: 'Recovering Stuck Terminating Pods Safely', kind: 'concept' },
  ],
};
