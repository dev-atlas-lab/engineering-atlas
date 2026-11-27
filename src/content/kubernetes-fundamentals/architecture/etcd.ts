import type { ConceptContentModule, LessonBody } from '../../types';

const whatEtcdStores: LessonBody = {
  learningObjectives: [
    'Describe what etcd stores and why that data matters',
    'Explain the distinction between etcd and the rest of the cluster state',
  ],
  sections: [
    {
      heading: 'The cluster\'s memory',
      blocks: [
        {
          type: 'paragraph',
          text: 'etcd is a distributed key-value store that holds every piece of Kubernetes cluster state. Every object you can see with "kubectl get" — Pods, Deployments, Services, Nodes, ConfigMaps, Secrets — is stored in etcd. If etcd is wiped, the cluster has no memory of any of them, even if the workloads are still running on the nodes.',
        },
        {
          type: 'list',
          items: [
            'All Kubernetes objects (spec and status)',
            'The current leader election state for HA controllers',
            'Secrets and ConfigMaps (optionally encrypted at rest; the default is base64 — not encryption)',
            'Node leases (the fast heartbeat for liveness)',
          ],
        },
      ],
    },
    {
      heading: 'Not everything is in etcd',
      blocks: [
        {
          type: 'paragraph',
          text: 'Container logs, metrics, and the actual process trees on nodes are not in etcd. etcd stores declarations and observed statuses, not the runtime objects themselves. "kubectl logs" pulls from the kubelet on the node, not from etcd. Understanding this split matters for backup planning — an etcd snapshot is enough to rebuild the cluster\'s object graph, but logs and metrics live elsewhere.',
        },
      ],
    },
  ],
};

const consistencyAndFailure: LessonBody = {
  learningObjectives: [
    'Explain why etcd prioritizes consistency over availability',
    'Describe what happens to the cluster when etcd becomes unavailable or loses quorum',
  ],
  sections: [
    {
      heading: 'etcd is CP, not AP',
      blocks: [
        {
          type: 'paragraph',
          text: 'etcd uses the Raft consensus protocol. Writes only succeed when a majority (quorum) of etcd members acknowledge them. In CAP terms, etcd is CP: it would rather refuse writes than return inconsistent data. The practical consequence is that etcd is deployed in odd-sized clusters — 1, 3, or 5 members — and tolerates the loss of a minority but not of a majority.',
        },
        {
          type: 'comparisonTable',
          headers: ['Cluster size', 'Majority (quorum)', 'Can tolerate down'],
          rows: [
            ['1 member', '1', '0 (any failure takes etcd down)'],
            ['3 members', '2', '1'],
            ['5 members', '3', '2'],
            ['7 members', '4', '3 (rarely worth the write-latency cost)'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Even sizes (2, 4, 6) are strictly worse than the odd size below them: they need the same quorum but have more members that can fail. "4 members, quorum 3" tolerates only 1 failure, same as 3 members, but costs extra. Always odd.',
        },
      ],
    },
    {
      heading: 'When quorum is lost',
      blocks: [
        {
          type: 'list',
          items: [
            'Writes are refused. The API Server can\'t persist anything. kubectl apply fails.',
            'Reads may still succeed from existing members, but new scheduling decisions can\'t be recorded.',
            'Workloads that are already running on nodes keep running — the kubelet does not need to reach etcd for the Pods it is already executing.',
            'Recovery requires restoring quorum: bringing failed members back, or restoring a snapshot into a new cluster if the old one is unrecoverable.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'This is the single most important backup target in a Kubernetes cluster. A regular etcd snapshot is the thing that lets you rebuild cluster state after a catastrophic failure. Without it, "we lost etcd" means "we lost the cluster."',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'etcd-kc-1',
      type: 'single-choice',
      prompt: 'Why is etcd typically deployed as 3 or 5 members rather than 2 or 4?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why etcd prioritizes consistency over availability',
      options: [
        { id: 'a', label: 'Odd sizes tolerate one more failure per member than the next even size without needing extra quorum', correct: true, explanation: 'Correct. 3 tolerates 1; 4 also only tolerates 1 but costs more. 5 tolerates 2; 6 also only tolerates 2.' },
        { id: 'b', label: 'etcd refuses to start with an even number of members', correct: false, explanation: 'It will — but it is strictly worse than the odd number below, so operators avoid it.' },
        { id: 'c', label: 'Raft can only elect a leader when the member count is a power of two', correct: false, explanation: 'There is no such restriction.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-etcd-stores': whatEtcdStores,
    'consistency-and-failure': consistencyAndFailure,
  },
  labs: {},
  simulations: {},
};
