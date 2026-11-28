import type { ConceptMeta } from '../../types';

export const csi: ConceptMeta = {
  id: 'container-storage-interface',
  title: 'Container Storage Interface (CSI)',
  description: 'The specification that decouples Kubernetes from storage vendors. Every modern storage integration uses CSI.',
  status: 'available',
  learningObjectives: [
    'Describe CSI\'s role as a vendor-neutral storage interface',
    'Enumerate the CSI gRPC service groups (Identity, Controller, Node)',
  ],
  prerequisites: ['persistent-volumes'],
  relatedConcepts: ['csi-architecture', 'csi-controller-plugin', 'csi-node-plugin'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'what-csi-is', title: 'What CSI Is and Why It Exists', kind: 'concept' },
    { id: 'csi-services', title: 'Identity, Controller, Node — Three gRPC Services', kind: 'concept' },
  ],
};

export const csiArchitecture: ConceptMeta = {
  id: 'csi-architecture',
  title: 'CSI Architecture',
  description: 'How a CSI driver is actually deployed: sidecars, a controller Deployment, and a node DaemonSet.',
  status: 'available',
  learningObjectives: [
    'Describe the sidecar pattern (external-provisioner, external-attacher, external-resizer, external-snapshotter)',
    'Trace where a CreateVolume call actually runs',
  ],
  prerequisites: ['container-storage-interface'],
  relatedConcepts: ['csi-controller-plugin', 'csi-node-plugin'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'sidecar-pattern', title: 'The Sidecar Pattern', kind: 'concept' },
    { id: 'deployment-topology', title: 'Deployment Topology on a Cluster', kind: 'concept' },
  ],
};

export const csiControllerPlugin: ConceptMeta = {
  id: 'csi-controller-plugin',
  title: 'CSI Controller Plugin',
  description: 'Cluster-scoped CSI operations: provisioning, deleting, attaching, detaching, snapshotting, expanding.',
  status: 'available',
  learningObjectives: [
    'List the Controller RPCs',
    'Describe where the controller plugin actually runs',
  ],
  prerequisites: ['csi-architecture'],
  relatedConcepts: ['csi-node-plugin', 'volume-provisioning'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'controller-rpcs', title: 'The Controller RPCs', kind: 'concept' },
  ],
};

export const csiNodePlugin: ConceptMeta = {
  id: 'csi-node-plugin',
  title: 'CSI Node Plugin',
  description: 'Per-node CSI operations: stage, publish, unpublish, unstage. The last-mile work of making a volume visible to a Pod.',
  status: 'available',
  learningObjectives: [
    'Describe the stage / publish distinction',
    'Explain why the node plugin is a DaemonSet',
  ],
  prerequisites: ['csi-architecture'],
  relatedConcepts: ['csi-controller-plugin', 'volume-attach-and-mount-lifecycle'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'node-rpcs', title: 'The Node RPCs', kind: 'concept' },
  ],
};

export const volumeProvisioning: ConceptMeta = {
  id: 'volume-provisioning',
  title: 'Volume Provisioning',
  description: 'The umbrella term for creating a PV (either from an existing backing volume or by asking the storage system to make one).',
  status: 'available',
  learningObjectives: [
    'Distinguish static and dynamic provisioning',
    'Describe the actors involved in each',
  ],
  prerequisites: ['storageclass', 'csi-controller-plugin'],
  relatedConcepts: ['static-provisioning', 'dynamic-provisioning'],
  estimatedMinutes: 10,
  lessons: [
    { id: 'static-vs-dynamic', title: 'Static vs Dynamic', kind: 'concept' },
  ],
};

export const staticProvisioning: ConceptMeta = {
  id: 'static-provisioning',
  title: 'Static Provisioning',
  description: 'Admin creates the backing volume and the PV object by hand. Common for pre-existing data, imported disks, or local PVs.',
  status: 'available',
  learningObjectives: [
    'Describe when static provisioning is the right choice',
    'Author a PV that points to a specific backing volume',
  ],
  prerequisites: ['volume-provisioning'],
  relatedConcepts: ['persistent-volumes'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'static-overview', title: 'Admin-Driven Provisioning', kind: 'concept' },
  ],
};

