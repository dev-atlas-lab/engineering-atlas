import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A deterministic model of global traffic routing and failover. It contrasts
// DNS-based routing (clients cache a resolved endpoint for the record's TTL,
// so failover waits for the cache to expire) with an anycast proxy layer
// (which reroutes immediately). Routing policy decides which region a client
// is sent to. Simplified: fixed regions and clients, illustrative latencies,
// one TTL window; no real DNS, health-check timing, or connection state.

export type Policy = 'priority' | 'weighted' | 'performance' | 'geographic';
export type RoutingType = 'dns' | 'anycast';
export type RegionId = 'r1' | 'r2' | 'r3';

export interface RegionDef {
  id: RegionId;
  label: string;
  priority: number;
  weight: number;
  capacity: number;
}

export const REGIONS: RegionDef[] = [
  { id: 'r1', label: 'East US', priority: 1, weight: 5, capacity: 50 },
  { id: 'r2', label: 'West Europe', priority: 2, weight: 3, capacity: 30 },
  { id: 'r3', label: 'Southeast Asia', priority: 3, weight: 2, capacity: 20 },
];

interface ClientDef {
  id: string;
  label: string;
  geo: RegionId;
  latency: Record<RegionId, number>;
}

const CLIENTS: ClientDef[] = [
  { id: 'cA', label: 'User in the Americas', geo: 'r1', latency: { r1: 20, r2: 90, r3: 180 } },
  { id: 'cE', label: 'User in Europe', geo: 'r2', latency: { r1: 90, r2: 20, r3: 160 } },
  { id: 'cS', label: 'User in Asia', geo: 'r3', latency: { r1: 180, r2: 160, r3: 30 } },
];

export interface RegionRuntime {
  id: RegionId;
  label: string;
  healthy: boolean;
  capacity: number;
}

export interface ClientRouting {
  id: string;
  label: string;
  region: RegionId | null;
  status: 'ok' | 'error' | 'pending';
  reason: string;
}

export interface FailoverConfig {
  policy: Policy;
  routingType: RoutingType;
  failedRegion: RegionId | 'none';
}

export interface FailoverState {
  config: FailoverConfig;
  regions: RegionRuntime[];
  clients: ClientRouting[];
  phase: string;
  note: string;
  healthyCapacityPct: number;
}

function select(policy: Policy, client: ClientDef, healthy: RegionDef[]): RegionDef | null {
  if (healthy.length === 0) return null;
  switch (policy) {
    case 'priority':
      return [...healthy].sort((a, b) => a.priority - b.priority)[0]!;
    case 'performance':
      return [...healthy].sort((a, b) => client.latency[a.id] - client.latency[b.id])[0]!;
    case 'geographic': {
      const preferred = healthy.find((r) => r.id === client.geo);
      return preferred ?? [...healthy].sort((a, b) => client.latency[a.id] - client.latency[b.id])[0]!;
    }
    case 'weighted': {
      const total = healthy.reduce((s, r) => s + r.weight, 0);
      const idx = CLIENTS.indexOf(client);
      const target = ((idx + 1) / (CLIENTS.length + 1)) * total;
      let acc = 0;
      for (const r of healthy) {
        acc += r.weight;
        if (target <= acc) return r;
      }
      return healthy[healthy.length - 1]!;
    }
  }
}

const policyLabel: Record<Policy, string> = {
  priority: 'priority (active-passive failover)',
  weighted: 'weighted',
  performance: 'performance (latency)',
  geographic: 'geographic',
};

interface Phase {
  phase: string;
  note: string;
  clients: ClientRouting[];
  regions: RegionRuntime[];
}

