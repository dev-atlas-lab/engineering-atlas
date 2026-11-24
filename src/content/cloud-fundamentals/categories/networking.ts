import type { Category } from '../../types';

export const networking: Category = {
  id: 'networking',
  title: 'Networking',
  description:
    'Virtual networking — isolated networks, subnets, routing, connectivity between networks, DNS, and content delivery.',
  concepts: [
    {
      id: 'virtual-networks',
      title: 'Virtual Networks',
      description:
        'Isolated network environments in the cloud where you define address spaces (CIDR), connectivity, and network security groups.',
      status: 'coming-soon',
    },
    {
      id: 'subnets-and-routing',
      title: 'Subnets and Routing',
      description:
        'Network segmentation, routing tables, public vs. private subnets, internet gateways, and NAT for outbound-only connectivity.',
      status: 'coming-soon',
    },
    {
      id: 'connecting-networks',
      title: 'Connecting Networks',
      description:
        'Peering, VPN, and hybrid connectivity patterns for linking virtual networks to each other and to on-premises infrastructure.',
      status: 'coming-soon',
    },
    {
      id: 'dns-and-content-delivery',
      title: 'DNS and Content Delivery',
      description:
        'Domain name resolution and global content distribution for fast, reliable access.',
      status: 'coming-soon',
    },
  ],
};
