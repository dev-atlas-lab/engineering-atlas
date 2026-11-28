import type { ConceptContentModule, LessonBody } from '../../types';

const iopsThroughputAndLatency: LessonBody = {
  learningObjectives: ['Benchmark volume performance safely and select appropriate StorageClass tiers'],
  sections: [
    {
      heading: 'Healthy Pod Events do not mean healthy I/O',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes storage controllers only verify that a volume is Bound, Attached, and Mounted — they do not enforce IOPS or latency SLAs. A Pod can show `Running` with zero Warning Events while database queries stall at 200 ms disk await times.',
        },
        {
          type: 'list',
          items: [
            'IOPS (operations/sec): dominates small random database reads/writes (4 KiB–16 KiB pages).',
            'Throughput (MiB/s): dominates backups, compaction, log shipping, and sequential scans.',
            'Node network bandwidth limit: attached cloud disks share the VM’s EBS/storage bandwidth cap — an undersized node type throttles I/O even if the disk itself is provisioned for high IOPS.',
          ],
        },
      ],
    },
  ],
};

const cloudVolumeSizingTraps: LessonBody = {
  learningObjectives: ['Identify cloud volume IOPS/throughput caps and burst-credit depletion'],
  sections: [
    {
      heading: 'Two classic cloud storage performance traps',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Trap', 'Mechanism', 'Mitigation'],
          rows: [
            ['Size-coupled IOPS (gp2, Standard SSD)', 'Baseline IOPS scales linearly with GiB (e.g. 3 IOPS/GiB on gp2); a 20 GiB PVC gets only 100 baseline IOPS once burst credits drain', 'Use decoupled IOPS/throughput classes (e.g. gp3) or provision explicitly'],
            ['Burst-credit exhaustion', 'Volume performs fast in load tests while burst bucket is full, then drops 10×–30× hours later in production', 'Monitor burst balance and volume queue depth metrics continuously'],
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'perf-kc-1',
      type: 'single-choice',
      prompt: 'A 20 GiB `gp2` PVC performs well for the first 30 minutes of a load test, then write latency spikes from 2 ms to 180 ms while `kubectl describe pod` shows zero Warnings. What happened?',
      difficulty: 'intermediate',
      learningObjective: 'Identify cloud volume IOPS/throughput caps and burst-credit depletion',
      options: [
        { id: 'a', label: 'The volume exhausted its I/O burst credits and dropped to its small size-coupled baseline IOPS (100 IOPS); switch to `gp3` or provision higher baseline IOPS', correct: true, explanation: 'Correct — burst-based cloud volumes throttle down to size-proportional baselines once burst credits empty, and Kubernetes Events do not report storage throttling.' },
        { id: 'b', label: 'kube-proxy throttled TCP packets to the PV', correct: false, explanation: 'kube-proxy routes Service traffic, not block storage PCIe/iSCSI/EBS I/O.' },
        { id: 'c', label: 'The StorageClass volumeBindingMode switched from WaitForFirstConsumer to Immediate', correct: false, explanation: 'volumeBindingMode is immutable and only governs initial provisioning.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'iops-throughput-and-latency': iopsThroughputAndLatency,
    'cloud-volume-sizing-traps': cloudVolumeSizingTraps,
  },
  labs: {},
  simulations: {},
};
