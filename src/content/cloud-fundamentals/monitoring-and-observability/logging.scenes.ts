import type { SceneDefinition } from '../../../engines/visualization/types';

export const loggingPipelineScene: SceneDefinition = {
  id: 'logging-pipeline',
  type: 'topology',
  title: 'A centralized logging pipeline',
  description: 'Logs flow from applications through a collector and processing into indexed storage, where they are queried.',
  nodes: [
    { id: 'app1', type: 'server', label: 'App instance 1', position: { x: 0, y: 30 }, data: { Emits: 'Structured JSON log events with a correlation ID' }, status: 'active' },
    { id: 'app2', type: 'server', label: 'App instance 2', position: { x: 0, y: 150 }, data: { Emits: 'Structured JSON log events with a correlation ID' }, status: 'active' },
    { id: 'collector', type: 'gateway', label: 'Agent / collector', position: { x: 210, y: 90 }, data: { Does: 'Gathers logs from every instance and ships them centrally', Why: 'Local files vanish with the instance and cannot be searched together' } },
    { id: 'processing', type: 'function', label: 'Processing', position: { x: 410, y: 90 }, data: { Does: 'Parses, enriches (adds service, environment, region), and redacts sensitive fields' } },
    { id: 'store', type: 'storage', label: 'Indexed log store', position: { x: 610, y: 90 }, data: { Holds: 'Logs with a retention period; indexed for fast search', Cost: 'Driven by ingestion volume and retention' } },
    { id: 'query', type: 'client', label: 'Query / dashboard', position: { x: 610, y: 220 }, data: { Does: 'Searches and filters logs — by time, level, service, and correlation ID' } },
  ],
  edges: [
    { id: 'a1-c', source: 'app1', target: 'collector', edgeType: 'data' },
    { id: 'a2-c', source: 'app2', target: 'collector', edgeType: 'data' },
    { id: 'c-p', source: 'collector', target: 'processing', edgeType: 'data' },
    { id: 'p-s', source: 'processing', target: 'store', edgeType: 'data' },
    { id: 's-q', source: 'query', target: 'store', edgeType: 'request', label: 'query' },
  ],
  states: [
    {
      id: 'emit',
      label: 'Applications emit structured events',
      description:
        'Each instance writes structured log events — JSON with named fields (timestamp, level, service, correlation ID, message) rather than free text. Structured fields are what make logs searchable and filterable later.',
      edgeOverrides: { 'a1-c': { animated: true }, 'a2-c': { animated: true } },
    },
    {
      id: 'collect',
      label: 'A collector centralizes them',
      description:
        'An agent on each host (or a sidecar) ships logs to a central collector. Centralizing matters: a log on a single instance’s local disk is lost when the instance is replaced and cannot be searched alongside the others.',
      nodeOverrides: { collector: { status: 'active' } },
      edgeOverrides: { 'a1-c': { animated: true }, 'a2-c': { animated: true }, 'c-p': { animated: true } },
    },
    {
      id: 'process',
      label: 'Processing parses and enriches',
      description:
        'The pipeline parses each event, enriches it with context (service, environment, region), and redacts sensitive data. Consistent fields across services are what make a cross-service query possible.',
      nodeOverrides: { processing: { status: 'active' } },
      edgeOverrides: { 'c-p': { animated: true }, 'p-s': { animated: true } },
    },
    {
      id: 'store',
      label: 'Stored, indexed, retained',
      description:
        'Logs land in an indexed store with a retention policy. Ingestion volume and retention drive the cost, which is why teams sample or drop noisy logs and keep high-value ones longer. Indexing is what makes search fast.',
      nodeOverrides: { store: { status: 'active' } },
      edgeOverrides: { 'p-s': { animated: true } },
    },
    {
      id: 'query',
      label: 'Queried during an investigation',
      description:
        'During an incident you query the store — narrow by time, filter to errors, then pivot on a correlation ID to reassemble one request across every service. The Find a Failed Request lab walks through exactly this.',
      nodeOverrides: { query: { status: 'active' } },
      edgeOverrides: { 's-q': { animated: true } },
    },
  ],
};
