import type { ConceptContentModule, LessonBody } from '../../types';
import { l7RoutingScene } from './application-load-balancing.scenes';

const howL7RoutingWorks: LessonBody = {
  learningObjectives: [
    'Explain how a Layer 7 load balancer evaluates listener rules to route a request',
    'Describe host, path, header, and method based routing and why rule order matters',
    'Explain TLS termination, redirects, rewrites, and cookie-based affinity at Layer 7',
  ],
  analogy:
    'A Layer 7 load balancer is a mailroom that opens each envelope, reads the address line, and sends it to the right department — unlike a Layer 4 sorter that only reads the postcode on the outside.',
  sections: [
    {
      heading: 'Listeners, rules, and target groups',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Layer 7 load balancer accepts connections on a listener (for example HTTPS on 443), terminates TLS so it can read the HTTP request, and evaluates an ordered list of rules. Each rule has conditions (host, path, header, method, query string) and an action (forward to a target group, redirect, return a fixed response, authenticate). The first matching rule wins, and a default action handles anything unmatched.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Rule order is behaviour, not decoration. A broad rule near the top can shadow specific rules below it, so requests you expected to route one way silently go another. Order from most specific to most general.',
        },
      ],
    },
    {
      heading: 'What Layer 7 can do that Layer 4 cannot',
      blocks: [
        {
          type: 'list',
          items: [
            'Content routing: send /api to one pool and / to another, or admin.example to a separate pool, behind one address and certificate.',
            'TLS termination and central certificates: manage certificates on the load balancer rather than on every backend; optionally re-encrypt to the backend.',
            'Redirects and rewrites: force HTTPS, or rewrite paths, without involving the backend.',
            'Per-request features: inject or read headers (X-Forwarded-For), apply a WAF, authenticate users, and apply cookie-based session affinity.',
          ],
        },
        {
          type: 'paragraph',
          text: 'All of this is possible only because the proxy terminates the connection and reads the request — which is also its cost: every connection is terminated and a new one opened to the backend.',
        },
      ],
    },
  ],
  visualization: l7RoutingScene,
  knowledgeCheck: [
    {
      id: 'alb-1',
      type: 'scenario',
      prompt: 'Two rules exist: Rule A forwards host shop.example (any path) to the web pool; Rule B forwards path /api/* to the API pool. Rule A is first. Where does shop.example/api/orders go?',
      difficulty: 'advanced',
      learningObjective: 'Describe host, path, header, and method based routing and why rule order matters',
      options: [
        { id: 'a', label: 'To the web pool — Rule A matches first and stops evaluation, shadowing Rule B', correct: true, explanation: 'Correct — order Rule B (more specific) before Rule A to fix it.' },
        { id: 'b', label: 'To the API pool, because /api is more specific', correct: false, explanation: 'Specificity does not reorder rules; the first match wins.' },
        { id: 'c', label: 'To both pools', correct: false, explanation: 'Evaluation stops at the first matching rule.' },
      ],
    },
    {
      id: 'alb-2',
      type: 'single-choice',
      prompt: 'Why must a Layer 7 load balancer terminate TLS to do path-based routing?',
      difficulty: 'beginner',
      learningObjective: 'Explain how a Layer 7 load balancer evaluates listener rules to route a request',
      options: [
        { id: 'a', label: 'The path is inside the encrypted HTTP request; it cannot be read without decrypting it', correct: true, explanation: 'Correct — routing by path requires reading the request.' },
        { id: 'b', label: 'TLS termination makes routing faster', correct: false, explanation: 'It is a prerequisite for reading the request, not a speed optimisation.' },
        { id: 'c', label: 'It does not need to; it can route encrypted traffic by path', correct: false, explanation: 'Encrypted request contents, including the path, are unreadable until terminated.' },
      ],
    },
  ],
};

