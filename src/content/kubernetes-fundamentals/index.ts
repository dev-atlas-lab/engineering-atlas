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
import { networkingInternals } from './networking-internals';
import { ingressAndTraffic } from './ingress-and-traffic';
import { networkSecurity } from './network-security';
import { identityAndAccess } from './identity-and-access';
import { workloadSecurity } from './workload-security';

export const kubernetesFundamentals: Domain = {
  id: 'kubernetes-fundamentals',
  title: 'Kubernetes Fundamentals',
  description:
    'How Kubernetes works end to end — architecture, workloads, networking, configuration, the day-two operations surface (Pod lifecycle and health, scheduling, resources, scaling, rollouts), and the networking & security plane (CNI, Ingress and Gateway, NetworkPolicy, RBAC, Pod Security).',
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
    networkingInternals,
    ingressAndTraffic,
    networkSecurity,
    identityAndAccess,
    workloadSecurity,
  ],
};
