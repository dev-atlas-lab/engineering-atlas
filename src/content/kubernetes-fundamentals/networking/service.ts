import type { ConceptContentModule, LessonBody } from '../../types';
import { serviceNetworkingScene } from '../scenes';

const serviceAbstraction: LessonBody = {
  learningObjectives: [
    'Explain the problem Services solve — Pods are ephemeral, their IPs change',
    'Describe what a Service provides on top of Pod networking',
  ],
  sections: [
    {
      heading: 'Pods are cattle. Services are their address.',
      blocks: [
        {
          type: 'paragraph',
          text: 'Pods come and go. Their IPs are not stable — a restart gives a Pod a new IP; a Deployment rolling update replaces every Pod with a new one. If service A hardcoded the IPs of service B\'s Pods, every restart of B would break A. The Service abstraction fixes this: you give a Service a stable name and a stable virtual IP, and the control plane keeps the set of backing Pods up to date automatically.',
        },
        {
          type: 'list',
          items: [
            'Stable ClusterIP: a virtual IP that does not change for the Service\'s lifetime, even as its backing Pods churn.',
            'Stable DNS name: web.default.svc.cluster.local resolves to that ClusterIP from inside the cluster.',
            'Load balancing: traffic to the ClusterIP is spread across the current set of healthy backing Pods.',
            'A level of indirection that turns Pod churn from a caller\'s problem into the control plane\'s problem.',
          ],
        },
      ],
    },
  ],
  visualization: serviceNetworkingScene,
};

const endpointsAndSelectors: LessonBody = {
  learningObjectives: ['Describe how a Service finds its backing Pods via label selector'],
  sections: [
    {
      heading: 'Selector ↔ Pod labels',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Service has a selector (e.g. app=web). The Endpoints controller watches both the Service and all Pods. For every Pod whose labels match the selector *and* that is ready, its IP is added to the Service\'s Endpoints (or EndpointSlice) object. kube-proxy reads EndpointSlices on every node and programs load-balancing rules.',
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'A Service with a selector',
          code: `apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'EndpointSlice replaced the single Endpoints object at scale: a Service with 2000 Pods used to produce one giant Endpoints object that every kube-proxy had to re-fetch on every change. EndpointSlice splits it into shards (up to 100 endpoints each by default) so changes are localized. The "Endpoints" object still exists for compatibility; EndpointSlice is what actually drives routing on modern clusters.',
        },
      ],
    },
    {
      heading: 'Readiness matters',
      blocks: [
        {
          type: 'paragraph',
          text: 'Only Pods with Ready=true appear in a Service\'s EndpointSlice. This is how readiness probes drain traffic: a Pod that starts failing its readiness probe is removed from Endpoints within seconds, without any pod deletion. The Service stops sending traffic to it until it reports ready again. This is the mechanism that lets rolling updates be safe.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'service-kc-1',
      type: 'single-choice',
      prompt: 'A Service has selector app=web. A Pod with label app=web starts failing its readiness probe. What happens to Service traffic for that Pod?',
      difficulty: 'intermediate',
      learningObjective: 'Describe how a Service finds its backing Pods via label selector',
      options: [
        { id: 'a', label: 'The Pod is removed from the Service\'s EndpointSlice; kube-proxy on every node stops sending it traffic', correct: true, explanation: 'Correct. Readiness is the knob for draining traffic from a Pod without deleting it.' },
        { id: 'b', label: 'The Pod is deleted and recreated', correct: false, explanation: 'Readiness failure does not delete a Pod; only liveness failure does that.' },
        { id: 'c', label: 'Nothing — Services ignore readiness', correct: false, explanation: 'This is the opposite of what happens.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'service-abstraction': serviceAbstraction,
    'endpoints-and-selectors': endpointsAndSelectors,
  },
  labs: {},
  simulations: {},
};
