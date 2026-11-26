// Eager metadata for this category's concepts: ids, titles, status, and
// lesson/lab ids, titles, and order. Never import concept content modules
// from here — they load per concept through ../concept-loaders.ts.

import type { ConceptMeta } from '../../types';

export const observabilityFundamentals: ConceptMeta = {
  id: 'observability-fundamentals',
  title: 'Observability Fundamentals',
  description:
    'The golden signals, SLIs/SLOs/SLAs, and how metrics, logs, and traces combine into incident detection and root cause analysis — the frame the other three concepts in this category sit inside.',
  status: 'available',
  learningObjectives: [
    'Distinguish monitoring from observability and the three signals they draw on',
    'Define SLI, SLO, SLA, and error budgets',
    'Lay out dashboards around the golden signals and avoid common anti-patterns',
    'Follow the alert → metrics → logs → trace → root-cause investigation workflow',
    'Map the Azure Monitor and AWS CloudWatch/X-Ray observability suites',
  ],
  prerequisites: ['high-availability'],
  relatedConcepts: ['metrics-and-alerting', 'logging', 'distributed-tracing'],
  estimatedMinutes: 85,
  lessons: [
    { id: 'monitoring-vs-observability', title: 'Monitoring vs. Observability', kind: 'concept' },
    { id: 'golden-signals-slis-slos-slas', title: 'Golden Signals, SLIs, SLOs, and SLAs', kind: 'concept' },
    { id: 'observability-dashboards', title: 'Observability Dashboards', kind: 'concept' },
    { id: 'incident-investigation-and-rca', title: 'Incident Investigation and RCA', kind: 'concept' },
    { id: 'azure-observability-suite', title: 'The Azure Monitor Suite', kind: 'provider', providerId: 'azure' },
    { id: 'aws-observability-suite', title: 'Amazon CloudWatch and X-Ray', kind: 'provider', providerId: 'aws' },
    { id: 'observability-fundamentals-comparison', title: 'Comparison: Azure vs. AWS Observability Suites', kind: 'comparison' },
  ],
  labs: [{ id: 'end-to-end-incident-investigation-lab', title: 'End-to-End Incident Investigation', type: 'simulation' }],
};

export const metricsAndAlerting: ConceptMeta = {
  id: 'metrics-and-alerting',
  title: 'Metrics and Alerting',
  description: 'Collecting numerical measurements of system behavior and triggering alerts on anomalies.',
  status: 'available',
  learningObjectives: [
    'Distinguish counters, gauges, and histograms, and explain cardinality',
    'Explain the four golden signals and the RED and USE methods',
    'Explain aggregation, time windows, and why percentiles beat averages',
    'Design alert rules with thresholds, evaluation windows, and routing that avoid fatigue',
    'Compare Azure Monitor metric alerts with CloudWatch alarms',
  ],
  prerequisites: ['observability-fundamentals'],
  relatedConcepts: ['logging', 'distributed-tracing', 'auto-scaling'],
  estimatedMinutes: 95,
  lessons: [
    { id: 'metrics-fundamentals', title: 'Metrics Fundamentals', kind: 'concept' },
    { id: 'the-golden-signals', title: 'The Golden Signals, RED, and USE', kind: 'concept' },
    { id: 'aggregation-and-time-windows', title: 'Aggregation and Time Windows', kind: 'concept' },
    { id: 'alerting-fundamentals', title: 'Alerting Fundamentals', kind: 'concept' },
    { id: 'azure-monitor-metrics-and-alerts', title: 'Azure Monitor Metrics and Alerts', kind: 'provider', providerId: 'azure' },
    { id: 'cloudwatch-metrics-and-alarms', title: 'CloudWatch Metrics and Alarms', kind: 'provider', providerId: 'aws' },
    { id: 'metrics-and-alerting-comparison', title: 'Comparison: Azure vs. AWS Metrics and Alerting', kind: 'comparison' },
  ],
  labs: [
    { id: 'diagnose-a-latency-spike-lab', title: 'Diagnose a Latency Spike', type: 'simulation' },
    { id: 'configure-an-alerting-policy-lab', title: 'Configure an Alerting Policy', type: 'simulation' },
  ],
};

export const logging: ConceptMeta = {
  id: 'logging',
  title: 'Logging',
  description: 'Capturing and aggregating event records from applications and infrastructure.',
  status: 'available',
  learningObjectives: [
    'Distinguish structured from unstructured logs and use log levels well',
    'Explain correlation IDs, trace IDs, and context propagation',
    'Describe the centralized logging pipeline: collect, process, store, query',
    'Compare Azure Log Analytics (KQL) with AWS CloudWatch Logs',
  ],
  prerequisites: ['observability-fundamentals'],
  relatedConcepts: ['metrics-and-alerting', 'distributed-tracing'],
  estimatedMinutes: 75,
  lessons: [
    { id: 'logging-fundamentals', title: 'Logging Fundamentals', kind: 'concept' },
    { id: 'correlation-and-trace-ids', title: 'Correlation IDs and Trace IDs', kind: 'concept' },
    { id: 'centralized-logging-architecture', title: 'Centralized Logging Architecture', kind: 'concept' },
    { id: 'azure-log-analytics', title: 'Azure Monitor Logs and Log Analytics', kind: 'provider', providerId: 'azure' },
    { id: 'aws-cloudwatch-logs', title: 'Amazon CloudWatch Logs', kind: 'provider', providerId: 'aws' },
    { id: 'logging-comparison', title: 'Comparison: Azure vs. AWS Logging', kind: 'comparison' },
  ],
  labs: [{ id: 'find-a-failed-request-using-structured-logs-lab', title: 'Find a Failed Request Using Structured Logs', type: 'simulation' }],
};

export const distributedTracing: ConceptMeta = {
  id: 'distributed-tracing',
  title: 'Distributed Tracing',
  description:
    'Tracking requests as they flow through distributed systems to identify bottlenecks and failures.',
  status: 'available',
  learningObjectives: [
    'Explain why metrics and logs alone miss cross-service latency and failures',
    'Describe traces, spans, parent/child context, and the critical path',
    'Explain context propagation (W3C Trace Context) and head vs. tail sampling',
    'Describe OpenTelemetry’s role as a vendor-neutral standard',
    'Compare Azure Application Insights with AWS X-Ray',
  ],
  prerequisites: ['observability-fundamentals', 'logging'],
  relatedConcepts: ['metrics-and-alerting', 'logging'],
  estimatedMinutes: 85,
  lessons: [
    { id: 'why-distributed-tracing', title: 'Why Distributed Tracing', kind: 'concept' },
    { id: 'traces-spans-and-context', title: 'Traces, Spans, and Context', kind: 'concept' },
    { id: 'sampling-and-opentelemetry', title: 'Sampling and OpenTelemetry', kind: 'concept' },
    { id: 'azure-application-insights', title: 'Azure Application Insights', kind: 'provider', providerId: 'azure' },
    { id: 'aws-x-ray', title: 'AWS X-Ray', kind: 'provider', providerId: 'aws' },
    { id: 'distributed-tracing-comparison', title: 'Comparison: Azure vs. AWS Distributed Tracing', kind: 'comparison' },
  ],
  labs: [{ id: 'investigate-a-slow-distributed-request-lab', title: 'Investigate a Slow Distributed Request', type: 'simulation' }],
};
