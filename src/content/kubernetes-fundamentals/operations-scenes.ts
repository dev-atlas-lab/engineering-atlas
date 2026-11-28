// SVG scene definitions for Slice 3B operations concepts. These compose
// through the existing SceneDefinition primitives; no new visualization
// framework is introduced.

import type { SceneDefinition } from '../../engines/visualization/types';

// --- 1. Pod Lifecycle State Machine ---------------------------------------
// A directed graph of Pod phase transitions: Pending → Running → (Succeeded
// | Failed), with the Unknown branch and the kubelet-driven container
// restart loop that keeps a Pod in Running while its container churns.

export const podLifecycleScene: SceneDefinition = {
  id: 'k8s-pod-lifecycle',
  type: 'topology',
  title: 'Pod lifecycle phases',
  description: 'A Pod moves through Pending, Running, and a terminal phase (Succeeded or Failed). Container restarts happen within Running — a restart does not change the Pod phase.',
  nodes: [
    { id: 'pending', type: 'function', label: 'Pending', position: { x: 60, y: 180 }, data: { Means: 'Accepted but containers not running' }, status: 'active' },
    { id: 'scheduled', type: 'function', label: 'Scheduled', position: { x: 260, y: 180 }, data: { Means: 'Pod assigned a node, kubelet pulling image' } },
    { id: 'running', type: 'function', label: 'Running', position: { x: 460, y: 180 }, data: { Means: 'At least one container is started' } },
    { id: 'succeeded', type: 'function', label: 'Succeeded', position: { x: 660, y: 100 }, data: { Means: 'All containers exited with success' } },
    { id: 'failed', type: 'function', label: 'Failed', position: { x: 660, y: 260 }, data: { Means: 'All containers terminated, at least one failed' } },
    { id: 'unknown', type: 'function', label: 'Unknown', position: { x: 460, y: 340 }, data: { Means: 'Node contact lost — phase cannot be determined' } },
    { id: 'restart', type: 'function', label: 'Container restart (within Running)', position: { x: 460, y: 60 }, data: { Driver: 'kubelet enforces restartPolicy' } },
  ],
  edges: [
    { id: 'p-s', source: 'pending', target: 'scheduled', edgeType: 'dependency', label: 'scheduled' },
    { id: 's-r', source: 'scheduled', target: 'running', edgeType: 'dependency', label: 'image pulled, containers up' },
    { id: 'r-su', source: 'running', target: 'succeeded', edgeType: 'dependency', label: 'all exit 0' },
    { id: 'r-fa', source: 'running', target: 'failed', edgeType: 'dependency', label: 'terminal failure' },
    { id: 'r-un', source: 'running', target: 'unknown', edgeType: 'dependency', label: 'node NotReady' },
    { id: 'r-rs', source: 'running', target: 'restart', edgeType: 'dependency', label: 'container exits + restartPolicy' },
    { id: 'rs-r', source: 'restart', target: 'running', edgeType: 'dependency', label: 'new container up' },
  ],
  states: [
    {
      id: 'overview',
      label: 'The phase graph at rest',
      description: 'Phase is a coarse status, not a fine-grained lifecycle. Pending covers everything from object creation to container pull; Running covers everything while at least one container exists.',
    },
    {
      id: 'restart-loop',
      label: 'A container restart does not change the phase',
      description: 'Restart within Running is a container-level event — the Pod phase stays Running. This is why "Running" does not mean "healthy".',
      nodeOverrides: { running: { status: 'active' }, restart: { status: 'active' } },
      edgeOverrides: { 'r-rs': { animated: true }, 'rs-r': { animated: true } },
    },
    {
      id: 'terminal',
      label: 'Terminal phases',
      description: 'Succeeded and Failed are terminal — Pods do not leave them. A new rollout replaces them with new Pods rather than reviving them.',
      nodeOverrides: { succeeded: { status: 'active' }, failed: { status: 'error' } },
    },
  ],
};

// --- 2. Probe Execution and Health Decisions ------------------------------

