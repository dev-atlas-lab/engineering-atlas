import type { ConceptContentModule, LessonBody } from '../../types';

const whyStartupExists: LessonBody = {
  learningObjectives: [
    'Explain the specific failure mode startup probes exist to prevent',
    'Describe the handoff from startup to the other two probes',
  ],
  sections: [
    {
      heading: 'The slow-boot problem startup solves',
      blocks: [
        {
          type: 'paragraph',
          text: 'Before Kubernetes 1.16, the only way to delay liveness for a slow-starting app was `initialDelaySeconds` on the liveness probe itself. This was always a guess — if the app usually took 30s but occasionally took 90s (JVM warmup, cache hydration), liveness would kill it. The startup probe was introduced as a separate, probe-shaped guard that completely suspends liveness and readiness while it runs.',
        },
        {
          type: 'list',
          items: [
            'Startup is evaluated by the kubelet first, on every tick.',
            'While startup has not yet succeeded `successThreshold` times, liveness and readiness are not run at all.',
            'Once startup succeeds, the kubelet stops running it (it is not re-evaluated for the life of the container) and switches to liveness + readiness.',
            'If startup fails `failureThreshold` times, the kubelet kills the container per restartPolicy — this is the only lethal signal a startup probe generates.',
          ],
        },
      ],
    },
    {
      heading: 'Why not just a long initialDelay?',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Approach', 'Behavior', 'Problem'],
          rows: [
            ['liveness.initialDelaySeconds = 120', 'Liveness is suspended for exactly 120s, then starts', 'Fast boots still wait 120s before becoming detectable as dead; slow boots > 120s still get killed'],
            ['startup probe with failureThreshold = 30, periodSeconds = 10', 'Container can take up to 300s to start; as soon as it is up, liveness activates', 'Adapts to how long startup actually took'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The maximum startup time a startup probe tolerates is approximately failureThreshold * periodSeconds. Set failureThreshold generously — it only costs time when startup is actually failing.',
        },
      ],
    },
  ],
};

const startupConfiguration: LessonBody = {
  learningObjectives: ['Configure the three probes so they co-exist cleanly'],
  sections: [
    {
      heading: 'The pattern that works',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          code: `startupProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 30
  periodSeconds: 10          # allow up to 5 minutes to boot

livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet: { path: /readyz, port: 8080 }
  periodSeconds: 5
  failureThreshold: 3`,
        },
        {
          type: 'list',
          items: [
            'Startup usually targets the same endpoint as liveness — a single app-provided /healthz that returns 200 once the process is initialised.',
            'Readiness targets a separate /readyz that also considers dependency warm-up (cache, connection pools). This is the distinction most apps need.',
            'Keep periodSeconds short on readiness so the Pod joins endpoints quickly after it recovers.',
            'successThreshold must be 1 for startup and liveness; it can be higher for readiness so an in-flight blip does not re-add a Pod that is still flapping.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A startup probe that is weaker than the liveness probe (less strict path, shorter timeout) can let the container through to liveness, where it is then immediately killed. Keep the startup endpoint at least as strict.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'why-startup-exists': whyStartupExists,
    'startup-configuration': startupConfiguration,
  },
  labs: {},
  simulations: {},
};
