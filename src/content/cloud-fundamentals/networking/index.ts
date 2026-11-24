import type { Category } from '../../types';
import { virtualNetworks } from './virtual-networks';
import { subnetsAndRouting } from './subnets-and-routing';
import { connectingNetworks } from './connecting-networks';
import { dnsAndContentDelivery } from './dns-and-content-delivery';

export const networking: Category = {
  id: 'networking',
  title: 'Networking',
  description:
    'Virtual networking — isolated networks, subnets, routing, connectivity between networks, DNS, and content delivery.',
  concepts: [virtualNetworks, subnetsAndRouting, connectingNetworks, dnsAndContentDelivery],
};
