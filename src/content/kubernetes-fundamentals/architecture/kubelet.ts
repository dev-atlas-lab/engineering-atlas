import type { ConceptContentModule, LessonBody } from '../../types';

const responsibilities: LessonBody = {
  learningObjectives: [
    'Describe what the kubelet watches, what it commands, and what it reports',
    'Explain why the kubelet does not talk to the scheduler directly',
  ],
  sections: [
    {
      heading: 'The agent on every node',
      blocks: [
        {
          type: 'paragraph',
          text: 'The kubelet is the Kubernetes agent that runs on every node. It is the only Kubernetes component that actually causes containers to start or stop. The scheduler picks a node, the controllers decide a Pod should exist — but the kubelet is the one that tells the container runtime "pull this image, start that container, with these mounts and network settings."',
        },
        {
          type: 'list',
          items: [
            'Watches the API Server for Pods whose spec.nodeName matches its own node.',
            'For each such Pod, calls the container runtime (via CRI) to pull images and start containers.',
            'Runs liveness, readiness, and startup probes on every container.',
            'Reports Pod status, node status, and resource usage back to the API Server.',
            'Garbage-collects unused container images and dead containers.',
          ],
        },
      ],
    },
    {
      heading: 'Why not talk to the scheduler directly',
      blocks: [
        {
          type: 'paragraph',
          text: 'Everything goes through the API Server — the kubelet never calls the scheduler. The scheduler writes nodeName onto the Pod; the kubelet sees the write on its watch. This indirection means the scheduler can be down and the kubelet still works for already-assigned Pods; it means a new kubelet (or a new scheduler) can join the cluster without needing to know about the other.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The pattern "component A writes a field; component B reacts to the write" is used everywhere in Kubernetes. It is the "pub/sub through the data store" design, and it is why components can be upgraded independently: the API objects are the contract, not the RPCs.',
        },
      ],
    },
  ],
};

const probesAndLifecycle: LessonBody = {
  learningObjectives: ['Describe how liveness, readiness, and startup probes shape Pod lifecycle'],
  sections: [
    {
      heading: 'Three probes, three different jobs',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Probe', 'What it decides', 'What happens on failure'],
          rows: [
            ['Liveness', 'Is the container healthy enough to keep running?', 'kubelet kills and restarts the container'],
            ['Readiness', 'Is the container ready to serve traffic?', 'Pod is removed from Service Endpoints; no restart'],
            ['Startup', 'Has the container finished starting?', 'Delays the other probes until it succeeds; failure kills the container'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Confusing liveness and readiness is a classic bug. A liveness probe that fires during a slow startup will kill the container repeatedly before it ever becomes ready — a "CrashLoopBackOff" that is actually "I am slow to start, and you kill me every time I\'m about to work." Startup probes exist specifically to avoid this.',
        },
      ],
    },
    {
      heading: 'The Pod phase field',
      blocks: [
        {
          type: 'paragraph',
          text: 'The kubelet is also what updates pod.status.phase. The phases are Pending (scheduled but not yet all containers running), Running (at least one container is running), Succeeded (all containers finished with exit code 0, only applies to one-shot workloads), Failed (at least one container exited non-zero and will not restart), Unknown (the kubelet could not be reached).',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'kubelet-responsibilities': responsibilities,
    'probes-and-pod-lifecycle': probesAndLifecycle,
  },
  labs: {},
  simulations: {},
};
