import type { ConceptMeta } from '../../types';

export const podSecurityStandards: ConceptMeta = {
  id: 'pod-security-standards',
  title: 'Pod Security Standards',
  description: 'Three named profiles — privileged, baseline, restricted — that bundle Pod security settings into standard tiers.',
  status: 'available',
  learningObjectives: [
    'Describe the three profiles and their constraints',
    'Place a given workload in the right profile',
  ],
  prerequisites: ['pod'],
  relatedConcepts: ['pod-security-admission', 'security-context'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'three-profiles', title: 'Privileged, Baseline, Restricted', kind: 'concept' },
    { id: 'picking-a-profile', title: 'Picking a Profile', kind: 'concept' },
  ],
};

export const podSecurityAdmission: ConceptMeta = {
  id: 'pod-security-admission',
  title: 'Pod Security Admission',
  description: 'The built-in admission controller that enforces Pod Security Standards per-namespace through labels.',
  status: 'available',
  learningObjectives: [
    'Enable Pod Security Admission on a namespace',
    'Distinguish enforce, audit, and warn modes',
  ],
  prerequisites: ['pod-security-standards', 'authn-authz-admission'],
  relatedConcepts: ['pod-security-standards', 'security-context'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'namespace-labels', title: 'Enforcing by Namespace Label', kind: 'concept' },
    { id: 'rollout-via-warn', title: 'Rolling Out with warn and audit', kind: 'concept' },
  ],
};

export const securityContext: ConceptMeta = {
  id: 'security-context',
  title: 'Security Context',
  description: 'Per-container (and per-Pod) security settings: UID, filesystem, capabilities, seccomp, privilege escalation.',
  status: 'available',
  learningObjectives: [
    'Set every important securityContext field with intent',
    'Understand the Pod-level vs container-level precedence',
  ],
  prerequisites: ['pod'],
  relatedConcepts: ['linux-capabilities', 'privileged-containers', 'seccomp-and-apparmor'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'pod-vs-container', title: 'Pod-level vs Container-level', kind: 'concept' },
    { id: 'the-core-fields', title: 'The Core Fields', kind: 'concept' },
  ],
  labs: [
    { id: 'workload-security-simulator', title: 'Workload Security Simulator', type: 'simulation' },
  ],
};

export const linuxCapabilities: ConceptMeta = {
  id: 'linux-capabilities',
  title: 'Linux Capabilities',
  description: 'The kernel\'s mechanism to split "root" into fine-grained privileges. Containers start with a limited default set.',
  status: 'available',
  learningObjectives: [
    'Enumerate the dangerous capabilities (NET_ADMIN, SYS_ADMIN, SYS_PTRACE, …)',
    'Drop ALL and add only what\'s needed',
  ],
  prerequisites: ['security-context'],
  relatedConcepts: ['privileged-containers', 'security-context'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'what-capabilities-are', title: 'Splitting Root', kind: 'concept' },
    { id: 'dropping-all', title: 'Drop ALL, Add Minimum', kind: 'concept' },
  ],
};

export const privilegedContainers: ConceptMeta = {
  id: 'privileged-containers',
  title: 'Privileged Containers',
  description: '`privileged: true` disables virtually every isolation primitive. The container has host-equivalent access.',
  status: 'available',
  learningObjectives: [
    'Describe what privileged: true actually disables',
    'Identify the few legitimate uses (storage drivers, CSI, some CNI pods)',
  ],
  prerequisites: ['security-context', 'linux-capabilities'],
  relatedConcepts: ['linux-capabilities', 'pod-security-standards'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'what-privileged-means', title: 'What Privileged Actually Does', kind: 'concept' },
  ],
};

export const seccompAndApparmor: ConceptMeta = {
  id: 'seccomp-and-apparmor',
  title: 'Seccomp and AppArmor',
  description: 'Kernel-level syscall filtering (seccomp-bpf) and path-based mandatory access control (AppArmor). Both reduce attack surface regardless of other settings.',
  status: 'available',
  learningObjectives: [
    'Describe what seccomp\'s runtime/default profile blocks',
    'Choose when to write a custom profile vs use the default',
  ],
  prerequisites: ['security-context'],
  relatedConcepts: ['security-context', 'pod-security-standards'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'seccomp-default', title: 'seccomp runtime/default', kind: 'concept' },
    { id: 'custom-profiles', title: 'Custom Profiles and AppArmor', kind: 'concept' },
  ],
};

export const secretsSecurity: ConceptMeta = {
  id: 'secrets-security',
  title: 'Secrets Security',
  description: 'Kubernetes Secrets are base64-encoded, not encrypted; etcd encryption, external KMS integration, and alternatives to in-cluster Secrets.',
  status: 'available',
  learningObjectives: [
    'Describe how Kubernetes Secrets are actually stored',
    'Enable etcd encryption at rest',
    'Compare native Secrets with external secret managers (Vault, Secrets Store CSI Driver)',
  ],
  prerequisites: ['secrets'],
  relatedConcepts: ['secrets', 'encryption-and-key-management'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'base64-is-not-encryption', title: 'Base64 Is Not Encryption', kind: 'concept' },
    { id: 'external-secret-stores', title: 'External Secret Stores', kind: 'concept' },
  ],
};

export const imageSecurity: ConceptMeta = {
  id: 'image-security-and-supply-chain-basics',
  title: 'Image Security and Supply Chain Basics',
  description: 'Container image signing (cosign), SBOMs, admission-time enforcement, and the baseline for supply-chain security.',
  status: 'available',
  learningObjectives: [
    'Describe the signing and verification flow (cosign + policy controller)',
    'Enumerate the supply-chain layers: provenance, SBOM, signing, scanning',
  ],
  prerequisites: ['pod'],
  relatedConcepts: ['pod-security-admission', 'authn-authz-admission'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'signing-and-verification', title: 'Signing and Verification at Admission', kind: 'concept' },
    { id: 'supply-chain-layers', title: 'SBOM, Scanning, Provenance', kind: 'concept' },
  ],
};
