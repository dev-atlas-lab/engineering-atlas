import { describe, it, expect } from 'vitest';
import { computeHistory } from '../../engines/simulation/use-simulation';
import type { SimulationDefinition, SimulationParams } from '../../engines/simulation/types';
import {
  binderSimulation,
  dynamicProvisioningSimulation,
  statefulsetStorageSimulation,
  backupRecoverySimulation,
  storageTroubleshootingSimulation,
  tryBind,
  applyStsEvent,
  computeRpoRto,
} from './storage-simulations';
import type {
  BindingState,
  DynamicProvState,
  BackupState,
} from './storage-simulations';
import { content as pvcContent } from './storage-fundamentals/persistent-volume-claims';
import { content as dynProvContent } from './storage-internals/dynamic-provisioning';
import { content as stsContent } from './stateful-workloads/statefulset-architecture';
import { content as rpoRtoContent } from './data-reliability/rpo-and-rto-in-kubernetes';
import { content as triageContent } from './storage-operations/pvc-pending-troubleshooting';
import type { SimulationLab } from '../types';

function finalState<T>(sim: SimulationDefinition<T>, params: SimulationParams): T {
  const history = computeHistory(sim, params);
  return history[history.length - 1]!.state;
}

function assertHistoryImmutability<T>(sim: SimulationDefinition<T>, params: SimulationParams) {
  const history = computeHistory(sim, params);
  expect(history.length).toBeGreaterThan(1);
  // Capture deep clones at the time each entry is inspected and compare against
  // a fresh run, proving later steps never mutated earlier snapshots in place.
  const firstRunSnapshots = history.map((entry) => structuredClone(entry.state));
  const secondRun = computeHistory(sim, params);
  expect(secondRun.map((e) => e.state)).toStrictEqual(firstRunSnapshots);
  // Also verify initial state differs from final state (real transitions, not no-ops).
  expect(history[0]!.state).not.toStrictEqual(history[history.length - 1]!.state);
}

// --- Lab 1: PV / PVC Binding Simulator ------------------------------------

describe('binderSimulation', () => {
  const defaults: SimulationParams = {
    claimClass: 'fast',
    claimRequestGb: 10,
    claimAccessMode: 'ReadWriteOnce',
    scenario: 'default',
  };

  it('starts Pending with 4 available PVs on default scenario', () => {
    const init = binderSimulation.createInitialState(defaults);
    expect(init.pvs).toHaveLength(4);
    expect(init.pvcs[0]!.status).toBe('Pending');
  });

  it('binds tightest-fit PV matching class, capacity, and access mode', () => {
    const state = finalState<BindingState>(binderSimulation, defaults);
    expect(state.pvcs[0]!.status).toBe('Bound');
    expect(state.pvcs[0]!.boundPv).toBe('pv-fast-20');
  });

  it('fails with capacity reason when requested size exceeds all matching class PVs', () => {
    const state = finalState<BindingState>(binderSimulation, { ...defaults, claimRequestGb: 80 });
    expect(state.pvcs[0]!.status).toBe('Pending');
    expect(state.pvcs[0]!.reason).toContain('>= 80 GiB');
  });

  it('fails when requested StorageClass or accessMode is missing or all PVs are bound', () => {
    const wrongClass = finalState<BindingState>(binderSimulation, { ...defaults, claimClass: 'archive' });
    expect(wrongClass.pvcs[0]!.status).toBe('Pending');
    expect(wrongClass.pvcs[0]!.reason).toContain('archive');

    const noShared = finalState<BindingState>(binderSimulation, {
      ...defaults,
      claimClass: 'shared',
      claimAccessMode: 'ReadWriteMany',
      scenario: 'no-shared',
    });
    expect(noShared.pvcs[0]!.status).toBe('Pending');

    const allBound = finalState<BindingState>(binderSimulation, { ...defaults, scenario: 'all-bound' });
    expect(allBound.pvcs[0]!.status).toBe('Pending');
    expect(allBound.pvcs[0]!.reason).toContain('no Available PVs');
  });

  it('tryBind enforces subset access-mode matching', () => {
    const pvs = binderSimulation.createInitialState(defaults).pvs;
    const res = tryBind(
      { id: 'c', requestGb: 10, accessModes: ['ReadOnlyMany'], storageClassName: 'slow', status: 'Pending', boundPv: null, reason: null },
      pvs,
    );
    expect(res.pvId).toBe('pv-slow-100');
  });

  it('is deterministic, immutable for step-back, and satisfies lab validationRules', () => {
    assertHistoryImmutability(binderSimulation, defaults);
    const rules = (pvcContent.labs['pv-pvc-binder-simulator']!.content as SimulationLab).validationRules;
    expect(rules.every((r) => r.check(finalState(binderSimulation, defaults)))).toBe(true);
    expect(rules.every((r) => r.check(finalState(binderSimulation, { ...defaults, claimClass: 'archive' })))).toBe(true);
  });
});

