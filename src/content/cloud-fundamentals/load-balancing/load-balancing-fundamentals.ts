import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { l4VsL7Scene, loadBalancerOverviewScene } from './load-balancing-fundamentals.scenes';
import { trafficDistributionSimulation, type TrafficState } from './traffic-distribution';
import { renderTrafficState } from './traffic-distribution-view';
import { healthCheckSimulation, type HealthState } from './health-check';
import { renderHealthState } from './health-check-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const whyLoadBalancing: LessonBody = {
  learningObjectives: [
    'Explain the two problems load balancing solves: capacity and availability',
    'Describe a frontend listener, a backend pool, and forwarding rules',
    'Explain why a load balancer needs health checks to deliver availability',
  ],
  analogy:
    'A load balancer is the host at a busy restaurant with many identical tables. Guests queue at one door; the host seats each party at a free table, skips the table being cleaned, and no single table has to serve everyone.',
  sections: [
    {
      heading: 'One endpoint in front of many servers',
      blocks: [
        {
          type: 'paragraph',
          text: 'A single server has a ceiling: it can only handle so many concurrent requests before latency climbs, and if it fails, everything it served is down. Load balancing puts one stable frontend in front of a pool of interchangeable backends and spreads work across them. Clients connect to the frontend’s address and never need to know how many backends exist or which one serves them.',
        },
        {
          type: 'list',
          items: [
            'Capacity: total throughput becomes the sum of the backends, so you add capacity by adding backends (horizontal scaling) rather than buying a bigger server.',
            'Availability: if a backend fails, the load balancer stops sending it traffic and the survivors absorb the load, so one failure is not an outage.',
          ],
        },
      ],
    },
    {
      heading: 'The parts of a load balancer',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Part', 'What it is'],
          rows: [
            ['Frontend / listener', 'The address, port, and protocol clients connect to (for example TCP 443)'],
            ['Backend pool / target group', 'The set of registered targets — VMs, IPs, containers, or functions — that can serve requests'],
            ['Forwarding / routing rule', 'What decides which pool (and sometimes which backend) a request goes to'],
            ['Health probe', 'A periodic check that decides whether each backend is eligible for traffic'],
            ['Distribution algorithm', 'How a healthy backend is chosen for each connection or request'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'A load balancer is only as available as its health checks are accurate. Without them it would keep sending requests to a dead backend. The next lessons cover algorithms and health checks in turn.',
        },
      ],
    },
    {
      heading: 'What it does not do by itself',
      blocks: [
        {
          type: 'list',
          items: [
            'It does not make a slow backend fast — it spreads load, it does not add capacity on its own (auto-scaling does that).',
            'It does not fix shared bottlenecks: if every backend talks to one overloaded database, adding backends will not help.',
            'It does not make a stateful app horizontally scalable; that needs the application to externalise session state (covered under scalability).',
          ],
        },
      ],
    },
  ],
  visualization: loadBalancerOverviewScene,
  knowledgeCheck: [
    {
      id: 'lbf-why-1',
      type: 'single-choice',
      prompt: 'A team adds a load balancer and three app servers, but every request still reads from one small database that is already at 100% CPU. What happens to throughput?',
      difficulty: 'intermediate',
      learningObjective: 'Explain the two problems load balancing solves: capacity and availability',
      options: [
        { id: 'a', label: 'It stays roughly the same — the database is the bottleneck, and load balancing the app tier does not relieve it', correct: true, explanation: 'Correct — load balancing adds capacity only where the balanced tier was the limit.' },
        { id: 'b', label: 'It triples, because there are now three app servers', correct: false, explanation: 'The shared database still caps throughput.' },
        { id: 'c', label: 'It drops, because the load balancer adds overhead', correct: false, explanation: 'The dominant effect is the database bottleneck, not load balancer overhead.' },
      ],
    },
    {
      id: 'lbf-why-2',
      type: 'single-choice',
      prompt: 'Why does a load balancer need health checks to improve availability?',
      difficulty: 'beginner',
      learningObjective: 'Explain why a load balancer needs health checks to deliver availability',
      options: [
        { id: 'a', label: 'Without them it would keep forwarding requests to a failed backend, so failures would still reach users', correct: true, explanation: 'Correct — health checks are what let it route around a dead backend.' },
        { id: 'b', label: 'Health checks make the backends faster', correct: false, explanation: 'They detect health; they do not change performance.' },
        { id: 'c', label: 'They are only needed for Layer 7 load balancers', correct: false, explanation: 'Both Layer 4 and Layer 7 load balancers use health checks.' },
      ],
    },
  ],
};

