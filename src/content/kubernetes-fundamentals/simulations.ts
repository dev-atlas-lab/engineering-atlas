import type { SimulationDefinition } from '../../engines/simulation/types';

// --- Scheduler simulator ---------------------------------------------------
// A deterministic two-phase scheduling model: filter out nodes that can't fit
// the Pod (CPU/memory requests), then score the survivors by remaining
// capacity (least-loaded wins) and bind the Pod to the winner.

export interface ScheduledPodView {
  nodeId: string;
  score: number;
  filteredOut: boolean;
  reason?: string;
}

export interface SchedulerNodeState {
  id: string;
  cpu: number; // whole CPU units
  memoryGb: number;
  cpuAllocated: number;
  memoryAllocated: number;
  evaluation?: ScheduledPodView;
}

export interface SchedulerState {
  pod: { cpu: number; memoryGb: number };
  nodes: SchedulerNodeState[];
  chosenNodeId: string | null;
  unschedulable: boolean;
}

const SCHED_NODES: SchedulerNodeState[] = [
  { id: 'node-1', cpu: 4, memoryGb: 8, cpuAllocated: 1, memoryAllocated: 2 },
  { id: 'node-2', cpu: 4, memoryGb: 8, cpuAllocated: 3.5, memoryAllocated: 7 },
  { id: 'node-3', cpu: 2, memoryGb: 4, cpuAllocated: 0.5, memoryAllocated: 1 },
];

function evaluateNode(node: SchedulerNodeState, pod: { cpu: number; memoryGb: number }): ScheduledPodView {
  const cpuFree = node.cpu - node.cpuAllocated;
  const memFree = node.memoryGb - node.memoryAllocated;
  if (cpuFree < pod.cpu) {
    return { nodeId: node.id, score: 0, filteredOut: true, reason: `insufficient CPU (${cpuFree.toFixed(2)} free, needs ${pod.cpu})` };
  }
  if (memFree < pod.memoryGb) {
    return { nodeId: node.id, score: 0, filteredOut: true, reason: `insufficient memory (${memFree.toFixed(1)} GiB free, needs ${pod.memoryGb})` };
  }
  // Score: prefer the node whose utilization *after* placement would be lowest
  // (LeastAllocated priority, simplified).
  const utilAfter = ((node.cpuAllocated + pod.cpu) / node.cpu + (node.memoryAllocated + pod.memoryGb) / node.memoryGb) / 2;
  const score = Math.max(0, Math.round((1 - utilAfter) * 100));
  return { nodeId: node.id, score, filteredOut: false };
}

export const schedulerSimulation: SimulationDefinition<SchedulerState> = {
  id: 'scheduler-simulator',
  title: 'Kubernetes Scheduler',
  description:
    'Picks a node for one Pod using the real two-phase model: filter out nodes that can\'t fit the Pod\'s CPU/memory requests, then score survivors by remaining capacity and bind to the highest-scoring node. Deterministic — the same inputs always produce the same decision.',
  parameters: [
    { key: 'cpu', label: 'Pod CPU request (cores)', type: 'select', default: 1, options: [
      { label: '0.25 cores', value: 0.25 },
      { label: '0.5 cores', value: 0.5 },
      { label: '1 core', value: 1 },
      { label: '2 cores', value: 2 },
      { label: '3 cores', value: 3 },
    ], description: 'CPU the Pod asks for. Scheduling uses this request, not any observed usage.' },
    { key: 'memoryGb', label: 'Pod memory request (GiB)', type: 'select', default: 2, options: [
      { label: '0.5 GiB', value: 0.5 },
      { label: '1 GiB', value: 1 },
      { label: '2 GiB', value: 2 },
      { label: '4 GiB', value: 4 },
      { label: '6 GiB', value: 6 },
    ], description: 'Memory the Pod asks for.' },
  ],
  createInitialState: (params) => ({
    pod: { cpu: Number(params.cpu), memoryGb: Number(params.memoryGb) },
    nodes: SCHED_NODES.map((n) => ({ ...n })),
    chosenNodeId: null,
    unschedulable: false,
  }),
  steps: (params) => {
    const pod = { cpu: Number(params.cpu), memoryGb: Number(params.memoryGb) };
    const steps = SCHED_NODES.map((node) => ({
      id: `evaluate-${node.id}`,
      label: `Filter + score ${node.id}`,
      description: `Check whether ${node.id} has enough free capacity for the Pod, and if so, score it by least-allocated-after-placement.`,
      apply: (state: SchedulerState): SchedulerState => {
        const evaluation = evaluateNode(node, pod);
        return {
          ...state,
          nodes: state.nodes.map((n) => (n.id === node.id ? { ...n, evaluation } : n)),
        };
      },
    }));
    const bindStep = {
      id: 'bind',
      label: 'Bind the Pod to the highest-scoring node',
      description:
        'The scheduler picks the feasible node with the highest score and writes nodeName onto the Pod. If every node was filtered out, the Pod stays Pending — the cluster is at capacity for this request.',
      apply: (state: SchedulerState): SchedulerState => {
        const feasible = state.nodes.filter((n) => n.evaluation && !n.evaluation.filteredOut);
        if (feasible.length === 0) return { ...state, unschedulable: true };
        const winner = feasible.reduce((best, n) => ((n.evaluation!.score > (best.evaluation?.score ?? -1)) ? n : best), feasible[0]!);
        return { ...state, chosenNodeId: winner.id };
      },
    };
    return [...steps, bindStep];
  },
};

