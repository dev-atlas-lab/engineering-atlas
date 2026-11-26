import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { globalRoutingScene } from './global-traffic-distribution.scenes';
import { regionalFailoverSimulation, type FailoverState } from './regional-failover';
import { renderFailoverState } from './regional-failover-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const globalVsRegional: LessonBody = {
  learningObjectives: [
    'Distinguish DNS-based traffic steering from an anycast proxy that handles traffic directly',
    'Compare priority, weighted, performance, and geographic routing, and active-active vs active-passive',
    'Explain DNS TTL and why DNS failover is never instant',
  ],
  analogy:
    'A DNS-based router is a directory service: it tells each caller which office to phone, then steps out of the conversation — and callers remember the number until it changes. An anycast proxy is a switchboard that stays on the line and can transfer you the moment an office goes dark.',
  sections: [
    {
      heading: 'Two ways to route globally',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'DNS-based steering', 'Anycast proxy'],
          rows: [
            ['How', 'Answers DNS queries with a regional endpoint', 'Advertises one anycast address; forwards from the nearest edge'],
            ['In the data path?', 'No — it only answers DNS', 'Yes — traffic flows through it'],
            ['Failover speed', 'Waits for cached answers to expire (TTL)', 'Reroutes in seconds'],
            ['Works for', 'Any protocol (it is just DNS)', 'What the proxy supports (HTTP for Front Door; TCP/UDP for Global Accelerator)'],
            ['Examples', 'Azure Traffic Manager, Amazon Route 53', 'Azure Front Door, AWS Global Accelerator'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Both decide which region serves a user. The crucial difference is whether they stay in the path. A DNS router hands out an answer and is gone; the client then connects directly to that region and caches the answer for the record’s TTL. An anycast proxy keeps handling the connection, so it can react to a regional failure immediately.',
        },
      ],
    },
    {
      heading: 'Routing policies',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Policy', 'Sends a client to'],
          rows: [
            ['Priority / failover', 'The highest-priority healthy region (active-passive)'],
            ['Weighted', 'Regions in proportion to configured weights (useful for gradual shifts and canaries)'],
            ['Performance / latency', 'The lowest-latency healthy region for that client'],
            ['Geographic', 'The region mapped to the client’s location (often for data residency, not just speed)'],
          ],
        },
        {
          type: 'list',
          items: [
            'Active-active: multiple regions serve at once; capacity is their sum, and a failure loses only that region’s share — but the data layer must handle multi-region writes or be partitioned.',
            'Active-passive: one region serves, another stands by; simpler and consistent, but standby capacity is idle and must be tested so failover actually works.',
          ],
        },
      ],
    },
    {
      heading: 'DNS TTL and failover delay',
      blocks: [
        {
          type: 'paragraph',
          text: 'A DNS record carries a time to live (TTL). Resolvers and clients cache the answer for that long, which is what makes DNS scalable — but it means a client pinned to a failed region keeps trying it until its cached answer expires. You cannot make DNS failover instant; you can only shorten the TTL, which trades faster failover for more DNS queries. The Global Traffic Routing and Failover lab lets you watch this difference between DNS and anycast directly.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Health-based failover also depends on detection: the routing layer must first notice the region is unhealthy (its own health checks), then stop steering to it, then clients must pick up the change. Each stage adds delay. “Multi-region” does not mean “zero downtime”.',
        },
      ],
    },
  ],
  visualization: globalRoutingScene,
  knowledgeCheck: [
    {
      id: 'gtd-1',
      type: 'scenario',
      prompt: 'A DNS-based global router has a 300-second TTL. A region fails. The router’s health check marks it down after 30 seconds. How soon are all users off the failed region?',
      difficulty: 'advanced',
      learningObjective: 'Explain DNS TTL and why DNS failover is never instant',
      options: [
        { id: 'a', label: 'Up to about 5 minutes — even after the router stops handing out the dead region, clients keep using cached answers until the TTL expires', correct: true, explanation: 'Correct — detection plus TTL bound the total failover time.' },
        { id: 'b', label: 'Within 30 seconds, once the health check marks it down', correct: false, explanation: 'Cached answers linger for the TTL after that.' },
        { id: 'c', label: 'Instantly', correct: false, explanation: 'DNS failover is never instant.' },
      ],
    },
    {
      id: 'gtd-2',
      type: 'single-choice',
      prompt: 'Which global routing approach can reroute traffic within seconds of a regional failure, without waiting on client DNS caches?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish DNS-based traffic steering from an anycast proxy that handles traffic directly',
      options: [
        { id: 'a', label: 'An anycast proxy layer (it stays in the data path)', correct: true, explanation: 'Correct — because it handles the connection, it can switch regions immediately.' },
        { id: 'b', label: 'A DNS-based router with a long TTL', correct: false, explanation: 'Long TTLs make failover slower, not faster.' },
        { id: 'c', label: 'Any DNS router, regardless of TTL', correct: false, explanation: 'DNS routing always depends on cached answers expiring.' },
      ],
    },
  ],
};

