// SVG scene definitions for Slice 3C networking & security concepts.
// All scenes compose through the existing SceneDefinition primitives.

import type { SceneDefinition } from '../../engines/visualization/types';

// --- 1. CNI Pod Networking Lifecycle --------------------------------------

export const cniLifecycleScene: SceneDefinition = {
  id: 'k8s-cni-lifecycle',
  type: 'topology',
  title: 'How a Pod gets a network',
  description: 'When a Pod lands on a node, the kubelet invokes the CNI plugin, which allocates an IP, creates a veth pair, and joins it to the Pod netns.',
  nodes: [
    { id: 'kubelet', type: 'server', label: 'kubelet', position: { x: 60, y: 180 }, data: { Does: 'Invokes CNI on Pod sandbox create/delete' }, status: 'active' },
    { id: 'cni-plugin', type: 'policy', label: 'CNI plugin', position: { x: 300, y: 80 }, data: { ABI: 'ADD / DEL / CHECK / VERSION' } },
    { id: 'ipam', type: 'policy', label: 'IPAM', position: { x: 300, y: 180 }, data: { Does: 'Allocates one IP from the node podCIDR or pool' } },
    { id: 'netns', type: 'host', label: 'Pod netns', position: { x: 540, y: 80 }, data: { Content: 'eth0 (one end of veth), lo' }, status: 'active' },
    { id: 'veth', type: 'network', label: 'veth pair', position: { x: 540, y: 200 }, data: { Does: 'One end in Pod netns, other in host netns' } },
    { id: 'bridge', type: 'network', label: 'Host bridge (cni0)', position: { x: 540, y: 320 }, data: { Does: 'Forwards between veths and host stack' } },
    { id: 'routes', type: 'policy', label: 'Node routes', position: { x: 780, y: 320 }, data: { Does: 'Routes for other nodes\' Pod CIDRs' } },
  ],
  edges: [
    { id: 'kubelet-cni', source: 'kubelet', target: 'cni-plugin', edgeType: 'request', label: 'ADD(container, netns, args)' },
    { id: 'cni-ipam', source: 'cni-plugin', target: 'ipam', edgeType: 'request', label: 'allocate IP' },
    { id: 'cni-netns', source: 'cni-plugin', target: 'netns', edgeType: 'dependency', label: 'create eth0' },
    { id: 'netns-veth', source: 'netns', target: 'veth', edgeType: 'data', label: 'one end' },
    { id: 'veth-bridge', source: 'veth', target: 'bridge', edgeType: 'data', label: 'other end' },
    { id: 'bridge-routes', source: 'bridge', target: 'routes', edgeType: 'dependency', label: 'uplink' },
  ],
  states: [
    {
      id: 'overview',
      label: 'ADD: give the Pod a network',
      description: 'ADD runs once per container sandbox. The plugin calls IPAM for an address, creates the veth pair, moves one end into the Pod netns, assigns the IP, and plumbs the host end into the bridge.',
    },
    {
      id: 'ipam',
      label: 'IPAM allocates the Pod IP',
      description: 'IPAM is the CNI responsibility of handing out addresses from the node\'s podCIDR (host-local) or from a cluster-wide pool (calico-ipam, Cilium IPAM).',
      nodeOverrides: { ipam: { status: 'active' } },
      edgeOverrides: { 'cni-ipam': { animated: true } },
    },
    {
      id: 'wire',
      label: 'veth pair + bridge wiring',
      description: 'The veth pair acts like a virtual Ethernet cable: one end lives in the Pod netns as eth0; the other sits in the host netns, attached to the bridge.',
      nodeOverrides: { veth: { status: 'active' }, bridge: { status: 'active' } },
      edgeOverrides: { 'netns-veth': { animated: true }, 'veth-bridge': { animated: true } },
    },
    {
      id: 'del',
      label: 'DEL: tear down on Pod termination',
      description: 'When the Pod is deleted, the kubelet calls DEL on the CNI plugin. It releases the IP back to IPAM and removes the veth pair; the netns is cleaned up by the runtime.',
    },
  ],
};

