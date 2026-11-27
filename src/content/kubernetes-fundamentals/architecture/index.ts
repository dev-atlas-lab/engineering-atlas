import type { Category } from '../../types';
import {
  clusterArchitecture,
  controlPlane,
  workerNodes,
  apiServer,
  etcd,
  scheduler,
  controllerManager,
  kubelet,
  kubeProxy,
  containerRuntime,
} from './meta';

export const architecture: Category = {
  id: 'architecture',
  title: 'Kubernetes Architecture',
  description:
    'The internal components of a cluster — control plane, worker nodes, API Server, etcd, scheduler, controllers, kubelet, kube-proxy, and the container runtime underneath.',
  concepts: [
    clusterArchitecture,
    controlPlane,
    workerNodes,
    apiServer,
    etcd,
    scheduler,
    controllerManager,
    kubelet,
    kubeProxy,
    containerRuntime,
  ],
};
