import type { SceneDefinition } from '../../../engines/visualization/types';

export const publicPrivateScene: SceneDefinition = {
  id: 'public-private-explorer',
  type: 'topology',
  title: 'Public reachability, private addressing, and why private is not the same as secure',
  nodes: [
    { id: 'internet', type: 'client', label: 'Internet', position: { x: 200, y: 0 }, data: {} },
    {
      id: 'publicVm',
      type: 'server',
      label: 'Web VM · public IP',
      position: { x: 40, y: 150 },
      data: { 'Reachable from the internet': 'Yes — if a rule allows it', 'Inbound rule': 'TCP 443 from anywhere' },
      status: 'active',
    },
    {
      id: 'privateVm',
      type: 'database',
      label: 'Database · private IP only',
      position: { x: 380, y: 150 },
      data: { 'Reachable from the internet': 'No — nothing routes to it', 'Reachable from inside the network': 'Depends entirely on security rules' },
      status: 'active',
    },
    {
      id: 'nat',
      type: 'gateway',
      label: 'NAT gateway',
      position: { x: 380, y: 300 },
      data: { Direction: 'Outbound only' },
      status: 'active',
    },
  ],
  edges: [
    { id: 'in-public', source: 'internet', target: 'publicVm', edgeType: 'request', label: 'HTTPS' },
    { id: 'in-private', source: 'internet', target: 'privateVm', edgeType: 'request', label: 'no route' },
    { id: 'public-private', source: 'publicVm', target: 'privateVm', edgeType: 'request' },
    { id: 'private-nat', source: 'privateVm', target: 'nat', edgeType: 'request', label: 'outbound' },
  ],
  states: [
    {
      id: 'public',
      label: 'Public: reachable, and filtered',
      description:
        'A resource with a public IP can receive traffic from anywhere on the internet. Whether it accepts that traffic is decided by its security rules. Public reachability plus a correct rule is how a web server is meant to work.',
      edgeOverrides: { 'in-public': { animated: true } },
    },
    {
      id: 'private',
      label: 'Private: no path from the internet',
      description:
        'The database has only a private address. Internet routers do not route private (RFC 1918) addresses, and no public IP is mapped to it, so there is no inbound path from the internet at all — regardless of its security rules.',
      nodeOverrides: { privateVm: { data: { 'Internet → database': 'No route — the packet never arrives' } } },
    },
    {
      id: 'lateral',
      label: 'Private, yet exposed',
      description:
        'Now suppose the web VM is compromised. The attacker is inside the network, and the database’s rule allows “any traffic from the virtual network.” Its private address offers no protection at all: the attacker connects directly. Private addressing removes one path; it does not authorise or deny anything.',
      nodeOverrides: { publicVm: { status: 'error', label: 'Web VM · compromised' }, privateVm: { status: 'error' } },
      edgeOverrides: { 'public-private': { animated: true, label: 'allowed: any from network' } },
    },
    {
      id: 'controlled',
      label: 'Private and controlled',
      description:
        'The fix is defence in depth: the database accepts only its port, only from the application subnet; the web tier gets no direct database access; outbound internet access goes through the NAT gateway rather than a public IP. Now a compromised web VM still cannot reach the database directly.',
      nodeOverrides: { publicVm: { status: 'error', label: 'Web VM · compromised' } },
      edgeOverrides: {
        'public-private': { label: 'denied: rule allows app subnet only' },
        'private-nat': { animated: true },
      },
    },
  ],
};
