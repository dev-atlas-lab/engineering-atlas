import type { SceneDefinition } from '../../engines/visualization/types';

// --- 1. Kubernetes Cluster Architecture ------------------------------------
// Control plane components + two worker nodes with kubelet/kube-proxy/Pods,
// used on the kubernetes-cluster-architecture concept.

export const clusterArchitectureScene: SceneDefinition = {
  id: 'k8s-cluster-architecture',
  type: 'topology',
  title: 'Kubernetes cluster — control plane and worker nodes',
  description: 'Control plane components talk only through the API Server; each worker node runs a kubelet, a kube-proxy, and a container runtime that hosts Pods.',
  nodes: [
    { id: 'api', type: 'gateway', label: 'API Server', position: { x: 300, y: 40 }, data: { Does: 'Serves the REST API; the only writer to etcd' }, status: 'active' },
    { id: 'etcd', type: 'database', label: 'etcd', position: { x: 60, y: 40 }, data: { Does: 'Stores all cluster state; strongly consistent' }, status: 'active' },
    { id: 'sched', type: 'policy', label: 'Scheduler', position: { x: 300, y: 160 }, data: { Does: 'Picks a node for every unscheduled Pod' } },
    { id: 'cm', type: 'server', label: 'Controller Manager', position: { x: 540, y: 160 }, data: { Does: 'Runs the built-in controller loops' } },
    { id: 'kubelet1', type: 'server', label: 'kubelet (node 1)', position: { x: 120, y: 320 }, data: { Does: 'Runs Pods assigned to this node' }, status: 'active' },
    { id: 'proxy1', type: 'network', label: 'kube-proxy', position: { x: 120, y: 410 }, data: { Does: 'Programs Service rules on the node' } },
    { id: 'pod1', type: 'function', label: 'Pod A', position: { x: 300, y: 320 }, data: { Node: 'node 1' } },
    { id: 'pod2', type: 'function', label: 'Pod B', position: { x: 300, y: 410 }, data: { Node: 'node 1' } },
    { id: 'kubelet2', type: 'server', label: 'kubelet (node 2)', position: { x: 480, y: 320 }, data: { Does: 'Runs Pods assigned to this node' }, status: 'active' },
    { id: 'proxy2', type: 'network', label: 'kube-proxy', position: { x: 480, y: 410 }, data: { Does: 'Programs Service rules on the node' } },
    { id: 'pod3', type: 'function', label: 'Pod C', position: { x: 660, y: 320 }, data: { Node: 'node 2' } },
  ],
  edges: [
    { id: 'api-etcd', source: 'api', target: 'etcd', edgeType: 'data', label: 'reads/writes' },
    { id: 'sched-api', source: 'sched', target: 'api', edgeType: 'dependency', label: 'watch Pods' },
    { id: 'cm-api', source: 'cm', target: 'api', edgeType: 'dependency', label: 'watch objects' },
    { id: 'kubelet1-api', source: 'kubelet1', target: 'api', edgeType: 'dependency', label: 'watch & report' },
    { id: 'kubelet2-api', source: 'kubelet2', target: 'api', edgeType: 'dependency', label: 'watch & report' },
    { id: 'kubelet1-pod1', source: 'kubelet1', target: 'pod1', edgeType: 'dependency' },
    { id: 'kubelet1-pod2', source: 'kubelet1', target: 'pod2', edgeType: 'dependency' },
    { id: 'kubelet2-pod3', source: 'kubelet2', target: 'pod3', edgeType: 'dependency' },
  ],
  boundaries: [
    { id: 'cp', label: 'Control plane', kind: 'scope', nodeIds: ['api', 'etcd', 'sched', 'cm'] },
    { id: 'n1', label: 'Worker node 1', kind: 'zone', nodeIds: ['kubelet1', 'proxy1', 'pod1', 'pod2'] },
    { id: 'n2', label: 'Worker node 2', kind: 'zone', nodeIds: ['kubelet2', 'proxy2', 'pod3'] },
  ],
  states: [
    {
      id: 'overview',
      label: 'The cluster at rest',
      description: 'The control plane keeps the cluster\'s state in etcd and exposes it through the API Server. Every other component reads and writes through the API Server — nothing else touches etcd directly.',
    },
    {
      id: 'watches',
      label: 'Everyone watches the API Server',
      description: 'The scheduler, controller manager, and every node\'s kubelet hold long-lived "watch" connections to the API Server. They are notified when the objects they care about change — no polling.',
      edgeOverrides: {
        'sched-api': { animated: true },
        'cm-api': { animated: true },
        'kubelet1-api': { animated: true },
        'kubelet2-api': { animated: true },
      },
    },
    {
      id: 'kubelet-runs',
      label: 'kubelet turns an assignment into a running Pod',
      description: 'When the API Server records a Pod with a node name, the kubelet on that node sees the change, tells the local container runtime to pull images and start containers, then reports status back.',
      nodeOverrides: {
        pod1: { status: 'active' },
        pod2: { status: 'active' },
        pod3: { status: 'active' },
      },
      edgeOverrides: {
        'kubelet1-pod1': { animated: true },
        'kubelet1-pod2': { animated: true },
        'kubelet2-pod3': { animated: true },
      },
    },
  ],
};

