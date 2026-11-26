import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A deterministic model of how a load balancer distributes requests across a
// backend pool. It models the selection algorithm, backend health (an
// unhealthy backend is removed from rotation), and per-backend weights. It is
// a teaching model: it distributes whole requests one at a time and does not
// model real connection lifetimes, in-flight work, or provider-specific
// hashing. Nothing is sent anywhere.

export type Algorithm = 'round-robin' | 'weighted' | 'least-connections' | 'ip-hash';

export interface BackendDef {
  id: string;
  label: string;
  weight: number;
}

// A fixed pool; `backendCount` decides how many are in rotation.
export const ALL_BACKENDS: BackendDef[] = [
  { id: 'b1', label: 'web-1', weight: 3 },
  { id: 'b2', label: 'web-2', weight: 1 },
  { id: 'b3', label: 'web-3', weight: 1 },
  { id: 'b4', label: 'web-4', weight: 1 },
  { id: 'b5', label: 'web-5', weight: 1 },
];

// Four distinct clients, cycled so that session affinity (ip-hash) is visible:
// the same client always lands on the same backend.
export const CLIENT_IPS = ['198.51.100.10', '198.51.100.23', '203.0.113.7', '203.0.113.88'];

export interface BackendRuntime {
  id: string;
  label: string;
  weight: number;
  healthy: boolean;
  count: number;
}

export interface AssignedRequest {
  n: number;
  clientIp: string;
  backendId: string | null;
  reason: string;
}

export interface TrafficConfig {
  backendCount: number;
  algorithm: Algorithm;
  requests: number;
  unhealthy: string; // backend id that is unhealthy, or 'none'
}

export interface TrafficState {
  config: TrafficConfig;
  backends: BackendRuntime[];
  assigned: AssignedRequest[];
}

const algoLabel: Record<Algorithm, string> = {
  'round-robin': 'round robin',
  weighted: 'weighted round robin',
  'least-connections': 'least connections',
  'ip-hash': 'source IP hash (session affinity)',
};

function ipHash(ip: string): number {
  return ip.split('.').reduce((sum, octet) => sum + Number(octet), 0);
}

export function initialBackends(config: TrafficConfig): BackendRuntime[] {
  return ALL_BACKENDS.slice(0, config.backendCount).map((b) => ({
    ...b,
    weight: config.algorithm === 'weighted' ? b.weight : 1,
    healthy: b.id !== config.unhealthy,
    count: 0,
  }));
}

/** Chooses the backend for request `n` (0-based) given the pool state so far.
 *  Pure: depends only on the config and the counts accumulated by earlier
 *  requests, which `simulateTraffic` threads through deterministically. */
function choose(config: TrafficConfig, backends: BackendRuntime[], n: number, swrr: number[]): { backendId: string | null; reason: string } {
  const healthy = backends.filter((b) => b.healthy);
  if (healthy.length === 0) return { backendId: null, reason: 'No healthy backend is in rotation, so the request cannot be served — the load balancer returns an error.' };

  switch (config.algorithm) {
    case 'round-robin': {
      const picked = healthy[n % healthy.length]!;
      return { backendId: picked.id, reason: `Round robin steps through the healthy backends in order; request ${n + 1} lands on ${picked.label}.` };
    }
    case 'ip-hash': {
      const ip = CLIENT_IPS[n % CLIENT_IPS.length]!;
      const picked = healthy[ipHash(ip) % healthy.length]!;
      return { backendId: picked.id, reason: `hash(${ip}) selects ${picked.label}. The same client always hashes to the same backend, giving session affinity — until the set of healthy backends changes.` };
    }
    case 'least-connections': {
      const min = Math.min(...healthy.map((b) => b.count));
      const picked = healthy.find((b) => b.count === min)!;
      return { backendId: picked.id, reason: `Least connections picks the healthy backend with the fewest active requests (${min}); ${picked.label} wins${healthy.filter((b) => b.count === min).length > 1 ? ' (ties broken by order)' : ''}.` };
    }
    case 'weighted': {
      // Smooth weighted round robin over the healthy backends.
      const total = healthy.reduce((s, b) => s + b.weight, 0);
      let bestIdx = 0;
      let best = -Infinity;
      healthy.forEach((b) => {
        const globalIdx = backends.indexOf(b);
        swrr[globalIdx] = (swrr[globalIdx] ?? 0) + b.weight;
        if (swrr[globalIdx]! > best) {
          best = swrr[globalIdx]!;
          bestIdx = globalIdx;
        }
      });
      swrr[bestIdx] = (swrr[bestIdx] ?? 0) - total;
      const picked = backends[bestIdx]!;
      return { backendId: picked.id, reason: `Weighted distribution favours higher-weight backends; ${picked.label} (weight ${picked.weight}) is chosen for request ${n + 1}.` };
    }
  }
}