export const probeExecutionScene: SceneDefinition = {
  id: 'k8s-probe-execution',
  type: 'topology',
  title: 'Probe execution and effects',
  description: 'The kubelet runs three probe kinds against a container. Each kind triggers a different effect: startup gates the others, liveness restarts the container, readiness toggles Service endpoint membership.',
  nodes: [
    { id: 'kubelet', type: 'server', label: 'kubelet', position: { x: 60, y: 180 }, data: { Does: 'Executes all three probe kinds per container' }, status: 'active' },
    { id: 'container', type: 'server', label: 'Container', position: { x: 300, y: 180 }, data: { State: 'running' }, status: 'active' },
    { id: 'startup', type: 'policy', label: 'Startup probe', position: { x: 300, y: 40 }, data: { Fails: 'kubelet restarts container' } },
    { id: 'liveness', type: 'policy', label: 'Liveness probe', position: { x: 540, y: 40 }, data: { Fails: 'kubelet restarts container' } },
    { id: 'readiness', type: 'policy', label: 'Readiness probe', position: { x: 540, y: 180 }, data: { Fails: 'Pod removed from Service endpoints' } },
    { id: 'endpoints', type: 'network', label: 'EndpointSlice', position: { x: 780, y: 180 }, data: { Stores: 'Pod IPs for one Service' } },
    { id: 'service', type: 'loadbalancer', label: 'Service', position: { x: 780, y: 300 }, data: { Routes: 'Traffic to endpoints' } },
    { id: 'restart', type: 'function', label: 'Restart container', position: { x: 60, y: 60 }, data: { Driver: 'restartPolicy' } },
  ],
  edges: [
    { id: 'kubelet-startup', source: 'kubelet', target: 'startup', edgeType: 'dependency', label: 'run probe' },
    { id: 'kubelet-liveness', source: 'kubelet', target: 'liveness', edgeType: 'dependency', label: 'run probe' },
    { id: 'kubelet-readiness', source: 'kubelet', target: 'readiness', edgeType: 'dependency', label: 'run probe' },
    { id: 'startup-container', source: 'startup', target: 'container', edgeType: 'dependency', label: 'target' },
    { id: 'liveness-container', source: 'liveness', target: 'container', edgeType: 'dependency', label: 'target' },
    { id: 'readiness-container', source: 'readiness', target: 'container', edgeType: 'dependency', label: 'target' },
    { id: 'startup-restart', source: 'startup', target: 'restart', edgeType: 'request', label: 'fail → kill' },
    { id: 'liveness-restart', source: 'liveness', target: 'restart', edgeType: 'request', label: 'fail → kill' },
    { id: 'readiness-endpoints', source: 'readiness', target: 'endpoints', edgeType: 'request', label: 'fail → remove IP' },
    { id: 'endpoints-service', source: 'endpoints', target: 'service', edgeType: 'data', label: 'serves to' },
    { id: 'restart-container', source: 'restart', target: 'container', edgeType: 'dependency', label: 'new container' },
  ],
  states: [
    {
      id: 'overview',
      label: 'The three probe kinds',
      description: 'Startup gates the others. While startup is running, liveness and readiness are suspended — a slow boot cannot cause a restart.',
    },
    {
      id: 'startup-passes',
      label: 'Startup succeeds — liveness/readiness take over',
      description: 'Once startup reports success enough times, the kubelet stops running it and begins running liveness and readiness every period.',
      edgeOverrides: { 'kubelet-liveness': { animated: true }, 'kubelet-readiness': { animated: true } },
    },
    {
      id: 'readiness-fails',
      label: 'Readiness fails — Pod removed from endpoints',
      description: 'The container keeps running. Only the EndpointSlice is edited: kube-proxy stops routing new connections to this Pod.',
      nodeOverrides: { readiness: { status: 'error' } },
      edgeOverrides: { 'readiness-endpoints': { animated: true, flow: 'deny' } },
    },
    {
      id: 'liveness-fails',
      label: 'Liveness fails — container is killed',
      description: 'The kubelet sends SIGTERM, then SIGKILL after terminationGracePeriodSeconds, and starts a new container per restartPolicy.',
      nodeOverrides: { liveness: { status: 'error' }, container: { status: 'inactive' } },
      edgeOverrides: { 'liveness-restart': { animated: true, flow: 'deny' }, 'restart-container': { animated: true } },
    },
  ],
};

// --- 3. Scheduler Placement Constraints -----------------------------------

