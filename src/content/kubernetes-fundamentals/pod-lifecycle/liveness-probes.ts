import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { probeExecutionScene } from '../operations-scenes';
import { podHealthSimulation } from '../operations-simulations';
import { renderPodHealthState } from '../operations-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const whatLivenessDetects: LessonBody = {
  learningObjectives: [
    'State what a liveness probe is for and when it is harmful',
    'Describe the kubelet-driven execution loop',
  ],
  analogy:
    'Think of liveness like a watchdog timer on embedded hardware: it detects a stuck process and resets the machine. It does not tell the process to work harder; it tells the kubelet to kill and restart.',
  sections: [
    {
      heading: 'Liveness is a restart trigger',
      blocks: [
        {
          type: 'paragraph',
          text: 'A liveness probe is a question the kubelet asks a container on a configured schedule: "are you still alive?" When the answer is no for `failureThreshold` consecutive checks, the kubelet kills the container and starts a new one per the Pod\'s restartPolicy. It is a last resort for deadlocked or hung applications — not a general health check.',
        },
        {
          type: 'list',
          items: [
            'httpGet — kubelet performs an HTTP GET against a path/port on the container\'s IP. 2xx or 3xx is success; 4xx/5xx or timeout is failure.',
            'tcpSocket — kubelet opens a TCP connection; success means it was accepted.',
            'exec — kubelet runs a command inside the container; exit 0 is success.',
            'grpc — kubelet calls the standard gRPC health-checking service; SERVING is success. Added in 1.24.',
          ],
        },
        {
          type: 'code',
          language: 'yaml',
          code: `livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 20
  periodSeconds: 10
  timeoutSeconds: 1
  failureThreshold: 3`,
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A liveness probe that fails during slow startup kills the container before it can serve anything. That is what startup probes exist to prevent — never set initialDelaySeconds hoping it covers startup. Use a startup probe.',
        },
      ],
    },
    {
      heading: 'What liveness should NOT detect',
      blocks: [
        {
          type: 'list',
          items: [
            'Dependency health. If liveness checks that the database is up, every container restarts when the database blinks — a thundering herd that often makes recovery slower.',
            'Transient slowness. Timeouts under GC pauses or traffic spikes trigger restarts that just create more traffic on fewer Pods.',
            '"Is the app ready for traffic?" — that is readiness, and the correct action is to stop routing to this Pod, not to restart it.',
          ],
        },
      ],
    },
  ],
  visualization: probeExecutionScene,
  knowledgeCheck: [
    {
      id: 'liveness-kc-1',
      type: 'single-choice',
      prompt: 'An application is slow to recover during a database outage. Teams add a liveness probe that calls the database. The outage now causes rolling restarts across every replica. Why?',
      difficulty: 'intermediate',
      learningObjective: 'State what a liveness probe is for and when it is harmful',
      options: [
        { id: 'a', label: 'Liveness probes should check the container itself; coupling them to external dependencies amplifies outages', correct: true, explanation: 'Correct. When every replica fails liveness at the same time, every replica restarts — making the outage worse and not resolving the cause.' },
        { id: 'b', label: 'Liveness probes are not supposed to make HTTP calls to anything', correct: false, explanation: 'HTTP is fine — the mistake is the probe targeting a shared dependency.' },
        { id: 'c', label: 'The failureThreshold is too high', correct: false, explanation: 'Even with failureThreshold tuned, the probe is semantically wrong.' },
      ],
    },
  ],
};

const tuningLiveness: LessonBody = {
  learningObjectives: ['Tune probe fields so a slow-but-healthy container does not get restarted'],
  sections: [
    {
      heading: 'The six fields that matter',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Field', 'Default', 'What it controls', 'Tuning hint'],
          rows: [
            ['initialDelaySeconds', '0', 'Seconds after container start before the first check', 'Prefer a startup probe; keep initialDelay small'],
            ['periodSeconds', '10', 'How often to check after the first', 'Tight loop (1–5s) for fast apps; 30s+ for expensive probes'],
            ['timeoutSeconds', '1', 'Per-check network timeout', 'Raise if the check calls DB/cache; a 1s timeout is often too tight'],
            ['failureThreshold', '3', 'Consecutive failures that constitute "down"', 'At least 3; one blip should never restart the container'],
            ['successThreshold', '1', 'Consecutive successes needed after a failure to recover', 'Must be 1 for liveness; the API Server enforces this'],
            ['terminationGracePeriodSeconds', 'Pod grace period', 'Grace period when probe failure triggers a kill', 'Lower this if liveness must kill fast after deadlock'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Time-to-restart is roughly initialDelaySeconds + (failureThreshold - 1) * periodSeconds + timeoutSeconds. With defaults that is ~21s — set expectations accordingly in your alert runbooks.',
        },
      ],
    },
  ],
};

const livenessLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '15 minutes',
  description:
    'Configure startup, liveness, and readiness probes against a container whose startup time, failure point, and probe thresholds you control. Watch the kubelet drive restart and endpoint-membership decisions.',
  learningObjectives: [
    'Observe how each probe kind drives a different effect',
    'See how startup probes prevent liveness from killing a slow boot',
    'See how readiness toggles Service endpoint membership without restarting',
  ],
  prerequisites: [
    { type: 'knowledge', label: 'Pod phases and container states', description: 'You should know the difference between phase, Ready condition, and container state.' },
  ],
  content: {
    simulationId: 'pod-health-probe-simulator',
    instructions: [
      { id: 'step-1', label: 'Boot without a startup probe', description: 'Set app startup to 8 ticks, disable the startup probe, keep liveness default. The container is killed before boot finishes.' },
      { id: 'step-2', label: 'Add the startup probe', description: 'Re-enable startup with a generous failureThreshold. Liveness waits; the container is allowed to finish booting.' },
      { id: 'step-3', label: 'Make the app fail later', description: 'Set "app fails at tick" to 10. Liveness detects it and restarts. Watch the restart count climb.' },
      { id: 'step-4', label: 'Fail readiness only', description: 'Disable liveness, keep readiness. The container stays alive, but is removed from Service endpoints.' },
      { id: 'step-5', label: 'Trigger CrashLoopBackOff', description: 'Run multiple failures. After the third restart, the kubelet marks the container CrashLoopBackOff and stops restarting it immediately.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'endpoints-match-ready',
        label: 'Service endpoints include the Pod exactly when it is Ready',
        check: (state) => {
          const s = state as { ready: boolean; endpointsIncluded: boolean };
          return s.ready === s.endpointsIncluded;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'what-liveness-detects': whatLivenessDetects,
    'tuning-liveness': tuningLiveness,
  },
  labs: {
    'pod-health-probe-simulator': livenessLab,
  },
  simulations: {
    'pod-health-probe-simulator': bindSimulation(podHealthSimulation, renderPodHealthState),
  },
};