// --- 2. Cross-Node Pod Communication --------------------------------------

export const crossNodePodScene: SceneDefinition = {
  id: 'k8s-cross-node-pod',
  type: 'topology',
  title: 'Cross-node Pod packet path',
  description: 'A Pod on node A sends to a Pod on node B. The dataplane determines how the packet traverses the underlying network.',
  nodes: [
    { id: 'pod-a', type: 'function', label: 'Pod A (10.244.1.5)', position: { x: 60, y: 100 }, data: {}, status: 'active' },
    { id: 'node-a', type: 'server', label: 'Node A (10.0.1.11)', position: { x: 240, y: 100 }, data: { Hosts: 'bridge, veths, routes' } },
    { id: 'underlay', type: 'network', label: 'Underlay network', position: { x: 440, y: 180 }, data: { Routes: 'host-to-host via L2/L3 fabric' } },
    { id: 'node-b', type: 'server', label: 'Node B (10.0.1.12)', position: { x: 640, y: 100 }, data: { Hosts: 'bridge, veths, routes' } },
    { id: 'pod-b', type: 'function', label: 'Pod B (10.244.2.5)', position: { x: 820, y: 100 }, data: {}, status: 'active' },
    { id: 'vxlan', type: 'network', label: 'VXLAN encap/decap', position: { x: 440, y: 60 }, data: { When: 'overlay mode' } },
    { id: 'bgp', type: 'policy', label: 'BGP route table', position: { x: 440, y: 300 }, data: { When: 'native routing' } },
  ],
  edges: [
    { id: 'a-na', source: 'pod-a', target: 'node-a', edgeType: 'data', label: 'veth → bridge' },
    { id: 'na-ul', source: 'node-a', target: 'underlay', edgeType: 'data' },
    { id: 'ul-nb', source: 'underlay', target: 'node-b', edgeType: 'data' },
    { id: 'nb-b', source: 'node-b', target: 'pod-b', edgeType: 'data', label: 'bridge → veth' },
    { id: 'na-vxlan', source: 'node-a', target: 'vxlan', edgeType: 'dependency' },
    { id: 'vxlan-nb', source: 'vxlan', target: 'node-b', edgeType: 'dependency' },
    { id: 'bgp-ul', source: 'bgp', target: 'underlay', edgeType: 'dependency' },
  ],
  states: [
    {
      id: 'overview',
      label: 'The packet leaves Pod A',
      description: 'The outgoing packet exits the Pod via its veth pair onto the node\'s bridge. The next hop depends on the dataplane.',
    },
    {
      id: 'vxlan-mode',
      label: 'VXLAN overlay',
      description: 'The host stack encapsulates the Pod packet inside a UDP/VXLAN packet whose outer IPs are the two node IPs. The underlay only sees node-to-node traffic.',
      nodeOverrides: { vxlan: { status: 'active' } },
      edgeOverrides: { 'na-vxlan': { animated: true }, 'vxlan-nb': { animated: true }, 'ul-nb': { animated: true } },
    },
    {
      id: 'bgp-mode',
      label: 'BGP route distribution',
      description: 'The underlay has a route to the destination Pod\'s CIDR (learned from BGP). The packet traverses it with no encapsulation at all — faster, but the underlay must be able to route the Pod addresses.',
      nodeOverrides: { bgp: { status: 'active' } },
      edgeOverrides: { 'bgp-ul': { animated: true }, 'na-ul': { animated: true }, 'ul-nb': { animated: true } },
    },
  ],
};

// --- 3. Service Traffic Routing -------------------------------------------

