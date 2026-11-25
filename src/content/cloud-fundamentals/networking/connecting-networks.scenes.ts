import type { SceneDefinition } from '../../../engines/visualization/types';

export const hubSpokeScene: SceneDefinition = {
  id: 'hub-spoke-connectivity',
  type: 'topology',
  title: 'Hub-and-spoke networks connected by peering, with on-premises connectivity through the hub',
  nodes: [
    {
      id: 'onprem',
      type: 'host',
      label: 'On-premises · 192.168.0.0/16',
      position: { x: 230, y: 0 },
      data: { Connects: 'Over an encrypted site-to-site VPN to the hub' },
      status: 'active',
    },
    {
      id: 'gateway',
      type: 'gateway',
      label: 'VPN gateway (in hub)',
      position: { x: 240, y: 110 },
      data: { Role: 'Terminates the IPsec tunnel', 'Shared by': 'Spokes, if gateway transit is configured' },
      status: 'active',
    },
    {
      id: 'hub',
      type: 'network',
      label: 'Hub · 10.0.0.0/16',
      position: { x: 250, y: 220 },
      data: { Hosts: 'Shared gateway and firewall/router', 'Peered with': 'Spoke A, Spoke B' },
      status: 'active',
    },
    {
      id: 'firewall',
      type: 'gateway',
      label: 'Firewall / router (hub)',
      position: { x: 470, y: 220 },
      data: { Role: 'Inspects and forwards traffic between spokes', 'Needed because': 'Peering is not transitive' },
      status: 'active',
    },
    {
      id: 'spokeA',
      type: 'network',
      label: 'Spoke A · 10.1.0.0/16',
      position: { x: 60, y: 340 },
      data: { 'Peered with': 'Hub only' },
      status: 'active',
    },
    {
      id: 'spokeB',
      type: 'network',
      label: 'Spoke B · 10.2.0.0/16',
      position: { x: 440, y: 340 },
      data: { 'Peered with': 'Hub only' },
      status: 'active',
    },
  ],
  edges: [
    { id: 'vpn', source: 'onprem', target: 'gateway', edgeType: 'network', label: 'IPsec VPN' },
    { id: 'gw-hub', source: 'gateway', target: 'hub', edgeType: 'network' },
    { id: 'hub-fw', source: 'hub', target: 'firewall', edgeType: 'network' },
    { id: 'peer-a', source: 'hub', target: 'spokeA', edgeType: 'network', label: 'peering' },
    { id: 'peer-b', source: 'hub', target: 'spokeB', edgeType: 'network', label: 'peering' },
    { id: 'a-b', source: 'spokeA', target: 'spokeB', edgeType: 'request', label: 'no direct path' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Hub and spokes',
      description:
        'Each spoke is peered only with the hub. Shared services — the VPN gateway to on-premises and a firewall — live once in the hub instead of being repeated in every spoke. Address ranges do not overlap, which peering requires.',
    },
    {
      id: 'spoke-hub',
      label: 'Spoke ↔ hub works',
      description:
        'Peering connects two networks directly: Spoke A can reach resources in the hub using private addresses, over the provider’s backbone, as if they were one network.',
      edgeOverrides: { 'peer-a': { animated: true } },
    },
    {
      id: 'not-transitive',
      label: 'Spoke A → Spoke B fails',
      description:
        'Peering is not transitive. A is peered with the hub and B is peered with the hub, but that does not connect A to B. A packet from A addressed to B has no route.',
      nodeOverrides: { spokeB: { status: 'error' } },
    },
    {
      id: 'transit',
      label: 'Transit through the hub',
      description:
        'To connect spokes, route their traffic to something in the hub that forwards it: a firewall or router appliance with user-defined routes in each spoke (or a managed transit service such as AWS Transit Gateway or Azure Virtual WAN). As a bonus, all spoke-to-spoke traffic is now inspected in one place.',
      edgeOverrides: { 'peer-a': { animated: true }, 'hub-fw': { animated: true }, 'peer-b': { animated: true }, 'a-b': { label: 'via hub firewall' } },
    },
    {
      id: 'onprem',
      label: 'On-premises reaches the spokes',
      description:
        'The VPN gateway in the hub can carry on-premises traffic to the spokes too — but only when the peerings are configured to share the hub’s gateway and routes to the spoke ranges are advertised. Without that configuration, on-premises can reach the hub and nothing else.',
      edgeOverrides: { vpn: { animated: true }, 'gw-hub': { animated: true }, 'peer-a': { animated: true }, 'peer-b': { animated: true } },
    },
  ],
};
