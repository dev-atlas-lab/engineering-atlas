import type { Category } from '../../types';
import {
  cpuRequestsLimits,
  memoryRequestsLimits,
  resourceQosClasses,
  oomKilled,
  cpuThrottling,
  limitRange,
  resourceQuota,
} from './meta';

export const resourceManagement: Category = {
  id: 'resource-management',
  title: 'Resource Management',
  description:
    'The runtime side of resource requests and limits — how QoS classes fall out of them, how CPU over-limit is throttled while memory over-limit is killed, and how namespace-scoped LimitRange and ResourceQuota govern tenancy.',
  concepts: [
    cpuRequestsLimits,
    memoryRequestsLimits,
    resourceQosClasses,
    oomKilled,
    cpuThrottling,
    limitRange,
    resourceQuota,
  ],
};
