import type { ConceptContentModule, LessonBody } from '../../types';

const nodeFailureTimeline: LessonBody = {
  learningObjectives: [
    'Order the events from node failure to Pod re-scheduling',
    'Compute the default tail recovery time',
  ],
  sections: [
    {
      heading: 'The full timeline',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            't=0: node loses network or dies. kubelet stops sending node heartbeats.',
            't ≈ 40s: `node-monitor-grace-period` expires. The node controller marks the Node as NotReady.',
            't ≈ 40s: Node controller adds the taint `node.kubernetes.io/not-ready:NoExecute` to the Node.',
            't ≈ 40s + 300s (default tolerationSeconds): Pods without a longer toleration are evicted by the taint.',
            't ≈ 340s + scheduling time: ReplicaSet/Deployment controllers notice the Pods are gone, create replacements, scheduler places them, kubelets on healthy nodes start them.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Default: ~5 minutes from node failure to the first replacement Pod being Ready. That is the tolerationSeconds on the automatic not-ready/unreachable taint. Tuning this is a tradeoff — shorter reacts to transient blips too aggressively; longer delays recovery on real failures.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The `--default-not-ready-toleration-seconds` and `--default-unreachable-toleration-seconds` kube-apiserver flags, or per-Pod tolerations, control this. 60–120s is a common tune for stateless workloads where fast recovery beats blip-tolerance.',
        },
      ],
    },
    {
      heading: 'What the controllers actually do',
      blocks: [
        {
          type: 'paragraph',
          text: 'There is no "node failure handler" in Kubernetes. The chain is: node-controller taints the Node → taint-based-eviction controller deletes the Pods → owning controllers (Deployment, ReplicaSet, StatefulSet) observe the count drop → ReplicaSet creates replacement Pods → scheduler schedules them. Each step is a reconciler watching for changes; none is specialised for failure.',
        },
      ],
    },
  ],
};

const statefulRecoveryNotes: LessonBody = {
  learningObjectives: ['Explain why stateful recovery is slower and sometimes unsafe'],
  sections: [
    {
      heading: 'StatefulSet recovery is different',
      blocks: [
        {
          type: 'paragraph',
          text: 'A StatefulSet Pod carries identity (web-0, web-1, …) and attached PersistentVolumeClaims. When a Pod is evicted, the volumes must be detached from the old node before they can be attached to the new one. Cloud block storage detach on an unreachable node waits for either a confirmed detach from the cloud API or a force-detach timeout (minutes, often 6+).',
        },
        {
          type: 'paragraph',
          text: 'This is intentional. For a quorum workload (databases, etcd, stateful queue), attaching the same volume to two VMs would risk split-brain corruption. StatefulSet waits for strong detach confirmation before scheduling the replacement — slow, but safe.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Deleting a StatefulSet Pod does NOT delete its PVC. To truly reset a StatefulSet member\'s data, delete the Pod AND the PVC. A common operations surprise: scaling a StatefulSet down and back up reuses the old PVC with its old data.',
        },
      ],
    },
    {
      heading: 'Pod replacement vs container restart',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Event', 'Actor', 'Cost', 'Preserves'],
          rows: [
            ['Container restart', 'kubelet', 'Seconds — new container on same Pod', 'Pod IP, volumes, scheduling decision'],
            ['Pod replacement', 'ReplicaSet/StatefulSet after Pod deletion', '30s to minutes — includes scheduling, image pull', 'Workload identity, not instance identity'],
            ['Pod replacement after node failure', 'Chain above, ~5 min default', 'Minutes — includes NodeNotReady grace', 'Workload identity only'],
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-node-failure-timeline': nodeFailureTimeline,
    'stateful-recovery-notes': statefulRecoveryNotes,
  },
  labs: {},
  simulations: {},
};
