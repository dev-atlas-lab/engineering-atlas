import type { ConceptContentModule, LessonBody } from '../../types';
import { ingressLifecycleScene } from '../security-scenes';

const specAndController: LessonBody = {
  learningObjectives: [
    'Describe the Ingress resource as a spec and the controller as the implementation',
    'Explain why an Ingress without a controller does nothing',
  ],
  sections: [
    {
      heading: 'Two halves',
      blocks: [
        {
          type: 'paragraph',
          text: 'An `Ingress` object is a declarative description of HTTP routing: "requests to shop.example.com/api go to Service api; requests to the same host at / go to Service web." Creating an Ingress object does not route any traffic by itself — it is just data in etcd. The runtime half is the Ingress controller: a Pod (or set of Pods) whose process watches Ingress objects and configures a proxy (NGINX, HAProxy, Envoy, Traefik) to actually route.',
        },
        {
          type: 'list',
          items: [
            'The Ingress resource sits in etcd. It names one or more controller through `spec.ingressClassName`.',
            'The controller runs as a Deployment, typically in a dedicated namespace (ingress-nginx, kong-system).',
            'An external cloud LoadBalancer (or NodePort) fronts the controller\'s Pods. External HTTPS traffic enters at this LB and is forwarded to a controller Pod, which terminates TLS and matches the Ingress rules.',
            'Backend Services are plain ClusterIP Services — the controller selects an endpoint and forwards the (now plain HTTP) request.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A common cause of "my Ingress doesn\'t work" is a cluster with no Ingress controller installed. Managed Kubernetes services typically require you to install one yourself — vanilla Kubernetes ships no controller by default.',
        },
      ],
    },
  ],
  visualization: ingressLifecycleScene,
};

const ingressVsLb: LessonBody = {
  learningObjectives: ['Compare Ingress with LoadBalancer Service for external access'],
  sections: [
    {
      heading: 'Different grain',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Property', 'LoadBalancer Service', 'Ingress'],
          rows: [
            ['Layer', 'L4 (TCP/UDP)', 'L7 (HTTP/HTTPS)'],
            ['Cloud LB count', 'One per Service', 'One per controller (shared across many Ingresses)'],
            ['Routing granularity', 'Service-level', 'Host + path'],
            ['TLS', 'Backend handles it (or LB TLS listener on cloud)', 'Controller terminates it from Kubernetes Secrets'],
            ['Cost (cloud)', 'Per Service', 'One LB for all HTTP apps'],
            ['Multi-tenant hostnames', 'Not supported', 'Core use case'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The common pattern: one Ingress controller (and one cloud LB behind it) serves every HTTP app in the cluster, while a few specialised non-HTTP services (TCP databases, UDP game servers) keep their own LoadBalancer Services.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Ingress is L7-only. For TCP or UDP passthrough with path-like routing, you\'re either into Gateway API\'s TCPRoute/UDPRoute, or a service mesh\'s L4 features, or stuck with LoadBalancer per service.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'spec-and-controller': specAndController,
    'ingress-vs-loadbalancer-svc': ingressVsLb,
  },
  labs: {},
  simulations: {},
};