// --- Deployment scaling simulator -----------------------------------------

export type PodHealth = 'running' | 'pending' | 'failed';

export interface DeploymentPod {
  id: string;
  version: string;
  health: PodHealth;
}

export interface DeploymentState {
  desiredReplicas: number;
  rolloutVersion: string;
  pods: DeploymentPod[];
  events: string[];
}

export type DeploymentEventKind = 'scale' | 'kill-pod' | 'update-image';

export interface DeploymentEvent {
  kind: DeploymentEventKind;
  // for scale
  target?: number;
  // for update-image
  newVersion?: string;
  // for kill-pod
  podIndex?: number;
}

/**
 * Applies one event to a deployment state and returns the resulting state
 * plus a human-readable description. Pure function — no randomness, no
 * wall-clock dependence. Exported for direct unit testing.
 */
export function applyDeploymentEvent(state: DeploymentState, event: DeploymentEvent): { state: DeploymentState; description: string } {
  if (event.kind === 'scale' && event.target !== undefined) {
    const target = event.target;
    const current = state.pods.filter((p) => p.health !== 'failed');
    if (target > current.length) {
      const newPods = Array.from({ length: target - current.length }, (_, i) => ({
        id: `pod-${state.pods.length + i + 1}`,
        version: state.rolloutVersion,
        health: 'running' as PodHealth,
      }));
      return {
        state: {
          ...state,
          desiredReplicas: target,
          pods: [...state.pods, ...newPods],
          events: [...state.events, `Scale to ${target}: ReplicaSet created ${newPods.length} new Pod(s)`],
        },
        description: `The Deployment spec went from ${current.length} to ${target} replicas. The ReplicaSet created ${newPods.length} new Pod(s). The Deployment itself did not create Pods — only the ReplicaSet did.`,
      };
    }
    if (target < current.length) {
      const keep = current.slice(0, target);
      const remove = current.slice(target).length;
      return {
        state: {
          ...state,
          desiredReplicas: target,
          pods: [...keep, ...state.pods.filter((p) => p.health === 'failed')],
          events: [...state.events, `Scale to ${target}: ReplicaSet removed ${remove} Pod(s)`],
        },
        description: `The Deployment spec went from ${current.length} to ${target} replicas. The ReplicaSet removed ${remove} running Pod(s).`,
      };
    }
    return { state, description: `Already at ${target} replicas — no change.` };
  }
  if (event.kind === 'kill-pod' && event.podIndex !== undefined) {
    const running = state.pods
      .map((p, i) => ({ pod: p, index: i }))
      .filter(({ pod }) => pod.health === 'running');
    const victimEntry = running[event.podIndex] ?? running[0];
    if (!victimEntry) return { state, description: 'No running Pod to kill.' };
    const nextPods = state.pods.map((p, i) => (i === victimEntry.index ? { ...p, health: 'failed' as PodHealth } : p));
    const healthy = nextPods.filter((p) => p.health === 'running').length;
    const missing = state.desiredReplicas - healthy;
    const replacements = Array.from({ length: Math.max(0, missing) }, (_, i) => ({
      id: `pod-${state.pods.length + i + 1}`,
      version: state.rolloutVersion,
      health: 'running' as PodHealth,
    }));
    return {
      state: {
        ...state,
        pods: [...nextPods, ...replacements],
        events: [
          ...state.events,
          `${victimEntry.pod.id} failed; ReplicaSet created ${replacements.length} replacement(s)`,
        ],
      },
      description: `Pod ${victimEntry.pod.id} was killed. The ReplicaSet's reconciliation loop observed the count fell to ${healthy} (desired is ${state.desiredReplicas}) and created ${replacements.length} replacement Pod(s). Self-healing is this loop — not a special failure handler.`,
    };
  }
  if (event.kind === 'update-image' && event.newVersion) {
    const newVersion = event.newVersion;
    const upgraded = state.pods
      .filter((p) => p.health !== 'failed')
      .map((p) => ({ ...p, version: newVersion }));
    return {
      state: {
        ...state,
        rolloutVersion: newVersion,
        pods: [...upgraded, ...state.pods.filter((p) => p.health === 'failed')],
        events: [...state.events, `Rolling update to ${newVersion}: all Pods moved to new ReplicaSet`],
      },
      description: `The Deployment's template image changed to ${newVersion}. In a real rollout this proceeds one Pod at a time (maxSurge/maxUnavailable); this simulator shows the end state after convergence — every replica now runs ${newVersion}.`,
    };
  }
  return { state, description: 'No-op.' };
}

