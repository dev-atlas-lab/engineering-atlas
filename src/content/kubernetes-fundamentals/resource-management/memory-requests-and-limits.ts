import type { ConceptContentModule, LessonBody } from '../../types';

const memoryIsUncompressible: LessonBody = {
  learningObjectives: [
    'Describe why memory and CPU limits behave fundamentally differently',
    'State what happens when memory demand exceeds the limit',
  ],
  sections: [
    {
      heading: 'There is no "throttle memory"',
      blocks: [
        {
          type: 'paragraph',
          text: 'CPU is compressible: you can slow a process down, and it will keep running. Memory is not — a byte is either allocated or not. When a container\'s RSS crosses its memory limit, the kernel\'s OOM-killer selects a victim process (almost always inside this container) and kills it with SIGKILL. The container is then restarted per the Pod\'s restartPolicy.',
        },
        {
          type: 'list',
          items: [
            'Memory request is the scheduler reservation — node allocatable memory minus the sum of memory requests is the room for new Pods.',
            'Memory limit is a hard kernel cap. When RSS + anonymous pages hit the limit, OOMKilled happens, visible in `containerStatuses[0].lastState.terminated.reason: OOMKilled` and in node logs under `oom-kill`.',
            'The limit is enforced by the memory cgroup. It cannot be exceeded even transiently — the kill is immediate, not a backoff.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A memory request = limit on a critical service protects you from the node-level OOM-killer picking a different, random victim under node memory pressure — but it does not protect you from your OWN container exceeding its own limit. You still need to size the limit for the real memory profile.',
        },
      ],
    },
    {
      heading: 'Kernel vs node OOM',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Trigger', 'Scope', 'Victim selection'],
          rows: [
            ['Container exceeds its memory limit', 'This cgroup only', 'Kernel picks within the cgroup (usually the main process)'],
            ['Node runs out of memory', 'All Pods on the node', 'kubelet evicts BestEffort then Burstable (over-request) Pods before the kernel OOM-killer runs'],
            ['Kernel OOM-killer (last resort)', 'Whole node', 'OOM score across all processes; the highest-scoring process dies'],
          ],
        },
      ],
    },
  ],
};

const unitsAndMistakes: LessonBody = {
  learningObjectives: ['Avoid the M-vs-Mi mistake and other unit traps'],
  sections: [
    {
      heading: 'Mi and M are different',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes accepts both decimal (M, G) and binary (Mi, Gi) suffixes. Use binary almost always — it matches how operating systems report memory. The common bug: writing `500M` meaning "500 megabytes," getting 500,000,000 bytes = 476 MiB, and being surprised when a tool reporting 500 MiB OOMKills.',
        },
        {
          type: 'comparisonTable',
          headers: ['Suffix', 'Meaning', 'Bytes'],
          rows: [
            ['Mi', 'Mebibyte (binary)', '2^20 = 1,048,576'],
            ['M', 'Megabyte (decimal)', '10^6 = 1,000,000'],
            ['Gi', 'Gibibyte (binary)', '2^30 ≈ 1.074 × 10^9'],
            ['G', 'Gigabyte (decimal)', '10^9'],
          ],
        },
      ],
    },
    {
      heading: 'JVM / runtime awareness',
      blocks: [
        {
          type: 'paragraph',
          text: 'Container runtimes expose cgroup limits via /proc/meminfo-style reads, but older JVMs (Java < 10 pre-UseContainerSupport) read the host memory instead of the cgroup. They set their heap to a fraction of the HOST memory and are then killed when they allocate past the container limit. Modern JVMs (11+) and the Go runtime honour cgroup v2 limits correctly; verify your runtime does.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Node.js has a per-isolate heap cap (`--max-old-space-size`). It defaults relative to physical memory — in a container with memory.limit=512Mi and no explicit flag, Node.js can still think it has gigs available and happily OOMKill itself. Always pass `--max-old-space-size` matched to the container limit.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'memory-is-uncompressible': memoryIsUncompressible,
    'units-and-common-mistakes': unitsAndMistakes,
  },
  labs: {},
  simulations: {},
};
