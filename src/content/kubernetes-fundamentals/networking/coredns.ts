import type { ConceptContentModule, LessonBody } from '../../types';

const coreDnsRole: LessonBody = {
  learningObjectives: ['Describe the role of CoreDNS as the cluster DNS server'],
  sections: [
    {
      heading: 'CoreDNS — a regular Deployment that happens to be DNS',
      blocks: [
        {
          type: 'paragraph',
          text: 'CoreDNS is just a Deployment running the open-source CoreDNS server, exposed as a ClusterIP Service in the kube-system namespace. Pods are configured to use this Service as their DNS resolver. There is no special plumbing — CoreDNS is a workload, like everything else, that happens to be the one that answers DNS queries.',
        },
        {
          type: 'paragraph',
          text: 'CoreDNS watches the API Server for Services and Pods. When a Service is created or deleted, CoreDNS\'s in-memory records are updated within seconds. A query from a Pod hits one of the CoreDNS replicas, which answers from its in-memory view of the cluster. Queries for names outside cluster.local (e.g. google.com) are forwarded upstream to the configured external resolver.',
        },
      ],
    },
  ],
};

const resolvingAService: LessonBody = {
  learningObjectives: ['Resolve a Service name step by step, from a Pod to a backing Pod IP'],
  sections: [
    {
      heading: 'End-to-end lookup',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'A Pod in namespace "default" runs `curl http://web`.',
            '/etc/resolv.conf points at 10.96.0.10 (the CoreDNS Service ClusterIP) with search paths.',
            'The resolver sends a DNS query for "web" to 10.96.0.10. kube-proxy rules on the node DNAT it to one of the CoreDNS Pod IPs.',
            'CoreDNS applies the search path: "web.default.svc.cluster.local". It knows about this Service (from its API Server watch) and answers with the Service\'s ClusterIP.',
            'The Pod opens a TCP connection to that ClusterIP. kube-proxy rules DNAT that to one of the backing Pods for the "web" Service.',
            'The backing Pod sees an incoming request; the response takes the reverse path.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The "ndots: 5" option in /etc/resolv.conf means names with fewer than 5 dots are tried against the search paths first — a cost-amplifier in DNS-heavy workloads because each name generates several queries. Fully-qualified names ("web.default.svc.cluster.local.", trailing dot) skip the search path and halve the DNS traffic.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'coredns-role': coreDnsRole,
    'resolving-a-service': resolvingAService,
  },
  labs: {},
  simulations: {},
};
