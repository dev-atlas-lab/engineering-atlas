import type { ConceptMeta } from '../../types';

export const rollingUpdates: ConceptMeta = {
  id: 'rolling-updates',
  title: 'Rolling Updates',
  description: 'The default Deployment rollout: a new ReplicaSet grows while the old one shrinks, bounded by maxSurge and maxUnavailable.',
  status: 'available',
  learningObjectives: [
    'Describe the Deployment controller\'s rolling-update algorithm',
    'Explain how readiness probes gate rollout progress',
  ],
  prerequisites: ['deployment', 'readiness-probes'],
  relatedConcepts: ['maxsurge-and-maxunavailable', 'rollback', 'zero-downtime-deployment'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'the-controller-algorithm', title: 'The Deployment Controller Algorithm', kind: 'concept' },
    { id: 'readiness-gates-the-rollout', title: 'Readiness Gates the Rollout', kind: 'concept' },
  ],
  labs: [
    { id: 'deployment-rollout-simulator', title: 'Deployment Rollout Simulator', type: 'simulation' },
  ],
};

export const rollback: ConceptMeta = {
  id: 'rollback',
  title: 'Rollback',
  description: 'How to revert a Deployment to a previous revision — manual rollback and the limits of the revision history.',
  status: 'available',
  learningObjectives: [
    'Use kubectl rollout undo to revert',
    'Explain what rollback preserves and what it does not (ConfigMaps, DB schema)',
  ],
  prerequisites: ['rolling-updates'],
  relatedConcepts: ['deployment-revision-history', 'rolling-updates'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'how-rollback-works', title: 'How Rollback Works', kind: 'concept' },
    { id: 'what-rollback-does-not-cover', title: 'What Rollback Does Not Cover', kind: 'concept' },
  ],
};

export const deploymentRevisionHistory: ConceptMeta = {
  id: 'deployment-revision-history',
  title: 'Deployment Revision History',
  description: 'Each rollout creates a new ReplicaSet; the old ReplicaSets at scale=0 form the revision history. revisionHistoryLimit caps how many are kept.',
  status: 'available',
  learningObjectives: [
    'Identify a Deployment\'s past revisions via its ReplicaSets',
    'Explain revisionHistoryLimit',
  ],
  prerequisites: ['rolling-updates'],
  relatedConcepts: ['rollback', 'replicaset'],
  estimatedMinutes: 10,
  lessons: [
    { id: 'replicasets-are-the-history', title: 'ReplicaSets at Scale 0 Are the History', kind: 'concept' },
  ],
};

export const blueGreen: ConceptMeta = {
  id: 'blue-green-deployment',
  title: 'Blue-Green Deployment',
  description: 'Two full stacks side by side; a Service selector flip moves 100% of traffic from blue to green in one step.',
  status: 'available',
  learningObjectives: [
    'Describe the Service-selector-flip pattern',
    'Compare blue-green with rolling updates on blast radius and cost',
  ],
  prerequisites: ['rolling-updates'],
  relatedConcepts: ['canary-deployment', 'rolling-updates'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'how-bluegreen-works', title: 'How Blue-Green Works', kind: 'concept' },
    { id: 'bluegreen-tradeoffs', title: 'When Blue-Green Fits (and When It Does Not)', kind: 'concept' },
  ],
};

export const canary: ConceptMeta = {
  id: 'canary-deployment',
  title: 'Canary Deployment',
  description: 'A small slice of the new version runs alongside the old; traffic is shifted gradually with validation at each step.',
  status: 'available',
  learningObjectives: [
    'Describe the Pod-weight and ingress-weight ways to canary',
    'Explain why canary needs an error-rate check, not just a deploy pipeline',
  ],
  prerequisites: ['blue-green-deployment'],
  relatedConcepts: ['blue-green-deployment', 'service'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'canary-mechanics', title: 'How Canary Works in Plain Kubernetes', kind: 'concept' },
    { id: 'canary-promotion-and-automation', title: 'Promotion, Automation, and Service Mesh', kind: 'concept' },
  ],
};

export const maxSurgeMaxUnavailable: ConceptMeta = {
  id: 'maxsurge-and-maxunavailable',
  title: 'MaxSurge & MaxUnavailable',
  description: 'The two knobs on a rolling-update strategy that control rollout speed and availability floor.',
  status: 'available',
  learningObjectives: [
    'Compute max surge and max unavailable for a given replica count',
    'Pick values for a typical SLO (zero unavailability, 25% surge)',
  ],
  prerequisites: ['rolling-updates'],
  relatedConcepts: ['rolling-updates', 'zero-downtime-deployment'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'the-two-knobs', title: 'The Two Knobs in Detail', kind: 'concept' },
    { id: 'picking-values', title: 'Picking Values for a Target SLO', kind: 'concept' },
  ],
};

export const zeroDowntimeDeployment: ConceptMeta = {
  id: 'zero-downtime-deployment',
  title: 'Zero-Downtime Deployment',
  description: 'The full-stack checklist for a rollout that serves traffic the whole way through — readiness, preStop, graceful shutdown, connection draining.',
  status: 'available',
  learningObjectives: [
    'List every ingredient a zero-downtime rollout requires',
    'Diagnose common zero-downtime failures (connection resets, 502s during deploy)',
  ],
  prerequisites: ['rolling-updates', 'pod-termination-and-graceful-shutdown'],
  relatedConcepts: ['readiness-probes', 'pod-termination-and-graceful-shutdown'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'the-checklist', title: 'The Full Checklist', kind: 'concept' },
    { id: 'common-failure-patterns', title: 'Common Failure Patterns', kind: 'concept' },
  ],
};
