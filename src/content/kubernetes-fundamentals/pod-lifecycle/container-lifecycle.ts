import type { ConceptContentModule, LessonBody } from '../../types';

const containerStates: LessonBody = {
  learningObjectives: [
    'Describe the three container states and the fields each carries',
    'Read a kubectl describe pod output to diagnose a stuck container',
  ],
  sections: [
    {
      heading: 'Waiting, Running, Terminated',
      blocks: [
        {
          type: 'paragraph',
          text: 'Each container inside a Pod has its own fine-grained state, reported by the kubelet in `status.containerStatuses[]`. There are exactly three possible states — more detail than phase, scoped to one container at a time.',
        },
        {
          type: 'comparisonTable',
          headers: ['State', 'Means', 'Carries'],
          rows: [
            ['Waiting', 'Container is not yet running (image pull, init container ahead, backoff, config error)', 'reason, message'],
            ['Running', 'Container is executing', 'startedAt timestamp'],
            ['Terminated', 'Container exited (success, failure, OOMKill, external kill)', 'exitCode, reason, message, startedAt, finishedAt'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The `reason` string inside Waiting and Terminated is where most diagnostic information lives. Common Waiting reasons include ContainerCreating, ImagePullBackOff, ErrImagePull, CrashLoopBackOff, CreateContainerConfigError. Common Terminated reasons: Completed, Error, OOMKilled, ContainerCannotRun.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# A failing Pod — the signal is in the containerStatuses, not the phase.
$ kubectl get pod web -o jsonpath='{.status.phase}'
Running
$ kubectl get pod web -o jsonpath='{.status.containerStatuses[0].state}'
{"waiting":{"reason":"CrashLoopBackOff","message":"back-off 40s restarting failed container=app pod=web"}}`,
        },
      ],
    },
    {
      heading: 'Last state is a record of the previous run',
      blocks: [
        {
          type: 'paragraph',
          text: '`containerStatuses[i].lastState` holds the Terminated state from the container\'s most recent completed execution. This is how you see why the previous container died even though the current one is already Waiting or Running. It is the first field to check when debugging a CrashLoopBackOff.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'container-state-kc-1',
      type: 'single-choice',
      prompt: 'A Pod is in phase=Running but kubectl get pods shows READY 0/1. Which field best explains the gap?',
      difficulty: 'intermediate',
      learningObjective: 'Describe the three container states and the fields each carries',
      options: [
        { id: 'a', label: 'status.conditions[Ready].status is False — typically because the readiness probe is failing', correct: true, explanation: 'Correct. The phase stays Running during readiness failures; only the Ready condition flips.' },
        { id: 'b', label: 'The container is in Waiting state', correct: false, explanation: 'Possible but not necessary. A container in Running can still have Ready=False if its readiness probe is failing.' },
        { id: 'c', label: 'The Pod is being deleted', correct: false, explanation: 'During deletion phase stays Running until all containers terminate, but readiness is unrelated to the deletion signal.' },
      ],
    },
  ],
};

const initAndHooks: LessonBody = {
  learningObjectives: [
    'Order the lifecycle events a container goes through from image pull to exit',
    'Explain init containers and the two lifecycle hooks (postStart, preStop)',
  ],
  sections: [
    {
      heading: 'Init containers run first, one at a time',
      blocks: [
        {
          type: 'paragraph',
          text: 'Init containers run sequentially before any main container starts. Each one must exit with code 0 before the next begins. If any init container fails and the Pod has a restart policy that allows it, the kubelet restarts just that init container; otherwise the Pod is marked Failed.',
        },
        {
          type: 'list',
          items: [
            'Setup work that must complete before the app starts: migrations, config fetch, waiting for a dependency.',
            'Runs with the same volumes and network as the main containers.',
            'Can use a different image, with tools the main container does not need (keeps main image small).',
            'Resource usage is counted separately — the Pod effective request is max(max init, sum main).',
          ],
        },
      ],
    },
    {
      heading: 'Lifecycle hooks on the main container',
      blocks: [
        {
          type: 'paragraph',
          text: 'After the main container\'s process is spawned, the kubelet can run two lifecycle hooks: `postStart` (immediately after the container is created, in parallel with the entrypoint) and `preStop` (when termination begins, before SIGTERM). Each is either an exec command or an HTTP GET.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `lifecycle:
  postStart:
    exec:
      command: ["/bin/sh", "-c", "/app/warm-cache.sh"]
  preStop:
    httpGet:
      path: /drain
      port: 8080`,
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'postStart is not sequenced with the container\'s entrypoint — they race. The container is not considered Started until postStart returns. A hanging postStart will prevent liveness/readiness from running and keep the container Waiting indefinitely.',
        },
      ],
    },
    {
      heading: 'End-to-end timeline for one container',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Scheduler binds the Pod to a node.',
            'kubelet pulls the images (image pull errors appear here as ImagePullBackOff).',
            'All init containers run sequentially. Each must succeed.',
            'Main containers start. Entrypoint and postStart run concurrently.',
            'Liveness/readiness/startup probes begin (startup suspends the other two).',
            'preStop runs on termination; the kubelet then sends SIGTERM to PID 1.',
            'After terminationGracePeriodSeconds, if the process is still alive, the kubelet sends SIGKILL.',
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'container-states': containerStates,
    'init-and-hooks': initAndHooks,
  },
  labs: {},
  simulations: {},
};
