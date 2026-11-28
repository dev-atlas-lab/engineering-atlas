// Deterministic simulation engines for Slice 3B operations labs.
// Every engine is a pure function of params + state — no randomness,
// no wall-clock dependence — so the same inputs always produce the same
// history. Business logic for each lab lives here; views live in
// operations-simulation-views.tsx.

import type { SimulationDefinition } from '../../engines/simulation/types';

// ---------------------------------------------------------------------------
// Lab 1: Pod Health & Probe Simulator
// ---------------------------------------------------------------------------
// Models how the kubelet drives a container through startup → ready →
// running, applying the three probe kinds (startup, liveness, readiness)
// per their failure thresholds. Also tracks whether the Pod is included
// in its Service's endpoints — which is what readiness, not liveness,
// gates.

export type ProbeOutcome = 'success' | 'failure' | 'disabled';

export interface ProbeConfig {
  enabled: boolean;
  initialDelaySeconds: number;
  periodSeconds: number;
  failureThreshold: number;
  successThreshold: number;
}

export type ContainerPhase =
  | 'Pending'
  | 'StartingUp'
  | 'Running'
  | 'Restarting'
  | 'CrashLoopBackOff';

export interface ProbeState {
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastOutcome: ProbeOutcome;
}

export interface PodHealthState {
  tick: number;
  phase: ContainerPhase;
  ready: boolean;
  restartCount: number;
  endpointsIncluded: boolean;
  log: string[];
  startup: ProbeState;
  liveness: ProbeState;
  readiness: ProbeState;
  startupCompleted: boolean;
}

function newProbeState(): ProbeState {
  return { consecutiveFailures: 0, consecutiveSuccesses: 0, lastOutcome: 'disabled' };
}

const DEFAULT_PROBE: ProbeConfig = {
  enabled: true,
  initialDelaySeconds: 0,
  periodSeconds: 1,
  failureThreshold: 3,
  successThreshold: 1,
};

/**
 * Pure step function. Given current state and params, computes probe
 * outcomes for this tick and returns the resulting state. Exported for
 * direct unit testing.
 */
export function stepPodHealth(
  state: PodHealthState,
  params: {
    appStartupTicks: number;
    appFailsAtTick: number;
    startup: ProbeConfig;
    liveness: ProbeConfig;
    readiness: ProbeConfig;
  },
): PodHealthState {
  const nextTick = state.tick + 1;
  if (state.phase === 'CrashLoopBackOff') {
    return {
      ...state,
      tick: nextTick,
      log: [...state.log, `t=${nextTick}: CrashLoopBackOff — kubelet is waiting before the next restart attempt.`],
    };
  }

  const effectivelyStarted = state.startupCompleted || !params.startup.enabled;
  const appReady = nextTick >= params.appStartupTicks;
  const appAlive = params.appFailsAtTick === 0 || nextTick < params.appFailsAtTick;

  let startup = { ...state.startup };
  let liveness = { ...state.liveness };
  let readiness = { ...state.readiness };
  let startupCompleted = state.startupCompleted;
  let phase: ContainerPhase = state.phase === 'Pending' ? 'StartingUp' : state.phase;
  let ready = state.ready;
  let endpointsIncluded = state.endpointsIncluded;
  let restartCount = state.restartCount;
  const events: string[] = [];

  // Startup probe
  if (params.startup.enabled && !startupCompleted) {
    if (nextTick <= params.startup.initialDelaySeconds) {
      events.push('startup probe: waiting for initialDelaySeconds');
    } else {
      const ok = appReady;
      if (ok) {
        startup = {
          consecutiveSuccesses: startup.consecutiveSuccesses + 1,
          consecutiveFailures: 0,
          lastOutcome: 'success',
        };
        if (startup.consecutiveSuccesses >= params.startup.successThreshold) {
          startupCompleted = true;
          events.push('startup probe succeeded — liveness/readiness now run');
        } else {
          events.push('startup probe: success');
        }
      } else {
        startup = {
          consecutiveFailures: startup.consecutiveFailures + 1,
          consecutiveSuccesses: 0,
          lastOutcome: 'failure',
        };
        events.push(`startup probe failed (${startup.consecutiveFailures}/${params.startup.failureThreshold})`);
        if (startup.consecutiveFailures >= params.startup.failureThreshold) {
          restartCount += 1;
          events.push('startup probe exceeded failureThreshold — container killed and restarted');
          return resetForRestart(state, nextTick, events, restartCount);
        }
      }
    }
  } else {
    // No startup probe; mark effective-start on first tick past 0.
    if (nextTick >= 1) startupCompleted = true;
  }

  // Liveness and readiness only run after startup is effective.
  if (effectivelyStarted || startupCompleted) {
    if (params.liveness.enabled && nextTick > params.liveness.initialDelaySeconds) {
      const ok = appAlive;
      if (ok) {
        liveness = {
          consecutiveSuccesses: liveness.consecutiveSuccesses + 1,
          consecutiveFailures: 0,
          lastOutcome: 'success',
        };
      } else {
        liveness = {
          consecutiveFailures: liveness.consecutiveFailures + 1,
          consecutiveSuccesses: 0,
          lastOutcome: 'failure',
        };
        events.push(`liveness failed (${liveness.consecutiveFailures}/${params.liveness.failureThreshold})`);
        if (liveness.consecutiveFailures >= params.liveness.failureThreshold) {
          restartCount += 1;
          events.push('liveness exceeded failureThreshold — container killed and restarted');
          return resetForRestart(state, nextTick, events, restartCount);
        }
      }
    }
    if (params.readiness.enabled && nextTick > params.readiness.initialDelaySeconds) {
      const ok = appAlive && appReady;
      if (ok) {
        readiness = {
          consecutiveSuccesses: readiness.consecutiveSuccesses + 1,
          consecutiveFailures: 0,
          lastOutcome: 'success',
        };
        if (readiness.consecutiveSuccesses >= params.readiness.successThreshold) {
          if (!ready) {
            ready = true;
            endpointsIncluded = true;
            events.push('readiness succeeded — Pod added to Service endpoints');
          }
        }
      } else {
        readiness = {
          consecutiveFailures: readiness.consecutiveFailures + 1,
          consecutiveSuccesses: 0,
          lastOutcome: 'failure',
        };
        if (readiness.consecutiveFailures >= params.readiness.failureThreshold) {
          if (ready) {
            ready = false;
            endpointsIncluded = false;
            events.push('readiness failing — Pod removed from Service endpoints (container keeps running)');
          }
        }
      }
    } else if (!params.readiness.enabled) {
      // No readiness probe: Pod becomes ready as soon as it is running.
      if (!ready && startupCompleted) {
        ready = true;
        endpointsIncluded = true;
      }
    }
    if (phase === 'StartingUp' && startupCompleted) phase = 'Running';
  }

  const header = events.length === 0 ? 'steady' : events.join('; ');
  return {
    ...state,
    tick: nextTick,
    phase,
    ready,
    endpointsIncluded,
    restartCount,
    startup,
    liveness,
    readiness,
    startupCompleted,
    log: [...state.log, `t=${nextTick}: ${header}`],
  };
}