const distributionAlgorithms: LessonBody = {
  learningObjectives: [
    'Compare round robin, weighted, least connections, and hash-based distribution',
    'Explain session affinity and when it is necessary',
    'Distinguish connection distribution from request distribution',
  ],
  sections: [
    {
      heading: 'Choosing a backend',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Algorithm', 'How it chooses', 'Good when'],
          rows: [
            ['Round robin', 'Each new request goes to the next backend in order', 'Backends are equal and requests cost about the same'],
            ['Weighted round robin', 'Higher-weight backends get proportionally more requests', 'Backends differ in size, or you are shifting traffic gradually'],
            ['Least connections', 'The backend with the fewest active connections wins', 'Request durations vary, so simple round robin would pile long requests onto one backend'],
            ['Hash (for example source IP)', 'A hash of a key (client IP, a cookie) maps a client to a backend', 'You need the same client to return to the same backend (session affinity)'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Not every product offers every algorithm, and names differ. Treat these as concepts; the provider lessons cover what each service actually implements. The Configure Traffic Distribution lab lets you watch each one place requests.',
        },
      ],
    },
    {
      heading: 'Session affinity (sticky sessions)',
      blocks: [
        {
          type: 'paragraph',
          text: 'Session affinity keeps a client pinned to one backend — by hashing the client’s IP, or by a cookie the Layer 7 proxy issues. It is a workaround for backends that hold per-user state in memory (a shopping cart, a login session). It has real costs: load spreads less evenly, and when that backend fails or is removed, the client’s session is lost.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Affinity treats a symptom. The durable fix is a stateless application that stores session state in a shared cache or database, so any backend can serve any request and affinity is unnecessary. This is why stateless design and horizontal scaling go together.',
        },
      ],
    },
    {
      heading: 'Connections versus requests',
      blocks: [
        {
          type: 'paragraph',
          text: 'What gets distributed matters. A Layer 4 load balancer distributes connections: once a TCP connection is pinned to a backend, every request on that connection goes there. A Layer 7 proxy can distribute individual requests, because it terminates the client connection and makes its own backend connections. With long-lived connections (HTTP/2, gRPC, WebSockets) a Layer 4 balancer can distribute very unevenly — one client’s single connection carrying thousands of requests all land on one backend.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'lbf-algo-1',
      type: 'scenario',
      prompt: 'Requests to a service vary wildly in duration — some return in 10 ms, some take 20 s. Which algorithm best avoids overloading one backend with long requests?',
      difficulty: 'intermediate',
      learningObjective: 'Compare round robin, weighted, least connections, and hash-based distribution',
      options: [
        { id: 'a', label: 'Least connections — it sends new work to the backend currently doing the least', correct: true, explanation: 'Correct — it reacts to how busy each backend actually is.' },
        { id: 'b', label: 'Round robin — it is perfectly even', correct: false, explanation: 'Round robin is even in request count, but long requests can still accumulate on one backend.' },
        { id: 'c', label: 'Source IP hash', correct: false, explanation: 'Hashing pins clients to backends; it does not balance by current load.' },
      ],
    },
    {
      id: 'lbf-algo-2',
      type: 'single-choice',
      prompt: 'A single client opens one HTTP/2 connection and sends thousands of requests over it. Behind a Layer 4 load balancer, where do those requests go?',
      difficulty: 'advanced',
      learningObjective: 'Distinguish connection distribution from request distribution',
      options: [
        { id: 'a', label: 'All to one backend — Layer 4 pins the connection, and every request on it follows', correct: true, explanation: 'Correct — this is why Layer 7 (per-request) balancing suits multiplexed protocols.' },
        { id: 'b', label: 'Spread evenly across all backends', correct: false, explanation: 'Only a Layer 7 proxy distributes individual requests on one connection.' },
        { id: 'c', label: 'To a random backend per request', correct: false, explanation: 'A Layer 4 balancer does not see individual requests.' },
      ],
    },
  ],
};

const layer4VsLayer7: LessonBody = {
  learningObjectives: [
    'Explain the difference between Layer 4 connection forwarding and Layer 7 request routing',
    'Explain TLS termination versus TLS passthrough',
    'Decide when Layer 4 or Layer 7 is the better fit',
  ],
  sections: [
    {
      heading: 'Two layers, two kinds of decision',
      blocks: [
        {
          type: 'paragraph',
          text: 'The names come from the OSI model. A Layer 4 load balancer operates on transport-layer connections: it chooses a backend from the connection’s 5-tuple (source IP and port, destination IP and port, protocol) and forwards packets without reading them. A Layer 7 load balancer is a reverse proxy: it terminates the connection, reads the HTTP request, chooses a backend, and makes its own connection to it.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'Layer 4', 'Layer 7'],
          rows: [
            ['Works on', 'TCP/UDP connections', 'HTTP/HTTPS requests'],
            ['Can route by', 'IP and port only', 'Host, path, headers, cookies, method'],
            ['Reads the request?', 'No', 'Yes (terminates the connection first)'],
            ['TLS', 'Passthrough, or terminate with a TLS listener', 'Terminates (and can re-encrypt to the backend)'],
            ['Client IP at backend', 'Preserved (configurable), since there is no proxy', 'Replaced by the proxy’s IP; passed in X-Forwarded-For'],
            ['Typical strengths', 'Throughput, low latency, any TCP/UDP protocol', 'Content routing, redirects/rewrites, per-request features'],
          ],
        },
      ],
    },
    {
      heading: 'TLS termination versus passthrough',
      blocks: [
        {
          type: 'list',
          items: [
            'Termination: the load balancer holds the certificate and decrypts TLS. This is required for Layer 7 routing (you cannot read an encrypted request) and centralises certificate management, at the cost of the balancer seeing plaintext.',
            'Passthrough: a Layer 4 balancer forwards the encrypted bytes to the backend, which terminates TLS itself. The balancer never sees plaintext, but it also cannot route by anything inside the request.',
            'Re-encryption: a Layer 7 proxy can terminate the client’s TLS and open a new TLS connection to the backend, so traffic is encrypted on both hops.',
          ],
        },
      ],
    },
    {
      heading: 'A decision framework',
      blocks: [
        {
          type: 'list',
          items: [
            'Choose Layer 4 for non-HTTP protocols, extreme throughput or very low latency, long-lived connections, or when the backend must see the real client IP with no proxy in the path.',
            'Choose Layer 7 for HTTP routing by host or path, TLS termination and central certificates, redirects, rewrites, header manipulation, cookie-based affinity, or per-request WAF and authentication.',
            'Combine them: a common pattern puts a Layer 4 balancer in front for raw ingress and a Layer 7 proxy behind it for routing — or uses a global Layer 7 service at the edge and a regional balancer inside.',
          ],
        },
      ],
    },
  ],
  visualization: l4VsL7Scene,
  knowledgeCheck: [
    {
      id: 'lbf-l47-1',
      type: 'scenario',
      prompt: 'You need to send requests for /api/* to one backend pool and everything else to another, behind one HTTPS address. Which layer is required?',
      difficulty: 'intermediate',
      learningObjective: 'Explain the difference between Layer 4 connection forwarding and Layer 7 request routing',
      options: [
        { id: 'a', label: 'Layer 7 — routing by path requires reading the HTTP request, which means terminating TLS', correct: true, explanation: 'Correct — a Layer 4 balancer cannot see the path.' },
        { id: 'b', label: 'Layer 4 — it can read the URL path', correct: false, explanation: 'Layer 4 sees only IPs and ports, not the path.' },
        { id: 'c', label: 'Either works identically', correct: false, explanation: 'Only Layer 7 can route by path.' },
      ],
    },
    {
      id: 'lbf-l47-2',
      type: 'single-choice',
      prompt: 'An application behind a Layer 7 proxy logs every client as the same IP address. Why, and what fixes it?',
      difficulty: 'intermediate',
      learningObjective: 'Explain the difference between Layer 4 connection forwarding and Layer 7 request routing',
      options: [
        { id: 'a', label: 'The proxy makes its own connection, so the backend sees the proxy’s IP; read the client IP from the X-Forwarded-For header instead', correct: true, explanation: 'Correct — Layer 7 proxies pass the original client IP in a header.' },
        { id: 'b', label: 'The clients really do share one IP', correct: false, explanation: 'The shared IP is the proxy’s, not the clients’.' },
        { id: 'c', label: 'TLS termination hides the client IP permanently', correct: false, explanation: 'The client IP is available in X-Forwarded-For.' },
      ],
    },
  ],
};

const healthChecks: LessonBody = {
  learningObjectives: [
    'Distinguish active from passive health checks',
    'Explain probe intervals and healthy/unhealthy thresholds and the delays they create',
    'Distinguish reachable from ready, and liveness from readiness from startup checks',
  ],
  sections: [
    {
      heading: 'Active and passive checks',
      blocks: [
        {
          type: 'list',
          items: [
            'Active health checks: the load balancer probes each backend on a schedule — a TCP connection, or an HTTP GET to a health path — and marks it healthy or unhealthy from the result.',
            'Passive health checks (outlier detection): the balancer watches real traffic and ejects a backend that returns errors or times out, without a separate probe. Many systems use both.',
          ],
        },
        {
          type: 'comparisonTable',
          headers: ['Probe type', 'Checks', 'Blind spot'],
          rows: [
            ['TCP', 'That the port accepts a connection', 'The process can accept connections while the app is broken'],
            ['HTTP/HTTPS', 'That a health path returns a success status', 'Only as good as what the health endpoint actually verifies'],
          ],
        },
      ],
    },
    {
      heading: 'Thresholds, intervals, and the delays they create',
      blocks: [
        {
          type: 'paragraph',
          text: 'A single failed probe does not remove a backend — that would make a momentary blip an outage. Instead a backend is removed after a number of consecutive failures (the unhealthy threshold) and returned after a number of consecutive successes (the healthy threshold). This smooths out flapping, but it also creates delay:',
        },
        {
          type: 'code',
          code: 'detection delay  ≈ unhealthy threshold × probe interval\nrecovery delay   ≈ healthy threshold   × probe interval\n\nexample: 3 failures × 5 s  = ~15 s before a dead backend leaves rotation\n         2 successes × 5 s = ~10 s before a recovered one returns',
          caption: 'Shorter intervals and lower thresholds detect faster but react to transient blips more readily. The Recover from Backend Failure lab lets you tune these.',
        },
      ],
    },
    {
      heading: 'Reachable is not ready; draining on the way out',
      blocks: [
        {
          type: 'paragraph',
          text: 'A backend can accept a connection long before it can serve real requests — caches are cold, dependencies are not connected, configuration is still loading. A good health endpoint reports ready, not merely reachable. Orchestrators formalise this with three probes:',
        },
        {
          type: 'comparisonTable',
          headers: ['Probe', 'Question', 'On failure'],
          rows: [
            ['Startup', 'Has the app finished starting?', 'Keep waiting; do not kill a slow starter'],
            ['Readiness', 'Can it serve requests right now?', 'Remove from rotation (but keep running)'],
            ['Liveness', 'Is it still alive, or wedged?', 'Restart the instance'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'On the way out, connection draining (deregistration delay) lets in-flight requests finish before a backend is removed — during a deploy or scale-in — so users are not cut off mid-request.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'lbf-hc-1',
      type: 'scenario',
      prompt: 'A backend accepts TCP connections but every HTTP request returns 500 because its database connection is down. A TCP health check is configured. What does the load balancer think?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish reachable from ready, and liveness from readiness from startup checks',
      options: [
        { id: 'a', label: 'It thinks the backend is healthy and keeps sending traffic — a TCP probe only proves the port is open, not that the app works', correct: true, explanation: 'Correct — use an HTTP health check that exercises key dependencies.' },
        { id: 'b', label: 'It removes the backend, because requests are failing', correct: false, explanation: 'A TCP probe does not see the HTTP 500s.' },
        { id: 'c', label: 'It restarts the backend', correct: false, explanation: 'A load balancer removes from rotation; it does not restart instances.' },
      ],
    },
    {
      id: 'lbf-hc-2',
      type: 'single-choice',
      prompt: 'With a 10-second interval and an unhealthy threshold of 3, roughly how long after a backend dies does it stop receiving traffic?',
      difficulty: 'beginner',
      learningObjective: 'Explain probe intervals and healthy/unhealthy thresholds and the delays they create',
      options: [
        { id: 'a', label: 'About 30 seconds (3 × 10 s)', correct: true, explanation: 'Correct — detection delay ≈ threshold × interval.' },
        { id: 'b', label: 'Immediately', correct: false, explanation: 'The threshold requires several consecutive failures first.' },
        { id: 'c', label: 'About 10 seconds', correct: false, explanation: 'One failed probe is not enough; three are needed.' },
      ],
    },
    {
      id: 'lbf-hc-3',
      type: 'single-choice',
      prompt: 'What is the purpose of connection draining (deregistration delay) when removing a backend during a deployment?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish active from passive health checks',
      options: [
        { id: 'a', label: 'To let in-flight requests finish before the backend is removed, instead of cutting them off', correct: true, explanation: 'Correct — it enables graceful deploys and scale-in.' },
        { id: 'b', label: 'To speed up how fast new backends receive traffic', correct: false, explanation: 'Draining is about removal, not onboarding.' },
        { id: 'c', label: 'To encrypt connections during the deploy', correct: false, explanation: 'Draining is unrelated to encryption.' },
      ],
    },
  ],
};

const azureLandscape: LessonBody = {
  learningObjectives: [
    'Map the main Azure load balancing services to Layer 4, Layer 7, regional, and global',
    'Explain that these services have different responsibilities and are often combined',
  ],
  sections: [
    {
      heading: 'Four services, four jobs',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Service', 'Layer', 'Scope', 'Use for'],
          rows: [
            ['Azure Load Balancer', 'Layer 4 (TCP/UDP)', 'Regional', 'High-throughput connection balancing within a region'],
            ['Azure Application Gateway', 'Layer 7 (HTTP/S)', 'Regional', 'Path/host routing, TLS termination, WAF, cookie affinity in a VNet'],
            ['Azure Front Door', 'Layer 7 (HTTP/S)', 'Global (edge, anycast)', 'Global HTTP delivery, routing, caching, and WAF at the edge'],
            ['Azure Traffic Manager', 'DNS', 'Global', 'DNS-based routing across endpoints (it never sees the traffic itself)'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'These are not interchangeable. Traffic Manager steers clients with DNS answers; it is not in the request path. Front Door is a global proxy that is. Application Gateway is a regional proxy inside your network. Azure Load Balancer is Layer 4 and does not read HTTP at all.',
        },
      ],
    },
    {
      heading: 'Health probes',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Load Balancer (Standard) supports TCP, HTTP, and HTTPS health probes; a backend is taken out of rotation after a configured number of consecutive failures. Application Gateway and Front Door run their own HTTP(S) health probes against backends. Across these services, probe interval and thresholds are configurable rather than fixed guarantees.',
        },
        {
          type: 'paragraph',
          text: 'A frequent production design layers them: Front Door at the global edge for routing, caching, and WAF; Application Gateway or Azure Load Balancer inside each region for the regional tier. The provider comparison lesson sets Azure against AWS directly.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure load balancing services',
    keyFeatures: [
      'Azure Load Balancer: Layer 4 TCP/UDP, regional, with TCP/HTTP/HTTPS health probes',
      'Application Gateway: Layer 7 regional, path/host routing, TLS termination, WAF, cookie affinity',
      'Azure Front Door: global Layer 7 at the anycast edge, with routing, caching, and WAF',
      'Traffic Manager: DNS-based global routing with six routing methods',
    ],
    terminology: {
      'Layer 4 regional load balancer': 'Azure Load Balancer',
      'Layer 7 regional load balancer': 'Azure Application Gateway',
      'Global HTTP edge service': 'Azure Front Door',
      'DNS-based global routing': 'Azure Traffic Manager',
      'Backend pool': 'Backend pool',
    },
    architecturalNotes: [
      'Front Door is global and at the edge; Application Gateway is regional and in your VNet.',
      'Traffic Manager works at DNS and is not in the data path.',
      'Front Door and Application Gateway are frequently combined (global edge + regional).',
    ],
    limitations: [
      'Feature availability (for example WAF managed rules, bot protection) depends on the Front Door tier (Standard vs Premium).',
      'Azure Load Balancer does not read HTTP, so it cannot route by host or path.',
    ],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/load-balancing-overview',
  },
  knowledgeCheck: [
    {
      id: 'lbf-az-1',
      type: 'scenario',
      prompt: 'You need global HTTP routing with edge caching and a WAF in front of backends in two regions. Which Azure service is the primary choice?',
      difficulty: 'intermediate',
      learningObjective: 'Map the main Azure load balancing services to Layer 4, Layer 7, regional, and global',
      options: [
        { id: 'a', label: 'Azure Front Door', correct: true, explanation: 'Correct — global Layer 7 at the edge with routing, caching, and WAF.' },
        { id: 'b', label: 'Azure Load Balancer', correct: false, explanation: 'That is Layer 4 and regional; it cannot route HTTP or cache.' },
        { id: 'c', label: 'Traffic Manager alone', correct: false, explanation: 'Traffic Manager only answers DNS; it is not in the request path and does not cache or run a WAF.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Load balancing options (Azure Architecture Center)', url: 'https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/load-balancing-overview' },
    { label: 'Azure Load Balancer health probes', url: 'https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-custom-probe-overview' },
  ],
};

const awsLandscape: LessonBody = {
  learningObjectives: [
    'Map the Elastic Load Balancing family and Route 53 to Layer 4, Layer 7, and DNS',
    'Explain where Global Accelerator and CloudFront fit, and how they differ',
  ],
  sections: [
    {
      heading: 'Elastic Load Balancing and friends',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Service', 'Layer', 'Scope', 'Use for'],
          rows: [
            ['Application Load Balancer (ALB)', 'Layer 7 (HTTP/S)', 'Regional', 'Host/path/header routing, TLS termination, redirects, authentication'],
            ['Network Load Balancer (NLB)', 'Layer 4 (TCP/UDP/TLS)', 'Regional', 'Very high throughput, low latency, static IPs, source-IP preservation'],
            ['Gateway Load Balancer (GWLB)', 'Layer 3 gateway', 'Regional', 'Inserting third-party network appliances (firewalls, IDS) transparently'],
            ['Route 53', 'DNS', 'Global', 'DNS-based routing policies (weighted, latency, failover, geolocation, …)'],
            ['Global Accelerator', 'Layer 4 (TCP/UDP)', 'Global (anycast)', 'Static anycast IPs and fast regional failover over the AWS backbone'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'NLB preserves the client IP for instance targets by default and can be configured for IP targets; it can terminate TLS with a TLS listener, or pass it through with a TCP listener. ALB always terminates the connection to read the request, and passes the client IP in X-Forwarded-For.',
        },
      ],
    },
    {
      heading: 'Global Accelerator versus CloudFront',
      blocks: [
        {
          type: 'paragraph',
          text: 'Both use AWS’s edge network, but they do different jobs. Global Accelerator gives you two static anycast IP addresses and proxies TCP/UDP traffic from the nearest edge to your regional endpoints over the AWS backbone, with fast failover — it does not cache. CloudFront is a CDN: it caches content at the edge and accelerates HTTP(S) delivery. They are often used together, and CloudFront is not a drop-in equivalent for every global load-balancing need.',
        },
      ],
    },
    {
      heading: 'Health checks',
      blocks: [
        {
          type: 'paragraph',
          text: 'ALB and NLB check backend health through target group health checks (HTTP or TCP), with configurable intervals and healthy/unhealthy thresholds and connection draining via deregistration delay. Route 53 has its own health checks that drive DNS failover. As always, intervals and thresholds are configuration, not guarantees.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS Elastic Load Balancing, Route 53, and Global Accelerator',
    keyFeatures: [
      'ALB: Layer 7 regional routing by host, path, header, and method',
      'NLB: Layer 4 regional, high throughput, static IPs, client-IP preservation, TLS or TCP listeners',
      'Gateway Load Balancer for transparent appliance insertion',
      'Route 53: DNS-based routing policies with health checks',
      'Global Accelerator: static anycast IPs and TCP/UDP acceleration with fast failover',
    ],
    terminology: {
      'Layer 7 regional load balancer': 'Application Load Balancer (ALB)',
      'Layer 4 regional load balancer': 'Network Load Balancer (NLB)',
      'DNS-based global routing': 'Amazon Route 53 routing policies',
      'Global anycast acceleration': 'AWS Global Accelerator',
      'Backend pool': 'Target group',
    },
    architecturalNotes: [
      'ALB and NLB are regional; Route 53 and Global Accelerator are global.',
      'Global Accelerator proxies TCP/UDP and provides static IPs; CloudFront caches HTTP content.',
      'Target groups define the backend pool and its health checks.',
    ],
    limitations: [
      'NLB client-IP preservation defaults differ by target type (instance vs IP).',
      'CloudFront is a CDN, not a general equivalent of Global Accelerator or a Layer 7 load balancer.',
    ],
    documentationUrl: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html',
  },
  knowledgeCheck: [
    {
      id: 'lbf-aws-1',
      type: 'scenario',
      prompt: 'A UDP-based game service needs static IP addresses clients can allow-list and fast failover between regions. Which AWS service fits?',
      difficulty: 'intermediate',
      learningObjective: 'Explain where Global Accelerator and CloudFront fit, and how they differ',
      options: [
        { id: 'a', label: 'AWS Global Accelerator — static anycast IPs and TCP/UDP acceleration with fast regional failover', correct: true, explanation: 'Correct — CloudFront is for cacheable HTTP content, not UDP.' },
        { id: 'b', label: 'Amazon CloudFront', correct: false, explanation: 'CloudFront is an HTTP CDN and does not serve UDP.' },
        { id: 'c', label: 'An Application Load Balancer', correct: false, explanation: 'ALB is regional and HTTP-only.' },
      ],
    },
    {
      id: 'lbf-aws-2',
      type: 'single-choice',
      prompt: 'Which AWS load balancer preserves the client’s source IP to the target (for instance targets) without a proxy in the path?',
      difficulty: 'intermediate',
      learningObjective: 'Map the Elastic Load Balancing family and Route 53 to Layer 4, Layer 7, and DNS',
      options: [
        { id: 'a', label: 'Network Load Balancer (Layer 4)', correct: true, explanation: 'Correct — NLB preserves the client IP for instance targets by default.' },
        { id: 'b', label: 'Application Load Balancer', correct: false, explanation: 'ALB is a proxy; the backend sees the ALB’s IP, with the client IP in X-Forwarded-For.' },
        { id: 'c', label: 'Route 53', correct: false, explanation: 'Route 53 is DNS; it is not in the data path.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'What is Elastic Load Balancing?', url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html' },
    { label: 'CloudFront and Global Accelerator compared', url: 'https://aws.amazon.com/compare/cloudfront-and-global-accelerator/' },
  ],
};

const comparison: LessonBody = {
  learningObjectives: ['Map Azure and AWS load balancing services by layer and scope without forcing exact equivalence'],
  sections: [
    {
      heading: 'Side by side',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Job', 'Azure', 'AWS', 'Note'],
          rows: [
            ['Layer 4 regional', 'Azure Load Balancer', 'Network Load Balancer', 'Both TCP/UDP; details like client-IP preservation differ'],
            ['Layer 7 regional', 'Application Gateway', 'Application Load Balancer', 'Both terminate TLS and route by host/path; feature sets differ'],
            ['Global HTTP edge', 'Front Door', 'CloudFront (+ ALB/Route 53)', 'Partial: Front Door bundles routing+caching+WAF; AWS composes several services'],
            ['DNS-based global routing', 'Traffic Manager', 'Route 53 routing policies', 'Both answer DNS; Route 53 has more policy types'],
            ['Anycast L4 acceleration', '— (Front Door is L7)', 'Global Accelerator', 'No direct Azure equivalent for L4 anycast acceleration'],
            ['Transparent appliance insertion', 'Gateway Load Balancer', 'Gateway Load Balancer', 'Similar role on both'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'These pairs are not drop-in equivalents. Front Door (global L7 proxy) and Traffic Manager (DNS) do different things that AWS splits across CloudFront, Route 53, and Global Accelerator. Match on the job — layer, scope, and whether the service is in the data path — not on the marketing category.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'lbf-cmp-1',
      type: 'single-choice',
      prompt: 'Which statement is accurate about Azure Traffic Manager and the AWS equivalent?',
      difficulty: 'intermediate',
      learningObjective: 'Map Azure and AWS load balancing services by layer and scope without forcing exact equivalence',
      options: [
        { id: 'a', label: 'Both Traffic Manager and Route 53 routing policies steer clients at DNS and are not in the request path', correct: true, explanation: 'Correct — they return DNS answers; the data flows directly to the chosen endpoint.' },
        { id: 'b', label: 'Both are Layer 7 proxies that terminate TLS', correct: false, explanation: 'Neither is in the data path; they answer DNS.' },
        { id: 'c', label: 'Traffic Manager caches content like a CDN', correct: false, explanation: 'DNS routing does not cache content.' },
      ],
    },
  ],
};

const configureTrafficLab: LabBody = {
  difficulty: 'beginner',
  estimatedTime: '20 minutes',
  description:
    'Send requests through a load balancer and watch each algorithm place them across a backend pool. Change the algorithm, mark a backend unhealthy, and compare the distribution. Deterministic and simulated in your browser — no traffic is generated.',
  learningObjectives: [
    'Predict how round robin, weighted, least connections, and IP hash distribute requests',
    'Explain how session affinity pins a client to a backend and what breaks it',
    'Explain what happens to distribution when a backend becomes unhealthy',
  ],
  prerequisites: [
    { type: 'concept', id: 'distribution-algorithms', label: 'Distribution Algorithms and Session Affinity', description: 'The algorithms this lab demonstrates.' },
  ],
  content: {
    simulationId: trafficDistributionSimulation.id,
    instructions: [
      { id: 'rr', label: '1. Round robin', description: 'Run the default. Step through and watch requests cycle evenly across the three backends.' },
      { id: 'weighted', label: '2. Weighted', description: 'Switch to weighted round robin. web-1 has weight 3; it should receive about three times as many requests as the others.' },
      { id: 'leastconn', label: '3. Least connections', description: 'Switch to least connections and watch each request go to the currently least-loaded backend.' },
      { id: 'affinity', label: '4. Session affinity', description: 'Switch to source IP hash. Note that each client IP always lands on the same backend — that is affinity.' },
      { id: 'unhealthy', label: '5. Remove a backend', description: 'Mark web-1 unhealthy and replay. It receives nothing; with IP hash, clients that used to hash to it are remapped and their affinity is lost.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'weighted-skew',
        label: 'With weighted distribution, web-1 received more requests than web-2',
        check: (state) => {
          const s = state as TrafficState;
          const b1 = s.backends.find((b) => b.id === 'b1');
          const b2 = s.backends.find((b) => b.id === 'b2');
          return s.config.algorithm === 'weighted' && !!b1 && !!b2 && b1.count > b2.count;
        },
      },
      {
        id: 'unhealthy-zero',
        label: 'An unhealthy backend received zero requests',
        check: (state) => {
          const s = state as TrafficState;
          const down = s.backends.find((b) => !b.healthy);
          return !!down && down.count === 0 && s.assigned.length > 0;
        },
      },
      {
        id: 'affinity-seen',
        label: 'Ran the source IP hash algorithm to observe session affinity',
        check: (state) => (state as TrafficState).config.algorithm === 'ip-hash' && (state as TrafficState).assigned.length > 0,
      },
    ],
  },
};

const recoverFailureLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Run active health probes against a backend that fails and later recovers. Tune the interval and thresholds and watch when the backend leaves and rejoins rotation, and how much delay each choice adds. Deterministic and simulated; timings are illustrative.',
  learningObjectives: [
    'Explain how consecutive-failure and consecutive-success thresholds decide rotation',
    'Quantify detection and recovery delay from interval and thresholds',
    'Explain why thresholds exist (tolerating transient blips) and their cost',
  ],
  prerequisites: [
    { type: 'concept', id: 'health-checks', label: 'Health Checks and Backend Availability', description: 'Active checks, thresholds, and draining.' },
  ],
  content: {
    simulationId: healthCheckSimulation.id,
    instructions: [
      { id: 'detect', label: '1. Detection', description: 'Run the default (fails, then recovers). Watch the backend leave rotation only after three consecutive failed probes.' },
      { id: 'recover', label: '2. Recovery', description: 'Keep stepping. The backend returns only after two consecutive successes — note the recovery delay.' },
      { id: 'tune-fast', label: '3. React faster', description: 'Set the unhealthy threshold to 1. Detection is immediate — now switch to the flapping scenario and see the downside.' },
      { id: 'tune-smooth', label: '4. Tolerate blips', description: 'Raise the unhealthy threshold back to 3 on the flapping scenario. Brief blips no longer remove the backend.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'removed',
        label: 'Observed a backend removed from rotation after reaching the unhealthy threshold',
        check: (state) => (state as HealthState).probes.some((p) => p.transition === 'removed'),
      },
      {
        id: 'restored',
        label: 'Observed the backend restored after reaching the healthy threshold',
        check: (state) => (state as HealthState).probes.some((p) => p.transition === 'restored'),
      },
      {
        id: 'immediate',
        label: 'Set the unhealthy threshold to 1 to detect a failure on the first failed probe',
        check: (state) => {
          const s = state as HealthState;
          return s.config.unhealthyThreshold === 1 && s.probes.some((p) => p.transition === 'removed');
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'why-load-balancing': whyLoadBalancing,
    'distribution-algorithms': distributionAlgorithms,
    'layer-4-vs-layer-7': layer4VsLayer7,
    'health-checks': healthChecks,
    'azure-load-balancing-landscape': azureLandscape,
    'aws-load-balancing-landscape': awsLandscape,
    'load-balancing-comparison': comparison,
  },
  labs: {
    'configure-traffic-distribution-lab': configureTrafficLab,
    'recover-from-backend-failure-lab': recoverFailureLab,
  },
  simulations: {
    'configure-traffic-distribution-lab': bindSimulation(trafficDistributionSimulation, renderTrafficState),
    'recover-from-backend-failure-lab': bindSimulation(healthCheckSimulation, renderHealthState),
  },
};
