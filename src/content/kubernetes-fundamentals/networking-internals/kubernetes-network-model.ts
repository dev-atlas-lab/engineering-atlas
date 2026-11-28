import type { ConceptContentModule, LessonBody } from '../../types';

const theThreeRules: LessonBody = {
  learningObjectives: [
    'State the three required properties of the Kubernetes network model',
    'Explain why these constraints shape every CNI design',
  ],
  sections: [
    {
      heading: 'Three invariants',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes does not ship a networking implementation. Instead the project defines a small set of properties every conforming cluster\'s network must satisfy; the CNI plugin provides the implementation. The three rules:',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Every Pod gets its own routable IP address (on a flat, cluster-wide Pod network).',
            'Pods can communicate with every other Pod in the cluster without NAT.',
            'Agents running on a node (kubelet, system daemons) can talk to every Pod on that node.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'These rules are deliberately silent about the dataplane. A conforming CNI can use overlay (VXLAN), native routing (BGP), or even public cloud VPC primitives — but the semantics above must hold.',
        },
      ],
    },
    {
      heading: 'What follows from the rules',
      blocks: [
        {
          type: 'list',
          items: [
            'Pods never have "port forwarding" like Docker containers on a single host — there is no need because each Pod has its own routable IP.',
            'Services (ClusterIP) are a separate virtual-IP layer built on top of the Pod network, not a replacement for it.',
            'Two Pods on different nodes communicating directly by Pod IP must work — and must look identical from the application\'s perspective to two Pods on the same node.',
          ],
        },
      ],
    },
  ],
};

const whyNoNat: LessonBody = {
  learningObjectives: ['Explain why no-NAT Pod-to-Pod addressing was chosen'],
  sections: [
    {
      heading: 'NAT broke too many things',
      blocks: [
        {
          type: 'paragraph',
          text: 'Before Kubernetes, the dominant container model (single-host Docker) assigned containers to private bridge networks and NATed their traffic through the host\'s IP when it left the host. This worked for a single host but broke in a cluster:',
        },
        {
          type: 'list',
          items: [
            'Service discovery became host-plus-port: the identity of a service depended on where it happened to run, not what it was.',
            'Protocols that embed IPs in payload (FTP, SIP, some RPC) broke across NAT boundaries.',
            'Logs and metrics referenced NAT addresses rather than application endpoints — correlation across layers became manual.',
          ],
        },
        {
          type: 'paragraph',
          text: 'By flattening the Pod network and requiring no-NAT addressing, Kubernetes makes "a Pod\'s IP" the authoritative identity. Every observer — the caller, the Service, kube-proxy, flow logs — sees the same address.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Egress from Pods to the external internet IS usually NATed (SNAT to the node IP) — but only at the cluster boundary. Inside the cluster the no-NAT rule holds.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'netmodel-kc-1',
      type: 'single-choice',
      prompt: 'Two Pods on different nodes send traffic to each other. What does the receiving Pod see as the source IP?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why no-NAT Pod-to-Pod addressing was chosen',
      options: [
        { id: 'a', label: 'The sending Pod\'s IP', correct: true, explanation: 'Correct — the no-NAT rule guarantees the source address is preserved for intra-cluster traffic.' },
        { id: 'b', label: 'The sending node\'s IP', correct: false, explanation: 'That would be the case with NAT. Kubernetes\' network model forbids NAT for Pod-to-Pod traffic.' },
        { id: 'c', label: 'The CNI plugin\'s gateway IP', correct: false, explanation: 'There is no shared gateway; Pod IPs are routable end to end.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-three-rules': theThreeRules,
    'why-no-nat': whyNoNat,
  },
  labs: {},
  simulations: {},
};
