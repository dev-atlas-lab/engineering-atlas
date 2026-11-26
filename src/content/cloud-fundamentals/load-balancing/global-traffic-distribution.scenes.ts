import type { SceneDefinition } from '../../../engines/visualization/types';

export const globalRoutingScene: SceneDefinition = {
  id: 'global-routing',
  type: 'topology',
  title: 'Global routing across regional deployments',
  description: 'A global routing layer sends users to regional stacks; it steers at DNS or forwards from an anycast edge.',
  nodes: [
    { id: 'users', type: 'client', label: 'Users worldwide', position: { x: 0, y: 130 }, data: { Resolve: 'One global name, not a region-specific address' } },
    { id: 'global', type: 'gateway', label: 'Global routing layer', position: { x: 190, y: 130 }, data: { 'DNS-based': 'Answers queries with a regional endpoint (Traffic Manager, Route 53)', Anycast: 'Forwards from the nearest edge (Front Door, Global Accelerator)', Uses: 'Health checks to steer away from down regions' } },
    { id: 'lbA', type: 'loadbalancer', label: 'Region A load balancer', position: { x: 420, y: 30 }, data: { Fronts: 'The regional backend pool' }, status: 'active' },
    { id: 'lbB', type: 'loadbalancer', label: 'Region B load balancer', position: { x: 420, y: 230 }, data: { Fronts: 'The regional backend pool' }, status: 'active' },
    { id: 'appA', type: 'server', label: 'Region A backends', position: { x: 640, y: 30 }, data: { Serves: 'Users routed to Region A' }, status: 'active' },
    { id: 'appB', type: 'server', label: 'Region B backends', position: { x: 640, y: 230 }, data: { Serves: 'Users routed to Region B' }, status: 'active' },
  ],
  edges: [
    { id: 'u-g', source: 'users', target: 'global', edgeType: 'request' },
    { id: 'g-a', source: 'global', target: 'lbA', edgeType: 'request', label: 'active' },
    { id: 'g-b', source: 'global', target: 'lbB', edgeType: 'request', label: 'active' },
    { id: 'a-app', source: 'lbA', target: 'appA', edgeType: 'request' },
    { id: 'b-app', source: 'lbB', target: 'appB', edgeType: 'request' },
  ],
  boundaries: [
    { id: 'regionA', label: 'Region A', kind: 'region', nodeIds: ['lbA', 'appA'] },
    { id: 'regionB', label: 'Region B', kind: 'region', nodeIds: ['lbB', 'appB'] },
  ],
  states: [
    {
      id: 'active-active',
      label: 'Active-active',
      description:
        'Both regions serve traffic at once. The global layer sends each user to a region (by latency, geography, or weight), and each region has its own regional load balancer and backend pool. Total capacity is the sum of both regions.',
      edgeOverrides: { 'u-g': { animated: true }, 'g-a': { flow: 'allow' }, 'g-b': { flow: 'allow' } },
    },
    {
      id: 'active-passive',
      label: 'Active-passive',
      description:
        'With priority routing, all traffic goes to the primary region (A) while the secondary (B) stands by. B carries no load until failover. This is simpler and avoids cross-region data consistency problems, but wastes the standby capacity and must be tested so it actually works when needed.',
      nodeOverrides: { lbB: { status: 'inactive' }, appB: { status: 'inactive' } },
      edgeOverrides: { 'u-g': { animated: true }, 'g-a': { flow: 'allow' }, 'g-b': { label: 'standby' } },
    },
    {
      id: 'failover',
      label: 'Region A fails',
      description:
        'Region A goes down. The global layer’s health checks mark it unhealthy and route users to Region B. How fast this happens depends on the layer: an anycast proxy reroutes in seconds; a DNS-based layer must wait for cached answers to expire (the record’s TTL). This is why DNS failover is never instant.',
      nodeOverrides: { lbA: { status: 'error' }, appA: { status: 'error' }, lbB: { status: 'active' }, appB: { status: 'active' } },
      edgeOverrides: { 'u-g': { animated: true }, 'g-a': { flow: 'blocked', label: 'down' }, 'g-b': { flow: 'allow', label: 'failover' } },
    },
  ],
};
