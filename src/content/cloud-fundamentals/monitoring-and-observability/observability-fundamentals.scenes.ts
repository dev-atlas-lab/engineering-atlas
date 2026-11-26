import type { SceneDefinition } from '../../../engines/visualization/types';

export const threeSignalsScene: SceneDefinition = {
  id: 'three-signals',
  type: 'topology',
  title: 'The three signals in an investigation',
  description: 'An application emits metrics, logs, and traces; an engineer uses each for a different job and correlates them by trace ID.',
  nodes: [
    { id: 'app', type: 'server', label: 'Application', position: { x: 0, y: 150 }, data: { Emits: 'Metrics, logs, and traces — the three signals' }, status: 'active' },
    { id: 'metrics', type: 'storage', label: 'Metrics', position: { x: 260, y: 20 }, data: { Job: 'Detect — is something wrong? (cheap, aggregate, fast)', Answers: 'How much / how bad' } },
    { id: 'traces', type: 'storage', label: 'Traces', position: { x: 260, y: 150 }, data: { Job: 'Localise — which service and operation?', Answers: 'Where the time / failure is' } },
    { id: 'logs', type: 'storage', label: 'Logs', position: { x: 260, y: 280 }, data: { Job: 'Explain — what exactly happened?', Answers: 'The detail of one event' } },
    { id: 'engineer', type: 'user', label: 'Engineer', position: { x: 520, y: 150 }, data: { Does: 'Flows metric → trace → log, correlating by trace / correlation ID' } },
  ],
  edges: [
    { id: 'a-m', source: 'app', target: 'metrics', edgeType: 'data', label: 'emit' },
    { id: 'a-t', source: 'app', target: 'traces', edgeType: 'data', label: 'emit' },
    { id: 'a-l', source: 'app', target: 'logs', edgeType: 'data', label: 'emit' },
    { id: 'e-m', source: 'engineer', target: 'metrics', edgeType: 'request' },
    { id: 'e-t', source: 'engineer', target: 'traces', edgeType: 'request' },
    { id: 'e-l', source: 'engineer', target: 'logs', edgeType: 'request' },
    { id: 't-l', source: 'traces', target: 'logs', edgeType: 'dependency', label: 'linked by trace ID' },
  ],
  states: [
    {
      id: 'emit',
      label: 'One application, three signals',
      description:
        'The application emits all three signals. They are not competitors — each answers a different question. Metrics are cheap aggregates for detection, traces show where time and failures are, and logs hold the detail of individual events.',
      edgeOverrides: { 'a-m': { animated: true }, 'a-t': { animated: true }, 'a-l': { animated: true } },
    },
    {
      id: 'detect',
      label: 'Detect with metrics',
      description: 'An alert on a metric (a user-facing symptom) is usually how an incident starts. Metrics tell you something is wrong and roughly how bad — but not where.',
      nodeOverrides: { metrics: { status: 'active' } },
      edgeOverrides: { 'e-m': { animated: true } },
    },
    {
      id: 'localise',
      label: 'Localise with traces',
      description: 'A trace for an affected request shows which service and operation is slow or failing — the critical path and the earliest error span. This narrows a whole-system symptom to one hop.',
      nodeOverrides: { traces: { status: 'active' } },
      edgeOverrides: { 'e-t': { animated: true } },
    },
    {
      id: 'explain',
      label: 'Explain with logs',
      description: 'With the service and request identified, the logs for that trace ID give the detail: the exact error message, parameters, and state. Metric → trace → log turns "checkout is failing" into a precise cause.',
      nodeOverrides: { logs: { status: 'active' } },
      edgeOverrides: { 'e-l': { animated: true }, 't-l': { flow: 'allow' } },
    },
  ],
};
