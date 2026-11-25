import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A conceptual model of envelope encryption with a key management service.
// No real cryptography runs: keys and ciphertext are symbolic labels, because
// the point is where each key lives, who may use it, and what an attacker can
// do with copies — not the cipher arithmetic. Simulated; nothing is sent to a
// key management service.

export type Operation = 'encrypt' | 'decrypt';
export type KekState = 'enabled' | 'disabled' | 'pending-deletion' | 'deleted';

export interface EnvelopeConfig {
  operation: Operation;
  callerAuthorized: boolean;
  kekState: KekState;
  kekRotated: boolean;
  storageCopied: boolean;
}

export type ArtifactId = 'plaintext' | 'dek' | 'wrappedDek' | 'ciphertext' | 'kek';
export type ArtifactStatus = 'absent' | 'in-memory' | 'stored' | 'erased' | 'in-kms' | 'unusable';

export interface Artifact {
  id: ArtifactId;
  label: string;
  location: string;
  status: ArtifactStatus;
}

export interface EnvelopeEvent {
  title: string;
  detail: string;
  result: 'info' | 'ok' | 'fail';
}

export type EnvelopeOutcome = 'encrypted' | 'decrypted' | 'failed';
export type EnvelopeFailure = 'access-denied' | 'key-disabled' | 'key-deleted' | null;

export interface EnvelopeState {
  config: EnvelopeConfig;
  artifacts: Record<ArtifactId, Artifact>;
  events: EnvelopeEvent[];
  outcome: EnvelopeOutcome | null;
  failure: EnvelopeFailure;
  attackerCanRead: boolean | null;
}

const KEK_NAME = 'orders-kek';
const DEK_ID = 'dek-7f3a';
const RECORD = 'Customer record #1042 (name, email, delivery address)';

type Snapshot = Record<ArtifactId, Artifact>;

function initialArtifacts(config: EnvelopeConfig): Snapshot {
  const kekVersion = config.kekRotated ? 'version 2 (version 1 retained for decryption)' : 'version 1';
  const kekStatus: ArtifactStatus = config.kekState === 'enabled' ? 'in-kms' : 'unusable';
  const kek: Artifact = { id: 'kek', label: `KEK ${KEK_NAME}, ${kekVersion}`, location: `Key management service (${config.kekState.replace('-', ' ')})`, status: kekStatus };
  if (config.operation === 'encrypt') {
    return {
      plaintext: { id: 'plaintext', label: RECORD, location: 'Application memory', status: 'in-memory' },
      dek: { id: 'dek', label: `Data key ${DEK_ID} (plaintext)`, location: '—', status: 'absent' },
      wrappedDek: { id: 'wrappedDek', label: `Data key ${DEK_ID}, wrapped by ${KEK_NAME}`, location: '—', status: 'absent' },
      ciphertext: { id: 'ciphertext', label: 'Ciphertext of the record', location: '—', status: 'absent' },
      kek,
    };
  }
  return {
    plaintext: { id: 'plaintext', label: RECORD, location: '—', status: 'absent' },
    dek: { id: 'dek', label: `Data key ${DEK_ID} (plaintext)`, location: '—', status: 'absent' },
    wrappedDek: { id: 'wrappedDek', label: `Data key ${DEK_ID}, wrapped by ${KEK_NAME} version 1`, location: 'Storage, next to the ciphertext', status: 'stored' },
    ciphertext: { id: 'ciphertext', label: 'Ciphertext of the record', location: 'Storage', status: 'stored' },
    kek,
  };
}

interface Step {
  event: EnvelopeEvent;
  changes: Partial<Snapshot>;
}

function kmsRefusal(config: EnvelopeConfig, verb: string): { failure: EnvelopeFailure; detail: string } | null {
  if (!config.callerAuthorized) {
    return {
      failure: 'access-denied',
      detail: `The key service checks the caller’s permission on ${KEK_NAME} (for example kms:${verb === 'generate' ? 'GenerateDataKey' : 'Decrypt'} on AWS, or wrapKey/unwrapKey on Azure Key Vault). The caller has none, so the request is denied and logged. Holding the wrapped key is useless without this permission.`,
    };
  }
  if (config.kekState === 'disabled') {
    return { failure: 'key-disabled', detail: `${KEK_NAME} is disabled, so the key service refuses every cryptographic operation with it. Re-enabling the key restores access; nothing was lost.` };
  }
  if (config.kekState === 'pending-deletion') {
    return {
      failure: 'key-disabled',
      detail: `${KEK_NAME} is scheduled for deletion and cannot be used. During the waiting period the deletion can still be cancelled — the safety net that exists because deleting a KEK is irreversible.`,
    };
  }
  if (config.kekState === 'deleted') {
    return {
      failure: 'key-deleted',
      detail: `${KEK_NAME} has been permanently deleted. Every DEK it wrapped can no longer be unwrapped, so all data encrypted under it is unrecoverable — by anyone, including you. Deliberately done, this is “crypto-shredding”; done by accident, it is data loss.`,
    };
  }
  return null;
}

