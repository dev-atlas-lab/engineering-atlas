// Eager metadata for this category's concepts: ids, titles, status, and
// lesson/lab ids, titles, and order. Never import concept content modules
// from here — they load per concept through ../concept-loaders.ts.

import type { ConceptMeta } from '../../types';

export const loadBalancingFundamentals: ConceptMeta = {
  id: 'load-balancing-fundamentals',
  title: 'Load Balancing Fundamentals',
  description:
    'Layer 4 vs. Layer 7 load balancing, reverse proxies, health checks, distribution algorithms, session affinity, and TLS termination — the concepts underlying every load balancer type.',
  status: 'available',
  learningObjectives: [
    'Explain the capacity and availability problems load balancing solves',
    'Compare round robin, weighted, least connections, and hash-based distribution, and session affinity',
    'Distinguish Layer 4 connection forwarding from Layer 7 request routing, and TLS termination from passthrough',
    'Explain active and passive health checks, thresholds, draining, and readiness vs liveness',
    'Map Azure and AWS load balancing services by layer and scope',
  ],
  relatedConcepts: ['application-load-balancing', 'network-load-balancing', 'global-traffic-distribution', 'auto-scaling'],
  estimatedMinutes: 100,
  lessons: [
    { id: 'why-load-balancing', title: 'Why Load Balancing Exists', kind: 'concept' },
    { id: 'distribution-algorithms', title: 'Distribution Algorithms and Session Affinity', kind: 'concept' },
    { id: 'layer-4-vs-layer-7', title: 'Layer 4 versus Layer 7 Load Balancing', kind: 'concept' },
    { id: 'health-checks', title: 'Health Checks and Backend Availability', kind: 'concept' },
    { id: 'azure-load-balancing-landscape', title: 'The Azure Load Balancing Landscape', kind: 'provider', providerId: 'azure' },
    { id: 'aws-load-balancing-landscape', title: 'The AWS Load Balancing Landscape', kind: 'provider', providerId: 'aws' },
    { id: 'load-balancing-comparison', title: 'Comparison: Azure vs. AWS Load Balancing', kind: 'comparison' },
  ],
  labs: [
    { id: 'configure-traffic-distribution-lab', title: 'Configure Traffic Distribution', type: 'simulation' },
    { id: 'recover-from-backend-failure-lab', title: 'Recover from Backend Failure', type: 'simulation' },
  ],
};

export const applicationLoadBalancing: ConceptMeta = {
  id: 'application-load-balancing',
  title: 'Application Load Balancing',
  description:
    'Layer 7 load balancing that routes HTTP/HTTPS traffic based on content, paths, and headers.',
  status: 'available',
  learningObjectives: [
    'Explain how listener rules route a request by host, path, header, and method',
    'Explain TLS termination, redirects, rewrites, and cookie-based affinity at Layer 7',
    'Compare Azure Application Gateway and AWS Application Load Balancer',
  ],
  prerequisites: ['load-balancing-fundamentals'],
  relatedConcepts: ['load-balancing-fundamentals', 'network-load-balancing', 'network-security'],
  estimatedMinutes: 55,
  lessons: [
    { id: 'how-layer-7-routing-works', title: 'How Layer 7 Routing Works', kind: 'concept' },
    { id: 'azure-application-gateway', title: 'Azure Application Gateway', kind: 'provider', providerId: 'azure' },
    { id: 'aws-application-load-balancer', title: 'AWS Application Load Balancer', kind: 'provider', providerId: 'aws' },
    { id: 'application-load-balancing-comparison', title: 'Comparison: Application Gateway vs. ALB', kind: 'comparison' },
  ],
};

export const networkLoadBalancing: ConceptMeta = {
  id: 'network-load-balancing',
  title: 'Network Load Balancing',
  description: 'Layer 4 load balancing that distributes TCP/UDP traffic with ultra-low latency.',
  status: 'available',
  learningObjectives: [
    'Explain flow (5-tuple) hashing and connection pinning at Layer 4',
    'Explain source-IP preservation and TLS passthrough vs termination',
    'Compare Azure Load Balancer and AWS Network Load Balancer',
  ],
  prerequisites: ['load-balancing-fundamentals'],
  relatedConcepts: ['load-balancing-fundamentals', 'application-load-balancing', 'virtual-networks'],
  estimatedMinutes: 50,
  lessons: [
    { id: 'how-layer-4-load-balancing-works', title: 'How Layer 4 Load Balancing Works', kind: 'concept' },
    { id: 'azure-load-balancer', title: 'Azure Load Balancer', kind: 'provider', providerId: 'azure' },
    { id: 'aws-network-load-balancer', title: 'AWS Network Load Balancer', kind: 'provider', providerId: 'aws' },
    { id: 'network-load-balancing-comparison', title: 'Comparison: Azure Load Balancer vs. NLB', kind: 'comparison' },
  ],
};

export const globalTrafficDistribution: ConceptMeta = {
  id: 'global-traffic-distribution',
  title: 'Global Traffic Distribution',
  description:
    'Edge-layer traffic distribution across regions — global load balancing and CDN-integrated routing, distinct from the regional Layer 4/7 balancers above.',
  status: 'available',
  learningObjectives: [
    'Distinguish DNS-based steering from an anycast proxy in the data path',
    'Compare priority, weighted, performance, and geographic routing, and active-active vs active-passive',
    'Explain DNS TTL and why DNS failover is never instant',
    'Map Azure Front Door and Traffic Manager to AWS Route 53, Global Accelerator, and CloudFront',
  ],
  prerequisites: ['load-balancing-fundamentals', 'dns-and-content-delivery'],
  relatedConcepts: ['load-balancing-fundamentals', 'high-availability', 'geographic-redundancy-and-data-residency'],
  estimatedMinutes: 65,
  lessons: [
    { id: 'global-vs-regional-load-balancing', title: 'Global vs. Regional Routing', kind: 'concept' },
    { id: 'azure-global-routing', title: 'Azure Front Door and Traffic Manager', kind: 'provider', providerId: 'azure' },
    { id: 'aws-global-routing', title: 'AWS Route 53, Global Accelerator, and CloudFront', kind: 'provider', providerId: 'aws' },
    { id: 'global-traffic-distribution-comparison', title: 'Comparison: Azure vs. AWS Global Routing', kind: 'comparison' },
  ],
  labs: [{ id: 'route-around-a-regional-outage-lab', title: 'Route Around a Regional Outage', type: 'simulation' }],
};
