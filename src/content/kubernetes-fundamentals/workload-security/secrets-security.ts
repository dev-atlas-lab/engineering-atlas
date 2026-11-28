import type { ConceptContentModule, LessonBody } from '../../types';

const base64IsNotEncryption: LessonBody = {
  learningObjectives: [
    'Describe how Kubernetes Secrets are actually stored',
    'Enable etcd encryption at rest',
  ],
  sections: [
    {
      heading: 'Secrets are base64, not encrypted',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Kubernetes Secret stores values base64-encoded. Base64 is not encryption — it is a reversible encoding to keep binary data safely transmissible. Anyone who can read the Secret object (etcd access, API access with RBAC) can decode the values trivially.',
        },
        {
          type: 'list',
          items: [
            'Secrets at REST: live in etcd. If etcd encryption at rest is not configured, they are stored as cleartext on the etcd disks.',
            'Secrets in TRANSIT: protected by the TLS from kubectl / kubelet to the API Server, and from the API Server to etcd.',
            'Secrets in the Pod: either an env var (visible in /proc/*/environ to any process on the host) or a file mount (readable by the container).',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: '"Secret" is a historically ambitious name for base64-plus-some-RBAC. Modern clusters MUST enable encryption at rest (EncryptionConfiguration pointing at an AES-GCM or KMS provider), and should consider external secret stores for high-value credentials.',
        },
      ],
    },
    {
      heading: 'Encryption at rest',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          code: `# /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources: [secrets]
  providers:
  - kms:
      name: aws-kms
      endpoint: unix:///var/run/kmsplugin/socket.sock
      cachesize: 1000
  - identity: {}   # fallback for pre-existing unencrypted rows`,
        },
        {
          type: 'paragraph',
          text: 'Options: identity (none), aescbc, aesgcm, secretbox (NaCl), kms (external). The kms provider is the strongest: the actual encryption key lives in a cloud KMS and never touches etcd; a compromised etcd backup is unreadable without the KMS.',
        },
      ],
    },
  ],
};

const externalSecretStores: LessonBody = {
  learningObjectives: ['Compare native Secrets with external secret managers'],
  sections: [
    {
      heading: 'The external-store options',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Mechanism', 'Where secrets live', 'How Pods see them'],
          rows: [
            ['Native Secret', 'etcd (encrypted or not)', 'env or volume mount via SecretVolumeSource'],
            ['Secrets Store CSI Driver + provider (AWS Secrets Manager, Vault, etc.)', 'External store', 'Volume mount; optionally synced to a native Secret'],
            ['External Secrets Operator', 'External store', 'Operator reads external and writes a Kubernetes Secret'],
            ['Vault Agent sidecar', 'HashiCorp Vault', 'Sidecar fetches and writes to a shared emptyDir'],
          ],
        },
        {
          type: 'list',
          items: [
            'Secrets Store CSI avoids the native Secret entirely for workloads that only need the value at mount time.',
            'External Secrets Operator syncs external values INTO native Secrets — keeps the workload portable, moves the source of truth outside etcd.',
            'For cloud credentials specifically, prefer workload identity federation (IRSA on AWS, Workload Identity on GKE, Azure AD Workload Identity) — the Pod presents its ServiceAccount token to the cloud, which trades it for a short-lived cloud credential. No Secret needed anywhere.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The hardest part of secrets is not storage — it is rotation. All four mechanisms have different rotation models. Build rotation in from day one, even if you start with native Secrets: the application must reload when the Secret changes, which many apps don\'t do without a restart.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'base64-is-not-encryption': base64IsNotEncryption,
    'external-secret-stores': externalSecretStores,
  },
  labs: {},
  simulations: {},
};
