import type { ConceptContentModule, LessonBody } from '../../types';

const whatSecretsAreNot: LessonBody = {
  learningObjectives: [
    'Describe what Secret storage does and does not guarantee',
    'Explain why base64 is not encryption',
  ],
  sections: [
    {
      heading: 'Secrets look like ConfigMaps — but with important differences',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Secret has the same shape as a ConfigMap and is consumed from Pods in the same ways (env vars, mounted files). It is intended for sensitive data: API keys, passwords, TLS certificates. The Kubernetes machinery treats Secrets slightly differently from ConfigMaps — they are not printed in logs or events, and are opt-in for RBAC visibility.',
        },
        {
          type: 'paragraph',
          text: 'The values in a Secret manifest are base64-encoded. This is encoding, not encryption — anyone with read access to the Secret can trivially decode it. The point of base64 is to safely transport binary data through YAML, not to protect it.',
        },
      ],
    },
    {
      heading: 'What actually protects a Secret',
      blocks: [
        {
          type: 'list',
          items: [
            'RBAC: control which users and ServiceAccounts can read Secrets in which namespaces.',
            'Encryption at rest: enable "EncryptionConfiguration" so the API Server encrypts Secrets in etcd using a provider (KMS, aescbc). Without this, anyone with read access to the etcd disk can read every Secret.',
            'Shorter-lived credentials: prefer tokens the cluster issues on demand (short-lived service account tokens, cert-manager issued certs, IRSA/Workload Identity for cloud credentials) over long-lived secrets stored forever.',
            'External secret managers: many production setups keep secrets in a dedicated system (Vault, AWS Secrets Manager) and sync them to Kubernetes just in time, so Kubernetes is not the authoritative store.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Default Kubernetes stores Secrets unencrypted in etcd. "Kubernetes supports Secrets" is often misread as "Secrets are secure by default." They are not. Encryption at rest and a sensible RBAC policy are both required to meet that bar.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'secrets-kc-1',
      type: 'single-choice',
      prompt: 'Why is base64 encoding alone not enough to protect a Secret\'s value?',
      difficulty: 'beginner',
      learningObjective: 'Explain why base64 is not encryption',
      options: [
        { id: 'a', label: 'Base64 is a reversible encoding, not encryption — anyone with the Secret can decode it in one step', correct: true, explanation: 'Correct. Protection comes from RBAC and encryption at rest, not from base64.' },
        { id: 'b', label: 'Base64 only hides values shorter than 256 characters', correct: false, explanation: 'There is no such length-dependent property.' },
        { id: 'c', label: 'Base64 is secure, but only against external attackers', correct: false, explanation: 'It is not secure at all — it is an encoding.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'secrets-and-what-they-are-not': whatSecretsAreNot,
  },
  labs: {},
  simulations: {},
};