function resetForRestart(state: PodHealthState, nextTick: number, events: string[], restartCount: number): PodHealthState {
  const header = events.join('; ');
  return {
    ...state,
    tick: nextTick,
    phase: restartCount >= 3 ? 'CrashLoopBackOff' : 'Restarting',
    ready: false,
    endpointsIncluded: false,
    restartCount,
    startup: newProbeState(),
    liveness: newProbeState(),
    readiness: newProbeState(),
    startupCompleted: false,
    log: [...state.log, `t=${nextTick}: ${header}`],
  };
}

export const podHealthSimulation: SimulationDefinition<PodHealthState> = {
  id: 'pod-health-probe-simulator',
  title: 'Pod Health & Probe Simulator',
  description:
    'Configure startup, liveness, and readiness probes, then watch the kubelet drive a container through startup, ready, and failure. Shows what each probe gates: liveness restarts the container, readiness toggles Service endpoint membership, startup suppresses the other two until the app finishes booting.',
  parameters: [
    { key: 'appStartupTicks', label: 'App takes this many ticks to become ready', type: 'select', default: 5, options: [
      { label: '2 ticks (fast)', value: 2 }, { label: '5 ticks', value: 5 }, { label: '8 ticks (slow)', value: 8 }, { label: '12 ticks (very slow)', value: 12 },
    ], description: 'How long the application needs before it starts serving traffic correctly.' },
    { key: 'appFailsAtTick', label: 'App fails at tick (0 = never)', type: 'select', default: 0, options: [
      { label: 'never fails', value: 0 }, { label: 'tick 6', value: 6 }, { label: 'tick 10', value: 10 }, { label: 'tick 14', value: 14 },
    ], description: 'Simulates the app crashing or becoming unresponsive after a while.' },
    { key: 'startupEnabled', label: 'Startup probe enabled', type: 'boolean', default: true, description: 'Suppresses liveness/readiness until the app has started.' },
    { key: 'startupFailureThreshold', label: 'Startup failureThreshold', type: 'select', default: 15, options: [
      { label: '3', value: 3 }, { label: '6', value: 6 }, { label: '15', value: 15 }, { label: '30', value: 30 },
    ], description: 'How many consecutive failures the startup probe tolerates.' },
    { key: 'livenessEnabled', label: 'Liveness probe enabled', type: 'boolean', default: true, description: 'When failed, kubelet kills and restarts the container.' },
    { key: 'livenessFailureThreshold', label: 'Liveness failureThreshold', type: 'select', default: 3, options: [
      { label: '1', value: 1 }, { label: '3', value: 3 }, { label: '5', value: 5 },
    ], description: 'Consecutive failures before restart.' },
    { key: 'readinessEnabled', label: 'Readiness probe enabled', type: 'boolean', default: true, description: 'When failed, Pod is removed from Service endpoints but kept running.' },
    { key: 'ticks', label: 'Ticks to simulate', type: 'select', default: 12, options: [
      { label: '8', value: 8 }, { label: '12', value: 12 }, { label: '20', value: 20 },
    ], description: 'Total simulation duration.' },
  ],
  createInitialState: () => ({
    tick: 0,
    phase: 'Pending',
    ready: false,
    restartCount: 0,
    endpointsIncluded: false,
    log: ['t=0: Pod created; kubelet pulled image and started container.'],
    startup: newProbeState(),
    liveness: newProbeState(),
    readiness: newProbeState(),
    startupCompleted: false,
  }),
  steps: (params) => {
    const ticks = Number(params.ticks);
    const config = {
      appStartupTicks: Number(params.appStartupTicks),
      appFailsAtTick: Number(params.appFailsAtTick),
      startup: {
        ...DEFAULT_PROBE,
        enabled: Boolean(params.startupEnabled),
        failureThreshold: Number(params.startupFailureThreshold),
      },
      liveness: {
        ...DEFAULT_PROBE,
        enabled: Boolean(params.livenessEnabled),
        initialDelaySeconds: 0,
        failureThreshold: Number(params.livenessFailureThreshold),
      },
      readiness: {
        ...DEFAULT_PROBE,
        enabled: Boolean(params.readinessEnabled),
        initialDelaySeconds: 0,
        failureThreshold: 2,
      },
    };
    return Array.from({ length: ticks }, (_, i) => ({
      id: `tick-${i + 1}`,
      label: `t=${i + 1}`,
      description: `One kubelet probe cycle — runs every enabled probe and reacts to the thresholds.`,
      apply: (s: PodHealthState) => stepPodHealth(s, config),
    }));
  },
};

