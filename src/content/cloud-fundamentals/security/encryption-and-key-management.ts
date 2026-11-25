import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { envelopeScene, secretRetrievalScene } from './encryption-and-key-management.scenes';
import { envelopeEncryptionSimulation, type EnvelopeState } from './envelope-encryption';
import { renderEnvelopeState } from './envelope-encryption-view';
import { secretRetrievalSimulation, type SecretState } from './secret-retrieval';
import { renderSecretState } from './secret-retrieval-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const encryptionFundamentals: LessonBody = {
  learningObjectives: [
    'Distinguish symmetric from asymmetric encryption and where each is used',
    'Explain encryption at rest and in transit, and the threat each one addresses',
    'Explain why encryption alone does not make data secure',
  ],
  analogy:
    'Encryption at rest is a locked filing cabinet: it protects the papers if someone carries the cabinet away. It does nothing about a person who is handed the key because they are allowed to read the files — and that is exactly how an application reads its own encrypted database.',
  sections: [
    {
      heading: 'Two families of encryption',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'Symmetric', 'Asymmetric (public key)'],
          rows: [
            ['Keys', 'One shared secret key encrypts and decrypts', 'A key pair: a public key anyone may have, and a private key kept secret'],
            ['Speed', 'Fast; suitable for any amount of data', 'Much slower; used on small values'],
            ['Typical algorithms', 'AES (for example AES-256-GCM)', 'RSA, elliptic-curve algorithms (ECDH, ECDSA, Ed25519)'],
            ['Typical uses', 'Encrypting disks, objects, database files, and records', 'Key exchange, digital signatures, certificates, wrapping symmetric keys'],
            ['Main challenge', 'Distributing and protecting the shared key', 'Trusting that a public key really belongs to who it claims'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Real systems combine the two. TLS uses asymmetric cryptography to authenticate the server and agree on keys, then symmetric encryption for the data. Envelope encryption — next lesson — uses symmetric keys for data and protects those keys with other keys held in a key management service.',
        },
      ],
    },
    {
      heading: 'At rest and in transit',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'Encryption in transit', 'Encryption at rest'],
          rows: [
            ['Protects', 'Data moving across networks', 'Data stored on disks, in objects, databases, and backups'],
            ['Against', 'Eavesdropping and tampering on the network path', 'Lost or stolen media, improperly decommissioned disks, raw access to the storage layer'],
            ['Mechanism', 'TLS (HTTPS), plus provider encryption on some internal links', 'Storage-service encryption with platform-managed or customer-managed keys'],
            ['Your typical task', 'Require TLS, use current protocol versions, validate certificates', 'Confirm it is enabled (often by default) and choose who manages the keys'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Many cloud services encrypt at rest by default: Azure Storage always does, and Amazon S3 encrypts all new objects by default. Others depend on configuration — for example, Amazon EBS “encryption by default” is a per-Region account setting. Check each service rather than assuming.',
        },
      ],
    },
    {
      heading: 'What encryption does not do',
      blocks: [
        {
          type: 'paragraph',
          text: 'Storage-level encryption at rest is transparent to authorized callers: when an application or user with read permission reads a blob, the service decrypts it for them. So it does not protect against a stolen credential, an over-permissive role, a public bucket, or an SQL injection in the application. Those are access-control and application-security failures, and the data is returned decrypted.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: '“The database is encrypted” is not an answer to “who can read the data?”. The answer is decided by identity, authorization, and network controls. Encryption adds a separate control: who can use the keys.',
        },
        {
          type: 'paragraph',
          text: 'Where encryption does add access control is with customer-managed keys and application-level encryption: if reading the data requires permission to use a key in a key management service, that permission becomes a second, independently audited gate — the subject of the next lesson.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'encf-kc-1',
      type: 'scenario',
      prompt:
        'A storage bucket holding customer files is encrypted at rest with a provider-managed key. A misconfigured policy makes it publicly readable. What can an anonymous reader get?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why encryption alone does not make data secure',
      options: [
        { id: 'a', label: 'The files in plaintext — the service decrypts transparently for any request it authorizes', correct: true, explanation: 'Correct — encryption at rest protects the storage media, not access through the API.' },
        { id: 'b', label: 'Only ciphertext, because the bucket is encrypted', correct: false, explanation: 'Storage-level encryption is invisible to authorized callers, and the policy authorized everyone.' },
        { id: 'c', label: 'Nothing — encrypted buckets cannot be made public', correct: false, explanation: 'Encryption and access policy are independent settings.' },
      ],
    },
    {
      id: 'encf-kc-2',
      type: 'single-choice',
      prompt: 'Why does TLS use both asymmetric and symmetric cryptography?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish symmetric from asymmetric encryption and where each is used',
      options: [
        { id: 'a', label: 'Asymmetric cryptography authenticates the server and establishes keys; fast symmetric encryption then protects the data', correct: true, explanation: 'Correct — each is used where it is strongest.' },
        { id: 'b', label: 'Symmetric encryption is used for the certificate and asymmetric for the data', correct: false, explanation: 'It is the other way round.' },
        { id: 'c', label: 'Two layers of encryption are required by law', correct: false, explanation: 'The design is about performance and trust, not regulation.' },
      ],
    },
  ],
};

