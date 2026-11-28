import type { ConceptContentModule, LessonBody } from '../../types';

const ruleStructure: LessonBody = {
  learningObjectives: [
    'Compare iptables and IPVS on rule structure',
    'Explain why iptables scales poorly past a few thousand Services',
  ],
  sections: [
    {
      heading: 'iptables is a chain of linear matches',
      blocks: [
        {
          type: 'paragraph',
          text: 'iptables rules are ordered lists. For every packet the kernel walks each rule in turn until one matches. kube-proxy produces one chain per Service and one chain per endpoint, chained from KUBE-SERVICES. On a cluster with 5,000 Services and 10 endpoints each, every packet traverses ~5,000 KUBE-SVC-* rules on the way in — the cost is O(n) in Services.',
        },
        {
          type: 'paragraph',
          text: 'Updating these rules is also O(n). When one Pod becomes Ready, kube-proxy runs `iptables-restore` with the entire updated rule set — on large clusters this can take seconds and holds the netfilter lock during the write.',
        },
      ],
    },
    {
      heading: 'IPVS is a hash table',
      blocks: [
        {
          type: 'paragraph',
          text: 'IPVS keeps virtual services in a hash table indexed by (ClusterIP, port). Lookup is O(1); updates affect only the one service\'s hash entries. The data path is also faster — IPVS has a dedicated kernel data structure and connection scheduler (round-robin, least-connections, source-hash, etc.).',
        },
        {
          type: 'list',
          items: [
            'iptables: O(n) match, O(n) update, lock on write — fine up to ~500 Services, degrades past ~5000.',
            'IPVS: O(1) match, O(1) update, no table-wide lock — flat performance curves to tens of thousands of Services.',
          ],
        },
      ],
    },
  ],
};

const ipvsTradeoffs: LessonBody = {
  learningObjectives: ['Describe when switching to IPVS is worthwhile'],
  sections: [
    {
      heading: 'IPVS still uses iptables for a few things',
      blocks: [
        {
          type: 'paragraph',
          text: 'IPVS does Service DNAT but iptables is still used for NodePort, SNAT at egress, and NetworkPolicy. A cluster in IPVS mode has both backends active — IPVS for the hot path and a smaller iptables ruleset for the auxiliary cases.',
        },
        {
          type: 'comparisonTable',
          headers: ['Factor', 'Prefer iptables', 'Prefer IPVS'],
          rows: [
            ['Service count', '< 1,000', '> 5,000'],
            ['Churn rate (endpoint changes/sec)', 'Low', 'High'],
            ['Linux kernel version', 'Older (iptables is more stable long-term)', '4.4+'],
            ['Scheduling algorithm needs', 'Random is fine', 'Need least-connections, source-hash, etc.'],
            ['Debugging familiarity', 'iptables/`netstat`-style', 'ipvsadm, less widespread tooling'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'In practice, the modern answer for large clusters is "neither" — switch to eBPF via Cilium\'s kube-proxy replacement. Service DNAT lives in BPF programs on the network device, with better performance than IPVS and no kernel-wide rule tables at all.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'rule-structure': ruleStructure,
    'ipvs-tradeoffs': ipvsTradeoffs,
  },
  labs: {},
  simulations: {},
};
