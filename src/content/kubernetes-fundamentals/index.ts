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
import { storageFundamentals } from './storage-fundamentals';
import { storageInternals } from './storage-internals';
import { statefulWorkloads } from './stateful-workloads';
import { dataReliability } from './data-reliability';
import { storageOperations } from './storage-operations';

export const kubernetesFundamentals: Domain = {
  id: 'kubernetes-fundamentals',
  title: 'Kubernetes Fundamentals',
  description:
    'How Kubernetes works end to end — architecture, workloads, networking, configuration, the day-two operations surface (Pod lifecycle and health, scheduling, resources, scaling, rollouts), the networking & security plane (CNI, Ingress and Gateway, NetworkPolicy, RBAC, Pod Security), and storage & reliability (volumes, CSI, StatefulSets, backup/recovery, and production storage operations).',
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
    storageFundamentals,
    storageInternals,
    statefulWorkloads,
    dataReliability,
    storageOperations,
  ],
};
