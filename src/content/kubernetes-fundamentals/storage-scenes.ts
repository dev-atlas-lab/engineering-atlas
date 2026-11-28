// SVG scene definitions for Slice 3D storage & reliability concepts.

import type { SceneDefinition } from '../../engines/visualization/types';

// --- 1. Container FS vs Pod Volume vs PV ----------------------------------

export const storageLayersScene: SceneDefinition = {
  id: 'k8s-storage-layers',
  type: 'topology',
  title: 'Container filesystem vs Pod volume vs Persistent Volume',
  description: 'Three different "storage" layers with very different lifetimes: the container\'s rootfs (lost on restart), the Pod volume (lost when the Pod is deleted), and the PV (survives Pod deletion and rescheduling).',
  nodes: [
    { id: 'container', type: 'function', label: 'Container', position: { x: 60, y: 220 }, data: {}, status: 'active' },
    { id: 'rootfs', type: 'storage', label: 'Container rootfs (overlayfs)', position: { x: 60, y: 80 }, data: { Lifetime: 'Lost on container exit' } },
    { id: 'emptydir', type: 'storage', label: 'emptyDir volume', position: { x: 320, y: 80 }, data: { Lifetime: 'Lost when the Pod is deleted' } },
    { id: 'pod', type: 'host', label: 'Pod', position: { x: 320, y: 220 }, data: {} },
    { id: 'pv', type: 'storage', label: 'PersistentVolume', position: { x: 580, y: 80 }, data: { Lifetime: 'Survives Pod deletion' } },
    { id: 'pvc', type: 'policy', label: 'PVC in Pod', position: { x: 580, y: 220 }, data: { Claim: 'the Pod\'s request for storage' } },
    { id: 'backing', type: 'storage', label: 'Backing storage (EBS, NFS, Ceph, …)', position: { x: 820, y: 80 }, data: { Owned: 'outside the cluster' } },
  ],
  edges: [
    { id: 'c-rootfs', source: 'container', target: 'rootfs', edgeType: 'data', label: 'writes here = lost' },
    { id: 'c-emptydir', source: 'container', target: 'emptydir', edgeType: 'data', label: 'mount via Pod' },
    { id: 'pod-emptydir', source: 'pod', target: 'emptydir', edgeType: 'dependency' },
    { id: 'pod-pvc', source: 'pod', target: 'pvc', edgeType: 'dependency' },
    { id: 'pvc-pv', source: 'pvc', target: 'pv', edgeType: 'request', label: 'bound to' },
    { id: 'pv-backing', source: 'pv', target: 'backing', edgeType: 'data', label: 'is a handle for' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Three lifetimes',
      description: 'rootfs dies with the container, emptyDir dies with the Pod, PV dies only when YOU delete it. Writing valuable data to the wrong layer is the single most common storage mistake.',
    },
    {
      id: 'container-restarts',
      label: 'Container restarts — rootfs is gone',
      description: 'CrashLoopBackOff, image update, or kubelet-initiated restart replaces the writable layer. Pod-level emptyDir survives; the container\'s own writes to / do not.',
      nodeOverrides: { rootfs: { status: 'error' } },
      edgeOverrides: { 'c-rootfs': { flow: 'deny' } },
    },
    {
      id: 'pod-rescheduled',
      label: 'Pod rescheduled — emptyDir gone, PV follows',
      description: 'When the Pod is deleted and a replacement runs elsewhere, emptyDir is lost but the PV is detached from the old node and reattached to the new one.',
      nodeOverrides: { emptydir: { status: 'error' }, pv: { status: 'active' } },
    },
  ],
};

// --- 2. PV–PVC–StorageClass relationship ----------------------------------

