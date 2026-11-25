// Eager metadata for this category's concepts: ids, titles, status, and
// lesson/lab ids, titles, and order. Never import concept content modules
// from here — they load per concept through ../concept-loaders.ts.

import type { ConceptMeta } from '../../types';

export const securityFundamentals: ConceptMeta = {
  id: 'security-fundamentals',
  title: 'Security Fundamentals',
  description:
    'Defense in depth, zero trust, and the security dimension of the shared responsibility model — the principles that shape every other security concept in this category.',
  status: 'coming-soon',
};

export const encryptionAndKeyManagement: ConceptMeta = {
  id: 'encryption-and-key-management',
  title: 'Encryption and Key Management',
  description:
    'Encrypting data at rest and in transit, managing cryptographic keys securely, and storing application secrets.',
  status: 'available',
  learningObjectives: [
    'Explain symmetric and asymmetric encryption, encryption at rest and in transit, and what each does not protect against',
    'Trace envelope encryption with data encryption keys and key encryption keys held in a key management service',
    'Decide between provider-managed and customer-managed keys and explain the responsibility split',
    'Store, retrieve, version, and rotate application secrets without embedding them in code or images',
    'Compare Azure Key Vault and Managed HSM with AWS KMS, CloudHSM, Secrets Manager, and Parameter Store',
  ],
  prerequisites: ['workload-and-federated-identity'],
  relatedConcepts: ['workload-and-federated-identity', 'object-storage', 'block-storage', 'security-fundamentals'],
  estimatedMinutes: 120,
  lessons: [
    { id: 'encryption-fundamentals', title: 'Encryption Fundamentals: Symmetric, Asymmetric, At Rest, and In Transit', kind: 'concept' },
    { id: 'envelope-encryption-and-kms', title: 'Envelope Encryption and Key Management Services', kind: 'concept' },
    { id: 'certificates-and-tls', title: 'Certificates and TLS', kind: 'concept' },
    { id: 'secrets-management', title: 'Secrets Management: Storage, Retrieval, and Rotation', kind: 'concept' },
    { id: 'azure-key-vault', title: 'Azure Key Vault and Managed HSM', kind: 'provider', providerId: 'azure' },
    { id: 'aws-kms-and-secrets-manager', title: 'AWS KMS, CloudHSM, Secrets Manager, and Parameter Store', kind: 'provider', providerId: 'aws' },
    { id: 'data-protection-comparison', title: 'Comparison: Azure vs. AWS Key and Secret Management', kind: 'comparison' },
  ],
  labs: [
    { id: 'envelope-encryption-lab', title: 'Envelope Encryption Explorer', type: 'simulation' },
    { id: 'secret-retrieval-lab', title: 'Secret Retrieval and Rotation', type: 'simulation' },
  ],
};

export const networkSecurity: ConceptMeta = {
  id: 'network-security',
  title: 'Network Security',
  description: 'Firewalls, security groups, and network access controls that protect cloud resources.',
  status: 'coming-soon',
};

export const securityMonitoringAndCompliance: ConceptMeta = {
  id: 'security-monitoring-and-compliance',
  title: 'Security Monitoring and Compliance',
  description:
    'Detecting threats through security-focused monitoring, and the compliance fundamentals that shape how controls are evidenced and audited.',
  status: 'coming-soon',
};
