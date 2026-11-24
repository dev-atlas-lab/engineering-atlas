import type { ConceptMeta, LabDefinition, Lesson } from '../../types';
import { publicPrivateScene } from './scenes';
import { packetRoutingSimulation, type RoutingState } from './routing-simulation';

const howRoutingWorks: Lesson = {
  id: 'how-routing-works',
  title: 'How Routing Works: Route Tables and Longest Prefix Match',
  kind: 'concept',
  learningObjectives: [
    'Explain how a route table chooses a next hop with longest prefix match',
    'Identify the common next-hop types in a cloud network',
  ],
  analogy:
    'A route table is a set of signposts. “Anything for 10.0.x.x — stay in town.” “Anything else — take the motorway.” When two signs both apply, you follow the more specific one.',
  sections: [
    {
      heading: 'A route is a destination range and a next hop',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every subnet is associated with a route table. Each route says: packets whose destination falls inside this CIDR range go to this next hop. When a packet leaves a resource, the virtual network looks up its destination address in the subnet’s route table and forwards it accordingly. If no route matches, the packet is dropped.',
        },
        {
          type: 'comparisonTable',
          headers: ['Next hop', 'Meaning'],
          rows: [
            ['local', 'Deliver within the virtual network — present for the network’s own address space in every table'],
            ['Internet gateway', 'Send to the internet (the resource needs a public IP to be reachable from it)'],
            ['NAT gateway', 'Send to the internet with the source translated — outbound only'],
            ['Peering / transit / VPN gateway', 'Send to another network'],
            ['Network appliance', 'Send to a firewall or router VM for inspection'],
          ],
        },
      ],
    },
    {
      heading: 'Longest prefix match',
      blocks: [
        {
          type: 'paragraph',
          text: 'More than one route can contain a destination. 0.0.0.0/0 contains every address, and 10.0.0.0/16 contains 10.0.2.20. The rule is that the most specific route — the one with the longest prefix — wins. That is why a default route to the internet never captures traffic between your own subnets: the local /16 route is more specific.',
        },
        {
          type: 'code',
          code: 'destination 10.0.2.20\n  10.0.0.0/16 → local              contains it, prefix 16  ← wins\n  0.0.0.0/0   → internet gateway   contains it, prefix 0\n\ndestination 198.51.100.7\n  10.0.0.0/16 → local              does not contain it\n  0.0.0.0/0   → internet gateway   contains it            ← wins',
          caption: 'The same table sends internal and internet traffic to different places without any ordering rules.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Routing and filtering are separate decisions. A route says where a packet can go; a security rule says whether it is allowed. A packet can have a perfect route and still be denied, or be allowed by every rule and still be dropped for lack of a route.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'route-kc-1',
      type: 'scenario',
      prompt:
        'A route table contains 10.0.0.0/16 → local, 10.0.2.0/24 → firewall appliance, and 0.0.0.0/0 → internet gateway. Where does a packet to 10.0.2.9 go?',
      difficulty: 'intermediate',
      learningObjective: 'Explain how a route table chooses a next hop with longest prefix match',
      options: [
        { id: 'a', label: 'To the firewall appliance', correct: true, explanation: 'Correct — all three routes contain 10.0.2.9, and /24 is the longest prefix.' },
        { id: 'b', label: 'Local delivery', correct: false, explanation: '/16 matches, but /24 is more specific.' },
        { id: 'c', label: 'The internet gateway', correct: false, explanation: '0.0.0.0/0 is the least specific route; it only wins when nothing else matches.' },
      ],
    },
  ],
};