export const serviceRoutingScene: SceneDefinition = {
  id: 'k8s-service-routing',
  type: 'topology',
  title: 'Service → Pod traffic routing',
  description: 'A caller sends to the ClusterIP; kube-proxy\'s rules DNAT the packet to one of the backing Pod IPs. kube-proxy does not proxy in iptables/IPVS modes — it programs kernel rules.',
  nodes: [
    { id: 'caller', type: 'function', label: 'Caller Pod', position: { x: 60, y: 180 }, data: {}, status: 'active' },
    { id: 'clusterip', type: 'loadbalancer', label: 'ClusterIP 10.96.3.42', position: { x: 260, y: 180 }, data: { Does: 'Virtual IP, no Pod backing it' } },
    { id: 'kube-proxy', type: 'policy', label: 'kube-proxy', position: { x: 260, y: 300 }, data: { Does: 'Watches EndpointSlice, programs iptables/IPVS' } },
    { id: 'endpoints', type: 'policy', label: 'EndpointSlice', position: { x: 60, y: 300 }, data: { Lists: 'Pod IPs for this Service' } },
    { id: 'pod-1', type: 'function', label: 'Pod backend-1 (10.244.1.7)', position: { x: 520, y: 100 }, data: {}, status: 'active' },
    { id: 'pod-2', type: 'function', label: 'Pod backend-2 (10.244.2.4)', position: { x: 520, y: 220 }, data: {}, status: 'active' },
    { id: 'pod-3', type: 'function', label: 'Pod backend-3 (10.244.3.9)', position: { x: 520, y: 340 }, data: { Ready: 'no — not in EP' } },
  ],
  edges: [
    { id: 'caller-cip', source: 'caller', target: 'clusterip', edgeType: 'request', label: 'dst=10.96.3.42:80' },
    { id: 'cip-p1', source: 'clusterip', target: 'pod-1', edgeType: 'request', label: 'DNAT' },
    { id: 'cip-p2', source: 'clusterip', target: 'pod-2', edgeType: 'request' },
    { id: 'cip-p3', source: 'clusterip', target: 'pod-3', edgeType: 'request', flow: 'blocked', label: 'not-Ready, filtered' },
    { id: 'ep-kp', source: 'endpoints', target: 'kube-proxy', edgeType: 'data', label: 'watch' },
    { id: 'kp-cip', source: 'kube-proxy', target: 'clusterip', edgeType: 'dependency', label: 'programs rules' },
  ],
  states: [
    {
      id: 'overview',
      label: 'ClusterIP is a rule, not a Pod',
      description: 'No process listens on 10.96.3.42. The kernel\'s iptables or IPVS rewrites the destination IP mid-flight to one of the backing Pods.',
    },
    {
      id: 'drop-notready',
      label: 'Not-Ready Pods are filtered out',
      description: 'A Pod with Ready=False is not in the EndpointSlice; kube-proxy\'s rules never include its IP, so traffic cannot land there until it becomes Ready.',
      nodeOverrides: { 'pod-3': { status: 'error' } },
    },
    {
      id: 'reprogram',
      label: 'Pod changes force a reprogram',
      description: 'When a Pod becomes Ready or terminates, the EndpointSlice is updated. Every node\'s kube-proxy sees the change and reprograms its rules — this is why large clusters benefit from IPVS (rule count scales linearly, not with iptables\' O(n²) match).',
      nodeOverrides: { 'kube-proxy': { status: 'active' } },
      edgeOverrides: { 'ep-kp': { animated: true }, 'kp-cip': { animated: true } },
    },
  ],
};

// --- 4. Ingress Request Lifecycle -----------------------------------------

