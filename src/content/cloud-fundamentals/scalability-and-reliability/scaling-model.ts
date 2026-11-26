import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A deterministic model of a horizontal auto-scaling feedback loop over a
// fixed timeline of load. Each tick observes a metric on the capacity that is
// already serving, a policy decides a desired capacity, and new instances take
// one tick to warm up before they relieve load — which is where scaling lag
// comes from. Simplified: whole-instance capacity, one metric, a 1-tick
// warm-up, a fixed cooldown; no real provider policy maths or billing.

export type Policy = 'target-tracking' | 'step' | 'scheduled';
export type LoadScenario = 'spike' | 'gradual' | 'diurnal';

export const PER_INSTANCE = 20; // demand units one instance serves at 100% metric
const COOLDOWN = 3; // after acting, a step policy holds for the next couple of ticks

const LOADS: Record<LoadScenario, number[]> = {
  spike: [20, 20, 80, 80, 80, 80, 40, 20, 20, 20],
  gradual: [20, 30, 40, 50, 60, 70, 80, 80, 70, 50],
  diurnal: [20, 40, 70, 80, 70, 50, 30, 20, 20, 20],
};

// Scheduled capacity anticipates each scenario's known pattern one tick ahead.
const SCHEDULE: Record<LoadScenario, number[]> = {
  spike: [2, 8, 8, 8, 8, 4, 2, 2, 2, 2],
  gradual: [2, 2, 3, 3, 4, 4, 5, 5, 4, 3],
  diurnal: [2, 4, 6, 6, 5, 3, 2, 2, 2, 2],
};

export interface ScalingConfig {
  policy: Policy;
  scenario: LoadScenario;
  min: number;
  max: number;
  target: number; // target metric % (target tracking)
}

export type Action = 'scale-out' | 'scale-in' | 'hold' | 'cooldown' | 'scheduled';

export interface Tick {
  t: number;
  load: number;
  serving: number; // instances serving this tick (already warm)
  metric: number; // observed % on serving capacity
  overloaded: boolean;
  desired: number;
  next: number; // capacity decided for the next tick
  warming: number; // instances added that are still warming up
  action: Action;
  note: string;
}

