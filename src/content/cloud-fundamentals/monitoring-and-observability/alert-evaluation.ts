import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A deterministic model of how an alert rule evaluates a metric over time:
// a static or dynamic threshold, an evaluation window (consecutive breaching
// periods to fire), and the lifecycle OK -> pending -> firing -> resolved. It
// shows alert fatigue (a twitchy rule firing on a transient blip) and why a
// dynamic threshold catches gradual drift a high static threshold misses.
// Illustrative values; not a real alerting backend.

export type ThresholdType = 'static' | 'dynamic';
export type Scenario = 'real-incident' | 'transient-blip' | 'gradual-drift';
export type AlertState = 'insufficient-data' | 'ok' | 'pending' | 'firing' | 'resolved';

export interface AlertConfig {
  scenario: Scenario;
  thresholdType: ThresholdType;
  threshold: number; // static threshold (ms)
  evaluationPeriods: number; // consecutive breaching periods to fire
}

// Latency p95 (ms) per tick for each scenario.
const SERIES: Record<Scenario, number[]> = {
  'real-incident': [120, 118, 122, 119, 121, 120, 480, 520, 510, 500, 150, 124],
  'transient-blip': [120, 118, 480, 119, 121, 120, 122, 119, 121, 120, 122, 119],
  'gradual-drift': [120, 135, 165, 205, 255, 300, 335, 355, 365, 360, 352, 348],
};

const BASELINE_TICKS = 5;

export interface Evaluation {
  tick: number;
  value: number;
  upper: number; // the effective upper bound this tick (static value or dynamic band)
  breaching: boolean;
  consecutive: number;
  state: AlertState;
  transition: 'fired' | 'resolved' | null;
  note: string;
}

export interface AlertRuntimeState {
  config: AlertConfig;
  evaluations: Evaluation[];
  state: AlertState;
  fired: boolean;
}

function dynamicUpper(series: number[]): number {
  const base = series.slice(0, BASELINE_TICKS);
  const mean = base.reduce((s, v) => s + v, 0) / base.length;
  const variance = base.reduce((s, v) => s + (v - mean) ** 2, 0) / base.length;
  const stdev = Math.sqrt(variance);
  // Medium sensitivity: ~3 standard deviations above the learned baseline, with a floor.
  return Math.round(mean + Math.max(stdev * 3, 25));
}

export function evaluateAlerts(config: AlertConfig): Evaluation[] {
  const series = SERIES[config.scenario];
  const upper = config.thresholdType === 'dynamic' ? dynamicUpper(series) : config.threshold;
  const out: Evaluation[] = [];
  let consecutive = 0;
  let state: AlertState = 'insufficient-data';

  series.forEach((value, tick) => {
    const breaching = value > upper;
    let transition: Evaluation['transition'] = null;
    let note: string;

    if (tick === 0) {
      state = 'insufficient-data';
      note = 'The rule has just started — not enough data yet to decide a state (the CloudWatch INSUFFICIENT_DATA / Azure not-enough-data case).';
      out.push({ tick, value, upper, breaching, consecutive: 0, state, transition, note });
      return;
    }

    if (breaching) {
      consecutive += 1;
      if (consecutive >= config.evaluationPeriods && state !== 'firing') {
        state = 'firing';
        transition = 'fired';
        note = `Breaching for ${consecutive} consecutive periods (needs ${config.evaluationPeriods}) — the alert fires and is routed to the on-call via its action group / notification target, tagged with its severity.`;
      } else if (state === 'firing') {
        note = `Still breaching (${config.thresholdType === 'dynamic' ? `above the dynamic band of ~${upper} ms` : `above ${upper} ms`}). The alert stays active; no duplicate notification is sent.`;
      } else {
        state = 'pending';
        note = `Breaching (${consecutive}/${config.evaluationPeriods} periods). Not yet firing — the evaluation window exists so one noisy sample does not page anyone.`;
      }
    } else {
      consecutive = 0;
      if (state === 'firing') {
        state = 'resolved';
        transition = 'resolved';
        note = 'Back within the threshold — the alert resolves and an all-clear is sent. A well-behaved alert auto-resolves rather than needing a human to clear it.';
      } else if (state === 'resolved' || state === 'ok') {
        state = 'ok';
        note = `Within the threshold (${config.thresholdType === 'dynamic' ? `the dynamic band, ~${upper} ms` : `${upper} ms`}). No alert.`;
      } else {
        state = 'ok';
        note = `Within the threshold. No alert.`;
      }
    }
    out.push({ tick, value, upper, breaching, consecutive, state, transition, note });
  });

  return out;
}

export function everFired(evals: Evaluation[]): boolean {
  return evals.some((e) => e.transition === 'fired');
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readAlertConfig(params: SimulationParams): AlertConfig {
  return {
    scenario: pick(params.scenario, ['real-incident', 'transient-blip', 'gradual-drift'] as const, 'real-incident'),
    thresholdType: pick(params.thresholdType, ['static', 'dynamic'] as const, 'static'),
    threshold: Math.min(Math.max(Number(params.threshold) || 300, 100), 600),
    evaluationPeriods: Math.min(Math.max(Number(params.evaluationPeriods) || 3, 1), 5),
  };
}

export const alertEvaluationSimulation: SimulationDefinition<AlertRuntimeState> = {
  id: 'alert-evaluation',
  title: 'Alert Lifecycle',
  description:
    'Evaluates an alert rule against a latency metric over time: a static or dynamic threshold, an evaluation window, and the OK → pending → firing → resolved lifecycle. Shows alert fatigue and dynamic thresholds. Illustrative values; not a real alerting backend.',
  parameters: [
    {
      key: 'scenario',
      label: 'Metric scenario',
      type: 'select',
      default: 'real-incident',
      options: [
        { label: 'Real incident (sustained high latency)', value: 'real-incident' },
        { label: 'Transient blip (one bad sample)', value: 'transient-blip' },
        { label: 'Gradual drift (slow climb)', value: 'gradual-drift' },
      ],
      description: 'How the latency metric behaves over time.',
    },
    {
      key: 'thresholdType',
      label: 'Threshold type',
      type: 'select',
      default: 'static',
      options: [
        { label: 'Static (fixed value)', value: 'static' },
        { label: 'Dynamic (learned band)', value: 'dynamic' },
      ],
      description: 'A fixed number, or a band learned from the baseline.',
    },
    { key: 'threshold', label: 'Static threshold (ms)', type: 'number', default: 300, min: 100, max: 600, description: 'The fixed latency threshold (static only).' },
    { key: 'evaluationPeriods', label: 'Consecutive periods to fire', type: 'number', default: 3, min: 1, max: 5, description: 'How many breaching periods in a row before the alert fires.' },
  ],
  createInitialState: (params) => ({ config: readAlertConfig(params), evaluations: [], state: 'insufficient-data', fired: false }),
  steps: (params) => {
    const config = readAlertConfig(params);
    const evals = evaluateAlerts(config);
    return evals.map((e) => ({
      id: `eval-${e.tick}`,
      label: `t=${e.tick}: ${e.value} ms — ${e.state}`,
      description: e.note,
      apply: (state: AlertRuntimeState): AlertRuntimeState => ({
        ...state,
        evaluations: [...state.evaluations, e],
        state: e.state,
        fired: state.fired || e.transition === 'fired',
      }),
    }));
  },
};
