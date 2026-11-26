import type { SceneDefinition } from '../../../engines/visualization/types';

export const loadBalancerOverviewScene: SceneDefinition = {
  id: 'load-balancer-overview',
  type: 'topology',
  title: 'A load balancer in front of a backend pool',
  description: 'Clients reach one stable endpoint; the load balancer spreads requests across healthy backends and hides failures.',
  nodes: [
    { id: 'clients', type: 'client', label: 'Clients', position: { x: 0, y: 90 }, data: { Reach: 'One stable address (DNS name or IP), not individual servers' } },
    { id: 'lb', type: 'loadbalancer', label: 'Load balancer', position: { x: 180, y: 90 }, data: { Frontend: 'A listener on an address and port', 'Backend pool': 'The set of registered targets', Decides: 'Which healthy backend serves each request' } },
    { id: 'b1', type: 'server', label: 'web-1', position: { x: 400, y: 10 }, data: { State: 'Healthy — in rotation' }, status: 'active' },
    { id: 'b2', type: 'server', label: 'web-2', position: { x: 400, y: 90 }, data: { State: 'Healthy — in rotation' }, status: 'active' },
    { id: 'b3', type: 'server', label: 'web-3', position: { x: 400, y: 170 }, data: { State: 'Failed a health probe — removed from rotation' }, status: 'error' },
  ],
  edges: [
    { id: 'c-lb', source: 'clients', target: 'lb', edgeType: 'request', label: 'requests' },
    { id: 'lb-b1', source: 'lb', target: 'b1', edgeType: 'request' },
    { id: 'lb-b2', source: 'lb', target: 'b2', edgeType: 'request' },
    { id: 'lb-b3', source: 'lb', target: 'b3', edgeType: 'request', label: 'no traffic', flow: 'blocked' },
  ],
  boundaries: [{ id: 'pool', label: 'Backend pool', kind: 'zone', nodeIds: ['b1', 'b2', 'b3'] }],
  states: [
    {
      id: 'overview',
      label: 'One endpoint, many backends',
      description:
        'Clients connect to a single frontend. The load balancer forwards each request to one of the backends in the pool, so capacity is the sum of the backends and no single server is a bottleneck or a single point of failure.',
    },
    {
      id: 'healthy',
      label: 'Spreading load',
      description: 'With all backends healthy, requests are spread across them by the configured algorithm. Add a backend and it starts receiving its share; this is horizontal scaling of the tier.',
      edgeOverrides: { 'c-lb': { animated: true }, 'lb-b1': { animated: true }, 'lb-b2': { animated: true } },
    },
    {
      id: 'failure',
      label: 'Hiding a failure',
      description:
        'web-3 fails its health probe, so the load balancer stops sending it traffic. Clients notice nothing: the same requests are served by the remaining healthy backends. This is the availability half of what a load balancer buys you.',
      nodeOverrides: { b3: { status: 'error' } },
      edgeOverrides: { 'c-lb': { animated: true }, 'lb-b1': { animated: true }, 'lb-b2': { animated: true } },
    },
  ],
};

