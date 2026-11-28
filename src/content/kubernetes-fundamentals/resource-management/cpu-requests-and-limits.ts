import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { resourceRequestsAndLimitsScene } from '../operations-scenes';
import { resourceManagementSimulation } from '../operations-simulations';
import { renderResourceState } from '../operations-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const cpuRequestIsReservation: LessonBody = {
  learningObjectives: [
    'Describe the different jobs of requests and limits',
    'Convert millicores to CPU cores',
  ],
  sections: [
    {
      heading: 'Requests are scheduler input; limits are kernel enforcement',
      blocks: [
        {
          type: 'paragraph',
          text: 'Two fields on a container, two completely different jobs. `requests.cpu` tells the scheduler how much CPU to reserve on the chosen node. `limits.cpu` tells the kernel to cap the container at that much CPU, enforced via CFS (Completely Fair Scheduler) quota.',
        },
        {
          type: 'list',
          items: [
            'Requests → scheduler: a Pod can only land on a node whose allocatable CPU minus the sum of requests of existing Pods is at least the Pod\'s request. That capacity stays reserved even if the container isn\'t using it.',
            'Limits → kernel: during execution, CFS quota caps the container at (limit × period). Over-limit CPU demand becomes throttled (sleeping) CPU time — the container keeps running, just slower.',
            'Requests do NOT prevent other containers from using free CPU above the total requests sum. The node bursts opportunistically until a container hits its own limit.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Millicores: 1000m = 1 CPU core. "500m" and "0.5" are identical. Below-1-core values are almost always expressed in m for clarity.',
        },
      ],
    },
    {
      heading: 'What "1 CPU" means',
      blocks: [
        {
          type: 'paragraph',
          text: 'Precisely: one hyperthread on x86 (so one logical core of a two-way-SMT physical core), one AWS vCPU, one GKE/EKS vCPU. On bare metal with SMT disabled it is one full physical core. The kubelet exposes the node\'s capacity in these units via `status.capacity.cpu`.',
        },
      ],
    },
  ],
  visualization: resourceRequestsAndLimitsScene,
};

const cpuOverLimitThrottle: LessonBody = {
  learningObjectives: ['Explain what happens when CPU demand exceeds the limit'],
  sections: [
    {
      heading: 'CFS quota and period',
      blocks: [
        {
          type: 'paragraph',
          text: 'The kernel\'s CFS has two cgroup-level knobs for CPU limits: `cpu.cfs_period_us` (default 100000 μs = 100ms) and `cpu.cfs_quota_us` (set by the kubelet from the limit). Over each 100ms period, the cgroup can consume at most `quota` microseconds of CPU across all its threads. When it exhausts the quota, every thread is paused until the next period.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# For a container with cpu.limit=0.5 (= 500m)
cat /sys/fs/cgroup/cpu.max
# -> "50000 100000"
# 50000 μs quota per 100000 μs period = 50% of one core`,
        },
        {
          type: 'list',
          items: [
            'Over-limit is never fatal for CPU. The container is throttled — it waits — and the kubelet exposes `container_cpu_cfs_throttled_seconds_total` via cAdvisor.',
            'Burstable demand against a fractional limit causes sawtooth latency: the container runs flat out for part of the period, then stalls for the rest.',
            'A multi-thread app with cpu.limit=1 still has just one core-worth of total CPU time per period, no matter how many threads it spawns.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Setting a CPU limit far above the request lets the container burst, but only up to the limit. If you want unconstrained bursting, leave `limits.cpu` unset — the container will then consume whatever CPU is free on the node.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'cpu-kc-1',
      type: 'single-choice',
      prompt: 'A container has cpu.request=500m and no cpu.limit. The node has 4 unused CPU. How much CPU can the container actually use?',
      difficulty: 'intermediate',
      learningObjective: 'Describe the different jobs of requests and limits',
      options: [
        { id: 'a', label: 'Up to 4 CPU — with no limit, the container bursts to whatever is free', correct: true, explanation: 'Correct. Request reserves a floor; no limit means no ceiling, so the container can consume all free CPU up to node allocatable.' },
        { id: 'b', label: '500m — request also caps usage', correct: false, explanation: 'Request reserves, it does not cap.' },
        { id: 'c', label: '1 CPU — the default limit is one core', correct: false, explanation: 'There is no implicit limit. If LimitRange is in play, it may inject one, but it is not implicit.' },
      ],
    },
  ],
};

const resourceLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '15 minutes',
  description:
    'Set CPU and memory requests and limits on a container, run different workload profiles, and watch how the kernel reacts: CPU above the limit is throttled, memory above the limit is OOMKilled.',
  learningObjectives: [
    'See the derived QoS class change as you edit requests and limits',
    'Experience CPU throttling and OOMKills under controlled conditions',
  ],
  prerequisites: [
    { type: 'knowledge', label: 'Requests and limits semantics', description: 'Read the two lessons before running the lab.' },
  ],
  content: {
    simulationId: 'resource-management-simulator',
    instructions: [
      { id: 'step-1', label: 'Baseline: Burstable', description: 'Set request=0.5 CPU and limit=1 CPU. QoS is Burstable because requests != limits.' },
      { id: 'step-2', label: 'Make it Guaranteed', description: 'Set CPU request=1, limit=1, memory request=512, limit=512. QoS flips to Guaranteed — the strongest class.' },
      { id: 'step-3', label: 'Trigger CPU throttling', description: 'With cpu.limit=1, run the "CPU spike only" workload. Watch throttling % climb in the mid-ticks.' },
      { id: 'step-4', label: 'Trigger OOMKill', description: 'Keep memory.limit=256 and run the "memory spike only" workload. The kernel kills the container when demand exceeds the limit.' },
      { id: 'step-5', label: 'Compare with no limits', description: 'Clear both limits. The container runs its demand freely — but QoS drops.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'cpu-not-killed',
        label: 'CPU over-limit never results in OOMKilled (CPU is compressible)',
        check: (state) => {
          const s = state as { throttlingPct: number; oomKilled: boolean };
          return !(s.throttlingPct > 0 && s.oomKilled);
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'cpu-request-is-reservation': cpuRequestIsReservation,
    'cpu-over-limit-throttle': cpuOverLimitThrottle,
  },
  labs: {
    'resource-management-simulator': resourceLab,
  },
  simulations: {
    'resource-management-simulator': bindSimulation(resourceManagementSimulation, renderResourceState),
  },
};
