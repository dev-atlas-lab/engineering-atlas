// Eager metadata for the Kubernetes Foundations category. Ids, titles,
// status, and lesson outlines only — never import concept content modules
// from here.

import type { ConceptMeta } from '../../types';

export const whatIsKubernetes: ConceptMeta = {
  id: 'what-is-kubernetes',
  title: 'What is Kubernetes?',
  description: 'The container orchestration platform and the problem it was built to solve.',
  status: 'available',
  learningObjectives: [
    'Explain what Kubernetes is at an architectural level',
    'Describe the class of problems Kubernetes solves and the ones it does not',
  ],
  relatedConcepts: ['why-container-orchestration', 'kubernetes-vs-docker', 'kubernetes-cluster-architecture'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'what-is-kubernetes-overview', title: 'Kubernetes in One Lesson', kind: 'concept' },
    { id: 'what-kubernetes-is-not', title: 'What Kubernetes Is Not', kind: 'concept' },
  ],
};

export const whyContainerOrchestration: ConceptMeta = {
  id: 'why-container-orchestration',
  title: 'Why Container Orchestration?',
  description: 'The operational problems that emerge once more than a handful of containers run across more than one host.',
  status: 'available',
  learningObjectives: [
    'Identify the failure modes a single Docker host cannot handle',
    'Explain what an orchestrator takes responsibility for beyond starting a container',
  ],
  prerequisites: ['what-is-kubernetes'],
  relatedConcepts: ['kubernetes-reconciliation-loop', 'controller-manager'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'scaling-containers-by-hand', title: 'Why "Just Run Docker" Stops Working', kind: 'concept' },
    { id: 'responsibilities-of-an-orchestrator', title: 'What an Orchestrator Takes Over', kind: 'concept' },
  ],
};

export const kubernetesVsDocker: ConceptMeta = {
  id: 'kubernetes-vs-docker',
  title: 'Kubernetes vs Docker',
  description: 'The distinction between a container runtime and a cluster-wide orchestrator — they solve different problems and work together.',
  status: 'available',
  learningObjectives: [
    'Describe Docker and Kubernetes as complementary layers rather than alternatives',
    'Explain why the container runtime inside a Kubernetes node is not usually Docker any more',
  ],
  prerequisites: ['what-is-kubernetes'],
  relatedConcepts: ['container-runtime', 'what-is-kubernetes'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'different-layers', title: 'Different Layers of the Same Stack', kind: 'concept' },
    { id: 'runtime-after-dockershim', title: 'What Runs Containers Inside a Kubernetes Node', kind: 'concept' },
  ],
};

export const declarativeVsImperative: ConceptMeta = {
  id: 'declarative-vs-imperative-configuration',
  title: 'Declarative vs Imperative Configuration',
  description: 'The configuration model that underpins Kubernetes — stating what state you want rather than scripting the steps to reach it.',
  status: 'available',
  learningObjectives: [
    'Contrast declarative and imperative approaches with concrete Kubernetes examples',
    'Explain why Kubernetes commits to declarative specifications',
  ],
  prerequisites: ['what-is-kubernetes'],
  relatedConcepts: ['desired-state-vs-actual-state', 'kubernetes-reconciliation-loop', 'yaml-manifests'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'declaring-what-not-how', title: 'Declaring What, Not How', kind: 'concept' },
    { id: 'why-kubernetes-chose-declarative', title: 'Why Kubernetes Chose Declarative', kind: 'concept' },
  ],
};

export const desiredVsActualState: ConceptMeta = {
  id: 'desired-state-vs-actual-state',
  title: 'Desired State vs Actual State',
  description: 'The two kinds of state every Kubernetes object has — what you asked for, and what the cluster actually has.',
  status: 'available',
  learningObjectives: [
    'Identify spec (desired state) and status (actual state) in any Kubernetes object',
    'Explain what state divergence looks like and who closes the gap',
  ],
  prerequisites: ['declarative-vs-imperative-configuration'],
  relatedConcepts: ['kubernetes-reconciliation-loop', 'kubernetes-objects'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'spec-and-status', title: 'Spec and Status: Two Sides of Every Object', kind: 'concept' },
    { id: 'drift-and-reconciliation', title: 'When Desired and Actual Diverge', kind: 'concept' },
  ],
};

export const reconciliationLoop: ConceptMeta = {
  id: 'kubernetes-reconciliation-loop',
  title: 'Kubernetes Reconciliation Loop',
  description: 'The continuous controller loop that observes actual state, compares it to desired state, and acts to close the gap — the heart of self-healing.',
  status: 'available',
  learningObjectives: [
    'Describe the observe-diff-act cycle that every Kubernetes controller runs',
    'Explain how reconciliation produces self-healing behavior',
    'Trace how a single failed Pod gets replaced without human intervention',
  ],
  prerequisites: ['desired-state-vs-actual-state'],
  relatedConcepts: ['controller-manager', 'deployment', 'replicaset'],
  estimatedMinutes: 30,
  lessons: [
    { id: 'the-control-loop', title: 'The Observe-Diff-Act Loop', kind: 'concept' },
    { id: 'self-healing-in-practice', title: 'Self-Healing in Practice', kind: 'concept' },
  ],
  labs: [
    { id: 'reconciliation-simulator', title: 'Reconciliation Simulator', type: 'simulation' },
  ],
};
