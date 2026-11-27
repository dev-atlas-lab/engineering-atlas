// The Kubernetes Fundamentals domain index. Metadata-only — never import
// concept content modules from here; those load per concept through
// ./concept-loaders.ts (keyed into the shared loader registry).

import type { Domain } from '../types';
import { foundations } from './foundations';
import { architecture } from './architecture';
import { workloads } from './workloads';
import { networking } from './networking';
import { configuration } from './configuration';

export const kubernetesFundamentals: Domain = {
  id: 'kubernetes-fundamentals',
  title: 'Kubernetes Fundamentals',
  description:
    'How Kubernetes works from first principles — its architecture, declarative model, controllers, workloads, networking, and configuration.',
  categories: [foundations, architecture, workloads, networking, configuration],
};
