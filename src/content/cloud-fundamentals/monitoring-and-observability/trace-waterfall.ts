import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A deterministic model of a distributed trace: spans with parent-child
// relationships, start times, durations, and status, rendered as a waterfall.
// The learner reveals spans top-down and diagnoses the bottleneck or failure.
// Fixed, illustrative traces; this is not a real tracing backend.

export type Scenario = 'slow-dependency' | 'failed-span' | 'fan-out';
export type SpanStatus = 'ok' | 'error';

export interface Span {
  id: string;
  service: string;
  name: string;
  start: number; // ms from trace start
  duration: number; // ms
  parentId: string | null;
  status: SpanStatus;
}

interface TraceDef {
  label: string;
  spans: Span[];
  total: number;
  cause: string; // the service at fault
  explanation: string;
}

const TRACES: Record<Scenario, TraceDef> = {
  'slow-dependency': {
    label: 'One slow dependency dominates the latency',
    total: 920,
    cause: 'bank-api',
    spans: [
      { id: 's0', service: 'frontend', name: 'POST /checkout', start: 0, duration: 920, parentId: null, status: 'ok' },
      { id: 's1', service: 'orders', name: 'createOrder', start: 30, duration: 860, parentId: 's0', status: 'ok' },
      { id: 's2', service: 'payment', name: 'charge', start: 70, duration: 780, parentId: 's1', status: 'ok' },
      { id: 's3', service: 'bank-api', name: 'authorize', start: 110, duration: 700, parentId: 's2', status: 'ok' },
      { id: 's4', service: 'inventory', name: 'reserve', start: 60, duration: 40, parentId: 's1', status: 'ok' },
    ],
    explanation:
      'The whole request took 920 ms, and bank-api’s authorize span alone is 700 ms of it — on the critical path (frontend → orders → payment → bank-api). Every parent span is slow only because it is waiting on this one call. The fix is the external dependency, not our code; metrics alone could not have told you which hop was slow.',
  },
  'failed-span': {
    label: 'A downstream span fails and the error propagates',
    total: 300,
    cause: 'bank-api',
    spans: [
      { id: 's0', service: 'frontend', name: 'POST /checkout', start: 0, duration: 300, parentId: null, status: 'error' },
      { id: 's1', service: 'orders', name: 'createOrder', start: 20, duration: 260, parentId: 's0', status: 'error' },
      { id: 's2', service: 'payment', name: 'charge', start: 40, duration: 220, parentId: 's1', status: 'error' },
      { id: 's3', service: 'bank-api', name: 'authorize', start: 60, duration: 180, parentId: 's2', status: 'error' },
      { id: 's4', service: 'inventory', name: 'reserve', start: 30, duration: 30, parentId: 's1', status: 'ok' },
    ],
    explanation:
      'Four spans are marked as errors, but the trace shows the order: bank-api failed first (the deepest error span), and payment, orders, and frontend each failed because their downstream call failed. The earliest error in the tree is the root cause; the rest are propagation. Inventory succeeded, so it is not involved.',
  },
  'fan-out': {
    label: 'Parallel calls — one slow branch sets the critical path',
    total: 520,
    cause: 'inventory',
    spans: [
      { id: 's0', service: 'frontend', name: 'GET /product', start: 0, duration: 520, parentId: null, status: 'ok' },
      { id: 's1', service: 'orders', name: 'assemble', start: 20, duration: 480, parentId: 's0', status: 'ok' },
      { id: 's2', service: 'payment', name: 'quote', start: 40, duration: 120, parentId: 's1', status: 'ok' },
      { id: 's3', service: 'inventory', name: 'availability', start: 40, duration: 450, parentId: 's1', status: 'ok' },
      { id: 's4', service: 'catalog', name: 'details', start: 40, duration: 90, parentId: 's1', status: 'ok' },
    ],
    explanation:
      'orders fans out to three services in parallel. Two return quickly, but inventory takes 450 ms and sets the critical path — the request cannot finish until the slowest branch does. Averaging the children would hide this; the waterfall makes the long pole obvious.',
  },
};

export function depthOf(span: Span, byId: Map<string, Span>): number {
  let d = 0;
  let cur = span.parentId;
  while (cur) {
    d += 1;
    cur = byId.get(cur)?.parentId ?? null;
  }
  return d;
}

