import type { Category } from '../../types';
import { observabilityFundamentals, metricsAndAlerting, logging, distributedTracing } from './meta';

export const monitoringAndObservability: Category = {
  id: 'monitoring-and-observability',
  title: 'Monitoring and Observability',
  description: 'Gaining visibility into system behavior — metrics, logs, and distributed traces.',
  concepts: [observabilityFundamentals, metricsAndAlerting, logging, distributedTracing],
};
