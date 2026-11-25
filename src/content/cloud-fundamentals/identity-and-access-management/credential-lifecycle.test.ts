import { describe, it, expect } from 'vitest';
import { computeHistory } from '../../../engines/simulation/use-simulation';
import { credentialExpiryAt, credentialLifecycleSimulation, simulateCredentials, type CredentialConfig } from './credential-lifecycle';

const base: CredentialConfig = { mechanism: 'managed-identity', refresh: 'sdk', authorized: true, leaked: false };
const run = (overrides: Partial<CredentialConfig>) => simulateCredentials({ ...base, ...overrides });

describe('workload credential lifecycle', () => {
  it('refreshes temporary credentials before expiry so every call succeeds', () => {
    for (const mechanism of ['managed-identity', 'instance-role'] as const) {
      const { events, summary } = run({ mechanism });
      expect(summary).toMatchObject({ appCallsSucceeded: 3, appCallsFailed: 0, failureCause: null, secretStoredWithApp: false });
      expect(events.filter((e) => e.label.startsWith('SDK refreshes')).map((e) => e.minute)).toEqual([45, 90, 135, 180]);
    }
  });

  it('computes credential expiry from the refresh schedule', () => {
    expect(credentialExpiryAt(base, 0)).toBe(60);
    expect(credentialExpiryAt(base, 100)).toBe(150);
    expect(credentialExpiryAt({ ...base, refresh: 'cached-at-startup' }, 100)).toBe(60);
    expect(credentialExpiryAt({ ...base, mechanism: 'static-key' }, 100)).toBeNull();
  });

  it('breaks an app that caches a temporary credential past its expiry', () => {
    const { summary, events } = run({ refresh: 'cached-at-startup' });
    expect(summary).toMatchObject({ appCallsSucceeded: 1, appCallsFailed: 2, failureCause: 'expired' });
    expect(events.find((e) => e.result === 'fail')!.minute).toBe(90);
  });

  it('distinguishes authorization failures from authentication', () => {
    const { summary } = run({ authorized: false });
    expect(summary).toMatchObject({ appCallsSucceeded: 0, appCallsFailed: 3, failureCause: 'forbidden' });
  });

  it('bounds a leaked temporary credential by its lifetime', () => {
    const { summary, events } = run({ leaked: true });
    expect(summary.leakExposure).toBe('until-expiry');
    const attacker = events.filter((e) => e.actor === 'attacker' && e.minute > 100);
    expect(attacker.map((e) => e.label)).toEqual(['Attacker uses the copied credential — succeeds', 'Attacker uses the copied credential — expired']);
    expect(summary.attackerCallsSucceeded).toBe(1);
  });

  it('leaves a leaked long-lived key usable until it is revoked', () => {
    const { summary } = run({ mechanism: 'static-key', leaked: true });
    expect(summary).toMatchObject({ leakExposure: 'until-manually-revoked', attackerCallsSucceeded: 2, secretStoredWithApp: true, appCallsFailed: 0 });
  });

  it('shows least privilege limiting a leak: a forbidden identity is useless to the attacker too', () => {
    expect(run({ mechanism: 'static-key', leaked: true, authorized: false }).summary.attackerCallsSucceeded).toBe(0);
  });

  it('reports an already-expired cached credential as useless when copied', () => {
    const { events, summary } = run({ refresh: 'cached-at-startup', leaked: true });
    expect(events.find((e) => e.actor === 'attacker')!.detail).toMatch(/already expired/);
    expect(summary.attackerCallsSucceeded).toBe(0);
  });

  it('orders the timeline by minute and is deterministic', () => {
    const params = { mechanism: 'instance-role', refresh: 'sdk', authorized: true, leaked: true };
    const a = computeHistory(credentialLifecycleSimulation, params);
    const b = computeHistory(credentialLifecycleSimulation, params);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const minutes = a[a.length - 1]!.state.events.map((e) => e.minute);
    expect(minutes).toEqual([...minutes].sort((x, y) => x - y));
    expect(a[a.length - 1]!.state.summary).not.toBeNull();
  });
});
