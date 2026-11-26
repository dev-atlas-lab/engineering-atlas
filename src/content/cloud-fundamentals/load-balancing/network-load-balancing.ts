import type { ConceptContentModule, LessonBody } from '../../types';
import { l4FlowScene } from './network-load-balancing.scenes';

const howL4Works: LessonBody = {
  learningObjectives: [
    'Explain flow (5-tuple) hashing and why a Layer 4 load balancer pins a connection to a target',
    'Explain source-IP preservation and when it matters',
    'Explain why Layer 4 suits high throughput and non-HTTP protocols',
  ],
  sections: [
    {
      heading: 'Distributing connections by flow',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Layer 4 load balancer does not read requests. It identifies each connection by its 5-tuple — source IP, source port, destination IP, destination port, protocol — hashes that to choose a target, and sends every packet of that flow to the same target. There is no per-request decision because the balancer never sees requests; it sees a stream of packets belonging to flows.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Flow hashing gives natural stickiness for the life of a connection, and spreads many short connections well. Its weakness is a few very long or very busy connections, which cannot be split across targets — a single multiplexed connection stays on one target.',
        },
      ],
    },
    {
      heading: 'Source IP preservation',
      blocks: [
        {
          type: 'paragraph',
          text: 'Because a Layer 4 load balancer forwards rather than proxies, the target can see the original client IP instead of the balancer’s. That is valuable for audit logs, geographic rules, and IP allow-lists — and it is why a Layer 7 proxy, which does terminate the connection, must instead pass the client IP in a header. Preservation has constraints that vary by platform and target type, so it is a configuration detail to verify, not an automatic guarantee.',
        },
      ],
    },
    {
      heading: 'Why choose Layer 4',
      blocks: [
        {
          type: 'list',
          items: [
            'Throughput and latency: with no request parsing or TLS termination (in passthrough), a Layer 4 balancer adds very little overhead and scales to very high connection rates.',
            'Any TCP/UDP protocol: databases, message brokers, game servers, VoIP, and custom protocols that are not HTTP.',
            'Real client IP with no proxy in the path.',
            'TLS passthrough: keep the balancer out of the trust boundary — it never sees plaintext.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The trade-off is that Layer 4 cannot route by host, path, or headers, cannot do redirects or rewrites, and (in passthrough) cannot apply an HTTP WAF. When you need those, use Layer 7 — possibly behind a Layer 4 balancer.',
        },
      ],
    },
  ],
  visualization: l4FlowScene,
  knowledgeCheck: [
    {
      id: 'nlb-1',
      type: 'scenario',
      prompt: 'A Layer 4 load balancer fronts a fleet, and one client opens a single long-lived TCP connection carrying almost all the traffic. What is the effect?',
      difficulty: 'intermediate',
      learningObjective: 'Explain flow (5-tuple) hashing and why a Layer 4 load balancer pins a connection to a target',
      options: [
        { id: 'a', label: 'That whole flow lands on one target, so load is uneven despite many targets', correct: true, explanation: 'Correct — Layer 4 cannot split one connection across targets.' },
        { id: 'b', label: 'The connection is spread packet-by-packet across all targets', correct: false, explanation: 'Per-packet spreading would break the connection; flows are pinned.' },
        { id: 'c', label: 'The load balancer rejects the connection', correct: false, explanation: 'It accepts it and pins it to one target.' },
      ],
    },
    {
      id: 'nlb-2',
      type: 'single-choice',
      prompt: 'Why can a Layer 4 load balancer preserve the client IP to the backend while a Layer 7 proxy cannot (without a header)?',
      difficulty: 'intermediate',
      learningObjective: 'Explain source-IP preservation and when it matters',
      options: [
        { id: 'a', label: 'Layer 4 forwards the connection rather than terminating it, so the backend still sees the original source; a Layer 7 proxy opens its own connection', correct: true, explanation: 'Correct — the proxy’s own connection replaces the client IP, which it then passes in X-Forwarded-For.' },
        { id: 'b', label: 'Layer 4 encrypts the client IP', correct: false, explanation: 'Preservation is about not proxying, not encryption.' },
        { id: 'c', label: 'Layer 7 cannot see the client IP at all', correct: false, explanation: 'It can, and passes it in a header.' },
      ],
    },
  ],
};

