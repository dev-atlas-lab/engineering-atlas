import type { ConceptMeta } from '../../types';

export const podLifecyclePhases: ConceptMeta = {
  id: 'pod-lifecycle-phases',
  title: 'Pod Lifecycle Phases',
  description: 'The coarse phase a Pod moves through — Pending, Running, Succeeded, Failed, Unknown — and why container-level restarts do not change it.',
  status: 'available',
  learningObjectives: [
    'Enumerate the five Pod phases and describe the transitions between them',
    'Distinguish phase from container readiness and from the finer-grained conditions on a Pod',
  ],
  prerequisites: ['pod'],
  relatedConcepts: ['container-lifecycle', 'pod', 'kubelet'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'phase-overview', title: 'The Five Pod Phases', kind: 'concept' },
    { id: 'phase-vs-conditions', title: 'Phase vs Conditions vs Container State', kind: 'concept' },
  ],
};

export const containerLifecycle: ConceptMeta = {
  id: 'container-lifecycle',
  title: 'Container Lifecycle',
  description: 'The finer lifecycle inside a Pod: what runs between image pull and container exit, including init containers, hooks, and the Waiting/Running/Terminated container states.',
  status: 'available',
  learningObjectives: [
    'Describe the three container states (Waiting, Running, Terminated) and the fields each carries',
    'Trace the order init containers → postStart hook → main container → preStop hook → termination',
  ],
  prerequisites: ['pod-lifecycle-phases'],
  relatedConcepts: ['pod-lifecycle-phases', 'pod-termination-and-graceful-shutdown'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'container-states', title: 'Waiting, Running, Terminated', kind: 'concept' },
    { id: 'init-and-hooks', title: 'Init Containers and Lifecycle Hooks', kind: 'concept' },
  ],
};

export const containerRestartPolicies: ConceptMeta = {
  id: 'container-restart-policies',
  title: 'Container Restart Policies',
  description: 'The Pod-level restartPolicy — Always, OnFailure, Never — and how the kubelet decides to restart a container.',
  status: 'available',
  learningObjectives: [
    'Distinguish the three restartPolicy values and the controllers compatible with each',
    'Explain how kubelet exponential backoff produces CrashLoopBackOff',
  ],
  prerequisites: ['container-lifecycle'],
  relatedConcepts: ['container-lifecycle', 'kubelet', 'job-and-cronjob'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'the-three-policies', title: 'Always, OnFailure, Never', kind: 'concept' },
    { id: 'crashloopbackoff', title: 'Backoff and CrashLoopBackOff', kind: 'concept' },
  ],
};

export const livenessProbes: ConceptMeta = {
  id: 'liveness-probes',
  title: 'Liveness Probes',
  description: 'A kubelet-run health check that restarts a container when it stops being healthy. For deadlocks, not for startup.',
  status: 'available',
  learningObjectives: [
    'State what liveness probes are for and when they cause harm',
    'Configure the probe fields (periodSeconds, failureThreshold, timeoutSeconds) so a probe does not cause false restarts',
  ],
  prerequisites: ['container-restart-policies'],
  relatedConcepts: ['readiness-probes', 'startup-probes', 'kubelet'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'what-liveness-detects', title: 'What Liveness Actually Detects', kind: 'concept' },
    { id: 'tuning-liveness', title: 'Tuning Thresholds Without Thrash', kind: 'concept' },
  ],
  labs: [
    { id: 'pod-health-probe-simulator', title: 'Pod Health & Probe Simulator', type: 'simulation' },
  ],
};

export const readinessProbes: ConceptMeta = {
  id: 'readiness-probes',
  title: 'Readiness Probes',
  description: 'A health check that gates whether a Pod receives traffic. Failing readiness removes the Pod from Service endpoints without restarting the container.',
  status: 'available',
  learningObjectives: [
    'Explain how readiness interacts with EndpointSlices and kube-proxy',
    'Choose between readiness and liveness for a given failure signal',
  ],
  prerequisites: ['liveness-probes'],
  relatedConcepts: ['liveness-probes', 'service', 'service-discovery'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'readiness-and-endpoints', title: 'Readiness Controls Traffic, Not Life', kind: 'concept' },
    { id: 'when-to-pick-readiness', title: 'When to Pick Readiness Over Liveness', kind: 'concept' },
  ],
};

export const startupProbes: ConceptMeta = {
  id: 'startup-probes',
  title: 'Startup Probes',
  description: 'A probe that gates liveness and readiness until an application finishes starting. Added in 1.16 to stop liveness probes from killing slow-starting apps.',
  status: 'available',
  learningObjectives: [
    'Explain why startup probes exist and the failure they prevent',
    'Describe the handoff from startup to liveness/readiness',
  ],
  prerequisites: ['liveness-probes', 'readiness-probes'],
  relatedConcepts: ['liveness-probes', 'readiness-probes'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'why-startup-exists', title: 'Why Startup Probes Exist', kind: 'concept' },
    { id: 'startup-configuration', title: 'Configuring the Handoff', kind: 'concept' },
  ],
};

export const podTermination: ConceptMeta = {
  id: 'pod-termination-and-graceful-shutdown',
  title: 'Pod Termination & Graceful Shutdown',
  description: 'The exact sequence from "kubectl delete pod" to the kernel killing the last process — preStop hook, SIGTERM, grace period, SIGKILL.',
  status: 'available',
  learningObjectives: [
    'Order the steps of Pod termination and name who drives each one',
    'Explain the role of terminationGracePeriodSeconds and preStop',
    'Describe the race between endpoint removal and traffic draining',
  ],
  prerequisites: ['container-lifecycle'],
  relatedConcepts: ['readiness-probes', 'service', 'kubelet'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'termination-sequence', title: 'The Full Termination Sequence', kind: 'concept' },
    { id: 'graceful-shutdown-patterns', title: 'Making Graceful Shutdown Actually Work', kind: 'concept' },
  ],
};
