// Eager metadata for this category's concepts: ids, titles, status, and
// lesson/lab ids, titles, and order. Never import concept content modules
// from here — they load per concept through ../concept-loaders.ts.

import type { ConceptMeta } from '../../types';

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
  lessons: [
    { id: 'ip-addressing-and-cidr', title: 'IP Addressing and CIDR Notation', kind: 'concept' },
    { id: 'cidr-and-subnet-planning', title: 'Subnets and Address Planning', kind: 'concept' },
    { id: 'virtual-network-architecture', title: 'Virtual Network Architecture', kind: 'concept' },
    { id: 'network-security-rules', title: 'Network Security Rules and Firewalls', kind: 'concept' },
    { id: 'azure-virtual-network', title: 'Azure Virtual Network', kind: 'provider', providerId: 'azure' },
    { id: 'aws-vpc', title: 'AWS VPC', kind: 'provider', providerId: 'aws' },
    { id: 'virtual-network-comparison', title: 'Comparison: Azure VNet vs. AWS VPC', kind: 'comparison' },
  ],
  labs: [
    { id: 'cidr-and-subnet-lab', title: 'CIDR and Subnet Lab', type: 'simulation' },
  ],
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
  lessons: [
    { id: 'how-routing-works', title: 'How Routing Works: Route Tables and Longest Prefix Match', kind: 'concept' },
    { id: 'internet-access-and-nat', title: 'Internet Access and NAT', kind: 'concept' },
    { id: 'public-vs-private-access', title: 'Public vs. Private Access', kind: 'concept' },
    { id: 'azure-routing-and-nat', title: 'Azure Routing and NAT', kind: 'provider', providerId: 'azure' },
    { id: 'aws-routing-and-nat', title: 'AWS Routing and NAT', kind: 'provider', providerId: 'aws' },
    { id: 'routing-comparison', title: 'Comparison: Azure vs. AWS Routing and NAT', kind: 'comparison' },
  ],
  labs: [
    { id: 'packet-routing-lab', title: 'Packet Routing Lab', type: 'simulation' },
  ],
};

export const connectingNetworks: ConceptMeta = {
  id: 'connecting-networks',
  title: 'Connecting Networks',
  description:
    'Peering, VPN, and hybrid connectivity patterns for linking virtual networks to each other and to on-premises infrastructure.',
  status: 'available',
  learningObjectives: [
    'Explain peering and its non-transitivity, and design hub-and-spoke connectivity',
    'Compare site-to-site VPN with private circuits for hybrid connectivity',
    'Use private endpoints to remove internet paths to managed services',
  ],
  prerequisites: ['virtual-networks', 'subnets-and-routing'],
  relatedConcepts: ['virtual-networks', 'subnets-and-routing', 'dns-and-content-delivery'],
  estimatedMinutes: 55,
  lessons: [
    { id: 'peering-and-transitivity', title: 'Peering and Hub-and-Spoke Topologies', kind: 'concept' },
    { id: 'hybrid-and-private-connectivity', title: 'Hybrid and Private Connectivity', kind: 'concept' },
    { id: 'azure-network-connectivity', title: 'Azure Network Connectivity', kind: 'provider', providerId: 'azure' },
    { id: 'aws-network-connectivity', title: 'AWS Network Connectivity', kind: 'provider', providerId: 'aws' },
    { id: 'connectivity-comparison', title: 'Comparison: Azure vs. AWS Network Connectivity', kind: 'comparison' },
  ],
  labs: [
    { id: 'connect-three-networks', title: 'Connect Three Networks', type: 'challenge' },
  ],
};

export const dnsAndContentDelivery: ConceptMeta = {
  id: 'dns-and-content-delivery',
  title: 'DNS and Content Delivery',
  description: 'Domain name resolution and global content distribution for fast, reliable access.',
  status: 'available',
  learningObjectives: [
    'Trace recursive DNS resolution and reason about TTLs and caching',
    'Use public and private zones and the in-network resolver correctly',
    'Explain how DNS steers users to edge locations and healthy endpoints',
    'Compare Azure DNS and Amazon Route 53 by actual scope',
  ],
  prerequisites: ['virtual-networks'],
  relatedConcepts: ['connecting-networks', 'data-centers-and-edge-locations', 'global-traffic-distribution'],
  estimatedMinutes: 55,
  lessons: [
    { id: 'how-dns-resolution-works', title: 'How DNS Resolution Works', kind: 'concept' },
    { id: 'dns-in-cloud-networks', title: 'DNS in Cloud Networks', kind: 'concept' },
    { id: 'dns-and-content-delivery-together', title: 'DNS and Content Delivery Together', kind: 'concept' },
    { id: 'azure-dns', title: 'Azure DNS', kind: 'provider', providerId: 'azure' },
    { id: 'amazon-route-53', title: 'Amazon Route 53', kind: 'provider', providerId: 'aws' },
    { id: 'dns-comparison', title: 'Comparison: Azure DNS vs. Amazon Route 53', kind: 'comparison' },
  ],
  labs: [
    { id: 'trace-dns-resolution-locally', title: 'Trace DNS Resolution Locally', type: 'hands-on' },
  ],
};
