import type { SceneDefinition } from '../../../engines/visualization/types';

export const layeredEdgeScene: SceneDefinition = {
  id: 'layered-network-security',
  type: 'topology',
  title: 'Layered network controls: in at the edge, out through the firewall',
  nodes: [
    { id: 'internet', type: 'client', label: 'Internet clients', position: { x: 0, y: 0 }, data: {} },
    { id: 'ddos', type: 'network', label: 'Provider edge: DDoS mitigation', position: { x: 0, y: 110 }, data: { Layer: 'Network (L3/L4)', Handles: 'Volumetric and protocol floods' }, status: 'active' },
    { id: 'waf', type: 'firewall', label: 'WAF on the gateway / CDN', position: { x: 0, y: 220 }, data: { Layer: 'Application (L7)', Handles: 'Malicious HTTP patterns, rate limits, bots' }, status: 'active' },
    { id: 'app', type: 'server', label: 'App subnet', position: { x: 0, y: 330 }, data: { 'Security rules': 'Allow 443 from the gateway subnet only' }, status: 'active' },
    { id: 'db', type: 'database', label: 'Database via private endpoint', position: { x: 260, y: 330 }, data: { 'Public access': 'Disabled' }, status: 'active' },
    { id: 'fw', type: 'firewall', label: 'Network firewall (hub)', position: { x: 260, y: 200 }, data: { Layer: 'Network (L3–L7)', Handles: 'Egress allow-lists, threat intelligence, IDPS' }, status: 'active' },
    { id: 'ext', type: 'client', label: 'External destinations', position: { x: 260, y: 60 }, data: {} },
  ],
  edges: [
    { id: 'i-d', source: 'internet', target: 'ddos', edgeType: 'request' },
    { id: 'd-w', source: 'ddos', target: 'waf', edgeType: 'request' },
    { id: 'w-a', source: 'waf', target: 'app', edgeType: 'request', label: 'HTTPS' },
    { id: 'a-db', source: 'app', target: 'db', edgeType: 'data', label: 'private' },
    { id: 'a-fw', source: 'app', target: 'fw', edgeType: 'request', label: '0.0.0.0/0 route' },
    { id: 'fw-e', source: 'fw', target: 'ext', edgeType: 'request' },
  ],
  states: [
    {
      id: 'normal',
      label: 'Each control sees different traffic',
      description:
        'Inbound requests pass the provider’s DDoS mitigation, then a web application firewall on the application gateway or CDN, then the subnet’s security rules. Outbound traffic is routed through a central network firewall. The database has no public endpoint at all. Select a node to see what it handles.',
      edgeOverrides: { 'i-d': { animated: true }, 'd-w': { animated: true }, 'w-a': { animated: true } },
    },
    {
      id: 'flood',
      label: 'A volumetric flood',
      description:
        'A UDP reflection flood targets the site’s public IP. It is absorbed at the provider’s network edge and never reaches the WAF — which could not help anyway, because a UDP flood is not HTTP.',
      nodeOverrides: { ddos: { data: { 'This traffic': 'Mitigated at the edge' } } },
      edgeOverrides: { 'i-d': { animated: true, label: 'UDP flood' } },
    },
    {
      id: 'injection',
      label: 'A malicious request',
      description:
        'A request carrying a SQL injection pattern is perfectly valid TCP and HTTP, so the network layer forwards it. The WAF’s managed rules inspect the request itself and block it before it reaches the application.',
      nodeOverrides: { waf: { status: 'error', data: { 'This request': 'Blocked: SQL injection rule matched' } } },
      edgeOverrides: { 'i-d': { animated: true }, 'd-w': { animated: true, label: "q=' OR '1'='1" } },
    },
    {
      id: 'egress',
      label: 'Stopping a compromised workload calling out',
      description:
        'Suppose malware lands on an app server and tries to contact its command-and-control server or upload data. The default route sends outbound traffic through the hub firewall, which allows only the destinations the app needs. Egress filtering turns “the attacker is in” into “the attacker is in but cannot get data out.”',
      nodeOverrides: { app: { status: 'error', label: 'App subnet · compromised host' }, fw: { status: 'error', data: { 'This connection': 'Denied: destination not on the allow-list' } } },
      edgeOverrides: { 'a-fw': { animated: true, label: 'unknown destination' } },
    },
  ],
};
