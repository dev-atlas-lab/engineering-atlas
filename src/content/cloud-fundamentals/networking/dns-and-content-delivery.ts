import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { dnsResolutionScene } from './dns-and-content-delivery.scenes';

const howDnsWorks: LessonBody = {
  learningObjectives: [
    'Trace a recursive DNS lookup from the client to an authoritative server',
    'Explain how TTLs and caching affect how quickly DNS changes take effect',
  ],
  analogy:
    'Asking a recursive resolver is like asking a librarian for a book: the librarian checks the catalogue, follows references from section to shelf, and comes back with the answer — and remembers it for the next person who asks.',
  sections: [
    {
      heading: 'A distributed, delegated database',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Domain Name System (DNS) maps names to records. No server holds every record; responsibility is delegated down a hierarchy. The root servers know who is authoritative for each top-level domain (such as .com), the TLD servers know who is authoritative for each domain, and a domain’s authoritative servers hold its actual records. A recursive resolver follows those referrals on behalf of clients and caches what it learns.',
        },
        {
          type: 'comparisonTable',
          headers: ['Record', 'Maps a name to'],
          rows: [
            ['A / AAAA', 'An IPv4 / IPv6 address'],
            ['CNAME', 'Another name (an alias) — not allowed at the zone apex'],
            ['MX', 'Mail servers for the domain'],
            ['TXT', 'Arbitrary text, often used for domain verification'],
            ['NS', 'The authoritative name servers for a zone'],
          ],
        },
      ],
    },
    {
      heading: 'TTLs and caching',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every record carries a time to live (TTL), in seconds. Resolvers may cache the answer for that long, which keeps DNS fast and the authoritative servers lightly loaded — and means a changed record is not seen everywhere until old cached copies expire. Lowering a record’s TTL well before a planned migration shortens that window.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: '“DNS propagation” is mostly caching. After you change a record, clients whose resolver cached the old value keep using it until its TTL runs out.',
        },
      ],
    },
  ],
  visualization: dnsResolutionScene,
  knowledgeCheck: [
    {
      id: 'dns-kc-1',
      type: 'scenario',
      prompt: 'A record with a TTL of 3,600 seconds is changed. Some users still reach the old address 20 minutes later. Why?',
      difficulty: 'beginner',
      learningObjective: 'Explain how TTLs and caching affect how quickly DNS changes take effect',
      options: [
        { id: 'a', label: 'Their resolvers cached the old answer and may keep it for up to an hour', correct: true, explanation: 'Correct — the TTL permits caching for 3,600 seconds after each lookup.' },
        { id: 'b', label: 'The authoritative server has not saved the change', correct: false, explanation: 'Users who resolve fresh would see the new value; the stale ones are reading caches.' },
        { id: 'c', label: 'DNS changes take exactly 24 hours everywhere', correct: false, explanation: 'There is no fixed delay; it is governed by TTLs and cache state.' },
      ],
    },
  ],
};

const dnsInCloudNetworks: LessonBody = {
  learningObjectives: [
    'Distinguish public DNS zones from private zones linked to virtual networks',
    'Explain how resources inside a virtual network resolve names',
  ],
  sections: [
    {
      heading: 'Public and private zones',
      blocks: [
        {
          type: 'list',
          items: [
            'A public zone answers anyone on the internet — for example the records for www.example.com',
            'A private zone answers only queries from the virtual networks it is linked to — for example db.internal.example.com resolving to 10.0.2.30',
            'Split-horizon DNS uses both for the same name, so internal clients get a private address and external clients a public one',
          ],
        },
      ],
    },
    {
      heading: 'The resolver inside every network',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every virtual network comes with a provider-run recursive resolver that resolves public names, private zones linked to the network, and internal names for resources. In AWS it is the Route 53 Resolver, reachable at the VPC’s base address plus two (for example 10.0.0.2) and at 169.254.169.253. In Azure, the platform resolver is at 168.63.129.16. Hybrid scenarios — on-premises clients resolving cloud private zones, or the reverse — need inbound and outbound resolver endpoints (Route 53 Resolver endpoints, Azure DNS Private Resolver).',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Private endpoints depend on this: the storage account’s usual hostname must resolve to its private endpoint IP inside the network. If the private zone is not linked to the client’s network, the name resolves to the public endpoint and traffic either goes over the internet or is blocked.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'dns-cloud-kc-1',
      type: 'single-choice',
      prompt: 'A VM in a network not linked to a private DNS zone queries a name that only exists in that zone. What happens?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish public DNS zones from private zones linked to virtual networks',
      options: [
        { id: 'a', label: 'The name does not resolve from that network (or resolves to a public record of the same name, if one exists)', correct: true, explanation: 'Correct — private zones answer only networks they are linked to.' },
        { id: 'b', label: 'It resolves normally, because private zones are global', correct: false, explanation: 'Private zones are scoped to linked networks.' },
        { id: 'c', label: 'The query is forwarded to the root servers, which return the private address', correct: false, explanation: 'Root servers know nothing about private zones.' },
      ],
    },
  ],
};

