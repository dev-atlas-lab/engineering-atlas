// Eager metadata for this category's concepts: ids, titles, status, and
// lesson/lab ids, titles, and order. Never import concept content modules
// from here — they load per concept through ../concept-loaders.ts.

import type { ConceptMeta } from '../../types';

export const securityFundamentals: ConceptMeta = {
  id: 'security-fundamentals',
  title: 'Security Fundamentals',
  description:
    'Defense in depth, zero trust, and the security dimension of the shared responsibility model — the principles that shape every other security concept in this category.',
  status: 'available',
  learningObjectives: [
    'Describe what a control protects using confidentiality, integrity, and availability',
    'Apply zero trust principles: verify explicitly, use least privilege, assume breach',
    'Explain which security responsibilities stay with the customer in IaaS, PaaS, and SaaS',
    'Design layered defenses and recognise controls that only appear to help',
  ],
  relatedConcepts: ['identity-and-authentication', 'authorization-and-policies', 'network-security', 'security-monitoring-and-compliance'],
  estimatedMinutes: 70,
  lessons: [
    { id: 'security-principles', title: 'Core Security Principles: CIA, Threat Modelling, and Zero Trust', kind: 'concept' },
    { id: 'shared-responsibility-for-security', title: 'Shared Responsibility for Security', kind: 'concept' },
    { id: 'defense-in-depth', title: 'Defense in Depth', kind: 'concept' },
    { id: 'security-building-blocks-comparison', title: 'Comparison: Azure and AWS Security Building Blocks', kind: 'comparison' },
  ],
  labs: [
    { id: 'defense-in-depth-challenge', title: 'Defense-in-Depth Architecture Review', type: 'challenge' },
  ],
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
  status: 'available',
  learningObjectives: [
    'Place security rules, network firewalls, WAFs, and DDoS protection at the layers where each works',
    'Distinguish network-layer and application-layer DDoS attacks and where each is mitigated',
    'Use segmentation, egress filtering, and private endpoints as security controls',
    'Compare Azure Firewall, Azure WAF, and Azure DDoS Protection with AWS Network Firewall, AWS WAF, and AWS Shield',
  ],
  prerequisites: ['virtual-networks', 'subnets-and-routing'],
  relatedConcepts: ['virtual-networks', 'subnets-and-routing', 'connecting-networks', 'security-fundamentals'],
  estimatedMinutes: 90,
  lessons: [
    { id: 'cloud-firewalls', title: 'Cloud Firewalls and Traffic Inspection', kind: 'concept' },
    { id: 'waf-and-ddos', title: 'Web Application Firewalls and DDoS Protection', kind: 'concept' },
    { id: 'segmentation-and-private-connectivity', title: 'Segmentation and Private Connectivity as Security Controls', kind: 'concept' },
    { id: 'azure-network-security', title: 'Azure Firewall, WAF, and DDoS Protection', kind: 'provider', providerId: 'azure' },
    { id: 'aws-network-security', title: 'AWS Network Firewall, WAF, and Shield', kind: 'provider', providerId: 'aws' },
    { id: 'network-security-comparison', title: 'Comparison: Azure vs. AWS Network Security', kind: 'comparison' },
  ],
  labs: [
    { id: 'waf-ddos-lab', title: 'WAF and DDoS Protection Simulator', type: 'simulation' },
  ],
};

export const securityMonitoringAndCompliance: ConceptMeta = {
  id: 'security-monitoring-and-compliance',
  title: 'Security Monitoring and Compliance',
  description:
    'Security baselines, policy-driven governance, posture management, audit logging, and the compliance and incident response fundamentals that shape how controls are evidenced and audited.',
  status: 'available',
  learningObjectives: [
    'Distinguish preventive, detective, and corrective controls and combine them',
    'Explain posture management, misconfiguration risk, and how findings are prioritised',
    'Explain audit logging, compliance evidence, and the incident response lifecycle',
    'Compare Azure Policy and Defender for Cloud with AWS Organizations policies, AWS Config, and Security Hub',
  ],
  prerequisites: ['security-fundamentals', 'authorization-and-policies'],
  relatedConcepts: ['security-fundamentals', 'authorization-and-policies', 'observability-fundamentals'],
  estimatedMinutes: 85,
  lessons: [
    { id: 'preventive-detective-corrective-controls', title: 'Preventive, Detective, and Corrective Controls', kind: 'concept' },
    { id: 'posture-and-misconfiguration', title: 'Security Posture and Misconfiguration Risk', kind: 'concept' },
    { id: 'audit-compliance-and-incident-response', title: 'Audit Logging, Compliance, and Incident Response', kind: 'concept' },
    { id: 'azure-security-governance', title: 'Azure Policy and Microsoft Defender for Cloud', kind: 'provider', providerId: 'azure' },
    { id: 'aws-security-governance', title: 'AWS Config, Security Hub, GuardDuty, and CloudTrail', kind: 'provider', providerId: 'aws' },
    { id: 'governance-comparison', title: 'Comparison: Azure vs. AWS Security Governance', kind: 'comparison' },
  ],
  labs: [
    { id: 'misconfiguration-response-lab', title: 'Misconfiguration Response Simulator', type: 'simulation' },
  ],
};
