import type { Category } from '../../types';

export const loadBalancing: Category = {
  id: 'load-balancing',
  title: 'Load Balancing',
  description: 'Distributing traffic across multiple targets for performance and availability.',
  concepts: [
    {
      id: 'load-balancing-fundamentals',
      title: 'Load Balancing Fundamentals',
      description:
        'Layer 4 vs. Layer 7 load balancing, reverse proxies, health checks, distribution algorithms, session affinity, and TLS termination — the concepts underlying every load balancer type.',
      status: 'coming-soon',
    },
    {
      id: 'application-load-balancing',
      title: 'Application Load Balancing',
      description:
        'Layer 7 load balancing that routes HTTP/HTTPS traffic based on content, paths, and headers.',
      status: 'coming-soon',
    },
    {
      id: 'network-load-balancing',
      title: 'Network Load Balancing',
      description:
        'Layer 4 load balancing that distributes TCP/UDP traffic with ultra-low latency.',
      status: 'coming-soon',
    },
    {
      id: 'global-traffic-distribution',
      title: 'Global Traffic Distribution',
      description:
        'Edge-layer traffic distribution across regions — global load balancing and CDN-integrated routing, distinct from the regional Layer 4/7 balancers above.',
      status: 'coming-soon',
    },
  ],
};
