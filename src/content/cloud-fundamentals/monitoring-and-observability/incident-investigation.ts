import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A deterministic, guided cross-signal incident investigation. It walks the
// standard flow — alert (symptom) -> metrics (localise the kind of problem) ->
// logs (find the request and service) -> trace (pinpoint the span) -> root
// cause — so the learner practises correlating the three signals. Fixed,
// illustrative data; it does not reproduce a real monitoring backend.

export type Stage = 'alert' | 'metrics' | 'logs' | 'trace' | 'rca';
export type Cause = 'bad-deploy' | 'under-provisioned' | 'dependency-failing' | 'network';

export interface StageContent {
  stage: Stage;
  signal: 'Alert' | 'Metrics' | 'Logs' | 'Traces' | 'Conclusion';
  title: string;
  findings: string[];
  hypothesis: string;
  // A tiny error-rate series for the metrics stage sparkline (%).
  spark?: number[];
}

const STAGES: StageContent[] = [
  {
    stage: 'alert',
    signal: 'Alert',
    title: 'An alert fires',
    findings: [
      'Alert: "checkout error-rate SLO breach" — error rate above 5% for 3 periods.',
      'Severity: high. Routed to the on-call via the action group / SNS topic.',
    ],
    hypothesis: 'Hypothesis: users are failing checkout. We know the symptom, not the cause. Start with the golden signals.',
  },
  {
    stage: 'metrics',
    signal: 'Metrics',
    title: 'Metrics localise the kind of problem',
    findings: [
      'Error rate: spiked from ~0.3% to ~20%.',
      'Latency (p95): up moderately (timeouts/retries).',
      'Throughput: flat — load did not change.',
      'Saturation: ~42% — nothing is near capacity.',
    ],
    hypothesis: 'Errors spiked while throughput and saturation stayed flat, so this is not a traffic or capacity problem. Errors leading latency points at a downstream dependency. Go to the logs to find a failing request.',
    spark: [0.3, 0.2, 0.3, 0.2, 0.3, 14, 20, 21, 19, 20],
  },
  {
    stage: 'logs',
    signal: 'Logs',
    title: 'Logs find the request and the service',
    findings: [
      'Filter level = ERROR in the window → correlation ID req-7f3a recurs.',
      'Pivot on req-7f3a: frontend → orders → payment → (bank-api).',
      'payment ERROR: "timeout calling bank-api after 5000ms"; frontend returned 502.',
    ],
    hypothesis: 'The correlation ID reassembled one failed request. The first error is in payment, calling bank-api. Open its trace to confirm where the time and the failure are.',
  },
  {
    stage: 'trace',
    signal: 'Traces',
    title: 'The trace pinpoints the span',
    findings: [
      'Trace for req-7f3a: bank-api "authorize" is the earliest error span.',
      'payment, orders, and frontend errors are propagation from it.',
      'The bank-api span also holds most of the latency before failing.',
    ],
    hypothesis: 'Metrics, logs, and the trace agree: the payments provider (bank-api) is timing out. The breaking service is downstream of us.',
  },
  {
    stage: 'rca',
    signal: 'Conclusion',
    title: 'Root cause and mitigation',
    findings: [
      'Root cause: the external bank-api (payments provider) is failing/timing out.',
      'Not a bad deploy (no deploy marker, nothing changed in our code), not capacity (saturation low), not a client network issue (our services reached each other fine).',
      'Mitigate: shed or queue payments, add a circuit breaker and a user-facing fallback, and escalate to the provider. A rollback or scaling would not help.',
    ],
    hypothesis: 'The three signals, correlated, turned "checkout is failing" into "our payments provider is down — degrade gracefully and escalate." That is the value of observability.',
  },
];

const causeNote: Record<Cause, string> = {
  'bad-deploy': 'a bad deploy (a code regression)',
  'under-provisioned': 'under-provisioned capacity',
  'dependency-failing': 'a failing downstream dependency (the payments provider)',
  network: 'a client-to-service network problem',
};

const TRUE_CAUSE: Cause = 'dependency-failing';

export interface IncidentState {
  diagnosis: Cause;
  step: number;
  stage: Stage;
  content: StageContent | null;
  seen: Stage[];
  revealedCause: Cause | null;
  diagnosisCorrect: boolean | null;
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readIncidentConfig(params: SimulationParams): { diagnosis: Cause } {
  return { diagnosis: pick(params.diagnosis, ['bad-deploy', 'under-provisioned', 'dependency-failing', 'network'] as const, 'dependency-failing') };
}

export { STAGES, causeNote, TRUE_CAUSE };

export const incidentInvestigationSimulation: SimulationDefinition<IncidentState> = {
  id: 'incident-investigation',
  title: 'End-to-End Incident Investigation',
  description:
    'A guided cross-signal investigation: alert → metrics → logs → traces → root cause, correlating the three observability signals to explain one incident. Fixed, illustrative data; it does not reproduce a real monitoring backend.',
  parameters: [
    {
      key: 'diagnosis',
      label: 'Your root-cause conclusion',
      type: 'select',
      default: 'dependency-failing',
      options: [
        { label: 'A bad deploy (code regression)', value: 'bad-deploy' },
        { label: 'Under-provisioned capacity', value: 'under-provisioned' },
        { label: 'A failing downstream dependency', value: 'dependency-failing' },
        { label: 'A client-to-service network problem', value: 'network' },
      ],
      description: 'What you conclude after correlating the signals. Checked at the end.',
    },
  ],
  createInitialState: (params) => ({ diagnosis: readIncidentConfig(params).diagnosis, step: -1, stage: 'alert', content: null, seen: [], revealedCause: null, diagnosisCorrect: null }),
  steps: (params) => {
    const { diagnosis } = readIncidentConfig(params);
    return STAGES.map((content, i) => {
      const isLast = i === STAGES.length - 1;
      return {
        id: `stage-${content.stage}`,
        label: `${content.signal}: ${content.title}`,
        description: content.hypothesis,
        apply: (state: IncidentState): IncidentState => ({
          ...state,
          step: i,
          stage: content.stage,
          content,
          seen: [...state.seen, content.stage],
          revealedCause: isLast ? TRUE_CAUSE : null,
          diagnosisCorrect: isLast ? diagnosis === TRUE_CAUSE : null,
        }),
      };
    });
  },
};
