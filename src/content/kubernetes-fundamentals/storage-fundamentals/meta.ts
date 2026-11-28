import type { ConceptMeta } from '../../types';

export const containerFilesystem: ConceptMeta = {
  id: 'container-filesystem-and-ephemeral-storage',
  title: 'Container Filesystem and Ephemeral Storage',
  description: 'Why a container\'s own filesystem is ephemeral — overlay layers, the writable top layer, and what is lost on restart.',
  status: 'available',
  learningObjectives: [
    'Describe the overlay filesystem layers inside a container',
    'Identify where data written inside a container actually goes',
    'Distinguish container-level ephemeral storage from Pod-level emptyDir',
  ],
  prerequisites: ['pod'],
  relatedConcepts: ['kubernetes-volumes', 'emptydir'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'ephemeral-rootfs', title: 'The Ephemeral Container Rootfs', kind: 'concept' },
    { id: 'where-writes-go', title: 'Where Writes Actually Go', kind: 'concept' },
  ],
};

export const kubernetesVolumes: ConceptMeta = {
  id: 'kubernetes-volumes',
  title: 'Kubernetes Volumes',
  description: 'A Pod-level mount that outlives any single container but is still scoped to the Pod. The abstraction every other storage object builds on.',
  status: 'available',
  learningObjectives: [
    'Explain volumes as Pod-level mountpoints shared across containers',
    'Enumerate the common volume types and their lifecycle characteristics',
  ],
  prerequisites: ['container-filesystem-and-ephemeral-storage'],
  relatedConcepts: ['emptydir', 'hostpath', 'persistent-volumes'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'pod-scoped-mounts', title: 'Pod-Scoped Mountpoints', kind: 'concept' },
    { id: 'volume-type-taxonomy', title: 'A Taxonomy of Volume Types', kind: 'concept' },
  ],
};

export const emptyDir: ConceptMeta = {
  id: 'emptydir',
  title: 'emptyDir',
  description: 'A volume that lives exactly as long as the Pod. Used for scratch space, inter-container sharing, and memory-backed tmpfs.',
  status: 'available',
  learningObjectives: [
    'Describe the lifetime semantics of emptyDir',
    'Use emptyDir with memory medium for tmpfs',
  ],
  prerequisites: ['kubernetes-volumes'],
  relatedConcepts: ['kubernetes-volumes', 'persistent-volumes'],
  estimatedMinutes: 10,
  lessons: [
    { id: 'what-emptydir-is', title: 'Scratch Space Shared by Containers in a Pod', kind: 'concept' },
  ],
};

export const hostPath: ConceptMeta = {
  id: 'hostpath',
  title: 'hostPath',
  description: 'A volume that mounts a host directory into the Pod. Powerful, dangerous, and almost always the wrong answer for application workloads.',
  status: 'available',
  learningObjectives: [
    'Describe what hostPath does and why it couples a Pod to a specific node',
    'Identify the few legitimate uses (log agents, node-level operators)',
  ],
  prerequisites: ['kubernetes-volumes'],
  relatedConcepts: ['kubernetes-volumes', 'security-context'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'what-hostpath-is', title: 'Mounting Host Directories into Pods', kind: 'concept' },
    { id: 'why-rarely', title: 'Why hostPath Is Rarely the Answer', kind: 'concept' },
  ],
};

export const persistentVolumes: ConceptMeta = {
  id: 'persistent-volumes',
  title: 'Persistent Volumes (PV)',
  description: 'A cluster resource that represents one piece of storage, decoupled from any particular Pod. Not necessarily a physical disk — a handle into a storage system.',
  status: 'available',
  learningObjectives: [
    'Describe a PV as a handle for a backing storage asset, not a physical disk',
    'Enumerate the key PV fields (capacity, access modes, storageClassName, reclaimPolicy)',
  ],
  prerequisites: ['kubernetes-volumes'],
  relatedConcepts: ['persistent-volume-claims', 'storageclass', 'volume-lifecycle'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'what-a-pv-is', title: 'What a PV Actually Is', kind: 'concept' },
    { id: 'pv-shape', title: 'The Shape of a PV Object', kind: 'concept' },
  ],
};

