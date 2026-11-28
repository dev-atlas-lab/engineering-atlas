import type { ConceptContentModule, LessonBody } from '../../types';
import { pvPvcStorageClassScene } from '../storage-scenes';

const whatAPvIs: LessonBody = {
  learningObjectives: [
    'Describe a PV as a handle for backing storage, not necessarily a disk',
    'Explain who creates PVs in static and dynamic workflows',
  ],
  sections: [
    {
      heading: 'A PV is an object; the storage is somewhere else',
      blocks: [
        {
          type: 'paragraph',
          text: 'A PersistentVolume object is a cluster resource that describes one unit of storage the cluster can use. The actual bytes live outside Kubernetes — in a cloud block store, a network file server, a Ceph cluster, or an on-node directory. The PV object is a handle: it names the backing storage system and identifies the specific volume in it.',
        },
        {
          type: 'list',
          items: [
            'In static provisioning, a cluster administrator creates PV objects pointing at pre-provisioned volumes in the storage backend.',
            'In dynamic provisioning, the external-provisioner Pod creates both the backing volume (by calling the storage system) AND the PV object. The PVC that triggered this transitions from Pending to Bound.',
            'A PV is cluster-scoped — not namespaced. A single PV can be bound by a PVC in any namespace.',
          ],
        },
      ],
    },
    {
      heading: 'PV ≠ physical disk',
      blocks: [
        {
          type: 'paragraph',
          text: 'A PV can be backed by a dedicated cloud block device (one real disk), a slice of a shared filesystem (one subdirectory on NFS), a directory on the node (local PV), or an object-storage-backed abstraction (rare). The PV object abstracts all of these behind one shape. Treating PVs as "disks" is a lossy mental model — a PV backed by NFS can be mounted by many nodes; a PV backed by an EBS volume cannot.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The storage system\'s native capabilities (snapshots, replication, encryption) define what the PV can actually do. The PV object fields describe only what Kubernetes needs to know (capacity, access modes, reclaim policy, where to find it).',
        },
      ],
    },
  ],
  visualization: pvPvcStorageClassScene,
};

const pvShape: LessonBody = {
  learningObjectives: ['Enumerate the key PV fields and what they control'],
  sections: [
    {
      heading: 'The fields that matter',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: v1
kind: PersistentVolume
metadata: { name: pv-data-20g }
spec:
  capacity: { storage: 20Gi }                 # claim capacity floor to match
  accessModes: [ReadWriteOnce]                # one node at a time
  storageClassName: fast                       # bind to claims requesting this class
  persistentVolumeReclaimPolicy: Retain        # what happens when the PVC is deleted
  volumeMode: Filesystem                       # vs Block
  csi:                                         # or hostPath, nfs, ...
    driver: ebs.csi.aws.com
    volumeHandle: vol-0abcd1234ef5
  nodeAffinity:                                # zonal constraint
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - { key: topology.kubernetes.io/zone, operator: In, values: [us-east-1a] }`,
        },
        {
          type: 'list',
          items: [
            'capacity.storage — the max the volume provides. A claim requesting less than or equal is eligible.',
            'accessModes — the modes the backing storage can support (not the mode a Pod will actually use).',
            'storageClassName — binding is restricted to claims with the same class name.',
            'persistentVolumeReclaimPolicy — Retain, Delete; see the reclaim-policies concept.',
            'volumeMode — Filesystem (mount as a FS) or Block (expose the raw block device).',
            'nodeAffinity — for zonal storage, which nodes can even reach this volume. Affects scheduling.',
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-a-pv-is': whatAPvIs,
    'pv-shape': pvShape,
  },
  labs: {},
  simulations: {},
};