export const deploymentScalingSimulation: SimulationDefinition<DeploymentState> = {
  id: 'deployment-scaling-simulator',
  title: 'Deployment Scaling',
  description:
    'Starts with a Deployment of a chosen replica count, then runs a sequence of events — scale, kill a Pod (to show self-healing), rolling update. Each step is deterministic.',
  parameters: [
    { key: 'initialReplicas', label: 'Starting replicas', type: 'select', default: 3, options: [
      { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '5', value: 5 },
    ], description: 'The Deployment\'s initial replicas setting.' },
    { key: 'targetReplicas', label: 'Scale target', type: 'select', default: 5, options: [
      { label: '1', value: 1 }, { label: '3', value: 3 }, { label: '5', value: 5 }, { label: '7', value: 7 },
    ], description: 'What the Deployment is scaled to.' },
    { key: 'killPod', label: 'Simulate a Pod failure after scaling', type: 'boolean', default: true, description: 'After scaling, kill one running Pod to show ReplicaSet self-healing.' },
    { key: 'rolloutV2', label: 'Perform a rolling update to v2', type: 'boolean', default: true, description: 'After the Pod failure recovery, update the Deployment\'s image to v2.' },
  ],
  createInitialState: (params) => {
    const initial = Number(params.initialReplicas);
    return {
      desiredReplicas: initial,
      rolloutVersion: 'v1',
      pods: Array.from({ length: initial }, (_, i) => ({ id: `pod-${i + 1}`, version: 'v1', health: 'running' as PodHealth })),
      events: [`Deployment created with ${initial} replicas of v1`],
    };
  },
  steps: (params) => {
    const scaleTo = Number(params.targetReplicas);
    const steps: { id: string; label: string; description: string; apply: (s: DeploymentState) => DeploymentState }[] = [
      {
        id: 'scale',
        label: `Scale to ${scaleTo} replicas`,
        description: `kubectl scale --replicas=${scaleTo}. The Deployment edits its ReplicaSet; the ReplicaSet reconciles count.`,
        apply: (s) => applyDeploymentEvent(s, { kind: 'scale', target: scaleTo }).state,
      },
    ];
    if (params.killPod) {
      steps.push({
        id: 'kill',
        label: 'Kill one running Pod',
        description: 'Simulates a node or container failure. The ReplicaSet notices the count dropped and creates a replacement — no Deployment intervention needed.',
        apply: (s) => applyDeploymentEvent(s, { kind: 'kill-pod', podIndex: 0 }).state,
      });
    }
    if (params.rolloutV2) {
      steps.push({
        id: 'rollout',
        label: 'Rolling update to v2',
        description: 'kubectl set image updates the Deployment template. A new ReplicaSet is created for v2 and ramped up as the old one is ramped down.',
        apply: (s) => applyDeploymentEvent(s, { kind: 'update-image', newVersion: 'v2' }).state,
      });
    }
    return steps;
  },
};

// --- Reconciliation simulator ---------------------------------------------

export interface ReconciliationState {
  desired: number;
  actual: number;
  tick: number;
  log: string[];
  converged: boolean;
}