const azureApplicationGateway: LessonBody = {
  learningObjectives: ['Describe Azure Application Gateway as the regional Layer 7 load balancer and where it fits'],
  sections: [
    {
      heading: 'Application Gateway',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Application Gateway is a regional Layer 7 load balancer that lives in your virtual network. It terminates TLS, routes by host and path using routing rules, supports URL rewrites and redirects, cookie-based session affinity, and connection draining, and integrates a Web Application Firewall. It runs HTTP(S) health probes against its backend pools. Because it is regional and in-network, it is the Layer 7 balancer for traffic inside a region — often behind a global service.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Front Door (global edge) and Application Gateway (regional, in-VNet) are complementary, not competing: a common design uses Front Door for global routing, caching, and edge WAF, and Application Gateway for region-specific routing and controls closer to the workload.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Application Gateway',
    keyFeatures: [
      'Regional Layer 7 load balancing inside a virtual network',
      'Host- and path-based routing rules, URL rewrite and redirect',
      'TLS termination and end-to-end TLS (re-encryption)',
      'Cookie-based session affinity and connection draining',
      'Integrated Web Application Firewall and HTTP(S) health probes',
    ],
    terminology: {
      'Layer 7 regional load balancer': 'Application Gateway',
      'Routing rule': 'Request routing rule (with path-based rules)',
      'Backend pool': 'Backend pool',
      'Health check': 'Health probe (HTTP/HTTPS)',
    },
    architecturalNotes: [
      'Regional and deployed into a VNet subnet, unlike the global edge Front Door.',
      'Supports end-to-end TLS by re-encrypting to the backend.',
      'WAF is available on the WAF SKU.',
    ],
    limitations: ['Regional scope: cross-region distribution needs Front Door or Traffic Manager in front.', 'Feature availability depends on the SKU/tier.'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/application-gateway/overview',
  },
  knowledgeCheck: [
    {
      id: 'alb-az-1',
      type: 'single-choice',
      prompt: 'Where does Azure Application Gateway sit relative to Azure Front Door?',
      difficulty: 'intermediate',
      learningObjective: 'Describe Azure Application Gateway as the regional Layer 7 load balancer and where it fits',
      options: [
        { id: 'a', label: 'Application Gateway is regional and in the VNet; Front Door is global at the edge, and they are often layered', correct: true, explanation: 'Correct.' },
        { id: 'b', label: 'They are the same service', correct: false, explanation: 'One is regional and in-network, the other global and at the edge.' },
        { id: 'c', label: 'Application Gateway is DNS-based', correct: false, explanation: 'That is Traffic Manager; Application Gateway is an in-path Layer 7 proxy.' },
      ],
    },
  ],
  furtherReading: [{ label: 'Azure Application Gateway overview', url: 'https://learn.microsoft.com/en-us/azure/application-gateway/overview' }],
};

const awsApplicationLoadBalancer: LessonBody = {
  learningObjectives: ['Describe the AWS Application Load Balancer and its routing and target-group model'],
  sections: [
    {
      heading: 'Application Load Balancer',
      blocks: [
        {
          type: 'paragraph',
          text: 'The AWS Application Load Balancer (ALB) is a regional Layer 7 load balancer. Listeners hold rules that match on host, path, HTTP header, method, query string, or source IP, and forward to target groups (or redirect, return a fixed response, or authenticate). Each target group has its own health check and algorithm (round robin or least outstanding requests). ALB terminates TLS, adds the client IP to X-Forwarded-For, and supports redirects, sticky sessions via a load-balancer-generated cookie, and integration with AWS WAF and Cognito.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS Application Load Balancer (ALB)',
    keyFeatures: [
      'Regional Layer 7 routing by host, path, header, method, query, and source IP',
      'Listener rules evaluated in priority order to target groups',
      'Per-target-group health checks and algorithm',
      'TLS termination, redirects, fixed responses, and authentication actions',
      'Integration with AWS WAF; client IP in X-Forwarded-For',
    ],
    terminology: {
      'Layer 7 regional load balancer': 'Application Load Balancer (ALB)',
      'Routing rule': 'Listener rule (priority-ordered)',
      'Backend pool': 'Target group',
      'Health check': 'Target group health check (HTTP/HTTPS)',
    },
    architecturalNotes: [
      'Rules are evaluated by priority; the first match wins.',
      'Target groups, not the load balancer, own the health check and algorithm.',
      'Client IP is passed to targets in X-Forwarded-For.',
    ],
    limitations: ['Regional scope; global distribution needs Route 53, CloudFront, or Global Accelerator in front.', 'HTTP/HTTPS only (use NLB for other TCP/UDP protocols).'],
    documentationUrl: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html',
  },
  knowledgeCheck: [
    {
      id: 'alb-aws-1',
      type: 'single-choice',
      prompt: 'In an ALB, which object owns the health check and the load balancing algorithm?',
      difficulty: 'intermediate',
      learningObjective: 'Describe the AWS Application Load Balancer and its routing and target-group model',
      options: [
        { id: 'a', label: 'The target group', correct: true, explanation: 'Correct — each target group defines its own health check and algorithm.' },
        { id: 'b', label: 'The listener', correct: false, explanation: 'Listeners hold rules; target groups hold health checks.' },
        { id: 'c', label: 'The VPC', correct: false, explanation: 'The VPC is the network, not the health-check owner.' },
      ],
    },
  ],
  furtherReading: [{ label: 'What is an Application Load Balancer?', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html' }],
};

const comparison: LessonBody = {
  learningObjectives: ['Compare Azure Application Gateway and AWS Application Load Balancer'],
  sections: [
    {
      heading: 'Two regional Layer 7 load balancers',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Aspect', 'Azure Application Gateway', 'AWS Application Load Balancer'],
          rows: [
            ['Layer / scope', 'Layer 7, regional, in-VNet', 'Layer 7, regional'],
            ['Routing by', 'Host, path', 'Host, path, header, method, query, source IP'],
            ['Backend grouping', 'Backend pools', 'Target groups (own health check + algorithm)'],
            ['TLS', 'Terminate; end-to-end re-encryption', 'Terminate; re-encrypt to targets'],
            ['Affinity', 'Cookie-based', 'Load-balancer-generated cookie'],
            ['WAF', 'WAF SKU', 'AWS WAF integration'],
            ['Client IP to backend', 'X-Forwarded-For', 'X-Forwarded-For'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Both are regional Layer 7 proxies and map cleanly onto each other. The real differences are in the breadth of match conditions and where the health check/algorithm live (target group on AWS, backend settings on Azure). Neither replaces a global edge service.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'alb-cmp-1',
      type: 'single-choice',
      prompt: 'Which is the closest conceptual pairing?',
      difficulty: 'beginner',
      learningObjective: 'Compare Azure Application Gateway and AWS Application Load Balancer',
      options: [
        { id: 'a', label: 'Azure Application Gateway ↔ AWS Application Load Balancer (both regional Layer 7)', correct: true, explanation: 'Correct.' },
        { id: 'b', label: 'Azure Application Gateway ↔ AWS Route 53', correct: false, explanation: 'Route 53 is DNS, not a Layer 7 proxy.' },
        { id: 'c', label: 'Azure Application Gateway ↔ AWS Global Accelerator', correct: false, explanation: 'Global Accelerator is a global Layer 4 anycast service.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'how-layer-7-routing-works': howL7RoutingWorks,
    'azure-application-gateway': azureApplicationGateway,
    'aws-application-load-balancer': awsApplicationLoadBalancer,
    'application-load-balancing-comparison': comparison,
  },
  labs: {},
  simulations: {},
};
