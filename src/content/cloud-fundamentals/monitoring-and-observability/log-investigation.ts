import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A deterministic model of investigating a failed request through structured
// logs: narrow by time, filter to errors, then pivot on a correlation ID to
// reassemble one request across services and find the root error. The log
// data is fixed and illustrative; this is not a real log store.

export type Level = 'INFO' | 'WARN' | 'ERROR';
export type Service = 'frontend' | 'orders' | 'payment' | 'bank-api' | 'catalog';

export interface LogEntry {
  t: number; // seconds into the window
  service: Service;
  level: Level;
  correlationId: string;
  message: string;
  status?: number;
}

export const TARGET_CORRELATION = 'req-7f3a';
export const ROOT_SERVICE: Service = 'payment';

// Interleaved logs from several concurrent requests in the incident window.
export const LOGS: LogEntry[] = [
  { t: 0, service: 'frontend', level: 'INFO', correlationId: 'req-1a2b', message: 'GET /catalog 200', status: 200 },
  { t: 1, service: 'catalog', level: 'INFO', correlationId: 'req-1a2b', message: 'listed 42 products' },
  { t: 2, service: 'frontend', level: 'INFO', correlationId: TARGET_CORRELATION, message: 'POST /checkout received' },
  { t: 2, service: 'orders', level: 'INFO', correlationId: TARGET_CORRELATION, message: 'creating order 90412' },
  { t: 3, service: 'frontend', level: 'INFO', correlationId: 'req-5c6d', message: 'GET /account 200', status: 200 },
  { t: 3, service: 'orders', level: 'WARN', correlationId: TARGET_CORRELATION, message: 'payment attempt 1 slow (>2s)' },
  { t: 4, service: 'payment', level: 'INFO', correlationId: TARGET_CORRELATION, message: 'charging card via bank-api' },
  { t: 5, service: 'catalog', level: 'INFO', correlationId: 'req-9e8f', message: 'GET /search 200', status: 200 },
  { t: 7, service: 'payment', level: 'ERROR', correlationId: TARGET_CORRELATION, message: 'timeout calling bank-api after 5000ms' },
  { t: 7, service: 'orders', level: 'ERROR', correlationId: TARGET_CORRELATION, message: 'order 90412 failed: payment error' },
  { t: 8, service: 'frontend', level: 'ERROR', correlationId: TARGET_CORRELATION, message: 'returned 502 to client', status: 502 },
  { t: 9, service: 'frontend', level: 'INFO', correlationId: 'req-3d4e', message: 'GET /catalog 200', status: 200 },
];

export type Filter = 'all' | 'errors' | 'correlation' | 'root';

export interface LogState {
  diagnosis: Service;
  filter: Filter;
  visible: LogEntry[];
  highlightCorrelation: string | null;
  highlightRoot: boolean;
  note: string;
  resolved: boolean;
  diagnosisCorrect: boolean | null;
}

function applyFilter(filter: Filter): { visible: LogEntry[]; highlightCorrelation: string | null; highlightRoot: boolean; note: string; resolved: boolean } {
  switch (filter) {
    case 'all':
      return { visible: LOGS, highlightCorrelation: null, highlightRoot: false, note: 'The full incident window: logs from several concurrent requests, interleaved. Too noisy to read directly — narrow it down.', resolved: false };
    case 'errors':
      return {
        visible: LOGS.filter((l) => l.level === 'ERROR'),
        highlightCorrelation: TARGET_CORRELATION,
        highlightRoot: false,
        note: `Filtered to level = ERROR. Three error lines share the correlation ID ${TARGET_CORRELATION}: a payment timeout, a failed order, and a 502 returned to the client. The correlation ID ties them to one request.`,
        resolved: false,
      };
    case 'correlation':
      return {
        visible: LOGS.filter((l) => l.correlationId === TARGET_CORRELATION),
        highlightCorrelation: TARGET_CORRELATION,
        highlightRoot: false,
        note: `Pivoted to correlationId = ${TARGET_CORRELATION}. Now you see the whole request across services in order: frontend received the checkout, orders created it, payment charged the card, then payment timed out on bank-api — and the failure propagated back as a 502.`,
        resolved: false,
      };
    case 'root':
      return {
        visible: LOGS.filter((l) => l.correlationId === TARGET_CORRELATION),
        highlightCorrelation: TARGET_CORRELATION,
        highlightRoot: true,
        note: `The earliest error in the chain is payment timing out calling bank-api. The orders failure and the 502 are downstream symptoms. Structured fields (level, service, correlationId) are what let you reassemble one request from interleaved logs and find the first failure.`,
        resolved: true,
      };
  }
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readLogConfig(params: SimulationParams): { diagnosis: Service } {
  return { diagnosis: pick(params.diagnosis, ['frontend', 'orders', 'payment', 'bank-api', 'catalog'] as const, 'payment') };
}

const FILTER_ORDER: Filter[] = ['all', 'errors', 'correlation', 'root'];

export const logInvestigationSimulation: SimulationDefinition<LogState> = {
  id: 'log-investigation',
  title: 'Find a Failed Request in Structured Logs',
  description:
    'Investigates a failed checkout through structured logs: narrow by time, filter to errors, pivot on a correlation ID, and find the first failure. The log data is fixed and illustrative; it is not a real log store.',
  parameters: [
    {
      key: 'diagnosis',
      label: 'Which service is the root cause?',
      type: 'select',
      default: 'payment',
      options: [
        { label: 'frontend', value: 'frontend' },
        { label: 'orders', value: 'orders' },
        { label: 'payment', value: 'payment' },
        { label: 'bank-api (external dependency)', value: 'bank-api' },
        { label: 'catalog', value: 'catalog' },
      ],
      description: 'Your conclusion about where the failure originates. Checked at the end.',
    },
  ],
  createInitialState: (params) => {
    const { diagnosis } = readLogConfig(params);
    const f = applyFilter('all');
    return { diagnosis, filter: 'all', ...f, diagnosisCorrect: null };
  },
  steps: (params) => {
    const { diagnosis } = readLogConfig(params);
    return FILTER_ORDER.map((filter, i) => {
      const isLast = i === FILTER_ORDER.length - 1;
      return {
        id: `filter-${filter}`,
        label:
          filter === 'all'
            ? 'Start: the whole incident window'
            : filter === 'errors'
              ? 'Filter: level = ERROR'
              : filter === 'correlation'
                ? `Pivot: correlationId = ${TARGET_CORRELATION}`
                : 'Find the first failure',
        description: applyFilter(filter).note,
        apply: (state: LogState): LogState => {
          const f = applyFilter(filter);
          return { ...state, filter, ...f, diagnosisCorrect: isLast ? diagnosis === ROOT_SERVICE : null };
        },
      };
    });
  },
};