export const persistentVolumeClaims: ConceptMeta = {
  id: 'persistent-volume-claims',
  title: 'Persistent Volume Claims (PVC)',
  description: 'A tenant-facing request for storage. The PVC does not describe where storage comes from, only what the application needs.',
  status: 'available',
  learningObjectives: [
    'Describe a PVC as a request, not an allocation',
    'Explain why a PVC can be Pending for multiple distinct reasons',
  ],
  prerequisites: ['persistent-volumes'],
  relatedConcepts: ['persistent-volumes', 'storageclass'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'what-a-pvc-is', title: 'A Request, Not an Allocation', kind: 'concept' },
    { id: 'pvc-pending-reasons', title: 'Why a PVC Stays Pending', kind: 'concept' },
  ],
  labs: [
    { id: 'pv-pvc-binder-simulator', title: 'PV / PVC Binding Simulator', type: 'simulation' },
  ],
};

export const storageClassConcept: ConceptMeta = {
  id: 'storageclass',
  title: 'StorageClass',
  description: 'A recipe for creating PVs on demand. Names a provisioner, parameters, reclaim policy, binding mode — everything that shapes what a claim gets.',
  status: 'available',
  learningObjectives: [
    'Describe a StorageClass as the "how" behind dynamic provisioning',
    'Enumerate the key fields (provisioner, parameters, reclaimPolicy, volumeBindingMode, allowVolumeExpansion)',
  ],
  prerequisites: ['persistent-volume-claims'],
  relatedConcepts: ['persistent-volume-claims', 'dynamic-provisioning', 'waitforfirstconsumer'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'storageclass-overview', title: 'The Recipe for a PV', kind: 'concept' },
    { id: 'default-class', title: 'The Default StorageClass', kind: 'concept' },
  ],
};

export const accessModes: ConceptMeta = {
  id: 'access-modes',
  title: 'Access Modes',
  description: 'ReadWriteOnce, ReadOnlyMany, ReadWriteMany, ReadWriteOncePod — what they actually mean and the subtle node-level semantics behind them.',
  status: 'available',
  learningObjectives: [
    'Distinguish the four access modes precisely',
    'Explain why ReadWriteOnce does not mean "only one Pod" and ReadWriteOncePod does',
  ],
  prerequisites: ['persistent-volumes'],
  relatedConcepts: ['persistent-volumes', 'persistent-volume-claims'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'four-access-modes', title: 'The Four Modes Precisely', kind: 'concept' },
    { id: 'rwo-pitfalls', title: 'The RWO Pitfall', kind: 'concept' },
  ],
};

export const reclaimPolicies: ConceptMeta = {
  id: 'reclaim-policies',
  title: 'Reclaim Policies',
  description: 'What happens to the backing storage when a PVC is deleted. Retain, Delete, and the (deprecated) Recycle.',
  status: 'available',
  learningObjectives: [
    'Distinguish Retain from Delete reclaim policies',
    'Recognize Recycle as deprecated and no longer a production option',
  ],
  prerequisites: ['persistent-volumes'],
  relatedConcepts: ['persistent-volume-claims', 'storageclass'],
  estimatedMinutes: 10,
  lessons: [
    { id: 'retain-vs-delete', title: 'Retain vs Delete', kind: 'concept' },
    { id: 'recycle-history', title: 'Recycle — Historical Note', kind: 'concept' },
  ],
};

export const volumeLifecycle: ConceptMeta = {
  id: 'volume-lifecycle',
  title: 'Volume Lifecycle',
  description: 'The phases a PV moves through: Available, Bound, Released, Failed — and the operator actions that transition it between them.',
  status: 'available',
  learningObjectives: [
    'Enumerate the PV phases and the events that drive transitions',
    'Describe the Released state and the manual recovery path',
  ],
  prerequisites: ['persistent-volumes', 'persistent-volume-claims'],
  relatedConcepts: ['reclaim-policies', 'volume-attach-and-mount-lifecycle'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'phase-graph', title: 'The PV Phase Graph', kind: 'concept' },
    { id: 'released-is-stuck', title: 'Released Is Semi-Stuck', kind: 'concept' },
  ],
};