// --- 2. API Request Lifecycle ---------------------------------------------

export const apiRequestLifecycleScene: SceneDefinition = {
  id: 'k8s-api-request-lifecycle',
  type: 'sequence',
  title: 'Lifecycle of a kubectl apply request',
  description: 'A kubectl apply request passes through authentication, authorization, admission, and validation before the API Server writes it to etcd.',
  nodes: [
    { id: 'kubectl', type: 'client', label: 'kubectl', position: { x: 0, y: 0 }, data: {} },
    { id: 'authn', type: 'identity', label: 'Authentication', position: { x: 0, y: 0 }, data: { Checks: 'Who is making the request?' } },
    { id: 'authz', type: 'policy', label: 'Authorization', position: { x: 0, y: 0 }, data: { Checks: 'Is this user allowed to do this?' } },
    { id: 'adm', type: 'firewall', label: 'Admission', position: { x: 0, y: 0 }, data: { Checks: 'Mutate/validate the object; enforce policy' } },
    { id: 'valid', type: 'policy', label: 'Schema validation', position: { x: 0, y: 0 }, data: { Checks: 'Does the object match its schema?' } },
    { id: 'etcd', type: 'database', label: 'etcd', position: { x: 0, y: 0 }, data: { Does: 'Persists the object' } },
  ],
  edges: [
    { id: 'c-authn', source: 'kubectl', target: 'authn', edgeType: 'request', label: '1. HTTPS + token/cert' },
    { id: 'authn-authz', source: 'authn', target: 'authz', edgeType: 'request', label: '2. user identity' },
    { id: 'authz-adm', source: 'authz', target: 'adm', edgeType: 'request', label: '3. allowed' },
    { id: 'adm-valid', source: 'adm', target: 'valid', edgeType: 'request', label: '4. mutated object' },
    { id: 'valid-etcd', source: 'valid', target: 'etcd', edgeType: 'data', label: '5. persist' },
  ],
  states: [
    {
      id: 'start',
      label: 'kubectl sends the request',
      description: 'kubectl apply reads a YAML file, constructs a request to create or update an object, and sends it to the API Server over HTTPS with the user\'s credentials.',
      edgeOverrides: { 'c-authn': { animated: true } },
    },
    {
      id: 'authn-stage',
      label: 'Authentication identifies the user',
      description: 'The API Server runs the request through its authenticators (client cert, bearer token, OIDC, …). The first one that succeeds attaches the user\'s identity to the request; if none match, the request is rejected with 401.',
      nodeOverrides: { authn: { status: 'active' } },
      edgeOverrides: { 'c-authn': { flow: 'allow' } },
    },
    {
      id: 'authz-stage',
      label: 'Authorization decides whether this action is allowed',
      description: 'With an identity attached, the API Server asks the authorizer (typically RBAC) whether this user may perform this verb on this resource in this namespace. A denial here produces 403.',
      nodeOverrides: { authn: { status: 'active' }, authz: { status: 'active' } },
      edgeOverrides: { 'authn-authz': { flow: 'allow' } },
    },
    {
      id: 'admission',
      label: 'Admission mutates and validates',
      description: 'Admission controllers get the last word. Mutating webhooks can change the object (defaulting, sidecar injection); validating webhooks can reject it. Policy enforcement — "no privileged containers", "image must be from our registry" — lives here.',
      nodeOverrides: { adm: { status: 'active' } },
      edgeOverrides: { 'authz-adm': { flow: 'allow' }, 'adm-valid': { animated: true } },
    },
    {
      id: 'persist',
      label: 'The API Server writes to etcd',
      description: 'Only after validation passes does the API Server persist the object. Any controller watching that resource type will be notified — the request is complete, but the actual work (scheduling, running) has just begun.',
      nodeOverrides: { valid: { status: 'active' }, etcd: { status: 'active' } },
      edgeOverrides: { 'valid-etcd': { animated: true, flow: 'allow' } },
    },
  ],
};

