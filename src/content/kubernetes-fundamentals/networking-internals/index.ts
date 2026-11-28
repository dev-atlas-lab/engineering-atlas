import type { Category } from '../../types';
import {
  networkModel,
  containerNetworkInterface,
  cniPluginArchitecture,
  podToPodCommunication,
  crossNodePodNetworking,
  networkRoutingAndEncapsulation,
  kubeProxyRouting,
  iptablesVsIpvs,
  networkTroubleshooting,
} from './meta';

export const networkingInternals: Category = {
  id: 'networking-internals',
  title: 'Kubernetes Networking Internals',
  description:
    'How Pod networking actually works — the network model, CNI contract, same-node and cross-node paths, encapsulation vs routing, kube-proxy, and a diagnostic ladder for troubleshooting.',
  concepts: [
    networkModel,
    containerNetworkInterface,
    cniPluginArchitecture,
    podToPodCommunication,
    crossNodePodNetworking,
    networkRoutingAndEncapsulation,
    kubeProxyRouting,
    iptablesVsIpvs,
    networkTroubleshooting,
  ],
};
