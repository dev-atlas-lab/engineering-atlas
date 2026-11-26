import type { Category } from '../../types';
import { autoScaling, highAvailability, disasterRecovery } from './meta';

export const scalabilityAndReliability: Category = {
  id: 'scalability-and-reliability',
  title: 'Scalability and Reliability',
  description:
    'Scaling resources to meet demand and designing for failure — auto-scaling, high availability, and disaster recovery.',
  concepts: [autoScaling, highAvailability, disasterRecovery],
};
