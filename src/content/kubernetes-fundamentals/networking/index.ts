import type { Category } from '../../types';
import {
  podNetworking,
  service,
  clusterIp,
  nodePort,
  loadBalancerService,
  serviceDiscovery,
  coreDns,
} from './meta';

export const networking: Category = {
  id: 'networking',
  title: 'Kubernetes Networking',
  description:
    'The flat Pod network, the Service abstraction over ephemeral Pods, the Service types, and cluster DNS.',
  concepts: [podNetworking, service, clusterIp, nodePort, loadBalancerService, serviceDiscovery, coreDns],
};
