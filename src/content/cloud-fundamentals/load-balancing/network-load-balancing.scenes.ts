import type { SceneDefinition } from '../../../engines/visualization/types';

export const l4FlowScene: SceneDefinition = {
  id: 'l4-flow',
  type: 'topology',
  title: 'Layer 4 flow hashing and source-IP preservation',
  description: 'A Layer 4 load balancer pins each connection (flow) to a target by hashing its 5-tuple, and can preserve the client IP.',
  nodes: [
    { id: 'c1', type: 'client', label: 'Client A', position: { x: 0, y: 40 }, data: { Flow: 'src 198.51.100.10:51000 → VIP:443', Protocol: 'TCP' } },
    { id: 'c2', type: 'client', label: 'Client B', position: { x: 0, y: 220 }, data: { Flow: 'src 203.0.113.7:44000 → VIP:443', Protocol: 'TCP' } },
    { id: 'nlb', type: 'loadbalancer', label: 'Layer 4 load balancer', position: { x: 210, y: 130 }, data: { Chooses: 'A target by hashing the connection’s 5-tuple', Keeps: 'Every packet of one flow on the same target', 'Reads request?': 'No — it never looks inside the connection' } },
    { id: 't1', type: 'server', label: 'target-1', position: { x: 440, y: 40 }, data: { Sees: 'The real client IP when preservation is on' }, status: 'active' },
    { id: 't2', type: 'server', label: 'target-2', position: { x: 440, y: 220 }, data: { Sees: 'The real client IP when preservation is on' }, status: 'active' },
  ],
  edges: [
    { id: 'c1-lb', source: 'c1', target: 'nlb', edgeType: 'request', label: 'flow A' },
    { id: 'c2-lb', source: 'c2', target: 'nlb', edgeType: 'request', label: 'flow B' },
    { id: 'lb-t1', source: 'nlb', target: 't1', edgeType: 'request' },
    { id: 'lb-t2', source: 'nlb', target: 't2', edgeType: 'request' },
  ],
  states: [
    {
      id: 'hash',
      label: 'Hash the flow to a target',
      description:
        'Each connection is identified by its 5-tuple (source IP and port, destination IP and port, protocol). The load balancer hashes that tuple to pick a target, and pins the whole flow there. Flow A hashes to target-1; flow B hashes to target-2.',
      edgeOverrides: { 'c1-lb': { animated: true }, 'lb-t1': { flow: 'allow' }, 'c2-lb': { animated: true }, 'lb-t2': { flow: 'allow' } },
    },
    {
      id: 'sticky-flow',
      label: 'One flow stays on one target',
      description:
        'Every packet of flow A continues to target-1 for the life of the connection — the load balancer does not re-decide per packet. This is why a single long-lived connection cannot be spread across targets at Layer 4.',
      nodeOverrides: { t1: { status: 'active' } },
      edgeOverrides: { 'c1-lb': { animated: true }, 'lb-t1': { animated: true } },
    },
    {
      id: 'preserve-ip',
      label: 'Source IP preservation',
      description:
        'Because there is no proxy terminating the connection, the target can see the real client IP rather than the load balancer’s. This matters for logging, geo-rules, and allow-lists — but it has configuration constraints and differs by target type.',
      nodeOverrides: { t1: { data: { 'Client IP seen': '198.51.100.10 (preserved)' } }, t2: { data: { 'Client IP seen': '203.0.113.7 (preserved)' } } },
    },
    {
      id: 'tls',
      label: 'TLS passthrough or termination',
      description:
        'A Layer 4 load balancer can forward the encrypted bytes straight to the target (passthrough), which then terminates TLS — the balancer never sees plaintext. Or it can terminate TLS with a dedicated TLS listener. Either way it still cannot route by host or path, because that lives inside the request.',
    },
  ],
};