export const pvPvcStorageClassScene: SceneDefinition = {
  id: 'k8s-pv-pvc-sc',
  type: 'topology',
  title: 'PV, PVC, StorageClass — the three objects',
  description: 'PVC is what the application asks for; PV is what the cluster actually has; StorageClass is the recipe used to produce PVs on demand.',
  nodes: [
    { id: 'pvc', type: 'policy', label: 'PVC (claim)', position: { x: 60, y: 200 }, data: { Owner: 'application team' }, status: 'active' },
    { id: 'sc', type: 'policy', label: 'StorageClass', position: { x: 300, y: 80 }, data: { Owner: 'platform team', Has: 'provisioner + params' } },
    { id: 'provisioner', type: 'server', label: 'External provisioner (CSI)', position: { x: 300, y: 200 }, data: {} },
    { id: 'pv', type: 'storage', label: 'PV', position: { x: 540, y: 200 }, data: { Represents: 'a specific volume in the storage system' } },
    { id: 'backing', type: 'storage', label: 'Cloud / SAN / NFS backing', position: { x: 780, y: 200 }, data: {} },
    { id: 'pod', type: 'function', label: 'Pod', position: { x: 60, y: 60 }, data: {} },
  ],
  edges: [
    { id: 'pod-pvc', source: 'pod', target: 'pvc', edgeType: 'dependency', label: 'references' },
    { id: 'pvc-sc', source: 'pvc', target: 'sc', edgeType: 'request', label: 'storageClassName' },
    { id: 'sc-prov', source: 'sc', target: 'provisioner', edgeType: 'dependency', label: 'names' },
    { id: 'prov-pv', source: 'provisioner', target: 'pv', edgeType: 'request', label: 'creates (dynamic)' },
    { id: 'prov-backing', source: 'provisioner', target: 'backing', edgeType: 'request', label: 'cloud API call' },
    { id: 'pvc-pv', source: 'pvc', target: 'pv', edgeType: 'data', label: 'bound to' },
  ],
  states: [
    {
      id: 'static',
      label: 'Static provisioning',
      description: 'An admin pre-creates PVs. PVCs bind to a matching PV if class, capacity, and access modes line up. StorageClass is still used — but only to label the PVs so PVCs can request them by class.',
    },
    {
      id: 'dynamic',
      label: 'Dynamic provisioning',
      description: 'PVC references a StorageClass. The external-provisioner Pod sees the PVC, calls the storage system to create a real volume, and creates the PV object. PVC transitions from Pending to Bound.',
      edgeOverrides: { 'pvc-sc': { animated: true }, 'sc-prov': { animated: true }, 'prov-backing': { animated: true }, 'prov-pv': { animated: true, flow: 'allow' } },
    },
  ],
};

// --- 3. Dynamic provisioning lifecycle ------------------------------------