export const dynamicProvisioning: ConceptMeta = {
  id: 'dynamic-provisioning',
  title: 'Dynamic Provisioning',
  description: 'PVC appears; external-provisioner calls the storage system to create a backing volume; PV is produced. The common case.',
  status: 'available',
  learningObjectives: [
    'Trace the dynamic provisioning timeline',
    'Describe how a provisioner identifies which PVCs to act on',
  ],
  prerequisites: ['volume-provisioning', 'storageclass'],
  relatedConcepts: ['immediate-binding', 'waitforfirstconsumer'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'dyn-timeline', title: 'The Dynamic Timeline', kind: 'concept' },
    { id: 'provisioner-matching', title: 'How a Provisioner Finds Its Claims', kind: 'concept' },
  ],
  labs: [
    { id: 'dynamic-provisioning-simulator', title: 'Dynamic Provisioning Simulator', type: 'simulation' },
  ],
};

export const immediateBinding: ConceptMeta = {
  id: 'immediate-binding',
  title: 'Immediate Binding',
  description: 'The default volumeBindingMode: PV is provisioned the moment the PVC is created, without regard to where the Pod will run.',
  status: 'available',
  learningObjectives: [
    'Describe Immediate binding behavior',
    'Identify when Immediate causes zonal scheduling problems',
  ],
  prerequisites: ['dynamic-provisioning'],
  relatedConcepts: ['waitforfirstconsumer', 'volume-provisioning'],
  estimatedMinutes: 10,
  lessons: [
    { id: 'immediate-overview', title: 'Immediate — Provision Now', kind: 'concept' },
  ],
};

export const waitForFirstConsumer: ConceptMeta = {
  id: 'waitforfirstconsumer',
  title: 'WaitForFirstConsumer',
  description: 'Defer provisioning until a Pod that references the PVC is scheduled. Lets the scheduler pick a zone before the volume exists.',
  status: 'available',
  learningObjectives: [
    'Describe the WaitForFirstConsumer flow',
    'Explain why WFC is the default for zonal cloud volumes',
  ],
  prerequisites: ['immediate-binding'],
  relatedConcepts: ['dynamic-provisioning', 'volume-provisioning'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'wfc-overview', title: 'WFC: Schedule First, Provision Second', kind: 'concept' },
  ],
};

export const volumeAttachMount: ConceptMeta = {
  id: 'volume-attach-and-mount-lifecycle',
  title: 'Volume Attach and Mount Lifecycle',
  description: 'Four distinct steps from "PV bound" to "container sees the mount": attach, stage, publish, kubelet bind-mount.',
  status: 'available',
  learningObjectives: [
    'Order the four lifecycle steps',
    'Describe what fails if each step fails',
  ],
  prerequisites: ['csi-node-plugin'],
  relatedConcepts: ['csi-controller-plugin', 'csi-node-plugin'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'four-steps', title: 'Attach, Stage, Publish, Mount', kind: 'concept' },
    { id: 'node-failure-with-volume', title: 'What Happens If the Node Fails', kind: 'concept' },
  ],
};

export const volumeExpansion: ConceptMeta = {
  id: 'csi-volume-expansion',
  title: 'Volume Expansion',
  description: 'Grow a PVC\'s capacity online. Backend support required; file system expansion may require Pod restart.',
  status: 'available',
  learningObjectives: [
    'Enable and use volume expansion via `allowVolumeExpansion`',
    'Distinguish online block expansion from filesystem expansion',
  ],
  prerequisites: ['storageclass', 'csi-controller-plugin'],
  relatedConcepts: ['storageclass', 'csi-node-plugin'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'how-expansion-works', title: 'How Expansion Actually Grows a Volume', kind: 'concept' },
  ],
};

export const volumeSnapshots: ConceptMeta = {
  id: 'volume-snapshots',
  title: 'Volume Snapshots',
  description: 'Point-in-time copies of PVCs via VolumeSnapshot and VolumeSnapshotContent, backed by CSI snapshotter sidecar.',
  status: 'available',
  learningObjectives: [
    'Describe the VolumeSnapshot / VolumeSnapshotContent / VolumeSnapshotClass trio',
    'Restore a PVC from a snapshot',
  ],
  prerequisites: ['csi-architecture', 'persistent-volume-claims'],
  relatedConcepts: ['volume-provisioning', 'backup-fundamentals'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'snapshot-objects', title: 'Snapshot, SnapshotContent, SnapshotClass', kind: 'concept' },
    { id: 'restore-from-snapshot', title: 'Restoring a PVC From a Snapshot', kind: 'concept' },
  ],
};
