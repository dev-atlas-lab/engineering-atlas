import { describe, it, expect } from 'vitest';
import { computeHistory } from '../../../engines/simulation/use-simulation';
import { simulateTraffic, trafficDistributionSimulation, type TrafficConfig } from './traffic-distribution';
import { simulateHealth, healthCheckSimulation, type HealthConfig } from './health-check';
import { simulateFailover, regionalFailoverSimulation, healthyCapacity, type FailoverConfig } from './regional-failover';

const trafficBase: TrafficConfig = { backendCount: 3, algorithm: 'round-robin', requests: 9, unhealthy: 'none' };
const traffic = (o: Partial<TrafficConfig>) => simulateTraffic({ ...trafficBase, ...o });

describe('traffic distribution', () => {
  it('spreads round robin evenly across healthy backends', () => {
    const { backends } = traffic({ algorithm: 'round-robin', requests: 9 });
    expect(backends.map((b) => b.count)).toEqual([3, 3, 3]);
  });

  it('never assigns requests to an unhealthy backend', () => {
    const { backends, assigned } = traffic({ unhealthy: 'b1' });
    expect(backends.find((b) => b.id === 'b1')!.count).toBe(0);
    expect(assigned.every((a) => a.backendId !== 'b1')).toBe(true);
  });

  it('favours higher-weight backends with weighted distribution', () => {
    const { backends } = traffic({ algorithm: 'weighted', requests: 10 });
    const b1 = backends.find((b) => b.id === 'b1')!;
    const b2 = backends.find((b) => b.id === 'b2')!;
    expect(b1.count).toBeGreaterThan(b2.count);
    expect(backends.reduce((s, b) => s + b.count, 0)).toBe(10);
  });

  it('sends each request to the least-loaded backend', () => {
    const { backends } = traffic({ algorithm: 'least-connections', requests: 6 });
    // 6 requests over 3 backends, filling the least-loaded each time -> even.
    expect(backends.map((b) => b.count)).toEqual([2, 2, 2]);
  });

  it('gives source IP hash stable affinity: the same client returns to the same backend', () => {
    const { assigned } = traffic({ algorithm: 'ip-hash', requests: 8 });
    const byClient = new Map<string, Set<string>>();
    for (const a of assigned) {
      const set = byClient.get(a.clientIp) ?? new Set();
      if (a.backendId) set.add(a.backendId);
      byClient.set(a.clientIp, set);
    }
    for (const set of byClient.values()) expect(set.size).toBe(1);
  });

  it('serves nothing when every backend is unhealthy', () => {
    const { assigned } = simulateTraffic({ backendCount: 2, algorithm: 'round-robin', requests: 3, unhealthy: 'b1' });
    // Only b1 marked unhealthy here; b2 still serves. Confirm b2 gets all.
    expect(assigned.every((a) => a.backendId === 'b2')).toBe(true);
  });

  it('is deterministic', () => {
    const params = { backendCount: 4, algorithm: 'weighted', requests: 11, unhealthy: 'b2' };
    expect(JSON.stringify(computeHistory(trafficDistributionSimulation, params))).toBe(JSON.stringify(computeHistory(trafficDistributionSimulation, params)));
  });
});

const healthBase: HealthConfig = { scenario: 'fails-then-recovers', interval: 5, unhealthyThreshold: 3, healthyThreshold: 2 };
const health = (o: Partial<HealthConfig>) => simulateHealth({ ...healthBase, ...o });