export const l4VsL7Scene: SceneDefinition = {
  id: 'l4-vs-l7-explorer',
  type: 'topology',
  title: 'Layer 4 versus Layer 7 load balancing',
  description: 'A Layer 4 load balancer forwards connections; a Layer 7 proxy terminates the connection and routes by the HTTP request.',
  nodes: [
    { id: 'client', type: 'client', label: 'Client', position: { x: 0, y: 120 }, data: { Sends: 'HTTPS requests to one address' } },
    { id: 'l4', type: 'loadbalancer', label: 'Layer 4 load balancer', position: { x: 210, y: 20 }, data: { Sees: 'IP addresses and TCP/UDP ports (the 5-tuple)', 'Does not see': 'The HTTP request, hostname, path, or headers', TLS: 'Passes through untouched, or terminates with a TLS listener' } },
    { id: 'tcpTarget', type: 'server', label: 'Backend (TCP target)', position: { x: 440, y: 20 }, data: { Receives: 'The raw connection; it sees the client IP only if preservation is on' } },
    { id: 'l7', type: 'loadbalancer', label: 'Layer 7 proxy', position: { x: 210, y: 180 }, data: { Sees: 'The full HTTP request: host, path, headers, cookies', Does: 'Terminates TLS, chooses a backend, opens its own connection to it', Adds: 'Headers such as X-Forwarded-For with the original client IP' } },
    { id: 'web', type: 'server', label: 'Web pool · shop.example', position: { x: 440, y: 120 }, data: { Serves: 'Requests for the shop hostname and the site root' } },
    { id: 'api', type: 'server', label: 'API pool · /v2', position: { x: 440, y: 220 }, data: { Serves: 'Requests whose path starts with /v2' } },
  ],
  edges: [
    { id: 'c-l4', source: 'client', target: 'l4', edgeType: 'request', label: 'TCP/UDP' },
    { id: 'l4-t', source: 'l4', target: 'tcpTarget', edgeType: 'request', label: 'forward by 5-tuple' },
    { id: 'c-l7', source: 'client', target: 'l7', edgeType: 'request', label: 'HTTP/HTTPS' },
    { id: 'l7-web', source: 'l7', target: 'web', edgeType: 'request', label: 'host-based' },
    { id: 'l7-api', source: 'l7', target: 'api', edgeType: 'request', label: 'path-based' },
  ],
  boundaries: [
    { id: 'b-l4', label: 'Layer 4 — connection level', kind: 'zone', nodeIds: ['l4', 'tcpTarget'] },
    { id: 'b-l7', label: 'Layer 7 — request level', kind: 'network', nodeIds: ['l7', 'web', 'api'] },
  ],
  states: [
    {
      id: 'overview',
      label: 'Two levels of decision',
      description:
        'A Layer 4 load balancer works at the connection level (TCP/UDP); a Layer 7 proxy works at the request level (HTTP). Select either load balancer to see what it can and cannot see.',
    },
    {
      id: 'l4',
      label: 'Layer 4: forward the connection',
      description:
        'The Layer 4 load balancer picks a backend from the connection’s 5-tuple (source and destination IP and port, plus protocol) and forwards packets. It never reads the request, so it is fast and protocol-agnostic — and it cannot route by hostname or path. TLS can pass straight through to the backend.',
      edgeOverrides: { 'c-l4': { animated: true }, 'l4-t': { animated: true } },
    },
    {
      id: 'l7-terminate',
      label: 'Layer 7: terminate TLS, read the request',
      description:
        'The Layer 7 proxy terminates the TLS connection, so it can read the HTTP request. It then opens its own connection to the chosen backend (re-encrypting if configured). Because it is a full reverse proxy, the backend sees the proxy’s IP unless the proxy adds the client IP in a header such as X-Forwarded-For.',
      edgeOverrides: { 'c-l7': { animated: true } },
    },
    {
      id: 'l7-host',
      label: 'Layer 7: route by host',
      description:
        'A request for shop.example is sent to the web pool. Host-based routing lets one Layer 7 endpoint serve many sites or services behind a single address and certificate.',
      nodeOverrides: { web: { status: 'active' } },
      edgeOverrides: { 'c-l7': { animated: true }, 'l7-web': { flow: 'allow' } },
    },
    {
      id: 'l7-path',
      label: 'Layer 7: route by path',
      description:
        'A request for /v2/orders is sent to the API pool. Path-based (and header- or cookie-based) routing is only possible because the proxy reads the request — a Layer 4 load balancer cannot do this.',
      nodeOverrides: { api: { status: 'active' } },
      edgeOverrides: { 'c-l7': { animated: true }, 'l7-api': { flow: 'allow' } },
    },
    {
      id: 'tradeoffs',
      label: 'Choosing a layer',
      description:
        'Layer 4 suits very high throughput, non-HTTP protocols, long-lived connections, and cases needing the real client IP with no proxy in the path. Layer 7 suits HTTP routing, TLS termination, redirects and rewrites, and per-request features — at the cost of terminating and re-opening every connection.',
    },
  ],
};
