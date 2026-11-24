import { describe, it, expect } from 'vitest';
import { computeHistory } from '../../../engines/simulation/use-simulation';
import {
  applyFailure,
  evaluateReplication,
  placeCopies,
  replicationSimulation,
  type ReplicationState,
  type ReplicationStrategy,
  type StorageFailure,
} from './simulations';

describe('placeCopies', () => {
  it('keeps every local copy in one zone of the primary region', () => {
    const copies = placeCopies('local');
    expect(copies).toHaveLength(3);
    expect(new Set(copies.map((c) => `${c.region}-${c.zone}`))).toEqual(new Set(['primary-1']));
  });

  it('spreads zone-redundant copies across three zones, synchronously', () => {
    const copies = placeCopies('zone');
    expect(new Set(copies.map((c) => c.zone))).toEqual(new Set([1, 2, 3]));
    expect(copies.every((c) => c.replication === 'synchronous')).toBe(true);
  });

  it('adds asynchronous secondary-region copies for geo strategies', () => {
    for (const strategy of ['geo', 'geo-zone'] as const) {
      const secondary = placeCopies(strategy).filter((c) => c.region === 'secondary');
      expect(secondary).toHaveLength(3);
      expect(secondary.every((c) => c.replication === 'asynchronous')).toBe(true);
    }
  });
});

describe('applyFailure', () => {
  it('a disk failure affects exactly one copy', () => {
    const after = applyFailure(placeCopies('zone'), 'disk');
    expect(after.filter((c) => c.status !== 'intact')).toHaveLength(1);
  });

  it('a region failure makes every primary copy unreachable and leaves the secondary intact', () => {
    const after = applyFailure(placeCopies('geo-zone'), 'region');
    expect(after.filter((c) => c.region === 'primary').every((c) => c.status === 'unreachable')).toBe(true);
    expect(after.filter((c) => c.region === 'secondary').every((c) => c.status === 'intact')).toBe(true);
  });
});

describe('evaluateReplication — the strategy × failure matrix', () => {
  type Row = [ReplicationStrategy, StorageFailure, 'yes' | 'stale-reads-from-secondary' | 'no', string];
  const rows: Row[] = [
    ['local', 'disk', 'yes', 'no-acknowledged-writes-lost'],
    ['local', 'zone', 'no', 'everything-if-permanent'],
    ['local', 'region', 'no', 'everything-if-permanent'],
    ['zone', 'disk', 'yes', 'no-acknowledged-writes-lost'],
    ['zone', 'zone', 'yes', 'no-acknowledged-writes-lost'],
    ['zone', 'region', 'no', 'everything-if-permanent'],
    ['geo', 'disk', 'yes', 'no-acknowledged-writes-lost'],
    ['geo', 'zone', 'no', 'writes-within-replication-lag'],
    ['geo', 'region', 'no', 'writes-within-replication-lag'],
    ['geo-zone', 'disk', 'yes', 'no-acknowledged-writes-lost'],
    ['geo-zone', 'zone', 'yes', 'no-acknowledged-writes-lost'],
    ['geo-zone', 'region', 'no', 'writes-within-replication-lag'],
  ];

  it.each(rows)('%s + %s failure → reads now: %s, at risk: %s', (strategy, failure, readsNow, recoveryPoint) => {
    const outcome = evaluateReplication({ strategy, failure, readAccessSecondary: false });
    expect(outcome.readsNow).toBe(readsNow);
    expect(outcome.recoveryPoint).toBe(recoveryPoint);
  });

  it('read access to the secondary allows stale reads, but never writes, before failover', () => {
    const outcome = evaluateReplication({ strategy: 'geo', failure: 'region', readAccessSecondary: true });
    expect(outcome.readsNow).toBe('stale-reads-from-secondary');
    expect(outcome.writesNow).toBe('after-failover');
  });

  it('read access to the secondary changes nothing when the primary is still reachable', () => {
    const outcome = evaluateReplication({ strategy: 'geo-zone', failure: 'zone', readAccessSecondary: true });
    expect(outcome.readsNow).toBe('yes');
  });

  it('never reports data as surely surviving when every copy was in the failed location', () => {
    expect(evaluateReplication({ strategy: 'zone', failure: 'region', readAccessSecondary: false }).dataSurvives).toBe(
      'only-if-the-outage-is-temporary',
    );
  });
});

describe('replicationSimulation', () => {
  const params = { strategy: 'zone', failure: 'zone', readAccessSecondary: false };

  it('is deterministic and replayable', () => {
    expect(computeHistory(replicationSimulation, params)).toEqual(computeHistory(replicationSimulation, params));
  });

  it('only reports an outcome once the failure has been applied', () => {
    const history = computeHistory(replicationSimulation, params).map((h) => h.state as ReplicationState);
    expect(history.slice(0, -1).every((s) => s.outcome === null)).toBe(true);
    expect(history.at(-1)!.failureApplied).toBe(true);
    expect(history.at(-1)!.outcome?.readsNow).toBe('yes');
  });

  it('falls back to safe defaults for unrecognised params', () => {
    const last = computeHistory(replicationSimulation, { strategy: 'nope', failure: 'nope' }).at(-1)!.state as ReplicationState;
    expect(last).toMatchObject({ strategy: 'local', failure: 'disk', readAccessSecondary: false });
  });
});
