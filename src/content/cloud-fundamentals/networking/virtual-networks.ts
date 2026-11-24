import type { ConceptMeta, LabDefinition, Lesson } from '../../types';
import { vnetExplorerScene } from './scenes';
import { cidrSubnetSimulation, type CidrLabState } from './cidr-simulation';

const ipAddressing: Lesson = {
  id: 'ip-addressing-and-cidr',
  title: 'IP Addressing and CIDR Notation',
  kind: 'concept',
  learningObjectives: [
    'Read an IPv4 address and a CIDR block and compute its range by hand',
    'Distinguish public addresses from private (RFC 1918) addresses',
  ],
  analogy:
    'An IP address is a street address; a CIDR block is a postcode area. “10.0.0.0/16” says: every address whose first 16 bits match 10.0 is in this area — the remaining 16 bits pick the house.',
  sections: [
    {
      heading: 'An address is a 32-bit number',
      blocks: [
        {
          type: 'paragraph',
          text: 'An IPv4 address is a 32-bit number, written as four 8-bit octets in decimal: 10.0.1.10 is 00001010.00000000.00000001.00001010. Every routing and subnetting decision is arithmetic on those 32 bits, which is why the dotted-decimal form can mislead: boundaries do not always fall on dots.',
        },
      ],
    },
    {
      heading: 'CIDR: a prefix and a length',
      blocks: [
        {
          type: 'paragraph',
          text: 'Classless Inter-Domain Routing (CIDR) notation writes a block of addresses as an address and a prefix length: 10.0.0.0/16. The first 16 bits are the network prefix, fixed for every address in the block; the remaining 16 bits vary. The block therefore holds 2^(32 − 16) = 65,536 addresses, from 10.0.0.0 to 10.0.255.255.',
        },
        {
          type: 'code',
          code: 'address   10.0.5.77   00001010.00000000.00000101.01001101\nmask /20  255.255.240.0  11111111.11111111.11110000.00000000\nAND       10.0.0.0    00001010.00000000.00000000.00000000   ← network address\n\nlast address = network with every host bit set = 10.0.15.255\nsize = 2^(32 − 20) = 4,096 addresses',
          caption: 'A /20 boundary falls in the middle of the third octet, so the network address is not obvious from the decimal form.',
        },
      ],
    },
    {
      heading: 'Public and private addresses',
      blocks: [
        {
          type: 'paragraph',
          text: 'Public addresses are globally unique and routed across the internet. RFC 1918 reserves three ranges for private use — 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16 — which anyone may use internally and which internet routers do not route. Virtual networks are almost always built from private ranges; reaching the internet then needs translation (a public IP or NAT), which the Subnets and Routing concept covers.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: '172.16.0.0/12 covers 172.16.0.0 to 172.31.255.255 — not all of 172.x.x.x. 172.32.0.0 is public address space. Use the CIDR lab to check ranges like this rather than guessing from the first octet.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'ip-kc-1',
      type: 'single-choice',
      prompt: 'How many addresses does 10.20.0.0/22 contain, and what is its last address?',
      difficulty: 'intermediate',
      learningObjective: 'Read an IPv4 address and a CIDR block and compute its range by hand',
      options: [
        { id: 'a', label: '1,024 addresses, ending at 10.20.3.255', correct: true, explanation: 'Correct — 2^(32−22) = 1,024, which spans four /24s: 10.20.0.x through 10.20.3.x.' },
        { id: 'b', label: '256 addresses, ending at 10.20.0.255', correct: false, explanation: 'That is a /24. A /22 has two fewer prefix bits, so four times as many addresses.' },
        { id: 'c', label: '4,096 addresses, ending at 10.20.15.255', correct: false, explanation: 'That is a /20.' },
      ],
    },
    {
      id: 'ip-kc-2',
      type: 'multi-select',
      prompt: 'Which blocks lie entirely within RFC 1918 private address space? Select all that apply.',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish public addresses from private (RFC 1918) addresses',
      options: [
        { id: 'a', label: '10.250.0.0/16', correct: true, explanation: 'Correct — inside 10.0.0.0/8.' },
        { id: 'b', label: '172.20.0.0/16', correct: true, explanation: 'Correct — inside 172.16.0.0/12, which runs to 172.31.255.255.' },
        { id: 'c', label: '172.40.0.0/16', correct: false, explanation: '172.40.x.x is outside 172.16.0.0/12 — it is public address space.' },
        { id: 'd', label: '192.169.0.0/16', correct: false, explanation: 'The private range is 192.168.0.0/16; 192.169.x.x is public.' },
      ],
    },
  ],
};

const subnetPlanning: Lesson = {
  id: 'cidr-and-subnet-planning',
  title: 'Subnets and Address Planning',
  kind: 'concept',
  learningObjectives: [
    'Divide an address space into subnets and calculate usable cloud addresses',
    'Plan address ranges that will not overlap with networks you may connect later',
  ],
  sections: [
    {
      heading: 'Subnetting is borrowing bits',
      blocks: [
        {
          type: 'paragraph',
          text: 'A subnet is a smaller CIDR block carved out of the network’s address space. Lengthening the prefix by n bits splits a block into 2^n equal subnets: a /16 becomes 256 /24s, or 64 /22s. Subnets in one network must not overlap each other, and each must fall inside the network’s address space.',
        },
      ],
    },
    {
      heading: 'Cloud subnets lose five addresses',
      blocks: [
        {
          type: 'paragraph',
          text: 'Both Azure and AWS reserve five addresses in every subnet — the first four and the last — for the network address, the virtual router, DNS, future use, and the broadcast address. A /24 therefore offers 251 assignable addresses, not 254. The reservation matters most for small subnets: a /28 has only 11 usable addresses.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'Azure', 'AWS'],
          rows: [
            ['Reserved per subnet', 'Five (first four and last)', 'Five (first four and last)'],
            ['Smallest IPv4 subnet', '/29', '/28'],
            ['Largest IPv4 subnet', 'Bounded by the virtual network’s address space', '/16'],
          ],
        },
      ],
    },
    {
      heading: 'Plan for networks you have not built yet',
      blocks: [
        {
          type: 'list',
          items: [
            'Networks with overlapping ranges cannot be peered or routed to each other directly — a destination address would be ambiguous',
            'Reserve distinct ranges per environment, region, and team from the start, including on-premises ranges',
            'Size subnets for growth: services such as managed Kubernetes or scale sets can consume many addresses, and resizing a subnet in use is disruptive',
            'Avoid the most common default ranges (such as 10.0.0.0/16 or 192.168.0.0/24) if there is any chance of connecting to networks that also used the default',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'plan-kc-1',
      type: 'single-choice',
      prompt: 'How many addresses can you assign to VMs in a /26 subnet in Azure or AWS?',
      difficulty: 'intermediate',
      learningObjective: 'Divide an address space into subnets and calculate usable cloud addresses',
      options: [
        { id: 'a', label: '59', correct: true, explanation: 'Correct — 2^6 = 64 addresses, minus the five both providers reserve.' },
        { id: 'b', label: '62', correct: false, explanation: '62 is the conventional count (excluding network and broadcast); cloud subnets reserve three more.' },
        { id: 'c', label: '64', correct: false, explanation: 'Not every address in a subnet is assignable.' },
      ],
    },
    {
      id: 'plan-kc-2',
      type: 'scenario',
      prompt: 'Two teams each built a production network with 10.0.0.0/16. They now need to peer them. What is the problem?',
      difficulty: 'intermediate',
      learningObjective: 'Plan address ranges that will not overlap with networks you may connect later',
      options: [
        { id: 'a', label: 'The ranges overlap, so peering is not possible without renumbering or NAT', correct: true, explanation: 'Correct — an address like 10.0.1.5 would exist on both sides, so routing cannot decide where to send it.' },
        { id: 'b', label: 'None — identical ranges peer automatically', correct: false, explanation: 'Overlapping address spaces are exactly what peering rejects.' },
        { id: 'c', label: 'Peering needs public addresses', correct: false, explanation: 'Peering uses private addresses; the problem is the overlap.' },
      ],
    },
  ],
};

const vnetArchitecture: Lesson = {
  id: 'virtual-network-architecture',
  title: 'Virtual Network Architecture',
  kind: 'concept',
  learningObjectives: [
    'Describe the components of a virtual network and how they relate',
    'Explain segmentation with subnets, route tables, and security rules',
  ],
  sections: [
    {
      heading: 'A private network, defined in software',
      blocks: [
        {
          type: 'paragraph',
          text: 'A virtual network (Azure VNet, AWS VPC) is an isolated private network inside a cloud region. You choose its address space, divide it into subnets, attach route tables that decide where traffic goes, and attach security rules that decide what traffic is allowed. Every VM and many managed services connect to it through a network interface with a private IP from a subnet.',
        },
        {
          type: 'list',
          items: [
            'Address space: the CIDR block(s) the network owns',
            'Subnets: segments of that space where resources are placed',
            'Route tables: per-subnet rules mapping destination ranges to next hops',
            'Gateways: connections out of the network — to the internet, NAT, VPN, or other networks',
            'Security rules: allow/deny filters at the subnet or network interface',
          ],
        },
      ],
    },
    {
      heading: 'Explore the network',
      blocks: [
        {
          type: 'paragraph',
          text: 'Step through the explorer to follow inbound, internal, and outbound traffic, and select each component to inspect its configuration. Notice that the public subnet and the private subnet differ only in their route tables.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Segmentation is the point of subnets: tiers with different exposure (internet-facing web, internal application, data) live in separate subnets so routes and rules can treat them differently.',
        },
      ],
    },
  ],
  visualization: vnetExplorerScene,
  knowledgeCheck: [
    {
      id: 'vnet-kc-1',
      type: 'single-choice',
      prompt: 'What makes a subnet “public”?',
      difficulty: 'beginner',
      learningObjective: 'Explain segmentation with subnets, route tables, and security rules',
      options: [
        { id: 'a', label: 'Its route table sends internet-bound traffic to an internet gateway', correct: true, explanation: 'Correct — the route, not a flag on the subnet, is what connects it to the internet. (Resources also need a public IP to be reachable inbound.)' },
        { id: 'b', label: 'It uses a public CIDR range', correct: false, explanation: 'Public subnets normally use private address ranges too.' },
        { id: 'c', label: 'It has no security rules', correct: false, explanation: 'Public subnets still have, and need, security rules.' },
      ],
    },
  ],
};

const securityRules: Lesson = {
  id: 'network-security-rules',
  title: 'Network Security Rules and Firewalls',
  kind: 'concept',
  learningObjectives: [
    'Distinguish stateful from stateless packet filtering',
    'Explain how rule evaluation decides whether a packet is allowed',
  ],
  sections: [
    {
      heading: 'Stateful and stateless filtering',
      blocks: [
        {
          type: 'paragraph',
          text: 'A security rule matches packets by direction, protocol, port, and source or destination range, and allows or denies them. A stateful filter remembers connections it has allowed, so reply traffic is allowed automatically; a stateless filter judges every packet on its own, so replies need their own rules — including the ephemeral port range clients use for responses.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'Stateful', 'Stateless'],
          rows: [
            ['Reply traffic', 'Allowed automatically', 'Must be explicitly allowed'],
            ['Typical placement', 'Network interface or subnet', 'Subnet boundary'],
            ['Examples', 'Azure network security groups, AWS security groups', 'AWS network ACLs'],
          ],
        },
      ],
    },
    {
      heading: 'Default deny inbound',
      blocks: [
        {
          type: 'paragraph',
          text: 'Cloud network filters deny unsolicited inbound traffic unless a rule allows it, and generally allow outbound traffic by default. Good rules are narrow: a specific port, from a specific source range or tagged group, rather than “any”. Rules should express the intended flows between tiers, as in the explorer’s app VM that accepts 8080 only from the web subnet.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Security rules filter by addresses and ports. Inspecting application content, intrusion detection, and centrally managed policy across many networks are jobs for a dedicated firewall appliance or service — covered in the Network Security concept of the Security category.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'rules-kc-1',
      type: 'scenario',
      prompt:
        'A stateless subnet filter allows inbound TCP 443 to a web server, but users’ requests time out. A stateful filter on the VM allows the same traffic. What is the most likely cause?',
      difficulty: 'advanced',
      learningObjective: 'Distinguish stateful from stateless packet filtering',
      options: [
        { id: 'a', label: 'The stateless filter has no outbound rule allowing the replies to the clients’ ephemeral ports', correct: true, explanation: 'Correct — a stateless filter does not remember the inbound connection, so replies need their own allow rule.' },
        { id: 'b', label: 'Port 443 cannot be used in the cloud', correct: false, explanation: 'HTTPS on 443 is the most common inbound rule there is.' },
        { id: 'c', label: 'The stateful filter blocks replies', correct: false, explanation: 'A stateful filter allows replies to connections it accepted.' },
      ],
    },
  ],
};

const azureVnet: Lesson = {
  id: 'azure-virtual-network',
  title: 'Azure Virtual Network',
  kind: 'provider',
  providerId: 'azure',
  learningObjectives: ['Map Azure Virtual Network, subnets, and network security groups onto the general model'],
  sections: [
    {
      heading: 'VNets, subnets, and NSGs',
      blocks: [
        {
          type: 'paragraph',
          text: 'An Azure virtual network (VNet) has one or more address spaces and is divided into subnets that span every availability zone in the region. Network security groups (NSGs) are stateful rule sets with numbered priorities and both allow and deny rules; an NSG can be associated with a subnet, a network interface, or both, in which case traffic must pass both. Application security groups let rules target groups of VMs by role instead of by IP.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Virtual Network',
    keyFeatures: [
      'Regional VNets whose subnets span all availability zones',
      'Network security groups: stateful, prioritised allow and deny rules',
      'NSGs on subnets and/or network interfaces',
      'Application security groups for role-based rule targets',
    ],
    terminology: {
      'Virtual network': 'Virtual network (VNet)',
      'Stateful security rules': 'Network security group (NSG)',
      'Named group of VMs in rules': 'Application security group',
    },
    architecturalNotes: [
      'Azure has no separate stateless subnet ACL; NSGs on subnets play that boundary role, statefully',
      'Five addresses are reserved per subnet; the smallest IPv4 subnet is /29',
    ],
    limitations: ['NSGs filter by address, port, and protocol; application-layer inspection needs Azure Firewall or another appliance'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview',
  },
};

const awsVpc: Lesson = {
  id: 'aws-vpc',
  title: 'AWS VPC',
  kind: 'provider',
  providerId: 'aws',
  learningObjectives: ['Map Amazon VPC, subnets, security groups, and network ACLs onto the general model'],
  sections: [
    {
      heading: 'VPCs, subnets, security groups, and network ACLs',
      blocks: [
        {
          type: 'paragraph',
          text: 'An Amazon Virtual Private Cloud (VPC) has a primary IPv4 CIDR block (optionally more) and is divided into subnets, each in exactly one Availability Zone. Security groups are stateful, allow-only rule sets attached to network interfaces; a security group can reference another security group as a source. Network ACLs are stateless, ordered allow-and-deny rule lists applied at the subnet boundary.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon Virtual Private Cloud (VPC)',
    keyFeatures: [
      'Regional VPCs with AZ-scoped subnets',
      'Security groups: stateful, allow-only, attached to network interfaces',
      'Network ACLs: stateless, ordered allow and deny rules per subnet',
      'Security groups can reference other security groups as sources',
    ],
    terminology: {
      'Virtual network': 'VPC',
      'Stateful security rules': 'Security group',
      'Stateless subnet filter': 'Network ACL',
    },
    architecturalNotes: [
      'Two filtering layers with different semantics: stateful security groups and stateless network ACLs',
      'Subnets are zonal, so multi-AZ designs need a subnet per AZ',
    ],
    limitations: ['Security groups cannot express explicit deny rules; denies require a network ACL or a firewall'],
    documentationUrl: 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html',
  },
};

const vnetComparison: Lesson = {
  id: 'virtual-network-comparison',
  title: 'Comparison: Azure VNet vs. AWS VPC',
  kind: 'comparison',
  learningObjectives: ['Compare Azure and AWS network filtering without treating NSGs and security groups as identical'],
  sections: [
    {
      heading: 'Similar names, different rule models',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Dimension', 'Azure', 'AWS'],
          rows: [
            ['Network', 'VNet', 'VPC'],
            ['Subnet scope', 'Regional (spans zones)', 'Zonal (one AZ)'],
            ['Stateful filter', 'NSG — allow and deny rules, by priority', 'Security group — allow rules only'],
            ['Where the stateful filter attaches', 'Subnet and/or network interface', 'Network interface'],
            ['Stateless filter', 'None built in', 'Network ACL per subnet'],
            ['Grouping VMs in rules', 'Application security groups', 'Security group references'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'An NSG is not simply “a security group.” An NSG can deny explicitly and attaches to subnets; a security group cannot deny and attaches to interfaces. Translating an AWS design with a deny-all network ACL to Azure means NSG deny rules, not an extra resource type.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'vnet-compare-kc-1',
      type: 'single-choice',
      prompt: 'An AWS design uses a network ACL to explicitly deny a known malicious range on a subnet. What is the Azure equivalent?',
      difficulty: 'advanced',
      learningObjective: 'Compare Azure and AWS network filtering without treating NSGs and security groups as identical',
      options: [
        { id: 'a', label: 'A high-priority deny rule in an NSG associated with the subnet', correct: true, explanation: 'Correct — NSGs support explicit deny rules and can be attached at the subnet level.' },
        { id: 'b', label: 'An Azure network ACL resource', correct: false, explanation: 'Azure has no separate network ACL resource; NSGs cover this.' },
        { id: 'c', label: 'It cannot be expressed in Azure', correct: false, explanation: 'NSG deny rules express it directly.' },
      ],
    },
  ],
};

const cidrLab: LabDefinition = {
  id: 'cidr-and-subnet-lab',
  title: 'CIDR and Subnet Lab',
  type: 'simulation',
  difficulty: 'beginner',
  estimatedTime: '20 minutes',
  description:
    'Enter CIDR blocks and step through how their network address, range, cloud capacity, subnets, and overlaps are calculated. Every result is computed in your browser from the input.',
  learningObjectives: [
    'Compute a CIDR block’s range and usable cloud addresses',
    'Split an address space into subnets and detect overlapping ranges',
  ],
  prerequisites: [
    { type: 'concept', id: 'ip-addressing-and-cidr', label: 'IP Addressing and CIDR Notation', description: 'Know what the prefix length means.' },
  ],
  content: {
    simulationId: cidrSubnetSimulation.id,
    instructions: [
      { id: 'read', label: 'Read a block', description: 'Step through the default 10.0.0.0/16 and follow each calculation in the step explanation.' },
      { id: 'host-bits', label: 'Host bits', description: 'Enter 10.0.5.77/20. Predict the network address before stepping, then check the binary AND.' },
      { id: 'capacity', label: 'Capacity', description: 'Enter 10.0.0.0/26. How many addresses can VMs use in an Azure or AWS subnet? Then try /29 and /30.' },
      { id: 'overlap', label: 'Plan for peering', description: 'With 10.0.0.0/16 as the block, check 10.1.0.0/16 and 10.0.128.0/17 for overlap. Which one could be peered?' },
      { id: 'invalid', label: 'Invalid input', description: 'Try 10.0.0.256/24, 10.0.0.0/33, and 10.0.0.010/24 and read why each is rejected.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'valid-input',
        label: 'The CIDR block was parsed successfully',
        check: (state) => {
          const s = state as CidrLabState;
          return s.stage >= 1 && s.error === null;
        },
      },
      {
        id: 'split',
        label: 'The block was split into subnets',
        check: (state) => {
          const s = state as CidrLabState;
          return s.stage >= 4 && s.split !== null && s.split.error === null;
        },
      },
      {
        id: 'overlap',
        label: 'An overlap check was completed',
        check: (state) => {
          const s = state as CidrLabState;
          return s.stage >= 5 && s.overlap !== null && s.overlap.error === null;
        },
      },
    ],
  },
};

export const virtualNetworks: ConceptMeta = {
  id: 'virtual-networks',
  title: 'Virtual Networks',
  description:
    'Isolated network environments in the cloud where you define address spaces (CIDR), connectivity, and network security groups.',
  status: 'available',
  learningObjectives: [
    'Compute CIDR ranges and plan non-overlapping address spaces and subnets',
    'Describe the components of a virtual network and how subnets, routes, and rules segment it',
    'Explain stateful and stateless filtering and compare Azure NSGs with AWS security groups and network ACLs',
  ],
  prerequisites: ['regions-and-availability-zones'],
  relatedConcepts: ['subnets-and-routing', 'connecting-networks', 'network-security', 'virtual-machines'],
  estimatedMinutes: 85,
  lessons: [ipAddressing, subnetPlanning, vnetArchitecture, securityRules, azureVnet, awsVpc, vnetComparison],
  labs: [cidrLab],
};
