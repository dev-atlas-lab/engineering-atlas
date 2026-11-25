import type { SceneDefinition } from '../../../engines/visualization/types';

export const infrastructureHierarchyScene: SceneDefinition = {
  id: 'infrastructure-hierarchy',
  type: 'topology',
  title: 'The physical hierarchy behind a cloud region',
  nodes: [
    {
      id: 'geography',
      type: 'network',
      label: 'Geography',
      position: { x: 200, y: 0 },
      data: { Example: 'A country or market such as “Europe”', Purpose: 'Groups regions for data residency and compliance' },
    },
    {
      id: 'region',
      type: 'region',
      label: 'Region',
      position: { x: 200, y: 100 },
      data: { 'You choose': 'Yes — every deployment names a region', Contains: 'Zones (in regions that support them)' },
    },
    {
      id: 'zone',
      type: 'availabilityZone',
      label: 'Availability zone',
      position: { x: 200, y: 200 },
      data: { 'You choose': 'Yes — for zonal resources', Contains: 'One or more datacenters' },
    },
    {
      id: 'datacenter',
      type: 'host',
      label: 'Datacenter',
      position: { x: 200, y: 300 },
      data: { 'You choose': 'No — never exposed directly', Contains: 'Rows of racks, power and cooling plant' },
    },
    {
      id: 'rack',
      type: 'server',
      label: 'Rack / fault domain',
      position: { x: 200, y: 400 },
      data: {
        'You choose': 'Indirectly — via availability sets or spread placement',
        'Shares': 'Power distribution and a top-of-rack switch',
      },
    },
    {
      id: 'edge',
      type: 'gateway',
      label: 'Edge location (PoP)',
      position: { x: 470, y: 100 },
      data: {
        'You choose': 'No — traffic is routed to the nearest one',
        Purpose: 'Caching, DNS, and traffic entry close to users',
        'Is it a region?': 'No — a much smaller site with a narrow set of services',
      },
    },
  ],
  edges: [
    { id: 'g-r', source: 'geography', target: 'region', edgeType: 'dependency' },
    { id: 'r-z', source: 'region', target: 'zone', edgeType: 'dependency' },
    { id: 'z-d', source: 'zone', target: 'datacenter', edgeType: 'dependency' },
    { id: 'd-r', source: 'datacenter', target: 'rack', edgeType: 'dependency' },
    { id: 'g-e', source: 'geography', target: 'edge', edgeType: 'network', label: 'separate edge network' },
  ],
  states: [
    {
      id: 'hierarchy',
      label: 'Nested failure domains',
      description:
        'Each level contains the one below it, and each level is a failure domain: a rack can fail without taking down its datacenter, a datacenter without its zone, a zone without its region. Edge locations sit outside this hierarchy as a separate, much more numerous network of small sites.',
    },
  ],
};

export const edgeCacheScene: SceneDefinition = {
  id: 'edge-cache-flow',
  type: 'sequence',
  title: 'Two requests for the same file through an edge location: a cache miss, then a cache hit',
  nodes: [
    { id: 'userA', type: 'client', label: 'User A', position: { x: 0, y: 0 }, data: { Location: 'Near the edge location' } },
    {
      id: 'edge',
      type: 'gateway',
      label: 'Edge location',
      position: { x: 0, y: 0 },
      data: { Holds: 'Cached copies of responses', 'Decides freshness from': 'Cache-Control headers and its own configuration' },
    },
    {
      id: 'origin',
      type: 'server',
      label: 'Origin (region)',
      position: { x: 0, y: 0 },
      data: { Is: 'Your application or storage in a cloud region', 'Is far from': 'Most users' },
    },
    { id: 'userB', type: 'client', label: 'User B', position: { x: 0, y: 0 }, data: { Location: 'Near the same edge location' } },
  ],
  edges: [
    { id: 'm1', source: 'userA', target: 'edge', label: 'GET /logo.png' },
    { id: 'm2', source: 'edge', target: 'origin', label: 'cache miss → fetch' },
    { id: 'm3', source: 'origin', target: 'edge', label: '200 + Cache-Control: max-age' },
    { id: 'm4', source: 'edge', target: 'userA', label: 'response (now cached)' },
    { id: 'm5', source: 'userB', target: 'edge', label: 'GET /logo.png' },
    { id: 'm6', source: 'edge', target: 'userB', label: 'cache hit — origin not contacted' },
  ],
  states: [
    { id: 'c0', label: 'Empty cache', description: 'The edge location has no copy of /logo.png yet.' },
    {
      id: 'c1',
      label: 'User A requests the file',
      description:
        'DNS (or anycast routing) has sent User A to a nearby edge location rather than to the distant origin region.',
    },
    {
      id: 'c2',
      label: 'Cache miss',
      description:
        'The edge has no fresh copy, so it forwards the request to the origin. This request pays the full round trip to the region — the edge adds no speed-up for the first request.',
    },
    {
      id: 'c3',
      label: 'Origin responds with caching rules',
      description:
        'The origin’s Cache-Control header tells the edge how long the response may be reused. Responses marked private or no-store must not be served to other users from cache.',
    },
    { id: 'c4', label: 'Response stored and returned', description: 'The edge stores a copy and returns the response to User A.' },
    { id: 'c5', label: 'User B requests the same file', description: 'A second nearby user requests the same URL before the cached copy expires.' },
    {
      id: 'c6',
      label: 'Cache hit',
      description:
        'The edge answers from its local copy. User B gets lower latency and the origin does no work — the two benefits of edge caching. Once max-age passes, the next request revalidates with the origin.',
    },
  ],
};
