import type { SceneDefinition } from '../../../engines/visualization/types';

export const vnetExplorerScene: SceneDefinition = {
  id: 'vnet-explorer',
  type: 'topology',
  title: 'A virtual network with a public and a private subnet, their route tables, and gateways',
  nodes: [
    { id: 'internet', type: 'client', label: 'Internet', position: { x: 250, y: 0 }, data: { Example: '198.51.100.7' } },
    {
      id: 'igw',
      type: 'gateway',
      label: 'Internet gateway',
      position: { x: 230, y: 100 },
      data: { Role: 'Connects the network to the internet', Translates: 'Public IP ↔ private IP for resources that have a public IP' },
    },
    {
      id: 'vnet',
      type: 'network',
      label: 'VNet / VPC · 10.0.0.0/16',
      position: { x: 520, y: 100 },
      data: { 'Address space': '10.0.0.0/16 (65,536 addresses)', Contains: 'Two /24 subnets, with room for 254 more' },
    },
    {
      id: 'publicRt',
      type: 'network',
      label: 'Public route table',
      position: { x: 0, y: 210 },
      data: { 'Route 1': '10.0.0.0/16 → local', 'Route 2': '0.0.0.0/0 → internet gateway', 'Makes the subnet': 'Public' },
    },
    {
      id: 'publicSubnet',
      type: 'network',
      label: 'Public subnet · 10.0.1.0/24',
      position: { x: 130, y: 300 },
      data: { CIDR: '10.0.1.0/24', 'Route table': 'Public route table', Hosts: 'Web VM, NAT gateway' },
    },
    {
      id: 'web',
      type: 'server',
      label: 'Web VM',
      position: { x: 40, y: 410 },
      data: { 'Private IP': '10.0.1.10', 'Public IP': '203.0.113.10', 'Inbound rule': 'Allow TCP 443 from the internet' },
      status: 'active',
    },
    {
      id: 'nat',
      type: 'gateway',
      label: 'NAT gateway',
      position: { x: 300, y: 510 },
      data: { 'Public IP': '203.0.113.50', Allows: 'Outbound connections from private resources and their replies', 'Does not allow': 'New inbound connections' },
      status: 'active',
    },
    {
      id: 'privateRt',
      type: 'network',
      label: 'Private route table',
      position: { x: 640, y: 210 },
      data: { 'Route 1': '10.0.0.0/16 → local', 'Route 2': '0.0.0.0/0 → NAT gateway', 'Makes the subnet': 'Private — no route from the internet' },
    },
    {
      id: 'privateSubnet',
      type: 'network',
      label: 'Private subnet · 10.0.2.0/24',
      position: { x: 500, y: 300 },
      data: { CIDR: '10.0.2.0/24', 'Route table': 'Private route table', Hosts: 'App VM, database' },
    },
    {
      id: 'app',
      type: 'server',
      label: 'App VM',
      position: { x: 470, y: 410 },
      data: { 'Private IP': '10.0.2.20', 'Public IP': 'None', 'Inbound rule': 'Allow TCP 8080 from 10.0.1.0/24 only' },
      status: 'active',
    },
    {
      id: 'db',
      type: 'database',
      label: 'Database',
      position: { x: 680, y: 410 },
      data: { 'Private IP': '10.0.2.30', 'Inbound rule': 'Allow TCP 5432 from 10.0.2.0/24 only' },
      status: 'active',
    },
  ],
  edges: [
    { id: 'net-igw', source: 'internet', target: 'igw', edgeType: 'network' },
    { id: 'igw-vnet', source: 'igw', target: 'vnet', edgeType: 'network', label: 'attached' },
    { id: 'rt-pub', source: 'publicRt', target: 'publicSubnet', edgeType: 'dependency' },
    { id: 'rt-priv', source: 'privateRt', target: 'privateSubnet', edgeType: 'dependency' },
    { id: 'pub-web', source: 'publicSubnet', target: 'web', edgeType: 'network' },
    { id: 'pub-nat', source: 'publicSubnet', target: 'nat', edgeType: 'network' },
    { id: 'priv-app', source: 'privateSubnet', target: 'app', edgeType: 'network' },
    { id: 'priv-db', source: 'privateSubnet', target: 'db', edgeType: 'network' },
    { id: 'igw-web', source: 'igw', target: 'web', edgeType: 'request', label: 'HTTPS' },
    { id: 'web-app', source: 'web', target: 'app', edgeType: 'request', label: 'TCP 8080' },
    { id: 'app-db', source: 'app', target: 'db', edgeType: 'data', label: 'TCP 5432' },
    { id: 'app-nat', source: 'app', target: 'nat', edgeType: 'request', label: 'outbound' },
    { id: 'nat-igw', source: 'nat', target: 'igw', edgeType: 'request' },
  ],
  states: [
    {
      id: 'overview',
      label: 'The network and its parts',
      description:
        'One address space (10.0.0.0/16) divided into two subnets. What makes a subnet “public” or “private” is not a property of the subnet itself but of its route table: whether it has a route to the internet gateway. Select route tables, subnets, and VMs to inspect their configuration.',
    },
    {
      id: 'inbound',
      label: 'Inbound: a user reaches the web VM',
      description:
        'A request to 203.0.113.10 arrives at the internet gateway, which maps it to the web VM’s private address 10.0.1.10. The web VM’s inbound rule allows TCP 443, so the request is accepted.',
      edgeOverrides: { 'net-igw': { animated: true }, 'igw-web': { animated: true } },
    },
    {
      id: 'east-west',
      label: 'Inside the network: web → app → database',
      description:
        'Traffic between subnets uses the “local” route present in every route table, so it never leaves the virtual network. Each hop is still checked by security rules: the app VM accepts 8080 only from the public subnet, the database accepts 5432 only from the private subnet.',
      edgeOverrides: { 'web-app': { animated: true }, 'app-db': { animated: true } },
    },
    {
      id: 'outbound',
      label: 'Outbound: the app VM downloads an update',
      description:
        'The app VM has no public IP. Its subnet’s default route points at the NAT gateway, which rewrites the source to its own public IP, forwards the connection through the internet gateway, and passes the reply back. Nobody on the internet can start a connection to the app VM through this path.',
      edgeOverrides: { 'app-nat': { animated: true }, 'nat-igw': { animated: true }, 'net-igw': { animated: true } },
    },
  ],
};
