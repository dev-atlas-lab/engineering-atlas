import type { ConceptContentModule, LessonBody } from '../../types';

const theChecklist: LessonBody = {
  learningObjectives: ['Enumerate every ingredient a zero-downtime rollout requires'],
  sections: [
    {
      heading: 'Zero-downtime is a system property, not a single flag',
      blocks: [
        {
          type: 'paragraph',
          text: 'Zero-downtime deployment requires every link in the chain — Deployment strategy, probes, Service, Pod lifecycle, application code — to cooperate. Any single missing piece can produce an outage window during rollout even though every other piece is correct.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Deployment strategy — maxUnavailable: 0 (never let Ready count drop below replicas during the rollout).',
            'Readiness probe — a real `/readyz` that only returns 200 when the app can serve traffic. Not a TCP-port check on the main port.',
            'minReadySeconds — ≥ 15s so a Pod that readies-and-fails does not count as Ready for the rollout.',
            'PreStop hook with sleep 10 — gives EndpointSlice propagation time before SIGTERM.',
            'terminationGracePeriodSeconds — big enough to cover preStop sleep PLUS the slowest in-flight request.',
            'Application-level graceful shutdown — on SIGTERM, flip readiness to 503, stop accepting new connections, wait for in-flight requests, exit.',
            'Service type matches your traffic model — ClusterIP for in-cluster, LoadBalancer with externalTrafficPolicy: Local only if you can handle the uneven load.',
            'Ingress controller / LB keeps-alive settings — some LBs cache endpoints for seconds; preStop sleep must exceed that cache window.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The single most frequently forgotten item is the preStop sleep. Without it, kube-proxy on remote nodes is still routing to the Pod when SIGTERM arrives, producing a burst of connection-refused errors right at rollout time.',
        },
      ],
    },
  ],
};

const commonFailurePatterns: LessonBody = {
  learningObjectives: ['Diagnose common zero-downtime failures'],
  sections: [
    {
      heading: 'Patterns you will see',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Symptom', 'Likely cause', 'Fix'],
          rows: [
            ['Brief 502/503 bursts during rollout', 'Pods terminate before endpoints propagate', 'Add preStop sleep 10'],
            ['Latency spike at rollout start', 'New Pods are Ready before caches are warm', 'Readiness checks a /readyz that includes cache warm-up, or startup probe + slow /readyz'],
            ['ConnectionReset during rollout', 'SIGKILL before graceful shutdown finishes', 'Raise terminationGracePeriodSeconds; ensure app handles SIGTERM'],
            ['Rollout stalls with "maxUnavailable" message', 'New Pods never become Ready — readiness probe failing', 'Check `/readyz` on the new image; verify env vars, config, image'],
            ['Service brief loss of ALL endpoints', 'maxSurge=0 maxUnavailable=1 on a 1-replica Deployment', 'Scale to ≥ 2 replicas, or accept the window'],
            ['Only some requests fail during rollout', 'externalTrafficPolicy: Local and the local Pod just disappeared', 'Switch to Cluster, or ensure every node has a Pod'],
          ],
        },
      ],
    },
    {
      heading: 'Tooling hints',
      blocks: [
        {
          type: 'list',
          items: [
            '`kubectl rollout status deployment/web --watch` surfaces progress and the exact reason when it stalls.',
            'Load-generator during rollout (`hey`, `wrk`, `k6`) is the most effective verification — unit-testing the YAML will not catch endpoint-removal races.',
            'For real services, add a canary environment where you deploy and load-test before the production rollout.',
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-checklist': theChecklist,
    'common-failure-patterns': commonFailurePatterns,
  },
  labs: {},
  simulations: {},
};