// --- Lab 2: Dynamic Provisioning Simulator --------------------------------

describe('dynamicProvisioningSimulation', () => {
  const wfcDefault: SimulationParams = {
    provisioner: 'WaitForFirstConsumer',
    zoneConstraint: 'any',
    podRequestsVolume: true,
    podZonePreference: 'zone-b',
  };

  it('WaitForFirstConsumer defers provisioning until scheduler chooses the Pod zone', () => {
    const history = computeHistory(dynamicProvisioningSimulation, wfcDefault);
    expect(history[1]!.state.phase).toBe('waiting-for-consumer');
    expect(history[1]!.state.provisionedPv).toBeNull();
    const end = history[history.length - 1]!.state;
    expect(end.phase).toBe('pod-running');
    expect(end.provisionedPv?.zone).toBe('zone-b');
  });

  it('Immediate causes a scheduling conflict when PV zone mismatches Pod nodeSelector', () => {
    const end = finalState<DynamicProvState>(dynamicProvisioningSimulation, {
      provisioner: 'Immediate',
      zoneConstraint: 'any',
      podRequestsVolume: true,
      podZonePreference: 'zone-b',
    });
    expect(end.phase).toBe('failed');
    expect(end.reason).toContain('zone-b');
    expect(end.reason).toContain('zone-a');
  });

  it('WaitForFirstConsumer detects impossible conflicting constraints', () => {
    const end = finalState<DynamicProvState>(dynamicProvisioningSimulation, {
      provisioner: 'WaitForFirstConsumer',
      zoneConstraint: 'zone-a',
      podRequestsVolume: true,
      podZonePreference: 'zone-b',
    });
    expect(end.phase).toBe('failed');
    expect(end.reason).toContain('No zone satisfies both');
  });

  it('unconsumed PVC under WFC stays waiting-for-consumer', () => {
    const end = finalState<DynamicProvState>(dynamicProvisioningSimulation, {
      ...wfcDefault,
      podRequestsVolume: false,
    });
    expect(end.phase).toBe('waiting-for-consumer');
    expect(end.provisionedPv).toBeNull();
  });

  it('is deterministic, immutable, and satisfies lab validationRules', () => {
    assertHistoryImmutability(dynamicProvisioningSimulation, wfcDefault);
    const rules = (dynProvContent.labs['dynamic-provisioning-simulator']!.content as SimulationLab).validationRules;
    expect(rules.every((r) => r.check(finalState(dynamicProvisioningSimulation, wfcDefault)))).toBe(true);
    expect(rules.every((r) => r.check(finalState(dynamicProvisioningSimulation, { ...wfcDefault, provisioner: 'Immediate' })))).toBe(true);
  });
});

// --- Lab 3: StatefulSet Storage Simulator ---------------------------------

describe('statefulsetStorageSimulation', () => {
  const defaults: SimulationParams = {
    initialReplicas: 3,
    scaleTo: 5,
    deletePod: true,
    scaleDown: true,
  };

  it('scales up with new PVCs, preserves web-1 on delete, and retains orphaned PVCs on scale-down', () => {
    const history = computeHistory(statefulsetStorageSimulation, defaults);
    expect(history[0]!.state.pods).toHaveLength(3);
    expect(history[1]!.state.pods).toHaveLength(5);
    expect(history[1]!.state.pvcs).toHaveLength(5);
    // Delete web-1 keeps web-1 attached to data-web-1
    expect(history[2]!.state.pods.find((p) => p.name === 'web-1')?.pvcName).toBe('data-web-1');
    // Scale down to 2 removes Pods 2..4 while keeping all 5 PVCs
    const end = history[history.length - 1]!.state;
    expect(end.pods.map((p) => p.name)).toEqual(['web-0', 'web-1']);
    expect(end.pvcs).toHaveLength(5);
  });

  it('applyStsEvent handles boundary no-op scale and missing pod deletion cleanly', () => {
    const init = statefulsetStorageSimulation.createInitialState(defaults);
    const same = applyStsEvent(init, { kind: 'scale', to: 3 });
    expect(same.pods).toHaveLength(3);
    const missing = applyStsEvent(init, { kind: 'delete-pod', ordinal: 99 });
    expect(missing).toBe(init);
  });

  it('is deterministic, immutable, and satisfies lab validationRules', () => {
    assertHistoryImmutability(statefulsetStorageSimulation, defaults);
    const rules = (stsContent.labs['statefulset-storage-simulator']!.content as SimulationLab).validationRules;
    expect(rules.every((r) => r.check(finalState(statefulsetStorageSimulation, defaults)))).toBe(true);
  });
});

