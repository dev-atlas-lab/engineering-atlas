import type { ConceptContentModule, LessonBody } from '../../types';

const theThreePolicies: LessonBody = {
  learningObjectives: [
    'Distinguish Always, OnFailure, Never',
    'Match each policy with the controller shapes that are compatible with it',
  ],
  sections: [
    {
      heading: 'restartPolicy is set on the Pod, not on individual containers',
      blocks: [
        {
          type: 'paragraph',
          text: '`spec.restartPolicy` is one of three values and applies to every container in the Pod. It controls what the kubelet does when a container\'s process exits — it does not itself replace Pods.',
        },
        {
          type: 'comparisonTable',
          headers: ['Policy', 'Restart on success (exit 0)', 'Restart on failure (exit != 0)', 'Typical use'],
          rows: [
            ['Always', 'Yes', 'Yes', 'Long-running services (default when a Deployment creates a Pod)'],
            ['OnFailure', 'No — Pod enters Succeeded', 'Yes', 'Job batch workloads that must complete'],
            ['Never', 'No — Pod enters Succeeded', 'No — Pod enters Failed', 'One-shot inspection or validation Pods'],
          ],
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: v1
kind: Pod
metadata: { name: migrate }
spec:
  restartPolicy: OnFailure
  containers:
  - name: migrate
    image: myapp/migrator:v3
    command: ["/app/migrate"]`,
        },
      ],
    },
    {
      heading: 'Controllers constrain which policies are legal',
      blocks: [
        {
          type: 'list',
          items: [
            'Deployment / ReplicaSet / DaemonSet / StatefulSet — Pods must have restartPolicy: Always. The controller replaces Pods; the kubelet keeps individual containers up.',
            'Job and CronJob — restartPolicy must be OnFailure or Never. Succeeded Pods must stop being revived; failures are retried either by kubelet (OnFailure) or by the Job controller creating a new Pod (Never).',
            'Standalone Pod (kubectl run, hand-crafted YAML) — all three are allowed. Nothing replaces the Pod itself if it ends.',
          ],
        },
      ],
    },
  ],
};

const crashLoopBackoff: LessonBody = {
  learningObjectives: [
    'Explain kubelet backoff and how CrashLoopBackOff is reported',
    'Describe how to diagnose a CrashLoopBackOff Pod',
  ],
  sections: [
    {
      heading: 'Backoff is the kubelet pacing restarts',
      blocks: [
        {
          type: 'paragraph',
          text: 'When a container exits and restartPolicy says restart, the kubelet does not restart immediately in a tight loop. It waits an exponential backoff: 10s, 20s, 40s, 80s, 160s, 300s (capped). While it waits, the container state is Waiting with reason=CrashLoopBackOff. The Pod phase stays Running the whole time.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The backoff timer resets after a container has been running without crashing for 10 minutes. This is what allows an occasionally-flapping container to recover from the back-off penalty.',
        },
      ],
    },
    {
      heading: 'Diagnosing CrashLoopBackOff',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            '`kubectl describe pod` — look at Events for image pull errors or scheduling issues.',
            '`kubectl logs <pod> --previous` — the previous container exit is almost always where the real error is.',
            'Check containerStatuses[0].lastState.terminated.reason — Error, OOMKilled, StartError, ContainerCannotRun each point at a different root cause.',
            'If OOMKilled, raise memory limits (or fix the leak); if Error, the app logs are the source; if ContainerCannotRun, the image\'s command/entrypoint or working directory is wrong.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A container that exits immediately with status 0 but restartPolicy=Always will also show CrashLoopBackOff — the kubelet does not distinguish success from failure when the policy is Always. If the entrypoint is "echo hello", the backoff cycle still kicks in.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-three-policies': theThreePolicies,
    'crashloopbackoff': crashLoopBackoff,
  },
  labs: {},
  simulations: {},
};
