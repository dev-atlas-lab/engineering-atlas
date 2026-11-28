import type { ConceptContentModule, LessonBody } from '../../types';

const terminationSequence: LessonBody = {
  learningObjectives: [
    'Order the exact steps between kubectl delete pod and the kernel killing the last process',
    'Name the component responsible for each step',
  ],
  sections: [
    {
      heading: 'The full sequence',
      blocks: [
        {
          type: 'paragraph',
          text: 'Pod deletion is more concurrent than it looks. Several things happen in parallel from the moment the API Server records the delete.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'The deletionTimestamp is set on the Pod. Immediately, the endpoints controller removes the Pod from its EndpointSlices — but see the race note below.',
            'The kubelet observes the deletion and runs the preStop hook (if any). preStop is synchronous; termination does not continue until it returns.',
            'The kubelet sends SIGTERM to PID 1 in each container.',
            'The grace period clock (default 30s, `terminationGracePeriodSeconds`) is already running — it includes preStop and SIGTERM.',
            'When the grace period expires, if any process is still running, the kubelet sends SIGKILL, which the kernel cannot be ignored or delayed.',
            'The kubelet deletes the Pod object from the API Server (`deletionGracePeriodSeconds` reaches zero).',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'preStop eats into the grace period. If preStop sleeps 30s and the grace period is also 30s, SIGTERM has zero time before SIGKILL. Set a grace period that leaves room for both (preStop time + process shutdown time).',
        },
      ],
    },
    {
      heading: 'The endpoint-removal race',
      blocks: [
        {
          type: 'paragraph',
          text: 'Setting deletionTimestamp removes the Pod from EndpointSlices, but kube-proxy on every node must then reprogram its iptables/IPVS rules. On a large cluster this propagation takes seconds — during which clients can still send new connections to the dying Pod. If SIGTERM has already arrived, the container may reject these.',
        },
        {
          type: 'paragraph',
          text: 'The canonical fix is a preStop sleep: give proxies time to see the endpoint removal before the process stops accepting connections. 5–10 seconds is typical.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `lifecycle:
  preStop:
    exec:
      command: ["sleep", "10"]
terminationGracePeriodSeconds: 60`,
        },
      ],
    },
  ],
};

const gracefulShutdownPatterns: LessonBody = {
  learningObjectives: ['Make graceful shutdown actually work in both HTTP and worker-queue apps'],
  sections: [
    {
      heading: 'HTTP server pattern',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'preStop sleeps ~10s so EndpointSlice removal propagates.',
            'SIGTERM reaches the app. The app flips its /readyz endpoint to 503 (defensive: in case anything is still routing).',
            'The app stops accepting new connections (http.Server.Shutdown in Go, server.close in Node, etc.).',
            'In-flight requests finish within a per-request deadline.',
            'Process exits cleanly before the grace period runs out.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The container runtime sends SIGTERM to PID 1 only. If your entrypoint is a shell script that execs your binary, you need `exec` so PID 1 is your app, not the shell — otherwise the shell receives SIGTERM and your app is SIGKILLed when the grace period expires.',
        },
      ],
    },
    {
      heading: 'Worker / consumer pattern',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'SIGTERM received. Worker stops pulling new messages from the queue.',
            'In-flight message processing finishes. Any that cannot finish before the grace period should be returned to the queue (negative-ack / visibility timeout) so another worker picks them up.',
            'Process exits.',
          ],
        },
        {
          type: 'paragraph',
          text: 'There is no endpoint-removal race here because the worker is not behind a Service. The grace period only has to cover the slowest in-flight message. Measure that in production before choosing a value.',
        },
      ],
    },
    {
      heading: 'Common misconceptions',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Belief', 'Reality'],
          rows: [
            ['SIGTERM waits for the grace period to end before SIGKILL', 'SIGTERM is sent immediately; SIGKILL is only sent if the process is still alive when the grace period expires'],
            ['preStop runs after SIGTERM', 'preStop runs before SIGTERM; both happen inside the grace period'],
            ['Deleting a Pod waits for in-flight requests', 'Kubernetes does not know about in-flight requests; the application code + preStop sleep must handle them'],
            ['Grace period is per-container', 'Grace period is per-Pod; all containers share it'],
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'termination-sequence': terminationSequence,
    'graceful-shutdown-patterns': gracefulShutdownPatterns,
  },
  labs: {},
  simulations: {},
};
