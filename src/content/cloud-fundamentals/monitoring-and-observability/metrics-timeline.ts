import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A deterministic model of reading correlated metric time series to diagnose an
// incident. Four golden-signal series (throughput, latency p95, error rate,
// saturation) follow a fixed per-scenario shape with an event marker. The
// learner reads the correlation to pick a cause. Illustrative values only; it
// does not reproduce any real monitoring backend.

export type Scenario = 'deploy-regression' | 'traffic-saturation' | 'dependency-failure';
export type Cause = 'bad-deploy' | 'under-provisioned' | 'dependency-failing' | 'network';

export interface Series {
  key: 'throughput' | 'latency' | 'errors' | 'saturation';
  label: string;
  unit: string;
  values: number[];
}

interface ScenarioDef {
  label: string;
  eventTick: number;
  eventLabel: string;
  cause: Cause;
  series: Record<Series['key'], number[]>;
  explanation: string;
}

const TICKS = 12;

// Values are indexed by tick (0..11). The event happens at eventTick.
const SCENARIOS: Record<Scenario, ScenarioDef> = {
  'deploy-regression': {
    label: 'Latency and errors jump after a deploy',
    eventTick: 5,
    eventLabel: 'Deploy v2.4',
    cause: 'bad-deploy',
    series: {
      throughput: [820, 840, 810, 830, 825, 835, 830, 820, 840, 835, 825, 830],
      latency: [120, 118, 122, 119, 121, 120, 410, 520, 540, 505, 530, 515],
      errors: [0.2, 0.1, 0.3, 0.2, 0.2, 0.2, 3.8, 6.2, 6.0, 5.5, 6.4, 5.9],
      saturation: [44, 45, 43, 46, 45, 44, 47, 48, 46, 47, 45, 46],
    },
    explanation:
      'Latency and error rate jump together at the deploy marker, while throughput and saturation are flat. Load did not change and the servers are not saturated, so this is not a capacity problem — the new code is the cause. Roll back or fix forward.',
  },
  'traffic-saturation': {
    label: 'Latency climbs as load saturates the fleet',
    eventTick: 4,
    eventLabel: 'Traffic surge begins',
    cause: 'under-provisioned',
    series: {
      throughput: [500, 560, 640, 720, 900, 1150, 1400, 1600, 1650, 1620, 1580, 1550],
      latency: [110, 115, 120, 128, 150, 240, 430, 680, 720, 700, 690, 675],
      errors: [0.2, 0.2, 0.2, 0.3, 0.4, 0.9, 2.1, 4.5, 5.0, 4.8, 4.6, 4.4],
      saturation: [40, 46, 54, 62, 75, 88, 96, 99, 99, 98, 98, 97],
    },
    explanation:
      'Throughput ramps up, saturation follows it to ~100%, and only then do latency and errors rise. The symptom is driven by load exceeding capacity — the fix is to scale out (or up), not to change the code. This is the USE story: utilisation is saturated.',
  },
  'dependency-failure': {
    label: 'Errors spike from a failing downstream dependency',
    eventTick: 5,
    eventLabel: 'Payments API degrades',
    cause: 'dependency-failing',
    series: {
      throughput: [780, 800, 790, 810, 795, 805, 800, 790, 800, 810, 795, 805],
      latency: [130, 128, 132, 129, 131, 130, 300, 360, 340, 355, 330, 345],
      errors: [0.3, 0.2, 0.3, 0.2, 0.3, 0.3, 14.0, 22.0, 20.0, 21.0, 19.0, 20.0],
      saturation: [42, 43, 41, 44, 43, 42, 43, 42, 44, 43, 42, 43],
    },
    explanation:
      'Error rate spikes sharply while throughput and saturation stay flat; latency rises moderately from timeouts and retries. Our service is healthy and not busy — the errors come from a failing downstream dependency. Logs and traces will show which one.',
  },
};

const seriesMeta: Record<Series['key'], { label: string; unit: string }> = {
  throughput: { label: 'Throughput', unit: 'req/s' },
  latency: { label: 'Latency (p95)', unit: 'ms' },
  errors: { label: 'Error rate', unit: '%' },
  saturation: { label: 'Saturation', unit: '% CPU' },
};