export const dynamicProvLifecycleScene: SceneDefinition = {
  id: 'k8s-dynamic-prov-lifecycle',
  type: 'sequence',
  title: 'Dynamic provisioning timeline',
  description: 'The ordered steps from PVC apply to a running Pod, with WaitForFirstConsumer changing where scheduling and provisioning fit.',
  nodes: [
    { id: 'user', type: 'client', label: 'User', position: { x: 40, y: 60 }, data: {} },
    { id: 'api', type: 'gateway', label: 'API Server', position: { x: 220, y: 60 }, data: {} },
    { id: 'prov', type: 'policy', label: 'External Provisioner', position: { x: 420, y: 60 }, data: {} },
    { id: 'storage', type: 'storage', label: 'Storage system', position: { x: 620, y: 60 }, data: {} },
    { id: 'scheduler', type: 'policy', label: 'Scheduler', position: { x: 820, y: 60 }, data: {} },
    { id: 'kubelet', type: 'server', label: 'kubelet', position: { x: 1020, y: 60 }, data: {} },
  ],
  edges: [
    { id: 'u-api', source: 'user', target: 'api', edgeType: 'request', label: 'kubectl apply pvc' },
    { id: 'api-prov', source: 'api', target: 'prov', edgeType: 'dependency', label: 'watches PVCs' },
    { id: 'prov-storage', source: 'prov', target: 'storage', edgeType: 'request', label: 'CreateVolume' },
    { id: 'prov-api', source: 'prov', target: 'api', edgeType: 'request', label: 'create PV; bind PVC' },
    { id: 'api-sched', source: 'api', target: 'scheduler', edgeType: 'dependency', label: 'Pod pending' },
    { id: 'sched-kubelet', source: 'scheduler', target: 'kubelet', edgeType: 'request', label: 'bind to node' },
    { id: 'kubelet-storage', source: 'kubelet', target: 'storage', edgeType: 'request', label: 'attach + mount' },
  ],
  states: [
    {
      id: 'initial',
      label: 'Initial state: Immediate vs WaitForFirstConsumer',
      description: 'In Immediate mode the provisioner acts as soon as the PVC exists; in WaitForFirstConsumer (WFC) mode provisioning waits until the Scheduler picks a node/zone for the Pod.',
    },
    {
      id: 'step-apply-pvc',
      label: '1. User submits the PVC',
      description: 'kubectl apply creates the PVC in the API Server in Pending state referencing a StorageClass.',
      edgeOverrides: { 'u-api': { animated: true, flow: 'allow' } },
    },
    {
      id: 'step-watch-pvc',
      label: '2. External provisioner observes the PVC',
      description: 'With Immediate, external-provisioner starts provisioning right away. With WFC, it waits for the volume.kubernetes.io/selected-node annotation set by the Scheduler.',
      edgeOverrides: { 'api-prov': { animated: true, flow: 'pending' } },
    },
    {
      id: 'step-create-volume',
      label: '3. CSI CreateVolume allocates backing storage',
      description: 'external-provisioner calls CreateVolume on the CSI driver. Under WFC, topology requirements from the scheduled node tell the backend which zone to allocate in.',
      edgeOverrides: { 'prov-storage': { animated: true, flow: 'allow' } },
    },
    {
      id: 'step-bind-pv',
      label: '4. Provisioner creates PV and binds PVC',
      description: 'The PV object is written to the API Server with a claimRef to the PVC; both transition to Bound.',
      edgeOverrides: { 'prov-api': { animated: true, flow: 'allow' } },
    },
    {
      id: 'step-schedule-pod',
      label: '5. Scheduler evaluates Pod + PVC topology',
      description: 'With Immediate, the Scheduler is constrained to nodes matching the already-created PV zone. With WFC, the Scheduler picks a feasible zone first and annotates the PVC.',
      edgeOverrides: { 'api-sched': { animated: true, flow: 'allow' } },
    },
    {
      id: 'step-bind-node',
      label: '6. Pod is bound to a worker node',
      description: 'Scheduler writes spec.nodeName on the Pod; the target kubelet watches and picks up the assignment.',
      edgeOverrides: { 'sched-kubelet': { animated: true, flow: 'allow' } },
    },
    {
      id: 'step-attach-mount',
      label: '7. kubelet and CSI attach, stage, and mount',
      description: 'Once both the PV is Bound and the Pod is scheduled to a node, CSI attaches the volume and kubelet mounts it into the container.',
      edgeOverrides: { 'kubelet-storage': { animated: true, flow: 'allow' } },
    },
  ],
};

// --- 4. CSI architecture --------------------------------------------------