export function simulateFailover(config: FailoverConfig): Phase[] {
  const regionsHealthyAll = REGIONS.map((r) => ({ ...r }));
  const regionsAfterFail = REGIONS.map((r) => ({ ...r, healthyFlag: r.id !== config.failedRegion }));
  const dns = config.routingType === 'dns';
  const failedLabel = REGIONS.find((r) => r.id === config.failedRegion)?.label ?? 'a region';

  // Each client's cached (resolved) region, from the initial healthy resolve.
  const cached: Record<string, RegionId | null> = {};
  const healthyAll = regionsHealthyAll;
  for (const c of CLIENTS) cached[c.id] = select(config.policy, c, healthyAll)?.id ?? null;

  const rt = (healthyFlag: (r: RegionDef) => boolean): RegionRuntime[] =>
    REGIONS.map((r) => ({ id: r.id, label: r.label, healthy: healthyFlag(r), capacity: r.capacity }));

  const route = (c: ClientDef, useCache: boolean, healthy: RegionDef[]): ClientRouting => {
    if (useCache) {
      const region = cached[c.id] ?? null;
      const healthyNow = healthy.some((r) => r.id === region);
      const label = REGIONS.find((r) => r.id === region)?.label ?? 'none';
      return {
        id: c.id,
        label: c.label,
        region,
        status: healthyNow ? 'ok' : 'error',
        reason: healthyNow
          ? `Cached DNS answer points at ${label}, which is healthy — the request succeeds.`
          : `Cached DNS answer still points at ${label}, which is down. The request fails until the cache expires.`,
      };
    }
    const r = select(config.policy, c, healthy);
    return {
      id: c.id,
      label: c.label,
      region: r?.id ?? null,
      status: r ? 'ok' : 'error',
      reason: r ? `${policyLabel[config.policy]} routing sends this client to ${r.label}.` : 'No healthy region is available — the request fails.',
    };
  };

  const healthyList = (flag: (r: RegionDef) => boolean) => REGIONS.filter(flag);
  const phases: Phase[] = [];

  // 1. Normal.
  phases.push({
    phase: 'Normal operation',
    note: `All regions healthy. ${policyLabel[config.policy]} routing decides where each client goes; ${dns ? 'each client caches its DNS answer for the record TTL.' : 'the anycast layer forwards each client from the nearest edge.'}`,
    clients: CLIENTS.map((c) => route(c, false, healthyList(() => true))),
    regions: rt(() => true),
  });

  if (config.failedRegion === 'none') {
    phases.push({ phase: 'Steady', note: 'No region failure selected. Choose a region to fail to see how the routing layer responds.', clients: phases[0]!.clients, regions: rt(() => true) });
    return phases;
  }

  const healthyAfter = healthyList((r) => r.id !== config.failedRegion);

  // 2. A region fails.
  phases.push({
    phase: `${failedLabel} fails`,
    note: dns
      ? `${failedLabel} goes down. Clients still hold cached DNS answers, so any client pinned to ${failedLabel} keeps trying it and fails — DNS cannot un-cache an answer early.`
      : `${failedLabel} goes down. The anycast global layer detects it and reroutes those clients to a healthy region immediately — no DNS wait.`,
    clients: CLIENTS.map((c) => route(c, dns, healthyAfter)),
    regions: regionsAfterFail.map((r) => ({ id: r.id, label: r.label, healthy: r.healthyFlag, capacity: r.capacity })),
  });

  // 3. During the TTL window (meaningful for DNS).
  phases.push({
    phase: dns ? 'Within the DNS TTL' : 'Rerouted',
    note: dns
      ? 'Resolvers keep serving the stale answer until the record’s TTL expires. This window is the DNS failover delay — you cannot make it instant, only shorter (with a lower TTL, at the cost of more queries).'
      : 'Traffic is already flowing to healthy regions. There is no DNS cache to wait for.',
    clients: CLIENTS.map((c) => route(c, dns, healthyAfter)),
    regions: regionsAfterFail.map((r) => ({ id: r.id, label: r.label, healthy: r.healthyFlag, capacity: r.capacity })),
  });

  // 4. Re-resolve / recovered routing.
  phases.push({
    phase: dns ? 'TTL expires — clients re-resolve' : 'Steady on healthy regions',
    note: dns
      ? 'The TTL expires, clients re-resolve, and the routing policy now returns a healthy region. Service is restored. Capacity is reduced while the failed region is down.'
      : 'Steady state: every client is served by a healthy region at reduced total capacity.',
    clients: CLIENTS.map((c) => route(c, false, healthyAfter)),
    regions: regionsAfterFail.map((r) => ({ id: r.id, label: r.label, healthy: r.healthyFlag, capacity: r.capacity })),
  });

  return phases;
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readFailoverConfig(params: SimulationParams): FailoverConfig {
  return {
    policy: pick(params.policy, ['priority', 'weighted', 'performance', 'geographic'] as const, 'performance'),
    routingType: pick(params.routingType, ['dns', 'anycast'] as const, 'dns'),
    failedRegion: pick(params.failedRegion, ['none', 'r1', 'r2', 'r3'] as const, 'r1'),
  };
}

export function healthyCapacity(regions: RegionRuntime[]): number {
  const total = REGIONS.reduce((s, r) => s + r.capacity, 0);
  const up = regions.filter((r) => r.healthy).reduce((s, r) => s + r.capacity, 0);
  return Math.round((up / total) * 100);
}

export const regionalFailoverSimulation: SimulationDefinition<FailoverState> = {
  id: 'regional-failover',
  title: 'Global Traffic Routing and Failover',
  description:
    'Routes global clients to regional endpoints by policy, then fails a region and shows how DNS-based routing waits for cached answers to expire while an anycast layer reroutes immediately. Simplified and deterministic; no real DNS or health-check timing.',
  parameters: [
    {
      key: 'routingType',
      label: 'Global routing layer',
      type: 'select',
      default: 'dns',
      options: [
        { label: 'DNS-based (Traffic Manager / Route 53)', value: 'dns' },
        { label: 'Anycast proxy (Front Door / Global Accelerator)', value: 'anycast' },
      ],
      description: 'Whether clients cache a DNS answer or are forwarded by an anycast edge.',
    },
    {
      key: 'policy',
      label: 'Routing policy',
      type: 'select',
      default: 'performance',
      options: [
        { label: 'Performance / latency', value: 'performance' },
        { label: 'Geographic', value: 'geographic' },
        { label: 'Weighted', value: 'weighted' },
        { label: 'Priority (active-passive)', value: 'priority' },
      ],
      description: 'How a region is chosen for each client.',
    },
    {
      key: 'failedRegion',
      label: 'Region to fail',
      type: 'select',
      default: 'r1',
      options: [
        { label: 'None', value: 'none' },
        { label: 'East US', value: 'r1' },
        { label: 'West Europe', value: 'r2' },
        { label: 'Southeast Asia', value: 'r3' },
      ],
      description: 'Which region goes down during the scenario.',
    },
  ],
  createInitialState: (params) => {
    const config = readFailoverConfig(params);
    return {
      config,
      regions: REGIONS.map((r) => ({ id: r.id, label: r.label, healthy: true, capacity: r.capacity })),
      clients: [],
      phase: 'Not started',
      note: '',
      healthyCapacityPct: 100,
    };
  },
  steps: (params) => {
    const config = readFailoverConfig(params);
    const phases = simulateFailover(config);
    return phases.map((phase, i) => ({
      id: `phase-${i + 1}`,
      label: phase.phase,
      description: phase.note,
      apply: (state: FailoverState): FailoverState => ({
        ...state,
        regions: phase.regions,
        clients: phase.clients,
        phase: phase.phase,
        note: phase.note,
        healthyCapacityPct: healthyCapacity(phase.regions),
      }),
    }));
  },
};
