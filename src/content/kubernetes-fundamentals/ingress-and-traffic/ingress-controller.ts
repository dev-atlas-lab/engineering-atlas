import type { ConceptContentModule, LessonBody } from '../../types';

const whatTheControllerDoes: LessonBody = {
  learningObjectives: [
    'Describe the two concurrent loops a controller runs',
    'Explain how template-based controllers (nginx) differ from config-API ones (envoy)',
  ],
  sections: [
    {
      heading: 'Watch, compile, reload',
      blocks: [
        {
          type: 'paragraph',
          text: 'An Ingress controller has two concurrent responsibilities: watch the Kubernetes API for changes to Ingress, Service, EndpointSlice, and Secret objects; and run a proxy process (NGINX, HAProxy, Envoy) that handles actual traffic. Changes in the watched objects trigger a compile step — translating the current state into the proxy\'s config format — followed by a reload.',
        },
        {
          type: 'list',
          items: [
            'NGINX / HAProxy controllers: write a configuration file to disk, then signal the proxy to reload. Simpler but every reload is disruptive to long-lived connections.',
            'Envoy-based controllers (Contour, ingress-controller, Istio\'s): push configuration to Envoy over xDS. Envoy applies deltas without dropping connections.',
            'Both watch Service AND EndpointSlice: the Service tells them which backend exists; the EndpointSlice tells them the actual Pod IPs to forward to. Advanced controllers bypass the Service\'s ClusterIP and load-balance directly to endpoints for lower latency.',
          ],
        },
      ],
    },
    {
      heading: 'High availability',
      blocks: [
        {
          type: 'paragraph',
          text: 'The controller is a critical path — if it crashes, every HTTP app behind it loses traffic. Standard HA pattern: multiple replicas, usually 3+, spread across zones; a cloud LoadBalancer Service in front; PodDisruptionBudget to protect it from drains.',
        },
      ],
    },
  ],
};

const controllerComparison: LessonBody = {
  learningObjectives: ['Compare the common Ingress controllers architecturally'],
  sections: [
    {
      heading: 'Four common choices',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Controller', 'Proxy', 'Config model', 'Signature feature'],
          rows: [
            ['ingress-nginx', 'NGINX', 'Template + reload', 'Widely deployed, large community'],
            ['HAProxy Ingress', 'HAProxy', 'Template + reload', 'HAProxy ecosystem, strong TCP/UDP'],
            ['Traefik', 'Traefik', 'Dynamic config updates', 'CRDs for advanced routing, auto-ACME'],
            ['Contour', 'Envoy', 'xDS to Envoy', 'HTTPProxy CRD — richer than Ingress'],
            ['Kong', 'NGINX + Lua', 'DB or declarative', 'Plugins (auth, rate-limit, transform)'],
            ['Istio Gateway', 'Envoy', 'xDS to Envoy', 'Integrated with the mesh'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The choice usually follows the mesh: if you run Istio, use Istio Gateway; otherwise ingress-nginx is a safe default. Avoid running two Ingress controllers for the same hostnames — pick one as the entry point for each external domain.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-the-controller-does': whatTheControllerDoes,
    'controller-comparison': controllerComparison,
  },
  labs: {},
  simulations: {},
};
