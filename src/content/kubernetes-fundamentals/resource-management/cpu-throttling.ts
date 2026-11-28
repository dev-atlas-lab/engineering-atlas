import type { ConceptContentModule, LessonBody } from '../../types';

const howThrottlingWorks: LessonBody = {
  learningObjectives: [
    'Describe how CFS quota and period produce throttling',
    'Compute the quota in μs from a cpu.limit value',
  ],
  sections: [
    {
      heading: 'Quota per period',
      blocks: [
        {
          type: 'paragraph',
          text: 'The kubelet writes two values into each container\'s CPU cgroup. On cgroup v2, they live together in `cpu.max`; on v1, they are `cpu.cfs_quota_us` and `cpu.cfs_period_us`. The period is always 100ms by default. The quota is `limit * period`.',
        },
        {
          type: 'list',
          items: [
            'cpu.limit = 1 → quota = 100,000 μs per 100,000 μs period. The container may run flat out.',
            'cpu.limit = 0.5 → quota = 50,000 μs per 100,000 μs. Half a core across the period, in any distribution.',
            'cpu.limit = 2 → quota = 200,000 μs. Up to two cores\' worth of CPU time per period — can be used by two threads simultaneously.',
          ],
        },
        {
          type: 'paragraph',
          text: 'When the quota is exhausted mid-period, every thread in the cgroup is paused until the next period begins. The pause is binary — not a slowdown, a full stop. Latency-sensitive apps notice this.',
        },
      ],
    },
    {
      heading: 'Observing it',
      blocks: [
        {
          type: 'code',
          language: 'bash',
          code: `# cAdvisor metrics (via kubelet /metrics/cadvisor):
container_cpu_cfs_periods_total       # total periods observed
container_cpu_cfs_throttled_periods_total  # periods in which throttling occurred
container_cpu_cfs_throttled_seconds_total  # total wall seconds spent throttled`,
        },
        {
          type: 'paragraph',
          text: 'The ratio `throttled_periods / periods` is the throttling percentage — the single most useful signal. A value under 1% is noise; over 10% usually indicates either an under-sized limit or a workload that cannot tolerate CFS\'s binary enforcement.',
        },
      ],
    },
  ],
};

const whenLimitsHurt: LessonBody = {
  learningObjectives: ['Recognise when a CPU limit causes more problems than it solves'],
  sections: [
    {
      heading: 'The latency-sensitive case',
      blocks: [
        {
          type: 'paragraph',
          text: 'An HTTP service with cpu.limit=1 that handles a burst of concurrent requests may exhaust its quota in the first 20ms of a 100ms period, then idle the remaining 80ms. Average CPU usage is below the limit, but latency for the second-half requests spikes by ~80ms. From outside the container this looks like intermittent slowness with no CPU pressure — a hard bug to diagnose without the throttling metric.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Many engineering teams have concluded that CPU limits for user-facing services are actively harmful. The scheduler already uses requests to prevent over-subscription; the limit then just caps the burst headroom. A common policy is "requests yes, limits only when noisy-neighbor isolation is truly needed." Discuss this with your platform team before changing it; it has real tradeoffs.',
        },
      ],
    },
    {
      heading: 'The pre-5.4 Linux kernel bug',
      blocks: [
        {
          type: 'paragraph',
          text: 'Through about kernel 5.3, CFS had a bug where quota accounting overcharged multithreaded applications in a way that caused throttling even when under the limit. The fix (commit de53fd7aedb1) merged in Linux 5.4 roughly halved observed throttling for many workloads. If you see impossibly high throttling on an old distro, check the host kernel version.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'how-throttling-works': howThrottlingWorks,
    'when-limits-hurt': whenLimitsHurt,
  },
  labs: {},
  simulations: {},
};
