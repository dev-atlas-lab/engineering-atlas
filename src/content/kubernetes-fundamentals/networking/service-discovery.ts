import type { ConceptContentModule, LessonBody } from '../../types';

const dnsFirstDiscovery: LessonBody = {
  learningObjectives: [
    'Describe the DNS name every Service gets',
    'Explain why DNS-based discovery is preferred over environment variables',
  ],
  sections: [
    {
      heading: 'DNS is the primary discovery mechanism',
      blocks: [
        {
          type: 'paragraph',
          text: 'In a Kubernetes cluster, Pods find Services by name, not by IP. Every Service is addressable at <service>.<namespace>.svc.cluster.local — for example web.default.svc.cluster.local — resolving to the Service\'s ClusterIP. Pods are configured at startup to use the cluster DNS server (CoreDNS) as their resolver, with search paths that make the shorter form "web" work from within the same namespace.',
        },
        {
          type: 'code',
          language: 'text',
          caption: '/etc/resolv.conf inside a Pod in namespace default',
          code: `nameserver 10.96.0.10
search default.svc.cluster.local svc.cluster.local cluster.local
options ndots:5`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Because of the search path, a Pod in namespace "default" that looks up "web" gets web.default.svc.cluster.local automatically. A Pod in another namespace has to spell it out: "web.default" (which search expands to web.default.svc.cluster.local).',
        },
      ],
    },
    {
      heading: 'Environment variables: present but not preferred',
      blocks: [
        {
          type: 'paragraph',
          text: 'The kubelet also injects environment variables for every Service that existed when the Pod started: WEB_SERVICE_HOST, WEB_SERVICE_PORT, etc. This mechanism predates cluster DNS. It only sees Services created before the Pod started, which makes it fragile for anything but static topologies. Use DNS unless you have a reason not to.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'dns-first-discovery': dnsFirstDiscovery,
  },
  labs: {},
  simulations: {},
};
