import type { SimulationDefinition, SimulationParams, SimulationStep } from '../../../engines/simulation/types';

export type Zone = 1 | 2 | 3;
export type WebPlacement = 'single-zone' | 'two-zones' | 'three-zones';
export type DatabaseMode = 'zonal' | 'zone-standby' | 'zone-redundant';

export interface ZoneResource {
  id: string;
  label: string;
  tier: 'web' | 'database';
  /** null = zone-redundant: runs in every zone. */
  zone: Zone | null;
  status: 'healthy' | 'failed' | 'serving' | 'out-of-rotation';
  note?: string;
}

export interface ZoneFailureState {
  resources: ZoneResource[];
  failedZone: Zone | null;
  testedZone: Zone;
  verdict: { available: boolean; degraded: boolean; summary: string } | null;
}

interface ZoneFailureConfig {
  webPlacement: WebPlacement;
  databaseMode: DatabaseMode;
  failedZone: Zone;
}

const webZones: Record<WebPlacement, Zone[]> = {
  'single-zone': [1, 1],
  'two-zones': [1, 2],
  'three-zones': [1, 2, 3],
};

function readConfig(params: SimulationParams): ZoneFailureConfig {
  const placement = String(params.webPlacement);
  const mode = String(params.databaseMode);
  const zone = Number(params.failedZone);
  return {
    webPlacement: placement === 'two-zones' || placement === 'three-zones' ? placement : 'single-zone',
    databaseMode: mode === 'zone-standby' || mode === 'zone-redundant' ? mode : 'zonal',
    failedZone: zone === 2 || zone === 3 ? zone : 1,
  };
}

function initialResources(config: ZoneFailureConfig): ZoneResource[] {
  const web: ZoneResource[] = webZones[config.webPlacement].map((zone, i) => ({
    id: `web-${i + 1}`,
    label: `Web VM ${i + 1}`,
    tier: 'web',
    zone,
    status: 'healthy',
  }));

  const database: ZoneResource[] =
    config.databaseMode === 'zone-redundant'
      ? [{ id: 'db', label: 'Database (zone-redundant)', tier: 'database', zone: null, status: 'healthy' }]
      : config.databaseMode === 'zone-standby'
        ? [
            { id: 'db-primary', label: 'Database primary', tier: 'database', zone: 1, status: 'healthy' },
            { id: 'db-standby', label: 'Database standby', tier: 'database', zone: 2, status: 'healthy' },
          ]
        : [{ id: 'db-primary', label: 'Database (single instance)', tier: 'database', zone: 1, status: 'healthy' }];

  return [...web, ...database];
}

function describeDatabaseOutcome(mode: DatabaseMode, z: Zone): string {
  if (mode === 'zone-redundant') {
    return 'The zone-redundant database keeps serving; the platform already held synchronous copies in other zones.';
  }
  if (mode === 'zone-standby') {
    if (z === 1) {
      return 'The primary was in the failed zone. The standby in Zone 2 is promoted — a short interruption during failover, but no committed data is lost because the standby was synchronously replicated.';
    }
    if (z === 2) {
      return 'The standby was in the failed zone. The primary keeps serving, but the database now has no standby until Zone 2 returns.';
    }
    return 'Neither database instance was in the failed zone; it is unaffected.';
  }
  return z === 1
    ? 'The only database instance was in the failed zone. Nothing can take over — the data tier is down until Zone 1 recovers.'
    : 'The single database instance is not in the failed zone, so it survives — this time. A failure of Zone 1 would take it down.';
}

/** Applies the zone failure, load balancer reaction, and database reaction
 *  for a config. Pure — the single source of every simulated outcome. */
