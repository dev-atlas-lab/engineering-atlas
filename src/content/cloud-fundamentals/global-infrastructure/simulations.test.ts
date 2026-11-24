import { describe, it, expect } from 'vitest';
import { computeHistory } from '../../../engines/simulation/use-simulation';
import { evaluateZoneFailure, zoneFailureSimulation, type ZoneFailureState } from './simulations';

function finalState(params: Record<string, string | number>) {
  return computeHistory(zoneFailureSimulation, params).at(-1)!.state as ZoneFailureState;
}

describe('evaluateZoneFailure', () => {
  it('takes the service down when every web VM sits in the failed zone', () => {
    const result = evaluateZoneFailure({ webPlacement: 'single-zone', databaseMode: 'zone-redundant', failedZone: 1 });
    expect(result.available).toBe(false);
    expect(result.servingWeb).toBe(0);
  });

  it('survives with reduced capacity when the web tier is spread and the database is zone-redundant', () => {
    const result = evaluateZoneFailure({ webPlacement: 'three-zones', databaseMode: 'zone-redundant', failedZone: 1 });
    expect(result).toMatchObject({ available: true, degraded: true, servingWeb: 2, totalWeb: 3 });
  });

  it('is unaffected when the failed zone holds nothing the service uses', () => {
    const result = evaluateZoneFailure({ webPlacement: 'single-zone', databaseMode: 'zonal', failedZone: 3 });
    expect(result).toMatchObject({ available: true, degraded: false });
  });

  it('loses the data tier when a single-instance database is in the failed zone, even with a spread web tier', () => {
    const result = evaluateZoneFailure({ webPlacement: 'three-zones', databaseMode: 'zonal', failedZone: 1 });
    expect(result.available).toBe(false);
    expect(result.servingWeb).toBe(2);
  });

  it('promotes the standby when the primary zone fails', () => {
    const result = evaluateZoneFailure({ webPlacement: 'two-zones', databaseMode: 'zone-standby', failedZone: 1 });
    expect(result.available).toBe(true);
    const standby = result.afterDatabase.find((r) => r.id === 'db-standby');
    expect(standby?.status).toBe('serving');
  });

  it('keeps the primary serving when the standby zone fails', () => {
    const result = evaluateZoneFailure({ webPlacement: 'two-zones', databaseMode: 'zone-standby', failedZone: 2 });
    expect(result.available).toBe(true);
    expect(result.afterDatabase.find((r) => r.id === 'db-primary')?.status).toBe('serving');
    expect(result.afterDatabase.find((r) => r.id === 'db-standby')?.status).toBe('failed');
  });

  it('a spread web tier plus a zone-standby database survives the loss of any single zone', () => {
    for (const failedZone of [1, 2, 3] as const) {
      expect(evaluateZoneFailure({ webPlacement: 'two-zones', databaseMode: 'zone-standby', failedZone }).available).toBe(true);
    }
  });
});

describe('zoneFailureSimulation', () => {
  const params = { webPlacement: 'two-zones', databaseMode: 'zonal', failedZone: 1 };

  it('is deterministic — the same params always produce the same history', () => {
    expect(computeHistory(zoneFailureSimulation, params)).toEqual(computeHistory(zoneFailureSimulation, params));
  });

  it('has no verdict until the final step, so validation cannot pass early', () => {
    const history = computeHistory(zoneFailureSimulation, params);
    for (const entry of history.slice(0, -1)) expect((entry.state as ZoneFailureState).verdict).toBeNull();
    expect((history.at(-1)!.state as ZoneFailureState).verdict).not.toBeNull();
  });

  it('records the zone under test from the very first state', () => {
    expect((computeHistory(zoneFailureSimulation, params)[0]!.state as ZoneFailureState).testedZone).toBe(1);
  });

  it('falls back to safe defaults for unrecognised params instead of throwing', () => {
    expect(() => finalState({ webPlacement: 'bogus', databaseMode: 'bogus', failedZone: 9 })).not.toThrow();
    expect(finalState({ webPlacement: 'bogus', databaseMode: 'bogus', failedZone: 9 }).testedZone).toBe(1);
  });
});
