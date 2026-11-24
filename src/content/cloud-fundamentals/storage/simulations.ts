import type { SimulationDefinition, SimulationParams, SimulationStep } from '../../../engines/simulation/types';

export type ReplicationStrategy = 'local' | 'zone' | 'geo' | 'geo-zone';
export type StorageFailure = 'disk' | 'zone' | 'region';

export interface DataCopy {
  id: string;
  region: 'primary' | 'secondary';
  zone: 1 | 2 | 3;
  replication: 'synchronous' | 'asynchronous';
  status: 'intact' | 'rebuilding' | 'unreachable';
}

export interface ReplicationOutcome {
  /** Is at least one copy guaranteed to still exist? */
  dataSurvives: 'yes' | 'only-if-the-outage-is-temporary';
  /** Can clients read right now, without anyone failing over? */
  readsNow: 'yes' | 'stale-reads-from-secondary' | 'no';
  writesNow: 'yes' | 'after-failover' | 'no';
  /** How much recently acknowledged data could be lost if the outage were permanent. */
  recoveryPoint: 'no-acknowledged-writes-lost' | 'writes-within-replication-lag' | 'everything-if-permanent';
}

export interface ReplicationState {
  strategy: ReplicationStrategy;
  failure: StorageFailure;
  readAccessSecondary: boolean;
  copies: DataCopy[];
  failureApplied: boolean;
  outcome: ReplicationOutcome | null;
}

interface ReplicationConfig {
  strategy: ReplicationStrategy;
  failure: StorageFailure;
  readAccessSecondary: boolean;
}

const strategies: ReplicationStrategy[] = ['local', 'zone', 'geo', 'geo-zone'];
const failures: StorageFailure[] = ['disk', 'zone', 'region'];

function readConfig(params: SimulationParams): ReplicationConfig {
  const strategy = String(params.strategy) as ReplicationStrategy;
  const failure = String(params.failure) as StorageFailure;
  return {
    strategy: strategies.includes(strategy) ? strategy : 'local',
    failure: failures.includes(failure) ? failure : 'disk',
    readAccessSecondary: params.readAccessSecondary === true,
  };
}

export function placeCopies(strategy: ReplicationStrategy): DataCopy[] {
  const primaryZones: (1 | 2 | 3)[] = strategy === 'zone' || strategy === 'geo-zone' ? [1, 2, 3] : [1, 1, 1];
  const primary: DataCopy[] = primaryZones.map((zone, i) => ({
    id: `p${i + 1}`,
    region: 'primary',
    zone,
    replication: 'synchronous',
    status: 'intact',
  }));
  if (strategy === 'local' || strategy === 'zone') return primary;
  const secondary: DataCopy[] = [1, 2, 3].map((n) => ({
    id: `s${n}`,
    region: 'secondary',
    zone: 1,
    replication: 'asynchronous',
    status: 'intact',
  }));
  return [...primary, ...secondary];
}

/** Which copies a failure affects. The failed zone is always primary Zone 1 —
 *  the zone every strategy places at least one primary copy in. */
export function applyFailure(copies: DataCopy[], failure: StorageFailure): DataCopy[] {
  return copies.map((copy) => {
    if (failure === 'disk') return copy.id === 'p1' ? { ...copy, status: 'rebuilding' } : copy;
    if (failure === 'zone') return copy.region === 'primary' && copy.zone === 1 ? { ...copy, status: 'unreachable' } : copy;
    return copy.region === 'primary' ? { ...copy, status: 'unreachable' } : copy;
  });
}

export function evaluateReplication(config: ReplicationConfig): ReplicationOutcome {
  const after = applyFailure(placeCopies(config.strategy), config.failure);
  const primaryReachable = after.some((c) => c.region === 'primary' && c.status !== 'unreachable');
  const secondaryExists = after.some((c) => c.region === 'secondary');

  if (primaryReachable) {
    return {
      dataSurvives: 'yes',
      readsNow: 'yes',
      writesNow: 'yes',
      recoveryPoint: 'no-acknowledged-writes-lost',
    };
  }
  if (secondaryExists) {
    return {
      dataSurvives: 'yes',
      readsNow: config.readAccessSecondary ? 'stale-reads-from-secondary' : 'no',
      writesNow: 'after-failover',
      recoveryPoint: 'writes-within-replication-lag',
    };
  }
  return {
    dataSurvives: 'only-if-the-outage-is-temporary',
    readsNow: 'no',
    writesNow: 'no',
    recoveryPoint: 'everything-if-permanent',
  };
}