export function simulateTraffic(config: TrafficConfig): { assigned: AssignedRequest[]; backends: BackendRuntime[] } {
  const backends = initialBackends(config);
  const swrr = backends.map(() => 0);
  const assigned: AssignedRequest[] = [];
  for (let n = 0; n < config.requests; n++) {
    const { backendId, reason } = choose(config, backends, n, swrr);
    if (backendId) {
      const b = backends.find((x) => x.id === backendId)!;
      b.count += 1;
    }
    assigned.push({ n: n + 1, clientIp: CLIENT_IPS[n % CLIENT_IPS.length]!, backendId, reason });
  }
  return { assigned, backends };
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readTrafficConfig(params: SimulationParams): TrafficConfig {
  const backendCount = Math.min(Math.max(Number(params.backendCount) || 3, 2), ALL_BACKENDS.length);
  const unhealthy = typeof params.unhealthy === 'string' ? params.unhealthy : 'none';
  return {
    backendCount,
    algorithm: pick(params.algorithm, ['round-robin', 'weighted', 'least-connections', 'ip-hash'] as const, 'round-robin'),
    requests: Math.min(Math.max(Number(params.requests) || 8, 1), 12),
    // Ignore an unhealthy id that is outside the active pool.
    unhealthy: ALL_BACKENDS.slice(0, backendCount).some((b) => b.id === unhealthy) ? unhealthy : 'none',
  };
}

export const algorithmLabel = algoLabel;

export const trafficDistributionSimulation: SimulationDefinition<TrafficState> = {
  id: 'traffic-distribution',
  title: 'Load Balancer Traffic Distribution',
  description:
    'Distributes requests across a backend pool using a selection algorithm, honouring backend health and weights. Simplified and deterministic: it assigns whole requests one at a time and does not model real connection lifetimes.',
  parameters: [
    { key: 'backendCount', label: 'Backends in the pool', type: 'number', default: 3, min: 2, max: 5, description: 'How many backend instances are registered.' },
    {
      key: 'algorithm',
      label: 'Distribution algorithm',
      type: 'select',
      default: 'round-robin',
      options: [
        { label: 'Round robin', value: 'round-robin' },
        { label: 'Weighted round robin', value: 'weighted' },
        { label: 'Least connections', value: 'least-connections' },
        { label: 'Source IP hash (session affinity)', value: 'ip-hash' },
      ],
      description: 'How the load balancer chooses a backend for each request.',
    },
    { key: 'requests', label: 'Requests to send', type: 'number', default: 8, min: 1, max: 12, description: 'How many requests to distribute.' },
    {
      key: 'unhealthy',
      label: 'Unhealthy backend',
      type: 'select',
      default: 'none',
      options: [
        { label: 'None — all healthy', value: 'none' },
        { label: 'web-1 is unhealthy', value: 'b1' },
        { label: 'web-2 is unhealthy', value: 'b2' },
        { label: 'web-3 is unhealthy', value: 'b3' },
      ],
      description: 'An unhealthy backend is removed from rotation and receives no requests.',
    },
  ],
  createInitialState: (params) => ({ config: readTrafficConfig(params), backends: initialBackends(readTrafficConfig(params)), assigned: [] }),
  steps: (params) => {
    const config = readTrafficConfig(params);
    const { assigned } = simulateTraffic(config);
    return assigned.map((request, i) => ({
      id: `req-${i + 1}`,
      label: `Request ${request.n} from ${request.clientIp}`,
      description: request.reason,
      apply: (state: TrafficState): TrafficState => {
        const backends = state.backends.map((b) => (b.id === request.backendId ? { ...b, count: b.count + 1 } : b));
        return { ...state, backends, assigned: [...state.assigned, request] };
      },
    }));
  },
};
