import type { SceneDefinition } from '../../../engines/visualization/types';

export const regionZoneExplorerScene: SceneDefinition = {
  id: 'region-zone-explorer',
  type: 'topology',
  title: 'A region, its three availability zones, and resources with different scopes',
  nodes: [
    {
      id: 'region',
      type: 'region',
      label: 'Region',
      position: { x: 260, y: 0 },
      data: {
        Scope: 'Geographic area',
        Contains: 'Three availability zones in this example',
        'Isolation boundary': 'A separate region shares no failure domain with this one',
      },
      status: 'active',
    },
    {
      id: 'zone1',
      type: 'availabilityZone',
      label: 'Zone 1',
      position: { x: 40, y: 110 },
      data: { Scope: 'Zone', 'Independent of other zones': 'Power, cooling, and networking' },
      status: 'active',
    },
    {
      id: 'zone2',
      type: 'availabilityZone',
      label: 'Zone 2',
      position: { x: 260, y: 110 },
      data: { Scope: 'Zone', 'Independent of other zones': 'Power, cooling, and networking' },
      status: 'active',
    },
    {
      id: 'zone3',
      type: 'availabilityZone',
      label: 'Zone 3',
      position: { x: 480, y: 110 },
      data: { Scope: 'Zone', 'Independent of other zones': 'Power, cooling, and networking' },
      status: 'active',
    },
    {
      id: 'lb',
      type: 'loadbalancer',
      label: 'Load balancer (zone-redundant)',
      position: { x: 230, y: 210 },
      data: {
        Scope: 'Zone-redundant',
        'Runs in': 'All three zones',
        'If one zone fails': 'Keeps serving from the remaining zones',
      },
      status: 'active',
    },
    {
      id: 'web1',
      type: 'server',
      label: 'Web VM · Zone 1',
      position: { x: 20, y: 320 },
      data: { Scope: 'Zonal (Zone 1)', 'If Zone 1 fails': 'Unavailable until the zone recovers' },
      status: 'active',
    },
    {
      id: 'web2',
      type: 'server',
      label: 'Web VM · Zone 2',
      position: { x: 250, y: 320 },
      data: { Scope: 'Zonal (Zone 2)', 'If Zone 1 fails': 'Unaffected' },
      status: 'active',
    },
    {
      id: 'web3',
      type: 'server',
      label: 'Web VM · Zone 3',
      position: { x: 480, y: 320 },
      data: { Scope: 'Zonal (Zone 3)', 'If Zone 1 fails': 'Unaffected' },
      status: 'active',
    },
    {
      id: 'disk1',
      type: 'storage',
      label: 'Disk · Zone 1',
      position: { x: 0, y: 430 },
      data: {
        Scope: 'Zonal (Zone 1)',
        'Attached to': 'Web VM · Zone 1',
        'If Zone 1 fails': 'Unreachable — a zonal disk lives in exactly one zone',
      },
      status: 'active',
    },
    {
      id: 'db',
      type: 'database',
      label: 'Database (zone-redundant)',
      position: { x: 240, y: 440 },
      data: {
        Scope: 'Zone-redundant',
        Replication: 'Synchronous copies in multiple zones',
        'If one zone fails': 'Continues from a surviving zone',
      },
      status: 'active',
    },
  ],
  edges: [
    { id: 'region-zone1', source: 'region', target: 'zone1', edgeType: 'dependency' },
    { id: 'region-zone2', source: 'region', target: 'zone2', edgeType: 'dependency' },
    { id: 'region-zone3', source: 'region', target: 'zone3', edgeType: 'dependency' },
    { id: 'lb-web1', source: 'lb', target: 'web1', edgeType: 'request' },
    { id: 'lb-web2', source: 'lb', target: 'web2', edgeType: 'request' },
    { id: 'lb-web3', source: 'lb', target: 'web3', edgeType: 'request' },
    { id: 'web1-disk1', source: 'web1', target: 'disk1', edgeType: 'dependency' },
    { id: 'web2-db', source: 'web2', target: 'db', edgeType: 'data' },
    { id: 'web3-db', source: 'web3', target: 'db', edgeType: 'data' },
  ],
  states: [
    {
      id: 'overview',
      label: 'One region, three isolated zones',
      description:
        'The region is the geographic boundary; the zones inside it are physically separate groups of datacenters with independent power, cooling, and networking. Select any component to see its scope: zonal resources live in one zone, zone-redundant resources span several.',
      edgeOverrides: {
        'lb-web1': { animated: true },
        'lb-web2': { animated: true },
        'lb-web3': { animated: true },
      },
    },
    {
      id: 'zone1-fails',
      label: 'Zone 1 fails',
      description:
        'A power or network event takes Zone 1 offline. Everything scoped to Zone 1 — the web VM and its zonal disk — goes down with it. Nothing in Zones 2 or 3 is affected, and the zone-redundant load balancer and database keep running from the surviving zones.',
      nodeOverrides: {
        zone1: { status: 'error' },
        web1: { status: 'error' },
        disk1: { status: 'error' },
      },
    },
    {
      id: 'traffic-shifts',
      label: 'Health checks shift traffic',
      description:
        'The load balancer’s health probes to the Zone 1 VM fail, so it stops routing requests there. The application stays up on two of three web VMs — reduced capacity, not an outage. This only works because the web tier was spread across zones before the failure happened.',
      nodeOverrides: {
        zone1: { status: 'error' },
        web1: { status: 'error' },
        disk1: { status: 'error' },
      },
      edgeOverrides: {
        'lb-web2': { animated: true },
        'lb-web3': { animated: true },
      },
    },
    {
      id: 'zone-recovers',
      label: 'Zone 1 recovers',
      description:
        'When Zone 1 returns, its VM passes health checks again and rejoins the pool. Data written to the zone-redundant database during the outage was never at risk; the zonal disk simply becomes reachable again.',
      edgeOverrides: {
        'lb-web1': { animated: true },
        'lb-web2': { animated: true },
        'lb-web3': { animated: true },
      },
    },
  ],
};

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