// --- 3. Scheduler Workflow -------------------------------------------------

export const schedulerWorkflowScene: SceneDefinition = {
  id: 'k8s-scheduler-workflow',
  type: 'topology',
  title: 'The scheduler filters then scores candidate nodes',
  description: 'A Pending Pod is matched against nodes in two phases: filtering removes nodes that cannot run it, scoring ranks the survivors, and the top-scored node is bound.',
  nodes: [
    { id: 'pod', type: 'function', label: 'Pending Pod', position: { x: 0, y: 160 }, data: { Requests: '500m CPU, 1Gi memory' } },
    { id: 'n1', type: 'server', label: 'Node 1', position: { x: 240, y: 40 }, data: { Free: '2 CPU, 4Gi' } },
    { id: 'n2', type: 'server', label: 'Node 2', position: { x: 240, y: 160 }, data: { Free: '200m, 512Mi' } },
    { id: 'n3', type: 'server', label: 'Node 3', position: { x: 240, y: 280 }, data: { Free: '1 CPU, 2Gi' } },
    { id: 'filter', type: 'policy', label: 'Filter (predicates)', position: { x: 440, y: 160 }, data: { Does: 'Keeps only nodes that can run the Pod' } },
    { id: 'score', type: 'policy', label: 'Score (priorities)', position: { x: 620, y: 160 }, data: { Does: 'Ranks the survivors by fit' } },
    { id: 'chosen', type: 'server', label: 'Chosen: Node 1', position: { x: 820, y: 160 }, data: { Score: '8.5' } },
  ],
  edges: [
    { id: 'p-f', source: 'pod', target: 'filter', edgeType: 'request', label: 'Pod + requirements' },
    { id: 'n1-f', source: 'n1', target: 'filter', edgeType: 'dependency' },
    { id: 'n2-f', source: 'n2', target: 'filter', edgeType: 'dependency' },
    { id: 'n3-f', source: 'n3', target: 'filter', edgeType: 'dependency' },
    { id: 'f-s', source: 'filter', target: 'score', edgeType: 'data', label: 'Feasible nodes' },
    { id: 's-c', source: 'score', target: 'chosen', edgeType: 'request', label: 'Bind' },
  ],
  states: [
    {
      id: 'pending',
      label: 'A Pending Pod arrives',
      description: 'The scheduler sees a Pod with no nodeName. It needs 500m CPU and 1Gi memory. Three nodes exist with varying free capacity.',
    },
    {
      id: 'filtering',
      label: 'Filtering removes infeasible nodes',
      description: 'Predicates remove any node that can\'t run the Pod. Node 2 only has 200m CPU free, less than the Pod\'s 500m request — filtered out. Nodes 1 and 3 remain.',
      nodeOverrides: { n2: { status: 'error', label: 'Node 2 — filtered' } },
      edgeOverrides: { 'n2-f': { flow: 'deny' }, 'n1-f': { flow: 'allow' }, 'n3-f': { flow: 'allow' } },
    },
    {
      id: 'scoring',
      label: 'Scoring ranks the survivors',
      description: 'Priority functions score each feasible node. Node 1 scores higher than Node 3 (more spare capacity for the Pod\'s request profile, better bin-packing). The highest score wins.',
      nodeOverrides: { n1: { status: 'active', label: 'Node 1 — score 8.5' }, n3: { status: 'inactive', label: 'Node 3 — score 6.2' }, n2: { status: 'error' } },
    },
    {
      id: 'bound',
      label: 'The Pod is bound to Node 1',
      description: 'The scheduler writes a Binding — it simply sets pod.spec.nodeName on the Pod via the API Server. That write is what tells the kubelet on Node 1 to pick up the Pod and run it.',
      nodeOverrides: { chosen: { status: 'active' }, n1: { status: 'active' }, n2: { status: 'error' }, n3: { status: 'inactive' } },
      edgeOverrides: { 's-c': { animated: true, flow: 'allow' } },
    },
  ],
};

