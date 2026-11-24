import type { Category } from '../../types';

export const security: Category = {
  id: 'security',
  title: 'Security',
  description:
    'Protecting data and network traffic — defense in depth, encryption, key and secrets management, network-level controls, and security monitoring.',
  concepts: [
    {
      id: 'security-fundamentals',
      title: 'Security Fundamentals',
      description:
        'Defense in depth, zero trust, and the security dimension of the shared responsibility model — the principles that shape every other security concept in this category.',
      status: 'coming-soon',
    },
    {
      id: 'encryption-and-key-management',
      title: 'Encryption and Key Management',
      description:
        'Encrypting data at rest and in transit, managing cryptographic keys securely, and storing application secrets.',
      status: 'coming-soon',
    },
    {
      id: 'network-security',
      title: 'Network Security',
      description:
        'Firewalls, security groups, and network access controls that protect cloud resources.',
      status: 'coming-soon',
    },
    {
      id: 'security-monitoring-and-compliance',
      title: 'Security Monitoring and Compliance',
      description:
        'Detecting threats through security-focused monitoring, and the compliance fundamentals that shape how controls are evidenced and audited.',
      status: 'coming-soon',
    },
  ],
};