export const schedulerConstraintsScene: SceneDefinition = {
  id: 'k8s-scheduler-constraints',
  type: 'topology',
  title: 'Scheduler — filter and score with constraints',
  description: 'For every Pod, kube-scheduler filters nodes that fail hard requirements (nodeSelector, taints, resources) and scores the survivors with soft preferences (affinity, spread).',
  nodes: [
    { id: 'scheduler', type: 'policy', label: 'kube-scheduler', position: { x: 60, y: 180 }, data: { Model: 'filter + score' }, status: 'active' },
    { id: 'filter', type: 'function', label: 'Filter plugins', position: { x: 260, y: 100 }, data: { Checks: 'resources, nodeSelector, taints' } },
    { id: 'score', type: 'function', label: 'Score plugins', position: { x: 260, y: 260 }, data: { Checks: 'spread, affinity, least allocated' } },
    { id: 'n1', type: 'server', label: 'Node A (zone-1)', position: { x: 500, y: 60 }, data: { Free: '3 CPU / 6 GiB' }, status: 'active' },
    { id: 'n2', type: 'server', label: 'Node B (zone-1)', position: { x: 500, y: 160 }, data: { Free: '2 CPU / 5 GiB' } },
    { id: 'n3', type: 'server', label: 'Node C (zone-2, gpu, taint)', position: { x: 500, y: 260 }, data: { Free: '7 CPU / 14 GiB' } },
    { id: 'n4', type: 'server', label: 'Node D (zone-2)', position: { x: 500, y: 360 }, data: { Free: '1 CPU / 2 GiB' } },
    { id: 'bind', type: 'policy', label: 'Bind to best node', position: { x: 760, y: 180 }, data: { Writes: 'pod.spec.nodeName' } },
  ],
  edges: [
    { id: 's-f', source: 'scheduler', target: 'filter', edgeType: 'dependency', label: 'phase 1' },
    { id: 's-sc', source: 'scheduler', target: 'score', edgeType: 'dependency', label: 'phase 2' },
    { id: 'f-n1', source: 'filter', target: 'n1', edgeType: 'request', flow: 'allow', label: 'ok' },
    { id: 'f-n2', source: 'filter', target: 'n2', edgeType: 'request', flow: 'allow', label: 'ok' },
    { id: 'f-n3', source: 'filter', target: 'n3', edgeType: 'request', flow: 'deny', label: 'taint not tolerated' },
    { id: 'f-n4', source: 'filter', target: 'n4', edgeType: 'request', flow: 'deny', label: 'insufficient CPU' },
    { id: 'sc-n1', source: 'score', target: 'n1', edgeType: 'data', label: 'score 78' },
    { id: 'sc-n2', source: 'score', target: 'n2', edgeType: 'data', label: 'score 42' },
    { id: 'n1-bind', source: 'n1', target: 'bind', edgeType: 'response', label: 'highest score' },
  ],
  boundaries: [
    { id: 'z1', label: 'zone-1', kind: 'zone', nodeIds: ['n1', 'n2'] },
    { id: 'z2', label: 'zone-2', kind: 'zone', nodeIds: ['n3', 'n4'] },
  ],
  states: [
    {
      id: 'overview',
      label: 'Two phases, one decision',
      description: 'Filter is predicate-only: each plugin either accepts or rejects a node. Score is numeric: higher wins; ties are broken by node name hash for determinism.',
    },
    {
      id: 'filtering',
      label: 'Filter: reject nodes that fail a hard constraint',
      description: 'Node C is filtered by its NoSchedule taint (Pod has no matching toleration). Node D is filtered by insufficient CPU. A nodeSelector miss would filter too.',
      nodeOverrides: { n3: { status: 'error' }, n4: { status: 'error' } },
    },
    {
      id: 'scoring',
      label: 'Score: rank the survivors',
      description: 'Node A scores higher than Node B because it has more free capacity and (with topology spread) its zone has fewer pods of this workload.',
      nodeOverrides: { n1: { status: 'active' } },
      edgeOverrides: { 'sc-n1': { animated: true } },
    },
    {
      id: 'binding',
      label: 'Bind: write nodeName',
      description: 'The scheduler issues one API call that sets spec.nodeName. The kubelet on that node sees the change, pulls the image, and starts the containers.',
      edgeOverrides: { 'n1-bind': { animated: true, flow: 'allow' } },
    },
  ],
};

// --- 4. CPU/Memory Requests and Limits ------------------------------------