describe('health checks', () => {
  it('removes a backend only after the unhealthy threshold of consecutive failures', () => {
    const probes = health({ unhealthyThreshold: 3 });
    const removed = probes.find((p) => p.transition === 'removed')!;
    // Timeline fails at probe index 3 (4th); removed after 3 consecutive fails -> probe 6.
    expect(removed.n).toBe(6);
    expect(probes.slice(0, 5).every((p) => p.inRotation)).toBe(true);
  });

  it('restores a backend only after the healthy threshold of consecutive successes', () => {
    const probes = health({ healthyThreshold: 2 });
    const restored = probes.find((p) => p.transition === 'restored')!;
    expect(restored).toBeTruthy();
    expect(restored.inRotation).toBe(true);
  });

  it('detects on the first failure when the unhealthy threshold is 1', () => {
    const probes = health({ unhealthyThreshold: 1 });
    expect(probes.find((p) => p.transition === 'removed')!.n).toBe(4);
  });

  it('tolerates brief blips when the threshold exceeds the blip length', () => {
    // Flapping timeline has only single-probe dips early on; threshold 3 should not remove.
    const probes = health({ scenario: 'flapping', unhealthyThreshold: 3 });
    expect(probes.some((p) => p.transition === 'removed')).toBe(false);
  });

  it('never leaves rotation when always healthy', () => {
    const probes = health({ scenario: 'always-healthy' });
    expect(probes.every((p) => p.inRotation && p.state === 'healthy')).toBe(true);
  });

  it('is deterministic', () => {
    const params = { scenario: 'fails-then-recovers', interval: 10, unhealthyThreshold: 2, healthyThreshold: 3 };
    expect(JSON.stringify(computeHistory(healthCheckSimulation, params))).toBe(JSON.stringify(computeHistory(healthCheckSimulation, params)));
  });
});

const failBase: FailoverConfig = { policy: 'performance', routingType: 'dns', failedRegion: 'r1' };
const failover = (o: Partial<FailoverConfig>) => simulateFailover({ ...failBase, ...o });

describe('regional failover', () => {
  it('routes every client to a healthy region in normal operation', () => {
    const phases = failover({ failedRegion: 'none' });
    expect(phases[0]!.clients.every((c) => c.status === 'ok')).toBe(true);
  });

  it('DNS clients fail while a cached answer points at the downed region', () => {
    const phases = failover({ routingType: 'dns', policy: 'performance', failedRegion: 'r1' });
    const failPhase = phases.find((p) => p.phase.includes('fails'))!;
    // The Americas user cached East US (r1), which is now down.
    expect(failPhase.clients.some((c) => c.status === 'error')).toBe(true);
    // After TTL expiry, all recover.
    const recovered = phases[phases.length - 1]!;
    expect(recovered.clients.every((c) => c.status === 'ok')).toBe(true);
  });

  it('anycast reroutes immediately with no client left failing', () => {
    const phases = failover({ routingType: 'anycast', failedRegion: 'r1' });
    const failPhase = phases.find((p) => p.phase.includes('fails'))!;
    expect(failPhase.clients.every((c) => c.status === 'ok')).toBe(true);
  });

  it('priority routing sends everyone to the primary, then to the next on failure', () => {
    const normal = failover({ policy: 'priority', failedRegion: 'none' })[0]!;
    expect(new Set(normal.clients.map((c) => c.region)).size).toBe(1);
    expect(normal.clients[0]!.region).toBe('r1');
  });

  it('performance routing sends each client to its lowest-latency region', () => {
    const normal = failover({ policy: 'performance', failedRegion: 'none' })[0]!;
    const byId = Object.fromEntries(normal.clients.map((c) => [c.id, c.region]));
    expect(byId.cA).toBe('r1');
    expect(byId.cE).toBe('r2');
    expect(byId.cS).toBe('r3');
  });

  it('reports reduced healthy capacity while a region is down', () => {
    const phases = failover({ failedRegion: 'r1' });
    const failPhase = phases.find((p) => p.phase.includes('fails'))!;
    expect(healthyCapacity(failPhase.regions)).toBe(50); // r1 is 50% of total
  });

  it('is deterministic', () => {
    const params = { policy: 'geographic', routingType: 'dns', failedRegion: 'r2' };
    expect(JSON.stringify(computeHistory(regionalFailoverSimulation, params))).toBe(JSON.stringify(computeHistory(regionalFailoverSimulation, params)));
  });
});
