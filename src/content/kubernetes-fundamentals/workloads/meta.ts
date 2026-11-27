// Eager metadata for the Kubernetes Workloads category.

import type { ConceptMeta } from '../../types';

export const pod: ConceptMeta = {
  id: 'pod',
  title: 'Pod',
  description: 'The smallest deployable unit — one or more containers that share a network namespace and storage volumes, scheduled together on one node.',
  status: 'available',
  learningObjectives: [
    'Explain why Kubernetes schedules Pods rather than individual containers',
    'Describe what containers in a Pod share, and what stays per-container',
    'Trace a Pod through its phases: Pending, Running, Succeeded or Failed',
  ],
  prerequisites: ['kubernetes-cluster-architecture'],
  relatedConcepts: ['multi-container-pods', 'replicaset', 'scheduler'],
  estimatedMinutes: 30,
  lessons: [
    { id: 'what-a-pod-is', title: 'What a Pod Is and Why', kind: 'concept' },
    { id: 'pod-lifecycle', title: 'The Pod Lifecycle', kind: 'concept' },
  ],
};

export const multiContainerPods: ConceptMeta = {
  id: 'multi-container-pods',
  title: 'Multi-container Pods',
  description: 'Patterns where more than one container runs in the same Pod — sidecar, init, adapter, and ambassador — and when each is the right call.',
  status: 'available',
  learningObjectives: [
    'Identify the sidecar, init, and adapter patterns',
    'Explain when multiple containers belong in one Pod and when they do not',
  ],
  prerequisites: ['pod'],
  relatedConcepts: ['pod'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'sidecar-and-init', title: 'Sidecar, Init, Adapter: Multiple Containers, One Pod', kind: 'concept' },
  ],
};

export const replicaSet: ConceptMeta = {
  id: 'replicaset',
  title: 'ReplicaSet',
  description: 'The controller that keeps a specified number of identical Pods running — the mechanism behind self-healing.',
  status: 'available',
  learningObjectives: [
    'Describe how a ReplicaSet uses a label selector to track its Pods',
    'Trace what happens when a Pod managed by a ReplicaSet is deleted or fails',
    'Explain why ReplicaSets are almost never created directly',
  ],
  prerequisites: ['pod', 'kubernetes-reconciliation-loop'],
  relatedConcepts: ['deployment', 'controller-manager', 'labels-and-selectors'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'how-a-replicaset-works', title: 'How a ReplicaSet Maintains Count', kind: 'concept' },
    { id: 'replicaset-ownership', title: 'Ownership and Why You Should Not Use ReplicaSets Directly', kind: 'concept' },
  ],
};

export const deployment: ConceptMeta = {
  id: 'deployment',
  title: 'Deployment',
  description: 'The higher-level controller for stateless workloads — manages ReplicaSets to roll out, roll back, and scale Pods safely.',
  status: 'available',
  learningObjectives: [
    'Explain the relationship between Deployment, ReplicaSet, and Pod',
    'Describe the rolling update strategy (maxSurge, maxUnavailable)',
    'Trace a rollout, a rollback, and a scale operation through the object hierarchy',
  ],
  prerequisites: ['replicaset'],
  relatedConcepts: ['replicaset', 'pod', 'service'],
  estimatedMinutes: 35,
  lessons: [
    { id: 'deployment-over-replicaset', title: 'Deployment: One Level Up From ReplicaSet', kind: 'concept' },
    { id: 'rolling-updates-and-rollbacks', title: 'Rolling Updates and Rollbacks', kind: 'concept' },
  ],
  labs: [
    { id: 'deployment-scaling-simulator', title: 'Deployment Scaling Simulator', type: 'simulation' },
  ],
};

export const statefulSet: ConceptMeta = {
  id: 'statefulset',
  title: 'StatefulSet',
  description: 'The controller for workloads that need stable identities and stable per-Pod storage — databases, queues, distributed systems.',
  status: 'available',
  learningObjectives: [
    'Explain what a StatefulSet provides that a Deployment does not',
    'Describe stable network identity, ordered startup, and per-Pod persistent volumes',
    'Identify when a StatefulSet is appropriate and when it is overkill',
  ],
  prerequisites: ['deployment'],
  relatedConcepts: ['deployment', 'pod'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'identity-and-ordering', title: 'Stable Identity and Ordered Startup', kind: 'concept' },
    { id: 'statefulset-storage', title: 'Per-Pod Persistent Storage', kind: 'concept' },
  ],
};

export const daemonSet: ConceptMeta = {
  id: 'daemonset',
  title: 'DaemonSet',
  description: 'The controller that runs exactly one copy of a Pod on every (matching) node — the pattern for node-level agents.',
  status: 'available',
  learningObjectives: [
    'Explain the "one Pod per node" guarantee',
    'Give concrete examples: log collectors, CNI plugins, node exporters',
  ],
  prerequisites: ['pod', 'worker-nodes'],
  relatedConcepts: ['pod', 'worker-nodes'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'one-pod-per-node', title: 'One Pod per Node, by Design', kind: 'concept' },
  ],
};

export const jobAndCronJob: ConceptMeta = {
  id: 'job-and-cronjob',
  title: 'Job and CronJob',
  description: 'Controllers for run-to-completion workloads: a Job runs Pods until a target number succeed; a CronJob creates Jobs on a schedule.',
  status: 'available',
  learningObjectives: [
    'Distinguish run-to-completion workloads from long-running ones',
    'Explain completions, parallelism, and backoffLimit',
    'Describe how a CronJob creates Jobs at scheduled times',
  ],
  prerequisites: ['pod'],
  relatedConcepts: ['pod', 'deployment'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'jobs-for-batch-work', title: 'Jobs: Run Pods Until They Finish', kind: 'concept' },
    { id: 'cronjobs-on-a-schedule', title: 'CronJobs on a Schedule', kind: 'concept' },
  ],
};
