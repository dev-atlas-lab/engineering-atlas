import type { ConceptContentModule, LessonBody } from '../../types';

const cardinalConvention: LessonBody = {
  learningObjectives: [
    'Define north-south and east-west traffic',
    'Describe which components handle each',
  ],
  sections: [
    {
      heading: 'A spatial metaphor from datacenter networking',
      blocks: [
        {
          type: 'paragraph',
          text: 'Think of a datacenter diagram with the outside world at the top. "North-south" traffic goes up or down — into the cluster from external clients, or out to an external service. "East-west" traffic goes sideways — one Pod talking to another inside the cluster. The two carry different concerns and are usually handled by different components.',
        },
        {
          type: 'comparisonTable',
          headers: ['Direction', 'Example', 'Primary components'],
          rows: [
            ['North-south ingress', 'Browser → shop.example.com → API Pod', 'Cloud LB, Ingress controller, Service, kube-proxy'],
            ['North-south egress', 'Pod → external API, Pod → S3', 'Pod → node SNAT → internet; optionally egress gateway, NAT gateway'],
            ['East-west', 'orders Pod → inventory Pod', 'Service (ClusterIP), kube-proxy, CNI, optional service mesh'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The reason the distinction matters: observability, TLS, and policy tooling are often split along this axis. North-south traffic hits the Ingress (good place for WAF, rate-limit, TLS termination); east-west hits the service mesh (good place for mTLS, retries, inter-service auth).',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'A request\'s classification can shift mid-flight. A browser hits the cluster (north-south), which internally fans out to five Pods (east-west). Observability must stitch these together — distributed tracing is the usual tool.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-cardinal-convention': cardinalConvention,
  },
  labs: {},
  simulations: {},
};