export const ingressLifecycleScene: SceneDefinition = {
  id: 'k8s-ingress-lifecycle',
  type: 'topology',
  title: 'Ingress request lifecycle',
  description: 'External HTTPS request → cloud LB → Ingress controller Pod (TLS termination + Host/path match) → backend Service → Pod.',
  nodes: [
    { id: 'client', type: 'client', label: 'External client', position: { x: 40, y: 220 }, data: {}, status: 'active' },
    { id: 'dns', type: 'network', label: 'DNS', position: { x: 240, y: 80 }, data: { Does: 'A/AAAA → LB IP' } },
    { id: 'lb', type: 'loadbalancer', label: 'Cloud LB', position: { x: 240, y: 220 }, data: { Does: 'TCP/443 to controller Pod' } },
    { id: 'controller', type: 'gateway', label: 'Ingress controller Pod', position: { x: 460, y: 220 }, data: { Does: 'TLS termination + L7 routing' }, status: 'active' },
    { id: 'rules', type: 'policy', label: 'Ingress rules + Secret', position: { x: 460, y: 80 }, data: { Does: 'host/path → backend' } },
    { id: 'svc', type: 'loadbalancer', label: 'Backend Service (ClusterIP)', position: { x: 680, y: 220 }, data: {} },
    { id: 'pod', type: 'function', label: 'Backend Pod', position: { x: 880, y: 220 }, data: {}, status: 'active' },
  ],
  edges: [
    { id: 'c-dns', source: 'client', target: 'dns', edgeType: 'request', label: '1. resolve host' },
    { id: 'c-lb', source: 'client', target: 'lb', edgeType: 'request', label: '2. HTTPS :443' },
    { id: 'lb-ctl', source: 'lb', target: 'controller', edgeType: 'request', label: '3. forward' },
    { id: 'rules-ctl', source: 'rules', target: 'controller', edgeType: 'dependency', label: 'watches' },
    { id: 'ctl-svc', source: 'controller', target: 'svc', edgeType: 'request', label: '4. backend match → HTTP' },
    { id: 'svc-pod', source: 'svc', target: 'pod', edgeType: 'request', label: '5. DNAT to Pod' },
  ],
  states: [
    {
      id: 'overview',
      label: 'The full path',
      description: 'The browser resolves the host, connects to the cloud LB, which forwards to an Ingress controller Pod. The controller terminates TLS and routes by Host + path to a backend Service.',
    },
    {
      id: 'tls-termination',
      label: 'TLS terminates at the controller',
      description: 'The controller presents a certificate from a referenced Secret. After decryption it speaks plain HTTP to the backend. End-to-end TLS requires re-encryption to the backend (configurable per-controller) or a TCP passthrough controller.',
      edgeOverrides: { 'c-lb': { animated: true }, 'lb-ctl': { animated: true }, 'ctl-svc': { animated: true, label: '4. plain HTTP' } },
    },
    {
      id: '404',
      label: 'No rule matches → 404 at the controller',
      description: 'If no ingress rule matches the Host header or path, the controller returns 404 before any backend is touched.',
      nodeOverrides: { pod: { status: 'inactive' } },
      edgeOverrides: { 'ctl-svc': { flow: 'blocked', label: 'no match → 404' } },
    },
  ],
};

// --- 5. Gateway API Architecture ------------------------------------------

