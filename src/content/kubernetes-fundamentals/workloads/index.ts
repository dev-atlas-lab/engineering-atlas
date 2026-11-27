import type { Category } from '../../types';
import { pod, multiContainerPods, replicaSet, deployment, statefulSet, daemonSet, jobAndCronJob } from './meta';

export const workloads: Category = {
  id: 'workloads',
  title: 'Kubernetes Workloads',
  description:
    'The controllers that run application code: Pods, ReplicaSets, Deployments, StatefulSets, DaemonSets, and Jobs.',
  concepts: [pod, multiContainerPods, replicaSet, deployment, statefulSet, daemonSet, jobAndCronJob],
};