const envelopeEncryptionAndKms: LessonBody = {
  learningObjectives: [
    'Explain envelope encryption with data encryption keys and key encryption keys',
    'Describe what a key management service and an HSM provide',
    'Choose between provider-managed and customer-managed keys and explain the responsibility split',
  ],
  sections: [
    {
      heading: 'Why not encrypt everything with one key?',
      blocks: [
        {
          type: 'paragraph',
          text: 'Encrypting terabytes of data directly with a key held in a central key service would mean sending every byte to that service — slow, expensive, and a huge dependency. Encrypting it with one key held by the application means that key is exposed wherever the application runs. Envelope encryption avoids both problems.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'A data encryption key (DEK) — a symmetric key, often unique per object or per record set — encrypts the data locally.',
            'A key encryption key (KEK), which never leaves the key management service, encrypts (wraps) the DEK.',
            'The wrapped DEK is stored next to the ciphertext. Decrypting means asking the key service to unwrap the DEK, which requires permission on the KEK.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'This is how cloud storage services implement customer-managed keys: the service holds per-object or per-volume DEKs and calls the key service to wrap and unwrap them with your KEK.',
        },
      ],
    },
    {
      heading: 'Key management services and HSMs',
      blocks: [
        {
          type: 'paragraph',
          text: 'A key management service stores KEKs and performs cryptographic operations with them on request, after checking the caller’s authorization. Keys are generated and kept inside hardware security modules (HSMs) — tamper-resistant devices designed so key material cannot be extracted in plaintext. Every use of a key is logged, so key usage becomes an audit trail of who decrypted what.',
        },
      ],
    },
    {
      heading: 'Rotation, disabling, and deletion',
      blocks: [
        {
          type: 'list',
          items: [
            'Rotation creates a new version of the KEK for new encryption. Earlier versions are retained so existing wrapped DEKs can still be unwrapped — rotating a KEK does not re-encrypt existing data.',
            'Disabling a key immediately blocks all operations with it; re-enabling restores them. It is a fast emergency brake.',
            'Deleting a key makes everything encrypted under it permanently unreadable. Key services therefore enforce a waiting period before deletion, during which it can be cancelled. Deliberate deletion to make data unrecoverable is called crypto-shredding.',
          ],
        },
      ],
    },
    {
      heading: 'Provider-managed or customer-managed keys?',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'Provider-managed keys', 'Customer-managed keys (CMK)'],
          rows: [
            ['Who creates and rotates the KEK', 'The provider, automatically', 'You (often with automatic rotation you configure)'],
            ['Who controls access to the KEK', 'The provider, on behalf of the service', 'You, through key policies or role assignments'],
            ['Can you revoke the service’s access?', 'No', 'Yes — disable the key or remove the grant, and the data becomes unreadable'],
            ['Key usage audit', 'Limited', 'Every wrap and unwrap appears in your logs'],
            ['Operational risk', 'Minimal', 'Losing or deleting the key loses the data; you must manage policies, rotation, and availability'],
            ['Typical reason to choose', 'Default; adequate for most workloads', 'Regulatory or contractual control requirements, separation of duties, revocation capability'],
          ],
        },
      ],
    },
    {
      heading: 'Who is responsible for what',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Party', 'Responsible for'],
          rows: [
            ['Cloud provider', 'Physical security, HSM operation, the correctness and availability of the key service and of service-side encryption'],
            ['Key management service', 'Keeping KEKs inside HSMs, enforcing authorization on every operation, logging usage, enforcing deletion waiting periods'],
            ['You (customer)', 'Which data is encrypted with which keys; who may use each key; rotation settings; protecting keys from deletion; monitoring key usage'],
            ['Your application', 'For application-level encryption: requesting data keys, erasing plaintext keys after use, storing wrapped keys with the data, using authenticated ciphers correctly'],
          ],
        },
      ],
    },
  ],
  visualization: envelopeScene,
  knowledgeCheck: [
    {
      id: 'env-kc-1',
      type: 'single-choice',
      prompt: 'In envelope encryption, what is stored next to the ciphertext?',
      difficulty: 'beginner',
      learningObjective: 'Explain envelope encryption with data encryption keys and key encryption keys',
      options: [
        { id: 'a', label: 'The data key, wrapped by the key encryption key', correct: true, explanation: 'Correct — useless without permission to unwrap it with the KEK.' },
        { id: 'b', label: 'The key encryption key', correct: false, explanation: 'The KEK never leaves the key management service.' },
        { id: 'c', label: 'The plaintext data key', correct: false, explanation: 'Storing it would let anyone with the storage decrypt the data.' },
      ],
    },
    {
      id: 'env-kc-2',
      type: 'scenario',
      prompt:
        'A team enables automatic yearly rotation of the customer-managed KEK protecting five years of stored data. What happens to data encrypted before the rotation?',
      difficulty: 'intermediate',
      learningObjective: 'Describe what a key management service and an HSM provide',
      options: [
        { id: 'a', label: 'It stays readable: older key versions are retained to unwrap existing data keys, and new data uses the new version', correct: true, explanation: 'Correct — rotation does not re-encrypt existing data.' },
        { id: 'b', label: 'It becomes unreadable until re-encrypted', correct: false, explanation: 'Key services keep earlier versions for exactly this reason.' },
        { id: 'c', label: 'It is automatically re-encrypted with the new version overnight', correct: false, explanation: 'Rotating a KEK does not rewrite stored data.' },
      ],
    },
    {
      id: 'env-kc-3',
      type: 'scenario',
      prompt:
        'A regulator requires that the company can make a cloud service’s stored data unreadable on demand, without relying on the provider. Which choice meets this?',
      difficulty: 'advanced',
      learningObjective: 'Choose between provider-managed and customer-managed keys and explain the responsibility split',
      options: [
        { id: 'a', label: 'Customer-managed keys, which the company can disable or schedule for deletion', correct: true, explanation: 'Correct — the company controls the KEK the service depends on, with the matching responsibility not to lose it.' },
        { id: 'b', label: 'Provider-managed keys with a strong bucket policy', correct: false, explanation: 'Access policy does not give the company control over the keys.' },
        { id: 'c', label: 'Turning off encryption at rest', correct: false, explanation: 'That removes protection rather than adding control.' },
      ],
    },
  ],
};