const strategyPlacement: Record<ReplicationStrategy, string> = {
  local: 'Three synchronous copies in a single datacenter in Zone 1. Cheapest and lowest write latency; every copy shares that one location’s fate.',
  zone: 'Three synchronous copies, one in each of three zones. A write is acknowledged only once all three zones have it — slightly more latency and cost, no shared building.',
  geo: 'Three synchronous copies in one datacenter of the primary region, plus three more in a secondary region, copied asynchronously after each write is acknowledged.',
  'geo-zone': 'Three synchronous copies across the primary region’s zones, plus three more in a secondary region, copied asynchronously.',
};

const failureDescription: Record<StorageFailure, string> = {
  disk: 'One drive holding copy p1 fails. This is the most frequent failure by far.',
  zone: 'Zone 1 of the primary region goes offline. Copies there become unreachable — possibly only temporarily, possibly for good if the facility is destroyed.',
  region: 'The entire primary region becomes unavailable. Every primary copy is unreachable.',
};

function describeOutcome(config: ReplicationConfig, outcome: ReplicationOutcome): string {
  if (config.failure === 'disk') {
    return 'The platform detects the failed drive and rebuilds the missing copy from a healthy one. Reads and writes continue throughout — every strategy here tolerates a single disk failure.';
  }
  if (outcome.readsNow === 'yes') {
    return 'At least one primary copy is still reachable, so reads and writes continue without any failover, and no acknowledged write is lost because primary copies are written synchronously.';
  }
  if (outcome.writesNow === 'after-failover') {
    const reads = config.readAccessSecondary
      ? 'Reads can continue immediately from the secondary region, but they may be missing the most recent writes.'
      : 'Without read access to the secondary, nothing can be read until a failover promotes the secondary region.';
    return `The data still exists in the secondary region. ${reads} Writes resume only after failover, and writes acknowledged within the replication lag may never have reached the secondary.`;
  }
  return 'Every copy was in the failed location. Nothing can be read or written until it recovers, and if the outage were permanent, the data would be gone. Redundancy only helps against failures that do not hit every copy at once.';
}

export const replicationSimulation: SimulationDefinition<ReplicationState> = {
  id: 'storage-replication',
  title: 'Replication and Durability',
  description:
    'Places copies of stored data according to a redundancy strategy, applies a failure, and traces whether the data survives and whether it can still be read and written. Simulated — no storage is created.',
  parameters: [
    {
      key: 'strategy',
      label: 'Redundancy strategy',
      type: 'select',
      default: 'local',
      options: [
        { label: 'Local — 3 copies, one datacenter', value: 'local' },
        { label: 'Zone-redundant — 3 copies across 3 zones', value: 'zone' },
        { label: 'Geo-redundant — local + async copy in another region', value: 'geo' },
        { label: 'Geo-zone-redundant — zones + async copy in another region', value: 'geo-zone' },
      ],
      description: 'Where the copies of each object are kept.',
    },
    {
      key: 'failure',
      label: 'Failure to simulate',
      type: 'select',
      default: 'disk',
      options: [
        { label: 'A single disk fails', value: 'disk' },
        { label: 'One zone of the primary region fails', value: 'zone' },
        { label: 'The whole primary region fails', value: 'region' },
      ],
      description: 'Which failure happens after data has been written.',
    },
    {
      key: 'readAccessSecondary',
      label: 'Read access to the secondary region',
      type: 'boolean',
      default: false,
      description: 'Only affects geo strategies: allow reads from the secondary before failover.',
    },
  ],
  createInitialState: (params) => {
    const config = readConfig(params);
    return { ...config, copies: [], failureApplied: false, outcome: null };
  },
  steps: (params) => {
    const config = readConfig(params);
    const placed = placeCopies(config.strategy);
    const failed = applyFailure(placed, config.failure);
    const outcome = evaluateReplication(config);
    const geo = config.strategy === 'geo' || config.strategy === 'geo-zone';

    const steps: SimulationStep<ReplicationState>[] = [
      {
        id: 'place',
        label: 'Place copies',
        description: strategyPlacement[config.strategy],
        apply: (state) => ({ ...state, copies: placed }),
      },
      {
        id: 'write',
        label: 'A write is acknowledged',
        description: geo
          ? 'The write is acknowledged as soon as the primary copies have it. The secondary-region copies receive it a little later — that delay is the replication lag.'
          : 'The write is acknowledged only after every synchronous copy has it, so no acknowledged write exists in fewer places than the strategy promises.',
        apply: (state) => state,
      },
      {
        id: 'fail',
        label: 'Failure occurs',
        description: failureDescription[config.failure],
        apply: (state) => ({ ...state, copies: failed, failureApplied: true }),
      },
      {
        id: 'evaluate',
        label: 'Is the data durable and available?',
        description: describeOutcome(config, outcome),
        apply: (state) => ({ ...state, outcome }),
      },
    ];
    return steps;
  },
};
