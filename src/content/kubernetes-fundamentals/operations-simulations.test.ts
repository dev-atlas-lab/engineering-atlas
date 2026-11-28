import { describe, it, expect } from 'vitest';
import type { SimulationDefinition, SimulationParams } from '../../engines/simulation/types';
import {
  podHealthSimulation,
  schedulingConstraintsSimulation,
  resourceManagementSimulation,
  hpaScalingSimulation,
  deploymentRolloutSimulation,
  stepPodHealth,
  hpaDesiredReplicas,
  deriveQos,
  runScheduling,
} from './operations-simulations';
import type {
  PodHealthState,
  ResourceState,
  HpaState,
  RolloutState,
  SchedulingState,
} from './operations-simulations';

function runAll<T>(sim: SimulationDefinition<T>, params: SimulationParams): T {
  let state = sim.createInitialState(params);
  for (const step of sim.steps(params)) {
    state = step.apply(state, params);
  }
  return state;
}

// --- Pod health probe simulator -------------------------------------------

describe('podHealthSimulation', () => {
  const defaults = {
    appStartupTicks: 3,
    appFailsAtTick: 0,
    startupEnabled: true,
    startupFailureThreshold: 15,
    livenessEnabled: true,
    livenessFailureThreshold: 3,
    readinessEnabled: true,
    ticks: 8,
  };

  it('reaches Running and Ready once startup completes', () => {
    const state = runAll<PodHealthState>(podHealthSimulation, { ...defaults });
    expect(state.startupCompleted).toBe(true);
    expect(state.phase).toBe('Running');
    expect(state.ready).toBe(true);
    expect(state.endpointsIncluded).toBe(true);
  });

  it('readiness failure removes the Pod from endpoints without restarting', () => {
    // app "fails" at tick 5 so appAlive becomes false — readiness fails, liveness restarts eventually.
    // Keep liveness off to isolate readiness.
    const state = runAll<PodHealthState>(podHealthSimulation, {
      ...defaults,
      appFailsAtTick: 5,
      livenessEnabled: false,
      ticks: 8,
    });
    // After the fail tick, readiness failed enough times to remove endpoints.
    expect(state.endpointsIncluded).toBe(false);
    // Restart count stayed at zero — no liveness probe killed anything.
    expect(state.restartCount).toBe(0);
  });

  it('is deterministic for the same parameters', () => {
    const a = runAll<PodHealthState>(podHealthSimulation, { ...defaults });
    const b = runAll<PodHealthState>(podHealthSimulation, { ...defaults });
    expect(a).toStrictEqual(b);
  });

  it('stepPodHealth transitions Pending -> StartingUp at tick 1 with startup probe on', () => {
    const initial = podHealthSimulation.createInitialState({});
    const next = stepPodHealth(initial as PodHealthState, {
      appStartupTicks: 3,
      appFailsAtTick: 0,
      startup: { enabled: true, initialDelaySeconds: 0, periodSeconds: 1, failureThreshold: 10, successThreshold: 1 },
      liveness: { enabled: true, initialDelaySeconds: 0, periodSeconds: 1, failureThreshold: 3, successThreshold: 1 },
      readiness: { enabled: true, initialDelaySeconds: 0, periodSeconds: 1, failureThreshold: 2, successThreshold: 1 },
    });
    expect(next.phase).not.toBe('Pending');
  });
});

// --- Scheduling constraints simulator -------------------------------------

describe('schedulingConstraintsSimulation', () => {
  it('runScheduling: basic Pod fits on the least-loaded feasible node', () => {
    const { evaluations, chosenNodeId } = runScheduling({
      cpu: 1, memoryGb: 2, requireGpu: false, tolerateDedicatedTaint: false, preferZone: 'any', spreadConstraint: false,
    });
    // Node-c is tainted and not tolerated, so filtered out.
    const c = evaluations.find((e) => e.nodeId === 'node-c')!;
    expect(c.filteredOut).toBe(true);
    expect(chosenNodeId).not.toBeNull();
  });

  it('nodeSelector: gpu=true requires GPU nodes', () => {
    const { evaluations } = runScheduling({
      cpu: 1, memoryGb: 2, requireGpu: true, tolerateDedicatedTaint: false, preferZone: 'any', spreadConstraint: false,
    });
    // Only node-c has gpu=true, but it has an untolerated taint, so it is filtered out.
    expect(evaluations.every((e) => e.filteredOut)).toBe(true);
  });

  it('tolerating the taint opens up node-c', () => {
    const { chosenNodeId } = runScheduling({
      cpu: 1, memoryGb: 2, requireGpu: true, tolerateDedicatedTaint: true, preferZone: 'any', spreadConstraint: false,
    });
    expect(chosenNodeId).toBe('node-c');
  });

  it('simulation ends in a bound or unschedulable terminal phase', () => {
    const state = runAll<SchedulingState>(schedulingConstraintsSimulation, {
      cpu: 1, memoryGb: 2, requireGpu: false, tolerateGpuTaint: false, preferZone: 'any', spreadConstraint: false,
    });
    expect(state.phase).toBe('bound');
    expect(state.unschedulable || state.chosenNodeId !== null).toBe(true);
  });
});