export const multiRegionScene: SceneDefinition = {
  id: 'multi-region-failover',
  type: 'topology',
  title: 'A primary region asynchronously replicating to a secondary region',
  nodes: [
    { id: 'users', type: 'client', label: 'Users', position: { x: 220, y: 0 }, data: { 'Reach the app via': 'A DNS name, not a region-specific address' } },
    {
      id: 'dns',
      type: 'gateway',
      label: 'Global DNS / traffic manager',
      position: { x: 190, y: 100 },
      data: { Role: 'Points users at the healthy region', 'Failover speed': 'Bounded by health checks and DNS TTLs' },
      status: 'active',
    },
    {
      id: 'primary',
      type: 'region',
      label: 'Primary region',
      position: { x: 30, y: 220 },
      data: { Serves: 'All reads and writes', 'Zone redundancy': 'Yes — survives a single zone failure on its own' },
      status: 'active',
    },
    {
      id: 'secondary',
      type: 'region',
      label: 'Secondary region',
      position: { x: 400, y: 220 },
      data: { Serves: 'Nothing until failover (warm standby)', 'Data freshness': 'Behind the primary by the replication lag' },
      status: 'inactive',
    },
    {
      id: 'primaryDb',
      type: 'database',
      label: 'Primary data',
      position: { x: 40, y: 340 },
      data: { Accepts: 'Writes' },
      status: 'active',
    },
    {
      id: 'replicaDb',
      type: 'database',
      label: 'Replica data',
      position: { x: 410, y: 340 },
      data: { Accepts: 'Replicated changes only (until promoted)' },
      status: 'inactive',
    },
  ],
  edges: [
    { id: 'u-dns', source: 'users', target: 'dns', edgeType: 'request' },
    { id: 'dns-primary', source: 'dns', target: 'primary', edgeType: 'request', label: 'active' },
    { id: 'dns-secondary', source: 'dns', target: 'secondary', edgeType: 'request', label: 'standby' },
    { id: 'primary-db', source: 'primary', target: 'primaryDb', edgeType: 'data' },
    { id: 'secondary-db', source: 'secondary', target: 'replicaDb', edgeType: 'data' },
    { id: 'replication', source: 'primaryDb', target: 'replicaDb', edgeType: 'data', label: 'async replication' },
  ],
  states: [
    {
      id: 'normal',
      label: 'Normal operation',
      description:
        'All traffic goes to the primary region. Every write is committed there first and shipped to the secondary region afterwards — asynchronously, because waiting for a round trip to a distant region on every write would add that latency to every user request.',
      edgeOverrides: { 'dns-primary': { animated: true }, replication: { animated: true } },
    },
    {
      id: 'primary-outage',
      label: 'Primary region outage',
      description:
        'The whole primary region becomes unavailable — a rare event, but one that zone redundancy cannot protect against. Writes committed in the last moments before the outage may not have reached the secondary yet. That window is the recovery point objective (RPO) in practice.',
      nodeOverrides: { primary: { status: 'error' }, primaryDb: { status: 'error' } },
    },
    {
      id: 'failover',
      label: 'Failover to the secondary region',
      description:
        'The replica is promoted to accept writes and DNS is updated to point users at the secondary region. How long this takes — detection, decision, promotion, DNS propagation — is the recovery time objective (RTO) in practice. Many teams keep the decision manual to avoid failing over on a false alarm.',
      nodeOverrides: {
        primary: { status: 'error' },
        primaryDb: { status: 'error' },
        secondary: { status: 'active' },
        replicaDb: { status: 'active', data: { Accepts: 'Writes (promoted)' } },
      },
      edgeOverrides: { 'dns-secondary': { animated: true, label: 'active' } },
    },
  ],
};
