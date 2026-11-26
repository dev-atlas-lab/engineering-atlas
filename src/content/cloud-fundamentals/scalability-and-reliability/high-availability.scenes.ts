import type { SceneDefinition } from '../../../engines/visualization/types';

export const haArchitectureScene: SceneDefinition = {
  id: 'ha-architecture',
  type: 'topology',
  title: 'A highly available application across two zones',
  description: 'Redundant tiers across availability zones with a zone-redundant load balancer and a replicated database remove single points of failure.',
  nodes: [
    { id: 'users', type: 'client', label: 'Users', position: { x: 0, y: 150 }, data: {} },
    { id: 'lb', type: 'loadbalancer', label: 'Zone-redundant load balancer', position: { x: 170, y: 150 }, data: { Spans: 'Both zones; survives a single zone failure' }, status: 'active' },
    { id: 'web1', type: 'server', label: 'Web · Zone 1', position: { x: 420, y: 40 }, data: { Zone: '1' }, status: 'active' },
    { id: 'web2', type: 'server', label: 'Web · Zone 2', position: { x: 420, y: 150 }, data: { Zone: '2' }, status: 'active' },
    { id: 'dbPrimary', type: 'database', label: 'DB primary · Zone 1', position: { x: 420, y: 250 }, data: { Role: 'Accepts writes' }, status: 'active' },
    { id: 'dbReplica', type: 'database', label: 'DB standby · Zone 2', position: { x: 640, y: 250 }, data: { Role: 'Synchronous replica, promoted on failover' }, status: 'active' },
  ],
  edges: [
    { id: 'u-lb', source: 'users', target: 'lb', edgeType: 'request' },
    { id: 'lb-w1', source: 'lb', target: 'web1', edgeType: 'request' },
    { id: 'lb-w2', source: 'lb', target: 'web2', edgeType: 'request' },
    { id: 'w1-db', source: 'web1', target: 'dbPrimary', edgeType: 'data' },
    { id: 'w2-db', source: 'web2', target: 'dbPrimary', edgeType: 'data' },
    { id: 'repl', source: 'dbPrimary', target: 'dbReplica', edgeType: 'data', label: 'replication' },
  ],
  boundaries: [
    { id: 'z1', label: 'Availability Zone 1', kind: 'zone', nodeIds: ['web1', 'dbPrimary'] },
    { id: 'z2', label: 'Availability Zone 2', kind: 'zone', nodeIds: ['web2', 'dbReplica'] },
  ],
  states: [
    {
      id: 'redundant',
      label: 'No single point of failure',
      description:
        'Every tier is redundant and spread across two zones: a zone-redundant load balancer, web instances in both zones, and a database with a synchronous standby in the other zone. There is no single component whose failure takes the service down.',
      edgeOverrides: { 'u-lb': { animated: true }, 'lb-w1': { animated: true }, 'lb-w2': { animated: true }, repl: { animated: true } },
    },
    {
      id: 'zone-failure',
      label: 'A zone fails',
      description:
        'Zone 1 goes down, taking its web instance and the database primary with it. The load balancer stops sending traffic to the Zone 1 web instance; the standby in Zone 2 is promoted to primary. The service stays up on reduced capacity — this is the point of multi-zone redundancy.',
      nodeOverrides: {
        web1: { status: 'error', label: 'Web · Zone 1 · down' },
        dbPrimary: { status: 'error', label: 'DB primary · Zone 1 · down' },
        dbReplica: { status: 'active', label: 'DB primary (promoted) · Zone 2' },
      },
      edgeOverrides: { 'u-lb': { animated: true }, 'lb-w1': { flow: 'blocked', label: 'removed' }, 'lb-w2': { animated: true }, 'w2-db': { label: 'now to Zone 2' }, repl: { label: 'failover' } },
    },
    {
      id: 'spof',
      label: 'A single point of failure',
      description:
        'Contrast: if the database had no standby, its zone failing would take the whole application down even though the web tier survived. One non-redundant component on the critical path is a single point of failure — redundancy must cover every tier, not just the obvious one.',
      nodeOverrides: {
        dbReplica: { status: 'inactive', label: 'DB standby · (none in this design)' },
        dbPrimary: { status: 'error', label: 'DB primary · down — no standby' },
        web1: { status: 'active' },
        web2: { status: 'active' },
      },
      edgeOverrides: { 'w1-db': { flow: 'blocked' }, 'w2-db': { flow: 'blocked', label: 'no database' }, repl: { label: 'no replica' } },
    },
  ],
};
