import type { ConceptMeta } from '../../types';

export const schedulingDeepDive: ConceptMeta = {
  id: 'scheduling-deep-dive',
  title: 'Scheduling Deep Dive',
  description: 'How kube-scheduler picks a node for every Pod — the filter phase, the score phase, and the single API write that binds them.',
  status: 'available',
  learningObjectives: [
    'Describe the two-phase filter/score algorithm',
    'Explain why scheduling is one component with one job',
  ],
  prerequisites: ['scheduler'],
  relatedConcepts: ['scheduler', 'node-selectors', 'taints-and-tolerations'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'filter-and-score', title: 'Filter, Then Score', kind: 'concept' },
    { id: 'binding-and-unschedulable', title: 'Binding, Pending, and the Backoff Queue', kind: 'concept' },
  ],
  labs: [
    { id: 'scheduling-constraints-simulator', title: 'Scheduling Constraints Simulator', type: 'simulation' },
  ],
};

export const nodeSelectors: ConceptMeta = {
  id: 'node-selectors',
  title: 'Node Selectors',
  description: 'The simplest placement constraint — exact label match on nodes. A hard filter that cannot express preference.',
  status: 'available',
  learningObjectives: [
    'Use nodeSelector to pin Pods to a node class',
    'Identify the limitations that drive teams toward node affinity',
  ],
  prerequisites: ['scheduling-deep-dive'],
  relatedConcepts: ['node-affinity-and-anti-affinity', 'labels-and-selectors'],
  estimatedMinutes: 10,
  lessons: [
    { id: 'the-simple-constraint', title: 'The Simplest Placement Constraint', kind: 'concept' },
  ],
};

export const nodeAffinity: ConceptMeta = {
  id: 'node-affinity-and-anti-affinity',
  title: 'Node Affinity & Anti-affinity',
  description: 'A richer selector language than nodeSelector, with required and preferred flavors and set-based operators.',
  status: 'available',
  learningObjectives: [
    'Distinguish requiredDuringSchedulingIgnoredDuringExecution from preferredDuringSchedulingIgnoredDuringExecution',
    'Use operator In/NotIn/Exists/DoesNotExist/Gt/Lt to express rich node selection',
  ],
  prerequisites: ['node-selectors'],
  relatedConcepts: ['node-selectors', 'pod-affinity-and-anti-affinity', 'topology-spread-constraints'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'required-vs-preferred', title: 'Required vs Preferred', kind: 'concept' },
    { id: 'the-expression-language', title: 'The Match Expression Language', kind: 'concept' },
  ],
};

export const podAffinity: ConceptMeta = {
  id: 'pod-affinity-and-anti-affinity',
  title: 'Pod Affinity & Anti-affinity',
  description: 'Place Pods near or away from other Pods (by label) within a topology key — zone, host, rack.',
  status: 'available',
  learningObjectives: [
    'Co-locate Pods for latency with pod affinity',
    'Spread Pods across hosts or zones with pod anti-affinity',
    'Explain why these constraints are expensive to evaluate',
  ],
  prerequisites: ['node-affinity-and-anti-affinity'],
  relatedConcepts: ['topology-spread-constraints', 'labels-and-selectors'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'affinity-by-other-pods', title: 'Choosing a Node by What Already Runs On It', kind: 'concept' },
    { id: 'the-topology-key', title: 'The Role of topologyKey', kind: 'concept' },
  ],
};

export const taintsAndTolerations: ConceptMeta = {
  id: 'taints-and-tolerations',
  title: 'Taints & Tolerations',
  description: 'A node-side mechanism to repel Pods that do not explicitly tolerate the taint — the inverse of affinity.',
  status: 'available',
  learningObjectives: [
    'Distinguish NoSchedule, PreferNoSchedule, and NoExecute effects',
    'Use taints to dedicate nodes to a workload class',
    'Describe how built-in taints (node.kubernetes.io/not-ready, …) automate node condition reactions',
  ],
  prerequisites: ['node-affinity-and-anti-affinity'],
  relatedConcepts: ['scheduling-deep-dive', 'node-affinity-and-anti-affinity'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'the-three-effects', title: 'NoSchedule, PreferNoSchedule, NoExecute', kind: 'concept' },
    { id: 'automatic-taints', title: 'Automatic Taints for Node Conditions', kind: 'concept' },
  ],
};

export const priorityClasses: ConceptMeta = {
  id: 'priority-classes-and-preemption',
  title: 'Priority Classes & Preemption',
  description: 'Priority lets a higher-priority Pod evict (preempt) lower-priority Pods when the cluster is full.',
  status: 'available',
  learningObjectives: [
    'Attach a PriorityClass to a Pod',
    'Describe the preemption algorithm the scheduler runs',
    'Identify the two system-reserved priority classes',
  ],
  prerequisites: ['scheduling-deep-dive'],
  relatedConcepts: ['scheduling-deep-dive', 'pod-disruption-budget'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'priority-and-value', title: 'Priority, Value, and PodDisruptionBudgets', kind: 'concept' },
    { id: 'preemption-flow', title: 'How Preemption Actually Runs', kind: 'concept' },
  ],
};

export const topologySpread: ConceptMeta = {
  id: 'topology-spread-constraints',
  title: 'Topology Spread Constraints',
  description: 'A more predictable way than pod anti-affinity to say "spread my replicas evenly across zones / hosts / racks."',
  status: 'available',
  learningObjectives: [
    'Describe maxSkew and the three whenUnsatisfiable modes',
    'Explain why spread constraints replace most pod-anti-affinity use cases',
  ],
  prerequisites: ['pod-affinity-and-anti-affinity'],
  relatedConcepts: ['pod-affinity-and-anti-affinity', 'high-availability'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'spread-vs-anti-affinity', title: 'Spread vs Pod Anti-affinity', kind: 'concept' },
    { id: 'maxskew-and-whenunsat', title: 'maxSkew and whenUnsatisfiable', kind: 'concept' },
  ],
};
