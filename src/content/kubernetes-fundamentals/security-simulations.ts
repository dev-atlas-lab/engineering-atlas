// Deterministic simulation engines for Slice 3C networking & security labs.
// Every engine is a pure function of (params, state) — no randomness,
// no wall-clock dependence — so same inputs always produce same outputs.

import type { SimulationDefinition } from '../../engines/simulation/types';

// ---------------------------------------------------------------------------
// Lab 1: CNI Networking Explorer
// ---------------------------------------------------------------------------
// Three nodes, two Pods per node. Models how packets flow for same-node
// vs cross-node traffic under three CNI dataplane styles: L2 bridge
// (unused at scale), VXLAN overlay, BGP route distribution.

export type CniMode = 'bridge' | 'vxlan' | 'bgp';

export interface CniPod {
  id: string;
  nodeId: string;
  ip: string;
}

export interface CniNode {
  id: string;
  hostIp: string;
  podCidr: string;
  bgpAdvertised: boolean;
  vxlanReachable: boolean;
}

export type HopKind = 'pod-netns' | 'veth' | 'cni-bridge' | 'host-stack' | 'vxlan-encap' | 'vxlan-decap' | 'bgp-route' | 'overlay-link' | 'remote-bridge' | 'dropped';

export interface PacketHop {
  at: string;
  kind: HopKind;
  detail: string;
}

export interface CniNetworkState {
  mode: CniMode;
  nodes: CniNode[];
  pods: CniPod[];
  source: string;
  destination: string;
  hops: PacketHop[];
  delivered: boolean;
  failureReason: string | null;
}

const CNI_NODES: CniNode[] = [
  { id: 'node-1', hostIp: '10.0.1.11', podCidr: '10.244.1.0/24', bgpAdvertised: true, vxlanReachable: true },
  { id: 'node-2', hostIp: '10.0.1.12', podCidr: '10.244.2.0/24', bgpAdvertised: true, vxlanReachable: true },
  { id: 'node-3', hostIp: '10.0.1.13', podCidr: '10.244.3.0/24', bgpAdvertised: true, vxlanReachable: true },
];

const CNI_PODS: CniPod[] = [
  { id: 'pod-a', nodeId: 'node-1', ip: '10.244.1.5' },
  { id: 'pod-b', nodeId: 'node-1', ip: '10.244.1.6' },
  { id: 'pod-c', nodeId: 'node-2', ip: '10.244.2.5' },
  { id: 'pod-d', nodeId: 'node-2', ip: '10.244.2.6' },
  { id: 'pod-e', nodeId: 'node-3', ip: '10.244.3.5' },
  { id: 'pod-f', nodeId: 'node-3', ip: '10.244.3.6' },
];

export function tracePacket(
  mode: CniMode,
  sourceId: string,
  destId: string,
  nodes: CniNode[],
  pods: CniPod[],
): { hops: PacketHop[]; delivered: boolean; failureReason: string | null } {
  const src = pods.find((p) => p.id === sourceId);
  const dst = pods.find((p) => p.id === destId);
  if (!src || !dst) {
    return { hops: [], delivered: false, failureReason: 'source or destination Pod not found' };
  }
  if (src.id === dst.id) {
    return { hops: [], delivered: false, failureReason: 'source and destination are the same Pod' };
  }

  const hops: PacketHop[] = [];
  hops.push({ at: src.id, kind: 'pod-netns', detail: `app writes to socket; packet leaves ${src.id} eth0 (${src.ip})` });
  hops.push({ at: src.nodeId, kind: 'veth', detail: `packet exits the Pod netns via veth pair into the host netns on ${src.nodeId}` });
  hops.push({ at: src.nodeId, kind: 'cni-bridge', detail: `host-side bridge (cni0) sees the packet; forwarding decision based on the destination IP` });

  if (src.nodeId === dst.nodeId) {
    hops.push({ at: dst.nodeId, kind: 'remote-bridge', detail: `destination is on the same node; bridge forwards directly to dst veth` });
    hops.push({ at: dst.id, kind: 'pod-netns', detail: `packet arrives in ${dst.id} netns at eth0 (${dst.ip})` });
    return { hops, delivered: true, failureReason: null };
  }

  const srcNode = nodes.find((n) => n.id === src.nodeId)!;
  const dstNode = nodes.find((n) => n.id === dst.nodeId)!;

  if (mode === 'bridge') {
    // Flat L2 bridge: cross-node only works if there's an underlying L2 fabric; we model this as always failing without an overlay or routing plane.
    hops.push({ at: srcNode.id, kind: 'dropped', detail: `no cross-node route exists (flat bridge mode has no fabric to reach ${dstNode.hostIp}); packet dropped` });
    return { hops, delivered: false, failureReason: 'bridge mode does not route cross-node traffic on its own' };
  }

  if (mode === 'vxlan') {
    if (!srcNode.vxlanReachable || !dstNode.vxlanReachable) {
      hops.push({ at: srcNode.id, kind: 'dropped', detail: `VXLAN tunnel endpoint on ${srcNode.vxlanReachable ? dstNode.id : srcNode.id} is unreachable` });
      return { hops, delivered: false, failureReason: 'VXLAN endpoint unreachable' };
    }
    hops.push({ at: srcNode.id, kind: 'vxlan-encap', detail: `host stack encapsulates the Pod packet in UDP/VXLAN; outer IP ${srcNode.hostIp} → ${dstNode.hostIp} (VNI 4096)` });
    hops.push({ at: 'underlay', kind: 'overlay-link', detail: `encapsulated packet is routed by the underlying network to ${dstNode.hostIp}` });
    hops.push({ at: dstNode.id, kind: 'vxlan-decap', detail: `${dstNode.id} VXLAN endpoint decapsulates; inner packet re-enters the host netns` });
  } else if (mode === 'bgp') {
    if (!srcNode.bgpAdvertised || !dstNode.bgpAdvertised) {
      hops.push({ at: srcNode.id, kind: 'dropped', detail: `BGP peering is not up on ${srcNode.bgpAdvertised ? dstNode.id : srcNode.id}; route to ${dst.ip} missing` });
      return { hops, delivered: false, failureReason: 'BGP peering down, route to Pod CIDR missing' };
    }
    hops.push({ at: srcNode.id, kind: 'bgp-route', detail: `kernel route lookup finds ${dstNode.podCidr} via ${dstNode.hostIp} (learned from BGP)` });
    hops.push({ at: 'underlay', kind: 'overlay-link', detail: `plain Pod packet (no encap) is routed by the underlying network to ${dstNode.hostIp}` });
  }

  hops.push({ at: dstNode.id, kind: 'cni-bridge', detail: `${dstNode.id} bridge forwards to the veth whose peer is ${dst.id}` });
  hops.push({ at: dst.id, kind: 'pod-netns', detail: `packet arrives in ${dst.id} netns at eth0 (${dst.ip})` });
  return { hops, delivered: true, failureReason: null };
}