// --- 4. Reconciliation Loop ------------------------------------------------

export const reconciliationLoopScene: SceneDefinition = {
  id: 'k8s-reconciliation-loop',
  type: 'topology',
  title: 'A controller\'s reconciliation loop',
  description: 'A controller observes actual state, compares it to desired state, and takes action to close the gap — repeatedly, for as long as the object exists.',
  nodes: [
    { id: 'desired', type: 'policy', label: 'Desired state', position: { x: 60, y: 40 }, data: { Value: 'replicas: 3' } },
    { id: 'controller', type: 'server', label: 'Controller', position: { x: 360, y: 160 }, data: { Does: 'Observes, diffs, acts' }, status: 'active' },
    { id: 'actual', type: 'function', label: 'Actual state', position: { x: 60, y: 280 }, data: { Value: 'Pods running: 3' } },
    { id: 'api', type: 'gateway', label: 'API Server', position: { x: 660, y: 160 }, data: { Does: 'Source of truth' } },
  ],
  edges: [
    { id: 'd-c', source: 'desired', target: 'controller', edgeType: 'dependency', label: 'read spec' },
    { id: 'a-c', source: 'actual', target: 'controller', edgeType: 'dependency', label: 'read status' },
    { id: 'c-api', source: 'controller', target: 'api', edgeType: 'request', label: 'write actions' },
  ],
  states: [
    {
      id: 'steady',
      label: 'Steady state: desired matches actual',
      description: 'The controller sees desired=3 and actual=3. Nothing to do. It schedules another observation; this is the loop idling, not standing still.',
    },
    {
      id: 'drift',
      label: 'A Pod fails — actual drifts below desired',
      description: 'A node reboots and takes a Pod with it. Actual state is now 2 Pods running, but the spec still says 3. The gap is what the controller reacts to.',
      nodeOverrides: {
        actual: { status: 'error', label: 'Actual: 2 running', data: { Value: 'Pods running: 2' } },
      },
    },
    {
      id: 'observe',
      label: 'Controller observes the gap',
      description: 'The controller\'s watch on the API Server fires. It reads the current spec and status, computes diff = desired − actual = 1 missing Pod.',
      nodeOverrides: { actual: { status: 'error' }, controller: { status: 'active' } },
      edgeOverrides: { 'd-c': { animated: true }, 'a-c': { animated: true } },
    },
    {
      id: 'act',
      label: 'Controller acts to close the gap',
      description: 'The controller asks the API Server to create a new Pod from the template. The scheduler will bind it to a node; the kubelet there will start it; eventually the ReplicaSet\'s status will reflect 3 running — the gap closed.',
      nodeOverrides: { actual: { status: 'error' }, controller: { status: 'active' }, api: { status: 'active' } },
      edgeOverrides: { 'c-api': { animated: true, flow: 'allow' } },
    },
    {
      id: 'converged',
      label: 'Converged — and the loop keeps running',
      description: 'A new Pod is scheduled and running. Desired=3, actual=3 again. The loop does not stop here — it continues to observe. Self-healing is this loop running continuously, not a one-shot response.',
      nodeOverrides: {
        actual: { status: 'active', label: 'Actual: 3 running', data: { Value: 'Pods running: 3' } },
      },
    },
  ],
};

// --- 5. Deployment and ReplicaSet -----------------------------------------

