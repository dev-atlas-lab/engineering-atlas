import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A deterministic model of how active health checks decide whether a backend
// receives traffic. A probe runs every interval; a backend is removed from
// rotation after `unhealthyThreshold` consecutive failures and returned after
// `healthyThreshold` consecutive successes. The backend's underlying health
// over time comes from a fixed scenario. Timings are illustrative; real probe
// timeouts, jitter, and per-provider defaults are not modelled.

export type Scenario = 'fails-then-recovers' | 'flapping' | 'always-healthy';
export type BackendState = 'healthy' | 'unhealthy';

export interface HealthConfig {
  scenario: Scenario;
  interval: number; // seconds between probes
  unhealthyThreshold: number;
  healthyThreshold: number;
}

export interface Probe {
  n: number;
  timeSeconds: number;
  actualUp: boolean;
  result: 'pass' | 'fail';
  consecFail: number;
  consecSuccess: number;
  state: BackendState;
  inRotation: boolean;
  transition: 'removed' | 'restored' | null;
  note: string;
}

export interface HealthState {
  config: HealthConfig;
  probes: Probe[];
  current: { state: BackendState; inRotation: boolean } | null;
}

const PROBE_COUNT = 12;

// Underlying up/down of the backend at each probe (index 0..11).
const TIMELINES: Record<Scenario, boolean[]> = {
  'fails-then-recovers': [true, true, true, false, false, false, false, false, false, true, true, true],
  flapping: [true, true, false, true, false, false, true, true, false, true, true, true],
  'always-healthy': Array.from({ length: PROBE_COUNT }, () => true),
};

export function simulateHealth(config: HealthConfig): Probe[] {
  const timeline = TIMELINES[config.scenario];
  const probes: Probe[] = [];
  let state: BackendState = 'healthy';
  let inRotation = true;
  let consecFail = 0;
  let consecSuccess = 0;

  for (let n = 0; n < PROBE_COUNT; n++) {
    const actualUp = timeline[n]!;
    let transition: Probe['transition'] = null;
    let note: string;

    if (actualUp) {
      consecSuccess += 1;
      consecFail = 0;
      if (state === 'unhealthy' && consecSuccess >= config.healthyThreshold) {
        state = 'healthy';
        inRotation = true;
        transition = 'restored';
        note = `${config.healthyThreshold} consecutive successes reached — the backend is marked healthy and returned to rotation. Recovery took about ${config.healthyThreshold * config.interval}s after it actually came back.`;
      } else if (state === 'unhealthy') {
        note = `Probe passed (${consecSuccess}/${config.healthyThreshold} successes needed). Still out of rotation until the healthy threshold is met — this avoids flapping a recovering backend back in too soon.`;
      } else {
        note = 'Probe passed. The backend stays healthy and in rotation.';
      }
    } else {
      consecFail += 1;
      consecSuccess = 0;
      if (state === 'healthy' && consecFail >= config.unhealthyThreshold) {
        state = 'unhealthy';
        inRotation = false;
        transition = 'removed';
        note = `${config.unhealthyThreshold} consecutive failures reached — the backend is removed from rotation and existing connections drain. Detection took about ${config.unhealthyThreshold * config.interval}s after it actually failed.`;
      } else if (state === 'healthy') {
        note = `Probe failed (${consecFail}/${config.unhealthyThreshold} failures needed). Still in rotation — a single failed probe does not remove a backend, which tolerates a transient blip.`;
      } else {
        note = 'Probe failed. The backend remains out of rotation.';
      }
    }

    probes.push({ n: n + 1, timeSeconds: n * config.interval, actualUp, result: actualUp ? 'pass' : 'fail', consecFail, consecSuccess, state, inRotation, transition, note });
  }
  return probes;
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readHealthConfig(params: SimulationParams): HealthConfig {
  return {
    scenario: pick(params.scenario, ['fails-then-recovers', 'flapping', 'always-healthy'] as const, 'fails-then-recovers'),
    interval: Math.min(Math.max(Number(params.interval) || 5, 1), 30),
    unhealthyThreshold: Math.min(Math.max(Number(params.unhealthyThreshold) || 3, 1), 5),
    healthyThreshold: Math.min(Math.max(Number(params.healthyThreshold) || 2, 1), 5),
  };
}

export const healthCheckSimulation: SimulationDefinition<HealthState> = {
  id: 'health-check',
  title: 'Health Checks and Backend Availability',
  description:
    'Runs active health probes against one backend and applies unhealthy/healthy thresholds to decide when it leaves and rejoins rotation. Timings are illustrative; real probe timeouts and provider defaults are not modelled.',
  parameters: [
    {
      key: 'scenario',
      label: 'Backend behaviour',
      type: 'select',
      default: 'fails-then-recovers',
      options: [
        { label: 'Fails, then recovers', value: 'fails-then-recovers' },
        { label: 'Flapping (brief blips)', value: 'flapping' },
        { label: 'Always healthy', value: 'always-healthy' },
      ],
      description: 'How the backend’s real health changes over time.',
    },
    { key: 'interval', label: 'Probe interval (seconds)', type: 'number', default: 5, min: 1, max: 30, description: 'Time between probes.' },
    { key: 'unhealthyThreshold', label: 'Unhealthy threshold', type: 'number', default: 3, min: 1, max: 5, description: 'Consecutive failures before removal from rotation.' },
    { key: 'healthyThreshold', label: 'Healthy threshold', type: 'number', default: 2, min: 1, max: 5, description: 'Consecutive successes before return to rotation.' },
  ],
  createInitialState: (params) => ({ config: readHealthConfig(params), probes: [], current: null }),
  steps: (params) => {
    const config = readHealthConfig(params);
    const probes = simulateHealth(config);
    return probes.map((probe, i) => ({
      id: `probe-${i + 1}`,
      label: `Probe ${probe.n} at t=${probe.timeSeconds}s — ${probe.result}`,
      description: probe.note,
      apply: (state: HealthState): HealthState => ({
        ...state,
        probes: [...state.probes, probe],
        current: { state: probe.state, inRotation: probe.inRotation },
      }),
    }));
  },
};
