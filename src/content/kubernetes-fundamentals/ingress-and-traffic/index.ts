import type { Category } from '../../types';
import {
  ingressArchitecture,
  ingressController,
  ingressRules,
  tlsTermination,
  gatewayApi,
  northSouthEastWest,
  serviceMeshFundamentals,
  sidecarProxy,
} from './meta';

export const ingressAndTraffic: Category = {
  id: 'ingress-and-traffic',
  title: 'Ingress & Traffic Management',
  description:
    'External traffic into the cluster and advanced east-west traffic management — Ingress architecture, TLS termination, the Gateway API successor, service mesh fundamentals, and sidecar interception.',
  concepts: [
    ingressArchitecture,
    ingressController,
    ingressRules,
    tlsTermination,
    gatewayApi,
    northSouthEastWest,
    serviceMeshFundamentals,
    sidecarProxy,
  ],
};
