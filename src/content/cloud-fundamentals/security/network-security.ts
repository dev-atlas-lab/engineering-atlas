import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { layeredEdgeScene } from './network-security.scenes';
import { edgeProtectionSimulation, type EdgeState } from './edge-protection';
import { renderEdgeState } from './edge-protection-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const cloudFirewalls: LessonBody = {
  learningObjectives: [
    'Place security rules, network firewalls, and web application firewalls at the layers where each works',
    'Explain stateful inspection, threat intelligence, IDPS, and TLS inspection in managed firewalls',
    'Explain why egress filtering matters after a compromise',
  ],
  analogy:
    'Security rules are the locks on each office door. A central network firewall is the building’s reception desk, which checks everyone coming and going — including people leaving with boxes.',
  sections: [
    {
      heading: 'Filters at different layers',
      blocks: [
        {
          type: 'paragraph',
          text: 'Virtual Networks introduced security rules — Azure network security groups and AWS security groups and network ACLs — which allow or deny traffic by address, port, and protocol on each subnet or interface. They are essential and free, but they are distributed (configured per resource) and only understand layers 3 and 4. Cloud security architectures add controls that work at other layers or centrally:',
        },
        {
          type: 'comparisonTable',
          headers: ['Control', 'Sees', 'Typical placement', 'Good at'],
          rows: [
            ['Security rules (NSG, security group, NACL)', 'IP addresses, ports, protocols', 'Every subnet or interface', 'Allowing only required paths between tiers'],
            ['Network firewall (managed)', 'Connections and, with inspection, application protocols and domain names', 'A hub network that spokes route through', 'Central allow-lists for outbound traffic, threat-intelligence blocking, intrusion detection and prevention'],
            ['Web application firewall', 'Full HTTP requests', 'In front of web apps: application gateway, load balancer, CDN, API gateway', 'Blocking malicious request patterns, rate limiting, bots'],
            ['DDoS protection', 'Traffic volumes and packet patterns', 'The provider’s network edge', 'Absorbing floods that would overwhelm anything behind it'],
          ],
        },
      ],
    },
    {
      heading: 'What a managed network firewall adds',
      blocks: [
        {
          type: 'list',
          items: [
            'Stateful inspection: it tracks connections, so replies are allowed automatically while unsolicited traffic is not — as security groups and NSGs also do.',
            'Domain-name (FQDN) rules: “allow outbound HTTPS only to api.payments.example and the OS update servers” — far more maintainable than lists of IP addresses that change.',
            'Threat intelligence: block traffic to and from known-malicious addresses and domains.',
            'Intrusion detection and prevention (IDPS): signatures that recognise exploit and malware traffic.',
            'TLS inspection: decrypting and re-encrypting traffic so encrypted payloads can be inspected. Powerful, but it requires the firewall to hold a trusted certificate authority, adds latency, and needs privacy review.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Traffic only passes a central firewall if routing sends it there. In hub-and-spoke designs, spoke route tables point 0.0.0.0/0 — and often traffic between spokes — at the firewall (see Subnets and Routing and Connecting Networks).',
        },
      ],
    },
    {
      heading: 'Why egress matters',
      blocks: [
        {
          type: 'paragraph',
          text: 'Most network designs filter inbound traffic carefully and allow all outbound traffic. But after a compromise, the attacker’s next steps are outbound: contacting a command-and-control server, downloading tools, and uploading stolen data. An outbound allow-list on the central firewall turns many compromises into contained incidents and produces logs of the attempts.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Firewalls are not identity. A rule allowing the app subnet to reach the database does not say which application, user, or process is connecting. Combine network rules with authentication and authorization on every service.',
        },
      ],
    },
  ],
  visualization: layeredEdgeScene,
  knowledgeCheck: [
    {
      id: 'fw-kc-1',
      type: 'scenario',
      prompt:
        'A compromised VM tries to upload data to an unfamiliar storage endpoint on the internet. Its subnet’s security rules allow all outbound traffic. Which control would stop this?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why egress filtering matters after a compromise',
      options: [
        { id: 'a', label: 'A central firewall that the subnet routes through, allowing outbound traffic only to approved destinations', correct: true, explanation: 'Correct — egress allow-lists stop exfiltration to unknown destinations.' },
        { id: 'b', label: 'A web application firewall in front of the site', correct: false, explanation: 'A WAF inspects inbound HTTP requests to your app, not outbound connections from your servers.' },
        { id: 'c', label: 'DDoS protection', correct: false, explanation: 'DDoS protection absorbs inbound floods; it does not filter outbound connections.' },
      ],
    },
    {
      id: 'fw-kc-2',
      type: 'single-choice',
      prompt: 'Why are domain-name (FQDN) rules often preferred over IP rules for outbound traffic to SaaS APIs?',
      difficulty: 'beginner',
      learningObjective: 'Explain stateful inspection, threat intelligence, IDPS, and TLS inspection in managed firewalls',
      options: [
        { id: 'a', label: 'SaaS providers change their IP addresses often; a domain-name rule follows them', correct: true, explanation: 'Correct — IP lists for large SaaS platforms are long and change frequently.' },
        { id: 'b', label: 'Domain-name rules encrypt the traffic', correct: false, explanation: 'They filter; they do not encrypt.' },
        { id: 'c', label: 'IP rules are not supported by cloud firewalls', correct: false, explanation: 'They are; they are just harder to maintain for changing destinations.' },
      ],
    },
  ],
};