// --- Lab 4: Backup & Recovery Simulator -----------------------------------

describe('backupRecoverySimulation', () => {
  const defaults: SimulationParams = {
    frequency: 3,
    retention: 5,
    consistency: 'application',
    restoreDuration: 2,
    scenario: 'accidental-delete',
  };

  it('computes RPO and RTO accurately when a backup exists before failure tick 10', () => {
    const end = finalState<BackupState>(backupRecoverySimulation, defaults);
    expect(end.restored).toBe(true);
    expect(end.chosenBackup?.tick).toBe(9);
    expect(end.rpoTicks).toBe(1);
    expect(end.rtoTicks).toBe(2);
  });

  it('logs permanent data loss when backup frequency exceeds failure tick (no backups taken)', () => {
    const end = finalState<BackupState>(backupRecoverySimulation, { ...defaults, frequency: 20 });
    expect(end.dataLost).toBe(true);
    expect(end.restored).toBe(false);
    expect(end.log.some((l) => l.includes('permanently lost'))).toBe(true);
  });

  it('flags crash-consistent and logical-corruption window warnings', () => {
    const crash = finalState<BackupState>(backupRecoverySimulation, { ...defaults, consistency: 'crash' });
    expect(crash.log.some((l) => l.includes('crash-consistent snapshot'))).toBe(true);

    const corrupt = finalState<BackupState>(backupRecoverySimulation, {
      ...defaults,
      frequency: 1,
      retention: 3,
      scenario: 'logical-corruption',
    });
    expect(corrupt.log.some((l) => l.includes('corruption window'))).toBe(true);
  });

  it('computeRpoRto handles empty backups gracefully', () => {
    expect(computeRpoRto({ failureTick: 10, backups: [], restoreDurationTicks: 2 })).toEqual({
      chosen: null,
      rpoTicks: null,
      rtoTicks: null,
    });
  });

  it('is deterministic, immutable, and satisfies lab validationRules', () => {
    assertHistoryImmutability(backupRecoverySimulation, defaults);
    const rules = (rpoRtoContent.labs['backup-recovery-simulator']!.content as SimulationLab).validationRules;
    expect(rules.every((r) => r.check(finalState(backupRecoverySimulation, defaults)))).toBe(true);
    expect(rules.every((r) => r.check(finalState(backupRecoverySimulation, { ...defaults, scenario: 'none' })))).toBe(true);
  });
});

// --- Lab 5: Storage Troubleshooting Simulator -------------------------------

describe('storageTroubleshootingSimulation', () => {
  it('reveals root cause on the symptom-appropriate diagnostic command (not prematurely on describe-pvc)', () => {
    // failed-attach must NOT resolve on step 1 (describe-pvc); it resolves on step 2 (describe-pod).
    const attachHistory = computeHistory(storageTroubleshootingSimulation, { symptom: 'failed-attach' });
    expect(attachHistory[1]!.state.resolved).toBe(false);
    expect(attachHistory[2]!.state.resolved).toBe(true);
    expect(attachHistory[2]!.state.rootCause).toContain('RWO');

    // disk-pressure must NOT resolve on describe-pvc or describe-pod; it resolves on step 3 (describe-node).
    const diskHistory = computeHistory(storageTroubleshootingSimulation, { symptom: 'disk-pressure' });
    expect(diskHistory[1]!.state.resolved).toBe(false);
    expect(diskHistory[2]!.state.resolved).toBe(false);
    expect(diskHistory[3]!.state.resolved).toBe(true);
    expect(diskHistory[3]!.state.rootCause).toContain('ephemeral-storage');

    // pvc-pending-no-sc resolves on step 1 (describe-pvc).
    const noScHistory = computeHistory(storageTroubleshootingSimulation, { symptom: 'pvc-pending-no-sc' });
    expect(noScHistory[1]!.state.resolved).toBe(true);

    // slow-io resolves on step 1 (iostat).
    const slowIoHistory = computeHistory(storageTroubleshootingSimulation, { symptom: 'slow-io' });
    expect(slowIoHistory[1]!.state.resolved).toBe(true);
    expect(slowIoHistory[1]!.state.rootCause).toContain('IOPS');
  });

  it('is deterministic, immutable, and satisfies lab validationRules', () => {
    const params = { symptom: 'pvc-pending-topology' };
    assertHistoryImmutability(storageTroubleshootingSimulation, params);
    const rules = (triageContent.labs['storage-troubleshooting-lab']!.content as SimulationLab).validationRules;
    expect(rules.every((r) => r.check(storageTroubleshootingSimulation.createInitialState(params)))).toBe(false);
    expect(rules.every((r) => r.check(finalState(storageTroubleshootingSimulation, params)))).toBe(true);
  });
});
