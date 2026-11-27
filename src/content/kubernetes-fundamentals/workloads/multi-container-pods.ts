import type { ConceptContentModule, LessonBody } from '../../types';

const sidecarAndInit: LessonBody = {
  learningObjectives: [
    'Identify the sidecar, init, and adapter patterns',
    'Describe when multiple containers belong in one Pod',
  ],
  sections: [
    {
      heading: 'Three common patterns',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Pattern', 'What it does', 'Example'],
          rows: [
            ['Sidecar', 'Runs alongside the main container for the Pod\'s whole lifetime; augments or supports it', 'A log-shipping agent reading the main container\'s log files; an envoy proxy intercepting its traffic'],
            ['Init container', 'Runs to completion before the main containers start; blocks startup until it succeeds', 'Wait for a dependency to be reachable; set up a config file; run a database migration'],
            ['Adapter', 'Sidecar that transforms the main container\'s output into a different format', 'A sidecar that scrapes the main container\'s custom metrics and exposes them in Prometheus format'],
            ['Ambassador', 'Sidecar that mediates the main container\'s connection to the outside', 'A sidecar that holds a connection pool to a database, so the main container talks to localhost instead'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Kubernetes 1.29 made "sidecar containers" a first-class concept with their own startup/shutdown ordering guarantees (restartPolicy: Always on an init container). Before that, sidecars were just regular containers in the pod spec and had to tolerate the fact that there was no ordering guarantee between them and the main container.',
        },
      ],
    },
    {
      heading: 'When multiple containers do NOT belong in one Pod',
      blocks: [
        {
          type: 'paragraph',
          text: 'The temptation is to put everything related into one Pod. Resist it. Containers in the same Pod are always co-scheduled and co-scaled — you cannot scale them independently. If service B serves 10× the traffic of service A, they should not be in the same Pod, because every replica will include both regardless of what each actually needs.',
        },
        {
          type: 'list',
          items: [
            '"These two services talk to each other" — not enough reason. Use separate Pods and a Service.',
            '"These two services are developed by the same team" — not a reason at all.',
            '"Scaling one requires scaling the other at the same rate" — this is a real reason to co-locate.',
            '"One must be local to the other for performance (shared memory, localhost traffic)" — a real reason.',
            '"One cannot start until the other is ready" — init container pattern, same Pod.',
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'sidecar-and-init': sidecarAndInit,
  },
  labs: {},
  simulations: {},
};