const wafAndDdos: LessonBody = {
  learningObjectives: [
    'Distinguish network-layer and application-layer DDoS attacks and where each is mitigated',
    'Explain how WAF managed rules, custom rules, rate-based rules, and detection mode work',
    'Explain what a WAF cannot do',
  ],
  sections: [
    {
      heading: 'Three kinds of denial of service',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Kind', 'Example', 'Mitigated by'],
          rows: [
            ['Volumetric (L3/L4)', 'UDP reflection floods that saturate links', 'Provider-scale DDoS mitigation at the network edge'],
            ['Protocol (L3/L4)', 'SYN floods exhausting connection state', 'Provider DDoS mitigation; proxies and load balancers that absorb connection setup'],
            ['Application layer (L7)', 'Floods of valid-looking HTTP requests to expensive pages', 'WAF rate-based rules, bot controls, caching at a CDN, and autoscaling'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Both providers include baseline network-layer DDoS protection automatically. Paid tiers — Azure DDoS Network Protection or IP Protection, AWS Shield Advanced — tune detection to your resources’ traffic and add telemetry, alerts, and access to the provider’s DDoS response specialists; Azure DDoS Network Protection and Shield Advanced also offer cost protection for scaling during an attack. Application-layer floods need L7 controls: Azure directs these to WAF, and AWS Shield Advanced can automatically add WAF rate-based rules for protected resources that have a web ACL.',
        },
      ],
    },
    {
      heading: 'How a WAF evaluates a request',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Custom rules run first or by priority: allow or block by IP, geography, header, or path — including rate-based rules that count requests per client over a time window.',
            'Managed rule sets maintained by the provider recognise common attack patterns: SQL injection, cross-site scripting, protocol violations, known-bad inputs, and (with bot rules) automated clients.',
            'Each matching rule takes its action — block, allow, log, or challenge — or contributes to an anomaly score that blocks when it crosses a threshold.',
            'Every match is logged, which is how you find attacks and tune false positives.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Run new WAF policies in detection (log-only) mode first. Legitimate traffic sometimes looks suspicious — a support form that accepts code snippets, for example — and blocking it in production is a self-inflicted outage. Tune with exclusions, then switch to prevention.',
        },
      ],
    },
    {
      heading: 'What a WAF cannot do',
      blocks: [
        {
          type: 'list',
          items: [
            'It does not know your business rules. A well-formed request from a signed-in customer to an admin page is not malicious-looking; only application authorization can deny it.',
            'It recognises patterns, not intent. Novel attack variants and logic flaws pass through, which is why secure coding remains necessary.',
            'It sees only traffic routed through it. A backend that is also reachable directly — bypassing the CDN or gateway — bypasses the WAF too; restrict the origin to accept traffic only from the front end.',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'waf-kc-1',
      type: 'scenario',
      prompt:
        'A site slows to a crawl under thousands of valid search requests per minute from a few hundred IP addresses. Network-layer DDoS protection reports nothing. What is the most appropriate control?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish network-layer and application-layer DDoS attacks and where each is mitigated',
      options: [
        { id: 'a', label: 'WAF rate-based rules and bot controls in front of the search endpoint, plus caching where possible', correct: true, explanation: 'Correct — this is an application-layer flood; it looks like normal traffic to network-layer protection.' },
        { id: 'b', label: 'Upgrade to the enhanced network DDoS tier and do nothing else', correct: false, explanation: 'Network-layer tiers do not interpret HTTP; on AWS, Shield Advanced helps only through WAF rules on a web ACL.' },
        { id: 'c', label: 'Add a managed SQL injection rule set', correct: false, explanation: 'The requests are not injection attempts; pattern rules will not match.' },
      ],
    },
    {
      id: 'waf-kc-2',
      type: 'single-choice',
      prompt: 'Why should a new WAF policy usually start in detection mode?',
      difficulty: 'beginner',
      learningObjective: 'Explain how WAF managed rules, custom rules, rate-based rules, and detection mode work',
      options: [
        { id: 'a', label: 'To find and tune false positives before blocking legitimate users', correct: true, explanation: 'Correct.' },
        { id: 'b', label: 'Because prevention mode is not available initially', correct: false, explanation: 'Prevention can be enabled at any time; detection first is a practice, not a limitation.' },
        { id: 'c', label: 'Detection mode blocks more attacks', correct: false, explanation: 'Detection mode blocks nothing; it only logs.' },
      ],
    },
    {
      id: 'waf-kc-3',
      type: 'single-choice',
      prompt: 'A WAF protects a CDN endpoint, but the origin servers also accept requests directly from the internet. What is the risk?',
      difficulty: 'advanced',
      learningObjective: 'Explain what a WAF cannot do',
      options: [
        { id: 'a', label: 'Attackers who find the origin can bypass the WAF entirely', correct: true, explanation: 'Correct — lock the origin down to accept traffic only from the CDN or gateway.' },
        { id: 'b', label: 'None — the WAF protects the origin wherever requests come from', correct: false, explanation: 'A WAF only inspects traffic that passes through it.' },
        { id: 'c', label: 'The CDN cache will be disabled', correct: false, explanation: 'Caching is unaffected; the problem is the bypass path.' },
      ],
    },
  ],
};

const segmentation: LessonBody = {
  learningObjectives: [
    'Use network segmentation and private endpoints as security controls',
    'Layer network security policy across organization, network, and resource levels',
  ],
  sections: [
    {
      heading: 'Segmentation limits blast radius',
      blocks: [
        {
          type: 'paragraph',
          text: 'Segmentation divides a network so that each part can reach only what it needs: web tier to app tier on one port, app tier to database on one port, nothing else. It does not prevent the first compromise; it decides how far an attacker can move afterwards. Separate networks (or accounts and subscriptions) per environment are the coarsest segmentation; per-tier subnets and security rules are finer; per-workload rules and identity-aware service-to-service authorization are the finest.',
        },
      ],
    },
    {
      heading: 'Private connectivity removes exposure',
      blocks: [
        {
          type: 'paragraph',
          text: 'Managed data services — storage, databases, key vaults — have public endpoints by default, protected by authentication and optional IP rules. Private endpoints (Azure Private Link, AWS PrivateLink interface endpoints) give the service a private IP address inside your network instead, and the public endpoint can then be disabled. The service is no longer reachable from the internet at all, and traffic to it stays on the provider’s network.',
        },
        {
          type: 'comparisonTable',
          headers: ['Option', 'Azure', 'AWS'],
          rows: [
            ['Private IP for a service in your network', 'Private endpoint (Private Link)', 'Interface VPC endpoint (PrivateLink)'],
            ['Private route to a service’s public endpoint', 'Service endpoint', 'Gateway VPC endpoint (Amazon S3 and DynamoDB)'],
            ['Restrict a service to your network', 'Disable public network access; service firewall rules', 'Endpoint policies; resource policies conditioned on the VPC endpoint'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Private connectivity changes reachability, not authorization. A private endpoint still needs identity-based access control, as Subnets and Routing showed for private IP addresses in general.',
        },
      ],
    },
    {
      heading: 'Layering network policy',
      blocks: [
        {
          type: 'list',
          items: [
            'Organization level: central policy that every team inherits — for example Azure Firewall Manager policies or AWS Firewall Manager policies for WAF, security groups, and Network Firewall across accounts, and governance rules forbidding public IPs on databases.',
            'Network level: hub firewalls, routing that forces traffic through them, and segment boundaries.',
            'Resource level: security rules, service firewalls, and private endpoints for each workload.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Higher layers set guarantees that individual teams cannot accidentally undo; lower layers express each workload’s specific needs.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'seg-kc-1',
      type: 'scenario',
      prompt: 'A storage account is accessed only by apps in one virtual network. Which change removes it from the internet entirely?',
      difficulty: 'intermediate',
      learningObjective: 'Use network segmentation and private endpoints as security controls',
      options: [
        { id: 'a', label: 'Add a private endpoint in the virtual network and disable public network access on the account', correct: true, explanation: 'Correct — the service now has only a private address.' },
        { id: 'b', label: 'Enable encryption at rest', correct: false, explanation: 'Encryption at rest does not change reachability.' },
        { id: 'c', label: 'Use a longer account key', correct: false, explanation: 'The public endpoint would still be reachable.' },
      ],
    },
  ],
};

const azureNetworkSecurity: LessonBody = {
  learningObjectives: ['Describe Azure Firewall, Azure Web Application Firewall, and Azure DDoS Protection and where each is deployed'],
  sections: [
    {
      heading: 'Azure Firewall',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Firewall is a managed, stateful firewall typically deployed in a hub virtual network (or a Virtual WAN secured hub), with spokes routing traffic through it using route tables. It offers three SKUs: Basic for small environments; Standard with network and application (FQDN) rules, threat-intelligence filtering, and DNS proxy; and Premium, which adds TLS inspection, intrusion detection and prevention, and URL filtering. Azure Firewall Manager applies firewall policies centrally across many firewalls.',
        },
      ],
    },
    {
      heading: 'Azure Web Application Firewall',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure WAF is a policy attached to Azure Application Gateway (regional) or Azure Front Door (global edge). It provides managed rule sets based on common attack categories, a bot-protection rule set, and custom rules including rate limits, in detection or prevention mode. With Front Door, origins can be locked down so that they accept traffic only from your Front Door profile.',
        },
      ],
    },
    {
      heading: 'Azure DDoS Protection',
      blocks: [
        {
          type: 'list',
          items: [
            'DDoS infrastructure protection: included for all Azure public IPs at no extra cost, with no configuration.',
            'DDoS Network Protection: a plan applied to virtual networks, adding adaptive tuning per public IP, attack metrics, alerts and reports, access to the DDoS Rapid Response team, and cost protection.',
            'DDoS IP Protection: per-public-IP protection with the same mitigation engine, priced per IP and without some Network Protection extras such as rapid response and cost protection.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Azure DDoS Protection covers layers 3 and 4. Use WAF for application-layer protection.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Firewall, Azure Web Application Firewall, and Azure DDoS Protection',
    keyFeatures: [
      'Azure Firewall Basic, Standard, and Premium (TLS inspection, IDPS, URL filtering)',
      'Azure Firewall Manager for central policy',
      'Azure WAF on Application Gateway and Front Door, with managed, bot, and custom rules',
      'DDoS infrastructure protection for every public IP, plus Network Protection and IP Protection tiers',
      'Private Link private endpoints for PaaS services',
    ],
    terminology: {
      'Managed network firewall': 'Azure Firewall',
      'Web application firewall': 'Azure Web Application Firewall (WAF policy)',
      'Enhanced DDoS protection': 'Azure DDoS Network Protection or DDoS IP Protection',
      'Central firewall policy': 'Azure Firewall Manager',
      'Per-resource security rules': 'Network security groups (with application security groups)',
    },
    architecturalNotes: [
      'Traffic reaches Azure Firewall only when route tables (or Virtual WAN routing intent) send it there.',
      'WAF attaches to Application Gateway or Front Door rather than to individual VMs.',
      'DDoS Protection is L3/L4; application-layer protection comes from WAF.',
    ],
    limitations: [
      'TLS inspection and IDPS require Azure Firewall Premium.',
      'DDoS IP Protection omits rapid response and cost protection available with Network Protection.',
    ],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/firewall/overview',
  },
  knowledgeCheck: [
    {
      id: 'azns-kc-1',
      type: 'single-choice',
      prompt: 'A team needs Azure Firewall to inspect inside outbound HTTPS connections for malware signatures. Which SKU is required?',
      difficulty: 'intermediate',
      learningObjective: 'Describe Azure Firewall, Azure Web Application Firewall, and Azure DDoS Protection and where each is deployed',
      options: [
        { id: 'a', label: 'Premium — it adds TLS inspection and IDPS', correct: true, explanation: 'Correct.' },
        { id: 'b', label: 'Basic', correct: false, explanation: 'Basic is the smallest SKU and lacks these features.' },
        { id: 'c', label: 'Standard', correct: false, explanation: 'Standard filters by FQDN and threat intelligence but does not decrypt TLS.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Azure Web Application Firewall overview', url: 'https://learn.microsoft.com/en-us/azure/web-application-firewall/overview' },
    { label: 'Azure DDoS Protection tier comparison', url: 'https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-protection-sku-comparison' },
  ],
};

const awsNetworkSecurity: LessonBody = {
  learningObjectives: ['Describe AWS Network Firewall, AWS WAF, AWS Shield, and AWS Firewall Manager and where each is deployed'],
  sections: [
    {
      heading: 'AWS Network Firewall',
      blocks: [
        {
          type: 'paragraph',
          text: 'AWS Network Firewall is a managed firewall deployed into dedicated subnets of a VPC, with a firewall endpoint in each Availability Zone; VPC route tables send traffic through those endpoints. It has a stateless rule engine for fast packet filtering and a stateful engine that supports domain-name filtering and rules compatible with the open-source Suricata IPS format, including managed threat signatures. It is often deployed in a central inspection VPC behind a transit gateway.',
        },
      ],
    },
    {
      heading: 'AWS WAF',
      blocks: [
        {
          type: 'paragraph',
          text: 'AWS WAF rules are organized in a web ACL (called a protection pack in the newer console) associated with a CloudFront distribution, Application Load Balancer, API Gateway REST API, AppSync API, Cognito user pool, App Runner service, Verified Access instance, or Amplify app. Web ACLs combine AWS Managed Rules groups (for example the core rule set and SQL database rules), rate-based rules, Bot Control, and custom rules. CloudFront web ACLs are global; the others are regional.',
        },
      ],
    },
    {
      heading: 'AWS Shield and Firewall Manager',
      blocks: [
        {
          type: 'list',
          items: [
            'Shield Standard: automatic network- and transport-layer DDoS protection for all AWS customers at no additional charge.',
            'Shield Advanced: a paid subscription for protected resources such as Elastic IPs, load balancers, CloudFront distributions, Global Accelerator accelerators, and Route 53 hosted zones. It adds tuned detection, attack visibility, the Shield Response Team, cost protection, and automatic application-layer mitigation through WAF.',
            'AWS Firewall Manager: applies WAF, Shield Advanced, security group, and Network Firewall policies across the accounts of an organization.',
          ],
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS Network Firewall, AWS WAF, AWS Shield, and AWS Firewall Manager',
    keyFeatures: [
      'Network Firewall with stateless and stateful (Suricata-compatible) rule engines',
      'AWS WAF web ACLs with managed rule groups, rate-based rules, and Bot Control',
      'Shield Standard included for everyone; Shield Advanced for tuned protection and response',
      'Firewall Manager for organization-wide policies',
      'PrivateLink interface endpoints for private access to services',
    ],
    terminology: {
      'Managed network firewall': 'AWS Network Firewall',
      'Web application firewall': 'AWS WAF (web ACL / protection pack)',
      'Enhanced DDoS protection': 'AWS Shield Advanced',
      'Central firewall policy': 'AWS Firewall Manager',
      'Per-resource security rules': 'Security groups and network ACLs',
    },
    architecturalNotes: [
      'Network Firewall endpoints are per Availability Zone; routing must send each zone’s traffic through its endpoint.',
      'WAF associates with front-door services, not directly with EC2 instances.',
      'Shield Advanced’s application-layer mitigation works through WAF rules on an associated web ACL.',
    ],
    limitations: [
      'Each resource can be associated with only one web ACL.',
      'Shield Advanced is a paid subscription with a commitment; evaluate it for business-critical endpoints.',
    ],
    documentationUrl: 'https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html',
  },
  knowledgeCheck: [
    {
      id: 'awsns-kc-1',
      type: 'single-choice',
      prompt: 'Where can an AWS WAF web ACL be associated?',
      difficulty: 'beginner',
      learningObjective: 'Describe AWS Network Firewall, AWS WAF, AWS Shield, and AWS Firewall Manager and where each is deployed',
      options: [
        { id: 'a', label: 'With front-door services such as CloudFront, Application Load Balancer, and API Gateway', correct: true, explanation: 'Correct — not with individual EC2 instances.' },
        { id: 'b', label: 'Directly with EC2 instances', correct: false, explanation: 'Put an ALB or CloudFront in front of instances to use WAF.' },
        { id: 'c', label: 'With S3 buckets directly', correct: false, explanation: 'Use CloudFront in front of S3 to apply WAF.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'AWS Network Firewall', url: 'https://docs.aws.amazon.com/network-firewall/latest/developerguide/what-is-aws-network-firewall.html' },
    { label: 'AWS Shield Advanced', url: 'https://docs.aws.amazon.com/waf/latest/developerguide/ddos-advanced-summary.html' },
  ],
};

const networkSecurityComparison: LessonBody = {
  learningObjectives: ['Compare Azure and AWS network security services by layer, placement, and scope'],
  sections: [
    {
      heading: 'Side by side',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Capability', 'Azure', 'AWS', 'Notable differences'],
          rows: [
            ['Managed network firewall', 'Azure Firewall (Basic, Standard, Premium)', 'AWS Network Firewall', 'Azure uses SKUs for features like TLS inspection; AWS uses Suricata-compatible stateful rules and per-AZ endpoints'],
            ['Central firewall policy', 'Azure Firewall Manager', 'AWS Firewall Manager', 'AWS Firewall Manager also manages WAF, Shield Advanced, and security group policies'],
            ['Web application firewall', 'Azure WAF on Application Gateway or Front Door', 'AWS WAF on CloudFront, ALB, API Gateway, and others', 'Attachment points differ; both offer managed, custom, and rate-based rules'],
            ['Baseline DDoS', 'DDoS infrastructure protection', 'Shield Standard', 'Both automatic and included'],
            ['Enhanced DDoS', 'DDoS Network Protection or IP Protection', 'Shield Advanced', 'Shield Advanced includes automatic L7 mitigation via WAF; Azure DDoS Protection is L3/L4 and relies on WAF for L7'],
            ['Private access to PaaS', 'Private Link private endpoints; service endpoints', 'PrivateLink interface endpoints; gateway endpoints', 'Gateway endpoints exist only for S3 and DynamoDB'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'These are conceptual pairs. Feature sets, SKUs, and pricing models differ and change; confirm specifics in each provider’s documentation before designing around them.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'nscmp-kc-1',
      type: 'single-choice',
      prompt: 'Which statement about application-layer DDoS mitigation is accurate?',
      difficulty: 'advanced',
      learningObjective: 'Compare Azure and AWS network security services by layer, placement, and scope',
      options: [
        { id: 'a', label: 'Shield Advanced can create WAF rules automatically for protected resources with a web ACL; Azure DDoS Protection covers L3/L4 and relies on Azure WAF for L7', correct: true, explanation: 'Correct — the providers divide the layers differently.' },
        { id: 'b', label: 'Both providers’ baseline DDoS protection blocks HTTP floods automatically', correct: false, explanation: 'Baseline protection works at the network layer.' },
        { id: 'c', label: 'Neither provider offers any application-layer protection', correct: false, explanation: 'Both offer WAFs with rate-based rules.' },
      ],
    },
  ],
};

const edgeLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '25 minutes',
  description:
    'Send representative traffic — a normal request, an injection pattern, a malformed request, a volumetric flood, an HTTP flood, and an unauthorized admin request — through DDoS mitigation, HTTP validation, a WAF, a rate-based rule, and application authorization. See which layer is responsible for each. A conceptual simulator in your browser: no traffic is generated and nothing is tested.',
  learningObjectives: [
    'Match each kind of malicious traffic to the layer that can stop it',
    'Explain WAF detection versus prevention mode and the role of rate-based rules',
    'Explain why application authorization cannot be replaced by edge controls',
  ],
  prerequisites: [
    { type: 'concept', id: 'waf-and-ddos', label: 'Web Application Firewalls and DDoS Protection', description: 'The layers of edge protection.' },
  ],
  content: {
    simulationId: edgeProtectionSimulation.id,
    instructions: [
      { id: 'sqli', label: '1. WAF prevention', description: 'Run the default: an injection pattern meets a WAF in prevention mode.' },
      { id: 'detect', label: '2. Detection mode', description: 'Switch the WAF to detection mode, then off. Where does the request end up, and what now protects the app?' },
      { id: 'flood', label: '3. Volumetric flood', description: 'Send the UDP flood with each DDoS tier. Why does the WAF never see it?' },
      { id: 'http-flood', label: '4. HTTP flood', description: 'Send the HTTP flood. Then add a rate-based rule (with the WAF on).' },
      { id: 'authz', label: '5. Authorization', description: 'Send the customer’s admin request, then turn off the application’s permission check.' },
      { id: 'malformed', label: '6. Malformed request', description: 'Send the malformed request with the WAF off. Which component rejects it?' },
    ],
    parameters: [],
    validationRules: [
      { id: 'waf-blocked', label: 'A WAF in prevention mode blocked the injection pattern', check: (state) => (state as EdgeState).config.traffic === 'sqli' && (state as EdgeState).blockedAt === 'waf' },
      { id: 'detection', label: 'Saw detection mode log an attack without blocking it', check: (state) => (state as EdgeState).outcome === 'logged-and-served' },
      { id: 'ddos', label: 'A volumetric flood was mitigated at the network edge', check: (state) => (state as EdgeState).blockedAt === 'network-edge' },
      { id: 'rate', label: 'A rate-based rule stopped an HTTP flood', check: (state) => (state as EdgeState).blockedAt === 'rate-limit' },
      { id: 'authz', label: 'The application’s authorization check denied an unauthorized request that every edge control forwarded', check: (state) => (state as EdgeState).blockedAt === 'app-authz' },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'cloud-firewalls': cloudFirewalls,
    'waf-and-ddos': wafAndDdos,
    'segmentation-and-private-connectivity': segmentation,
    'azure-network-security': azureNetworkSecurity,
    'aws-network-security': awsNetworkSecurity,
    'network-security-comparison': networkSecurityComparison,
  },
  labs: {
    'waf-ddos-lab': edgeLab,
  },
  simulations: {
    'waf-ddos-lab': bindSimulation(edgeProtectionSimulation, renderEdgeState),
  },
};
