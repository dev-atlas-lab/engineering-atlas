import type { SceneDefinition } from '../../../engines/visualization/types';

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