const internetAndNat: Lesson = {
  id: 'internet-access-and-nat',
  title: 'Internet Access and NAT',
  kind: 'concept',
  learningObjectives: [
    'Explain how a resource with a private IP reaches the internet',
    'Distinguish a public IP from a NAT gateway in terms of inbound reachability',
  ],
  sections: [
    {
      heading: 'Private addresses need translation',
      blocks: [
        {
          type: 'paragraph',
          text: 'Resources in a virtual network have private addresses that the internet cannot route. Network address translation (NAT) rewrites addresses at the boundary. There are two common patterns, and they differ in one crucial way: whether the internet can start a connection to the resource.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'Public IP on the resource', 'NAT gateway'],
          rows: [
            ['Outbound to the internet', 'Yes', 'Yes'],
            ['Inbound connections from the internet', 'Possible, if security rules allow', 'Never — only replies to outbound connections'],
            ['Address the internet sees', 'The resource’s own public IP', 'The NAT gateway’s shared public IP'],
            ['Typical use', 'Internet-facing servers, load balancers', 'Private servers that need updates or API calls'],
          ],
        },
      ],
    },
    {
      heading: 'How a NAT gateway works',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'The private resource sends a packet to an internet address; its subnet’s default route points at the NAT gateway',
            'The NAT gateway replaces the private source address and port with its public address and a port it allocates, and records the mapping',
            'The reply arrives at the NAT gateway’s public address and port; the gateway looks up the mapping and forwards it back',
            'A packet arriving for a port with no mapping — an unsolicited inbound connection — has nowhere to go and is dropped',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A NAT gateway has a finite pool of ports per public IP. Very large numbers of simultaneous outbound connections to the same destination can exhaust it; providers document limits and let you add public IPs to a NAT gateway.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'nat-kc-1',
      type: 'single-choice',
      prompt: 'A private VM reaches the internet through a NAT gateway. Can an internet user start an SSH session to it?',
      difficulty: 'beginner',
      learningObjective: 'Distinguish a public IP from a NAT gateway in terms of inbound reachability',
      options: [
        { id: 'a', label: 'No — a NAT gateway only forwards replies to connections the VM started', correct: true, explanation: 'Correct — there is no mapping for an unsolicited inbound connection, so it is dropped.' },
        { id: 'b', label: 'Yes, using the NAT gateway’s public IP', correct: false, explanation: 'The NAT gateway does not forward new inbound connections.' },
        { id: 'c', label: 'Yes, if the VM’s security rule allows SSH', correct: false, explanation: 'The packet never reaches the VM to be evaluated — there is no inbound path.' },
      ],
    },
  ],
};

