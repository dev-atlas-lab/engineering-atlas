import { describe, it, expect } from 'vitest';
import { computeHistory } from '../../../engines/simulation/use-simulation';
import { envelopeEncryptionSimulation, simulateEnvelope, type EnvelopeConfig } from './envelope-encryption';
import { secretRetrievalSimulation, simulateSecret, type SecretConfig } from './secret-retrieval';

const envBase: EnvelopeConfig = { operation: 'encrypt', callerAuthorized: true, kekState: 'enabled', kekRotated: false, storageCopied: false };
const envelope = (overrides: Partial<EnvelopeConfig>) => simulateEnvelope({ ...envBase, ...overrides });

function finalState(params: Record<string, string | boolean>) {
  const history = computeHistory(envelopeEncryptionSimulation, params);
  return history[history.length - 1]!.state;
}

describe('envelope encryption', () => {
  it('encrypts locally, stores the wrapped key with the ciphertext, and erases the plaintext key', () => {
    const state = finalState({ operation: 'encrypt' });
    expect(state.outcome).toBe('encrypted');
    expect(state.artifacts.dek.status).toBe('erased');
    expect(state.artifacts.plaintext.status).toBe('erased');
    expect(state.artifacts.ciphertext.status).toBe('stored');
    expect(state.artifacts.wrappedDek.status).toBe('stored');
    expect(state.artifacts.kek.status).toBe('in-kms');
  });

  it('never moves the KEK out of the key service', () => {
    const history = computeHistory(envelopeEncryptionSimulation, { operation: 'decrypt', kekRotated: true });
    for (const entry of history) expect(entry.state.artifacts.kek.location).toMatch(/^Key management service/);
  });

  it('decrypts existing data after the KEK is rotated', () => {
    const result = envelope({ operation: 'decrypt', kekRotated: true });
    expect(result.outcome).toBe('decrypted');
    expect(result.steps.some((s) => /does not require re-encrypting/.test(s.event.detail))).toBe(true);
  });

  it('wraps new data keys with the current KEK version after rotation', () => {
    const state = finalState({ operation: 'encrypt', kekRotated: true });
    expect(state.artifacts.wrappedDek.label).toMatch(/version 2/);
  });

  it('refuses unauthorized callers', () => {
    expect(envelope({ callerAuthorized: false })).toMatchObject({ outcome: 'failed', failure: 'access-denied' });
    expect(envelope({ operation: 'decrypt', callerAuthorized: false })).toMatchObject({ outcome: 'failed', failure: 'access-denied' });
  });

  it('blocks disabled and pending-deletion keys reversibly, and deleted keys permanently', () => {
    expect(envelope({ operation: 'decrypt', kekState: 'disabled' }).failure).toBe('key-disabled');
    expect(envelope({ operation: 'decrypt', kekState: 'pending-deletion' }).failure).toBe('key-disabled');
    const deleted = envelope({ operation: 'decrypt', kekState: 'deleted' });
    expect(deleted.failure).toBe('key-deleted');
    expect(deleted.steps[deleted.steps.length - 1]!.event.detail).toMatch(/unrecoverable/);
  });

  it('leaves a copied storage unreadable without permission on the KEK', () => {
    expect(envelope({ storageCopied: true }).attackerCanRead).toBe(false);
    expect(envelope({ operation: 'decrypt', storageCopied: true }).attackerCanRead).toBe(false);
  });

  it('is deterministic', () => {
    const params = { operation: 'decrypt', storageCopied: true, kekRotated: true };
    expect(JSON.stringify(computeHistory(envelopeEncryptionSimulation, params))).toBe(JSON.stringify(computeHistory(envelopeEncryptionSimulation, params)));
  });
});

const secretBase: SecretConfig = { location: 'secret-store', authorized: true, rotation: false, handling: 'reload-on-failure', exposed: false };
const secret = (overrides: Partial<SecretConfig>) => simulateSecret({ ...secretBase, ...overrides });

describe('secret retrieval', () => {
  it('authenticates with the workload identity, authorizes, retrieves, and uses the secret, in order', () => {
    const { events, summary } = secret({});
    expect(events.map((e) => e.phase)).toEqual(['start', 'authenticate', 'authorize', 'retrieve', 'use']);
    expect(summary).toMatchObject({ appWorking: true, auditTrail: true, secretExposed: false });
  });

  it('fails closed at startup when the identity is not authorized', () => {
    const { events, summary } = secret({ authorized: false });
    expect(events[events.length - 1]).toMatchObject({ phase: 'authorize', result: 'fail' });
    expect(events.some((e) => e.phase === 'retrieve')).toBe(false);
    expect(summary.appWorking).toBe(false);
  });

  it('follows a rotation when the app re-reads the current version', () => {
    const { summary, finalVersions } = secret({ rotation: true });
    expect(summary).toMatchObject({ appWorking: true, rotationOutcome: 'followed' });
    expect(finalVersions).toEqual([
      { version: 'v2', status: 'current' },
      { version: 'v1', status: 'previous' },
    ]);
  });

  it('breaks an app that caches its secret forever', () => {
    expect(secret({ rotation: true, handling: 'cache-forever' }).summary).toMatchObject({ appWorking: false, rotationOutcome: 'broke-app' });
  });

  it('tracks which version the app holds through rotation', () => {
    const history = computeHistory(secretRetrievalSimulation, { rotation: true });
    expect(history[history.length - 1]!.state.appHolds).toBe('v2');
  });

  it('exposes nothing usable when only the image and repository leak', () => {
    expect(secret({ exposed: true }).summary.secretExposed).toBe(false);
  });

  it('exposes secrets baked into images or source, with no audit trail, and makes rotation require a rebuild', () => {
    for (const location of ['container-image', 'source-code'] as const) {
      const { summary } = secret({ location, exposed: true, rotation: true });
      expect(summary).toMatchObject({ secretExposed: true, auditTrail: false, rotationOutcome: 'requires-rebuild', appWorking: false });
    }
  });

  it('is deterministic', () => {
    const params = { location: 'container-image', exposed: true };
    expect(JSON.stringify(computeHistory(secretRetrievalSimulation, params))).toBe(JSON.stringify(computeHistory(secretRetrievalSimulation, params)));
  });
});
