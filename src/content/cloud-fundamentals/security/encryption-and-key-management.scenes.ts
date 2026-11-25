import type { SceneDefinition } from '../../../engines/visualization/types';

export const envelopeScene: SceneDefinition = {
  id: 'envelope-encryption',
  type: 'sequence',
  title: 'Envelope encryption: encrypt, store, and decrypt one record',
  nodes: [
    { id: 'app', type: 'server', label: 'Application', position: { x: 0, y: 0 }, data: { Holds: 'A plaintext data key only for the moment it needs it' } },
    {
      id: 'kms',
      type: 'key',
      label: 'Key management service',
      position: { x: 0, y: 0 },
      data: { Holds: 'The key encryption key (KEK), which never leaves it', 'Backed by': 'Hardware security modules', Examples: 'AWS KMS, Azure Key Vault' },
    },
    { id: 'store', type: 'storage', label: 'Storage', position: { x: 0, y: 0 }, data: { Holds: 'Ciphertext plus the wrapped data key — never a plaintext key' } },
  ],
  edges: [
    { id: 'v1', source: 'app', target: 'kms', label: 'generate a data key under the KEK' },
    { id: 'v2', source: 'kms', target: 'app', label: 'plaintext DEK + wrapped DEK' },
    { id: 'v3', source: 'app', target: 'store', label: 'ciphertext + wrapped DEK' },
    { id: 'v4', source: 'store', target: 'app', label: 'read ciphertext + wrapped DEK' },
    { id: 'v5', source: 'app', target: 'kms', label: 'unwrap this DEK (authorized?)' },
    { id: 'v6', source: 'kms', target: 'app', label: 'plaintext DEK' },
  ],
  states: [
    {
      id: 'ev0',
      label: 'Two kinds of key',
      description:
        'Envelope encryption uses a data encryption key (DEK) to encrypt the data, and a key encryption key (KEK) to encrypt — “wrap” — the DEK. The KEK stays inside the key management service; the application never sees it.',
    },
    {
      id: 'ev1',
      label: 'Request a data key',
      description:
        'To encrypt a record, the application asks the key management service for a new data key under a named KEK. The service first checks that the caller is authorized to use that KEK.',
    },
    {
      id: 'ev2',
      label: 'Two copies of the same DEK',
      description:
        'The service returns the DEK in plaintext and the same DEK wrapped by the KEK. The application encrypts the record locally with the plaintext DEK — fast, symmetric encryption, with no size limit imposed by the key service — then erases the plaintext DEK from memory.',
    },
    {
      id: 'ev3',
      label: 'Store ciphertext with its wrapped key',
      description:
        'The ciphertext and the wrapped DEK are stored together. Anyone who copies the storage gets both — and neither is useful without permission to ask the key service to unwrap the DEK.',
    },
    { id: 'ev4', label: 'Later: read the record back', description: 'To decrypt, the application reads the ciphertext and its wrapped DEK.' },
    {
      id: 'ev5',
      label: 'Ask the key service to unwrap',
      description:
        'The application sends only the small wrapped DEK to the key service — never the data. The service checks authorization again and logs the request: every decryption leaves an audit record.',
    },
    {
      id: 'ev6',
      label: 'Decrypt locally',
      description:
        'The service returns the plaintext DEK, the application decrypts the record locally, and erases the DEK. Revoking the application’s permission on the KEK — or disabling the KEK — stops all future decryption without touching the stored data.',
    },
  ],
};

export const secretRetrievalScene: SceneDefinition = {
  id: 'secret-retrieval-flow',
  type: 'sequence',
  title: 'An application retrieves a database password at runtime',
  nodes: [
    { id: 'app', type: 'server', label: 'Application', position: { x: 0, y: 0 }, data: { Image: 'Contains no secrets — safe to share between environments' } },
    { id: 'idp', type: 'identity', label: 'Workload identity', position: { x: 0, y: 0 }, data: { Is: 'A managed identity or IAM role issued by the platform' } },
    { id: 'vault', type: 'secret', label: 'Secret store', position: { x: 0, y: 0 }, data: { Examples: 'Azure Key Vault, AWS Secrets Manager', Keeps: 'Versions, access logs, rotation schedule' } },
    { id: 'db', type: 'database', label: 'Database', position: { x: 0, y: 0 }, data: { Accepts: 'The current password version only' } },
  ],
  edges: [
    { id: 's1', source: 'app', target: 'idp', label: 'get a token (no secret needed)' },
    { id: 's2', source: 'idp', target: 'app', label: 'short-lived token' },
    { id: 's3', source: 'app', target: 'vault', label: 'get secret db-password + token' },
    { id: 's4', source: 'vault', target: 'app', label: 'current version (access logged)' },
    { id: 's5', source: 'app', target: 'db', label: 'connect with the password' },
    { id: 's6', source: 'vault', target: 'db', label: 'rotation: set a new password' },
    { id: 's7', source: 'app', target: 'vault', label: 'auth fails → re-read latest version' },
  ],
  states: [
    { id: 'sr0', label: 'The app starts with no secrets', description: 'The container image and configuration contain only the secret’s name and the vault’s address — nothing sensitive.' },
    { id: 'sr1', label: 'Authenticate as the workload', description: 'The app obtains a token for its workload identity from the platform. This step needs no stored credential: it is how the “secret zero” problem is avoided.' },
    { id: 'sr2', label: 'Token issued', description: 'The platform returns a short-lived token for the secret store.' },
    { id: 'sr3', label: 'Request the secret', description: 'The app asks the secret store for db-password, presenting its token.' },
    {
      id: 'sr4',
      label: 'Authorized and logged',
      description:
        'The secret store checks that this identity may read this specific secret, returns the current version, and records who read which secret and when. Grant read access per secret or per vault, not across every vault in the subscription or account.',
    },
    { id: 'sr5', label: 'Use the secret', description: 'The app connects to the database. The password exists only in its memory.' },
    {
      id: 'sr6',
      label: 'Rotation',
      description:
        'On schedule, rotation generates a new password, sets it on the database, and stores it as a new secret version. The previous version is kept for rollback but may no longer work against the database.',
    },
    {
      id: 'sr7',
      label: 'The app follows the rotation',
      description:
        'When its old password is rejected — or on a refresh interval — the app re-reads the latest version and reconnects. An app that caches the secret forever breaks at the first rotation; that is why rotation must be designed together with retrieval.',
    },
  ],
};
