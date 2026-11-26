import type { Category } from '../../types';
import { loadBalancingFundamentals, applicationLoadBalancing, networkLoadBalancing, globalTrafficDistribution } from './meta';

export const loadBalancing: Category = {
  id: 'load-balancing',
  title: 'Load Balancing',
  description: 'Distributing traffic across multiple targets for performance and availability.',
  concepts: [loadBalancingFundamentals, applicationLoadBalancing, networkLoadBalancing, globalTrafficDistribution],
};