export const gatewayApiScene: SceneDefinition = {
  id: 'k8s-gateway-api',
  type: 'topology',
  title: 'Gateway API — roles and resources',
  description: 'Gateway API splits Ingress into multiple roles. GatewayClass is implemented by an infra team; Gateway is created by a platform team; HTTPRoute is created by app teams and attached to a Gateway.',
  nodes: [
    { id: 'gc', type: 'policy', label: 'GatewayClass', position: { x: 60, y: 160 }, data: { Owner: 'Infrastructure (controller vendor)' } },
    { id: 'gw', type: 'gateway', label: 'Gateway', position: { x: 300, y: 160 }, data: { Owner: 'Platform team', Attaches: 'Listeners (HTTPS :443)' }, status: 'active' },
    { id: 'route-a', type: 'policy', label: 'HTTPRoute A (shop.example.com)', position: { x: 540, y: 60 }, data: { Owner: 'app team (frontend)' } },
    { id: 'route-b', type: 'policy', label: 'HTTPRoute B (admin.example.com)', position: { x: 540, y: 260 }, data: { Owner: 'app team (ops)' } },
    { id: 'svc-a', type: 'loadbalancer', label: 'web Service', position: { x: 800, y: 60 }, data: {} },
    { id: 'svc-b', type: 'loadbalancer', label: 'admin Service', position: { x: 800, y: 260 }, data: {} },
  ],
  edges: [
    { id: 'gc-gw', source: 'gc', target: 'gw', edgeType: 'dependency', label: 'controller implements' },
    { id: 'route-a-gw', source: 'route-a', target: 'gw', edgeType: 'dependency', label: 'parentRef' },
    { id: 'route-b-gw', source: 'route-b', target: 'gw', edgeType: 'dependency', label: 'parentRef' },
    { id: 'route-a-svc', source: 'route-a', target: 'svc-a', edgeType: 'request', label: 'backendRef' },
    { id: 'route-b-svc', source: 'route-b', target: 'svc-b', edgeType: 'request', label: 'backendRef' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Three resources, three roles',
      description: 'Where Ingress tried to pack everything into one Ingress object, Gateway API separates concerns: the controller defines a class, the platform defines where/how it listens, and each app defines its own routes.',
    },
    {
      id: 'ingress-vs-gateway',
      label: 'Why Gateway API exists',
      description: 'Ingress annotations became the actual API — every controller\'s "advanced" features were vendor-specific annotations. Gateway API makes those features first-class types (HTTPRoute, TLSRoute, GRPCRoute).',
      edgeOverrides: { 'route-a-gw': { animated: true }, 'route-b-gw': { animated: true } },
    },
  ],
};

// --- 6. NetworkPolicy Enforcement -----------------------------------------

export const networkPolicyScene: SceneDefinition = {
  id: 'k8s-networkpolicy',
  type: 'topology',
  title: 'NetworkPolicy — selected, additive, enforced by the CNI',
  description: 'Policies attach to Pods via podSelector. Multiple policies on the same Pod are OR\'d (additive). The API Server does not enforce; the CNI does.',
  nodes: [
    { id: 'frontend', type: 'function', label: 'frontend/web', position: { x: 60, y: 100 }, data: { labels: 'app=web' }, status: 'active' },
    { id: 'api-pod', type: 'function', label: 'backend/api', position: { x: 460, y: 100 }, data: { labels: 'app=api' }, status: 'active' },
    { id: 'db-pod', type: 'function', label: 'backend/db', position: { x: 460, y: 280 }, data: { labels: 'tier=data' } },
    { id: 'policy-1', type: 'policy', label: 'allow-frontend-to-api', position: { x: 260, y: 20 }, data: { Selects: 'api', Allows: 'from app=web' } },
    { id: 'policy-2', type: 'policy', label: 'default-deny-ingress', position: { x: 260, y: 180 }, data: { Selects: 'all in backend', Allows: 'nothing' } },
    { id: 'cni-dataplane', type: 'firewall', label: 'CNI dataplane (enforces)', position: { x: 260, y: 360 }, data: { Does: 'eBPF / iptables rules per node' } },
  ],
  edges: [
    { id: 'fe-api', source: 'frontend', target: 'api-pod', edgeType: 'request', flow: 'allow', label: 'allowed by policy-1' },
    { id: 'fe-db', source: 'frontend', target: 'db-pod', edgeType: 'request', flow: 'deny', label: 'denied by policy-2 (default deny)' },
    { id: 'p1-api', source: 'policy-1', target: 'api-pod', edgeType: 'dependency' },
    { id: 'p2-api', source: 'policy-2', target: 'api-pod', edgeType: 'dependency' },
    { id: 'p2-db', source: 'policy-2', target: 'db-pod', edgeType: 'dependency' },
    { id: 'cni-p1', source: 'cni-dataplane', target: 'policy-1', edgeType: 'dependency', label: 'compiles' },
    { id: 'cni-p2', source: 'cni-dataplane', target: 'policy-2', edgeType: 'dependency', label: 'compiles' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Policies are OR\'d, not AND\'d',
      description: 'When multiple NetworkPolicies select the same Pod, their allow rules are unioned. A tight policy does not override a permissive one — the permissive one still allows.',
    },
    {
      id: 'default-deny',
      label: 'Default-deny sets the floor',
      description: 'A NetworkPolicy with empty ingress and policyTypes: [ingress] denies all ingress to its selected Pods. Combine with more specific allow policies.',
      edgeOverrides: { 'p2-api': { animated: true }, 'p2-db': { animated: true } },
    },
    {
      id: 'cni-enforces',
      label: 'The CNI enforces — without it, policies are inert',
      description: 'The API Server accepts NetworkPolicy objects even if the installed CNI does not implement them (Flannel without Calico overlay, basic plugins). You must verify the CNI supports NetworkPolicy, not just that the YAML applied.',
      nodeOverrides: { 'cni-dataplane': { status: 'active' } },
      edgeOverrides: { 'cni-p1': { animated: true }, 'cni-p2': { animated: true } },
    },
  ],
};

