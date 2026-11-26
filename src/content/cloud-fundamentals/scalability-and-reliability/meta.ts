// Eager metadata for this category's concepts: ids, titles, status, and
// lesson/lab ids, titles, and order. Never import concept content modules
// from here — they load per concept through ../concept-loaders.ts.

import type { ConceptMeta } from '../../types';

export const autoScaling: ConceptMeta = {
  id: 'auto-scaling',
  title: 'Auto-Scaling',
  description:
    'Vertical vs. horizontal scaling, and automatically adjusting compute capacity based on demand metrics and schedules — including why stateless applications scale more cleanly than stateful ones.',
  status: 'available',
  learningObjectives: [
    'Distinguish vertical from horizontal scaling and scalability from elasticity',
    'Explain why stateless design and shared bottlenecks govern horizontal scaling',
    'Describe the auto-scaling feedback loop and compare target tracking, step, scheduled, and predictive policies',
    'Explain scaling lag, warm-up, cooldown, and min/max/desired capacity',
    'Compare Azure VM Scale Sets / Monitor autoscale with EC2 Auto Scaling',
  ],
  prerequisites: ['virtual-machines', 'load-balancing-fundamentals'],
  relatedConcepts: ['high-availability', 'load-balancing-fundamentals', 'virtual-machines'],
  estimatedMinutes: 85,
  lessons: [
    { id: 'vertical-vs-horizontal-scaling', title: 'Vertical vs. Horizontal Scaling', kind: 'concept' },
    { id: 'how-auto-scaling-works', title: 'How Auto-Scaling Works', kind: 'concept' },
    { id: 'azure-autoscale', title: 'Azure VM Scale Sets and Monitor Autoscale', kind: 'provider', providerId: 'azure' },
    { id: 'aws-auto-scaling', title: 'AWS EC2 Auto Scaling', kind: 'provider', providerId: 'aws' },
    { id: 'auto-scaling-comparison', title: 'Comparison: Azure vs. AWS Auto-Scaling', kind: 'comparison' },
  ],
  labs: [{ id: 'design-an-auto-scaling-policy-lab', title: 'Design an Auto Scaling Policy', type: 'simulation' }],
};

export const highAvailability: ConceptMeta = {
  id: 'high-availability',
  title: 'High Availability',
  description:
    'Architectural patterns — redundancy, failover, multi-zone and multi-region design — that minimize downtime.',
  status: 'available',
  learningObjectives: [
    'Identify single points of failure and apply redundancy across fault domains',
    'Use availability zones and multi-zone deployment to isolate failures',
    'Distinguish active-active from active-passive and load balancing from failover',
    'Explain RTO, RPO, graceful degradation, and why high availability is not zero downtime',
    'Compare Azure and AWS high availability building blocks',
  ],
  prerequisites: ['regions-and-availability-zones', 'load-balancing-fundamentals'],
  relatedConcepts: ['auto-scaling', 'global-traffic-distribution', 'geographic-redundancy-and-data-residency', 'disaster-recovery'],
  estimatedMinutes: 90,
  lessons: [
    { id: 'eliminating-single-points-of-failure', title: 'Eliminating Single Points of Failure', kind: 'concept' },
    { id: 'failover-and-architectures', title: 'Failover and Availability Architectures', kind: 'concept' },
    { id: 'azure-high-availability', title: 'Azure High Availability', kind: 'provider', providerId: 'azure' },
    { id: 'aws-high-availability', title: 'AWS High Availability', kind: 'provider', providerId: 'aws' },
    { id: 'high-availability-comparison', title: 'Comparison: Azure vs. AWS High Availability', kind: 'comparison' },
  ],
  labs: [{ id: 'design-a-highly-available-application-lab', title: 'Design a Highly Available Application', type: 'challenge' }],
};

export const disasterRecovery: ConceptMeta = {
  id: 'disaster-recovery',
  title: 'Disaster Recovery',
  description:
    'Strategies for recovering from catastrophic failures — backup, replication, and failover across regions — framed by Recovery Time Objective and Recovery Point Objective.',
  status: 'coming-soon',
};