// ---------------------------------------------------------------------------
// Lab 2: Scheduling Constraints Simulator
// ---------------------------------------------------------------------------
// Four worker nodes with configurable labels/taints; a Pod with
// nodeSelector, affinity, tolerations and topology spread. Runs the real
// two-phase model: filter (unsatisfied requirements → excluded) then
// score (free capacity + affinity preference + spread penalty).

export interface SchedNode {
  id: string;
  cpu: number;
  memoryGb: number;
  cpuAllocated: number;
  memoryAllocated: number;
  zone: string;
  gpu: boolean;
  taint?: { key: string; effect: 'NoSchedule' | 'NoExecute' | 'PreferNoSchedule' };
  existingPods: number; // pods matching the pod's own labelSelector (for pod anti-affinity)
}

export interface SchedEvaluation {
  nodeId: string;
  filteredOut: boolean;
  reasons: string[];
  score: number;
}

export interface SchedPodSpec {
  cpu: number;
  memoryGb: number;
  requireGpu: boolean;
  tolerateDedicatedTaint: boolean;
  preferZone: string | 'any';
  spreadConstraint: boolean;
}

export interface SchedulingState {
  pod: SchedPodSpec;
  nodes: SchedNode[];
  evaluations: SchedEvaluation[];
  chosenNodeId: string | null;
  unschedulable: boolean;
  phase: 'initial' | 'filtering' | 'scoring' | 'bound';
}

const SCHEDULING_NODES: SchedNode[] = [
  { id: 'node-a', cpu: 4, memoryGb: 8, cpuAllocated: 1, memoryAllocated: 2, zone: 'zone-1', gpu: false, existingPods: 0 },
  { id: 'node-b', cpu: 4, memoryGb: 8, cpuAllocated: 2, memoryAllocated: 3, zone: 'zone-1', gpu: false, existingPods: 1 },
  { id: 'node-c', cpu: 8, memoryGb: 16, cpuAllocated: 1, memoryAllocated: 2, zone: 'zone-2', gpu: true, existingPods: 0, taint: { key: 'dedicated=gpu', effect: 'NoSchedule' } },
  { id: 'node-d', cpu: 4, memoryGb: 8, cpuAllocated: 3, memoryAllocated: 6, zone: 'zone-2', gpu: false, existingPods: 0 },
];

function evaluateSchedulingNode(node: SchedNode, pod: SchedPodSpec, allNodes: SchedNode[]): SchedEvaluation {
  const reasons: string[] = [];
  const cpuFree = node.cpu - node.cpuAllocated;
  const memFree = node.memoryGb - node.memoryAllocated;
  if (cpuFree < pod.cpu) reasons.push(`insufficient CPU (${cpuFree.toFixed(2)} free, needs ${pod.cpu})`);
  if (memFree < pod.memoryGb) reasons.push(`insufficient memory (${memFree.toFixed(1)} GiB free, needs ${pod.memoryGb})`);
  if (pod.requireGpu && !node.gpu) reasons.push('nodeSelector gpu=true not matched');
  if (node.taint && node.taint.effect === 'NoSchedule' && !pod.tolerateDedicatedTaint) {
    reasons.push(`taint ${node.taint.key}:${node.taint.effect} not tolerated`);
  }

  if (reasons.length > 0) return { nodeId: node.id, filteredOut: true, reasons, score: 0 };

  // Score components
  const utilAfter = ((node.cpuAllocated + pod.cpu) / node.cpu + (node.memoryAllocated + pod.memoryGb) / node.memoryGb) / 2;
  let score = Math.round((1 - utilAfter) * 60); // 0-60 from least-allocated
  if (pod.preferZone !== 'any' && node.zone === pod.preferZone) score += 20;
  if (pod.spreadConstraint) {
    const zonePods = allNodes.filter((n) => n.zone === node.zone).reduce((acc, n) => acc + n.existingPods, 0);
    score += Math.max(0, 20 - zonePods * 10);
  }
  return { nodeId: node.id, filteredOut: false, reasons: [], score };
}