// --- 7. RBAC Authorization Flow -------------------------------------------

export const rbacFlowScene: SceneDefinition = {
  id: 'k8s-rbac-flow',
  type: 'topology',
  title: 'RBAC authorization flow',
  description: 'A request arrives at the API Server. Authentication identifies the subject; authorization checks every (Cluster)RoleBinding for a matching rule; admission finally mutates/validates.',
  nodes: [
    { id: 'client', type: 'client', label: 'kubectl / app', position: { x: 40, y: 180 }, data: {}, status: 'active' },
    { id: 'api', type: 'gateway', label: 'API Server', position: { x: 240, y: 180 }, data: {}, status: 'active' },
    { id: 'authn', type: 'policy', label: '1. Authentication', position: { x: 240, y: 60 }, data: { Returns: 'user + groups' } },
    { id: 'authz', type: 'policy', label: '2. Authorization (RBAC)', position: { x: 440, y: 60 }, data: { Checks: 'bindings → roles → rules' } },
    { id: 'admission', type: 'policy', label: '3. Admission', position: { x: 440, y: 180 }, data: { Does: 'mutate + validate' } },
    { id: 'etcd', type: 'database', label: 'etcd', position: { x: 640, y: 180 }, data: { Does: 'persist' } },
    { id: 'bindings', type: 'policy', label: 'RoleBindings / ClusterRoleBindings', position: { x: 640, y: 60 }, data: {} },
  ],
  edges: [
    { id: 'c-api', source: 'client', target: 'api', edgeType: 'request', label: 'PATCH /apis/apps/v1/.../deployments/x' },
    { id: 'api-authn', source: 'api', target: 'authn', edgeType: 'dependency' },
    { id: 'api-authz', source: 'api', target: 'authz', edgeType: 'dependency' },
    { id: 'authz-bindings', source: 'authz', target: 'bindings', edgeType: 'dependency', label: 'scan' },
    { id: 'api-adm', source: 'api', target: 'admission', edgeType: 'dependency' },
    { id: 'adm-etcd', source: 'admission', target: 'etcd', edgeType: 'data', label: 'persist' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Three gates in order',
      description: 'A request passes authn (who), then authz (what you may do), then admission (can this object be persisted). Only after all three does it reach etcd.',
    },
    {
      id: 'authz-detail',
      label: 'RBAC authz is "find one rule that allows"',
      description: 'The default is deny. The authorizer scans every binding that includes the subject and checks whether any rule in the referenced role matches (apiGroup, resource, resourceName?, verb).',
      nodeOverrides: { authz: { status: 'active' } },
      edgeOverrides: { 'api-authz': { animated: true }, 'authz-bindings': { animated: true } },
    },
    {
      id: 'admission',
      label: 'Admission runs after authz',
      description: 'Admission plugins (mutating then validating) see the authenticated, authorized request. Pod Security Admission, ResourceQuota, LimitRange, and webhook admission plugins all live here.',
      nodeOverrides: { admission: { status: 'active' } },
      edgeOverrides: { 'api-adm': { animated: true } },
    },
  ],
};