export const csiArchitectureScene: SceneDefinition = {
  id: 'k8s-csi-architecture',
  type: 'topology',
  title: 'CSI architecture',
  description: 'CSI splits into cluster-scope controller operations (provision, attach) and per-node operations (stage, publish, mount). Each CSI vendor ships both parts.',
  nodes: [
    { id: 'api', type: 'gateway', label: 'API Server', position: { x: 60, y: 40 }, data: {} },
    { id: 'ex-prov', type: 'policy', label: 'external-provisioner', position: { x: 300, y: 40 }, data: { Does: 'watches PVCs, calls CSI CreateVolume' } },
    { id: 'ex-attach', type: 'policy', label: 'external-attacher', position: { x: 300, y: 140 }, data: { Does: 'watches VolumeAttachments, calls CSI ControllerPublish' } },
    { id: 'ex-resizer', type: 'policy', label: 'external-resizer', position: { x: 300, y: 240 }, data: { Does: 'watches PVC resizing' } },
    { id: 'csi-ctrl', type: 'server', label: 'CSI controller plugin', position: { x: 540, y: 140 }, data: { Does: 'CreateVolume, ControllerPublishVolume (vendor logic)' }, status: 'active' },
    { id: 'csi-node', type: 'server', label: 'CSI node plugin (DaemonSet)', position: { x: 540, y: 340 }, data: { Does: 'NodeStageVolume, NodePublishVolume on each node' }, status: 'active' },
    { id: 'kubelet', type: 'server', label: 'kubelet', position: { x: 300, y: 340 }, data: {} },
    { id: 'storage', type: 'storage', label: 'Storage system', position: { x: 820, y: 240 }, data: {} },
  ],
  edges: [
    { id: 'api-prov', source: 'api', target: 'ex-prov', edgeType: 'dependency' },
    { id: 'api-att', source: 'api', target: 'ex-attach', edgeType: 'dependency' },
    { id: 'api-res', source: 'api', target: 'ex-resizer', edgeType: 'dependency' },
    { id: 'prov-ctrl', source: 'ex-prov', target: 'csi-ctrl', edgeType: 'request', label: 'gRPC' },
    { id: 'att-ctrl', source: 'ex-attach', target: 'csi-ctrl', edgeType: 'request', label: 'gRPC' },
    { id: 'res-ctrl', source: 'ex-resizer', target: 'csi-ctrl', edgeType: 'request', label: 'gRPC' },
    { id: 'ctrl-storage', source: 'csi-ctrl', target: 'storage', edgeType: 'request', label: 'cloud API' },
    { id: 'kubelet-node', source: 'kubelet', target: 'csi-node', edgeType: 'request', label: 'gRPC on local unix socket' },
    { id: 'node-storage', source: 'csi-node', target: 'storage', edgeType: 'request', label: 'mount paths' },
  ],
  boundaries: [
    { id: 'control', label: 'Control plane (cluster-scoped)', kind: 'scope', nodeIds: ['api', 'ex-prov', 'ex-attach', 'ex-resizer', 'csi-ctrl'] },
    { id: 'node', label: 'Each node', kind: 'zone', nodeIds: ['kubelet', 'csi-node'] },
  ],
  states: [
    {
      id: 'overview',
      label: 'Two halves: controller and node',
      description: 'Controller handles create/delete/attach via the storage vendor API. The node plugin handles the per-node work of making the device visible to the Pod.',
    },
    {
      id: 'provision-and-attach',
      label: 'Provision, then attach',
      description: 'external-provisioner → controller plugin creates the volume. external-attacher → controller plugin attaches it to a node.',
      edgeOverrides: { 'api-prov': { animated: true }, 'prov-ctrl': { animated: true }, 'ctrl-storage': { animated: true }, 'att-ctrl': { animated: true } },
    },
    {
      id: 'stage-and-publish',
      label: 'kubelet asks the node plugin to stage & publish',
      description: 'NodeStageVolume formats and bind-mounts to a staging path. NodePublishVolume bind-mounts into the Pod\'s directory on the node. Only now can the container see the volume.',
      edgeOverrides: { 'kubelet-node': { animated: true }, 'node-storage': { animated: true } },
    },
  ],
};

// --- 5. Volume attach & mount lifecycle -----------------------------------

export const volumeMountLifecycleScene: SceneDefinition = {
  id: 'k8s-volume-mount-lifecycle',
  type: 'topology',
  title: 'Attach → stage → publish → mount',
  description: 'Four distinct steps between a Pod being scheduled and the container seeing a mountpoint. Debugging a FailedMount means identifying which step failed.',
  nodes: [
    { id: 'attach', type: 'function', label: '1. Attach (controller)', position: { x: 60, y: 160 }, data: { Owner: 'A-D (external-attacher)' } },
    { id: 'stage', type: 'function', label: '2. NodeStageVolume', position: { x: 280, y: 160 }, data: { Owner: 'node plugin; one per node' } },
    { id: 'publish', type: 'function', label: '3. NodePublishVolume', position: { x: 500, y: 160 }, data: { Owner: 'node plugin; one per Pod' } },
    { id: 'kubelet-mount', type: 'function', label: '4. kubelet bind-mounts into container', position: { x: 740, y: 160 }, data: {} },
    { id: 'result', type: 'storage', label: 'Mountpoint visible in Pod', position: { x: 960, y: 160 }, data: {}, status: 'active' },
  ],
  edges: [
    { id: 'a-s', source: 'attach', target: 'stage', edgeType: 'request' },
    { id: 's-p', source: 'stage', target: 'publish', edgeType: 'request' },
    { id: 'p-k', source: 'publish', target: 'kubelet-mount', edgeType: 'request' },
    { id: 'k-r', source: 'kubelet-mount', target: 'result', edgeType: 'request' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Four steps, four failure modes',
      description: 'FailedAttachVolume = step 1. FailedMount with "fsck" or "mkfs" = step 2. FailedMount with target-path = step 3. Everything else = step 4.',
    },
  ],
};

// --- 6. StatefulSet identity + per-replica PVCs --------------------------