export const reconciliationSimulation: SimulationDefinition<ReconciliationState> = {
  id: 'reconciliation-simulator',
  title: 'Reconciliation Loop',
  description:
    'Drives a controller through the observe-diff-act loop under configurable drift: a Pod fails at tick 1, optionally a second fails later. Shows how self-healing is a consequence of the loop, not of a special failure handler.',
  parameters: [
    { key: 'desired', label: 'Desired replicas', type: 'select', default: 3, options: [
      { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '5', value: 5 },
    ], description: 'The desired state the controller is reconciling toward.' },
    { key: 'firstFailureTick', label: 'First Pod failure at tick', type: 'select', default: 1, options: [
      { label: 'tick 1', value: 1 }, { label: 'tick 2', value: 2 },
    ], description: 'When actual state first drifts below desired.' },
    { key: 'secondFailureTick', label: 'Second Pod failure at tick', type: 'select', default: 0, options: [
      { label: 'no second failure', value: 0 }, { label: 'tick 3', value: 3 }, { label: 'tick 4', value: 4 },
    ], description: 'Optional second drift event to show the loop reconverging.' },
  ],
  createInitialState: (params) => {
    const desired = Number(params.desired);
    return {
      desired,
      actual: desired,
      tick: 0,
      log: [`t=0: steady state. desired=${desired}, actual=${desired}.`],
      converged: true,
    };
  },
  steps: (params) => {
    const desired = Number(params.desired);
    const firstFailure = Number(params.firstFailureTick);
    const secondFailure = Number(params.secondFailureTick);
    const TICKS = 6;
    return Array.from({ length: TICKS }, (_, i) => {
      const t = i + 1;
      return {
        id: `tick-${t}`,
        label: `t=${t}`,
        description: `One iteration of the controller's observe-diff-act loop at tick ${t}.`,
        apply: (s: ReconciliationState): ReconciliationState => {
          let actual = s.actual;
          const events: string[] = [];
          if (t === firstFailure) {
            actual -= 1;
            events.push(`A Pod failed. actual=${actual}, desired=${desired}.`);
          }
          if (t === secondFailure && secondFailure > 0) {
            actual -= 1;
            events.push(`Another Pod failed. actual=${actual}, desired=${desired}.`);
          }
          const gap = desired - actual;
          if (gap > 0) {
            events.push(`Controller observed gap=${gap}. Creating ${gap} replacement Pod(s) via the API Server.`);
            actual += gap;
            events.push(`Replacement(s) scheduled and running. actual=${actual}=desired.`);
          } else if (events.length === 0) {
            events.push(`Observed desired=${desired}, actual=${actual}. No action — loop continues anyway.`);
          }
          const line = `t=${t}: ${events.join(' ')}`;
          return {
            ...s,
            tick: t,
            actual,
            log: [...s.log, line],
            converged: actual === desired,
          };
        },
      };
    });
  },
};

// --- Cluster Architecture Explorer (interactive component picker) ---------
// Exported via a static component catalog that the lab view renders — no
// stateful simulation is needed; the lab's purpose is inspection, not
// mutation. Shape is chosen to parallel the other labs (a view over a state)
// so the lab fits the existing SimulationLab + bindSimulation plumbing.

export interface ArchitectureComponent {
  id: string;
  name: string;
  tier: 'control-plane' | 'node';
  responsibilities: string[];
  internal: string;
  communicatesWith: string[];
  failure: string;
}

