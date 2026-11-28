import type { ConceptContentModule, LessonBody } from '../../types';
import { gatewayApiScene } from '../security-scenes';

const threeResources: LessonBody = {
  learningObjectives: [
    'Enumerate the three Gateway API resources and their owners',
    'Describe the parentRefs/backendRefs attachment model',
  ],
  sections: [
    {
      heading: 'Three resources, three audiences',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Resource', 'Scope', 'Typical owner', 'Analog in Ingress'],
          rows: [
            ['GatewayClass', 'Cluster', 'Infrastructure (controller vendor)', 'Controller choice (ingressClassName)'],
            ['Gateway', 'Namespace', 'Platform team', 'Ingress controller\'s Service + listener'],
            ['HTTPRoute (and TCPRoute, TLSRoute, GRPCRoute)', 'Namespace', 'Application team', 'Ingress rules'],
          ],
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata: { name: public-https, namespace: platform }
spec:
  gatewayClassName: envoy
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    tls: { certificateRefs: [{ name: wildcard-cert }] }
    allowedRoutes: { namespaces: { from: Selector, selector: { matchLabels: { gateway-tenant: "true" } } } }
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: { name: shop, namespace: shop-prod }
spec:
  parentRefs: [{ name: public-https, namespace: platform }]
  hostnames: [shop.example.com]
  rules:
  - matches: [{ path: { type: PathPrefix, value: /api } }]
    backendRefs: [{ name: api, port: 8080 }]`,
        },
      ],
    },
    {
      heading: 'parentRefs and backendRefs',
      blocks: [
        {
          type: 'list',
          items: [
            'parentRefs — an HTTPRoute attaches to one or more Gateways. The Gateway\'s `allowedRoutes` policy decides whether the attachment is accepted.',
            'backendRefs — the Service (or another supported backend kind) the rule forwards to. Multiple backendRefs give weight-based traffic splitting natively — no annotation needed.',
            'The attachment is bidirectional: the Gateway opts in to which route-owning namespaces may attach, and each HTTPRoute opts in to which Gateway it attaches to. Neither side can impose attachment unilaterally.',
          ],
        },
      ],
    },
  ],
  visualization: gatewayApiScene,
};

const whyReplaceIngress: LessonBody = {
  learningObjectives: ['Explain why Gateway API replaces Ingress'],
  sections: [
    {
      heading: 'Ingress became "annotation soup"',
      blocks: [
        {
          type: 'paragraph',
          text: 'Ingress v1 has rules, hosts, paths — and nothing else. Every production feature (header rewriting, retries, rate limits, canary weights, TLS modes) has been bolted on through annotations, each unique to one controller. An Ingress for ingress-nginx is not portable to Contour; the "same" YAML works differently or not at all.',
        },
        {
          type: 'paragraph',
          text: 'Gateway API fixes this with first-class types. HTTPRoute has explicit fields for weighted backends, header matching, request filters, URL rewrites, timeouts, and retries. Specialised Route kinds (TLSRoute, TCPRoute, UDPRoute, GRPCRoute) handle protocols Ingress could not express at all.',
        },
        {
          type: 'list',
          items: [
            'Role-oriented: controller vendor, platform admin, app developer each own distinct resources.',
            'Portable: HTTPRoute\'s fields are standardised. A supported controller behaves the same.',
            'Extensible: filters are pluggable; ExtensionRef points at a controller-specific object only when truly necessary.',
            'Multi-protocol: TCP, UDP, TLS, gRPC are first-class — Ingress never got there.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Ingress is not deprecated and will keep working for the foreseeable future. Gateway API is additive; adopt it when you need cross-team ownership or features Ingress cannot express. New projects frequently start with Gateway API even if the controller also supports Ingress.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'three-resources': threeResources,
    'why-replace-ingress': whyReplaceIngress,
  },
  labs: {},
  simulations: {},
};
