import type { Category } from '../../types';
import {
  rollingUpdates,
  rollback,
  deploymentRevisionHistory,
  blueGreen,
  canary,
  maxSurgeMaxUnavailable,
  zeroDowntimeDeployment,
} from './meta';

export const deploymentStrategies: Category = {
  id: 'deployment-strategies',
  title: 'Deployment Strategies & Rollouts',
  description:
    'The release side of Kubernetes: how the Deployment controller rolls out a new version, how to roll back, how blue-green and canary compare to rolling updates, and what zero-downtime actually requires end to end.',
  concepts: [
    rollingUpdates,
    maxSurgeMaxUnavailable,
    rollback,
    deploymentRevisionHistory,
    blueGreen,
    canary,
    zeroDowntimeDeployment,
  ],
};