// --- Resource management simulator ----------------------------------------

describe('resourceManagementSimulation', () => {
  it('deriveQos identifies Guaranteed when all requests equal limits and non-zero', () => {
    expect(deriveQos({ cpuRequest: 1, cpuLimit: 1, memoryRequestMi: 512, memoryLimitMi: 512 })).toBe('Guaranteed');
  });
  it('deriveQos identifies Burstable when requests differ from limits', () => {
    expect(deriveQos({ cpuRequest: 0.5, cpuLimit: 1, memoryRequestMi: 256, memoryLimitMi: 512 })).toBe('Burstable');
  });
  it('deriveQos identifies BestEffort when there are no requests or limits', () => {
    expect(deriveQos({ cpuRequest: 0, cpuLimit: 0, memoryRequestMi: 0, memoryLimitMi: 0 })).toBe('BestEffort');
  });

  it('CPU above the limit produces throttling but no OOMKill', () => {
    const state = runAll<ResourceState>(resourceManagementSimulation, {
      cpuRequest: 0.5, cpuLimit: 1, memoryRequestMi: 256, memoryLimitMi: 2048, workload: 'cpu-spike',
    });
    expect(state.oomKilled).toBe(false);
    expect(state.events.some((e) => e.includes('throttled'))).toBe(true);
  });

  it('memory above the limit produces an OOMKill', () => {
    const state = runAll<ResourceState>(resourceManagementSimulation, {
      cpuRequest: 0.5, cpuLimit: 2, memoryRequestMi: 128, memoryLimitMi: 256, workload: 'memory-spike',
    });
    expect(state.restartCount).toBeGreaterThanOrEqual(1);
  });
});

// --- HPA scaling simulator ------------------------------------------------

describe('hpaScalingSimulation', () => {
  it('hpaDesiredReplicas follows the ceil formula', () => {
    expect(hpaDesiredReplicas(4, 90, 60)).toBe(6);
    expect(hpaDesiredReplicas(5, 50, 50)).toBe(5);
    expect(hpaDesiredReplicas(10, 10, 50)).toBe(2);
  });

  it('respects minReplicas and maxReplicas', () => {
    const state = runAll<HpaState>(hpaScalingSimulation, {
      minReplicas: 2, maxReplicas: 5, targetUtil: 50, scenario: 'ramp-up', stabilizationDownTicks: 0,
    });
    expect(state.currentReplicas).toBeGreaterThanOrEqual(2);
    expect(state.currentReplicas).toBeLessThanOrEqual(5);
  });

  it('stabilization window delays scale-down', () => {
    const noStab = runAll<HpaState>(hpaScalingSimulation, {
      minReplicas: 1, maxReplicas: 10, targetUtil: 50, scenario: 'spike-and-settle', stabilizationDownTicks: 0,
    });
    const withStab = runAll<HpaState>(hpaScalingSimulation, {
      minReplicas: 1, maxReplicas: 10, targetUtil: 50, scenario: 'spike-and-settle', stabilizationDownTicks: 5,
    });
    // Stabilised version settles with at least as many replicas as the unstabilised one.
    expect(withStab.currentReplicas).toBeGreaterThanOrEqual(noStab.currentReplicas);
  });
});

// --- Deployment rollout simulator -----------------------------------------

describe('deploymentRolloutSimulation', () => {
  it('rolling update converges to all v2 replicas Ready', () => {
    const state = runAll<RolloutState>(deploymentRolloutSimulation, {
      strategy: 'rolling', totalReplicas: 3, maxSurge: 1, maxUnavailable: 1, v2FailsReadiness: false,
    });
    expect(state.phase).toBe('complete');
    expect(state.newRs.ready).toBe(3);
    expect(state.oldRs.desired).toBe(0);
  });

  it('rolling update stalls when v2 fails readiness', () => {
    const state = runAll<RolloutState>(deploymentRolloutSimulation, {
      strategy: 'rolling', totalReplicas: 3, maxSurge: 1, maxUnavailable: 1, v2FailsReadiness: true,
    });
    expect(state.phase).toBe('paused');
    expect(state.oldRs.ready).toBeGreaterThan(0); // old still serving
  });

  it('blue-green completes with a single cutover when v2 is healthy', () => {
    const state = runAll<RolloutState>(deploymentRolloutSimulation, {
      strategy: 'blue-green', totalReplicas: 3, maxSurge: 0, maxUnavailable: 0, v2FailsReadiness: false,
    });
    expect(state.phase).toBe('complete');
    expect(state.oldRs.desired).toBe(0);
  });

  it('canary rolls back when v2 fails readiness', () => {
    const state = runAll<RolloutState>(deploymentRolloutSimulation, {
      strategy: 'canary', totalReplicas: 5, maxSurge: 0, maxUnavailable: 0, v2FailsReadiness: true,
    });
    expect(state.phase).toBe('rolled-back');
    expect(state.oldRs.ready).toBe(5);
  });
});