export interface ScalingState {
  config: ScalingConfig;
  ticks: Tick[];
  current: Tick | null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function rawMetric(load: number, serving: number): number {
  return Math.round((load / (serving * PER_INSTANCE)) * 100);
}

export function simulateScaling(config: ScalingConfig): Tick[] {
  const loads = LOADS[config.scenario];
  const schedule = SCHEDULE[config.scenario];
  const ticks: Tick[] = [];
  let serving = clamp(2, config.min, config.max);
  let cooldown = 0;

  for (let t = 0; t < loads.length; t++) {
    const load = loads[t]!;
    const metric = rawMetric(load, serving);
    const overloaded = metric > 100;
    let desired = serving;
    let action: Action = 'hold';
    let note: string;

    if (config.policy === 'scheduled') {
      desired = clamp(schedule[t]!, config.min, config.max);
      action = desired === serving ? 'hold' : 'scheduled';
      note =
        action === 'scheduled'
          ? `Scheduled scaling sets capacity to ${desired} for this part of the day, regardless of the live metric (${metric}%). It anticipates a known pattern, so there is no reaction lag — but it is blind to unexpected load.`
          : `Scheduled capacity holds at ${serving}. The metric is ${metric}%.`;
    } else if (config.policy === 'target-tracking') {
      desired = clamp(Math.ceil((serving * metric) / config.target), config.min, config.max);
      if (desired > serving) {
        action = 'scale-out';
        note = `Target tracking keeps the metric near ${config.target}%. It is ${metric}% on ${serving} instances, so it scales out to ${desired}. The new instances warm up for a tick before they help — this tick stays ${overloaded ? 'overloaded' : 'high'}.`;
      } else if (desired < serving) {
        action = 'scale-in';
        note = `The metric is ${metric}%, below the ${config.target}% target, so target tracking scales in to ${desired} to save cost. Scale-in is deliberately gentle to avoid thrashing.`;
      } else {
        note = `The metric is ${metric}%, close to the ${config.target}% target. Capacity holds at ${serving}.`;
      }
    } else {
      // step scaling
      if (cooldown > 0) {
        action = 'cooldown';
        note = `A scaling action is still in its cooldown (${cooldown} tick${cooldown > 1 ? 's' : ''} left), so the step policy holds at ${serving} even though the metric is ${metric}%. Cooldowns prevent over-reacting but add sluggishness.`;
      } else if (metric > 80) {
        desired = clamp(serving + 2, config.min, config.max);
        action = 'scale-out';
        cooldown = COOLDOWN;
        note = `Metric ${metric}% is above the 80% step threshold, so the policy adds 2 instances (to ${desired}) and starts a cooldown. Larger breaches add more — that is the "step".`;
      } else if (metric > 60) {
        desired = clamp(serving + 1, config.min, config.max);
        action = 'scale-out';
        cooldown = COOLDOWN;
        note = `Metric ${metric}% is above the 60% step threshold, so the policy adds 1 instance (to ${desired}) and starts a cooldown.`;
      } else if (metric < 30) {
        desired = clamp(serving - 1, config.min, config.max);
        action = desired < serving ? 'scale-in' : 'hold';
        if (action === 'scale-in') cooldown = COOLDOWN;
        note = action === 'scale-in' ? `Metric ${metric}% is below the 30% threshold, so the policy removes 1 instance (to ${desired}).` : `Metric ${metric}% is low, but capacity is already at the minimum (${config.min}).`;
      } else {
        note = `Metric ${metric}% is within the step thresholds (30–60%). Capacity holds at ${serving}.`;
      }
    }

    const warming = Math.max(0, desired - serving);
    ticks.push({ t, load, serving, metric: Math.min(metric, 999), overloaded, desired, next: desired, warming, action, note });
    serving = desired; // the next tick is served by the capacity decided now (1-tick warm-up)
    if (config.policy === 'step' && cooldown > 0) cooldown -= 1;
  }
  return ticks;
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readScalingConfig(params: SimulationParams): ScalingConfig {
  const min = Math.min(Math.max(Number(params.min) || 2, 1), 6);
  const max = Math.min(Math.max(Number(params.max) || 8, min + 1), 12);
  return {
    policy: pick(params.policy, ['target-tracking', 'step', 'scheduled'] as const, 'target-tracking'),
    scenario: pick(params.scenario, ['spike', 'gradual', 'diurnal'] as const, 'spike'),
    min,
    max,
    target: Math.min(Math.max(Number(params.target) || 50, 20), 80),
  };
}

export const autoScalingSimulation: SimulationDefinition<ScalingState> = {
  id: 'auto-scaling',
  title: 'Auto Scaling',
  description:
    'Runs a horizontal auto-scaling loop over a load timeline: observe a metric, apply a policy, change capacity, and wait for new instances to warm up. Deterministic and simplified — whole-instance capacity, one metric, a 1-tick warm-up, and a fixed cooldown.',
  parameters: [
    {
      key: 'policy',
      label: 'Scaling policy',
      type: 'select',
      default: 'target-tracking',
      options: [
        { label: 'Target tracking', value: 'target-tracking' },
        { label: 'Step scaling', value: 'step' },
        { label: 'Scheduled', value: 'scheduled' },
      ],
      description: 'How desired capacity is decided each tick.',
    },
    {
      key: 'scenario',
      label: 'Load pattern',
      type: 'select',
      default: 'spike',
      options: [
        { label: 'Sudden spike', value: 'spike' },
        { label: 'Gradual ramp', value: 'gradual' },
        { label: 'Daily (diurnal) curve', value: 'diurnal' },
      ],
      description: 'The incoming demand over time.',
    },
    { key: 'min', label: 'Minimum capacity', type: 'number', default: 2, min: 1, max: 6, description: 'The fewest instances allowed.' },
    { key: 'max', label: 'Maximum capacity', type: 'number', default: 8, min: 2, max: 12, description: 'The most instances allowed.' },
    { key: 'target', label: 'Target metric % (target tracking)', type: 'number', default: 50, min: 20, max: 80, description: 'The metric value target tracking aims to hold.' },
  ],
  createInitialState: (params) => ({ config: readScalingConfig(params), ticks: [], current: null }),
  steps: (params) => {
    const config = readScalingConfig(params);
    const ticks = simulateScaling(config);
    return ticks.map((tick) => ({
      id: `tick-${tick.t}`,
      label: `t=${tick.t}: load ${tick.load}, ${tick.serving} serving, metric ${Math.min(tick.metric, 100)}%${tick.overloaded ? ' (overloaded)' : ''}`,
      description: tick.note,
      apply: (state: ScalingState): ScalingState => ({ ...state, ticks: [...state.ticks, tick], current: tick }),
    }));
  },
};