const azureLoadBalancer: LessonBody = {
  learningObjectives: ['Describe Azure Load Balancer as the regional Layer 4 service and its health probes'],
  sections: [
    {
      heading: 'Azure Load Balancer',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Load Balancer is a regional Layer 4 (TCP/UDP) load balancer. It distributes flows to a backend pool using a hash of the connection tuple, supports inbound and outbound scenarios, and can be zone-redundant. The Standard tier supports TCP, HTTP, and HTTPS health probes; a backend is removed from rotation after a configured number of consecutive probe failures. Because it is Layer 4, it does not read HTTP — host/path routing and TLS termination for routing belong to Application Gateway or Front Door.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Probe interval and the unhealthy threshold are configurable (the portal pre-fills a 5-second interval; other interfaces default to 15). These are settings, not timing guarantees.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Load Balancer',
    keyFeatures: [
      'Regional Layer 4 TCP/UDP load balancing',
      'Flow-hash distribution to a backend pool',
      'TCP, HTTP, and HTTPS health probes (Standard tier)',
      'Zone-redundant deployment and outbound connectivity scenarios',
    ],
    terminology: {
      'Layer 4 regional load balancer': 'Azure Load Balancer',
      'Backend pool': 'Backend pool',
      'Health check': 'Health probe (TCP/HTTP/HTTPS)',
      'Frontend': 'Frontend IP configuration',
    },
    architecturalNotes: ['Regional and Layer 4; it does not read HTTP.', 'Standard tier adds HTTPS probes and zone redundancy.'],
    limitations: ['No host/path routing or TLS termination for routing (use Application Gateway or Front Door).'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview',
  },
  knowledgeCheck: [
    {
      id: 'nlb-az-1',
      type: 'single-choice',
      prompt: 'A service runs over a custom TCP protocol and needs regional Layer 4 balancing with the client IP preserved. Which Azure service?',
      difficulty: 'beginner',
      learningObjective: 'Describe Azure Load Balancer as the regional Layer 4 service and its health probes',
      options: [
        { id: 'a', label: 'Azure Load Balancer', correct: true, explanation: 'Correct — the regional Layer 4 TCP/UDP service.' },
        { id: 'b', label: 'Application Gateway', correct: false, explanation: 'That is Layer 7 and HTTP-oriented.' },
        { id: 'c', label: 'Traffic Manager', correct: false, explanation: 'Traffic Manager is DNS-based and not in the data path.' },
      ],
    },
  ],
  furtherReading: [{ label: 'Azure Load Balancer overview', url: 'https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview' }],
};

const awsNetworkLoadBalancer: LessonBody = {
  learningObjectives: ['Describe the AWS Network Load Balancer, its TLS options, and client-IP behaviour'],
  sections: [
    {
      heading: 'Network Load Balancer',
      blocks: [
        {
          type: 'paragraph',
          text: 'The AWS Network Load Balancer (NLB) is a regional Layer 4 load balancer built for very high throughput and low latency. It uses a flow hash to pin connections to targets in a target group, provides a static IP per Availability Zone, and supports TCP, UDP, and TLS listeners. A TLS listener terminates TLS at the NLB; a TCP listener on 443 passes the encrypted traffic through to the target. For instance targets the client IP is preserved by default; for IP targets preservation is configurable, with documented constraints.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS Network Load Balancer (NLB)',
    keyFeatures: [
      'Regional Layer 4 TCP/UDP/TLS, very high throughput and low latency',
      'Flow-hash distribution to target groups',
      'Static IP per Availability Zone',
      'TLS listener (terminate) or TCP listener (passthrough)',
      'Client-IP preservation (default for instance targets)',
    ],
    terminology: {
      'Layer 4 regional load balancer': 'Network Load Balancer (NLB)',
      'Backend pool': 'Target group',
      'Health check': 'Target group health check (TCP/HTTP/HTTPS)',
      'TLS termination': 'TLS listener',
    },
    architecturalNotes: [
      'Flow-hash connection pinning; a single connection stays on one target.',
      'TLS listener terminates; TCP listener passes TLS through.',
      'Client-IP preservation defaults differ by target type (instance vs IP).',
    ],
    limitations: ['Layer 4 only — no host/path routing (use ALB).', 'Client-IP preservation has constraints (same IP family, same/peered VPC).'],
    documentationUrl: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html',
  },
  knowledgeCheck: [
    {
      id: 'nlb-aws-1',
      type: 'scenario',
      prompt: 'You want the backend to terminate TLS itself so the load balancer never sees plaintext. Which NLB listener do you use?',
      difficulty: 'intermediate',
      learningObjective: 'Describe the AWS Network Load Balancer, its TLS options, and client-IP behaviour',
      options: [
        { id: 'a', label: 'A TCP listener on 443 — the encrypted bytes pass through to the target, which terminates TLS', correct: true, explanation: 'Correct — a TLS listener would terminate at the NLB instead.' },
        { id: 'b', label: 'A TLS listener — it keeps traffic encrypted end to end automatically', correct: false, explanation: 'A TLS listener terminates TLS at the NLB.' },
        { id: 'c', label: 'An HTTP listener', correct: false, explanation: 'NLB is Layer 4; HTTP listeners are an ALB concept.' },
      ],
    },
  ],
  furtherReading: [{ label: 'What is a Network Load Balancer?', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html' }],
};

const comparison: LessonBody = {
  learningObjectives: ['Compare Azure Load Balancer and AWS Network Load Balancer'],
  sections: [
    {
      heading: 'Two regional Layer 4 load balancers',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Aspect', 'Azure Load Balancer', 'AWS Network Load Balancer'],
          rows: [
            ['Layer / scope', 'Layer 4 TCP/UDP, regional', 'Layer 4 TCP/UDP/TLS, regional'],
            ['Distribution', 'Flow hash to backend pool', 'Flow hash to target group'],
            ['TLS', 'Passthrough (no TLS listener for routing)', 'TLS listener (terminate) or TCP (passthrough)'],
            ['Client IP', 'Preserved (Layer 4)', 'Preserved by default for instance targets'],
            ['Health probes', 'TCP/HTTP/HTTPS (Standard)', 'TCP/HTTP/HTTPS target health checks'],
            ['Zones', 'Zone-redundant option', 'Static IP per AZ'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Both are regional Layer 4 balancers and pair cleanly. A notable difference: NLB offers a native TLS listener to terminate TLS at Layer 4, whereas on Azure, TLS termination for routing is an Application Gateway/Front Door (Layer 7) job.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'nlb-cmp-1',
      type: 'single-choice',
      prompt: 'Which pairing is correct for regional Layer 4 load balancing?',
      difficulty: 'beginner',
      learningObjective: 'Compare Azure Load Balancer and AWS Network Load Balancer',
      options: [
        { id: 'a', label: 'Azure Load Balancer ↔ AWS Network Load Balancer', correct: true, explanation: 'Correct — both are regional Layer 4.' },
        { id: 'b', label: 'Azure Load Balancer ↔ AWS Application Load Balancer', correct: false, explanation: 'ALB is Layer 7.' },
        { id: 'c', label: 'Azure Load Balancer ↔ AWS Route 53', correct: false, explanation: 'Route 53 is DNS.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'how-layer-4-load-balancing-works': howL4Works,
    'azure-load-balancer': azureLoadBalancer,
    'aws-network-load-balancer': awsNetworkLoadBalancer,
    'network-load-balancing-comparison': comparison,
  },
  labs: {},
  simulations: {},
};
