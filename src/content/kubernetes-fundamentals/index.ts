// The Kubernetes Fundamentals domain index. Metadata-only — never import
// concept content modules from here; those load per concept through
// ./concept-loaders.ts (keyed into the shared loader registry).

import type { Domain } from '../types';
import { foundations } from './foundations';
import { architecture } from './architecture';
import { workloads } from './workloads';
import { networking } from './networking';
import { configuration } from './configuration';
import { podLifecycle } from './pod-lifecycle';
import { scheduling } from './scheduling';
import { resourceManagement } from './resource-management';
import { scaling } from './scaling';
import { deploymentStrategies } from './deployment-strategies';

export const kubernetesFundamentals: Domain = {
  id: 'kubernetes-fundamentals',
  title: 'Kubernetes Fundamentals',
  description:
    'How Kubernetes works from first principles — its architecture, declarative model, controllers, workloads, networking, configuration, and the day-two operations surface: Pod lifecycle and health, scheduling, resource management, scaling, and deployment strategies.',
  categories: [
    foundations,
    architecture,
    workloads,
    networking,
    configuration,
    podLifecycle,
    scheduling,
    resourceManagement,
    scaling,
    deploymentStrategies,
  ],
};