export const resourceRequestsAndLimitsScene: SceneDefinition = {
  id: 'k8s-requests-and-limits',
  type: 'topology',
  title: 'Requests and limits on a container',
  description: 'Requests reserve capacity for the scheduler; limits cap enforced usage by the kernel. CPU over-limit → throttled; memory over-limit → OOMKilled.',
  nodes: [
    { id: 'spec', type: 'policy', label: 'PodSpec', position: { x: 60, y: 200 }, data: { Has: 'resources: requests + limits' } },
    { id: 'sched', type: 'policy', label: 'Scheduler', position: { x: 260, y: 80 }, data: { Uses: 'requests only (reserves on node)' } },
    { id: 'cgroup', type: 'firewall', label: 'cgroup (CPU)', position: { x: 260, y: 260 }, data: { Enforces: 'CPU limit via CFS quota' } },
    { id: 'memcg', type: 'firewall', label: 'cgroup (memory)', position: { x: 260, y: 360 }, data: { Enforces: 'Memory limit (hard, OOM-killer)' } },
    { id: 'node', type: 'server', label: 'Node', position: { x: 500, y: 80 }, data: { Capacity: 'allocatable minus sum(requests)' } },
    { id: 'throttle', type: 'function', label: 'CPU throttled', position: { x: 500, y: 260 }, data: { When: 'demand > CPU limit' } },
    { id: 'oom', type: 'function', label: 'OOMKilled + restart', position: { x: 500, y: 360 }, data: { When: 'demand > memory limit' } },
  ],
  edges: [
    { id: 'spec-sched', source: 'spec', target: 'sched', edgeType: 'data', label: 'requests' },
    { id: 'spec-cgroup', source: 'spec', target: 'cgroup', edgeType: 'data', label: 'cpu limit' },
    { id: 'spec-mem', source: 'spec', target: 'memcg', edgeType: 'data', label: 'memory limit' },
    { id: 'sched-node', source: 'sched', target: 'node', edgeType: 'request', label: 'fits?' },
    { id: 'cgroup-throttle', source: 'cgroup', target: 'throttle', edgeType: 'request', label: 'over limit' },
    { id: 'memcg-oom', source: 'memcg', target: 'oom', edgeType: 'request', label: 'over limit' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Two different fields, two different jobs',
      description: 'Requests are scheduler input; limits are kernel enforcement. Omitting requests means the scheduler assumes zero — which can lead to over-committed nodes.',
    },
    {
      id: 'cpu-over-limit',
      label: 'CPU above limit → throttled',
      description: 'CFS quota caps CPU use at the limit. Excess demand becomes throttled time (nr_throttled rises); nothing is killed.',
      nodeOverrides: { cgroup: { status: 'active' }, throttle: { status: 'error' } },
      edgeOverrides: { 'cgroup-throttle': { animated: true, flow: 'blocked' } },
    },
    {
      id: 'memory-over-limit',
      label: 'Memory above limit → OOMKilled',
      description: 'Memory is uncompressible. When RSS crosses the limit, the kernel OOM-killer terminates the container; restartPolicy decides what happens next.',
      nodeOverrides: { memcg: { status: 'active' }, oom: { status: 'error' } },
      edgeOverrides: { 'memcg-oom': { animated: true, flow: 'deny' } },
    },
  ],
};

// --- 5. HPA Scaling Workflow ---------------------------------------------

export const hpaScalingScene: SceneDefinition = {
  id: 'k8s-hpa-workflow',
  type: 'topology',
  title: 'Horizontal Pod Autoscaler reconcile',
  description: 'Every reconcile period, the HPA reads a metric, computes desiredReplicas from the target ratio, applies stabilization and clamps, then edits the Deployment.',
  nodes: [
    { id: 'pods', type: 'function', label: 'Pods (current)', position: { x: 60, y: 200 }, data: { } },
    { id: 'metrics-server', type: 'server', label: 'Metrics Server', position: { x: 260, y: 200 }, data: { Serves: 'resource metrics API (CPU, memory)' } },
    { id: 'hpa', type: 'policy', label: 'HPA controller', position: { x: 460, y: 200 }, data: { Does: 'desired = ceil(current * util / target)' }, status: 'active' },
    { id: 'stabilize', type: 'policy', label: 'Stabilization window', position: { x: 460, y: 80 }, data: { Guards: 'scale-down thrash' } },
    { id: 'clamp', type: 'policy', label: 'Clamp to [min,max]', position: { x: 460, y: 320 }, data: { Bounds: 'minReplicas, maxReplicas' } },
    { id: 'deployment', type: 'server', label: 'Deployment', position: { x: 680, y: 200 }, data: { Edits: 'spec.replicas' } },
  ],
  edges: [
    { id: 'pods-ms', source: 'pods', target: 'metrics-server', edgeType: 'data', label: 'cAdvisor samples' },
    { id: 'ms-hpa', source: 'metrics-server', target: 'hpa', edgeType: 'data', label: 'per-Pod util' },
    { id: 'hpa-stab', source: 'hpa', target: 'stabilize', edgeType: 'dependency' },
    { id: 'hpa-clamp', source: 'hpa', target: 'clamp', edgeType: 'dependency' },
    { id: 'hpa-dep', source: 'hpa', target: 'deployment', edgeType: 'request', label: 'set replicas' },
  ],
  states: [
    {
      id: 'overview',
      label: 'One reconcile loop, every 15s',
      description: 'The HPA does not read Prometheus — it reads the Metrics API (metrics.k8s.io for CPU/memory, external/custom APIs for other signals).',
    },
    {
      id: 'scale-up',
      label: 'Scale up: current util above target',
      description: 'desiredReplicas > currentReplicas → clamp to maxReplicas → edit Deployment. Scale-up is applied immediately (no stabilization window by default).',
      edgeOverrides: { 'pods-ms': { animated: true }, 'ms-hpa': { animated: true }, 'hpa-dep': { animated: true, flow: 'allow' } },
    },
    {
      id: 'scale-down-blocked',
      label: 'Scale down blocked by stabilization',
      description: 'desiredReplicas < currentReplicas is kept in a window (default 300s); only the lowest recommendation in the window takes effect, which absorbs brief dips.',
      nodeOverrides: { stabilize: { status: 'active' } },
      edgeOverrides: { 'hpa-stab': { animated: true } },
    },
  ],
};