export const ARCHITECTURE_COMPONENTS: ArchitectureComponent[] = [
  {
    id: 'api-server', name: 'API Server', tier: 'control-plane',
    responsibilities: [
      'Validates, authenticates, authorizes, and admits every request',
      'Persists all cluster state to etcd — the only component that does',
      'Serves watch streams to every controller and kubelet',
    ],
    internal: 'Stateless REST server. Can be scaled horizontally; load-balanced in front. Request path: authn → authz → admission → validation → etcd write.',
    communicatesWith: ['etcd', 'scheduler', 'controller-manager', 'kubelet'],
    failure:
      'kubectl stops working. Controllers and kubelets lose their watches but keep running whatever they already know about — Pods stay up, but nothing new can be scheduled, scaled, or reconciled until the API Server returns.',
  },
  {
    id: 'etcd', name: 'etcd', tier: 'control-plane',
    responsibilities: [
      'Stores every Kubernetes object persistently',
      'Provides strongly-consistent reads and writes via the Raft consensus protocol',
    ],
    internal: 'Distributed key-value store, deployed in odd-sized clusters (3 or 5) for quorum. Prefers consistency over availability (CP in CAP). All writes go through a leader.',
    communicatesWith: ['api-server'],
    failure:
      'The API Server can\'t read or write, so the whole control plane effectively stops. Running workloads keep running — the kubelet on each node continues executing Pods it already knows about — but no changes can happen cluster-wide.',
  },
  {
    id: 'scheduler', name: 'Scheduler', tier: 'control-plane',
    responsibilities: [
      'Watches for Pods with no nodeName set',
      'Filters nodes that can\'t fit the Pod (predicates), then scores survivors (priorities)',
      'Binds the Pod to the chosen node by writing nodeName via the API Server',
    ],
    internal: 'Two-phase: filter then score. Does not run containers itself — its output is one API Server write per Pod. Pluggable via scheduling profiles.',
    communicatesWith: ['api-server'],
    failure:
      'New Pods stay Pending. Already-scheduled Pods are unaffected. A HA control plane usually runs multiple scheduler replicas with leader election so only one is active at a time.',
  },
  {
    id: 'controller-manager', name: 'Controller Manager', tier: 'control-plane',
    responsibilities: [
      'Hosts the built-in controllers (ReplicaSet, Deployment, Node, Endpoints, Job, …)',
      'Each controller watches its resource type and reconciles toward desired state',
    ],
    internal: 'One process, many controllers, each an independent observe-diff-act loop. All go through the API Server; none talk to etcd or kubelets directly.',
    communicatesWith: ['api-server'],
    failure:
      'Reconciliation stops: failed Pods are not replaced, Deployments don\'t roll out, Services\' Endpoints stop updating. Running Pods continue as-is until something changes that needs a controller to react.',
  },
  {
    id: 'kubelet', name: 'kubelet', tier: 'node',
    responsibilities: [
      'Watches the API Server for Pods assigned to its node',
      'Instructs the local container runtime to pull images and start/stop containers',
      'Runs liveness, readiness, and startup probes; reports Pod and node status',
    ],
    internal: 'One kubelet per node. Communicates with the container runtime through the CRI (Container Runtime Interface).',
    communicatesWith: ['api-server', 'container-runtime'],
    failure:
      'The node is marked NotReady after its lease expires. Its Pods are evicted after the configurable toleration period; they are re-scheduled to other nodes. The containers on the failing node keep running until the node actually goes down.',
  },
  {
    id: 'kube-proxy', name: 'kube-proxy', tier: 'node',
    responsibilities: [
      'Watches Services and EndpointSlices from the API Server',
      'Programs iptables or IPVS rules on the node to implement ClusterIPs',
    ],
    internal: 'Does not proxy traffic itself in the common iptables/IPVS modes — it only programs kernel rules. Traffic flows directly from a caller Pod to a backing Pod IP via DNAT.',
    communicatesWith: ['api-server'],
    failure:
      'Service traffic on that node breaks — ClusterIPs are not translated to Pod IPs. Pod-to-Pod traffic by direct IP still works. Services on other nodes are unaffected.',
  },
  {
    id: 'container-runtime', name: 'Container Runtime', tier: 'node',
    responsibilities: [
      'Pulls images, sets up namespaces/cgroups, starts and stops containers',
    ],
    internal: 'Typically containerd or CRI-O. Spoken to over the CRI by the kubelet. Not Docker-the-daemon any more — dockershim was removed in Kubernetes 1.24.',
    communicatesWith: ['kubelet'],
    failure:
      'The kubelet cannot start or stop containers. The node is effectively useless; existing containers may keep running until they exit or crash, but nothing new can replace them on this node.',
  },
];

export interface ArchitectureExplorerState {
  selectedId: string | null;
  // Tracks which components have been inspected so the lab can show progress.
  inspected: string[];
}

export const architectureExplorerSimulation: SimulationDefinition<ArchitectureExplorerState> = {
  id: 'cluster-architecture-explorer',
  title: 'Cluster Architecture Explorer',
  description:
    'Walks through each control plane and node component, showing responsibilities, internal behavior, who it communicates with, and what breaks when it fails.',
  parameters: [],
  createInitialState: () => ({ selectedId: null, inspected: [] }),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  steps: (_params) =>
    ARCHITECTURE_COMPONENTS.map((c) => ({
      id: `inspect-${c.id}`,
      label: `Inspect ${c.name}`,
      description: `Examine ${c.name} — what it does, how it does it, who it talks to, and what fails when it is down.`,
      apply: (state: ArchitectureExplorerState): ArchitectureExplorerState => ({
        selectedId: c.id,
        inspected: state.inspected.includes(c.id) ? state.inspected : [...state.inspected, c.id],
      }),
    })),
};
