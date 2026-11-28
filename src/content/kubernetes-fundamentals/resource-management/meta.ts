import type { ConceptMeta } from '../../types';

export const cpuRequestsLimits: ConceptMeta = {
  id: 'cpu-requests-and-limits',
  title: 'CPU Requests & Limits',
  description: 'How CPU requests reserve capacity and how CPU limits are enforced by CFS quota in the kernel — over-limit is compressible (throttle), not fatal.',
  status: 'available',
  learningObjectives: [
    'Describe the two different jobs of requests and limits',
    'Convert between millicores and fractional cores',
    'Explain CFS quota and the 100ms default period',
  ],
  prerequisites: ['resource-requests-and-limits'],
  relatedConcepts: ['memory-requests-and-limits', 'resource-qos-classes', 'cpu-throttling'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'cpu-request-is-reservation', title: 'Request Reserves, Limit Caps', kind: 'concept' },
    { id: 'cpu-over-limit-throttle', title: 'What Happens Over the Limit', kind: 'concept' },
  ],
  labs: [
    { id: 'resource-management-simulator', title: 'Resource Management Simulator', type: 'simulation' },
  ],
};

export const memoryRequestsLimits: ConceptMeta = {
  id: 'memory-requests-and-limits',
  title: 'Memory Requests & Limits',
  description: 'Memory is uncompressible: over-limit is OOMKill. The requests field steers the scheduler; the limit is a hard kill cap.',
  status: 'available',
  learningObjectives: [
    'Describe why memory and CPU limits behave fundamentally differently',
    'Name the memory units (Mi, Gi, M, G) and the mistake they frequently cause',
  ],
  prerequisites: ['cpu-requests-and-limits'],
  relatedConcepts: ['oomkilled', 'resource-qos-classes'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'memory-is-uncompressible', title: 'Why Memory Limits Kill', kind: 'concept' },
    { id: 'units-and-common-mistakes', title: 'Memory Units and Common Traps', kind: 'concept' },
  ],
};

export const resourceQosClasses: ConceptMeta = {
  id: 'resource-qos-classes',
  title: 'Resource QoS Classes',
  description: 'Guaranteed, Burstable, and BestEffort are derived from how requests and limits are set — not a field. Drives eviction order and OOM scoring.',
  status: 'available',
  learningObjectives: [
    'Derive the QoS class from a container spec',
    'Describe how QoS class affects eviction order under node pressure',
  ],
  prerequisites: ['cpu-requests-and-limits', 'memory-requests-and-limits'],
  relatedConcepts: ['oomkilled', 'cpu-throttling'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'qos-is-derived', title: 'QoS Is Derived, Not Declared', kind: 'concept' },
    { id: 'qos-and-eviction', title: 'QoS and the Eviction Ladder', kind: 'concept' },
  ],
};

export const oomKilled: ConceptMeta = {
  id: 'oomkilled',
  title: 'OOMKilled',
  description: 'The container-level failure when a container exceeds its memory limit or the node runs out of memory. Caused by the kernel OOM-killer, not the kubelet.',
  status: 'available',
  learningObjectives: [
    'Distinguish container-limit OOMKills from node-pressure OOMKills',
    'Diagnose OOMKilled from containerStatuses and node events',
  ],
  prerequisites: ['memory-requests-and-limits'],
  relatedConcepts: ['memory-requests-and-limits', 'resource-qos-classes'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'who-kills-and-why', title: 'Who Kills, and Why', kind: 'concept' },
    { id: 'diagnosing-oom', title: 'Diagnosing an OOMKill', kind: 'concept' },
  ],
};

export const cpuThrottling: ConceptMeta = {
  id: 'cpu-throttling',
  title: 'CPU Throttling',
  description: 'The in-kernel pacing of CPU usage when a container exceeds its CPU limit — slow, not killed. Common and often harmful.',
  status: 'available',
  learningObjectives: [
    'Describe how CFS quota and period interact',
    'Explain why some apps misbehave badly under throttling (latency spikes, timeouts)',
    'Name the kernel bug that overthrottled early 1.x containerd setups',
  ],
  prerequisites: ['cpu-requests-and-limits'],
  relatedConcepts: ['cpu-requests-and-limits', 'resource-qos-classes'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'how-throttling-works', title: 'How CFS Quota Produces Throttling', kind: 'concept' },
    { id: 'when-limits-hurt', title: 'When a CPU Limit Hurts More Than It Helps', kind: 'concept' },
  ],
};

export const limitRange: ConceptMeta = {
  id: 'limitrange',
  title: 'LimitRange',
  description: 'A namespace-scoped admission object that sets defaults and min/max for Pod/Container resources. Prevents BestEffort Pods by default.',
  status: 'available',
  learningObjectives: [
    'Define default, defaultRequest, min, and max on a LimitRange',
    'Describe the admission-time mutation that applies defaults',
  ],
  prerequisites: ['cpu-requests-and-limits', 'memory-requests-and-limits'],
  relatedConcepts: ['resourcequota'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'what-limitrange-does', title: 'Defaults, Minimums, Maximums', kind: 'concept' },
  ],
};

export const resourceQuota: ConceptMeta = {
  id: 'resourcequota',
  title: 'ResourceQuota',
  description: 'A namespace-scoped cap on total resources (CPU, memory, storage, object counts) consumed by workloads in that namespace.',
  status: 'available',
  learningObjectives: [
    'Define hard quotas on compute and object counts',
    'Describe the admission failure that blocks a Pod when quota is exhausted',
  ],
  prerequisites: ['limitrange'],
  relatedConcepts: ['limitrange', 'namespaces'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'what-resourcequota-does', title: 'Multi-tenant Caps per Namespace', kind: 'concept' },
  ],
};
