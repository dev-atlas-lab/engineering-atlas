import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { hubSpokeScene } from './connecting-networks.scenes';

const peeringAndTransitivity: LessonBody = {
  learningObjectives: [
    'Explain what network peering provides and why it is not transitive',
    'Describe how a hub-and-spoke topology provides transit and shared services',
  ],
  sections: [
    {
      heading: 'Peering joins two networks',
      blocks: [
        {
          type: 'paragraph',
          text: 'Peering connects two virtual networks so resources in each can reach the other using private addresses, over the provider’s network rather than the internet. It requires non-overlapping address ranges, and it is a relationship between exactly two networks: if A is peered with B and B with C, A still cannot reach C through B.',
        },
        {
          type: 'paragraph',
          text: 'Non-transitivity is deliberate. A network’s owner should not be able to reach a third network just because a shared neighbour is peered with both. But it means a full mesh of n networks needs n(n−1)/2 peerings — 45 for ten networks — which becomes unmanageable.',
        },
      ],
    },
    {
      heading: 'Hub and spoke',
      blocks: [
        {
          type: 'paragraph',
          text: 'The common answer is hub and spoke: every spoke peers only with a central hub, and shared services — the gateway to on-premises, firewalls, DNS — live once in the hub. Spoke-to-spoke traffic is sent to a router or firewall in the hub (via user-defined routes) or to a managed transit service, which forwards it. Step through the diagram to see each path work or fail.',
        },
      ],
    },
  ],
  visualization: hubSpokeScene,
  knowledgeCheck: [
    {
      id: 'peer-kc-1',
      type: 'scenario',
      prompt: 'Spoke A and Spoke B are each peered with a hub. Nothing else is configured. Can a VM in A reach a VM in B?',
      difficulty: 'intermediate',
      learningObjective: 'Explain what network peering provides and why it is not transitive',
      options: [
        { id: 'a', label: 'No — peering is not transitive; traffic needs a router or transit service in the hub plus routes', correct: true, explanation: 'Correct — each peering joins only its two networks.' },
        { id: 'b', label: 'Yes, through the hub automatically', correct: false, explanation: 'This is the classic peering mistake: shared neighbours do not create a path.' },
        { id: 'c', label: 'Only if both spokes use the same address range', correct: false, explanation: 'Overlapping ranges would prevent peering altogether.' },
      ],
    },
  ],
};