export function evaluateZoneFailure(config: ZoneFailureConfig) {
  const before = initialResources(config);
  const z = config.failedZone;

  const afterFailure = before.map((r) => (r.zone === z ? { ...r, status: 'failed' as const } : r));

  const afterLoadBalancer = afterFailure.map((r) => {
    if (r.tier !== 'web') return r;
    return r.status === 'failed'
      ? { ...r, status: 'out-of-rotation' as const, note: 'Health probes failing — removed from the pool' }
      : { ...r, status: 'serving' as const };
  });

  const afterDatabase = afterLoadBalancer.map((r) => {
    if (r.tier !== 'database') return r;
    if (r.id === 'db') {
      return { ...r, status: 'serving' as const, note: `Continues from the zones other than Zone ${z}` };
    }
    if (r.id === 'db-standby') {
      if (r.status === 'failed') return { ...r, note: 'Standby lost — primary continues without a standby' };
      const primaryFailed = afterLoadBalancer.some((p) => p.id === 'db-primary' && p.status === 'failed');
      return primaryFailed
        ? { ...r, status: 'serving' as const, note: 'Promoted to primary after automatic failover' }
        : { ...r, note: 'Still a standby' };
    }
    // db-primary
    return r.status === 'failed'
      ? { ...r, note: 'Lost with its zone' }
      : { ...r, status: 'serving' as const };
  });

  const databaseAvailable = afterDatabase.some((r) => r.tier === 'database' && r.status === 'serving');
  const databaseOutcome = describeDatabaseOutcome(config.databaseMode, z);

  const servingWeb = afterDatabase.filter((r) => r.tier === 'web' && r.status === 'serving').length;
  const totalWeb = afterDatabase.filter((r) => r.tier === 'web').length;
  const available = servingWeb > 0 && databaseAvailable;
  const degraded = available && servingWeb < totalWeb;

  const summary = !available
    ? servingWeb === 0
      ? `Outage: every web VM was in Zone ${z}.`
      : `Outage: the web tier survived, but the database is unavailable.`
    : degraded
      ? `Available with reduced capacity: ${servingWeb} of ${totalWeb} web VMs still serving.`
      : 'Available at full capacity — the failed zone held nothing this service depended on.';

  return { before, afterFailure, afterLoadBalancer, afterDatabase, databaseOutcome, servingWeb, totalWeb, available, degraded, summary };
}

export const zoneFailureSimulation: SimulationDefinition<ZoneFailureState> = {
  id: 'zone-failure',
  title: 'Zone Failure',
  description:
    'Deploys a two-tier web application across a region’s zones according to your choices, then fails one zone and traces what keeps working. Simulated — no cloud resources are created.',
  parameters: [
    {
      key: 'webPlacement',
      label: 'Web tier placement',
      type: 'select',
      default: 'single-zone',
      options: [
        { label: 'Two VMs, both in Zone 1', value: 'single-zone' },
        { label: 'Two VMs, Zones 1 and 2', value: 'two-zones' },
        { label: 'Three VMs, Zones 1, 2 and 3', value: 'three-zones' },
      ],
      description: 'Where the load-balanced web VMs run.',
    },
    {
      key: 'databaseMode',
      label: 'Database deployment',
      type: 'select',
      default: 'zonal',
      options: [
        { label: 'Single instance in Zone 1', value: 'zonal' },
        { label: 'Primary in Zone 1, synchronous standby in Zone 2', value: 'zone-standby' },
        { label: 'Zone-redundant managed database', value: 'zone-redundant' },
      ],
      description: 'How the database is protected against a zone failure.',
    },
    {
      key: 'failedZone',
      label: 'Zone to fail',
      type: 'select',
      default: 2,
      options: [
        { label: 'Zone 1', value: 1 },
        { label: 'Zone 2', value: 2 },
        { label: 'Zone 3', value: 3 },
      ],
      description: 'Which zone goes offline during the simulation.',
    },
  ],
  createInitialState: (params) => ({
    resources: [],
    failedZone: null,
    testedZone: readConfig(params).failedZone,
    verdict: null,
  }),
  steps: (params) => {
    const config = readConfig(params);
    const result = evaluateZoneFailure(config);
    const z = config.failedZone;

    const steps: SimulationStep<ZoneFailureState>[] = [
      {
        id: 'deploy',
        label: 'Deploy across zones',
        description:
          'The resources are placed in the zones you chose. The load balancer is zone-redundant, so it is not a single point of failure; whether the application survives depends on where the web VMs and database live.',
        apply: (state) => ({ ...state, resources: result.before }),
      },
      {
        id: 'fail',
        label: `Zone ${z} fails`,
        description: `Zone ${z} loses power or network connectivity. Every resource scoped to Zone ${z} fails with it; resources in other zones are untouched, because zones do not share power, cooling, or networking.`,
        apply: (state) => ({ ...state, resources: result.afterFailure, failedZone: z }),
      },
      {
        id: 'load-balancer',
        label: 'Load balancer reacts',
        description:
          result.servingWeb === result.totalWeb
            ? 'Health probes still succeed on every web VM, so the load balancer keeps all of them in rotation.'
            : `Health probes to ${result.totalWeb - result.servingWeb} web VM(s) fail, so the load balancer stops sending them requests. ${result.servingWeb} web VM(s) remain in rotation.`,
        apply: (state) => ({ ...state, resources: result.afterLoadBalancer }),
      },
      {
        id: 'database',
        label: 'Database reacts',
        description: result.databaseOutcome,
        apply: (state) => ({ ...state, resources: result.afterDatabase }),
      },
      {
        id: 'verdict',
        label: 'Service verdict',
        description: `${result.summary} The service needs at least one serving web VM and a reachable database.`,
        apply: (state) => ({
          ...state,
          verdict: { available: result.available, degraded: result.degraded, summary: result.summary },
        }),
      },
    ];
    return steps;
  },
};