export const statefulsetIdentityScene: SceneDefinition = {
  id: 'k8s-statefulset-identity',
  type: 'topology',
  title: 'StatefulSet identity and per-replica PVCs',
  description: 'Each replica has a stable name (web-0, web-1, …) and its own PVC created from volumeClaimTemplates. Headless Service gives each a stable DNS name.',
  nodes: [
    { id: 'sts', type: 'policy', label: 'StatefulSet web', position: { x: 60, y: 200 }, data: { Owns: 'ordinals, headless svc, PVCs' }, status: 'active' },
    { id: 'svc', type: 'loadbalancer', label: 'Headless Service web', position: { x: 300, y: 60 }, data: { ClusterIP: 'None' } },
    { id: 'p0', type: 'function', label: 'web-0', position: { x: 540, y: 60 }, data: { DNS: 'web-0.web.default.svc' }, status: 'active' },
    { id: 'p1', type: 'function', label: 'web-1', position: { x: 540, y: 160 }, data: { DNS: 'web-1.web.default.svc' }, status: 'active' },
    { id: 'p2', type: 'function', label: 'web-2', position: { x: 540, y: 260 }, data: { DNS: 'web-2.web.default.svc' }, status: 'active' },
    { id: 'pvc0', type: 'storage', label: 'data-web-0', position: { x: 780, y: 60 }, data: {} },
    { id: 'pvc1', type: 'storage', label: 'data-web-1', position: { x: 780, y: 160 }, data: {} },
    { id: 'pvc2', type: 'storage', label: 'data-web-2', position: { x: 780, y: 260 }, data: {} },
  ],
  edges: [
    { id: 'sts-svc', source: 'sts', target: 'svc', edgeType: 'dependency' },
    { id: 'sts-p0', source: 'sts', target: 'p0', edgeType: 'dependency' },
    { id: 'sts-p1', source: 'sts', target: 'p1', edgeType: 'dependency' },
    { id: 'sts-p2', source: 'sts', target: 'p2', edgeType: 'dependency' },
    { id: 'p0-pvc', source: 'p0', target: 'pvc0', edgeType: 'request' },
    { id: 'p1-pvc', source: 'p1', target: 'pvc1', edgeType: 'request' },
    { id: 'p2-pvc', source: 'p2', target: 'pvc2', edgeType: 'request' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Stable identity, stable storage',
      description: 'web-0 always sees data-web-0. If web-0 is deleted and recreated, the new Pod re-attaches the same PVC. StatefulSet persists (name, PVC); the Pod itself is still disposable.',
    },
    {
      id: 'delete-and-recreate',
      label: 'Delete web-1 → it comes back as web-1',
      description: 'Deleting a StatefulSet Pod does not delete its PVC. The replacement Pod has the same name, same DNS, same PVC. The application sees a brief restart — not identity migration.',
      nodeOverrides: { p1: { status: 'inactive' } },
      edgeOverrides: { 'p1-pvc': { animated: true } },
    },
  ],
};

// --- 7. Replication vs Backup ---------------------------------------------

export const replicationVsBackupScene: SceneDefinition = {
  id: 'k8s-replication-vs-backup',
  type: 'topology',
  title: 'Replication protects against hardware failure, backup against humans',
  description: 'Replication keeps copies in sync — including copies of mistakes. A backup is a frozen, non-live copy that survives the mistake because it was made before.',
  nodes: [
    { id: 'primary', type: 'database', label: 'Primary DB', position: { x: 60, y: 200 }, data: {}, status: 'active' },
    { id: 'replica1', type: 'database', label: 'Replica 1', position: { x: 300, y: 120 }, data: {}, status: 'active' },
    { id: 'replica2', type: 'database', label: 'Replica 2', position: { x: 300, y: 280 }, data: {}, status: 'active' },
    { id: 'backup', type: 'storage', label: 'Nightly backup T-1', position: { x: 580, y: 200 }, data: { Immutable: 'yes' } },
    { id: 'drop', type: 'function', label: 'DROP TABLE orders', position: { x: 60, y: 60 }, data: {} },
  ],
  edges: [
    { id: 'p-r1', source: 'primary', target: 'replica1', edgeType: 'data', animated: true, label: 'log stream' },
    { id: 'p-r2', source: 'primary', target: 'replica2', edgeType: 'data', animated: true, label: 'log stream' },
    { id: 'p-b', source: 'primary', target: 'backup', edgeType: 'data', label: 'daily snapshot' },
    { id: 'd-p', source: 'drop', target: 'primary', edgeType: 'request', flow: 'deny', label: 'destructive' },
    { id: 'd-r1', source: 'drop', target: 'replica1', edgeType: 'request', flow: 'deny', label: 'replicates' },
    { id: 'd-r2', source: 'drop', target: 'replica2', edgeType: 'request', flow: 'deny', label: 'replicates' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Replication mirrors; backup preserves',
      description: 'Replicas increase durability against node loss. They do not protect you against a DROP TABLE at the primary — they will replicate it. Backup is a separate axis.',
    },
    {
      id: 'restore',
      label: 'Recover from the backup, not from the replica',
      description: 'Once the destructive change hit the primary, every replica has it. Only the backup — taken before the change — can be restored. RPO = time between the backup and the deletion.',
      nodeOverrides: { primary: { status: 'error' }, replica1: { status: 'error' }, replica2: { status: 'error' }, backup: { status: 'active' } },
    },
  ],
};

