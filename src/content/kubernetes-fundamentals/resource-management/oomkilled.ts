import type { ConceptContentModule, LessonBody } from '../../types';

const whoKillsAndWhy: LessonBody = {
  learningObjectives: [
    'Distinguish container-limit OOMKills from node-pressure OOMKills',
    'Name the signal and the actor in each case',
  ],
  sections: [
    {
      heading: 'Three different "OOMs"',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Flavor', 'Trigger', 'Actor', 'Reported as'],
          rows: [
            ['Container-limit OOM', 'Container RSS exceeds its memory limit', 'Kernel OOM-killer, scoped to the cgroup', 'containerStatuses[].lastState.terminated.reason: OOMKilled'],
            ['Node-pressure eviction', 'Node memory below eviction threshold', 'kubelet evicts Pods per QoS ladder', 'Pod has an Evicted status; message names the pressure'],
            ['Node kernel OOM', 'Node memory exhausted past eviction', 'Kernel OOM-killer, picks across all processes', 'Event + dmesg entry; the kubelet reports which Pod lost containers'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The common case is the first one: your container asked for too little memory, allocated more at some point, and was killed by the kernel inside its own cgroup. The container\'s process exits with signal 9 (SIGKILL); the kubelet notices the exit code and restarts it per restartPolicy.',
        },
      ],
    },
    {
      heading: 'What "exit code 137" means',
      blocks: [
        {
          type: 'paragraph',
          text: '137 = 128 + 9. 128 is the Unix convention for "killed by a signal"; 9 is SIGKILL. In Kubernetes, 137 virtually always means OOMKilled — no process asks to be SIGKILLed; it had to be imposed. The `reason: OOMKilled` field makes this explicit; the exit code is the secondary signal.',
        },
      ],
    },
  ],
};

const diagnosingOom: LessonBody = {
  learningObjectives: ['Diagnose an OOMKill end to end'],
  sections: [
    {
      heading: 'The signal chain',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'kubectl get pod — STATUS shows Running (phase stays Running) and RESTARTS has climbed.',
            'kubectl describe pod — look for `Last State: Terminated · Reason: OOMKilled · Exit Code: 137`.',
            'Node logs (`journalctl -k`) — a dmesg line like `Memory cgroup out of memory: Killed process 1234 (java) ...`.',
            'Metrics — container_memory_working_set_bytes vs container_spec_memory_limit_bytes; the working set approached the limit before the kill.',
            'If `lastState.terminated.reason` is Error with exit 137 but no OOMKilled reason, the kernel killed the container\'s PID 1 for a different reason — rare, but possible (host memory exhaustion before cgroup limit).',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Raising the memory limit without understanding WHY the container exceeded it just defers the problem. First, check: did the working set grow steadily (leak) or spike (bulk operation, large request)? The fix is different.',
        },
      ],
    },
    {
      heading: 'Real-world patterns',
      blocks: [
        {
          type: 'list',
          items: [
            'Steady growth over hours → memory leak. Raise the limit only temporarily while you fix the leak.',
            'Spike at startup → cache warm-up or large deserialization. Consider an init container or startup-time limit higher than steady-state limit (which Kubernetes does not support directly, so you set the limit to cover the spike and accept the overallocation).',
            'Spike on specific request types → an endpoint allocates too much (unbounded result sets, large uploads buffered in memory). Fix the endpoint; limits are a last resort.',
            'JVM killed with exit 1 and no OOMKilled → JVM caught OOMError and exited itself before the cgroup killer ran. The signal in the app logs is better than any Kubernetes signal here.',
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'who-kills-and-why': whoKillsAndWhy,
    'diagnosing-oom': diagnosingOom,
  },
  labs: {},
  simulations: {},
};
