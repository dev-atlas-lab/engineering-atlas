import { describe, it, expect } from 'vitest';
import {
  schedulerSimulation,
  deploymentScalingSimulation,
  reconciliationSimulation,
  architectureExplorerSimulation,
  applyDeploymentEvent,
  ARCHITECTURE_COMPONENTS,
  type DeploymentState,
  type SchedulerState,
  type ReconciliationState,
} from './simulations';

// --- Scheduler ------------------------------------------------------------

function runScheduler(cpu: number, memoryGb: number): SchedulerState {
  const params = { cpu, memoryGb };
  let state = schedulerSimulation.createInitialState(params);
  for (const step of schedulerSimulation.steps(params)) {
    state = step.apply(state, params);
  }
  return state;
}

describe('schedulerSimulation', () => {
  it('binds a small Pod to a feasible node', () => {
    const state = runScheduler(0.5, 1);
    // Every node was evaluated.
    expect(state.nodes.every((n) => n.evaluation)).toBe(true);
    // At least one node is feasible.
    expect(state.nodes.some((n) => n.evaluation && !n.evaluation.filteredOut)).toBe(true);
    expect(state.chosenNodeId).not.toBeNull();
    expect(state.unschedulable).toBe(false);
  });

  it('marks the Pod Unschedulable when no node can fit it', () => {
    // Memory-based exhaustion: no node has 10 GiB free (node-1 has 6, node-2 has 1, node-3 has 3).
    const state = runScheduler(1, 10);
    expect(state.nodes.every((n) => n.evaluation?.filteredOut === true)).toBe(true);
    expect(state.chosenNodeId).toBeNull();
    expect(state.unschedulable).toBe(true);
  });

  it('is deterministic — same request always picks the same node', () => {
    const a = runScheduler(1, 2);
    const b = runScheduler(1, 2);
    expect(a.chosenNodeId).toBe(b.chosenNodeId);
  });

  it('selects the least-loaded feasible node (LeastAllocated priority)', () => {
    // For a 1-CPU/2-GiB Pod, node-1 has more headroom than node-3, so it should win.
    const state = runScheduler(1, 2);
    expect(state.chosenNodeId).toBe('node-1');
  });
});

// --- Deployment event model (exported pure function) ---------------------

const makeState = (replicas: number): DeploymentState => ({
  desiredReplicas: replicas,
  rolloutVersion: 'v1',
  pods: Array.from({ length: replicas }, (_, i) => ({ id: `pod-${i + 1}`, version: 'v1', health: 'running' as const })),
  events: [],
});

describe('applyDeploymentEvent', () => {
  it('scales up by creating the missing Pods', () => {
    const { state } = applyDeploymentEvent(makeState(2), { kind: 'scale', target: 4 });
    expect(state.desiredReplicas).toBe(4);
    expect(state.pods.filter((p) => p.health === 'running')).toHaveLength(4);
  });

  it('scales down by removing surplus running Pods', () => {
    const { state } = applyDeploymentEvent(makeState(5), { kind: 'scale', target: 2 });
    expect(state.desiredReplicas).toBe(2);
    expect(state.pods.filter((p) => p.health === 'running')).toHaveLength(2);
  });

  it('is a no-op when scaling to the current replica count', () => {
    const start = makeState(3);
    const { state } = applyDeploymentEvent(start, { kind: 'scale', target: 3 });
    expect(state).toBe(start);
  });

  it('self-heals: killing a Pod creates a replacement to match desired count', () => {
    const start = makeState(3);
    const { state } = applyDeploymentEvent(start, { kind: 'kill-pod', podIndex: 0 });
    // Running count returns to desired.
    expect(state.pods.filter((p) => p.health === 'running')).toHaveLength(3);
    // The failed Pod is retained for visibility.
    expect(state.pods.filter((p) => p.health === 'failed')).toHaveLength(1);
  });

  it('rolls out a new version to every running Pod', () => {
    const start = makeState(3);
    const { state } = applyDeploymentEvent(start, { kind: 'update-image', newVersion: 'v2' });
    expect(state.rolloutVersion).toBe('v2');
    expect(state.pods.filter((p) => p.health === 'running').every((p) => p.version === 'v2')).toBe(true);
  });
});

describe('deploymentScalingSimulation', () => {
  it('converges running Pods to the scale target by the end of its step sequence', () => {
    const params = { initialReplicas: 3, targetReplicas: 5, killPod: true, rolloutV2: true };
    let state = deploymentScalingSimulation.createInitialState(params);
    for (const step of deploymentScalingSimulation.steps(params)) {
      state = step.apply(state, params);
    }
    expect(state.desiredReplicas).toBe(5);
    expect(state.pods.filter((p) => p.health === 'running')).toHaveLength(5);
    expect(state.rolloutVersion).toBe('v2');
  });

  it('is deterministic — identical params produce identical end states', () => {
    const params = { initialReplicas: 3, targetReplicas: 5, killPod: true, rolloutV2: false };
    const run = () => {
      let s = deploymentScalingSimulation.createInitialState(params);
      for (const step of deploymentScalingSimulation.steps(params)) s = step.apply(s, params);
      return s;
    };
    expect(run()).toEqual(run());
  });
});

// --- Reconciliation -------------------------------------------------------

describe('reconciliationSimulation', () => {
  it('always returns actual to desired after each tick, no matter the drift', () => {
    const params = { desired: 3, firstFailureTick: 1, secondFailureTick: 3 };
    let state: ReconciliationState = reconciliationSimulation.createInitialState(params);
    for (const step of reconciliationSimulation.steps(params)) {
      state = step.apply(state, params);
      // At the end of every tick, the gap is closed.
      expect(state.actual).toBe(state.desired);
    }
    expect(state.converged).toBe(true);
  });

  it('logs each tick', () => {
    const params = { desired: 3, firstFailureTick: 1, secondFailureTick: 0 };
    let state = reconciliationSimulation.createInitialState(params);
    for (const step of reconciliationSimulation.steps(params)) state = step.apply(state, params);
    // Initial log entry + one per tick.
    expect(state.log.length).toBe(1 + reconciliationSimulation.steps(params).length);
  });

  it('is deterministic', () => {
    const params = { desired: 3, firstFailureTick: 2, secondFailureTick: 4 };
    const run = () => {
      let s = reconciliationSimulation.createInitialState(params);
      for (const step of reconciliationSimulation.steps(params)) s = step.apply(s, params);
      return s;
    };
    expect(run()).toEqual(run());
  });
});

// --- Architecture Explorer -----------------------------------------------

describe('architectureExplorerSimulation', () => {
  it('has exactly one step per catalog component, in catalog order', () => {
    const steps = architectureExplorerSimulation.steps({});
    expect(steps.map((s) => s.id)).toEqual(ARCHITECTURE_COMPONENTS.map((c) => `inspect-${c.id}`));
  });

  it('records each component as inspected only once across advances', () => {
    const steps = architectureExplorerSimulation.steps({});
    let state = architectureExplorerSimulation.createInitialState({});
    for (const step of steps) state = step.apply(state, {});
    // All components inspected, each exactly once.
    expect(state.inspected).toHaveLength(ARCHITECTURE_COMPONENTS.length);
    expect(new Set(state.inspected).size).toBe(ARCHITECTURE_COMPONENTS.length);
  });

  it('has at least one control plane and one node component', () => {
    expect(ARCHITECTURE_COMPONENTS.some((c) => c.tier === 'control-plane')).toBe(true);
    expect(ARCHITECTURE_COMPONENTS.some((c) => c.tier === 'node')).toBe(true);
  });
});
