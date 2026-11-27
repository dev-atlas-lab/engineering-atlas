// Eager metadata for the Kubernetes Architecture category.

import type { ConceptMeta } from '../../types';

export const clusterArchitecture: ConceptMeta = {
  id: 'kubernetes-cluster-architecture',
  title: 'Kubernetes Cluster Architecture',
  description: 'The split between a control plane and worker nodes, and how the components inside each cooperate to run workloads.',
  status: 'available',
  learningObjectives: [
    'Name the components that make up the control plane and the ones that run on every node',
    'Explain why the control plane is logically separate from the workloads it runs',
    'Trace how a user intent travels from kubectl to a running container',
  ],
  prerequisites: ['what-is-kubernetes'],
  relatedConcepts: ['control-plane', 'worker-nodes', 'kubernetes-api-server'],
  estimatedMinutes: 30,
  lessons: [
    { id: 'control-plane-and-nodes', title: 'Control Plane and Worker Nodes', kind: 'concept' },
    { id: 'component-cooperation', title: 'How the Components Cooperate', kind: 'concept' },
  ],
  labs: [
    { id: 'cluster-architecture-explorer', title: 'Cluster Architecture Explorer', type: 'simulation' },
  ],
};

export const controlPlane: ConceptMeta = {
  id: 'control-plane',
  title: 'Control Plane',
  description: 'The set of components that make decisions for the cluster — API Server, etcd, scheduler, and controller manager.',
  status: 'available',
  learningObjectives: [
    'Identify each control plane component and the job it owns',
    'Explain why control plane components talk to each other only through the API Server',
  ],
  prerequisites: ['kubernetes-cluster-architecture'],
  relatedConcepts: ['kubernetes-api-server', 'etcd', 'scheduler', 'controller-manager'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'what-the-control-plane-does', title: 'What the Control Plane Does', kind: 'concept' },
    { id: 'hub-and-spoke', title: 'The API Server as Hub', kind: 'concept' },
  ],
};

export const workerNodes: ConceptMeta = {
  id: 'worker-nodes',
  title: 'Worker Nodes',
  description: 'The machines that run application Pods. Each node runs a kubelet, a kube-proxy, and a container runtime.',
  status: 'available',
  learningObjectives: [
    'Explain what makes a machine a Kubernetes node',
    'Describe how a node reports itself as healthy to the control plane',
  ],
  prerequisites: ['kubernetes-cluster-architecture'],
  relatedConcepts: ['kubelet', 'kube-proxy', 'container-runtime'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'what-a-node-is', title: 'What Makes a Machine a Node', kind: 'concept' },
    { id: 'node-heartbeat-and-conditions', title: 'Node Heartbeat and Conditions', kind: 'concept' },
  ],
};

export const apiServer: ConceptMeta = {
  id: 'kubernetes-api-server',
  title: 'Kubernetes API Server',
  description: 'The front door of the cluster — a stateless REST server that validates, authenticates, authorizes, and persists every change to etcd.',
  status: 'available',
  learningObjectives: [
    'List the stages a request passes through inside the API Server',
    'Explain why the API Server is the only component that reads or writes etcd directly',
    'Describe what happens when the API Server itself is unavailable',
  ],
  prerequisites: ['control-plane'],
  relatedConcepts: ['etcd', 'kubernetes-objects', 'yaml-manifests'],
  estimatedMinutes: 30,
  lessons: [
    { id: 'api-server-role', title: 'The API Server\'s Role', kind: 'concept' },
    { id: 'request-lifecycle', title: 'Lifecycle of an API Request', kind: 'concept' },
  ],
};

export const etcd: ConceptMeta = {
  id: 'etcd',
  title: 'etcd',
  description: 'The consistent, distributed key-value store that holds every piece of cluster state. If it is lost, the cluster has no memory.',
  status: 'available',
  learningObjectives: [
    'Describe what etcd stores and why that data matters',
    'Explain why etcd prioritizes consistency over availability (CP in CAP)',
    'Describe what happens to the cluster when etcd becomes unavailable',
  ],
  prerequisites: ['kubernetes-api-server'],
  relatedConcepts: ['kubernetes-api-server', 'control-plane'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'what-etcd-stores', title: 'What etcd Stores — and Why', kind: 'concept' },
    { id: 'consistency-and-failure', title: 'Consistency, Quorum, and What Happens When etcd Fails', kind: 'concept' },
  ],
};

