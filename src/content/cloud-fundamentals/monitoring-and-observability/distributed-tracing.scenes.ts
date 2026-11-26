import type { SceneDefinition } from '../../../engines/visualization/types';

export const contextPropagationScene: SceneDefinition = {
  id: 'trace-context-propagation',
  type: 'sequence',
  title: 'Trace context propagating across services',
  description: 'One trace ID flows across services in a header; each service creates a child span, and the backend reassembles them into one trace.',
  nodes: [
    { id: 'client', type: 'client', label: 'Client', position: { x: 0, y: 0 }, data: { Starts: 'A request that will touch three services' } },
    { id: 'frontend', type: 'server', label: 'frontend', position: { x: 0, y: 0 }, data: { 'Trace ID': 'Generates trace=abc (or reads it from the incoming header)', Span: 'A (root)' } },
    { id: 'orders', type: 'server', label: 'orders', position: { x: 0, y: 0 }, data: { Reads: 'traceparent header → trace=abc', Span: 'B (child of A)' } },
    { id: 'payment', type: 'server', label: 'payment', position: { x: 0, y: 0 }, data: { Reads: 'traceparent header → trace=abc', Span: 'C (child of B)' } },
  ],
  edges: [
    { id: 'c-f', source: 'client', target: 'frontend', label: 'request' },
    { id: 'f-o', source: 'frontend', target: 'orders', label: 'traceparent: trace=abc, parent=A' },
    { id: 'o-p', source: 'orders', target: 'payment', label: 'traceparent: trace=abc, parent=B' },
    { id: 'p-o', source: 'payment', target: 'orders', label: 'response — span C ends' },
    { id: 'o-f', source: 'orders', target: 'frontend', label: 'response — span B ends' },
    { id: 'f-c', source: 'frontend', target: 'client', label: 'response — span A ends' },
  ],
  states: [
    { id: 'p0', label: 'A request arrives', description: 'The client calls the frontend. Nothing yet ties this request’s future log lines and spans together.' },
    { id: 'p1', label: 'The frontend starts a trace', description: 'The frontend generates a trace ID (trace=abc) — or reads one from an incoming traceparent header — and opens the root span, A. Everything this request does will carry this trace ID.' },
    { id: 'p2', label: 'Propagate to orders', description: 'The frontend calls orders and passes the W3C traceparent header carrying trace=abc and its own span A as the parent. orders opens span B as a child of A. The ID travelling in the header is context propagation.' },
    { id: 'p3', label: 'Propagate to payment', description: 'orders calls payment, passing traceparent with trace=abc and span B as parent. payment opens span C under B. If any service dropped the header, the trace would break there.' },
    { id: 'p4', label: 'payment responds', description: 'payment finishes and span C records its duration. The response flows back up.' },
    { id: 'p5', label: 'orders responds', description: 'orders finishes and span B records its duration, which includes the time spent waiting on payment.' },
    { id: 'p6', label: 'One trace, reassembled', description: 'The frontend responds and span A closes. Each service exported its span tagged with trace=abc and its parent; the tracing backend joins them by trace ID into one waterfall — the view in the Investigate a Slow Request lab.' },
  ],
};