const certificatesAndTls: LessonBody = {
  learningObjectives: [
    'Explain what a certificate binds together and how a client validates it',
    'Explain why certificate expiry causes outages and how managed certificates prevent them',
    'Describe mutual TLS and when it is used',
  ],
  sections: [
    {
      heading: 'What a certificate is',
      blocks: [
        {
          type: 'paragraph',
          text: 'A certificate binds a public key to an identity — usually one or more domain names — and is signed by a certificate authority (CA). A client connecting over TLS checks that the certificate chains up to a CA it trusts, that it covers the hostname it dialled, that it is within its validity dates, and that the server proves possession of the matching private key. Only then does it trust that it is talking to the right server.',
        },
        {
          type: 'list',
          items: [
            'Public CAs are trusted by browsers and operating systems and issue certificates for internet-facing names.',
            'Private CAs issue certificates for internal services and devices that only your own systems trust.',
            'The private key is the secret: anyone holding it can impersonate the certificate’s name. Store it in a key vault or HSM, not on a shared file system.',
          ],
        },
      ],
    },
    {
      heading: 'Expiry and renewal',
      blocks: [
        {
          type: 'paragraph',
          text: 'Certificates are deliberately short-lived, and their maximum lifetimes keep shrinking. An expired certificate makes clients refuse the connection outright, so a forgotten renewal is a full outage. Managed certificate services and key vaults can issue and renew certificates automatically and deploy them to load balancers and gateways, which removes the most common cause of certificate outages.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Disabling certificate validation (“just for now”) in a client removes the protection TLS exists for: any interceptor can then present its own certificate. Fix the trust chain instead.',
        },
      ],
    },
    {
      heading: 'Mutual TLS',
      blocks: [
        {
          type: 'paragraph',
          text: 'In ordinary TLS only the server presents a certificate. In mutual TLS (mTLS) the client presents one too, so each side authenticates the other. mTLS is common between services inside a platform (service meshes), for device and partner connections, and as one way for workloads to authenticate — AWS IAM Roles Anywhere, for example, accepts X.509 certificates.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'cert-kc-1',
      type: 'multi-select',
      prompt: 'Which checks does a TLS client perform before trusting a server certificate? Select all that apply.',
      difficulty: 'intermediate',
      learningObjective: 'Explain what a certificate binds together and how a client validates it',
      options: [
        { id: 'a', label: 'It chains to a trusted certificate authority', correct: true, explanation: 'Correct.' },
        { id: 'b', label: 'It covers the hostname being connected to', correct: true, explanation: 'Correct — a valid certificate for another name must be rejected.' },
        { id: 'c', label: 'It is within its validity period', correct: true, explanation: 'Correct.' },
        { id: 'd', label: 'It was issued less than a week ago', correct: false, explanation: 'There is no such rule; validity dates are what matter.' },
      ],
    },
  ],
};

const secretsManagement: LessonBody = {
  learningObjectives: [
    'Distinguish secrets from configuration',
    'Retrieve secrets at runtime with a workload identity, with versioning and access logging',
    'Design rotation that applications survive, and prevent accidental secret exposure',
  ],
  sections: [
    {
      heading: 'Secrets are not configuration',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'Configuration', 'Secrets'],
          rows: [
            ['Examples', 'Feature flags, URLs, timeouts, region names', 'Database passwords, API keys, client secrets, private keys, connection strings with credentials'],
            ['If leaked', 'Usually harmless', 'Grants access to something'],
            ['Storage', 'Configuration files, environment variables, parameter stores', 'A secret store with access control, versioning, and logging'],
            ['Lifecycle', 'Changes with deployments', 'Rotated on a schedule and after any suspected exposure'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The best secret is the one that does not exist: managed identities and federation remove many credentials entirely. Secrets remain necessary for third-party APIs and systems that do not support cloud identities.',
        },
      ],
    },
    {
      heading: 'Runtime retrieval with a workload identity',
      blocks: [
        {
          type: 'paragraph',
          text: 'The pattern in the diagram: the application authenticates to the secret store with its workload identity, is authorized for specific secrets, and receives the current version at runtime. The secret never appears in source code, images, or deployment manifests, and every read is logged with the caller’s identity. Grant access per secret or per vault — one vault per application and environment is a common way to keep scopes small.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Platform integrations can do the retrieval for you — for example App Service Key Vault references, the Secrets Store CSI driver for Kubernetes, and ECS or Lambda integrations with Secrets Manager — but the same identity and authorization rules apply.',
        },
      ],
    },
    {
      heading: 'Versioning and rotation',
      blocks: [
        {
          type: 'list',
          items: [
            'Every change creates a new version; applications normally read the current version, and earlier versions remain available for rollback.',
            'Rotation changes the secret in the store and in the system that verifies it (the database, the API provider) together. Strategies include single-user rotation (briefly, the old password stops working) and alternating users (two credentials, one always valid during the switch).',
            'Applications must follow rotation: re-read the secret when authentication fails, or on a refresh interval. Caching a secret forever turns every rotation into an outage, which in practice stops teams from rotating.',
          ],
        },
      ],
    },
    {
      heading: 'Preventing exposure',
      blocks: [
        {
          type: 'list',
          items: [
            'Never commit secrets; scan repositories and pull requests automatically, and block pushes that contain them.',
            'Never bake secrets into container images or VM images — layers and image metadata are readable by anyone who can pull the image.',
            'Keep secrets out of logs, error messages, crash reports, and URLs (query strings end up in access logs).',
            'Restrict who can read secrets in production; separate the people who manage the vault from the workloads that read secrets.',
            'Treat any exposed secret as compromised: rotate first, then investigate using the access logs.',
          ],
        },
      ],
    },
  ],
  visualization: secretRetrievalScene,
  knowledgeCheck: [
    {
      id: 'sec-kc-1',
      type: 'scenario',
      prompt:
        'After the first scheduled rotation of a database password, an application fails until it is restarted. The secret store shows the rotation succeeded. What should change?',
      difficulty: 'intermediate',
      learningObjective: 'Design rotation that applications survive, and prevent accidental secret exposure',
      options: [
        { id: 'a', label: 'The app should re-read the current secret version when authentication fails (or periodically) instead of caching it forever', correct: true, explanation: 'Correct — retrieval and rotation must be designed together.' },
        { id: 'b', label: 'Disable rotation', correct: false, explanation: 'That trades an availability problem for a security problem.' },
        { id: 'c', label: 'Store the password in the container image so it is always available', correct: false, explanation: 'That makes rotation require a rebuild and exposes the secret to anyone who can pull the image.' },
      ],
    },
    {
      id: 'sec-kc-2',
      type: 'multi-select',
      prompt: 'Which of these are secrets that belong in a secret store? Select all that apply.',
      difficulty: 'beginner',
      learningObjective: 'Distinguish secrets from configuration',
      options: [
        { id: 'a', label: 'A third-party payment API key', correct: true, explanation: 'Correct.' },
        { id: 'b', label: 'The private key of a TLS certificate', correct: true, explanation: 'Correct — whoever holds it can impersonate the site.' },
        { id: 'c', label: 'The name of the region the app runs in', correct: false, explanation: 'This is configuration; leaking it grants nothing.' },
        { id: 'd', label: 'A database connection string that includes a password', correct: true, explanation: 'Correct — the password makes the whole string a secret.' },
      ],
    },
  ],
};

const azureKeyVault: LessonBody = {
  learningObjectives: [
    'Describe Key Vault’s keys, secrets, and certificates and the Standard, Premium, and Managed HSM options',
    'Authorize Key Vault access with Azure RBAC data-plane roles',
    'Explain soft delete, purge protection, and customer-managed keys for Azure services',
  ],
  sections: [
    {
      heading: 'One service, three object types',
      blocks: [
        {
          type: 'list',
          items: [
            'Keys: cryptographic keys for wrapping, signing, and encryption. Operations happen inside Key Vault; private key material is not exported.',
            'Secrets: versioned values such as passwords and connection strings.',
            'Certificates: X.509 certificates with lifecycle management, including automatic renewal with integrated certificate authorities.',
          ],
        },
        {
          type: 'comparisonTable',
          headers: ['Option', 'Key protection', 'Tenancy'],
          rows: [
            ['Key Vault Standard', 'Software-protected keys', 'Multi-tenant service'],
            ['Key Vault Premium', 'Adds HSM-protected keys', 'Multi-tenant HSMs'],
            ['Managed HSM', 'HSM-protected keys only', 'Dedicated, single-tenant HSM pool that you control'],
          ],
        },
      ],
    },
    {
      heading: 'Access control',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure RBAC is the recommended permission model for Key Vault. Management-plane roles such as Contributor manage the vault but do not read its contents; data-plane roles grant access to objects — Key Vault Secrets User reads secret values, Key Vault Crypto User performs key operations, Key Vault Administrator manages everything. Roles can be assigned on the vault or on individual secrets, keys, and certificates. The older vault access policy model applies only at vault level; switching a vault to RBAC invalidates its access policies, so assign equivalent roles first.',
        },
      ],
    },
    {
      heading: 'Protecting against deletion',
      blocks: [
        {
          type: 'list',
          items: [
            'Soft delete is on for new vaults and cannot be turned off: deleted vaults and objects are retained for 7 to 90 days (90 by default, chosen at creation) and can be recovered.',
            'Purge protection, which is optional and irreversible once enabled, prevents anyone — including administrators — from permanently deleting a soft-deleted vault or object before the retention period ends.',
            'Azure services that use customer-managed keys from Key Vault, such as Azure Storage, require soft delete and purge protection on the vault, because losing the key means losing the data.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Customer-managed keys are configured per service (for example a storage account or managed disk encryption set) and accessed by that service through a managed identity granted a crypto role on the key. Keys can have a rotation policy, and many services can follow the latest key version automatically.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Key Vault and Azure Key Vault Managed HSM',
    keyFeatures: [
      'Keys, secrets, and certificates in one service, all versioned',
      'Standard (software keys), Premium (adds HSM-protected keys), and single-tenant Managed HSM',
      'Azure RBAC data-plane roles at vault or individual-object scope',
      'Soft delete (always on for new vaults) and optional purge protection',
      'Customer-managed keys for Azure services, with key rotation policies',
    ],
    terminology: {
      'Key management service': 'Key Vault (keys) or Managed HSM',
      'Secret store': 'Key Vault (secrets)',
      'Certificate manager': 'Key Vault (certificates)',
      'Key encryption key for a service': 'Customer-managed key in Key Vault or Managed HSM',
      'Deletion safety net': 'Soft delete and purge protection',
    },
    architecturalNotes: [
      'Keys, secrets, and certificates share one vault and one access model; separate vaults per application and environment keep blast radius small.',
      'Management-plane and data-plane permissions are separate.',
      'Services reach customer-managed keys through managed identities.',
    ],
    limitations: [
      'Purge protection cannot be disabled once enabled.',
      'Soft-delete retention is fixed when the vault is created.',
      'Vault access policies are a legacy model and apply only at vault scope.',
    ],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/key-vault/general/overview',
  },
  knowledgeCheck: [
    {
      id: 'akv-kc-1',
      type: 'scenario',
      prompt: 'An engineer with Contributor on a Key Vault (RBAC permission model) cannot read a secret value. What is the least-privilege fix for an application that needs that one secret?',
      difficulty: 'intermediate',
      learningObjective: 'Authorize Key Vault access with Azure RBAC data-plane roles',
      options: [
        { id: 'a', label: 'Assign Key Vault Secrets User to the application’s managed identity on that secret (or vault)', correct: true, explanation: 'Correct — a data-plane read role at the narrowest scope.' },
        { id: 'b', label: 'Assign Owner on the subscription to the application', correct: false, explanation: 'Owner still has no data action for secrets, and it is far too broad.' },
        { id: 'c', label: 'Switch the vault back to access policies', correct: false, explanation: 'That moves to the legacy model without making access narrower.' },
      ],
    },
    {
      id: 'akv-kc-2',
      type: 'single-choice',
      prompt: 'Why does Azure Storage require purge protection on a vault holding its customer-managed key?',
      difficulty: 'advanced',
      learningObjective: 'Explain soft delete, purge protection, and customer-managed keys for Azure services',
      options: [
        { id: 'a', label: 'If the key were permanently deleted, the storage account’s data could never be decrypted again', correct: true, explanation: 'Correct — purge protection guarantees a recovery window.' },
        { id: 'b', label: 'Purge protection makes encryption faster', correct: false, explanation: 'It has no effect on performance.' },
        { id: 'c', label: 'It replaces the need for role assignments', correct: false, explanation: 'Access control is still required.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Key Vault soft delete', url: 'https://learn.microsoft.com/en-us/azure/key-vault/general/soft-delete-overview' },
    { label: 'Key Vault RBAC guide', url: 'https://learn.microsoft.com/en-us/azure/key-vault/general/rbac-guide' },
  ],
};

const awsKmsAndSecretsManager: LessonBody = {
  learningObjectives: [
    'Distinguish AWS owned, AWS managed, and customer managed KMS keys, and explain key policies',
    'Explain how KMS supports envelope encryption and key rotation',
    'Choose between Secrets Manager, Parameter Store, and CloudHSM',
  ],
  sections: [
    {
      heading: 'AWS KMS',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Key type', 'Who manages it', 'Visible to you'],
          rows: [
            ['AWS owned keys', 'AWS, shared across accounts', 'No'],
            ['AWS managed keys (aws/service)', 'AWS, created in your account for a service', 'Yes, but you cannot change their policies or rotation (they rotate yearly)'],
            ['Customer managed keys', 'You', 'Yes — you control the key policy, grants, rotation, enabling, and deletion'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Every KMS key has exactly one key policy, a resource-based policy that is the primary control on the key. IAM policies grant access to a key only if the key policy allows IAM policies to be used for it. Services use KMS for envelope encryption: GenerateDataKey returns a plaintext data key and the same key encrypted under the KMS key, and Decrypt unwraps it later. Every call is recorded in AWS CloudTrail.',
        },
        {
          type: 'paragraph',
          text: 'Automatic rotation is available for symmetric customer managed keys with KMS-generated key material, with a rotation period from 90 to 2,560 days (365 by default); on-demand rotation is also available. Earlier key material is retained so existing data stays decryptable. Deleting a key requires a waiting period of 7 to 30 days, during which deletion can be cancelled.',
        },
      ],
    },
    {
      heading: 'AWS CloudHSM',
      blocks: [
        {
          type: 'paragraph',
          text: 'CloudHSM provides dedicated, single-tenant HSMs in your VPC that you manage — including users and key backups — and use through standard interfaces such as PKCS #11. It suits applications that need direct HSM access or full control over the HSM; KMS can also use a CloudHSM cluster as a custom key store.',
        },
      ],
    },
    {
      heading: 'Secrets Manager and Parameter Store',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'AWS Secrets Manager', 'Systems Manager Parameter Store'],
          rows: [
            ['Designed for', 'Secrets with a lifecycle', 'Configuration values, optionally encrypted as SecureString'],
            ['Encryption', 'Always encrypted with a KMS key', 'SecureString parameters encrypted with a KMS key'],
            ['Rotation', 'Built in: managed rotation for supported services, or a Lambda rotation function', 'No built-in rotation'],
            ['Versions', 'Staging labels: AWSCURRENT, AWSPENDING, AWSPREVIOUS', 'Parameter versions and labels'],
            ['Cross-account access', 'Resource-based secret policies', 'Shared through AWS RAM for advanced-tier parameters'],
          ],
        },
        {
          type: 'paragraph',
          text: 'During a Secrets Manager rotation, the new value is created under AWSPENDING, tested, and then promoted to AWSCURRENT; the old value becomes AWSPREVIOUS. Applications that read AWSCURRENT pick up the new value automatically, provided they re-read it.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS KMS, AWS CloudHSM, AWS Secrets Manager, and Systems Manager Parameter Store',
    keyFeatures: [
      'KMS customer managed keys with key policies, grants, rotation, and CloudTrail logging',
      'GenerateDataKey and Decrypt for envelope encryption',
      'CloudHSM for single-tenant HSMs you manage',
      'Secrets Manager with built-in rotation and staging labels',
      'Parameter Store SecureString parameters for encrypted configuration',
    ],
    terminology: {
      'Key encryption key': 'KMS key (customer managed key for full control)',
      'Key access policy': 'Key policy (plus IAM policies and grants)',
      'Secret store': 'AWS Secrets Manager',
      'Encrypted configuration': 'Parameter Store SecureString',
      'Dedicated HSM': 'AWS CloudHSM',
      'Certificate manager': 'AWS Certificate Manager (ACM)',
    },
    architecturalNotes: [
      'Keys, secrets, configuration, and certificates are separate services, unlike Key Vault.',
      'KMS key policies are mandatory and decide whether IAM policies apply to a key.',
      'Secrets Manager and Parameter Store both use KMS for encryption.',
    ],
    limitations: [
      'AWS managed keys cannot have their policies or rotation changed.',
      'Automatic rotation applies to symmetric customer managed keys with KMS-generated material.',
      'Parameter Store has no built-in secret rotation.',
    ],
    documentationUrl: 'https://docs.aws.amazon.com/kms/latest/developerguide/overview.html',
  },
  knowledgeCheck: [
    {
      id: 'awskms-kc-1',
      type: 'scenario',
      prompt:
        'A role has an IAM policy allowing kms:Decrypt on a customer managed key, but Decrypt calls are denied. The key policy grants access only to a specific administrator role. Why?',
      difficulty: 'advanced',
      learningObjective: 'Distinguish AWS owned, AWS managed, and customer managed KMS keys, and explain key policies',
      options: [
        { id: 'a', label: 'The key policy does not allow IAM policies to grant access to the key, so the IAM allow has no effect', correct: true, explanation: 'Correct — for KMS, the key policy must allow access directly or enable IAM policies.' },
        { id: 'b', label: 'KMS ignores all IAM policies', correct: false, explanation: 'IAM policies work when the key policy enables them.' },
        { id: 'c', label: 'Decrypt requires the root user', correct: false, explanation: 'Any authorized principal can call Decrypt.' },
      ],
    },
    {
      id: 'awskms-kc-2',
      type: 'single-choice',
      prompt: 'A team needs to store a third-party API key that must rotate every 30 days. Which AWS service fits best?',
      difficulty: 'beginner',
      learningObjective: 'Choose between Secrets Manager, Parameter Store, and CloudHSM',
      options: [
        { id: 'a', label: 'AWS Secrets Manager, with a rotation function', correct: true, explanation: 'Correct — rotation and versioning are built in.' },
        { id: 'b', label: 'A Parameter Store String parameter', correct: false, explanation: 'Not encrypted, and Parameter Store has no built-in rotation.' },
        { id: 'c', label: 'An environment variable in the Lambda function', correct: false, explanation: 'No versioning or rotation, and visible to anyone who can read the function configuration.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Rotate AWS KMS keys', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html' },
    { label: 'Secrets Manager rotation with Lambda functions', url: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_lambda-functions.html' },
  ],
};

const dataProtectionComparison: LessonBody = {
  learningObjectives: ['Map key, secret, certificate, and HSM services across Azure and AWS, including their differences in scope and access control'],
  sections: [
    {
      heading: 'One vault, or several services',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Key Vault combines keys, secrets, and certificates in one resource with one access model. AWS spreads the same jobs across KMS (keys), Secrets Manager (secrets), Parameter Store (configuration), and AWS Certificate Manager (certificates). Neither is simply better: one vault is simpler to reason about; separate services let each be specialised and governed separately.',
        },
        {
          type: 'comparisonTable',
          headers: ['Need', 'Azure', 'AWS'],
          rows: [
            ['Managed key service', 'Key Vault keys (Standard or Premium)', 'AWS KMS'],
            ['Dedicated single-tenant HSM', 'Managed HSM', 'CloudHSM (you manage it); KMS custom key stores'],
            ['Secrets with versioning', 'Key Vault secrets', 'Secrets Manager'],
            ['Built-in secret rotation', 'Rotation policies for keys; secret rotation through Event Grid notifications and your own function', 'Managed rotation or Lambda rotation functions'],
            ['Encrypted configuration', 'App Configuration with Key Vault references', 'Parameter Store SecureString'],
            ['Access control', 'Azure RBAC data-plane roles (vault or object scope)', 'Key policies (mandatory) plus IAM policies; secret resource policies'],
            ['Deletion safety', 'Soft delete and optional purge protection', 'KMS key deletion waiting period; Secrets Manager recovery window'],
            ['Audit', 'Key Vault diagnostic logs', 'AWS CloudTrail'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The pairs are conceptual. KMS key policies have no direct Key Vault equivalent, and Secrets Manager’s built-in rotation goes further than Key Vault’s event-driven secret rotation pattern. Evaluate each against the requirement rather than assuming parity.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'dpcmp-kc-1',
      type: 'single-choice',
      prompt: 'Which statement about the two platforms’ access models for keys is accurate?',
      difficulty: 'intermediate',
      learningObjective: 'Map key, secret, certificate, and HSM services across Azure and AWS, including their differences in scope and access control',
      options: [
        { id: 'a', label: 'Every AWS KMS key has a mandatory key policy; Key Vault relies on Azure RBAC roles assigned at vault or object scope', correct: true, explanation: 'Correct — the mechanisms differ even though both control who may use a key.' },
        { id: 'b', label: 'Both rely only on network firewalls', correct: false, explanation: 'Both use identity-based authorization; network rules are an additional layer.' },
        { id: 'c', label: 'Key Vault keys have key policies identical to KMS', correct: false, explanation: 'Key Vault has no key policy document.' },
      ],
    },
  ],
};

const envelopeLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Run envelope encryption step by step and watch where the plaintext, data key, wrapped data key, ciphertext, and key encryption key live at each moment. Then revoke the application’s key permission, disable, rotate, and delete the KEK, and let an attacker copy the storage. Keys and ciphertext are symbolic — no real cryptography runs, and nothing leaves your browser.',
  learningObjectives: [
    'Explain where each key lives during envelope encryption and decryption',
    'Predict the effect of key permissions, rotation, disabling, and deletion',
    'Explain why a copy of encrypted storage is useless without permission on the KEK',
  ],
  prerequisites: [
    { type: 'concept', id: 'envelope-encryption-and-kms', label: 'Envelope Encryption and Key Management Services', description: 'DEKs, KEKs, and key lifecycle.' },
  ],
  content: {
    simulationId: envelopeEncryptionSimulation.id,
    instructions: [
      { id: 'encrypt', label: '1. Encrypt', description: 'Run the default encryption. Note when the plaintext data key appears in memory and when it is erased.' },
      { id: 'decrypt', label: '2. Decrypt', description: 'Switch to decryption. Only the small wrapped key goes to the key service.' },
      { id: 'rotate', label: '3. Rotation', description: 'Turn on “KEK rotated” and decrypt again. Existing data remains readable.' },
      { id: 'copy', label: '4. Stolen storage', description: 'Turn on the storage copy. What does the attacker hold, and what would they still need?' },
      { id: 'revoke', label: '5. Revoke and disable', description: 'Remove the application’s KEK permission, then restore it and disable the KEK instead. Compare the two failures.' },
      { id: 'delete', label: '6. Delete the KEK', description: 'Set the KEK to deleted and decrypt. Why do key services enforce a waiting period before deletion?' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'encrypted',
        label: 'Encrypted a record and erased the plaintext data key',
        check: (state) => {
          const s = state as EnvelopeState;
          return s.outcome === 'encrypted' && s.artifacts.dek.status === 'erased';
        },
      },
      {
        id: 'rotated-decrypt',
        label: 'Decrypted existing data after the KEK was rotated',
        check: (state) => {
          const s = state as EnvelopeState;
          return s.outcome === 'decrypted' && s.config.kekRotated;
        },
      },
      {
        id: 'stolen-unreadable',
        label: 'Showed that a stolen copy of the storage is unreadable without the KEK',
        check: (state) => (state as EnvelopeState).attackerCanRead === false,
      },
      {
        id: 'shredded',
        label: 'Observed crypto-shredding: data unrecoverable after the KEK was deleted',
        check: (state) => {
          const s = state as EnvelopeState;
          return s.failure === 'key-deleted' && s.config.operation === 'decrypt';
        },
      },
    ],
  },
};

const secretLab: LabBody = {
  difficulty: 'beginner',
  estimatedTime: '15 minutes',
  description:
    'Follow a database password from where it is stored through application startup, rotation, and a leak of the container image and repository. Compare a secret store accessed with a workload identity against a secret baked into an image or hardcoded in source. Simulated in your browser — no secret store, database, or registry is contacted.',
  learningObjectives: [
    'Retrieve a secret at runtime with a workload identity and explain each authorization step',
    'Design an application that survives secret rotation',
    'Explain why secrets in source code and images are dangerous',
  ],
  prerequisites: [
    { type: 'concept', id: 'secrets-management', label: 'Secrets Management', description: 'Retrieval, versioning, and rotation.' },
  ],
  content: {
    simulationId: secretRetrievalSimulation.id,
    instructions: [
      { id: 'store', label: '1. Runtime retrieval', description: 'Run the default: the app authenticates with its workload identity and reads the current version.' },
      { id: 'denied', label: '2. Authorization', description: 'Remove the identity’s permission. The app fails fast at startup — and the denial is logged.' },
      { id: 'rotate', label: '3. Rotation', description: 'Restore the permission and rotate. Then switch the app to “cache forever” and rotate again.' },
      { id: 'image', label: '4. Baked into the image', description: 'Move the password into the container image and turn on the leak. Then try rotating.' },
      { id: 'leak-store', label: '5. The same leak, with a secret store', description: 'Switch back to the secret store with the leak on. What does the outsider find?' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'retrieved',
        label: 'Retrieved the secret at runtime with a workload identity',
        check: (state) => {
          const s = state as SecretState;
          return s.config.location === 'secret-store' && s.events.some((e) => e.phase === 'retrieve');
        },
      },
      {
        id: 'survived-rotation',
        label: 'The app survived a rotation by re-reading the current version',
        check: (state) => (state as SecretState).summary?.rotationOutcome === 'followed',
      },
      {
        id: 'cache-broke',
        label: 'Saw a rotation break an app that caches its secret forever',
        check: (state) => (state as SecretState).summary?.rotationOutcome === 'broke-app',
      },
      {
        id: 'baked-leak',
        label: 'Saw a secret in an image or source code leak with no audit trail',
        check: (state) => {
          const s = state as SecretState;
          return s.summary?.secretExposed === true && s.summary.auditTrail === false;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'encryption-fundamentals': encryptionFundamentals,
    'envelope-encryption-and-kms': envelopeEncryptionAndKms,
    'certificates-and-tls': certificatesAndTls,
    'secrets-management': secretsManagement,
    'azure-key-vault': azureKeyVault,
    'aws-kms-and-secrets-manager': awsKmsAndSecretsManager,
    'data-protection-comparison': dataProtectionComparison,
  },
  labs: {
    'envelope-encryption-lab': envelopeLab,
    'secret-retrieval-lab': secretLab,
  },
  simulations: {
    'envelope-encryption-lab': bindSimulation(envelopeEncryptionSimulation, renderEnvelopeState),
    'secret-retrieval-lab': bindSimulation(secretRetrievalSimulation, renderSecretState),
  },
};