export const scheduler: ConceptMeta = {
  id: 'scheduler',
  title: 'Scheduler',
  description: 'The control plane component that picks a node for every unscheduled Pod using a two-phase filter-and-score process.',
  status: 'available',
  learningObjectives: [
    'Trace a Pod from Pending to a node assignment',
    'Explain filtering (predicates) and scoring (priorities) as two separate phases',
    'Describe what happens when no node can run a Pod',
  ],
  prerequisites: ['control-plane', 'worker-nodes'],
  relatedConcepts: ['pod', 'kubelet', 'resource-requests-and-limits'],
  estimatedMinutes: 35,
  lessons: [
    { id: 'how-scheduling-works', title: 'How the Scheduler Picks a Node', kind: 'concept' },
    { id: 'when-nothing-fits', title: 'When No Node Can Run the Pod', kind: 'concept' },
  ],
  labs: [
    { id: 'scheduler-simulator', title: 'Scheduler Simulator', type: 'simulation' },
  ],
};

export const controllerManager: ConceptMeta = {
  id: 'controller-manager',
  title: 'Controller Manager',
  description: 'The process that hosts the built-in controllers — small loops that each reconcile one kind of object toward its desired state.',
  status: 'available',
  learningObjectives: [
    'Explain what a controller is and why there are many of them',
    'Trace the reconciliation loop of a specific controller (e.g. ReplicaSet)',
  ],
  prerequisites: ['control-plane', 'kubernetes-reconciliation-loop'],
  relatedConcepts: ['kubernetes-reconciliation-loop', 'replicaset', 'deployment'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'many-small-controllers', title: 'Many Small Controllers, One Pattern', kind: 'concept' },
    { id: 'built-in-controllers', title: 'The Built-in Controllers', kind: 'concept' },
  ],
};

export const kubelet: ConceptMeta = {
  id: 'kubelet',
  title: 'kubelet',
  description: 'The node-level agent that watches the API Server for Pods assigned to its node and tells the local container runtime to run them.',
  status: 'available',
  learningObjectives: [
    'Describe what the kubelet watches, what it commands, and what it reports',
    'Explain why the kubelet does not talk to the scheduler directly',
    'Describe how liveness and readiness probes are run by the kubelet',
  ],
  prerequisites: ['worker-nodes', 'kubernetes-api-server'],
  relatedConcepts: ['kube-proxy', 'container-runtime', 'pod'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'kubelet-responsibilities', title: 'What the kubelet Does', kind: 'concept' },
    { id: 'probes-and-pod-lifecycle', title: 'Probes and Pod Lifecycle', kind: 'concept' },
  ],
};

export const kubeProxy: ConceptMeta = {
  id: 'kube-proxy',
  title: 'kube-proxy',
  description: 'The node-level network component that implements the Service abstraction — usually by programming iptables or IPVS rules on each node.',
  status: 'available',
  learningObjectives: [
    'Explain what kube-proxy implements, and what it does not',
    'Describe how a ClusterIP virtual IP is translated to real Pod IPs on a node',
  ],
  prerequisites: ['worker-nodes'],
  relatedConcepts: ['service', 'clusterip', 'pod-networking'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'kube-proxy-role', title: 'What kube-proxy Actually Does', kind: 'concept' },
    { id: 'iptables-vs-ipvs', title: 'iptables and IPVS Modes', kind: 'concept' },
  ],
};

export const containerRuntime: ConceptMeta = {
  id: 'container-runtime',
  title: 'Container Runtime',
  description: 'The software on each node that actually runs containers — pulling images, setting up namespaces, and starting processes.',
  status: 'available',
  learningObjectives: [
    'Distinguish the container runtime from Kubernetes',
    'Explain the role of the Container Runtime Interface (CRI)',
    'Describe why most clusters use containerd or CRI-O today rather than the Docker daemon',
  ],
  prerequisites: ['worker-nodes'],
  relatedConcepts: ['kubelet', 'kubernetes-vs-docker'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'runtime-under-the-pod', title: 'The Runtime Under Every Pod', kind: 'concept' },
    { id: 'cri-and-runtime-choices', title: 'CRI and Why Dockershim Is Gone', kind: 'concept' },
  ],
};
