import type { ConceptContentModule, LessonBody } from '../../types';

const ordinalIdentities: LessonBody = {
  learningObjectives: ['Construct the FQDN for a specific StatefulSet replica Pod'],
  sections: [
    {
      heading: 'Why Pod IPs are not identity',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every time a Kubernetes Pod is deleted and rescheduled onto another node, CNI assigns it a brand-new Pod IP. Stateful peers (Raft nodes, Kafka brokers, Cassandra seeds, PostgreSQL replicas) cannot safely configure peer lists with ephemeral IPs. StatefulSet solves this by fixing each Pod’s hostname to `<statefulsetName>-<ordinal>` and setting `spec.subdomain` to the governing Headless Service.',
        },
        {
          type: 'code',
          language: 'text',
          caption: 'Stable per-Pod DNS format',
          code: `<pod-name>.<headless-service-name>.<namespace>.svc.cluster.local

Example (StatefulSet "etcd", Service "etcd-headless", namespace "infra"):
  etcd-0.etcd-headless.infra.svc.cluster.local
  etcd-1.etcd-headless.infra.svc.cluster.local
  etcd-2.etcd-headless.infra.svc.cluster.local`,
        },
      ],
    },
  ],
};

const headlessServiceDns: LessonBody = {
  learningObjectives: ['Explain why a Headless Service (clusterIP: None) is required for peer-to-peer addressing'],
  sections: [
    {
      heading: 'How clusterIP: None changes CoreDNS behavior',
      blocks: [
        {
          type: 'paragraph',
          text: 'A standard ClusterIP Service allocates a single virtual IP and load-balances connections across Ready Pods — which is useless if a database primary needs to talk specifically to replica #2. Setting `spec.clusterIP: None` creates a **Headless Service**: kube-proxy programs no VIP load-balancing rules, and CoreDNS returns individual Pod A/AAAA records instead.',
        },
        {
          type: 'list',
          items: [
            'Querying `<service>.<ns>.svc.cluster.local` returns A records for all Ready Pod IPs.',
            'Querying `<pod>-<ordinal>.<service>.<ns>.svc.cluster.local` resolves exclusively to that single ordinal’s current IP.',
            'Setting `publishNotReadyAddresses: true` on the Headless Service lets bootstrapping peers resolve each other before Readiness probes pass (essential for initial Raft/Galera quorum formation).',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'StatefulSet `spec.serviceName` MUST match the Headless Service’s `metadata.name`. If the Service is missing or has a ClusterIP instead of `clusterIP: None`, per-Pod DNS records (`pod-0.svc...`) will not resolve.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'headless-kc-1',
      type: 'single-choice',
      prompt: 'A 3-node Raft cluster in a StatefulSet fails to form initial quorum because peers cannot resolve `raft-1.raft-svc.prod.svc.cluster.local` while `raft-1` is still NotReady waiting for quorum. Which setting fixes this chicken-and-egg deadlock?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why a Headless Service (clusterIP: None) is required for peer-to-peer addressing',
      options: [
        { id: 'a', label: 'Set `publishNotReadyAddresses: true` on the Headless Service `raft-svc`', correct: true, explanation: 'Correct — by default CoreDNS only publishes DNS records for Ready Pods; publishNotReadyAddresses exposes peer DNS during bootstrap.' },
        { id: 'b', label: 'Change the Service from `clusterIP: None` to `type: NodePort`', correct: false, explanation: 'A standard ClusterIP/NodePort Service load-balances to a single VIP and stops publishing per-ordinal Pod DNS records.' },
        { id: 'c', label: 'Set `podManagementPolicy: OrderedReady`', correct: false, explanation: 'OrderedReady actually worsens bootstrap deadlocks if pod-0 waits for pod-1 to join quorum before becoming Ready.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'ordinal-identities': ordinalIdentities,
    'headless-service-dns': headlessServiceDns,
  },
  labs: {},
  simulations: {},
};
