// Eager metadata for the Kubernetes Networking category.

import type { ConceptMeta } from '../../types';

export const podNetworking: ConceptMeta = {
  id: 'pod-networking',
  title: 'Pod Networking',
  description: 'The flat, cluster-wide network model that gives every Pod a unique IP and lets any Pod reach any other without NAT.',
  status: 'available',
  learningObjectives: [
    'State the Kubernetes network model and what it requires of the network',
    'Explain why Kubernetes delegates the implementation to a CNI plugin',
  ],
  prerequisites: ['pod'],
  relatedConcepts: ['service', 'kube-proxy'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'the-flat-network-model', title: 'The Flat Pod Network Model', kind: 'concept' },
    { id: 'cni-plugins', title: 'CNI: Who Actually Wires Up Pod Networking', kind: 'concept' },
  ],
};

export const service: ConceptMeta = {
  id: 'service',
  title: 'Service',
  description: 'The stable network abstraction over a changing set of Pods — a long-lived virtual endpoint that load balances to current Pod IPs.',
  status: 'available',
  learningObjectives: [
    'Explain the problem Services solve — Pods are ephemeral, their IPs change',
    'Describe how a Service uses a label selector to track its backing Pods',
    'Describe the role of the Endpoints/EndpointSlice object',
  ],
  prerequisites: ['pod-networking', 'labels-and-selectors'],
  relatedConcepts: ['clusterip', 'nodeport', 'loadbalancer-service', 'kube-proxy'],
  estimatedMinutes: 30,
  lessons: [
    { id: 'service-abstraction', title: 'What a Service Abstracts Over', kind: 'concept' },
    { id: 'endpoints-and-selectors', title: 'Endpoints and How a Service Finds Its Pods', kind: 'concept' },
  ],
};

export const clusterIp: ConceptMeta = {
  id: 'clusterip',
  title: 'ClusterIP',
  description: 'The default Service type — an in-cluster virtual IP reachable only from inside the cluster, implemented by kube-proxy on every node.',
  status: 'available',
  learningObjectives: [
    'Explain where a ClusterIP is reachable from and where it is not',
    'Trace a request from one Pod to a ClusterIP and down to a backing Pod',
  ],
  prerequisites: ['service'],
  relatedConcepts: ['service', 'kube-proxy'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'what-clusterip-is', title: 'ClusterIP: The Default Service Type', kind: 'concept' },
  ],
};

export const nodePort: ConceptMeta = {
  id: 'nodeport',
  title: 'NodePort',
  description: 'A Service type that exposes the Service on a fixed port on every node, making it reachable from outside the cluster.',
  status: 'available',
  learningObjectives: [
    'Explain how NodePort builds on ClusterIP',
    'Describe why NodePort is rarely the right choice for production ingress',
  ],
  prerequisites: ['clusterip'],
  relatedConcepts: ['clusterip', 'loadbalancer-service'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'nodeport-exposure', title: 'NodePort: A Port on Every Node', kind: 'concept' },
  ],
};

export const loadBalancerService: ConceptMeta = {
  id: 'loadbalancer-service',
  title: 'LoadBalancer Service',
  description: 'A Service type that asks the cloud provider for an external load balancer in front of the NodePort, giving the Service a stable public endpoint.',
  status: 'available',
  learningObjectives: [
    'Describe how a LoadBalancer Service layers on top of NodePort',
    'Explain who provisions the external load balancer and how',
  ],
  prerequisites: ['nodeport'],
  relatedConcepts: ['nodeport', 'service'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'loadbalancer-mechanics', title: 'How a LoadBalancer Service Gets a Public IP', kind: 'concept' },
  ],
};

export const serviceDiscovery: ConceptMeta = {
  id: 'service-discovery',
  title: 'Service Discovery',
  description: 'How Pods find the right Service without hardcoding IPs — through DNS and, for a few cases, environment variables.',
  status: 'available',
  learningObjectives: [
    'Describe the DNS name every Service gets',
    'Explain why DNS-based discovery is preferred over environment variables',
  ],
  prerequisites: ['service'],
  relatedConcepts: ['coredns', 'service'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'dns-first-discovery', title: 'DNS-First Service Discovery', kind: 'concept' },
  ],
};

export const coreDns: ConceptMeta = {
  id: 'coredns',
  title: 'CoreDNS',
  description: 'The cluster DNS server that resolves Service and Pod names — deployed as a regular Deployment, exposed as a Service.',
  status: 'available',
  learningObjectives: [
    'Describe the DNS name format for a Service: <svc>.<namespace>.svc.cluster.local',
    'Explain how a Pod is pointed at CoreDNS (/etc/resolv.conf injection)',
  ],
  prerequisites: ['service-discovery'],
  relatedConcepts: ['service-discovery', 'service'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'coredns-role', title: 'CoreDNS Inside the Cluster', kind: 'concept' },
    { id: 'resolving-a-service', title: 'Resolving a Service Name Step by Step', kind: 'concept' },
  ],
};