const contentDelivery: LessonBody = {
  learningObjectives: ['Explain how DNS directs users to edge locations and healthy endpoints'],
  sections: [
    {
      heading: 'DNS as a traffic director',
      blocks: [
        {
          type: 'paragraph',
          text: 'Because DNS is consulted before every new connection, it is a natural place to steer traffic. A CDN typically gives you a hostname that you point your domain at with a CNAME (or an alias record at the apex); its DNS then returns an address for an edge location near the user. Traffic-routing DNS services go further, returning different answers by health, latency, geography, or weight.',
        },
        {
          type: 'list',
          items: [
            'Failover: return the secondary region’s address when health checks on the primary fail',
            'Latency-based: return the region with the lowest measured latency for the user',
            'Weighted: send a percentage of users to a new version',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'DNS-based steering is only as fast as caches allow: clients keep using a cached answer until its TTL expires. That is why failover records use short TTLs, and why DNS steering complements, rather than replaces, load balancing. Edge caching itself is covered in Data Centers and Edge Locations; global load balancing in the Load Balancing category.',
        },
      ],
    },
  ],
};

const azureDns: LessonBody = {
  learningObjectives: ['Map Azure’s DNS services onto the general model, including what they do not cover'],
  sections: [
    {
      heading: 'Hosting zones, and the services around it',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure DNS hosts public DNS zones on Microsoft’s global network of name servers, and Azure Private DNS hosts private zones linked to virtual networks. Domain registration is not part of Azure DNS (App Service Domains provides it), and health- or latency-based routing is provided by Azure Traffic Manager, a separate DNS-based traffic service. Azure DNS Private Resolver handles hybrid resolution between on-premises and Azure.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure DNS (public and private zones)',
    keyFeatures: [
      'Hosting of public DNS zones',
      'Azure Private DNS zones linked to virtual networks',
      'Alias records pointing at Azure resources',
      'Azure DNS Private Resolver for hybrid resolution',
    ],
    terminology: {
      'Authoritative zone hosting': 'Azure DNS zone',
      'Private zone': 'Azure Private DNS zone',
      'DNS-based traffic routing': 'Azure Traffic Manager (separate service)',
      'In-network resolver': 'Azure-provided DNS (168.63.129.16)',
    },
    architecturalNotes: [
      'Zone hosting, traffic routing, and domain registration are separate services in Azure',
      'Private endpoints commonly use Azure Private DNS zones such as privatelink.blob.core.windows.net',
    ],
    limitations: ['Azure DNS does not register domain names'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/dns/dns-overview',
  },
};

const route53: LessonBody = {
  learningObjectives: ['Map Amazon Route 53 onto the general model, including its broader scope'],
  sections: [
    {
      heading: 'Registration, hosting, health checks, and routing in one service',
      blocks: [
        {
          type: 'paragraph',
          text: 'Amazon Route 53 combines domain registration, public and private hosted zones, health checks, and routing policies (simple, weighted, latency-based, failover, geolocation, geoproximity, multivalue) in one service. The Route 53 Resolver runs in every VPC, and Resolver endpoints connect it to on-premises DNS.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon Route 53',
    keyFeatures: [
      'Domain registration',
      'Public and private hosted zones',
      'Health checks and routing policies including failover, latency, and weighted',
      'Route 53 Resolver and Resolver endpoints for hybrid DNS',
    ],
    terminology: {
      'Authoritative zone hosting': 'Hosted zone',
      'Private zone': 'Private hosted zone',
      'DNS-based traffic routing': 'Routing policies (built in)',
      'In-network resolver': 'Route 53 Resolver (VPC base + 2)',
    },
    architecturalNotes: [
      'Route 53 bundles capabilities that Azure splits across Azure DNS, Traffic Manager, and App Service Domains',
      'Alias records can point the zone apex at AWS resources where a CNAME is not allowed',
    ],
    limitations: ['Routing-policy behaviour is still bounded by resolver caching and TTLs'],
    documentationUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html',
  },
};

const dnsComparison: LessonBody = {
  learningObjectives: ['Compare the scope of Azure DNS and Amazon Route 53 accurately'],
  sections: [
    {
      heading: 'Not the same scope',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Capability', 'Azure', 'AWS'],
          rows: [
            ['Public zone hosting', 'Azure DNS', 'Route 53 hosted zones'],
            ['Private zones', 'Azure Private DNS', 'Route 53 private hosted zones'],
            ['Health- and latency-based routing', 'Azure Traffic Manager', 'Route 53 routing policies'],
            ['Domain registration', 'App Service Domains', 'Route 53'],
            ['Hybrid resolution', 'Azure DNS Private Resolver', 'Route 53 Resolver endpoints'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: '“Azure DNS ↔ Route 53” holds only for zone hosting. A Route 53 design using failover or latency routing maps to Azure DNS plus Traffic Manager, not to Azure DNS alone.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'dns-compare-kc-1',
      type: 'single-choice',
      prompt: 'A Route 53 design uses a failover routing policy with health checks. What is the Azure equivalent?',
      difficulty: 'advanced',
      learningObjective: 'Compare the scope of Azure DNS and Amazon Route 53 accurately',
      options: [
        { id: 'a', label: 'Azure Traffic Manager with priority routing and endpoint monitoring', correct: true, explanation: 'Correct — Azure DNS hosts zones; DNS-based failover is Traffic Manager’s job.' },
        { id: 'b', label: 'An Azure DNS failover record', correct: false, explanation: 'Azure DNS has no health-check-driven routing policies.' },
        { id: 'c', label: 'There is no Azure equivalent', correct: false, explanation: 'Traffic Manager provides DNS-based failover.' },
      ],
    },
  ],
};

const dnsLab: LabBody = {
  difficulty: 'beginner',
  estimatedTime: '15 minutes',
  description:
    'Use the DNS tools already on your computer to look up records, follow delegation from the root, and watch a cached TTL count down. Everything here runs on your machine; the page does not run or check any command.',
  learningObjectives: ['Observe DNS records, delegation, and TTL-based caching with real queries'],
  prerequisites: [
    {
      type: 'tool',
      label: 'nslookup (Windows, macOS, Linux) and optionally dig (macOS, Linux)',
      description: 'nslookup ships with most operating systems; dig is in the dnsutils or bind-utils package on Linux and preinstalled on macOS.',
    },
  ],
  content: {
    environment: [
      { tool: 'nslookup', installUrl: 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup', verifyCommand: 'nslookup example.com' },
    ],
    tasks: [
      {
        id: 'records',
        title: 'Look up different record types',
        instructions: 'Query the address, name server, and mail records for a domain. Note that each type answers a different question about the same name.',
        commands: [
          { command: 'nslookup -type=A example.com', platform: 'any', description: 'IPv4 address record.', expectedOutput: 'One or more “Address:” lines with IPv4 addresses.' },
          { command: 'nslookup -type=NS example.com', platform: 'any', description: 'The zone’s authoritative name servers.', expectedOutput: 'Lines naming the domain’s name servers.' },
          { command: 'nslookup -type=MX microsoft.com', platform: 'any', description: 'Mail servers.', expectedOutput: 'One or more “mail exchanger” entries.' },
        ],
        hints: ['If a query times out, your network may block direct DNS. Try again on a different network, or add a resolver address at the end, for example “nslookup -type=A example.com 1.1.1.1”.'],
        validationChecklist: ['You saw at least one IPv4 address for example.com', 'You saw the name servers listed for example.com'],
      },
      {
        id: 'delegation',
        title: 'Follow delegation from the root (macOS or Linux)',
        instructions: 'dig +trace performs the resolution itself instead of asking your resolver, printing each referral from the root down — the same steps as the lesson diagram.',
        commands: [
          { command: 'dig +trace www.example.com', platform: 'bash', description: 'Trace resolution from the root servers.', expectedOutput: 'Sections for the root (.), then com., then example.com, ending in the final record.' },
        ],
        hints: ['On Windows, the same output is available by installing BIND tools or using Windows Subsystem for Linux.'],
        validationChecklist: ['You identified the root, .com, and example.com referral steps in the output'],
      },
      {
        id: 'ttl',
        title: 'Watch a cached TTL count down (macOS or Linux)',
        instructions: 'Ask your resolver for the same record twice, a few seconds apart, and compare the TTL column in the answer section. A decreasing TTL means the second answer came from the resolver’s cache.',
        commands: [
          { command: 'dig example.com A', platform: 'bash', description: 'Run it, wait ten seconds, run it again.', expectedOutput: 'The second answer’s TTL is lower than the first.' },
        ],
        hints: ['Some resolvers rewrite TTLs, so the exact numbers vary; what matters is the countdown between queries.'],
        validationChecklist: ['The TTL decreased between two queries'],
      },
    ],
    cleanupInstructions: 'Nothing to clean up — these commands only read public DNS data.',
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'how-dns-resolution-works': howDnsWorks,
    'dns-in-cloud-networks': dnsInCloudNetworks,
    'dns-and-content-delivery-together': contentDelivery,
    'azure-dns': azureDns,
    'amazon-route-53': route53,
    'dns-comparison': dnsComparison,
  },
  labs: {
    'trace-dns-resolution-locally': dnsLab,
  },
  simulations: {},
};