export const cniNetworkingSimulation: SimulationDefinition<CniNetworkState> = {
  id: 'cni-networking-explorer',
  title: 'CNI Networking Explorer',
  description:
    'Trace a packet between two Pods under three CNI dataplane styles. Same-node always works; cross-node depends on the mode (bridge drops, VXLAN encapsulates, BGP routes natively).',
  parameters: [
    { key: 'mode', label: 'CNI dataplane', type: 'select', default: 'vxlan', options: [
      { label: 'Bridge (no cross-node)', value: 'bridge' },
      { label: 'VXLAN overlay (Flannel default, Calico option)', value: 'vxlan' },
      { label: 'BGP route distribution (Calico default, Cilium option)', value: 'bgp' },
    ], description: 'How Pod packets reach other nodes.' },
    { key: 'source', label: 'Source Pod', type: 'select', default: 'pod-a', options: CNI_PODS.map((p) => ({ label: `${p.id} (${p.ip} on ${p.nodeId})`, value: p.id })), description: 'The caller.' },
    { key: 'destination', label: 'Destination Pod', type: 'select', default: 'pod-c', options: CNI_PODS.map((p) => ({ label: `${p.id} (${p.ip} on ${p.nodeId})`, value: p.id })), description: 'The target.' },
    { key: 'breakRouting', label: 'Simulate routing failure on destination node', type: 'boolean', default: false, description: 'Removes the BGP peering / VXLAN reachability for the destination node.' },
  ],
  createInitialState: (params) => {
    const breakRouting = Boolean(params.breakRouting);
    const destId = String(params.destination);
    const destNode = CNI_PODS.find((p) => p.id === destId)?.nodeId;
    const nodes = CNI_NODES.map((n) => ({ ...n, bgpAdvertised: breakRouting && n.id === destNode ? false : n.bgpAdvertised, vxlanReachable: breakRouting && n.id === destNode ? false : n.vxlanReachable }));
    return {
      mode: String(params.mode) as CniMode,
      nodes,
      pods: CNI_PODS.map((p) => ({ ...p })),
      source: String(params.source),
      destination: destId,
      hops: [],
      delivered: false,
      failureReason: null,
    };
  },
  steps: () => [
    {
      id: 'trace',
      label: 'Trace the packet',
      description: 'Walk through each hop on the Pod-to-Pod path for the configured CNI dataplane.',
      apply: (s: CniNetworkState): CniNetworkState => {
        const { hops, delivered, failureReason } = tracePacket(s.mode, s.source, s.destination, s.nodes, s.pods);
        return { ...s, hops, delivered, failureReason };
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Lab 2: Ingress Traffic Routing Simulator
// ---------------------------------------------------------------------------

export interface IngressRule {
  host: string | null; // null = match any host
  path: string;
  pathType: 'Exact' | 'Prefix';
  backendService: string;
  backendPort: number;
}

export interface IngressBackend {
  service: string;
  healthy: boolean;
  tls: boolean;
}

export interface IngressRequest {
  scheme: 'http' | 'https';
  host: string;
  path: string;
}

export interface IngressDecision {
  matched: boolean;
  rule?: IngressRule;
  backendHealthy: boolean;
  responseCode: number;
  reason: string;
  tlsTerminated: boolean;
}

export interface IngressState {
  tlsEnabled: boolean;
  rules: IngressRule[];
  backends: IngressBackend[];
  request: IngressRequest;
  decision: IngressDecision | null;
}

const DEFAULT_RULES: IngressRule[] = [
  { host: 'shop.example.com', path: '/api', pathType: 'Prefix', backendService: 'api', backendPort: 8080 },
  { host: 'shop.example.com', path: '/', pathType: 'Prefix', backendService: 'web', backendPort: 80 },
  { host: 'admin.example.com', path: '/', pathType: 'Prefix', backendService: 'admin', backendPort: 8080 },
];

const DEFAULT_BACKENDS: IngressBackend[] = [
  { service: 'api', healthy: true, tls: false },
  { service: 'web', healthy: true, tls: false },
  { service: 'admin', healthy: true, tls: false },
];

export function routeRequest(rules: IngressRule[], backends: IngressBackend[], request: IngressRequest, tlsEnabled: boolean): IngressDecision {
  if (request.scheme === 'https' && !tlsEnabled) {
    return { matched: false, backendHealthy: false, responseCode: 421, reason: 'TLS requested but controller has no certificate for this host', tlsTerminated: false };
  }
  // Longest-prefix-wins for Prefix matches; Exact wins over Prefix on a tie.
  const candidates = rules
    .filter((r) => r.host === null || r.host === request.host)
    .filter((r) => (r.pathType === 'Exact' ? r.path === request.path : request.path.startsWith(r.path)))
    .sort((a, b) => {
      if (a.pathType === 'Exact' && b.pathType !== 'Exact') return -1;
      if (b.pathType === 'Exact' && a.pathType !== 'Exact') return 1;
      return b.path.length - a.path.length;
    });
  const rule = candidates[0];
  if (!rule) {
    return { matched: false, backendHealthy: false, responseCode: 404, reason: `no rule matched host=${request.host} path=${request.path}`, tlsTerminated: tlsEnabled && request.scheme === 'https' };
  }
  const backend = backends.find((b) => b.service === rule.backendService);
  if (!backend) {
    return { matched: true, rule, backendHealthy: false, responseCode: 503, reason: `backend Service "${rule.backendService}" does not exist`, tlsTerminated: tlsEnabled && request.scheme === 'https' };
  }
  if (!backend.healthy) {
    return { matched: true, rule, backendHealthy: false, responseCode: 502, reason: `backend "${rule.backendService}" has no Ready endpoints`, tlsTerminated: tlsEnabled && request.scheme === 'https' };
  }
  return {
    matched: true,
    rule,
    backendHealthy: true,
    responseCode: 200,
    reason: `routed to Service ${rule.backendService}:${rule.backendPort}`,
    tlsTerminated: tlsEnabled && request.scheme === 'https',
  };
}

export const ingressRoutingSimulation: SimulationDefinition<IngressState> = {
  id: 'ingress-routing-simulator',
  title: 'Ingress Traffic Routing Simulator',
  description:
    'Submit HTTP/HTTPS requests to a shared Ingress controller with host and path rules. Models longest-prefix matching, TLS termination, missing rules, and unhealthy backends.',
  parameters: [
    { key: 'scheme', label: 'Scheme', type: 'select', default: 'https', options: [
      { label: 'http', value: 'http' }, { label: 'https', value: 'https' },
    ], description: 'Protocol used by the simulated request.' },
    { key: 'host', label: 'Host header', type: 'select', default: 'shop.example.com', options: [
      { label: 'shop.example.com', value: 'shop.example.com' },
      { label: 'admin.example.com', value: 'admin.example.com' },
      { label: 'other.example.com (no rule)', value: 'other.example.com' },
    ], description: 'HTTP Host header.' },
    { key: 'path', label: 'Path', type: 'select', default: '/api/orders', options: [
      { label: '/api/orders', value: '/api/orders' },
      { label: '/api', value: '/api' },
      { label: '/products', value: '/products' },
      { label: '/', value: '/' },
    ], description: 'HTTP path.' },
    { key: 'tlsEnabled', label: 'TLS certificate configured', type: 'boolean', default: true, description: 'Whether the Ingress controller has a cert for this host.' },
    { key: 'apiBackendHealthy', label: 'api backend has Ready endpoints', type: 'boolean', default: true, description: 'Simulate the api Service losing its endpoints.' },
    { key: 'adminBackendExists', label: 'admin backend Service exists', type: 'boolean', default: true, description: 'Simulate the rule pointing at a missing Service.' },
  ],
  createInitialState: (params) => ({
    tlsEnabled: Boolean(params.tlsEnabled),
    rules: DEFAULT_RULES.map((r) => ({ ...r })),
    backends: DEFAULT_BACKENDS.map((b) => ({
      ...b,
      healthy: b.service === 'api' ? Boolean(params.apiBackendHealthy) : b.healthy,
    })).filter((b) => (b.service === 'admin' ? Boolean(params.adminBackendExists) : true)),
    request: {
      scheme: String(params.scheme) as 'http' | 'https',
      host: String(params.host),
      path: String(params.path),
    },
    decision: null,
  }),
  steps: () => [
    {
      id: 'match',
      label: 'Match the request against Ingress rules',
      description: 'Longest-prefix wins; Exact beats Prefix on ties; host filter runs first.',
      apply: (s) => ({ ...s, decision: routeRequest(s.rules, s.backends, s.request, s.tlsEnabled) }),
    },
  ],
};

// ---------------------------------------------------------------------------
// Lab 3: NetworkPolicy Simulator
// ---------------------------------------------------------------------------

export interface NpPod {
  id: string;
  namespace: string;
  labels: Record<string, string>;
}

export type NpDirection = 'ingress' | 'egress';

export interface NpPeerSelector {
  namespaceLabels?: Record<string, string>;
  podLabels?: Record<string, string>;
}

export interface NpRule {
  from?: NpPeerSelector;
  to?: NpPeerSelector;
  // ports omitted for simplicity; ports are a conjunction with the peer, not a separate axis.
}

export interface NetworkPolicy {
  id: string;
  namespace: string;
  podSelector: Record<string, string>;
  policyTypes: NpDirection[];
  ingress: NpRule[];
  egress: NpRule[];
}

export interface NsLabels {
  name: string;
  labels: Record<string, string>;
}

export interface NpState {
  pods: NpPod[];
  namespaces: NsLabels[];
  policies: NetworkPolicy[];
  source: string;
  destination: string;
  decision: { allowed: boolean; reason: string; matchedPolicies: string[] } | null;
}

export function labelsMatch(selector: Record<string, string>, labels: Record<string, string>): boolean {
  return Object.entries(selector).every(([k, v]) => labels[k] === v);
}

export function peerMatches(peer: NpPeerSelector | undefined, pod: NpPod, nsLabels: Record<string, string>): boolean {
  if (!peer) return true; // empty peer = match anything in this rule's scope
  if (peer.namespaceLabels && !labelsMatch(peer.namespaceLabels, nsLabels)) return false;
  if (peer.podLabels && !labelsMatch(peer.podLabels, pod.labels)) return false;
  return true;
}

export interface NpEvaluationOptions {
  source: NpPod;
  destination: NpPod;
  policies: NetworkPolicy[];
  namespaces: NsLabels[];
}

export function evaluateConnectivity(opts: NpEvaluationOptions): { allowed: boolean; reason: string; matchedPolicies: string[] } {
  const { source, destination, policies, namespaces } = opts;
  const srcNsLabels = namespaces.find((n) => n.name === source.namespace)?.labels ?? {};
  const dstNsLabels = namespaces.find((n) => n.name === destination.namespace)?.labels ?? {};

  // Find policies that select the source (for egress) and the destination (for ingress).
  const srcPolicies = policies.filter(
    (p) => p.namespace === source.namespace && labelsMatch(p.podSelector, source.labels) && p.policyTypes.includes('egress'),
  );
  const dstPolicies = policies.filter(
    (p) => p.namespace === destination.namespace && labelsMatch(p.podSelector, destination.labels) && p.policyTypes.includes('ingress'),
  );

  // Egress evaluation
  const matched: string[] = [];
  if (srcPolicies.length > 0) {
    const egressAllowed = srcPolicies.some((p) => {
      const ok = p.egress.some((r) => peerMatches(r.to, destination, dstNsLabels));
      if (ok) matched.push(p.id);
      return ok;
    });
    if (!egressAllowed) {
      return { allowed: false, reason: `egress denied at source — a policy selects ${source.id} but no "to" rule matches ${destination.namespace}/${destination.id}`, matchedPolicies: srcPolicies.map((p) => p.id) };
    }
  }
  // Ingress evaluation
  if (dstPolicies.length > 0) {
    const ingressAllowed = dstPolicies.some((p) => {
      const ok = p.ingress.some((r) => peerMatches(r.from, source, srcNsLabels));
      if (ok) matched.push(p.id);
      return ok;
    });
    if (!ingressAllowed) {
      return { allowed: false, reason: `ingress denied at destination — a policy selects ${destination.id} but no "from" rule matches ${source.namespace}/${source.id}`, matchedPolicies: dstPolicies.map((p) => p.id) };
    }
  }
  if (srcPolicies.length === 0 && dstPolicies.length === 0) {
    return { allowed: true, reason: 'no NetworkPolicy selects either Pod — traffic flows unrestricted (the Kubernetes default)', matchedPolicies: [] };
  }
  return { allowed: true, reason: `both directions allowed — ${matched.length > 0 ? `matched policies: ${matched.join(', ')}` : 'no selecting policies'}`, matchedPolicies: matched };
}

const NP_PODS: NpPod[] = [
  { id: 'web', namespace: 'frontend', labels: { app: 'web', tier: 'frontend' } },
  { id: 'api', namespace: 'backend', labels: { app: 'api', tier: 'backend' } },
  { id: 'db', namespace: 'backend', labels: { app: 'postgres', tier: 'data' } },
  { id: 'analytics', namespace: 'analytics', labels: { app: 'analytics' } },
];

const NP_NAMESPACES: NsLabels[] = [
  { name: 'frontend', labels: { env: 'prod', tier: 'frontend' } },
  { name: 'backend', labels: { env: 'prod', tier: 'backend' } },
  { name: 'analytics', labels: { env: 'prod', tier: 'analytics' } },
];

function makePolicies(scenario: string): NetworkPolicy[] {
  switch (scenario) {
    case 'none':
      return [];
    case 'default-deny':
      return [
        { id: 'default-deny-ingress', namespace: 'backend', podSelector: {}, policyTypes: ['ingress'], ingress: [], egress: [] },
      ];
    case 'allow-frontend':
      return [
        { id: 'default-deny-ingress', namespace: 'backend', podSelector: {}, policyTypes: ['ingress'], ingress: [], egress: [] },
        {
          id: 'allow-frontend-to-api',
          namespace: 'backend',
          podSelector: { app: 'api' },
          policyTypes: ['ingress'],
          ingress: [{ from: { namespaceLabels: { tier: 'frontend' }, podLabels: { app: 'web' } } }],
          egress: [],
        },
      ];
    case 'restrict-egress':
      return [
        {
          id: 'web-egress-restricted',
          namespace: 'frontend',
          podSelector: { app: 'web' },
          policyTypes: ['egress'],
          ingress: [],
          egress: [{ to: { podLabels: { app: 'api' } } }],
        },
      ];
    default:
      return [];
  }
}

export const networkPolicySimulation: SimulationDefinition<NpState> = {
  id: 'networkpolicy-simulator',
  title: 'NetworkPolicy Simulator',
  description:
    'Four Pods across three namespaces; apply a policy scenario and send a request between them. Shows additive semantics, default deny, and how policy selection works.',
  parameters: [
    { key: 'scenario', label: 'Policy scenario', type: 'select', default: 'allow-frontend', options: [
      { label: 'No policies (default allow-all)', value: 'none' },
      { label: 'Default-deny ingress on backend', value: 'default-deny' },
      { label: 'Default-deny plus allow web → api', value: 'allow-frontend' },
      { label: 'Egress-only restriction on web (web may only reach api)', value: 'restrict-egress' },
    ], description: 'Which policies are installed before sending the request.' },
    { key: 'source', label: 'Source Pod', type: 'select', default: 'web', options: NP_PODS.map((p) => ({ label: `${p.namespace}/${p.id}`, value: p.id })), description: 'Caller.' },
    { key: 'destination', label: 'Destination Pod', type: 'select', default: 'api', options: NP_PODS.map((p) => ({ label: `${p.namespace}/${p.id}`, value: p.id })), description: 'Target.' },
  ],
  createInitialState: (params) => ({
    pods: NP_PODS.map((p) => ({ ...p })),
    namespaces: NP_NAMESPACES.map((n) => ({ ...n })),
    policies: makePolicies(String(params.scenario)),
    source: String(params.source),
    destination: String(params.destination),
    decision: null,
  }),
  steps: () => [
    {
      id: 'evaluate',
      label: 'Evaluate the request',
      description: 'Apply ingress and egress policies additively and reach a verdict.',
      apply: (s: NpState): NpState => {
        const src = s.pods.find((p) => p.id === s.source)!;
        const dst = s.pods.find((p) => p.id === s.destination)!;
        return { ...s, decision: evaluateConnectivity({ source: src, destination: dst, policies: s.policies, namespaces: s.namespaces }) };
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Lab 4: RBAC Permission Simulator
// ---------------------------------------------------------------------------

export type RbacVerb = 'get' | 'list' | 'watch' | 'create' | 'update' | 'patch' | 'delete';

export interface RbacRule {
  apiGroups: string[];      // "" for core, "apps", "rbac.authorization.k8s.io"
  resources: string[];       // "pods", "deployments", "*"
  resourceNames?: string[];  // optional whitelist by object name
  verbs: RbacVerb[];
}

export interface RbacRole {
  name: string;
  namespace: string | null; // null = ClusterRole
  rules: RbacRule[];
  aggregationLabel?: string;
}

export interface RbacBindingSubject {
  kind: 'User' | 'Group' | 'ServiceAccount';
  name: string;
  namespace?: string; // required for ServiceAccount
}

export interface RbacBinding {
  name: string;
  namespace: string | null; // null = ClusterRoleBinding
  roleRef: { kind: 'Role' | 'ClusterRole'; name: string };
  subjects: RbacBindingSubject[];
}

export interface RbacRequest {
  subject: RbacBindingSubject;
  namespace: string | null; // null for cluster-scoped request
  apiGroup: string;
  resource: string;
  resourceName?: string;
  verb: RbacVerb;
}

export interface RbacDecision {
  allowed: boolean;
  reason: string;
  matchedBinding: string | null;
  matchedRole: string | null;
  matchedRule: number | null;
}

export interface RbacState {
  roles: RbacRole[];
  bindings: RbacBinding[];
  request: RbacRequest;
  decision: RbacDecision | null;
}

function ruleMatches(rule: RbacRule, req: RbacRequest): boolean {
  const groupOk = rule.apiGroups.includes(req.apiGroup) || rule.apiGroups.includes('*');
  if (!groupOk) return false;
  const resourceOk = rule.resources.includes(req.resource) || rule.resources.includes('*');
  if (!resourceOk) return false;
  if (rule.resourceNames && rule.resourceNames.length > 0) {
    if (!req.resourceName) return false;
    if (!rule.resourceNames.includes(req.resourceName)) return false;
  }
  const verbOk = rule.verbs.includes(req.verb) || rule.verbs.includes('*' as RbacVerb);
  return verbOk;
}

function subjectMatches(subject: RbacBindingSubject, req: RbacRequest): boolean {
  if (subject.kind !== req.subject.kind || subject.name !== req.subject.name) return false;
  if (subject.kind === 'ServiceAccount' && subject.namespace !== req.subject.namespace) return false;
  return true;
}

export function evaluateRbac(roles: RbacRole[], bindings: RbacBinding[], req: RbacRequest): RbacDecision {
  for (const binding of bindings) {
    // RoleBinding (namespaced) can only grant in its namespace.
    if (binding.namespace !== null && binding.namespace !== req.namespace) continue;
    if (!binding.subjects.some((s) => subjectMatches(s, req))) continue;
    const role = roles.find((r) => r.name === binding.roleRef.name && (binding.roleRef.kind === 'ClusterRole' ? r.namespace === null : r.namespace === binding.namespace));
    if (!role) continue;
    for (let i = 0; i < role.rules.length; i += 1) {
      if (ruleMatches(role.rules[i]!, req)) {
        return {
          allowed: true,
          reason: `allowed by ${binding.roleRef.kind} ${role.name} via ${binding.namespace === null ? 'ClusterRoleBinding' : 'RoleBinding'} ${binding.name}`,
          matchedBinding: binding.name,
          matchedRole: role.name,
          matchedRule: i,
        };
      }
    }
  }
  return { allowed: false, reason: 'no binding grants this verb on this resource for this subject (forbidden)', matchedBinding: null, matchedRole: null, matchedRule: null };
}

const DEFAULT_ROLES: RbacRole[] = [
  {
    name: 'pod-reader',
    namespace: 'team-a',
    rules: [{ apiGroups: [''], resources: ['pods'], verbs: ['get', 'list', 'watch'] }],
  },
  {
    name: 'deploy-manager',
    namespace: 'team-a',
    rules: [
      { apiGroups: ['apps'], resources: ['deployments'], verbs: ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete'] },
      { apiGroups: [''], resources: ['pods'], verbs: ['get', 'list', 'watch'] },
    ],
  },
  {
    name: 'view',
    namespace: null,
    rules: [
      { apiGroups: ['*'], resources: ['*'], verbs: ['get', 'list', 'watch'] },
    ],
  },
  {
    name: 'cluster-admin',
    namespace: null,
    rules: [{ apiGroups: ['*'], resources: ['*'], verbs: ['*' as RbacVerb] }],
  },
];

const DEFAULT_BINDINGS: RbacBinding[] = [
  { name: 'alice-pod-reader', namespace: 'team-a', roleRef: { kind: 'Role', name: 'pod-reader' }, subjects: [{ kind: 'User', name: 'alice' }] },
  { name: 'bob-deployer', namespace: 'team-a', roleRef: { kind: 'Role', name: 'deploy-manager' }, subjects: [{ kind: 'User', name: 'bob' }] },
  { name: 'ci-sa-view', namespace: null, roleRef: { kind: 'ClusterRole', name: 'view' }, subjects: [{ kind: 'ServiceAccount', name: 'ci', namespace: 'tooling' }] },
  { name: 'operators-admin', namespace: null, roleRef: { kind: 'ClusterRole', name: 'cluster-admin' }, subjects: [{ kind: 'Group', name: 'platform-ops' }] },
];

export const rbacPermissionSimulation: SimulationDefinition<RbacState> = {
  id: 'rbac-permission-simulator',
  title: 'RBAC Permission Simulator',
  description:
    'Model a small cluster with four Roles/ClusterRoles and four bindings. Submit a request as a User, Group, or ServiceAccount and see which binding grants (or denies) it.',
  parameters: [
    { key: 'subjectKind', label: 'Subject kind', type: 'select', default: 'User', options: [
      { label: 'User (alice, bob, carol)', value: 'User' },
      { label: 'Group (platform-ops, dev)', value: 'Group' },
      { label: 'ServiceAccount (tooling/ci, team-a/app-sa)', value: 'ServiceAccount' },
    ], description: 'The subject type the request authenticates as.' },
    { key: 'subjectName', label: 'Subject name', type: 'select', default: 'alice', options: [
      { label: 'alice', value: 'alice' }, { label: 'bob', value: 'bob' }, { label: 'carol (no bindings)', value: 'carol' },
      { label: 'platform-ops', value: 'platform-ops' }, { label: 'dev', value: 'dev' },
      { label: 'ci (tooling)', value: 'ci' }, { label: 'app-sa (team-a)', value: 'app-sa' },
    ], description: 'The subject name.' },
    { key: 'subjectNamespace', label: 'ServiceAccount namespace (only for SA)', type: 'select', default: 'tooling', options: [
      { label: 'tooling', value: 'tooling' }, { label: 'team-a', value: 'team-a' }, { label: 'team-b', value: 'team-b' },
    ], description: 'Namespace for the ServiceAccount; ignored for User/Group.' },
    { key: 'verb', label: 'Verb', type: 'select', default: 'get', options: [
      { label: 'get', value: 'get' }, { label: 'list', value: 'list' }, { label: 'create', value: 'create' },
      { label: 'update', value: 'update' }, { label: 'delete', value: 'delete' }, { label: 'patch', value: 'patch' },
    ], description: 'HTTP verb equivalent.' },
    { key: 'resource', label: 'Resource', type: 'select', default: 'pods', options: [
      { label: 'pods (core)', value: 'pods' },
      { label: 'deployments (apps)', value: 'deployments' },
      { label: 'secrets (core)', value: 'secrets' },
      { label: 'nodes (core, cluster-scoped)', value: 'nodes' },
    ], description: 'The target resource.' },
    { key: 'namespace', label: 'Target namespace', type: 'select', default: 'team-a', options: [
      { label: 'team-a', value: 'team-a' }, { label: 'team-b', value: 'team-b' }, { label: 'tooling', value: 'tooling' }, { label: '(cluster-scoped)', value: '' },
    ], description: 'Namespace of the target object (empty = cluster-scoped request).' },
  ],
  createInitialState: (params) => {
    const subjectKind = String(params.subjectKind) as 'User' | 'Group' | 'ServiceAccount';
    const req: RbacRequest = {
      subject: {
        kind: subjectKind,
        name: String(params.subjectName),
        ...(subjectKind === 'ServiceAccount' ? { namespace: String(params.subjectNamespace) } : {}),
      },
      verb: String(params.verb) as RbacVerb,
      resource: String(params.resource),
      apiGroup: String(params.resource) === 'deployments' ? 'apps' : '',
      namespace: String(params.namespace) === '' ? null : String(params.namespace),
    };
    return {
      roles: DEFAULT_ROLES.map((r) => ({ ...r, rules: r.rules.map((rule) => ({ ...rule })) })),
      bindings: DEFAULT_BINDINGS.map((b) => ({ ...b, subjects: b.subjects.map((s) => ({ ...s })) })),
      request: req,
      decision: null,
    };
  },
  steps: () => [
    {
      id: 'authorize',
      label: 'Authorize the request',
      description: 'Scan every binding: filter by namespace scope, match subject, look up the role, check each rule.',
      apply: (s) => ({ ...s, decision: evaluateRbac(s.roles, s.bindings, s.request) }),
    },
  ],
};

// ---------------------------------------------------------------------------
// Lab 5: Workload Security Simulator
// ---------------------------------------------------------------------------

export interface SecurityContext {
  runAsUser: number | null;    // null = container's default (often 0)
  runAsNonRoot: boolean;
  readOnlyRootFilesystem: boolean;
  allowPrivilegeEscalation: boolean;
  privileged: boolean;
  capabilitiesAdd: string[];
  capabilitiesDrop: string[];
  seccompProfile: 'unconfined' | 'runtime/default' | 'localhost';
}

export interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  detail: string;
}

export interface WorkloadSecurityState {
  ctx: SecurityContext;
  admissionProfile: 'privileged' | 'baseline' | 'restricted';
  findings: SecurityFinding[];
  admissionAllowed: boolean;
  admissionReason: string;
}

export function evaluateWorkloadSecurity(ctx: SecurityContext): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  if (ctx.privileged) {
    findings.push({ id: 'privileged', severity: 'critical', title: 'Container runs privileged',
      detail: 'privileged: true disables almost all isolation. The container shares the host namespace capabilities and can access host devices. Treat as equivalent to running the process directly on the node as root.' });
  }
  if (ctx.runAsUser === 0 && !ctx.runAsNonRoot) {
    findings.push({ id: 'root', severity: 'high', title: 'Container runs as UID 0',
      detail: 'Any process starting as UID 0 in the container can write to volumes it mounts as root, exploit kernel bugs more easily, and (with privilege escalation on) escape the container with fewer prerequisites.' });
  }
  if (ctx.runAsNonRoot && ctx.runAsUser === 0) {
    findings.push({ id: 'conflict', severity: 'medium', title: 'runAsNonRoot set but runAsUser is 0',
      detail: 'The kubelet will refuse to start the container — runAsNonRoot is enforced before the image\'s own USER directive and this conflict is a hard failure.' });
  }
  if (ctx.allowPrivilegeEscalation) {
    findings.push({ id: 'escalation', severity: 'high', title: 'Privilege escalation permitted',
      detail: 'allowPrivilegeEscalation: true leaves the no_new_privs kernel flag off, so setuid binaries can elevate. Setting false is almost always safe and should be the default.' });
  }
  if (!ctx.readOnlyRootFilesystem) {
    findings.push({ id: 'rwrootfs', severity: 'medium', title: 'Root filesystem is writable',
      detail: 'A read-write rootfs lets compromised code modify binaries, drop persistence, or write exploits. Mount writable paths as emptyDir volumes instead; the rest should be read-only.' });
  }
  const dangerousCaps = ctx.capabilitiesAdd.filter((c) => ['NET_ADMIN', 'SYS_ADMIN', 'SYS_PTRACE', 'SYS_MODULE', 'DAC_READ_SEARCH', 'DAC_OVERRIDE'].includes(c.toUpperCase()));
  if (dangerousCaps.length > 0) {
    findings.push({ id: 'caps-add', severity: 'high', title: `Dangerous capabilities added: ${dangerousCaps.join(', ')}`,
      detail: 'SYS_ADMIN alone covers most container-escape tactics. Add capabilities only when the application genuinely needs them, and prefer dropping ALL first.' });
  }
  if (!ctx.capabilitiesDrop.map((c) => c.toUpperCase()).includes('ALL')) {
    findings.push({ id: 'caps-drop', severity: 'low', title: 'Default capability set not dropped',
      detail: 'Containers start with a nontrivial Linux capability set (NET_BIND_SERVICE, CHOWN, SETUID, KILL, …). Drop ALL and add back only what you need.' });
  }
  if (ctx.seccompProfile === 'unconfined') {
    findings.push({ id: 'seccomp', severity: 'medium', title: 'seccomp unconfined',
      detail: 'Without a seccomp profile, all syscalls are permitted. The runtime/default profile blocks ~44 dangerous syscalls (keyctl, mount, umount, …) and breaks virtually nothing.' });
  }
  if (findings.length === 0) {
    findings.push({ id: 'ok', severity: 'info', title: 'No findings', detail: 'Configuration follows the restricted Pod Security Standard baseline.' });
  }
  return findings;
}

export function admissionForProfile(ctx: SecurityContext, profile: 'privileged' | 'baseline' | 'restricted'): { allowed: boolean; reason: string } {
  if (profile === 'privileged') {
    return { allowed: true, reason: 'privileged profile allows any configuration (used for system Pods only)' };
  }
  if (profile === 'baseline') {
    if (ctx.privileged) return { allowed: false, reason: 'baseline forbids privileged: true' };
    if (ctx.capabilitiesAdd.map((c) => c.toUpperCase()).some((c) => c === 'SYS_ADMIN' || c === 'SYS_MODULE' || c === 'SYS_RAWIO')) {
      return { allowed: false, reason: 'baseline forbids adding SYS_ADMIN, SYS_MODULE, SYS_RAWIO' };
    }
    return { allowed: true, reason: 'baseline accepts this configuration' };
  }
  // restricted
  if (ctx.privileged) return { allowed: false, reason: 'restricted forbids privileged: true' };
  if (ctx.allowPrivilegeEscalation) return { allowed: false, reason: 'restricted requires allowPrivilegeEscalation: false' };
  if (!ctx.runAsNonRoot) return { allowed: false, reason: 'restricted requires runAsNonRoot: true' };
  if (!ctx.capabilitiesDrop.map((c) => c.toUpperCase()).includes('ALL')) {
    return { allowed: false, reason: 'restricted requires capabilities.drop to include "ALL"' };
  }
  if (ctx.capabilitiesAdd.length > 1 || (ctx.capabilitiesAdd.length === 1 && ctx.capabilitiesAdd[0]!.toUpperCase() !== 'NET_BIND_SERVICE')) {
    return { allowed: false, reason: 'restricted only permits adding NET_BIND_SERVICE' };
  }
  if (ctx.seccompProfile === 'unconfined') {
    return { allowed: false, reason: 'restricted requires a seccomp profile (runtime/default or localhost)' };
  }
  return { allowed: true, reason: 'restricted profile accepts this configuration' };
}

export const workloadSecuritySimulation: SimulationDefinition<WorkloadSecurityState> = {
  id: 'workload-security-simulator',
  title: 'Workload Security Simulator',
  description:
    'Configure a Pod security context and see what findings a baseline scan reports and whether the Pod would be admitted under the three Pod Security Standards profiles.',
  parameters: [
    { key: 'runAsUser', label: 'runAsUser', type: 'select', default: 1000, options: [
      { label: '0 (root)', value: 0 }, { label: '1000', value: 1000 }, { label: '65534 (nobody)', value: 65534 },
    ], description: 'UID the container process runs as.' },
    { key: 'runAsNonRoot', label: 'runAsNonRoot', type: 'boolean', default: true, description: 'Reject the Pod at kubelet if the container tries to start as UID 0.' },
    { key: 'readOnlyRootFilesystem', label: 'readOnlyRootFilesystem', type: 'boolean', default: true, description: 'Mount the container rootfs read-only.' },
    { key: 'allowPrivilegeEscalation', label: 'allowPrivilegeEscalation', type: 'boolean', default: false, description: 'Permit setuid-style elevation inside the container.' },
    { key: 'privileged', label: 'privileged', type: 'boolean', default: false, description: 'Disable almost all isolation. For system components only.' },
    { key: 'dropAll', label: 'capabilities.drop includes ALL', type: 'boolean', default: true, description: 'Drop the default Linux capability set.' },
    { key: 'addNetAdmin', label: 'Add NET_ADMIN capability', type: 'boolean', default: false, description: 'Permits network configuration — dangerous.' },
    { key: 'addSysAdmin', label: 'Add SYS_ADMIN capability', type: 'boolean', default: false, description: 'Covers most escape primitives — effectively root.' },
    { key: 'seccomp', label: 'seccompProfile', type: 'select', default: 'runtime/default', options: [
      { label: 'unconfined', value: 'unconfined' },
      { label: 'runtime/default', value: 'runtime/default' },
      { label: 'localhost (custom)', value: 'localhost' },
    ], description: 'seccomp filter applied to syscalls.' },
    { key: 'admissionProfile', label: 'Pod Security Admission profile', type: 'select', default: 'restricted', options: [
      { label: 'privileged', value: 'privileged' }, { label: 'baseline', value: 'baseline' }, { label: 'restricted', value: 'restricted' },
    ], description: 'The namespace-level PSA profile this Pod is admitted against.' },
  ],
  createInitialState: (params) => {
    const ctx: SecurityContext = {
      runAsUser: Number(params.runAsUser),
      runAsNonRoot: Boolean(params.runAsNonRoot),
      readOnlyRootFilesystem: Boolean(params.readOnlyRootFilesystem),
      allowPrivilegeEscalation: Boolean(params.allowPrivilegeEscalation),
      privileged: Boolean(params.privileged),
      capabilitiesAdd: [
        ...(params.addNetAdmin ? ['NET_ADMIN'] : []),
        ...(params.addSysAdmin ? ['SYS_ADMIN'] : []),
      ],
      capabilitiesDrop: params.dropAll ? ['ALL'] : [],
      seccompProfile: String(params.seccomp) as SecurityContext['seccompProfile'],
    };
    return {
      ctx,
      admissionProfile: String(params.admissionProfile) as WorkloadSecurityState['admissionProfile'],
      findings: [],
      admissionAllowed: false,
      admissionReason: '',
    };
  },
  steps: () => [
    {
      id: 'scan',
      label: 'Scan the security context',
      description: 'Collect findings against a restricted baseline.',
      apply: (s) => ({ ...s, findings: evaluateWorkloadSecurity(s.ctx) }),
    },
    {
      id: 'admit',
      label: 'Simulate Pod Security Admission',
      description: 'Decide whether the configured profile (privileged / baseline / restricted) would admit this Pod.',
      apply: (s) => {
        const { allowed, reason } = admissionForProfile(s.ctx, s.admissionProfile);
        return { ...s, admissionAllowed: allowed, admissionReason: reason };
      },
    },
  ],
};
