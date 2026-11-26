import type { SceneDefinition } from '../../../engines/visualization/types';

export const l7RoutingScene: SceneDefinition = {
  id: 'l7-routing',
  type: 'topology',
  title: 'Layer 7 listener rules routing one request',
  description: 'A Layer 7 load balancer terminates TLS, then matches the request against ordered rules to pick a target group.',
  nodes: [
    { id: 'client', type: 'client', label: 'Client', position: { x: 0, y: 150 }, data: { Request: 'GET https://shop.example/api/v2/orders' } },
    { id: 'listener', type: 'loadbalancer', label: 'HTTPS listener', position: { x: 180, y: 150 }, data: { Does: 'Terminates TLS and evaluates rules in priority order', Holds: 'The certificate for shop.example' } },
    { id: 'ruleApi', type: 'policy', label: 'Rule 1 · path /api/*', position: { x: 390, y: 40 }, data: { Match: 'Path begins with /api/', Action: 'Forward to the API target group' } },
    { id: 'ruleHost', type: 'policy', label: 'Rule 2 · host admin.*', position: { x: 390, y: 150 }, data: { Match: 'Host is admin.shop.example', Action: 'Forward to the admin target group' } },
    { id: 'ruleDefault', type: 'policy', label: 'Default · everything else', position: { x: 390, y: 260 }, data: { Match: 'Anything not matched above', Action: 'Forward to the web target group' } },
    { id: 'apiTg', type: 'server', label: 'API target group', position: { x: 620, y: 40 }, data: { Targets: 'The API service instances' } },
    { id: 'webTg', type: 'server', label: 'Web target group', position: { x: 620, y: 260 }, data: { Targets: 'The web front-end instances' } },
  ],
  edges: [
    { id: 'c-l', source: 'client', target: 'listener', edgeType: 'request', label: 'HTTPS' },
    { id: 'l-api', source: 'listener', target: 'ruleApi', edgeType: 'dependency' },
    { id: 'l-host', source: 'listener', target: 'ruleHost', edgeType: 'dependency' },
    { id: 'l-def', source: 'listener', target: 'ruleDefault', edgeType: 'dependency' },
    { id: 'api-tg', source: 'ruleApi', target: 'apiTg', edgeType: 'request' },
    { id: 'def-tg', source: 'ruleDefault', target: 'webTg', edgeType: 'request' },
  ],
  states: [
    {
      id: 'arrive',
      label: 'TLS terminates at the listener',
      description: 'The request arrives over HTTPS. The listener terminates TLS using its certificate, so the load balancer can now read the host and path. Rules are evaluated in priority order.',
      edgeOverrides: { 'c-l': { animated: true } },
    },
    {
      id: 'match',
      label: 'First matching rule wins',
      description: 'Rule 1 matches requests whose path begins with /api/. This request’s path is /api/v2/orders, so Rule 1 matches and evaluation stops — later rules are not considered.',
      nodeOverrides: { ruleApi: { status: 'active' } },
      edgeOverrides: { 'l-api': { flow: 'allow' } },
    },
    {
      id: 'forward',
      label: 'Forward to the target group',
      description: 'The listener forwards the request to the API target group and opens its own connection to a healthy target there, chosen by the group’s algorithm. The backend sees the load balancer’s IP, with the client’s in X-Forwarded-For.',
      nodeOverrides: { ruleApi: { status: 'active' }, apiTg: { status: 'active' } },
      edgeOverrides: { 'l-api': { flow: 'allow' }, 'api-tg': { animated: true } },
    },
    {
      id: 'default',
      label: 'When nothing matches',
      description: 'A request for shop.example/ matches no specific rule, so the default action forwards it to the web target group. Rule order matters: a broad rule placed first can shadow narrower ones below it.',
      nodeOverrides: { ruleDefault: { status: 'active' }, webTg: { status: 'active' } },
      edgeOverrides: { 'l-def': { flow: 'allow' }, 'def-tg': { animated: true } },
    },
  ],
};
