import type { ConceptContentModule, LessonBody } from '../../types';

const nodePortExposure: LessonBody = {
  learningObjectives: [
    'Explain how NodePort builds on ClusterIP',
    'Describe when NodePort is the right choice and when it is not',
  ],
  sections: [
    {
      heading: 'NodePort — ClusterIP plus a port on every node',
      blocks: [
        {
          type: 'paragraph',
          text: 'A NodePort Service is a superset of a ClusterIP Service. It still has a ClusterIP (and still works internally), but it additionally opens a fixed TCP/UDP port (typically 30000-32767) on *every* node in the cluster. Traffic to "any node IP, that port" is routed to the Service.',
        },
        {
          type: 'paragraph',
          text: 'This makes the Service reachable from outside the cluster: anything that can reach a node IP can hit the NodePort. That is often an external load balancer, a firewall rule, or a developer\'s laptop reaching a cluster on the same network.',
        },
      ],
    },
    {
      heading: 'Why it is rarely the final choice',
      blocks: [
        {
          type: 'list',
          items: [
            'The caller needs to know node IPs, and nodes come and go — someone has to keep the DNS or load-balancer target list updated.',
            'High ports (30000-32767) are often blocked by corporate firewalls and are not useful for serving traffic on well-known ports (80, 443).',
            'If you have an external load balancer, you want it in front — which is exactly what LoadBalancer Service does.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'NodePort is usually a stepping stone, not a destination. In cloud clusters it is the mechanism underneath LoadBalancer Services. For development and on-prem clusters without a load balancer, exposing a Service directly as NodePort is a valid pragmatic choice.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'nodeport-exposure': nodePortExposure,
  },
  labs: {},
  simulations: {},
};
