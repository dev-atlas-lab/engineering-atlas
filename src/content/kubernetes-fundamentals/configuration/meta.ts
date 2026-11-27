// Eager metadata for the Kubernetes Configuration category.

import type { ConceptMeta } from '../../types';

export const kubernetesObjects: ConceptMeta = {
  id: 'kubernetes-objects',
  title: 'Kubernetes Objects',
  description: 'The persistent records that describe the state of the cluster — every workload, Service, ConfigMap, and node is an object with the same structural shape.',
  status: 'available',
  learningObjectives: [
    'Describe the common structure of every Kubernetes object: apiVersion, kind, metadata, spec, status',
    'Explain the distinction between the object record in etcd and the thing it describes',
  ],
  prerequisites: ['desired-state-vs-actual-state'],
  relatedConcepts: ['yaml-manifests', 'labels-and-selectors'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'shape-of-every-object', title: 'The Shape of Every Object', kind: 'concept' },
  ],
};

export const yamlManifests: ConceptMeta = {
  id: 'yaml-manifests',
  title: 'YAML Manifests',
  description: 'The file format for declaring Kubernetes objects. kubectl apply reads these and sends the object to the API Server.',
  status: 'available',
  learningObjectives: [
    'Read a basic manifest for a Pod, Deployment, and Service',
    'Explain what kubectl apply actually does with the file',
  ],
  prerequisites: ['kubernetes-objects'],
  relatedConcepts: ['kubernetes-objects', 'kubernetes-api-server'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'reading-a-manifest', title: 'Reading a Manifest', kind: 'concept' },
    { id: 'apply-vs-create', title: 'What kubectl apply Actually Does', kind: 'concept' },
  ],
};

export const labelsAndSelectors: ConceptMeta = {
  id: 'labels-and-selectors',
  title: 'Labels and Selectors',
  description: 'The loosely-coupled matching mechanism Kubernetes uses to connect objects — a Service finds its Pods, a ReplicaSet owns its Pods, through labels.',
  status: 'available',
  learningObjectives: [
    'Distinguish labels (identifying) from annotations (non-identifying metadata)',
    'Explain how a selector matches labels and why there are no direct references between objects',
  ],
  prerequisites: ['kubernetes-objects'],
  relatedConcepts: ['service', 'replicaset'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'labels-not-references', title: 'Labels, Not References', kind: 'concept' },
  ],
};

export const namespaces: ConceptMeta = {
  id: 'namespaces',
  title: 'Namespaces',
  description: 'A soft scoping mechanism for dividing one cluster into isolated "virtual clusters" of objects — mostly for name scoping, quotas, and RBAC.',
  status: 'available',
  learningObjectives: [
    'Describe what a namespace does and does not isolate',
    'Explain why Nodes, PersistentVolumes, and other cluster-scoped objects do not live in a namespace',
  ],
  prerequisites: ['kubernetes-objects'],
  relatedConcepts: ['service-discovery'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'what-a-namespace-is', title: 'What a Namespace Scopes', kind: 'concept' },
    { id: 'namespace-scope-vs-cluster-scope', title: 'Namespaced vs Cluster-scoped Objects', kind: 'concept' },
  ],
};

export const configMaps: ConceptMeta = {
  id: 'configmaps',
  title: 'ConfigMaps',
  description: 'A Kubernetes object for non-confidential configuration data — key-value pairs or whole files, consumed by Pods as env vars or mounted files.',
  status: 'available',
  learningObjectives: [
    'Create a ConfigMap and consume it from a Pod',
    'Distinguish ConfigMaps from Secrets and from Deployment-level config',
  ],
  prerequisites: ['pod'],
  relatedConcepts: ['secrets', 'pod'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'configmaps-overview', title: 'Configuration, Decoupled From Images', kind: 'concept' },
  ],
};

export const secrets: ConceptMeta = {
  id: 'secrets',
  title: 'Secrets',
  description: 'A Kubernetes object for sensitive configuration — API keys, passwords, TLS certs. Looks like a ConfigMap but with important handling differences.',
  status: 'available',
  learningObjectives: [
    'Describe what Secret storage does and does not guarantee by default',
    'Explain why base64 is encoding, not encryption, and what encryption-at-rest adds',
  ],
  prerequisites: ['configmaps'],
  relatedConcepts: ['configmaps', 'etcd'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'secrets-and-what-they-are-not', title: 'Secrets: What They Protect and What They Don\'t', kind: 'concept' },
  ],
};

export const resourceRequestsAndLimits: ConceptMeta = {
  id: 'resource-requests-and-limits',
  title: 'Resource Requests and Limits',
  description: 'The per-container CPU and memory hints that drive scheduling (requests) and enforcement (limits) — the single most important knob for cluster behavior.',
  status: 'available',
  learningObjectives: [
    'Distinguish a request (used for scheduling) from a limit (used at runtime)',
    'Explain what happens when a container exceeds its memory limit vs its CPU limit',
    'Describe how requests and limits interact with the scheduler',
  ],
  prerequisites: ['pod', 'scheduler'],
  relatedConcepts: ['scheduler', 'pod'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'requests-and-limits', title: 'Requests Drive Scheduling, Limits Enforce Runtime', kind: 'concept' },
    { id: 'what-limits-feel-like', title: 'What It Looks Like When a Container Hits Its Limits', kind: 'concept' },
  ],
};
