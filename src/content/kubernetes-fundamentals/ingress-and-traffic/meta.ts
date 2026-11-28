import type { ConceptMeta } from '../../types';

export const ingressArchitecture: ConceptMeta = {
  id: 'ingress-architecture',
  title: 'Ingress Architecture',
  description: 'The Ingress resource is a declarative routing spec; it needs an Ingress controller to actually route traffic.',
  status: 'available',
  learningObjectives: [
    'Describe the Ingress resource as a spec and the controller as the implementation',
    'Explain why an Ingress without a controller does nothing',
  ],
  prerequisites: ['service', 'loadbalancer-service'],
  relatedConcepts: ['ingress-controller', 'ingress-rules-and-path-routing'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'spec-and-controller', title: 'A Spec and a Runtime', kind: 'concept' },
    { id: 'ingress-vs-loadbalancer-svc', title: 'Ingress vs LoadBalancer Service', kind: 'concept' },
  ],
};

export const ingressController: ConceptMeta = {
  id: 'ingress-controller',
  title: 'Ingress Controller',
  description: 'The proxy process (NGINX, HAProxy, Traefik, Envoy) that watches Ingress objects and configures itself from them.',
  status: 'available',
  learningObjectives: [
    'Compare common Ingress controllers at an architectural level',
    'Describe the data path from cloud LB to backend Pod',
  ],
  prerequisites: ['ingress-architecture'],
  relatedConcepts: ['ingress-architecture', 'service-mesh-fundamentals'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'what-the-controller-does', title: 'What an Ingress Controller Does', kind: 'concept' },
    { id: 'controller-comparison', title: 'NGINX, HAProxy, Traefik, Envoy', kind: 'concept' },
  ],
};

export const ingressRules: ConceptMeta = {
  id: 'ingress-rules-and-path-routing',
  title: 'Ingress Rules and Path Routing',
  description: 'Host and path routing in Ingress: how rules match, how ordering is resolved, and what happens when nothing matches.',
  status: 'available',
  learningObjectives: [
    'Match requests to rules by Host header and path',
    'Distinguish Prefix from Exact path matching',
  ],
  prerequisites: ['ingress-controller'],
  relatedConcepts: ['ingress-architecture', 'tls-termination'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'host-and-path', title: 'Matching Host and Path', kind: 'concept' },
    { id: 'rule-precedence', title: 'When Multiple Rules Could Match', kind: 'concept' },
  ],
  labs: [
    { id: 'ingress-routing-simulator', title: 'Ingress Traffic Routing Simulator', type: 'simulation' },
  ],
};

export const tlsTermination: ConceptMeta = {
  id: 'tls-termination',
  title: 'TLS Termination',
  description: 'How the Ingress controller presents a TLS certificate from a referenced Secret, decrypts the request, and speaks HTTP to the backend.',
  status: 'available',
  learningObjectives: [
    'Describe TLS termination at the controller and the alternatives (passthrough, re-encrypt)',
    'Explain how cert-manager integrates with Ingress for automated issuance',
  ],
  prerequisites: ['ingress-controller'],
  relatedConcepts: ['secrets', 'ingress-rules-and-path-routing'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'how-tls-terminates', title: 'How TLS Terminates at the Controller', kind: 'concept' },
    { id: 'passthrough-and-reencrypt', title: 'Passthrough and Re-encryption', kind: 'concept' },
  ],
};

export const gatewayApi: ConceptMeta = {
  id: 'gateway-api',
  title: 'Gateway API',
  description: 'The successor to Ingress: a role-oriented, extensible API split across GatewayClass, Gateway, and *Route resources.',
  status: 'available',
  learningObjectives: [
    'Enumerate the three Gateway API resources and their owners',
    'Compare Ingress with Gateway API on expressiveness and multi-team workflow',
  ],
  prerequisites: ['ingress-architecture'],
  relatedConcepts: ['ingress-architecture', 'service-mesh-fundamentals'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'three-resources', title: 'GatewayClass, Gateway, HTTPRoute', kind: 'concept' },
    { id: 'why-replace-ingress', title: 'Why Gateway API Replaces Ingress', kind: 'concept' },
  ],
};

export const northSouthEastWest: ConceptMeta = {
  id: 'north-south-vs-east-west-traffic',
  title: 'North-South vs East-West Traffic',
  description: 'The convention that distinguishes external traffic (into or out of the cluster) from internal service-to-service traffic.',
  status: 'available',
  learningObjectives: [
    'Define north-south and east-west traffic',
    'Describe which Kubernetes components handle each',
  ],
  prerequisites: ['ingress-architecture'],
  relatedConcepts: ['service-mesh-fundamentals', 'service'],
  estimatedMinutes: 10,
  lessons: [
    { id: 'the-cardinal-convention', title: 'The Cardinal Convention', kind: 'concept' },
  ],
};

export const serviceMeshFundamentals: ConceptMeta = {
  id: 'service-mesh-fundamentals',
  title: 'Service Mesh Fundamentals',
  description: 'What a service mesh adds on top of the Kubernetes network: mTLS, retries, traffic policy, observability.',
  status: 'available',
  learningObjectives: [
    'Describe the data plane / control plane split of a service mesh',
    'Enumerate the features a mesh adds beyond plain Services',
    'Explain when a mesh is worth its operational cost',
  ],
  prerequisites: ['service', 'north-south-vs-east-west-traffic'],
  relatedConcepts: ['sidecar-proxy-architecture', 'ingress-controller'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'what-a-mesh-adds', title: 'What a Mesh Adds', kind: 'concept' },
    { id: 'data-plane-control-plane', title: 'Data Plane and Control Plane', kind: 'concept' },
  ],
};

export const sidecarProxy: ConceptMeta = {
  id: 'sidecar-proxy-architecture',
  title: 'Sidecar Proxy Architecture',
  description: 'The sidecar model: an Envoy (or similar) proxy container per Pod, intercepting all traffic transparently.',
  status: 'available',
  learningObjectives: [
    'Describe the sidecar injection flow',
    'Explain iptables redirection into the proxy',
    'Compare sidecar to ambient / eBPF mesh approaches',
  ],
  prerequisites: ['service-mesh-fundamentals'],
  relatedConcepts: ['service-mesh-fundamentals', 'pod'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'how-sidecars-intercept', title: 'How Sidecars Intercept Traffic', kind: 'concept' },
    { id: 'beyond-sidecars', title: 'Beyond Sidecars: Ambient and eBPF', kind: 'concept' },
  ],
};