export const deploymentReplicaSetScene: SceneDefinition = {
  id: 'k8s-deployment-replicaset',
  type: 'topology',
  title: 'Deployment managing a ReplicaSet managing Pods',
  description: 'A Deployment is a controller over ReplicaSets; a ReplicaSet is a controller over Pods. Scaling, rolling updates, and self-healing all flow through this three-tier hierarchy.',
  nodes: [
    { id: 'dep', type: 'policy', label: 'Deployment "web"', position: { x: 300, y: 40 }, data: { Replicas: '3', Image: 'web:1.0' }, status: 'active' },
    { id: 'rs', type: 'server', label: 'ReplicaSet web-6c9', position: { x: 300, y: 160 }, data: { Owns: '3 Pods' }, status: 'active' },
    { id: 'p1', type: 'function', label: 'Pod web-6c9-a', position: { x: 80, y: 300 }, data: { Image: 'web:1.0' }, status: 'active' },
    { id: 'p2', type: 'function', label: 'Pod web-6c9-b', position: { x: 300, y: 300 }, data: { Image: 'web:1.0' }, status: 'active' },
    { id: 'p3', type: 'function', label: 'Pod web-6c9-c', position: { x: 520, y: 300 }, data: { Image: 'web:1.0' }, status: 'active' },
    { id: 'rs2', type: 'server', label: 'ReplicaSet web-7f3 (v2)', position: { x: 620, y: 160 }, data: { Target: 'image web:2.0' } },
    { id: 'p4', type: 'function', label: 'Pod web-7f3-a', position: { x: 740, y: 300 }, data: { Image: 'web:2.0' } },
  ],
  edges: [
    { id: 'd-rs', source: 'dep', target: 'rs', edgeType: 'dependency', label: 'owns' },
    { id: 'rs-p1', source: 'rs', target: 'p1', edgeType: 'dependency' },
    { id: 'rs-p2', source: 'rs', target: 'p2', edgeType: 'dependency' },
    { id: 'rs-p3', source: 'rs', target: 'p3', edgeType: 'dependency' },
    { id: 'd-rs2', source: 'dep', target: 'rs2', edgeType: 'dependency', label: 'owns' },
    { id: 'rs2-p4', source: 'rs2', target: 'p4', edgeType: 'dependency' },
  ],
  states: [
    {
      id: 'steady',
      label: '3 replicas of v1 running',
      description: 'The Deployment specifies 3 replicas of web:1.0. It owns one ReplicaSet; that ReplicaSet owns 3 Pods. Nothing is happening — the system is converged.',
      nodeOverrides: {
        rs2: { status: 'inactive', label: 'ReplicaSet web-7f3 (v2)' },
        p4: { status: 'inactive' },
      },
    },
    {
      id: 'scale-out',
      label: 'Scale to 5 replicas',
      description: 'kubectl scale --replicas=5 updates the Deployment\'s spec. The Deployment controller updates its ReplicaSet to 5 replicas; the ReplicaSet creates 2 new Pods. The Deployment does not create Pods directly — it only edits the ReplicaSet.',
      nodeOverrides: {
        dep: { data: { Replicas: '5', Image: 'web:1.0' }, status: 'active' },
        rs: { data: { Owns: '5 Pods' }, status: 'active' },
        rs2: { status: 'inactive' },
        p4: { status: 'inactive' },
      },
    },
    {
      id: 'pod-fail',
      label: 'A Pod fails — the ReplicaSet replaces it',
      description: 'Pod b dies. The ReplicaSet notices (its observed count fell to 2 for a 3-replica target) and creates a replacement. Deployment is not involved for Pod failures — that\'s the ReplicaSet\'s job.',
      nodeOverrides: {
        p2: { status: 'error', label: 'Pod web-6c9-b (failing)' },
        rs2: { status: 'inactive' },
        p4: { status: 'inactive' },
      },
    },
    {
      id: 'rolling-update',
      label: 'Rolling update to v2',
      description: 'kubectl set image updates the Deployment\'s template. The Deployment creates a new ReplicaSet (web-7f3) for v2 and scales it up while scaling the old one down — one Pod at a time, respecting maxSurge and maxUnavailable.',
      nodeOverrides: {
        dep: { data: { Replicas: '3', Image: 'web:2.0' }, status: 'active' },
        rs: { data: { Owns: '2 Pods' } },
        p1: { status: 'active' },
        p2: { status: 'active' },
        p3: { status: 'inactive', label: 'Pod web-6c9-c (terminating)' },
        rs2: { status: 'active' },
        p4: { status: 'active' },
      },
    },
  ],
};