const hybridConnectivity: LessonBody = {
  learningObjectives: [
    'Compare site-to-site VPN with dedicated private circuits',
    'Explain how private endpoints let managed services stop accepting internet traffic',
  ],
  sections: [
    {
      heading: 'Connecting to on-premises',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'Site-to-site VPN', 'Dedicated private circuit'],
          rows: [
            ['Path', 'Encrypted IPsec tunnel over the public internet', 'A private connection through a connectivity provider or colocation facility'],
            ['Setup time', 'Hours', 'Weeks — a physical circuit must be provisioned'],
            ['Bandwidth and latency', 'Limited and variable, like the internet path beneath it', 'Higher and more consistent'],
            ['Typical use', 'Starting out, smaller sites, backup path', 'Large or latency-sensitive hybrid workloads'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Many organisations use both: a private circuit as the primary path and a VPN as the backup. Either way, routes for the on-premises ranges must be advertised into the virtual networks (often dynamically with BGP), and address ranges must not overlap.',
        },
      ],
    },
    {
      heading: 'Private connectivity to managed services',
      blocks: [
        {
          type: 'paragraph',
          text: 'Many managed services — storage, databases — are reached at public endpoints by default, even from inside your network. A private endpoint gives the service an IP address inside your virtual network; traffic stays on the private network, and the service’s public endpoint can then be disabled. This closes the internet path to the service entirely, rather than relying on firewall rules alone.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Private endpoints work through DNS: the service’s usual hostname must resolve to the private IP for clients inside the network. Getting that DNS configuration right is the most common source of trouble — see the DNS concept.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'hybrid-kc-1',
      type: 'single-choice',
      prompt: 'An organisation needs connectivity to its cloud network by tomorrow, but long term wants consistent, high-bandwidth connectivity. What fits?',
      difficulty: 'intermediate',
      learningObjective: 'Compare site-to-site VPN with dedicated private circuits',
      options: [
        { id: 'a', label: 'Start with a site-to-site VPN, provision a private circuit, then keep the VPN as a backup path', correct: true, explanation: 'Correct — a VPN is quick to set up; a circuit takes weeks but gives consistent performance.' },
        { id: 'b', label: 'Order a private circuit and wait', correct: false, explanation: 'Circuits take far longer than a day to provision.' },
        { id: 'c', label: 'Use public endpoints for everything', correct: false, explanation: 'That provides no private network connectivity at all.' },
      ],
    },
  ],
};

const azureConnectivity: LessonBody = {
  learningObjectives: ['Map Azure’s peering, gateway, and private connectivity services onto the general model'],
  sections: [
    {
      heading: 'Peering, gateways, and Private Link',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure virtual network peering connects VNets in the same or different regions and is non-transitive. A hub can share its VPN or ExpressRoute gateway with peered spokes through gateway transit settings on the peerings. Azure VPN Gateway provides site-to-site IPsec VPN, ExpressRoute provides private circuits, and Azure Virtual WAN offers a managed hub with transit between connected networks. Private endpoints (Azure Private Link) give supported services a private IP in your VNet.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure VNet peering, VPN Gateway, ExpressRoute, and Private Link',
    keyFeatures: [
      'Regional and global VNet peering',
      'Gateway transit so spokes share a hub’s VPN or ExpressRoute gateway',
      'Azure Virtual WAN as a managed transit hub',
      'Private endpoints for platform services',
    ],
    terminology: {
      Peering: 'Virtual network peering',
      'Site-to-site VPN': 'Azure VPN Gateway',
      'Private circuit': 'ExpressRoute',
      'Managed transit hub': 'Azure Virtual WAN',
      'Private service endpoint': 'Private endpoint (Azure Private Link)',
    },
    architecturalNotes: [
      'Spoke-to-spoke transit needs either user-defined routes to a hub appliance or Virtual WAN',
      'Private endpoints rely on private DNS zones so service hostnames resolve to private IPs',
    ],
    limitations: ['Peering requires non-overlapping address spaces'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview',
  },
};

const awsConnectivity: LessonBody = {
  learningObjectives: ['Map AWS’s peering, transit, VPN, and PrivateLink services onto the general model'],
  sections: [
    {
      heading: 'Peering, Transit Gateway, and PrivateLink',
      blocks: [
        {
          type: 'paragraph',
          text: 'VPC peering connects two VPCs, within or across Regions and accounts, and is non-transitive. AWS Transit Gateway is a managed regional router that VPCs and VPN connections attach to, providing transit without a mesh of peerings. AWS Site-to-Site VPN provides IPsec tunnels, AWS Direct Connect provides private circuits, and AWS PrivateLink exposes services — AWS’s own and your own — through interface endpoints with private IPs in your VPC.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'VPC peering, AWS Transit Gateway, Site-to-Site VPN, Direct Connect, and PrivateLink',
    keyFeatures: [
      'VPC peering within and across Regions and accounts',
      'Transit Gateway as a managed transit router',
      'Site-to-Site VPN and Direct Connect for hybrid connectivity',
      'Interface endpoints (PrivateLink) for private access to services',
    ],
    terminology: {
      Peering: 'VPC peering connection',
      'Site-to-site VPN': 'AWS Site-to-Site VPN',
      'Private circuit': 'AWS Direct Connect',
      'Managed transit hub': 'AWS Transit Gateway',
      'Private service endpoint': 'Interface VPC endpoint (AWS PrivateLink)',
    },
    architecturalNotes: [
      'Transit Gateway replaces hub appliances for routing between many VPCs and on-premises',
      'Gateway endpoints for S3 and DynamoDB are a separate, route-table-based mechanism from interface endpoints',
    ],
    limitations: ['VPC peering requires non-overlapping CIDR blocks and is non-transitive'],
    documentationUrl: 'https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html',
  },
};

const connectivityComparison: LessonBody = {
  learningObjectives: ['Compare the connectivity building blocks on each platform'],
  sections: [
    {
      heading: 'Building block by building block',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Need', 'Azure', 'AWS'],
          rows: [
            ['Connect two networks', 'VNet peering', 'VPC peering'],
            ['Managed transit between many networks', 'Azure Virtual WAN (or a hub appliance with UDRs)', 'AWS Transit Gateway'],
            ['Encrypted tunnel to on-premises', 'Azure VPN Gateway', 'AWS Site-to-Site VPN'],
            ['Private circuit', 'ExpressRoute', 'AWS Direct Connect'],
            ['Private IP for a managed service', 'Private endpoint (Private Link)', 'Interface endpoint (PrivateLink)'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Virtual WAN and Transit Gateway solve the same transit problem but are not drop-in equivalents: Virtual WAN is a managed hub that also bundles gateways and optional security, while Transit Gateway is a regional router you attach VPCs and connections to. Map the requirements — which networks talk, where inspection happens — rather than the product names.',
        },
      ],
    },
  ],
};

const connectivityChallenge: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '10 minutes',
  description: 'Design connectivity between two application networks and an on-premises datacenter, then compare your design against assessed options.',
  learningObjectives: ['Design non-transitive-aware connectivity with a sound address plan'],
  prerequisites: [
    { type: 'concept', id: 'peering-and-transitivity', label: 'Peering and Hub-and-Spoke Topologies', description: 'Know why peering is not transitive.' },
  ],
  content: {
    scenario:
      'A company runs two application networks in the cloud and a datacenter on-premises. Both applications must reach each other and the datacenter. Security requires all traffic between the applications to pass through a central firewall. More application networks are expected next year.',
    requirements: [
      'Application networks can reach each other through a central firewall',
      'Both application networks can reach the on-premises datacenter',
      'The design scales to more application networks',
    ],
    constraints: ['Avoid duplicating gateways per network', 'Networks will be connected by peering or transit, which needs routable addresses'],
    decisions: [
      {
        id: 'topology',
        question: 'How should the cloud networks be connected?',
        type: 'single-choice',
        options: [
          { id: 'mesh', label: 'Full mesh of peerings', description: 'Every network peered with every other.' },
          { id: 'hub-peering-only', label: 'Hub and spoke, peering only', description: 'Each application network peered with a hub; nothing else.' },
          { id: 'hub-transit', label: 'Hub and spoke with transit through a hub firewall', description: 'Spokes peered with the hub; routes send spoke-to-spoke traffic to the firewall.' },
        ],
      },
      {
        id: 'onprem',
        question: 'How should on-premises connect?',
        type: 'single-choice',
        options: [
          { id: 'vpn-per-spoke', label: 'A VPN gateway in each application network', description: 'Separate tunnels per network.' },
          { id: 'shared-gateway', label: 'One gateway in the hub, shared with the spokes', description: 'Gateway transit to the spokes.' },
          { id: 'public', label: 'Expose the applications publicly and connect over the internet', description: 'No private connectivity.' },
        ],
      },
      {
        id: 'addressing',
        question: 'Which address plan?',
        type: 'single-choice',
        options: [
          { id: 'same', label: 'Every network uses 10.0.0.0/16', description: 'The common default.' },
          { id: 'distinct', label: 'Hub 10.0.0.0/16, spokes 10.1.0.0/16 and 10.2.0.0/16, on-premises 192.168.0.0/16', description: 'Non-overlapping ranges.' },
        ],
      },
    ],
    solutions: [
      {
        id: 'optimal',
        decisionValues: { topology: 'hub-transit', onprem: 'shared-gateway', addressing: 'distinct' },
        assessment: 'optimal',
        explanation: 'Spokes reach each other through the hub firewall (meeting the inspection requirement despite peering being non-transitive), one shared gateway serves on-premises connectivity, and non-overlapping ranges make every peering and route valid. New spokes are one peering each.',
        tradeoffs: 'The hub firewall is a central dependency that must be sized and made highly available.',
      },
      {
        id: 'peering-only',
        decisionValues: { topology: 'hub-peering-only', onprem: 'shared-gateway', addressing: 'distinct' },
        assessment: 'problematic',
        explanation: 'Peering is not transitive, so the two application networks cannot reach each other at all — and nothing routes their traffic through the firewall.',
        tradeoffs: 'Simple, but fails the main requirement.',
      },
      {
        id: 'mesh',
        decisionValues: { topology: 'mesh', onprem: 'shared-gateway', addressing: 'distinct' },
        assessment: 'suboptimal',
        explanation: 'Applications can talk, but directly — bypassing the central firewall — and the number of peerings grows quadratically as networks are added.',
        tradeoffs: 'Lowest latency between spokes, at the cost of inspection and manageability.',
      },
      {
        id: 'overlap',
        decisionValues: { topology: 'hub-transit', onprem: 'shared-gateway', addressing: 'same' },
        assessment: 'problematic',
        explanation: 'With identical address spaces, the networks cannot be peered or routed to each other: every destination address would be ambiguous.',
        tradeoffs: 'Renumbering a network later is far more expensive than planning ranges now.',
      },
      {
        id: 'vpn-per-spoke',
        decisionValues: { topology: 'hub-transit', onprem: 'vpn-per-spoke', addressing: 'distinct' },
        assessment: 'suboptimal',
        explanation: 'It works, but duplicates gateways and tunnels in every network, which the constraints rule out and which grows with every new spoke.',
        tradeoffs: 'Independent connectivity per network, at multiplied cost and operational effort.',
      },
      {
        id: 'public',
        decisionValues: { topology: 'hub-transit', onprem: 'public', addressing: 'distinct' },
        assessment: 'problematic',
        explanation: 'Exposing the applications to the internet to reach the datacenter replaces private connectivity with public attack surface.',
        tradeoffs: 'No gateway cost, at an unacceptable security cost.',
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'peering-and-transitivity': peeringAndTransitivity,
    'hybrid-and-private-connectivity': hybridConnectivity,
    'azure-network-connectivity': azureConnectivity,
    'aws-network-connectivity': awsConnectivity,
    'connectivity-comparison': connectivityComparison,
  },
  labs: {
    'connect-three-networks': connectivityChallenge,
  },
  simulations: {},
};