export function runScheduling(pod: SchedPodSpec, nodes: SchedNode[] = SCHEDULING_NODES): { evaluations: SchedEvaluation[]; chosenNodeId: string | null } {
  const evaluations = nodes.map((n) => evaluateSchedulingNode(n, pod, nodes));
  const feasible = evaluations.filter((e) => !e.filteredOut);
  if (feasible.length === 0) return { evaluations, chosenNodeId: null };
  const winner = feasible.reduce((best, e) => (e.score > best.score ? e : best), feasible[0]!);
  return { evaluations, chosenNodeId: winner.nodeId };
}

export const schedulingConstraintsSimulation: SimulationDefinition<SchedulingState> = {
  id: 'scheduling-constraints-simulator',
  title: 'Scheduling Constraints Simulator',
  description:
    'Submit a Pod with nodeSelector, tolerations, zone preference and topology spread against four worker nodes. The scheduler filters (drops nodes that fail a requirement) and scores (ranks by free capacity plus preference bonuses) exactly as kube-scheduler does.',
  parameters: [
    { key: 'cpu', label: 'Pod CPU request (cores)', type: 'select', default: 1, options: [
      { label: '0.5', value: 0.5 }, { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '4', value: 4 },
    ], description: 'CPU the Pod requests.' },
    { key: 'memoryGb', label: 'Pod memory request (GiB)', type: 'select', default: 2, options: [
      { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '4', value: 4 }, { label: '8', value: 8 },
    ], description: 'Memory the Pod requests.' },
    { key: 'requireGpu', label: 'nodeSelector: gpu=true', type: 'boolean', default: false, description: 'Only schedule on GPU nodes.' },
    { key: 'tolerateGpuTaint', label: 'Toleration for dedicated=gpu:NoSchedule', type: 'boolean', default: false, description: 'Allow scheduling onto a node tainted dedicated=gpu.' },
    { key: 'preferZone', label: 'Preferred zone (soft)', type: 'select', default: 'any', options: [
      { label: 'any', value: 'any' }, { label: 'zone-1', value: 'zone-1' }, { label: 'zone-2', value: 'zone-2' },
    ], description: 'Adds a scoring bonus for the given zone.' },
    { key: 'spreadConstraint', label: 'Topology spread across zones', type: 'boolean', default: false, description: 'Penalizes zones that already have more Pods of this workload.' },
  ],
  createInitialState: (params) => ({
    pod: {
      cpu: Number(params.cpu),
      memoryGb: Number(params.memoryGb),
      requireGpu: Boolean(params.requireGpu),
      tolerateDedicatedTaint: Boolean(params.tolerateGpuTaint),
      preferZone: String(params.preferZone) as 'zone-1' | 'zone-2' | 'any',
      spreadConstraint: Boolean(params.spreadConstraint),
    },
    nodes: SCHEDULING_NODES.map((n) => ({ ...n })),
    evaluations: [],
    chosenNodeId: null,
    unschedulable: false,
    phase: 'initial',
  }),
  steps: () => [
    {
      id: 'filter',
      label: 'Filter nodes',
      description: 'Drop every node that fails a hard requirement (resources, nodeSelector, untolerated taint).',
      apply: (s) => {
        const evaluations = s.nodes.map((n) => evaluateSchedulingNode(n, s.pod, s.nodes));
        return { ...s, evaluations, phase: 'filtering' };
      },
    },
    {
      id: 'score',
      label: 'Score feasible nodes',
      description: 'Rank survivors by free capacity, zone preference bonus, and spread penalty.',
      apply: (s) => ({ ...s, phase: 'scoring' }),
    },
    {
      id: 'bind',
      label: 'Bind to the highest-scoring node',
      description: 'The scheduler writes nodeName onto the Pod. If every node was filtered out, the Pod stays Pending.',
      apply: (s) => {
        const feasible = s.evaluations.filter((e) => !e.filteredOut);
        if (feasible.length === 0) return { ...s, unschedulable: true, phase: 'bound' };
        const winner = feasible.reduce((best, e) => (e.score > best.score ? e : best), feasible[0]!);
        return { ...s, chosenNodeId: winner.nodeId, phase: 'bound' };
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Lab 3: Resource Management Simulator
// ---------------------------------------------------------------------------

export type QosClass = 'Guaranteed' | 'Burstable' | 'BestEffort';

export interface ResourceContainer {
  cpuRequest: number; // cores
  cpuLimit: number; // 0 = no limit
  memoryRequestMi: number;
  memoryLimitMi: number; // 0 = no limit
}

export interface ResourceState {
  tick: number;
  container: ResourceContainer;
  qos: QosClass;
  cpuAssigned: number;
  memoryUsedMi: number;
  cpuDemand: number;
  memoryDemandMi: number;
  throttlingPct: number;
  oomKilled: boolean;
  restartCount: number;
  events: string[];
}

export function deriveQos(c: ResourceContainer): QosClass {
  const noRequestsOrLimits =
    c.cpuRequest === 0 && c.memoryRequestMi === 0 && c.cpuLimit === 0 && c.memoryLimitMi === 0;
  if (noRequestsOrLimits) return 'BestEffort';
  if (c.cpuLimit > 0 && c.memoryLimitMi > 0 && c.cpuRequest === c.cpuLimit && c.memoryRequestMi === c.memoryLimitMi) {
    return 'Guaranteed';
  }
  return 'Burstable';
}

export const resourceManagementSimulation: SimulationDefinition<ResourceState> = {
  id: 'resource-management-simulator',
  title: 'Resource Management Simulator',
  description:
    'Set CPU and memory requests and limits on a container, then run a workload that first pushes CPU above its limit (throttling) and then pushes memory above its limit (OOMKilled). Shows how QoS class falls out of the values, not from a separate field.',
  parameters: [
    { key: 'cpuRequest', label: 'CPU request (cores)', type: 'select', default: 0.5, options: [
      { label: 'none', value: 0 }, { label: '0.25', value: 0.25 }, { label: '0.5', value: 0.5 }, { label: '1', value: 1 },
    ], description: 'Guaranteed CPU floor; also used by the scheduler.' },
    { key: 'cpuLimit', label: 'CPU limit (cores)', type: 'select', default: 1, options: [
      { label: 'none', value: 0 }, { label: '0.5', value: 0.5 }, { label: '1', value: 1 }, { label: '2', value: 2 },
    ], description: 'Hard ceiling enforced by CFS quota; over-limit causes throttling.' },
    { key: 'memoryRequestMi', label: 'Memory request (MiB)', type: 'select', default: 256, options: [
      { label: 'none', value: 0 }, { label: '128', value: 128 }, { label: '256', value: 256 }, { label: '512', value: 512 },
    ], description: 'Guaranteed memory floor.' },
    { key: 'memoryLimitMi', label: 'Memory limit (MiB)', type: 'select', default: 512, options: [
      { label: 'none', value: 0 }, { label: '256', value: 256 }, { label: '512', value: 512 }, { label: '1024', value: 1024 },
    ], description: 'Hard ceiling enforced by cgroup; over-limit causes OOMKill.' },
    { key: 'workload', label: 'Workload profile', type: 'select', default: 'cpu-then-memory', options: [
      { label: 'steady-state', value: 'steady' },
      { label: 'CPU spike only', value: 'cpu-spike' },
      { label: 'memory spike only', value: 'memory-spike' },
      { label: 'CPU spike then memory spike', value: 'cpu-then-memory' },
    ], description: 'Deterministic sequence of CPU/memory demand across ticks.' },
  ],
  createInitialState: (params) => {
    const container: ResourceContainer = {
      cpuRequest: Number(params.cpuRequest),
      cpuLimit: Number(params.cpuLimit),
      memoryRequestMi: Number(params.memoryRequestMi),
      memoryLimitMi: Number(params.memoryLimitMi),
    };
    return {
      tick: 0,
      container,
      qos: deriveQos(container),
      cpuAssigned: 0,
      memoryUsedMi: 0,
      cpuDemand: 0,
      memoryDemandMi: 0,
      throttlingPct: 0,
      oomKilled: false,
      restartCount: 0,
      events: [`QoS class: ${deriveQos(container)} (derived from requests/limits)`],
    };
  },
  steps: (params) => {
    const workload = String(params.workload);
    const demandCurve: { cpu: number; mem: number }[] = (() => {
      if (workload === 'steady') {
        return Array.from({ length: 6 }, () => ({ cpu: 0.3, mem: 200 }));
      }
      if (workload === 'cpu-spike') {
        return [
          { cpu: 0.3, mem: 200 }, { cpu: 0.6, mem: 200 }, { cpu: 1.5, mem: 220 }, { cpu: 1.8, mem: 220 }, { cpu: 0.5, mem: 200 }, { cpu: 0.3, mem: 200 },
        ];
      }
      if (workload === 'memory-spike') {
        return [
          { cpu: 0.3, mem: 200 }, { cpu: 0.3, mem: 300 }, { cpu: 0.3, mem: 500 }, { cpu: 0.3, mem: 800 }, { cpu: 0.3, mem: 600 }, { cpu: 0.3, mem: 300 },
        ];
      }
      return [
        { cpu: 0.3, mem: 200 }, { cpu: 1.6, mem: 240 }, { cpu: 1.8, mem: 260 }, { cpu: 0.4, mem: 600 }, { cpu: 0.4, mem: 900 }, { cpu: 0.4, mem: 250 },
      ];
    })();

    return demandCurve.map((demand, i) => ({
      id: `tick-${i + 1}`,
      label: `t=${i + 1}`,
      description: `Container experiences CPU demand ${demand.cpu} cores, memory demand ${demand.mem} MiB.`,
      apply: (s: ResourceState): ResourceState => {
        if (s.oomKilled) return { ...s, tick: s.tick + 1, events: [...s.events, `t=${s.tick + 1}: container not yet restarted after OOMKill.`] };
        const c = s.container;
        const events: string[] = [];
        // CPU
        const cap = c.cpuLimit === 0 ? demand.cpu : Math.min(c.cpuLimit, demand.cpu);
        const throttlingPct = c.cpuLimit > 0 && demand.cpu > c.cpuLimit
          ? Math.round(((demand.cpu - c.cpuLimit) / demand.cpu) * 100)
          : 0;
        if (throttlingPct > 0) events.push(`CPU throttled ${throttlingPct}% (demand ${demand.cpu}, limit ${c.cpuLimit})`);
        // Memory
        let memUsed = demand.mem;
        let oom = false;
        let restarts = s.restartCount;
        if (c.memoryLimitMi > 0 && demand.mem > c.memoryLimitMi) {
          events.push(`memory demand ${demand.mem} MiB exceeded limit ${c.memoryLimitMi} MiB — OOMKilled`);
          oom = true;
          restarts += 1;
          memUsed = 0;
        }
        const header = events.length === 0 ? 'within limits' : events.join('; ');
        return {
          ...s,
          tick: s.tick + 1,
          cpuDemand: demand.cpu,
          cpuAssigned: cap,
          memoryDemandMi: demand.mem,
          memoryUsedMi: memUsed,
          throttlingPct,
          oomKilled: oom,
          restartCount: restarts,
          events: [...s.events, `t=${s.tick + 1}: ${header}`],
        };
      },
    }));
  },
};

// ---------------------------------------------------------------------------
// Lab 4: HPA Scaling Simulator
// ---------------------------------------------------------------------------

export interface HpaState {
  tick: number;
  currentReplicas: number;
  targetUtilization: number;
  currentUtilization: number;
  desiredReplicas: number;
  lastScaleTick: number;
  log: string[];
}

export function hpaDesiredReplicas(current: number, currentUtil: number, targetUtil: number): number {
  if (targetUtil <= 0) return current;
  return Math.ceil(current * (currentUtil / targetUtil));
}

export const hpaScalingSimulation: SimulationDefinition<HpaState> = {
  id: 'hpa-scaling-simulator',
  title: 'HPA Scaling Simulator',
  description:
    'Runs the Horizontal Pod Autoscaler algorithm: every reconcile tick, read metrics, compute desiredReplicas = ceil(currentReplicas * currentUtil / targetUtil), clamp to [min,max], and apply stabilization windows that delay scale-down. All deterministic.',
  parameters: [
    { key: 'minReplicas', label: 'minReplicas', type: 'select', default: 2, options: [
      { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 },
    ], description: 'Floor; HPA never scales below this.' },
    { key: 'maxReplicas', label: 'maxReplicas', type: 'select', default: 10, options: [
      { label: '5', value: 5 }, { label: '10', value: 10 }, { label: '20', value: 20 },
    ], description: 'Ceiling; HPA never scales above this.' },
    { key: 'targetUtil', label: 'Target CPU utilization (%)', type: 'select', default: 50, options: [
      { label: '30', value: 30 }, { label: '50', value: 50 }, { label: '70', value: 70 }, { label: '80', value: 80 },
    ], description: 'The per-Pod CPU utilization the HPA tries to maintain.' },
    { key: 'scenario', label: 'Workload scenario', type: 'select', default: 'spike-and-settle', options: [
      { label: 'constant', value: 'constant' },
      { label: 'ramp up', value: 'ramp-up' },
      { label: 'spike and settle', value: 'spike-and-settle' },
      { label: 'oscillating load', value: 'oscillating' },
    ], description: 'Deterministic load profile.' },
    { key: 'stabilizationDownTicks', label: 'Scale-down stabilization (ticks)', type: 'select', default: 3, options: [
      { label: '0', value: 0 }, { label: '3', value: 3 }, { label: '5', value: 5 },
    ], description: 'Delay before scaling down (prevents thrash).' },
  ],
  createInitialState: (params) => ({
    tick: 0,
    currentReplicas: Number(params.minReplicas),
    targetUtilization: Number(params.targetUtil),
    currentUtilization: Number(params.targetUtil),
    desiredReplicas: Number(params.minReplicas),
    lastScaleTick: 0,
    log: [`t=0: Starting at ${Number(params.minReplicas)} replicas, targetUtil=${Number(params.targetUtil)}%`],
  }),
  steps: (params) => {
    const min = Number(params.minReplicas);
    const max = Number(params.maxReplicas);
    const scenario = String(params.scenario);
    const stabilizeDown = Number(params.stabilizationDownTicks);
    const utilCurve: number[] = (() => {
      if (scenario === 'constant') return [50, 50, 50, 50, 50, 50, 50, 50];
      if (scenario === 'ramp-up') return [30, 45, 65, 85, 95, 95, 90, 70];
      if (scenario === 'spike-and-settle') return [40, 95, 95, 85, 55, 35, 30, 30];
      return [40, 70, 40, 70, 40, 70, 40, 70];
    })();
    return utilCurve.map((util, i) => ({
      id: `tick-${i + 1}`,
      label: `t=${i + 1}`,
      description: `HPA reconcile: currentUtil=${util}%, compute desiredReplicas, apply stabilization and clamp.`,
      apply: (s: HpaState): HpaState => {
        const desired = Math.max(min, Math.min(max, hpaDesiredReplicas(s.currentReplicas, util, s.targetUtilization)));
        let apply = desired;
        const events: string[] = [`currentUtil=${util}%, desiredReplicas=ceil(${s.currentReplicas}*${util}/${s.targetUtilization})=${desired}`];
        if (desired < s.currentReplicas) {
          if (s.tick + 1 - s.lastScaleTick < stabilizeDown) {
            apply = s.currentReplicas;
            events.push(`scale-down blocked by stabilization window (needs ${stabilizeDown} ticks since last change)`);
          } else {
            events.push(`scaling down from ${s.currentReplicas} to ${desired}`);
          }
        } else if (desired > s.currentReplicas) {
          events.push(`scaling up from ${s.currentReplicas} to ${desired}`);
        }
        const changed = apply !== s.currentReplicas;
        return {
          ...s,
          tick: s.tick + 1,
          currentUtilization: util,
          desiredReplicas: desired,
          currentReplicas: apply,
          lastScaleTick: changed ? s.tick + 1 : s.lastScaleTick,
          log: [...s.log, `t=${s.tick + 1}: ${events.join('; ')}`],
        };
      },
    }));
  },
};

// ---------------------------------------------------------------------------
// Lab 5: Deployment Rollout Simulator
// ---------------------------------------------------------------------------

export type RolloutStrategy = 'rolling' | 'blue-green' | 'canary';
export type RolloutPhase = 'stable' | 'rolling-out' | 'paused' | 'rolled-back' | 'complete';

export interface ReplicaSetState {
  version: 'v1' | 'v2';
  desired: number;
  ready: number;
}

export interface RolloutState {
  tick: number;
  strategy: RolloutStrategy;
  totalReplicas: number;
  maxSurge: number;
  maxUnavailable: number;
  oldRs: ReplicaSetState;
  newRs: ReplicaSetState;
  phase: RolloutPhase;
  v2FailsReadiness: boolean;
  log: string[];
}

function applyRollingStep(s: RolloutState): RolloutState {
  if (s.phase === 'rolled-back' || s.phase === 'complete') return s;
  const totalDesired = s.oldRs.desired + s.newRs.desired;
  const events: string[] = [];
  const next = { ...s };

  // If a v2 Pod fails readiness, the rollout pauses when maxUnavailable is exhausted.
  if (s.v2FailsReadiness) {
    if (s.newRs.desired > 0 && s.newRs.ready < s.newRs.desired) {
      events.push('new ReplicaSet Pod never becomes Ready — rollout stalls at maxUnavailable budget');
      return { ...s, tick: s.tick + 1, phase: 'paused', log: [...s.log, `t=${s.tick + 1}: ${events.join('; ')}`] };
    }
  }

  // Surge: add new RS replicas while we're below total + maxSurge and some old still exist.
  if (next.newRs.desired < s.totalReplicas) {
    const cap = s.totalReplicas + s.maxSurge;
    if (totalDesired < cap) {
      next.newRs = { ...next.newRs, desired: next.newRs.desired + 1 };
      events.push(`surge: created a new v2 Pod (new ReplicaSet desired=${next.newRs.desired})`);
    }
  }
  // Ready: any pending new Pods become ready (unless simulated failure)
  if (next.newRs.ready < next.newRs.desired && !s.v2FailsReadiness) {
    next.newRs = { ...next.newRs, ready: next.newRs.ready + 1 };
    events.push('new Pod passed readiness');
  }

  // Scale down old RS when the overall ready count exceeds (totalReplicas - maxUnavailable).
  const projectedReady = next.oldRs.ready + next.newRs.ready;
  if (next.oldRs.desired > 0 && projectedReady - 1 >= s.totalReplicas - s.maxUnavailable) {
    next.oldRs = {
      ...next.oldRs,
      desired: next.oldRs.desired - 1,
      ready: Math.max(0, next.oldRs.ready - 1),
    };
    events.push(`scale-down: removed an old v1 Pod (old ReplicaSet desired=${next.oldRs.desired})`);
  }

  const done = next.newRs.ready === s.totalReplicas && next.oldRs.desired === 0;
  if (done) next.phase = 'complete';
  if (events.length === 0) events.push('no change this tick');
  const nextTick = s.tick + 1;
  return { ...next, tick: nextTick, log: [...s.log, `t=${nextTick}: ${events.join('; ')}`] };
}

export const deploymentRolloutSimulation: SimulationDefinition<RolloutState> = {
  id: 'deployment-rollout-simulator',
  title: 'Deployment Rollout Simulator',
  description:
    'Runs the real Deployment controller algorithm. Each tick, the controller may surge a new-ReplicaSet Pod, wait for readiness, then scale down the old ReplicaSet — never breaching maxSurge or maxUnavailable. Strategies compare Rolling vs Blue-Green vs Canary with the same failure scenarios.',
  parameters: [
    { key: 'strategy', label: 'Strategy', type: 'select', default: 'rolling', options: [
      { label: 'Rolling Update', value: 'rolling' },
      { label: 'Blue-Green', value: 'blue-green' },
      { label: 'Canary (10% → 100%)', value: 'canary' },
    ], description: 'Which rollout mechanism to simulate.' },
    { key: 'totalReplicas', label: 'Total replicas', type: 'select', default: 5, options: [
      { label: '3', value: 3 }, { label: '5', value: 5 }, { label: '10', value: 10 },
    ], description: 'Desired replicas for the application.' },
    { key: 'maxSurge', label: 'maxSurge', type: 'select', default: 1, options: [
      { label: '0', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 },
    ], description: 'Extra Pods allowed above desired during rollout (rolling only).' },
    { key: 'maxUnavailable', label: 'maxUnavailable', type: 'select', default: 1, options: [
      { label: '0', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 },
    ], description: 'Pods allowed below desired during rollout (rolling only).' },
    { key: 'v2FailsReadiness', label: 'Simulate v2 failing readiness', type: 'boolean', default: false, description: 'New Pods never become ready — the rollout stalls.' },
  ],
  createInitialState: (params) => {
    const total = Number(params.totalReplicas);
    return {
      tick: 0,
      strategy: String(params.strategy) as RolloutStrategy,
      totalReplicas: total,
      maxSurge: Number(params.maxSurge),
      maxUnavailable: Number(params.maxUnavailable),
      oldRs: { version: 'v1', desired: total, ready: total },
      newRs: { version: 'v2', desired: 0, ready: 0 },
      phase: 'stable',
      v2FailsReadiness: Boolean(params.v2FailsReadiness),
      log: [`t=0: Deployment stable at ${total} replicas of v1. Begin rollout to v2.`],
    };
  },
  steps: (params) => {
    const strategy = String(params.strategy) as RolloutStrategy;
    const total = Number(params.totalReplicas);
    const v2Fails = Boolean(params.v2FailsReadiness);
    if (strategy === 'rolling') {
      // enough ticks for even a slow rollout to complete
      return Array.from({ length: total * 2 + 2 }, (_, i) => ({
        id: `tick-${i + 1}`,
        label: `t=${i + 1}`,
        description: 'One Deployment-controller reconcile: surge/ready/scale-down bounded by maxSurge and maxUnavailable.',
        apply: (s: RolloutState) => applyRollingStep({ ...s, phase: s.phase === 'stable' ? 'rolling-out' : s.phase }),
      }));
    }
    if (strategy === 'blue-green') {
      return [
        {
          id: 'spin-up-green',
          label: 'Create green (v2) stack',
          description: 'Stand up a complete v2 ReplicaSet beside v1. Traffic still goes to v1.',
          apply: (s: RolloutState): RolloutState => ({
            ...s,
            tick: s.tick + 1,
            newRs: { ...s.newRs, desired: s.totalReplicas, ready: v2Fails ? 0 : s.totalReplicas },
            phase: v2Fails ? 'paused' : 'rolling-out',
            log: [...s.log, v2Fails ? `t=${s.tick + 1}: green brought up but Pods never became Ready — do not cut over.` : `t=${s.tick + 1}: green stack is up (v2 Ready=${s.totalReplicas}), traffic still on blue.`],
          }),
        },
        {
          id: 'cutover',
          label: 'Switch traffic (Service selector flip)',
          description: 'Point the Service at the green ReplicaSet in one step.',
          apply: (s: RolloutState): RolloutState => {
            if (s.phase === 'paused') return { ...s, log: [...s.log, `t=${s.tick + 1}: cannot cut over — green never became Ready.`] };
            return {
              ...s,
              tick: s.tick + 1,
              oldRs: { ...s.oldRs, desired: 0, ready: 0 },
              phase: 'complete',
              log: [...s.log, `t=${s.tick + 1}: Service selector updated — 100% of traffic now on v2.`],
            };
          },
        },
      ];
    }
    // canary
    const canaryReplicas = Math.max(1, Math.round(total * 0.1));
    return [
      {
        id: 'canary-deploy',
        label: 'Deploy canary (10% of replicas)',
        description: 'A small v2 ReplicaSet runs alongside the full v1; Service load-balances across both.',
        apply: (s): RolloutState => ({
          ...s,
          tick: s.tick + 1,
          newRs: { ...s.newRs, desired: canaryReplicas, ready: v2Fails ? 0 : canaryReplicas },
          phase: v2Fails ? 'paused' : 'rolling-out',
          log: [...s.log, v2Fails
            ? `t=${s.tick + 1}: canary deployed but did not become Ready — abort.`
            : `t=${s.tick + 1}: ${canaryReplicas} v2 replica(s) alongside ${s.totalReplicas} v1 — ~10% traffic on v2.`],
        }),
      },
      {
        id: 'canary-promote',
        label: v2Fails ? 'Abort canary' : 'Promote canary to 100%',
        description: v2Fails ? 'Canary never became Ready — delete the canary ReplicaSet.' : 'Scale v2 up to full and v1 down to zero.',
        apply: (s): RolloutState => {
          if (s.phase === 'paused') {
            return {
              ...s,
              tick: s.tick + 1,
              newRs: { ...s.newRs, desired: 0, ready: 0 },
              phase: 'rolled-back',
              log: [...s.log, `t=${s.tick + 1}: canary aborted — all traffic stays on v1.`],
            };
          }
          return {
            ...s,
            tick: s.tick + 1,
            oldRs: { ...s.oldRs, desired: 0, ready: 0 },
            newRs: { ...s.newRs, desired: s.totalReplicas, ready: s.totalReplicas },
            phase: 'complete',
            log: [...s.log, `t=${s.tick + 1}: canary succeeded — scaled v2 to ${s.totalReplicas} and removed v1.`],
          };
        },
      },
    ];
  },
};
