import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { ingressRoutingSimulation } from '../security-simulations';
import { renderIngressState } from '../security-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const hostAndPath: LessonBody = {
  learningObjectives: [
    'Match requests to rules by Host header and path',
    'Distinguish Prefix from Exact path matching',
  ],
  sections: [
    {
      heading: 'An Ingress is a short list of rules',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
spec:
  ingressClassName: nginx
  tls:
  - hosts: [shop.example.com]
    secretName: shop-tls
  rules:
  - host: shop.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend: { service: { name: api, port: { number: 8080 } } }
      - path: /
        pathType: Prefix
        backend: { service: { name: web, port: { number: 80 } } }`,
        },
        {
          type: 'list',
          items: [
            'host — matched against the HTTP Host header (SNI for TLS). Omitted host matches any.',
            'path — the HTTP request path. Matched per pathType.',
            'pathType — Prefix (match this prefix followed by / or end of string), Exact (full-path match), ImplementationSpecific (legacy, controller-dependent).',
            'backend — the Service and port to forward to. The Service must exist and have Ready endpoints or the request returns 503.',
          ],
        },
      ],
    },
    {
      heading: 'Prefix has an exact-segment rule',
      blocks: [
        {
          type: 'paragraph',
          text: 'pathType: Prefix matches whole path segments. `/api` matches `/api`, `/api/orders`, `/api/`. It does NOT match `/apiculture` — the match must end on a segment boundary. This is a frequent misunderstanding.',
        },
      ],
    },
  ],
};

const rulePrecedence: LessonBody = {
  learningObjectives: ['Resolve ambiguous rule matches'],
  sections: [
    {
      heading: 'Longest prefix wins; Exact beats Prefix',
      blocks: [
        {
          type: 'paragraph',
          text: 'When multiple rules on the same host could match, the specification says:',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'An Exact match wins over any Prefix match for the same path.',
            'Among Prefix matches, the longest match wins.',
            'If ties remain, controller-specific rules decide — most use the alphabetic ordering of the paths, but don\'t rely on this.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Example: rules `/api` (Prefix), `/` (Prefix), and `/api/orders` (Exact). For `/api/orders` the Exact wins; for `/api/customers` the longest Prefix (`/api`) wins; for `/products` only `/` matches.',
        },
      ],
    },
    {
      heading: 'No match → 404',
      blocks: [
        {
          type: 'paragraph',
          text: 'If no rule matches, the controller typically returns 404 Not Found. Some controllers (nginx) allow a `default-backend` to catch unmatched requests — useful for a friendly error page but can hide misconfiguration. Missing-rule 404s look identical to missing-path 404s; always check `kubectl get ingress` first when debugging.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'ingress-kc-1',
      type: 'single-choice',
      prompt: 'An Ingress has two rules for host shop.example.com: `/api` (Prefix) → api Service, and `/` (Prefix) → web Service. A request arrives at `/api/orders`. Which backend handles it?',
      difficulty: 'intermediate',
      learningObjective: 'Resolve ambiguous rule matches',
      options: [
        { id: 'a', label: 'api Service — `/api` is the longer matching prefix', correct: true, explanation: 'Correct. Both rules match, but the longer prefix wins.' },
        { id: 'b', label: 'web Service — the first rule listed', correct: false, explanation: 'Ordering by appearance in the YAML is not the tiebreaker.' },
        { id: 'c', label: '404 — ambiguous', correct: false, explanation: 'The spec defines a deterministic tiebreaker (longest prefix, Exact first).' },
      ],
    },
  ],
};

const ingressLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Send simulated HTTPS and HTTP requests to a shared Ingress controller. Observe host/path matching, TLS termination, and the distinctive error codes for missing rules vs unhealthy backends.',
  learningObjectives: [
    'See longest-prefix matching decide between competing rules',
    'See 404 vs 502 vs 503 come from different failure modes',
    'See TLS misconfiguration surface as an application-visible error',
  ],
  prerequisites: [
    { type: 'knowledge', label: 'Ingress architecture', description: 'Read the controller lesson first.' },
  ],
  content: {
    simulationId: 'ingress-routing-simulator',
    instructions: [
      { id: 'step-1', label: 'Baseline route', description: 'host=shop.example.com, path=/api/orders, HTTPS, TLS enabled. api Service is healthy — expect 200 via rule /api.' },
      { id: 'step-2', label: 'Longest-prefix tiebreaker', description: 'Switch path to /products — no /api rule, falls through to / (web). Still 200.' },
      { id: 'step-3', label: 'No rule matches', description: 'Switch host to other.example.com. 404 at the controller; backend untouched.' },
      { id: 'step-4', label: 'Unhealthy backend', description: 'Set api backend has Ready endpoints = false. 502 Bad Gateway — rule matches but no endpoint to forward to.' },
      { id: 'step-5', label: 'Missing TLS cert', description: 'Disable TLS and send HTTPS. 421 Misdirected Request — no cert for this host.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'deterministic',
        label: 'Every request yields a deterministic response code',
        check: (state) => {
          const s = state as { decision: { responseCode: number } | null };
          return s.decision === null || (s.decision.responseCode >= 100 && s.decision.responseCode < 600);
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'host-and-path': hostAndPath,
    'rule-precedence': rulePrecedence,
  },
  labs: {
    'ingress-routing-simulator': ingressLab,
  },
  simulations: {
    'ingress-routing-simulator': bindSimulation(ingressRoutingSimulation, renderIngressState),
  },
};
