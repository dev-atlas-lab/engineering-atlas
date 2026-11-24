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
      position: { x: 250, y: 410 },
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
    { id: 'rt-pub', source: 'publicRt', target: 'publicSubnet', edgeType: 'dependency', label: 'associated' },
    { id: 'rt-priv', source: 'privateRt', target: 'privateSubnet', edgeType: 'dependency', label: 'associated' },
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

export const dnsResolutionScene: SceneDefinition = {
  id: 'dns-resolution',
  type: 'sequence',
  title: 'Recursive resolution of www.example.com',
  nodes: [
    { id: 'client', type: 'client', label: 'Client', position: { x: 0, y: 0 }, data: { Runs: 'A stub resolver that asks one recursive resolver and waits' } },
    {
      id: 'resolver',
      type: 'server',
      label: 'Recursive resolver',
      position: { x: 0, y: 0 },
      data: { Does: 'Follows referrals on the client’s behalf and caches answers for their TTL', 'In the cloud': 'Provided inside every virtual network' },
    },
    { id: 'root', type: 'server', label: 'Root server', position: { x: 0, y: 0 }, data: { Knows: 'Which servers are authoritative for each top-level domain' } },
    { id: 'tld', type: 'server', label: '.com TLD server', position: { x: 0, y: 0 }, data: { Knows: 'Which servers are authoritative for each .com domain' } },
    {
      id: 'auth',
      type: 'server',
      label: 'Authoritative server',
      position: { x: 0, y: 0 },
      data: { Holds: 'The example.com zone and its records', 'In the cloud': 'Azure DNS or Amazon Route 53 can host this zone' },
    },
  ],
  edges: [
    { id: 'd1', source: 'client', target: 'resolver', label: 'www.example.com A?' },
    { id: 'd2', source: 'resolver', target: 'root', label: 'www.example.com A?' },
    { id: 'd3', source: 'root', target: 'resolver', label: 'referral: .com servers' },
    { id: 'd4', source: 'resolver', target: 'tld', label: 'www.example.com A?' },
    { id: 'd5', source: 'tld', target: 'resolver', label: 'referral: example.com servers' },
    { id: 'd6', source: 'resolver', target: 'auth', label: 'www.example.com A?' },
    { id: 'd7', source: 'auth', target: 'resolver', label: 'A 203.0.113.80, TTL 300' },
    { id: 'd8', source: 'resolver', target: 'client', label: 'A 203.0.113.80' },
  ],
  states: [
    { id: 'r0', label: 'Nothing cached', description: 'The client wants the IPv4 address (an A record) for www.example.com, and the resolver has no cached answer.' },
    { id: 'r1', label: 'Client asks its resolver', description: 'The client sends one query to its configured recursive resolver and leaves the rest of the work to it.' },
    { id: 'r2', label: 'Resolver asks a root server', description: 'With nothing cached, the resolver starts at the root of the DNS hierarchy.' },
    { id: 'r3', label: 'Referral to .com', description: 'The root does not know the answer; it refers the resolver to the servers responsible for .com. Resolvers cache this referral, so this step is rarely repeated.' },
    { id: 'r4', label: 'Resolver asks the .com servers', description: 'The resolver repeats the question to a .com server.' },
    { id: 'r5', label: 'Referral to example.com', description: 'The .com servers refer the resolver to the name servers listed for example.com — the delegation you configure at your domain registrar.' },
    { id: 'r6', label: 'Resolver asks the authoritative server', description: 'Finally the resolver asks a server that holds the example.com zone.' },
    { id: 'r7', label: 'Authoritative answer', description: 'The authoritative server returns the record and its time to live (TTL): resolvers may cache this answer for 300 seconds.' },
    { id: 'r8', label: 'Answer returned and cached', description: 'The client gets the address. For the next 300 seconds, any client of this resolver gets the cached answer immediately — which is also why changing a record takes up to its TTL to be seen everywhere.' },
  ],
};
