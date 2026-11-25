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
