import type { Category } from '../../types';
import { virtualNetworks, subnetsAndRouting, connectingNetworks, dnsAndContentDelivery } from './meta';

export const networking: Category = {
  id: 'networking',
  title: 'Networking',
  description:
    'Virtual networking — isolated networks, subnets, routing, connectivity between networks, DNS, and content delivery.',
  concepts: [virtualNetworks, subnetsAndRouting, connectingNetworks, dnsAndContentDelivery],
};
