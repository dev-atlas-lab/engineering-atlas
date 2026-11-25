import { describe, it, expect } from 'vitest';
import { computeHistory } from '../../../engines/simulation/use-simulation';
import { edgeProtectionSimulation, evaluateEdge, type EdgeConfig } from './edge-protection';
import { controlResponseSimulation, REVIEW_INTERVAL, simulateControls, type ControlConfig } from './control-response';

const edgeBase: EdgeConfig = { traffic: 'normal', ddosTier: 'baseline', wafMode: 'prevention', rateLimit: false, appAuthz: true };
const edge = (overrides: Partial<EdgeConfig>) => evaluateEdge({ ...edgeBase, ...overrides });

describe('WAF and DDoS protection', () => {
  it('serves normal traffic through every layer', () => {
    const result = edge({});
    expect(result.outcome).toBe('served');
    expect(result.layers.map((l) => l.layer)).toEqual(['network-edge', 'http-proxy', 'waf', 'rate-limit', 'app-authz', 'app']);
  });

  it('mitigates volumetric floods at the network edge for both tiers, before any HTTP layer', () => {
    for (const ddosTier of ['baseline', 'enhanced'] as const) {
      const result = edge({ traffic: 'volumetric', ddosTier, wafMode: 'off' });
      expect(result).toMatchObject({ outcome: 'blocked', blockedAt: 'network-edge' });
      expect(result.layers.some((l) => l.layer === 'waf')).toBe(false);
    }
    expect(edge({ traffic: 'volumetric', ddosTier: 'enhanced' }).layers[0]!.detail).toMatch(/metrics, alerts/);
  });

  it('rejects malformed HTTP at the proxy, even without a WAF', () => {
    expect(edge({ traffic: 'malformed', wafMode: 'off' })).toMatchObject({ outcome: 'blocked', blockedAt: 'http-proxy' });
  });

  it('blocks injection patterns only in WAF prevention mode', () => {
    expect(edge({ traffic: 'sqli' })).toMatchObject({ outcome: 'blocked', blockedAt: 'waf' });
    const detection = edge({ traffic: 'sqli', wafMode: 'detection' });
    expect(detection.outcome).toBe('logged-and-served');
    expect(detection.layers.find((l) => l.layer === 'waf')!.verdict).toBe('logged');
    expect(edge({ traffic: 'sqli', wafMode: 'off' })).toMatchObject({ outcome: 'served', blockedAt: null });
  });

  it('stops an HTTP flood only with a rate-based rule in an active WAF policy', () => {
    expect(edge({ traffic: 'http-flood', rateLimit: true })).toMatchObject({ outcome: 'blocked', blockedAt: 'rate-limit' });
    expect(edge({ traffic: 'http-flood' }).outcome).toBe('degraded');
    expect(edge({ traffic: 'http-flood', rateLimit: true, wafMode: 'off' }).outcome).toBe('degraded');
    // Network-layer DDoS protection does not interpret HTTP.
    expect(edge({ traffic: 'http-flood', ddosTier: 'enhanced' }).outcome).toBe('degraded');
  });

  it('leaves authorization to the application', () => {
    expect(edge({ traffic: 'unauthorized-admin' })).toMatchObject({ outcome: 'blocked', blockedAt: 'app-authz' });
    const noAuthz = edge({ traffic: 'unauthorized-admin', appAuthz: false });
    expect(noAuthz.outcome).toBe('access-violation');
    // Every edge layer forwarded the request.
    expect(noAuthz.layers.filter((l) => ['network-edge', 'http-proxy', 'waf'].includes(l.layer)).every((l) => l.verdict === 'pass')).toBe(true);
  });

  it('is deterministic and reports the outcome on the final step only', () => {
    const params = { traffic: 'http-flood', rateLimit: true };
    const a = computeHistory(edgeProtectionSimulation, params);
    expect(JSON.stringify(a)).toBe(JSON.stringify(computeHistory(edgeProtectionSimulation, params)));
    expect(a[a.length - 2]!.state.outcome).toBeNull();
    expect(a[a.length - 1]!.state.outcome).toBe('blocked');
  });
});

const ctlBase: ControlConfig = { change: 'public-storage', preventive: false, detective: true, corrective: false, alerting: false };
const controls = (overrides: Partial<ControlConfig>) => simulateControls({ ...ctlBase, ...overrides });

describe('misconfiguration response', () => {
  it('prevents the change entirely with a preventive guardrail', () => {
    const { summary, events } = controls({ preventive: true, detective: false });
    expect(summary).toEqual({ outcome: 'prevented', exposureMinutes: 0 });
    expect(events.some((e) => e.control === 'exposure')).toBe(false);
  });

  it('leaves an unrouted finding open until the next review', () => {
    expect(controls({}).summary).toEqual({ outcome: 'found-in-review', exposureMinutes: REVIEW_INTERVAL });
  });

  it('shortens exposure with alerting, and further with automatic remediation', () => {
    const alerted = controls({ alerting: true }).summary.exposureMinutes!;
    const remediated = controls({ corrective: true }).summary.exposureMinutes!;
    expect(controls({ alerting: true }).summary.outcome).toBe('fixed-after-alert');
    expect(controls({ corrective: true }).summary.outcome).toBe('auto-remediated');
    expect(remediated).toBeLessThan(alerted);
    expect(alerted).toBeLessThan(REVIEW_INTERVAL);
  });

  it('never runs remediation without detection', () => {
    const { summary, events } = controls({ detective: false, corrective: true });
    expect(summary).toEqual({ outcome: 'undetected', exposureMinutes: null });
    expect(events.some((e) => e.control === 'corrective')).toBe(false);
  });

  it('names provider examples for every change type', () => {
    for (const change of ['public-storage', 'open-ssh', 'audit-log-disabled'] as const) {
      expect(controls({ change, preventive: true }).events[1]!.detail).toMatch(/Examples:/);
    }
  });

  it('is deterministic', () => {
    const params = { change: 'open-ssh', corrective: true, alerting: true };
    expect(JSON.stringify(computeHistory(controlResponseSimulation, params))).toBe(JSON.stringify(computeHistory(controlResponseSimulation, params)));
  });
});