const azureGlobalRouting: LessonBody = {
  learningObjectives: ['Describe Azure Front Door and Traffic Manager and when to use each'],
  sections: [
    {
      heading: 'Front Door and Traffic Manager',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'Azure Front Door', 'Azure Traffic Manager'],
          rows: [
            ['Type', 'Global anycast Layer 7 proxy (in the data path)', 'DNS-based routing (not in the data path)'],
            ['Protocols', 'HTTP/HTTPS', 'Any (it only answers DNS)'],
            ['Failover', 'Seconds (anycast)', 'Bounded by DNS TTL'],
            ['Extras', 'Edge caching, WAF, TLS termination, URL routing', 'Six routing methods, nested profiles'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Azure Front Door is a global, anycast Layer 7 service at Microsoft’s edge: it routes HTTP(S) across regions with health probes, terminates TLS, caches, and applies a WAF (managed rules on the Premium tier). Azure Traffic Manager works purely at DNS: it returns a regional endpoint using one of six routing methods — priority, weighted, performance, geographic, multivalue, or subnet — and can combine them with nested profiles. For modern multi-region HTTP apps, Microsoft generally steers you to Front Door; Traffic Manager remains the choice for non-HTTP protocols or pure DNS steering.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Front Door and Azure Traffic Manager',
    keyFeatures: [
      'Front Door: global anycast Layer 7 proxy with routing, caching, TLS, and WAF',
      'Traffic Manager: DNS-based routing with priority, weighted, performance, geographic, multivalue, and subnet methods',
      'Nested Traffic Manager profiles to combine methods',
      'Health probes drive failover in both',
    ],
    terminology: {
      'Global anycast HTTP edge': 'Azure Front Door',
      'DNS-based global routing': 'Azure Traffic Manager',
      'Routing policy': 'Routing method (Traffic Manager) / route (Front Door)',
    },
    architecturalNotes: [
      'Front Door is in the data path and reroutes in seconds; Traffic Manager is DNS and bounded by TTL.',
      'Front Door is HTTP/HTTPS only; Traffic Manager works for any protocol because it is DNS.',
    ],
    limitations: ['Front Door WAF managed rules and bot protection are Premium-tier features.', 'Traffic Manager failover is bounded by DNS TTL.'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/traffic-manager/traffic-manager-routing-methods',
  },
  knowledgeCheck: [
    {
      id: 'gtd-az-1',
      type: 'scenario',
      prompt: 'A multi-region HTTP app needs global routing with edge caching, a WAF, and fast failover. Which Azure service leads the design?',
      difficulty: 'intermediate',
      learningObjective: 'Describe Azure Front Door and Traffic Manager and when to use each',
      options: [
        { id: 'a', label: 'Azure Front Door — global anycast Layer 7 with caching, WAF, and seconds-scale failover', correct: true, explanation: 'Correct — Traffic Manager (DNS) cannot cache or run a WAF and fails over on TTL.' },
        { id: 'b', label: 'Azure Traffic Manager alone', correct: false, explanation: 'DNS routing is not in the path and cannot cache or run a WAF.' },
        { id: 'c', label: 'Azure Load Balancer', correct: false, explanation: 'That is regional Layer 4.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Traffic Manager routing methods', url: 'https://learn.microsoft.com/en-us/azure/traffic-manager/traffic-manager-routing-methods' },
    { label: 'Load balancing options overview', url: 'https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/load-balancing-overview' },
  ],
};

const awsGlobalRouting: LessonBody = {
  learningObjectives: ['Describe Route 53 routing policies and AWS Global Accelerator, and where CloudFront fits'],
  sections: [
    {
      heading: 'Route 53, Global Accelerator, and CloudFront',
      blocks: [
        {
          type: 'paragraph',
          text: 'Amazon Route 53 is DNS-based global routing with several policies — simple, weighted, latency, failover, geolocation, geoproximity, multivalue answer, and IP-based — each able to use Route 53 health checks. Because it is DNS, its failover is bounded by the record TTL. AWS Global Accelerator is the anycast option: it gives you two static anycast IPs and proxies TCP/UDP from the nearest edge to your regional endpoints over the AWS backbone, with fast failover and no DNS wait. Amazon CloudFront is a CDN — it caches HTTP content at the edge; it is sometimes used for global HTTP delivery but is not a general equivalent of Global Accelerator.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'Route 53', 'Global Accelerator', 'CloudFront'],
          rows: [
            ['Mechanism', 'DNS answers', 'Anycast proxy (TCP/UDP)', 'CDN (HTTP) with edge cache'],
            ['In the data path?', 'No', 'Yes', 'Yes'],
            ['Failover', 'TTL-bounded', 'Seconds', 'Origin failover for HTTP'],
            ['Static IPs', 'No', 'Yes (two anycast IPs)', 'No'],
          ],
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon Route 53, AWS Global Accelerator, and Amazon CloudFront',
    keyFeatures: [
      'Route 53: DNS routing policies (weighted, latency, failover, geolocation, geoproximity, multivalue, IP-based) with health checks',
      'Global Accelerator: static anycast IPs, TCP/UDP acceleration, fast regional failover',
      'CloudFront: HTTP content delivery with edge caching',
    ],
    terminology: {
      'DNS-based global routing': 'Amazon Route 53 routing policies',
      'Global anycast acceleration': 'AWS Global Accelerator',
      'Content delivery network': 'Amazon CloudFront',
      'Routing policy': 'Route 53 routing policy',
    },
    architecturalNotes: [
      'Route 53 is DNS (TTL-bounded failover); Global Accelerator is an in-path anycast proxy (fast failover).',
      'Global Accelerator provides static anycast IPs for allow-listing.',
      'CloudFront caches HTTP content and is complementary, not a drop-in for anycast acceleration.',
    ],
    limitations: ['Route 53 failover is bounded by DNS TTL.', 'Global Accelerator handles TCP/UDP, not content caching.'],
    documentationUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html',
  },
  knowledgeCheck: [
    {
      id: 'gtd-aws-1',
      type: 'single-choice',
      prompt: 'Which AWS service steers clients with DNS answers and therefore fails over only as fast as its record TTLs allow?',
      difficulty: 'beginner',
      learningObjective: 'Describe Route 53 routing policies and AWS Global Accelerator, and where CloudFront fits',
      options: [
        { id: 'a', label: 'Amazon Route 53', correct: true, explanation: 'Correct — Route 53 is DNS-based.' },
        { id: 'b', label: 'AWS Global Accelerator', correct: false, explanation: 'Global Accelerator is an in-path anycast proxy with fast failover.' },
        { id: 'c', label: 'Application Load Balancer', correct: false, explanation: 'ALB is regional Layer 7, not a global router.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Route 53 choosing a routing policy', url: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html' },
    { label: 'What is AWS Global Accelerator?', url: 'https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html' },
  ],
};

const comparison: LessonBody = {
  learningObjectives: ['Map Azure and AWS global routing services by mechanism, not marketing category'],
  sections: [
    {
      heading: 'Match on mechanism',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Mechanism', 'Azure', 'AWS'],
          rows: [
            ['DNS-based routing', 'Traffic Manager', 'Route 53 routing policies'],
            ['Anycast HTTP edge (proxy, cache, WAF)', 'Front Door', 'CloudFront (+ origin failover); ALB behind it'],
            ['Anycast L4 acceleration (TCP/UDP, static IPs)', '— (no direct equivalent)', 'Global Accelerator'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Azure bundles global HTTP routing, caching, and WAF into Front Door; AWS composes them from CloudFront, Route 53, and ALB, and adds Global Accelerator for Layer 4 anycast that Azure has no direct match for. Do not pair “Front Door = CloudFront” blindly — they overlap but are not equivalent.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'gtd-cmp-1',
      type: 'single-choice',
      prompt: 'Which capability has no direct Azure equivalent?',
      difficulty: 'advanced',
      learningObjective: 'Map Azure and AWS global routing services by mechanism, not marketing category',
      options: [
        { id: 'a', label: 'Anycast Layer 4 (TCP/UDP) acceleration with static anycast IPs, like AWS Global Accelerator', correct: true, explanation: 'Correct — Azure Front Door is Layer 7; there is no direct Azure L4 anycast acceleration equivalent.' },
        { id: 'b', label: 'DNS-based routing', correct: false, explanation: 'Azure Traffic Manager provides this.' },
        { id: 'c', label: 'Global HTTP edge with caching and WAF', correct: false, explanation: 'Azure Front Door provides this.' },
      ],
    },
  ],
};

const failoverLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Route global clients to regional endpoints by policy, then fail a region and compare DNS-based routing (which waits for cached answers to expire) with an anycast proxy (which reroutes immediately). Deterministic and simulated; no real DNS or health checks.',
  learningObjectives: [
    'Observe why DNS-based failover is delayed by cached answers while anycast is not',
    'Compare priority, weighted, performance, and geographic routing',
    'Explain remaining healthy capacity after a regional failure',
  ],
  prerequisites: [
    { type: 'concept', id: 'global-vs-regional-load-balancing', label: 'Global vs. Regional Routing', description: 'DNS steering, anycast, TTL, and policies.' },
  ],
  content: {
    simulationId: regionalFailoverSimulation.id,
    instructions: [
      { id: 'normal', label: '1. Normal routing', description: 'Run the default (DNS, performance routing). Each user resolves to their lowest-latency region.' },
      { id: 'dns-fail', label: '2. Fail a region with DNS', description: 'Step on. East US fails; users with a cached answer for it keep failing through the TTL window, then recover when they re-resolve.' },
      { id: 'anycast-fail', label: '3. Fail a region with anycast', description: 'Switch the routing layer to anycast and replay. The same failure reroutes immediately — no TTL wait.' },
      { id: 'priority', label: '4. Active-passive', description: 'Switch to priority routing. All users use the primary until it fails, then all move to the next region.' },
      { id: 'capacity', label: '5. Capacity', description: 'Note the healthy-capacity figure drop while a region is down — failover restores service, not full capacity.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'dns-delay',
        label: 'Saw a DNS client fail while holding a cached answer for the downed region',
        check: (state) => {
          const s = state as FailoverState;
          return s.config.routingType === 'dns' && s.config.failedRegion !== 'none' && s.clients.some((c) => c.status === 'error');
        },
      },
      {
        id: 'anycast-reroute',
        label: 'Saw anycast reroute a failure with no client left failing',
        check: (state) => {
          const s = state as FailoverState;
          return s.config.routingType === 'anycast' && s.config.failedRegion !== 'none' && s.phase.toLowerCase().includes('fail') && s.clients.length > 0 && s.clients.every((c) => c.status !== 'error');
        },
      },
      {
        id: 'reduced-capacity',
        label: 'Observed reduced healthy capacity during a regional failure',
        check: (state) => {
          const s = state as FailoverState;
          return s.config.failedRegion !== 'none' && s.healthyCapacityPct < 100 && s.healthyCapacityPct > 0;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'global-vs-regional-load-balancing': globalVsRegional,
    'azure-global-routing': azureGlobalRouting,
    'aws-global-routing': awsGlobalRouting,
    'global-traffic-distribution-comparison': comparison,
  },
  labs: {
    'route-around-a-regional-outage-lab': failoverLab,
  },
  simulations: {
    'route-around-a-regional-outage-lab': bindSimulation(regionalFailoverSimulation, renderFailoverState),
  },
};