// --- 8. Backup & restore lifecycle with RPO/RTO ---------------------------

export const backupRestoreLifecycleScene: SceneDefinition = {
  id: 'k8s-backup-restore-lifecycle',
  type: 'topology',
  title: 'Backup / restore lifecycle: RPO and RTO',
  description: 'Two numbers define recovery: RPO is how much data you can afford to lose; RTO is how long you can afford to be down.',
  nodes: [
    { id: 't0', type: 'function', label: 't=0 live DB', position: { x: 60, y: 160 }, data: {} },
    { id: 'b1', type: 'storage', label: 't=T-1 backup', position: { x: 260, y: 160 }, data: {}, status: 'active' },
    { id: 'writes', type: 'function', label: 't=T−1…T writes', position: { x: 460, y: 60 }, data: {} },
    { id: 'event', type: 'function', label: 't=T failure', position: { x: 460, y: 260 }, data: {}, status: 'error' },
    { id: 'restore', type: 'function', label: 'Restore (RTO)', position: { x: 660, y: 160 }, data: {} },
    { id: 'rpo', type: 'policy', label: 'Lost data = RPO window', position: { x: 460, y: 160 }, data: {} },
    { id: 'recovered', type: 'storage', label: 'Back online', position: { x: 860, y: 160 }, data: {}, status: 'active' },
  ],
  edges: [
    { id: 't-b', source: 't0', target: 'b1', edgeType: 'data', label: 'snapshot' },
    { id: 'b-w', source: 'b1', target: 'writes', edgeType: 'data' },
    { id: 'w-e', source: 'writes', target: 'event', edgeType: 'data', flow: 'deny' },
    { id: 'rpo-ind', source: 'rpo', target: 'event', edgeType: 'dependency', label: 'this is lost' },
    { id: 'b-r', source: 'b1', target: 'restore', edgeType: 'request', label: 'load backup' },
    { id: 'r-recovered', source: 'restore', target: 'recovered', edgeType: 'request', label: 'measurable RTO' },
  ],
  states: [
    {
      id: 'overview',
      label: 'RPO is the gap; RTO is the recovery',
      description: 'Everything written between the last backup and the failure is lost. RPO = (failure time − backup time). RTO = (time back online − failure time).',
    },
  ],
};

// --- 9. PVC Pending troubleshooting decision flow -------------------------