/** The critical path: from the root, repeatedly follow the child that finishes
 *  latest (start+duration). These spans determine the total duration. */
export function criticalPath(spans: Span[]): Set<string> {
  const byParent = new Map<string | null, Span[]>();
  for (const s of spans) {
    const list = byParent.get(s.parentId) ?? [];
    list.push(s);
    byParent.set(s.parentId, list);
  }
  const path = new Set<string>();
  let current = (byParent.get(null) ?? [])[0];
  while (current) {
    path.add(current.id);
    const children = byParent.get(current.id) ?? [];
    current = children.sort((a, b) => b.start + b.duration - (a.start + a.duration))[0];
  }
  return path;
}

export interface TraceState {
  scenario: Scenario;
  diagnosis: string;
  total: number;
  revealed: number; // number of spans revealed
  spans: Span[];
  critical: string[];
  note: string;
  revealedCause: string | null;
  diagnosisCorrect: boolean | null;
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const SERVICES = ['frontend', 'orders', 'payment', 'bank-api', 'inventory', 'catalog'] as const;

export function readTraceConfig(params: SimulationParams): { scenario: Scenario; diagnosis: string } {
  return {
    scenario: pick(params.scenario, ['slow-dependency', 'failed-span', 'fan-out'] as const, 'slow-dependency'),
    diagnosis: pick(params.diagnosis, SERVICES, 'bank-api'),
  };
}

// Reveal order: by start time, then by depth, so parents appear before children.
function revealOrder(def: TraceDef): Span[] {
  const byId = new Map(def.spans.map((s) => [s.id, s]));
  return [...def.spans].sort((a, b) => a.start - b.start || depthOf(a, byId) - depthOf(b, byId));
}

export const traceWaterfallSimulation: SimulationDefinition<TraceState> = {
  id: 'trace-waterfall',
  title: 'Distributed Trace Waterfall',
  description:
    'Reveals the spans of a distributed trace as a waterfall — parent and child spans with start times, durations, and status — so you can read the critical path and diagnose the bottleneck or failure. Fixed, illustrative traces; not a real tracing backend.',
  parameters: [
    {
      key: 'scenario',
      label: 'Trace scenario',
      type: 'select',
      default: 'slow-dependency',
      options: [
        { label: 'One slow dependency', value: 'slow-dependency' },
        { label: 'A failed downstream span', value: 'failed-span' },
        { label: 'Parallel fan-out, one slow branch', value: 'fan-out' },
      ],
      description: 'Which trace to investigate.',
    },
    {
      key: 'diagnosis',
      label: 'Which service is at fault?',
      type: 'select',
      default: 'bank-api',
      options: SERVICES.map((s) => ({ label: s, value: s })),
      description: 'The service you blame for the slow or failed request. Checked at the end.',
    },
  ],
  createInitialState: (params) => {
    const { scenario, diagnosis } = readTraceConfig(params);
    const def = TRACES[scenario];
    return {
      scenario,
      diagnosis,
      total: def.total,
      revealed: 0,
      spans: [],
      critical: [...criticalPath(def.spans)],
      note: 'Step forward to reveal the trace span by span, from the root down.',
      revealedCause: null,
      diagnosisCorrect: null,
    };
  },
  steps: (params) => {
    const { scenario, diagnosis } = readTraceConfig(params);
    const def = TRACES[scenario];
    const ordered = revealOrder(def);
    return ordered.map((span, i) => {
      const isLast = i === ordered.length - 1;
      return {
        id: `span-${span.id}`,
        label: `${span.service} · ${span.name} (${span.duration} ms)${span.status === 'error' ? ' · error' : ''}`,
        description: isLast
          ? def.explanation
          : `${span.service} ${span.name}: ${span.duration} ms${span.status === 'error' ? ', error' : ''}. ${span.parentId ? 'A child span — its time is part of its parent’s.' : 'The root span — its duration is the whole request.'}`,
        apply: (state: TraceState): TraceState => {
          const spans = ordered.slice(0, i + 1);
          return {
            ...state,
            revealed: i + 1,
            spans,
            note: isLast ? def.explanation : `Revealed ${span.service} · ${span.name}.`,
            revealedCause: isLast ? def.cause : null,
            diagnosisCorrect: isLast ? diagnosis === def.cause : null,
          };
        },
      };
    });
  },
};

export { TRACES, SERVICES };