// --- 6. Rolling Update Lifecycle -----------------------------------------

export const rollingUpdateScene: SceneDefinition = {
  id: 'k8s-rolling-update',
  type: 'topology',
  title: 'Rolling update across two ReplicaSets',
  description: 'The Deployment controller creates a new ReplicaSet beside the old one and alternates surge-up / scale-down bounded by maxSurge and maxUnavailable.',
  nodes: [
    { id: 'deployment', type: 'policy', label: 'Deployment', position: { x: 60, y: 200 }, data: { Owns: 'ReplicaSets, applies strategy' } },
    { id: 'old-rs', type: 'server', label: 'Old ReplicaSet (v1)', position: { x: 300, y: 80 }, data: { Desired: '3 → 0' } },
    { id: 'new-rs', type: 'server', label: 'New ReplicaSet (v2)', position: { x: 300, y: 320 }, data: { Desired: '0 → 3' }, status: 'active' },
    { id: 'pod-v1a', type: 'function', label: 'Pod v1-a', position: { x: 540, y: 20 }, data: { Ready: 'yes' } },
    { id: 'pod-v1b', type: 'function', label: 'Pod v1-b', position: { x: 540, y: 90 }, data: { Ready: 'yes' } },
    { id: 'pod-v1c', type: 'function', label: 'Pod v1-c', position: { x: 540, y: 160 }, data: { Ready: 'terminating' } },
    { id: 'pod-v2a', type: 'function', label: 'Pod v2-a', position: { x: 540, y: 260 }, data: { Ready: 'yes' }, status: 'active' },
    { id: 'pod-v2b', type: 'function', label: 'Pod v2-b', position: { x: 540, y: 330 }, data: { Ready: 'starting' } },
  ],
  edges: [
    { id: 'd-old', source: 'deployment', target: 'old-rs', edgeType: 'dependency', label: 'scale down' },
    { id: 'd-new', source: 'deployment', target: 'new-rs', edgeType: 'dependency', label: 'scale up' },
    { id: 'old-a', source: 'old-rs', target: 'pod-v1a', edgeType: 'dependency' },
    { id: 'old-b', source: 'old-rs', target: 'pod-v1b', edgeType: 'dependency' },
    { id: 'old-c', source: 'old-rs', target: 'pod-v1c', edgeType: 'dependency' },
    { id: 'new-a', source: 'new-rs', target: 'pod-v2a', edgeType: 'dependency' },
    { id: 'new-b', source: 'new-rs', target: 'pod-v2b', edgeType: 'dependency' },
  ],
  states: [
    {
      id: 'overview',
      label: 'The new RS grows while the old RS shrinks',
      description: 'Each reconcile adds one Pod to the new RS until maxSurge is hit, waits for readiness, then removes one from the old RS — never breaching maxUnavailable.',
    },
    {
      id: 'surge',
      label: 'Surge: new Pod created',
      description: 'A v2 Pod is added. Total Pods temporarily exceeds the desired count by up to maxSurge.',
      nodeOverrides: { 'pod-v2b': { status: 'active' } },
      edgeOverrides: { 'd-new': { animated: true } },
    },
    {
      id: 'scale-down',
      label: 'Scale-down: old Pod terminated',
      description: 'Only once the new Pod is Ready does the controller terminate one v1 Pod. If readiness never happens, the rollout stalls — as intended.',
      nodeOverrides: { 'pod-v1c': { status: 'error' } },
      edgeOverrides: { 'd-old': { animated: true } },
    },
  ],
};