export const pvcTroubleshootingScene: SceneDefinition = {
  id: 'k8s-pvc-pending-flow',
  type: 'topology',
  title: 'PVC Pending — decision flow',
  description: 'A deterministic ladder for diagnosing why a claim is stuck.',
  nodes: [
    { id: 'q0', type: 'function', label: 'PVC Pending', position: { x: 60, y: 220 }, data: {}, status: 'error' },
    { id: 'q1', type: 'policy', label: 'storageClassName set?', position: { x: 260, y: 220 }, data: {} },
    { id: 'q2', type: 'policy', label: 'That class exists?', position: { x: 460, y: 220 }, data: {} },
    { id: 'q3', type: 'policy', label: 'Static PV matches?', position: { x: 460, y: 80 }, data: {} },
    { id: 'q4', type: 'policy', label: 'Dynamic: provisioner healthy?', position: { x: 660, y: 220 }, data: {} },
    { id: 'q5', type: 'policy', label: 'Topology / zone conflict?', position: { x: 860, y: 220 }, data: {} },
    { id: 'rc1', type: 'firewall', label: 'Set storageClassName or create a matching PV', position: { x: 260, y: 360 }, data: {} },
    { id: 'rc2', type: 'firewall', label: 'Create the StorageClass or fix the name', position: { x: 460, y: 360 }, data: {} },
    { id: 'rc3', type: 'firewall', label: 'Check CSI provisioner logs', position: { x: 660, y: 360 }, data: {} },
    { id: 'rc4', type: 'firewall', label: 'Switch to WaitForFirstConsumer or relax nodeSelector', position: { x: 860, y: 360 }, data: {} },
  ],
  edges: [
    { id: 'q0-q1', source: 'q0', target: 'q1', edgeType: 'request' },
    { id: 'q1-q3', source: 'q1', target: 'q3', edgeType: 'request', flow: 'deny', label: 'no' },
    { id: 'q1-q2', source: 'q1', target: 'q2', edgeType: 'request', flow: 'allow', label: 'yes' },
    { id: 'q3-rc1', source: 'q3', target: 'rc1', edgeType: 'request', flow: 'deny', label: 'no match' },
    { id: 'q2-q4', source: 'q2', target: 'q4', edgeType: 'request', flow: 'allow', label: 'yes' },
    { id: 'q2-rc2', source: 'q2', target: 'rc2', edgeType: 'request', flow: 'deny', label: 'no' },
    { id: 'q4-q5', source: 'q4', target: 'q5', edgeType: 'request', flow: 'allow', label: 'yes' },
    { id: 'q4-rc3', source: 'q4', target: 'rc3', edgeType: 'request', flow: 'deny', label: 'no' },
    { id: 'q5-rc4', source: 'q5', target: 'rc4', edgeType: 'request', flow: 'deny', label: 'conflict' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Six questions, four likely root causes',
      description: 'Follow the questions in order. Each branch reaches a concrete remediation step, not a generic "check your YAML".',
    },
  ],
};

// --- 10. Storage failure and recovery -------------------------------------

export const storageFailureRecoveryScene: SceneDefinition = {
  id: 'k8s-storage-failure-recovery',
  type: 'topology',
  title: 'Storage failure — what recovers automatically, what does not',
  description: 'Not every storage failure is recoverable without human action. Knowing which layer failed decides which runbook applies.',
  nodes: [
    { id: 'node', type: 'host', label: 'Node loses contact', position: { x: 60, y: 60 }, data: {}, status: 'error' },
    { id: 'rwo', type: 'storage', label: 'RWO volume stuck attached', position: { x: 60, y: 200 }, data: {}, status: 'error' },
    { id: 'kubelet-die', type: 'server', label: 'kubelet dies mid-mount', position: { x: 380, y: 60 }, data: {}, status: 'error' },
    { id: 'orphan', type: 'storage', label: 'Orphaned staging dir', position: { x: 380, y: 200 }, data: {} },
    { id: 'disk-full', type: 'host', label: 'Node disk full', position: { x: 700, y: 60 }, data: {}, status: 'error' },
    { id: 'evict', type: 'function', label: 'kubelet evicts Pods', position: { x: 700, y: 200 }, data: {} },
    { id: 'manual', type: 'policy', label: 'Needs operator intervention', position: { x: 60, y: 340 }, data: {} },
    { id: 'auto', type: 'policy', label: 'Recovers automatically', position: { x: 700, y: 340 }, data: {} },
  ],
  edges: [
    { id: 'node-rwo', source: 'node', target: 'rwo', edgeType: 'request', flow: 'blocked', label: 'force-detach timeout' },
    { id: 'rwo-manual', source: 'rwo', target: 'manual', edgeType: 'request', flow: 'deny' },
    { id: 'kubelet-orphan', source: 'kubelet-die', target: 'orphan', edgeType: 'request', flow: 'blocked' },
    { id: 'orphan-manual', source: 'orphan', target: 'manual', edgeType: 'request', flow: 'deny' },
    { id: 'disk-evict', source: 'disk-full', target: 'evict', edgeType: 'request' },
    { id: 'evict-auto', source: 'evict', target: 'auto', edgeType: 'request', flow: 'allow' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Three kinds of storage failure',
      description: 'Node unreachable with RWO volume → manual (force-detach timer). kubelet crash mid-mount → manual (orphan). Disk pressure → kubelet runbook kicks in automatically (eviction ladder).',
    },
  ],
};
