import type { Category } from '../../types';
import {
  schedulingDeepDive,
  nodeSelectors,
  nodeAffinity,
  podAffinity,
  taintsAndTolerations,
  priorityClasses,
  topologySpread,
} from './meta';

export const scheduling: Category = {
  id: 'scheduling',
  title: 'Scheduling & Placement',
  description:
    'How Pods end up on specific nodes — the filter/score algorithm and the constraint language teams use to shape placement: node selectors and affinity, pod affinity, taints, priority, and topology spread.',
  concepts: [
    schedulingDeepDive,
    nodeSelectors,
    nodeAffinity,
    podAffinity,
    taintsAndTolerations,
    priorityClasses,
    topologySpread,
  ],
};
