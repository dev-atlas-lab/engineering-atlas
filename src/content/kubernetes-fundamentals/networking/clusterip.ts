import type { ConceptContentModule, LessonBody } from '../../types';

const whatClusterIpIs: LessonBody = {
  learningObjectives: [
    'Explain where a ClusterIP is reachable from and where it is not',
    'Trace a request from one Pod to a ClusterIP down to a backing Pod',
  ],
  sections: [
    {
      heading: 'The default Service type',
      blocks: [
        {
          type: 'paragraph',
          text: 'A ClusterIP Service is reachable from inside the cluster — from any Pod, and from any node — but not from outside it. Its IP is drawn from a special range (serviceCidr) that is routable only within the cluster. This is the default because most Services are internal: one microservice calling another, a web frontend calling an API tier.',
        },
      ],
    },
    {
      heading: 'What happens on the wire',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'A Pod on node X sends a packet to 10.96.5.17 (the Service\'s ClusterIP).',
            'On node X, iptables/IPVS rules programmed by kube-proxy intercept packets to 10.96.5.17.',
            'The rules DNAT the packet: destination IP is rewritten from 10.96.5.17 to one of the Service\'s current Endpoint IPs — a real Pod IP, picked round-robin.',
            'The packet is routed to that Pod, wherever it is in the cluster (CNI handles the inter-node hop).',
            'Response packets get the DNAT reversed on the way back, so the source Pod sees them as coming from 10.96.5.17.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'No userspace proxy sits in the middle. kube-proxy only programs the kernel rules; the kernel does the work. This is why Services add almost no latency and no per-byte cost.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-clusterip-is': whatClusterIpIs,
  },
  labs: {},
  simulations: {},
};
