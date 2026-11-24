import type { Category } from '../../types';

export const monitoringAndObservability: Category = {
  id: 'monitoring-and-observability',
  title: 'Monitoring and Observability',
  description: 'Gaining visibility into system behavior — metrics, logs, and distributed traces.',
  concepts: [
    {
      id: 'observability-fundamentals',
      title: 'Observability Fundamentals',
      description:
        'The golden signals, SLIs/SLOs/SLAs, and how metrics, logs, and traces combine into incident detection and root cause analysis — the frame the other three concepts in this category sit inside.',
      status: 'coming-soon',
    },
    {
      id: 'metrics-and-alerting',
      title: 'Metrics and Alerting',
      description:
        'Collecting numerical measurements of system behavior and triggering alerts on anomalies.',
      status: 'coming-soon',
    },
    {
      id: 'logging',
      title: 'Logging',
      description: 'Capturing and aggregating event records from applications and infrastructure.',
      status: 'coming-soon',
    },
    {
      id: 'distributed-tracing',
      title: 'Distributed Tracing',
      description:
        'Tracking requests as they flow through distributed systems to identify bottlenecks and failures.',
      status: 'coming-soon',
    },
  ],
};
