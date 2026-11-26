import type { SceneDefinition } from '../../../engines/visualization/types';

export const scaleUpVsOutScene: SceneDefinition = {
  id: 'scale-up-vs-out',
  type: 'topology',
  title: 'Scaling up versus scaling out',
  description: 'Scaling up grows one instance; scaling out adds instances behind a load balancer. They differ in limits, failure impact, and cost.',
  nodes: [
    { id: 'clientsU', type: 'client', label: 'Clients', position: { x: 0, y: 30 }, data: {} },
    { id: 'big', type: 'server', label: 'One larger instance', position: { x: 180, y: 30 }, data: { Scaling: 'Vertical — bigger CPU/RAM', Limit: 'The largest instance size available', Failure: 'If it goes down, everything is down' }, status: 'active' },
    { id: 'clientsO', type: 'client', label: 'Clients', position: { x: 0, y: 200 }, data: {} },
    { id: 'lb', type: 'loadbalancer', label: 'Load balancer', position: { x: 180, y: 200 }, data: { Spreads: 'Requests across the instances' } },
    { id: 'o1', type: 'server', label: 'instance 1', position: { x: 400, y: 150 }, data: {}, status: 'active' },
    { id: 'o2', type: 'server', label: 'instance 2', position: { x: 400, y: 215 }, data: {}, status: 'active' },
    { id: 'o3', type: 'server', label: 'instance 3', position: { x: 400, y: 280 }, data: {}, status: 'active' },
  ],
  edges: [
    { id: 'cu-big', source: 'clientsU', target: 'big', edgeType: 'request' },
    { id: 'co-lb', source: 'clientsO', target: 'lb', edgeType: 'request' },
    { id: 'lb-o1', source: 'lb', target: 'o1', edgeType: 'request' },
    { id: 'lb-o2', source: 'lb', target: 'o2', edgeType: 'request' },
    { id: 'lb-o3', source: 'lb', target: 'o3', edgeType: 'request' },
  ],
  boundaries: [
    { id: 'up', label: 'Scale up (vertical)', kind: 'zone', nodeIds: ['big'] },
    { id: 'out', label: 'Scale out (horizontal)', kind: 'zone', nodeIds: ['o1', 'o2', 'o3'] },
  ],
  states: [
    {
      id: 'overview',
      label: 'Two directions to grow',
      description:
        'Scaling up (vertical) replaces an instance with a bigger one. Scaling out (horizontal) adds more instances behind a load balancer. Both add capacity; they differ in their ceilings, failure behaviour, and cost granularity.',
    },
    {
      id: 'throughput',
      label: 'Adding capacity',
      description:
        'Scaling up is capped by the largest instance you can buy, and often needs a restart to resize. Scaling out has a much higher ceiling — add more instances — but only works if the application is stateless, so any instance can serve any request.',
      edgeOverrides: { 'co-lb': { animated: true }, 'lb-o1': { animated: true }, 'lb-o2': { animated: true }, 'lb-o3': { animated: true } },
    },
    {
      id: 'failure',
      label: 'Failure impact',
      description:
        'The larger instance is a single point of failure: if it fails, the whole service is down. With scale-out, one failed instance removes only its share of capacity — the load balancer routes around it and the service stays up. This is why horizontal scaling and availability go together.',
      nodeOverrides: { big: { status: 'error', label: 'One larger instance · down' }, o2: { status: 'error', label: 'instance 2 · down' } },
      edgeOverrides: { 'co-lb': { animated: true }, 'lb-o1': { animated: true }, 'lb-o2': { flow: 'blocked', label: 'removed' }, 'lb-o3': { animated: true } },
    },
    {
      id: 'cost',
      label: 'Cost and elasticity',
      description:
        'Scale-out is elastic: add instances for a spike and remove them afterwards, paying for roughly what you use. Scaling up is coarse — you jump to the next instance size and pay for it continuously. The catch is that scale-out needs the application designed for it; a stateful app may only scale up until it is re-architected.',
    },
  ],
};
