import type { ConceptContentModule, LessonBody } from '../../types';

const controllerRpcs: LessonBody = {
  learningObjectives: [
    'List the Controller RPCs and when each is called',
    'Describe why attach lives in the controller plugin',
  ],
  sections: [
    {
      heading: 'Cluster-level storage operations',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['RPC', 'When Kubernetes calls it', 'Driver does'],
          rows: [
            ['CreateVolume', 'external-provisioner sees a PVC it should fulfill', 'Call cloud/SAN API to allocate a new volume'],
            ['DeleteVolume', 'external-provisioner sees a PV with reclaimPolicy=Delete being deleted', 'Call cloud/SAN API to delete the volume'],
            ['ControllerPublishVolume (attach)', 'external-attacher sees a VolumeAttachment', 'Attach the volume to a specific node (cloud "attach disk" operation)'],
            ['ControllerUnpublishVolume (detach)', 'VolumeAttachment deleted', 'Detach from node'],
            ['CreateSnapshot / DeleteSnapshot', 'external-snapshotter, triggered by VolumeSnapshotContent', 'Create/delete the backend snapshot'],
            ['ControllerExpandVolume', 'external-resizer sees a PVC size increase', 'Grow the backing volume in the storage system'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Attach is cluster-level because it requires a privileged API call to the storage system (AWS AttachVolume, Azure Attach), which the per-node plugin generally does not have credentials for. The controller plugin has an IAM role that permits cluster-wide attach/detach; the node plugin has node-scope permissions only.',
        },
      ],
    },
    {
      heading: 'Where it runs',
      blocks: [
        {
          type: 'paragraph',
          text: 'The controller plugin is a Deployment in a system namespace (often kube-system). Multiple replicas with leader election — one is active at a time. The driver container is privileged only to the extent needed to call the storage API — usually no host-filesystem access, which is the node plugin\'s job.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'controller-rpcs': controllerRpcs,
  },
  labs: {},
  simulations: {},
};