const publicVsPrivate: Lesson = {
  id: 'public-vs-private-access',
  title: 'Public vs. Private Access',
  kind: 'concept',
  learningObjectives: [
    'Explain the boundaries that make a resource reachable or unreachable',
    'Explain why private addressing alone does not make a resource secure',
  ],
  sections: [
    {
      heading: 'Reachability is a path, not a label',
      blocks: [
        {
          type: 'paragraph',
          text: 'A resource is reachable from somewhere if there is a complete path: an address the sender can target, routes in each direction, and security rules that allow the traffic. Private addressing removes one specific path — the one from the internet. Every other path into the resource still exists and must be controlled.',
        },
        {
          type: 'paragraph',
          text: 'Step through the explorer: the public web VM is reachable and filtered; the private database is unreachable from the internet; then the web VM is compromised and the database, still private, is reached anyway — until its rules are narrowed.',
        },
      ],
    },
    {
      heading: 'What actually protects a private resource',
      blocks: [
        {
          type: 'list',
          items: [
            'Narrow security rules: only the port the service needs, only from the subnet or group that needs it',
            'Segmentation: separate subnets for tiers with different exposure, so rules can tell them apart',
            'Identity and authentication on the service itself — a network path is never a substitute for a password, key, or token',
            'Private connectivity for managed services, so they too stop accepting traffic from the internet (see Connecting Networks)',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: '“It has no public IP, so it is safe” is one of the most common and costly assumptions in cloud security. An attacker who gains any foothold inside the network sees private addresses as ordinary addresses.',
        },
      ],
    },
  ],
  visualization: publicPrivateScene,
  knowledgeCheck: [
    {
      id: 'pp-kc-1',
      type: 'single-choice',
      prompt: 'A database has only a private IP, and its rule allows any traffic from the virtual network. Which statement is true?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why private addressing alone does not make a resource secure',
      options: [
        { id: 'a', label: 'Anything that compromises any resource in the network can connect to it', correct: true, explanation: 'Correct — the private address only removes the internet path; the permissive rule leaves every internal path open.' },
        { id: 'b', label: 'It is secure because it has no public IP', correct: false, explanation: 'That only prevents direct internet access.' },
        { id: 'c', label: 'Nothing can reach it', correct: false, explanation: 'Everything inside the network can, under that rule.' },
      ],
    },
  ],
};

const azureRouting: Lesson = {
  id: 'azure-routing-and-nat',
  title: 'Azure Routing and NAT',
  kind: 'provider',
  providerId: 'azure',
  learningObjectives: ['Map Azure system routes, route tables, and NAT Gateway onto the general model'],
  sections: [
    {
      heading: 'System routes, user-defined routes, and outbound access',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure gives every subnet a set of system routes, including routes for the VNet’s address space and a default route to the internet. You override them with route tables containing user-defined routes (UDRs) — for example, sending 0.0.0.0/0 to a firewall appliance. There is no separate internet gateway resource; internet routing is part of the platform.',
        },
        {
          type: 'paragraph',
          text: 'Whether a VM without a public IP can actually reach the internet has changed over time. Azure historically provided implicit “default outbound access”; Microsoft is moving new virtual networks to private subnets by default, where VMs need an explicit outbound method — NAT Gateway, a public IP, or load balancer outbound rules. Check the current documentation for your deployment tooling, and prefer explicit outbound connectivity regardless.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure route tables and Azure NAT Gateway',
    keyFeatures: [
      'System routes for VNet address space and default internet routing',
      'Route tables with user-defined routes to override system routes',
      'NAT Gateway associated with subnets for explicit outbound connectivity',
      'Private subnets that require an explicit outbound method',
    ],
    terminology: {
      'Route table': 'Route table (user-defined routes)',
      'Built-in routes': 'System routes',
      'NAT gateway': 'Azure NAT Gateway',
      'Internet gateway': 'No separate resource — internet routing is a system route',
    },
    architecturalNotes: [
      'Internet egress is a system route rather than an attachable gateway resource',
      'A NAT Gateway is associated directly with subnets; it takes precedence over other outbound methods for that subnet',
    ],
    limitations: ['Default outbound access is being retired for new networks; designs should not rely on it'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/default-outbound-access',
  },
};

const awsRouting: Lesson = {
  id: 'aws-routing-and-nat',
  title: 'AWS Routing and NAT',
  kind: 'provider',
  providerId: 'aws',
  learningObjectives: ['Map AWS route tables, internet gateways, and NAT gateways onto the general model'],
  sections: [
    {
      heading: 'Explicit gateways and route tables',
      blocks: [
        {
          type: 'paragraph',
          text: 'In AWS the pieces are explicit. A VPC gets internet connectivity only when an internet gateway is attached and a subnet’s route table sends 0.0.0.0/0 to it — that route is what makes a subnet public. Instances in public subnets also need a public IPv4 address or Elastic IP. Private subnets reach the internet through a NAT gateway placed in a public subnet, with the private route table sending 0.0.0.0/0 to it.',
        },
        {
          type: 'paragraph',
          text: 'NAT gateways have traditionally been zonal: one per Availability Zone, with each AZ’s private subnets routed to their own, so an AZ failure does not cut off the others. AWS has also introduced a regional availability mode that spans AZs automatically; zonal remains the default when you create one.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon VPC route tables, internet gateway, and NAT gateway',
    keyFeatures: [
      'Route tables associated with subnets, with a local route for the VPC',
      'Internet gateway attached to the VPC',
      'NAT gateways in zonal (default) or regional availability mode',
      'Public IPv4 or Elastic IP addresses for internet-reachable instances',
    ],
    terminology: {
      'Route table': 'Route table',
      'Internet gateway': 'Internet gateway',
      'NAT gateway': 'NAT gateway',
      'Static public IP': 'Elastic IP address',
    },
    architecturalNotes: [
      'A subnet is public only because its route table has a route to an internet gateway',
      'With zonal NAT gateways, a resilient design places one per AZ and routes each AZ to its own',
    ],
    limitations: ['A zonal NAT gateway serves its own AZ’s availability; routing other AZs through it couples them to that AZ'],
    documentationUrl: 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html',
  },
};

const routingComparison: Lesson = {
  id: 'routing-comparison',
  title: 'Comparison: Azure vs. AWS Routing and NAT',
  kind: 'comparison',
  learningObjectives: ['Compare where internet access and NAT are configured on each platform'],
  sections: [
    {
      heading: 'Implicit vs. explicit internet connectivity',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Dimension', 'Azure', 'AWS'],
          rows: [
            ['Internet routing', 'System route; no gateway resource', 'Internet gateway attached to the VPC, plus a route to it'],
            ['Public vs. private subnet', 'Private subnets increasingly the default; outbound must be explicit', 'Defined by whether the route table points at an internet gateway'],
            ['NAT placement', 'NAT Gateway associated with the subnet', 'NAT gateway in a public subnet; private subnets route to it'],
            ['Customising routes', 'Route table with user-defined routes overriding system routes', 'Route table entries per subnet association'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The concepts are the same — routes, longest prefix match, NAT for private egress — but an AWS design spells out gateways that Azure provides implicitly. When porting, map each required path (internet in, internet out, private out, internal) rather than each resource.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'routing-compare-kc-1',
      type: 'single-choice',
      prompt: 'You are porting an AWS VPC to Azure. What happens to the internet gateway?',
      difficulty: 'intermediate',
      learningObjective: 'Compare where internet access and NAT are configured on each platform',
      options: [
        { id: 'a', label: 'There is no direct equivalent resource — internet routing is a system route, with public IPs or NAT Gateway for actual access', correct: true, explanation: 'Correct — the capability exists; it is just not modelled as an attachable gateway.' },
        { id: 'b', label: 'It becomes an Azure Internet Gateway resource', correct: false, explanation: 'Azure has no such resource type.' },
        { id: 'c', label: 'Azure VNets cannot reach the internet', correct: false, explanation: 'They can, through public IPs, NAT Gateway, or load balancer outbound rules.' },
      ],
    },
  ],
};

const routingLab: LabDefinition = {
  id: 'packet-routing-lab',
  title: 'Packet Routing Lab',
  type: 'simulation',
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Send packets between the internet, a public web VM, and a private app VM. Change routes and security rules and watch each decision: route lookup, next hop, and allow, deny, or drop.',
  learningObjectives: [
    'Trace a packet through route tables and security rules and explain its outcome',
    'Give a private subnet outbound internet access without making it reachable from the internet',
  ],
  prerequisites: [
    { type: 'concept', id: 'how-routing-works', label: 'How Routing Works', description: 'Understand route tables and longest prefix match.' },
  ],
  content: {
    simulationId: packetRoutingSimulation.id,
    instructions: [
      { id: 'dropped', label: 'Diagnose a drop', description: 'Run the default: the app VM tries to reach the internet and the packet is dropped. Read the route lookup to see why.' },
      { id: 'fix', label: 'Fix outbound access', description: 'Give the private subnet a default route to the NAT gateway and replay. The validation below should pass.' },
      { id: 'inbound', label: 'Check it stayed private', description: 'With the NAT route still in place, send “Internet → app VM”. Confirm the packet is still dropped, and read why NAT does not help.' },
      { id: 'lpm', label: 'Longest prefix match', description: 'Send “Web VM → app VM”. The public route table has a 0.0.0.0/0 route to the internet gateway — why does the packet stay inside the network?' },
      { id: 'rules', label: 'Routing vs. filtering', description: 'Turn off the app VM’s rule and resend web → app. The route is unchanged; the outcome is not.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'traced-app-outbound',
        label: 'Traced a packet from the private app VM to the internet',
        check: (state) => {
          const s = state as RoutingState;
          return s.scenario === 'app-to-internet' && s.outcome !== null;
        },
      },
      {
        id: 'delivered',
        label: 'The app VM’s outbound packet was delivered',
        check: (state) => {
          const s = state as RoutingState;
          return s.scenario === 'app-to-internet' && s.outcome === 'delivered';
        },
      },
      {
        id: 'via-nat',
        label: 'Outbound access goes through the NAT gateway, not a public IP on the app VM',
        check: (state) => (state as RoutingState).lookup?.matched?.target === 'NAT gateway',
      },
    ],
  },
};

export const subnetsAndRouting: ConceptMeta = {
  id: 'subnets-and-routing',
  title: 'Subnets and Routing',
  description:
    'Network segmentation, routing tables, public vs. private subnets, internet gateways, and NAT for outbound-only connectivity.',
  status: 'available',
  learningObjectives: [
    'Explain how route tables and longest prefix match choose a next hop',
    'Give private resources outbound internet access with NAT while keeping them unreachable from the internet',
    'Explain why private addressing alone does not make a resource secure',
    'Compare Azure’s implicit internet routing with AWS’s explicit gateways',
  ],
  prerequisites: ['virtual-networks'],
  relatedConcepts: ['virtual-networks', 'connecting-networks', 'network-security'],
  estimatedMinutes: 75,
  lessons: [howRoutingWorks, internetAndNat, publicVsPrivate, azureRouting, awsRouting, routingComparison],
  labs: [routingLab],
};