// --- 7. Blue-Green vs Canary Deployment -----------------------------------

export const blueGreenCanaryScene: SceneDefinition = {
  id: 'k8s-bluegreen-vs-canary',
  type: 'topology',
  title: 'Blue-Green vs Canary — traffic shape and risk',
  description: 'Blue-Green keeps two full stacks and switches all traffic at once; Canary runs a small slice of v2 alongside v1 and grows it.',
  nodes: [
    { id: 'svc', type: 'loadbalancer', label: 'Service / Ingress', position: { x: 60, y: 200 }, data: { Routes: 'according to selector or weights' }, status: 'active' },
    // blue-green column
    { id: 'blue', type: 'server', label: 'Blue (v1)', position: { x: 300, y: 80 }, data: { Replicas: '3', Receiving: '100%' }, status: 'active' },
    { id: 'green', type: 'server', label: 'Green (v2)', position: { x: 300, y: 200 }, data: { Replicas: '3', Receiving: '0%' } },
    // canary column
    { id: 'canary-v1', type: 'server', label: 'v1 (stable)', position: { x: 540, y: 80 }, data: { Replicas: '9', Receiving: '90%' }, status: 'active' },
    { id: 'canary-v2', type: 'server', label: 'v2 (canary)', position: { x: 540, y: 200 }, data: { Replicas: '1', Receiving: '10%' }, status: 'active' },
    { id: 'cutover', type: 'policy', label: 'Cutover event', position: { x: 300, y: 340 }, data: { When: 'validate → flip selector' } },
    { id: 'promote', type: 'policy', label: 'Promote step', position: { x: 540, y: 340 }, data: { When: 'validate → increase %' } },
  ],
  edges: [
    { id: 's-blue', source: 'svc', target: 'blue', edgeType: 'request', flow: 'allow', label: '100%' },
    { id: 's-green', source: 'svc', target: 'green', edgeType: 'request', flow: 'blocked', label: '0%' },
    { id: 's-v1', source: 'svc', target: 'canary-v1', edgeType: 'request', flow: 'allow', label: '90%' },
    { id: 's-v2', source: 'svc', target: 'canary-v2', edgeType: 'request', flow: 'allow', label: '10%' },
    { id: 'blue-cut', source: 'blue', target: 'cutover', edgeType: 'dependency' },
    { id: 'green-cut', source: 'green', target: 'cutover', edgeType: 'dependency' },
    { id: 'v1-prom', source: 'canary-v1', target: 'promote', edgeType: 'dependency' },
    { id: 'v2-prom', source: 'canary-v2', target: 'promote', edgeType: 'dependency' },
  ],
  boundaries: [
    { id: 'bg', label: 'Blue-Green', kind: 'scope', nodeIds: ['blue', 'green', 'cutover'] },
    { id: 'can', label: 'Canary', kind: 'scope', nodeIds: ['canary-v1', 'canary-v2', 'promote'] },
  ],
  states: [
    {
      id: 'overview',
      label: 'Two shapes, two risks',
      description: 'Blue-Green: zero blast radius until cutover, big blast radius after. Canary: bounded blast radius throughout, longer wall time to full rollout.',
    },
    {
      id: 'cutover',
      label: 'Blue-Green cutover',
      description: 'Flip the Service selector to green. 100% of traffic lands on v2 in one step; rollback is the reverse flip.',
      edgeOverrides: { 's-blue': { flow: 'blocked', label: '0%' }, 's-green': { flow: 'allow', label: '100%' } },
      nodeOverrides: { green: { status: 'active' }, blue: { status: 'inactive' } },
    },
    {
      id: 'promote',
      label: 'Canary promote',
      description: 'Scale v2 up while scaling v1 down — the Service weights shift gradually. Error-rate guards decide whether to continue or roll back.',
      edgeOverrides: { 's-v2': { label: '50%' }, 's-v1': { label: '50%' } },
    },
  ],
};
