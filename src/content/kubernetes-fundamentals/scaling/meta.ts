import type { ConceptMeta } from '../../types';

export const horizontalPodAutoscaler: ConceptMeta = {
  id: 'horizontal-pod-autoscaler',
  title: 'Horizontal Pod Autoscaler (HPA)',
  description: 'The controller that changes a workload\'s replica count based on observed metrics against a target.',
  status: 'available',
  learningObjectives: [
    'Describe the HPA desired-replicas algorithm',
    'Explain the role of the Metrics Server and the custom/external metrics APIs',
    'Tune stabilization windows to avoid thrash',
  ],
  prerequisites: ['deployment', 'cpu-requests-and-limits'],
  relatedConcepts: ['vertical-pod-autoscaler', 'cluster-autoscaler', 'pod-disruption-budget'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'hpa-algorithm', title: 'The HPA Algorithm', kind: 'concept' },
    { id: 'metrics-sources', title: 'Resource, Custom, and External Metrics', kind: 'concept' },
    { id: 'stabilization-and-behavior', title: 'Stabilization and the behavior Field', kind: 'concept' },
  ],
  labs: [
    { id: 'hpa-scaling-simulator', title: 'HPA Scaling Simulator', type: 'simulation' },
  ],
};

export const verticalPodAutoscaler: ConceptMeta = {
  id: 'vertical-pod-autoscaler',
  title: 'Vertical Pod Autoscaler (VPA)',
  description: 'A controller (and admission webhook) that recommends or applies updated CPU/memory requests to Pods, based on historical usage.',
  status: 'available',
  learningObjectives: [
    'Describe the three VPA update modes (Off, Initial, Auto)',
    'Explain why VPA and HPA on the same metric conflict',
  ],
  prerequisites: ['horizontal-pod-autoscaler'],
  relatedConcepts: ['horizontal-pod-autoscaler', 'cpu-requests-and-limits'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'what-vpa-does', title: 'Recommender, Updater, Admission', kind: 'concept' },
    { id: 'vpa-vs-hpa', title: 'When VPA and HPA Collide', kind: 'concept' },
  ],
};

export const clusterAutoscaler: ConceptMeta = {
  id: 'cluster-autoscaler',
  title: 'Cluster Autoscaler',
  description: 'An out-of-tree controller that adds and removes Nodes based on Pod scheduling demand — scale-out when Pods are Unschedulable, scale-in when Nodes are under-utilised.',
  status: 'available',
  learningObjectives: [
    'Describe how the autoscaler reacts to Unschedulable Pods',
    'Explain the scale-down criteria and the Pods that block it',
  ],
  prerequisites: ['scheduling-deep-dive', 'horizontal-pod-autoscaler'],
  relatedConcepts: ['horizontal-pod-autoscaler', 'scheduling-deep-dive'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'scale-up-trigger', title: 'Scale-up: Unschedulable Pods', kind: 'concept' },
    { id: 'scale-down-criteria', title: 'Scale-down and the Pods That Block It', kind: 'concept' },
  ],
};

export const podDisruptionBudget: ConceptMeta = {
  id: 'pod-disruption-budget',
  title: 'Pod Disruption Budget',
  description: 'A guard against voluntary disruptions: minAvailable or maxUnavailable Pods during drains, rollouts initiated via eviction, and similar operator actions.',
  status: 'available',
  learningObjectives: [
    'Define a PDB with minAvailable and maxUnavailable',
    'Distinguish voluntary from involuntary disruption',
    'Explain why PDBs do not block preemption or node failures',
  ],
  prerequisites: ['deployment'],
  relatedConcepts: ['high-availability', 'cluster-autoscaler', 'priority-classes-and-preemption'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'what-a-pdb-protects', title: 'Voluntary vs Involuntary Disruption', kind: 'concept' },
    { id: 'pdb-pitfalls', title: 'PDB Pitfalls and Patterns', kind: 'concept' },
  ],
};

export const highAvailability: ConceptMeta = {
  id: 'kubernetes-high-availability',
  title: 'High Availability',
  description: 'The patterns that make a workload survive node, zone, and control-plane failures: spread, PDBs, HA control plane, and anti-affinity.',
  status: 'available',
  learningObjectives: [
    'Describe HA at the workload level (Pod spread, PDB)',
    'Describe HA at the control plane (stacked etcd, HA API Server)',
  ],
  prerequisites: ['topology-spread-constraints', 'pod-disruption-budget'],
  relatedConcepts: ['topology-spread-constraints', 'pod-disruption-budget', 'etcd'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'workload-ha', title: 'Workload-Level HA', kind: 'concept' },
    { id: 'control-plane-ha', title: 'Control-Plane HA', kind: 'concept' },
  ],
};

export const replicationAndRecovery: ConceptMeta = {
  id: 'replication-and-failure-recovery',
  title: 'Replication and Failure Recovery',
  description: 'How replica-based controllers recover from Pod and node failures — what runs, what fails over, and how fast.',
  status: 'available',
  learningObjectives: [
    'Order the events from node failure to Pod re-scheduling',
    'Compute the tail recovery time on default settings',
  ],
  prerequisites: ['kubernetes-high-availability'],
  relatedConcepts: ['kubernetes-high-availability', 'taints-and-tolerations', 'kubernetes-reconciliation-loop'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'the-node-failure-timeline', title: 'Node Failure Timeline', kind: 'concept' },
    { id: 'stateful-recovery-notes', title: 'Statefulness Changes Everything', kind: 'concept' },
  ],
};
