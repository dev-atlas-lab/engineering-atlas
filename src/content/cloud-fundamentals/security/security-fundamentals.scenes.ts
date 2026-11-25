import type { SceneDefinition } from '../../../engines/visualization/types';

export const defenseInDepthScene: SceneDefinition = {
  id: 'defense-in-depth',
  type: 'topology',
  title: 'One attack, several layers',
  nodes: [
    { id: 'internet', type: 'client', label: 'Internet', position: { x: 200, y: 0 }, data: {} },
    { id: 'edge', type: 'firewall', label: 'Edge: WAF + DDoS protection', position: { x: 200, y: 110 }, data: { Layer: 'Perimeter', Stops: 'Floods and known malicious request patterns' }, status: 'active' },
    { id: 'web', type: 'server', label: 'Web tier', position: { x: 200, y: 220 }, data: { Layer: 'Compute and application', Identity: 'Managed identity with read access to one container' }, status: 'active' },
    { id: 'app', type: 'server', label: 'App tier', position: { x: 60, y: 340 }, data: { Layer: 'Network segmentation', Accepts: 'TCP 8080 from the web subnet only' }, status: 'active' },
    { id: 'db', type: 'database', label: 'Database (private endpoint)', position: { x: 340, y: 340 }, data: { Layer: 'Data', Accepts: 'Connections from the app subnet only', Encryption: 'TLS in transit; encrypted at rest' }, status: 'active' },
    { id: 'logs', type: 'storage', label: 'Central audit logs + alerts', position: { x: 60, y: 460 }, data: { Layer: 'Detection', Records: 'Control-plane operations, sign-ins, data access' }, status: 'active' },
    { id: 'idp', type: 'identity', label: 'Identity provider', position: { x: 340, y: 460 }, data: { Layer: 'Identity', Enforces: 'Phishing-resistant MFA and just-in-time admin access' }, status: 'active' },
  ],
  edges: [
    { id: 'i-e', source: 'internet', target: 'edge', edgeType: 'request', label: 'HTTPS' },
    { id: 'e-w', source: 'edge', target: 'web', edgeType: 'request' },
    { id: 'w-a', source: 'web', target: 'app', edgeType: 'request', label: '8080' },
    { id: 'w-d', source: 'web', target: 'db', edgeType: 'request' },
    { id: 'a-d', source: 'app', target: 'db', edgeType: 'data', label: 'SQL over TLS' },
    { id: 'a-l', source: 'app', target: 'logs', edgeType: 'dependency' },
    { id: 'd-i', source: 'db', target: 'idp', edgeType: 'dependency', label: 'Entra / IAM auth' },
  ],
  states: [
    {
      id: 'layers',
      label: 'Independent layers',
      description:
        'Defense in depth means no single control is trusted to stop everything. Each layer — perimeter, network, compute, application, identity, data, and detection — assumes the ones in front of it might fail. Select a node to see the layer it represents.',
    },
    {
      id: 'edge-blocks',
      label: 'The perimeter stops the common case',
      description:
        'An automated scanner sends a request carrying a well-known SQL injection pattern. The WAF’s managed rules recognise it and block it at the edge. Most opportunistic attacks end here — but a perimeter only recognises what it has rules for.',
      nodeOverrides: { edge: { data: { 'This request': 'Blocked by a managed rule' } } },
      edgeOverrides: { 'i-e': { animated: true, label: 'known injection pattern' } },
    },
    {
      id: 'web-compromised',
      label: 'Assume breach: the web tier falls',
      description:
        'A different payload exploits a bug the WAF has no rule for, and the attacker gains code execution on the web tier. Zero trust calls this “assume breach”: the design must limit what happens next.',
      nodeOverrides: { web: { status: 'error', label: 'Web tier · compromised' } },
      edgeOverrides: { 'i-e': { animated: true }, 'e-w': { animated: true, label: 'novel exploit' } },
    },
    {
      id: 'segmentation',
      label: 'Network and identity contain it',
      description:
        'From the web tier, the attacker tries the database directly. The database accepts connections only from the app subnet, so the attempt is denied. The web tier’s managed identity can read one storage container and nothing else, and there are no keys on disk to steal.',
      nodeOverrides: { web: { status: 'error', label: 'Web tier · compromised' }, db: { data: { 'From the web tier': 'Denied — not the app subnet' } } },
      edgeOverrides: { 'w-d': { flow: 'deny', label: 'denied: segmentation' } },
    },
    {
      id: 'detect',
      label: 'Detection and response',
      description:
        'The denied connections and the web tier’s unusual outbound calls appear in the central logs and trigger an alert. Responders isolate the VM, rotate anything it could reach, and patch the bug. Without this layer, the attacker could keep probing quietly for weeks.',
      nodeOverrides: { web: { status: 'error', label: 'Web tier · isolated' }, logs: { data: { Alert: 'Repeated denied connections from the web tier to the database' } } },
      edgeOverrides: { 'a-l': { animated: true, label: 'alert' } },
    },
  ],
};