// --- 6. Service Networking -------------------------------------------------

export const serviceNetworkingScene: SceneDefinition = {
  id: 'k8s-service-networking',
  type: 'topology',
  title: 'A Service load-balancing to Pods by label selector',
  description: 'A Service is a stable virtual IP and name. Its selector matches Pod labels; the matching Pod IPs become its Endpoints; kube-proxy on every node programs the virtual IP to load-balance to them.',
  nodes: [
    { id: 'caller', type: 'function', label: 'Caller Pod', position: { x: 0, y: 160 }, data: {} },
    { id: 'svc', type: 'loadbalancer', label: 'Service "web"', position: { x: 220, y: 160 }, data: { ClusterIP: '10.96.5.17', Selector: 'app=web' }, status: 'active' },
    { id: 'ep', type: 'policy', label: 'Endpoints / EndpointSlice', position: { x: 440, y: 160 }, data: { Does: 'Lists current Pod IPs matching the selector' }, status: 'active' },
    { id: 'p1', type: 'function', label: 'Pod A (app=web)', position: { x: 660, y: 60 }, data: { IP: '10.244.1.5' }, status: 'active' },
    { id: 'p2', type: 'function', label: 'Pod B (app=web)', position: { x: 660, y: 180 }, data: { IP: '10.244.2.7' }, status: 'active' },
    { id: 'p3', type: 'function', label: 'Pod C (app=batch)', position: { x: 660, y: 300 }, data: { IP: '10.244.1.9', Labels: 'app=batch' } },
  ],
  edges: [
    { id: 'c-s', source: 'caller', target: 'svc', edgeType: 'request', label: 'DNS: web → 10.96.5.17' },
    { id: 's-ep', source: 'svc', target: 'ep', edgeType: 'dependency' },
    { id: 'ep-p1', source: 'ep', target: 'p1', edgeType: 'request' },
    { id: 'ep-p2', source: 'ep', target: 'p2', edgeType: 'request' },
  ],
  states: [
    {
      id: 'resolved',
      label: 'The caller resolves "web"',
      description: 'The caller Pod looks up web.default.svc.cluster.local in cluster DNS (CoreDNS). It gets back the Service\'s stable ClusterIP: 10.96.5.17. This IP never changes for the life of the Service.',
      edgeOverrides: { 'c-s': { animated: true } },
    },
    {
      id: 'endpoints',
      label: 'The Service\'s selector matches Pod labels',
      description: 'The endpoints controller watches Pods matching selector app=web. Right now that\'s Pods A and B. Pod C has label app=batch, so it is excluded — the Service never sends traffic to it.',
      nodeOverrides: { p3: { status: 'inactive', label: 'Pod C — not selected' } },
      edgeOverrides: { 's-ep': { animated: true } },
    },
    {
      id: 'load-balance',
      label: 'kube-proxy load-balances to a backing Pod',
      description: 'On the caller\'s node, kube-proxy has programmed iptables/IPVS rules: traffic to 10.96.5.17 is DNAT\'d to one of the current Endpoint Pod IPs, round-robin by default. The caller is unaware of which Pod it hit.',
      nodeOverrides: { p3: { status: 'inactive' } },
      edgeOverrides: { 'ep-p1': { animated: true, flow: 'allow' } },
    },
    {
      id: 'pod-removed',
      label: 'A Pod goes away — Endpoints updates',
      description: 'Pod A is deleted. The endpoints controller removes its IP from the EndpointSlice within a second; kube-proxy on every node reprograms its rules. New requests from the caller go only to Pod B. The caller never saw a broken connection string — that is the point of the Service.',
      nodeOverrides: {
        p1: { status: 'error', label: 'Pod A — deleted' },
        p3: { status: 'inactive' },
      },
      edgeOverrides: {
        'ep-p1': { flow: 'deny' },
        'ep-p2': { animated: true, flow: 'allow' },
      },
    },
  ],
};