export function simulateEnvelope(config: EnvelopeConfig): { steps: Step[]; outcome: EnvelopeOutcome; failure: EnvelopeFailure; attackerCanRead: boolean | null } {
  const steps: Step[] = [];
  const art = initialArtifacts(config);

  if (config.operation === 'encrypt') {
    steps.push({
      event: { title: 'Request a data key', detail: `The application asks the key service for a new data key under ${KEK_NAME}${config.kekRotated ? ' (the key service uses the KEK’s current version, version 2)' : ''}.`, result: 'info' },
      changes: {},
    });
    const refusal = kmsRefusal(config, 'generate');
    if (refusal) {
      steps.push({ event: { title: 'Key service refuses', detail: refusal.detail + ' The record stays unencrypted in memory and must not be written.', result: 'fail' }, changes: {} });
      return { steps, outcome: 'failed', failure: refusal.failure, attackerCanRead: null };
    }
    steps.push({
      event: {
        title: 'Plaintext DEK and wrapped DEK returned',
        detail: `The key service generates ${DEK_ID} and returns it twice: in plaintext, and wrapped (encrypted) by ${KEK_NAME}. The KEK itself never leaves the key service.`,
        result: 'ok',
      },
      changes: {
        dek: { ...art.dek, location: 'Application memory', status: 'in-memory' },
        wrappedDek: { ...art.wrappedDek, label: `Data key ${DEK_ID}, wrapped by ${KEK_NAME} version ${config.kekRotated ? 2 : 1}`, location: 'Application memory', status: 'in-memory' },
      },
    });
    steps.push({
      event: { title: 'Encrypt the record locally', detail: `The application encrypts the record with ${DEK_ID} using a symmetric authenticated cipher such as AES-GCM. The data never travels to the key service.`, result: 'ok' },
      changes: { ciphertext: { ...art.ciphertext, location: 'Application memory', status: 'in-memory' } },
    });
    steps.push({
      event: { title: 'Erase plaintext, store ciphertext and wrapped DEK', detail: 'The application erases the plaintext DEK and the plaintext record from memory and writes the ciphertext together with the wrapped DEK.', result: 'ok' },
      changes: {
        dek: { ...art.dek, location: 'Erased from memory', status: 'erased' },
        plaintext: { ...art.plaintext, location: 'Erased from memory', status: 'erased' },
        ciphertext: { ...art.ciphertext, location: 'Storage', status: 'stored' },
        wrappedDek: { ...art.wrappedDek, label: `Data key ${DEK_ID}, wrapped by ${KEK_NAME} version ${config.kekRotated ? 2 : 1}`, location: 'Storage, next to the ciphertext', status: 'stored' },
      },
    });
  } else {
    steps.push({ event: { title: 'Read ciphertext and wrapped DEK', detail: `The application reads the stored ciphertext and the wrapped ${DEK_ID}, which records that it was wrapped by ${KEK_NAME} version 1.`, result: 'info' }, changes: {} });
    steps.push({
      event: {
        title: 'Ask the key service to unwrap the DEK',
        detail: `Only the small wrapped key is sent — never the data.${config.kekRotated ? ` ${KEK_NAME} has since been rotated to version 2, but the key service keeps version 1’s key material and uses the version recorded with the wrapped key. Rotation does not require re-encrypting existing data.` : ''}`,
        result: 'info',
      },
      changes: {},
    });
    const refusal = kmsRefusal(config, 'decrypt');
    if (refusal) {
      steps.push({ event: { title: 'Key service refuses', detail: refusal.detail, result: 'fail' }, changes: {} });
      return { steps, outcome: 'failed', failure: refusal.failure, attackerCanRead: config.storageCopied ? false : null };
    }
    steps.push({
      event: { title: 'Plaintext DEK returned', detail: `The key service unwraps ${DEK_ID} with ${KEK_NAME} version 1, logs the decryption request, and returns the plaintext DEK.`, result: 'ok' },
      changes: { dek: { ...art.dek, location: 'Application memory', status: 'in-memory' } },
    });
    steps.push({
      event: { title: 'Decrypt locally and erase the DEK', detail: `The application decrypts the record with ${DEK_ID}, then erases the DEK. The plaintext now exists only in application memory.`, result: 'ok' },
      changes: {
        plaintext: { ...art.plaintext, location: 'Application memory', status: 'in-memory' },
        dek: { ...art.dek, location: 'Erased from memory', status: 'erased' },
      },
    });
  }

  let attackerCanRead: boolean | null = null;
  if (config.storageCopied) {
    attackerCanRead = false;
    steps.push({
      event: {
        title: 'An attacker copies the storage',
        detail: `The attacker gets the ciphertext and the wrapped ${DEK_ID}. To read the record they would need the key service to unwrap the DEK — which requires an identity with permission on ${KEK_NAME}. The copy alone is unreadable. (If the attacker had also stolen such an identity, encryption would not stop them — access control would be the failing layer.)`,
        result: 'ok',
      },
      changes: {},
    });
  }
  return { steps, outcome: config.operation === 'encrypt' ? 'encrypted' : 'decrypted', failure: null, attackerCanRead };
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readEnvelopeConfig(params: SimulationParams): EnvelopeConfig {
  return {
    operation: pick(params.operation, ['encrypt', 'decrypt'] as const, 'encrypt'),
    callerAuthorized: params.callerAuthorized !== false,
    kekState: pick(params.kekState, ['enabled', 'disabled', 'pending-deletion', 'deleted'] as const, 'enabled'),
    kekRotated: params.kekRotated === true,
    storageCopied: params.storageCopied === true,
  };
}

export const envelopeEncryptionSimulation: SimulationDefinition<EnvelopeState> = {
  id: 'envelope-encryption',
  title: 'Envelope Encryption Explorer',
  description:
    'Encrypts or decrypts one record with a data key wrapped by a key encryption key held in a key management service. Keys and ciphertext are symbolic — no real cryptography runs — so you can follow where each key lives and who can use it.',
  parameters: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      default: 'encrypt',
      options: [
        { label: 'Encrypt and store a record', value: 'encrypt' },
        { label: 'Read and decrypt a stored record', value: 'decrypt' },
      ],
      description: 'Which half of the envelope flow to run.',
    },
    { key: 'callerAuthorized', label: 'Application may use the KEK', type: 'boolean', default: true, description: 'The app’s identity has permission to generate and unwrap data keys with orders-kek.' },
    {
      key: 'kekState',
      label: 'KEK state',
      type: 'select',
      default: 'enabled',
      options: [
        { label: 'Enabled', value: 'enabled' },
        { label: 'Disabled', value: 'disabled' },
        { label: 'Scheduled for deletion', value: 'pending-deletion' },
        { label: 'Deleted', value: 'deleted' },
      ],
      description: 'The lifecycle state of orders-kek in the key service.',
    },
    { key: 'kekRotated', label: 'KEK rotated since the record was stored', type: 'boolean', default: false, description: 'A new KEK version exists; earlier versions are retained for decryption.' },
    { key: 'storageCopied', label: 'An attacker copies the storage', type: 'boolean', default: false, description: 'The attacker obtains the ciphertext and wrapped key, but no identity.' },
  ],
  createInitialState: (params) => {
    const config = readEnvelopeConfig(params);
    return { config, artifacts: initialArtifacts(config), events: [], outcome: null, failure: null, attackerCanRead: null };
  },
  steps: (params) => {
    const config = readEnvelopeConfig(params);
    const result = simulateEnvelope(config);
    return result.steps.map((step, i) => {
      const isLast = i === result.steps.length - 1;
      return {
        id: `env-${i + 1}`,
        label: step.event.title,
        description: step.event.detail,
        apply: (state: EnvelopeState): EnvelopeState => ({
          ...state,
          artifacts: { ...state.artifacts, ...step.changes },
          events: [...state.events, step.event],
          outcome: isLast ? result.outcome : null,
          failure: isLast ? result.failure : null,
          attackerCanRead: isLast ? result.attackerCanRead : null,
        }),
      };
    });
  },
};