// --- 8. Pod Security Context and Linux Isolation --------------------------

export const securityContextScene: SceneDefinition = {
  id: 'k8s-security-context',
  type: 'topology',
  title: 'Pod security context → Linux isolation',
  description: 'Each field of securityContext maps to a specific Linux mechanism: user namespaces or uid drop, capability bounding set, read-only bind mount, no_new_privs, seccomp/apparmor.',
  nodes: [
    { id: 'spec', type: 'policy', label: 'PodSpec.securityContext', position: { x: 60, y: 200 }, data: {} },
    { id: 'uid', type: 'identity', label: 'runAsUser / runAsNonRoot', position: { x: 300, y: 60 }, data: { Enforces: 'process UID' } },
    { id: 'caps', type: 'firewall', label: 'capabilities.drop / add', position: { x: 300, y: 160 }, data: { Enforces: 'bounding set' } },
    { id: 'rootfs', type: 'storage', label: 'readOnlyRootFilesystem', position: { x: 300, y: 260 }, data: { Enforces: 'MS_RDONLY mount' } },
    { id: 'nne', type: 'policy', label: 'allowPrivilegeEscalation', position: { x: 300, y: 360 }, data: { Flag: 'no_new_privs' } },
    { id: 'seccomp', type: 'firewall', label: 'seccompProfile', position: { x: 300, y: 460 }, data: { Enforces: 'syscall filter (BPF)' } },
    { id: 'kernel', type: 'host', label: 'Linux kernel', position: { x: 580, y: 260 }, data: { Does: 'applies all of the above at exec' }, status: 'active' },
    { id: 'container', type: 'function', label: 'Container process', position: { x: 820, y: 260 }, data: {}, status: 'active' },
  ],
  edges: [
    { id: 'spec-uid', source: 'spec', target: 'uid', edgeType: 'data' },
    { id: 'spec-caps', source: 'spec', target: 'caps', edgeType: 'data' },
    { id: 'spec-rootfs', source: 'spec', target: 'rootfs', edgeType: 'data' },
    { id: 'spec-nne', source: 'spec', target: 'nne', edgeType: 'data' },
    { id: 'spec-seccomp', source: 'spec', target: 'seccomp', edgeType: 'data' },
    { id: 'uid-kernel', source: 'uid', target: 'kernel', edgeType: 'dependency' },
    { id: 'caps-kernel', source: 'caps', target: 'kernel', edgeType: 'dependency' },
    { id: 'rootfs-kernel', source: 'rootfs', target: 'kernel', edgeType: 'dependency' },
    { id: 'nne-kernel', source: 'nne', target: 'kernel', edgeType: 'dependency' },
    { id: 'seccomp-kernel', source: 'seccomp', target: 'kernel', edgeType: 'dependency' },
    { id: 'kernel-c', source: 'kernel', target: 'container', edgeType: 'request', label: 'constrained exec' },
  ],
  states: [
    {
      id: 'overview',
      label: 'YAML fields map one-to-one to Linux knobs',
      description: 'securityContext is not a Kubernetes-specific abstraction — it is a declarative way to set long-standing Linux process restrictions.',
    },
    {
      id: 'restricted',
      label: 'Restricted baseline',
      description: 'runAsNonRoot=true, drop ALL caps, allowPrivilegeEscalation=false, readOnlyRootFilesystem=true, seccomp=runtime/default. This combination survives the overwhelming majority of known container escape primitives.',
      nodeOverrides: { uid: { status: 'active' }, caps: { status: 'active' }, rootfs: { status: 'active' }, nne: { status: 'active' }, seccomp: { status: 'active' } },
    },
  ],
};