export function buildSeries(scenario: Scenario): Series[] {
  const def = SCENARIOS[scenario];
  return (Object.keys(seriesMeta) as Series['key'][]).map((key) => ({ key, label: seriesMeta[key].label, unit: seriesMeta[key].unit, values: def.series[key] }));
}

export interface MetricsState {
  scenario: Scenario;
  diagnosis: Cause;
  tick: number; // last revealed tick index (-1 before start)
  eventTick: number;
  eventLabel: string;
  series: Series[];
  note: string;
  revealedCause: Cause | null;
  diagnosisCorrect: boolean | null;
}

const diagnosisNote: Record<Cause, string> = {
  'bad-deploy': 'a bad deploy (a code regression)',
  'under-provisioned': 'under-provisioned capacity (needs scaling)',
  'dependency-failing': 'a failing downstream dependency',
  network: 'a network problem between client and service',
};

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readMetricsConfig(params: SimulationParams): { scenario: Scenario; diagnosis: Cause } {
  return {
    scenario: pick(params.scenario, ['deploy-regression', 'traffic-saturation', 'dependency-failure'] as const, 'deploy-regression'),
    diagnosis: pick(params.diagnosis, ['bad-deploy', 'under-provisioned', 'dependency-failing', 'network'] as const, 'bad-deploy'),
  };
}

function tickNote(def: ScenarioDef, tick: number): string {
  if (tick < def.eventTick) return `t=${tick}: steady state — all four signals are nominal.`;
  if (tick === def.eventTick) return `t=${tick}: ${def.eventLabel}. Watch which signals move next, and which stay flat.`;
  return `t=${tick}: the incident is in progress. Compare the signals that moved against the ones that did not.`;
}

export const metricsTimelineSimulation: SimulationDefinition<MetricsState> = {
  id: 'metrics-timeline',
  title: 'Metrics Timeline',
  description:
    'Reveals four correlated golden-signal metrics over time around an incident, so you can read the correlation and pick the cause. Illustrative values; it does not reproduce a real monitoring backend.',
  parameters: [
    {
      key: 'scenario',
      label: 'Incident scenario',
      type: 'select',
      default: 'deploy-regression',
      options: [
        { label: 'Latency and errors jump after a deploy', value: 'deploy-regression' },
        { label: 'Latency climbs as traffic saturates the fleet', value: 'traffic-saturation' },
        { label: 'Errors spike from a failing dependency', value: 'dependency-failure' },
      ],
      description: 'Which incident shape the metrics follow.',
    },
    {
      key: 'diagnosis',
      label: 'Your diagnosis',
      type: 'select',
      default: 'bad-deploy',
      options: [
        { label: 'A bad deploy (code regression)', value: 'bad-deploy' },
        { label: 'Under-provisioned capacity', value: 'under-provisioned' },
        { label: 'A failing downstream dependency', value: 'dependency-failing' },
        { label: 'A client-to-service network problem', value: 'network' },
      ],
      description: 'What you conclude from the correlation. Checked at the end.',
    },
  ],
  createInitialState: (params) => {
    const { scenario, diagnosis } = readMetricsConfig(params);
    const def = SCENARIOS[scenario];
    return { scenario, diagnosis, tick: -1, eventTick: def.eventTick, eventLabel: def.eventLabel, series: buildSeries(scenario), note: 'Step forward to reveal the metrics over time.', revealedCause: null, diagnosisCorrect: null };
  },
  steps: (params) => {
    const { scenario, diagnosis } = readMetricsConfig(params);
    const def = SCENARIOS[scenario];
    return Array.from({ length: TICKS }, (_, t) => {
      const isLast = t === TICKS - 1;
      return {
        id: `t-${t}`,
        label: `t=${t}${t === def.eventTick ? ` · ${def.eventLabel}` : ''}`,
        description: isLast ? def.explanation : tickNote(def, t),
        apply: (state: MetricsState): MetricsState => ({
          ...state,
          tick: t,
          note: isLast ? def.explanation : tickNote(def, t),
          revealedCause: isLast ? def.cause : null,
          diagnosisCorrect: isLast ? diagnosis === def.cause : null,
        }),
      };
    });
  },
};

export { diagnosisNote, SCENARIOS };
