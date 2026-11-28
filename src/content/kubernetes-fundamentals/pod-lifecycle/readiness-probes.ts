import type { ConceptContentModule, LessonBody } from '../../types';

const readinessAndEndpoints: LessonBody = {
  learningObjectives: [
    'Explain how readiness drives Service endpoint membership',
    'Describe the kube-proxy path from readiness flip to actual traffic change',
  ],
  sections: [
    {
      heading: 'Readiness toggles traffic, not life',
      blocks: [
        {
          type: 'paragraph',
          text: 'A readiness probe decides whether a Pod is included in the EndpointSlice of its Services. When the probe passes the configured `successThreshold`, the Pod\'s Ready condition flips to True and the endpoints controller adds its IP to the EndpointSlice. When it fails `failureThreshold` times, the Pod flips to Ready=False and the IP is removed. The container is never killed.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'kubelet runs the readiness probe against the container.',
            'kubelet updates the Pod status (Ready condition).',
            'The endpoints (or endpointslice) controller watches Pods and updates the matching EndpointSlice objects.',
            'kube-proxy on every node watches EndpointSlices and reprograms iptables/IPVS rules.',
            'New connections stop (or start) landing on the Pod.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Readiness only affects new connections. In-flight TCP connections to the Pod are not broken when readiness flips to False — this is why graceful shutdown still needs a preStop hook plus an in-process drain, not just readiness.',
        },
      ],
    },
    {
      heading: 'readinessGates: adding your own gate',
      blocks: [
        {
          type: 'paragraph',
          text: 'By default the Ready condition is driven by ContainersReady AND all readiness probes. You can add additional PodReadinessGates — a list of condition types that must also be True. External controllers (e.g. a cloud-LB controller that waits until a Pod is registered in the LB backend) use this to delay the Ready flip until their own work is done.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `spec:
  readinessGates:
    - conditionType: "cloud.aws/load-balancer-pod-ready"`,
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'readiness-kc-1',
      type: 'single-choice',
      prompt: 'A Pod\'s readiness probe starts failing. What happens to in-flight HTTP requests already being served by that Pod?',
      difficulty: 'advanced',
      learningObjective: 'Explain how readiness drives Service endpoint membership',
      options: [
        { id: 'a', label: 'They continue to completion — readiness only prevents new connections', correct: true, explanation: 'Correct. Endpoint removal stops new DNAT rules from pointing here; it does not break TCP connections already established.' },
        { id: 'b', label: 'The kubelet cancels them by sending TCP RST', correct: false, explanation: 'The kubelet does not interfere with existing connections on readiness failure.' },
        { id: 'c', label: 'They get retried on another Pod', correct: false, explanation: 'Only if the client retries; Kubernetes itself does not retry application traffic.' },
      ],
    },
  ],
};

const whenToPickReadiness: LessonBody = {
  learningObjectives: ['Pick the right probe kind for a given failure mode'],
  sections: [
    {
      heading: 'The decision rule',
      blocks: [
        {
          type: 'paragraph',
          text: 'For any failure signal, ask: "would restarting this Pod fix the problem?" If yes, it is a liveness probe candidate. If no — restarting would do nothing or make things worse — it is a readiness probe candidate.',
        },
        {
          type: 'comparisonTable',
          headers: ['Signal', 'Pick', 'Why'],
          rows: [
            ['App has deadlocked on a goroutine / thread', 'Liveness', 'Restart genuinely clears the state'],
            ['Database connection pool is exhausted', 'Readiness', 'Removing the Pod from LB relieves pressure; restart would just reconnect to the same DB'],
            ['Dependent downstream API is down', 'Readiness (or no probe)', 'Restart will not bring the downstream back'],
            ['In-memory cache warming up after start', 'Readiness, gated by a startup probe', 'Takes traffic only once ready; startup suppresses liveness until warm'],
            ['Node clock skew exceeds tolerance', 'Neither — alert instead', 'Not an app-level condition'],
          ],
        },
      ],
    },
    {
      heading: 'The "no probe at all" answer',
      blocks: [
        {
          type: 'paragraph',
          text: 'If a container cannot articulate a meaningful health check beyond "my process is still running", Kubernetes already gets that signal from the kernel reporting the process exited. Adding a trivial probe (TCP to the main port, HTTP to /) adds complexity without new information. A probe is only valuable when it reflects real application readiness.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A readiness probe that checks `TCP port 80` on an HTTP server says almost nothing — the port is listening before the app can serve a request. Use httpGet with a real `/readyz` endpoint the application owns.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'readiness-and-endpoints': readinessAndEndpoints,
    'when-to-pick-readiness': whenToPickReadiness,
  },
  labs: {},
  simulations: {},
};
