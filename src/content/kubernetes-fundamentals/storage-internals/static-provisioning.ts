import type { ConceptContentModule, LessonBody } from '../../types';

const staticOverview: LessonBody = {
  learningObjectives: [
    'Create a static PV pointing at a pre-existing backing volume',
    'Describe when static provisioning is the right choice',
  ],
  sections: [
    {
      heading: 'An admin creates the PV by hand',
      blocks: [
        {
          type: 'paragraph',
          text: 'Static provisioning means the backing storage exists already and the admin writes a PV object pointing at it. Kubernetes never creates or destroys the backing storage in this flow — it only binds PVCs to the PV.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: v1
kind: PersistentVolume
metadata:
  name: imported-db-20g
spec:
  capacity: { storage: 20Gi }
  accessModes: [ReadWriteOnce]
  persistentVolumeReclaimPolicy: Retain
  storageClassName: imported     # non-default; new PVCs opt in
  csi:
    driver: ebs.csi.aws.com
    volumeHandle: vol-0abc1234def5     # existing cloud volume id
    fsType: ext4`,
        },
        {
          type: 'list',
          items: [
            'Setting reclaimPolicy to Retain by default — the admin took the trouble to create this; Kubernetes should not auto-delete.',
            'storageClassName often names a specific class ("imported", "legacy"); matching PVCs explicitly opt in. The default class does not accidentally grab these PVs.',
            'Local PVs use the local-storage StorageClass with `kubernetes.io/no-provisioner` and nodeAffinity pinning them to a specific node.',
          ],
        },
      ],
    },
    {
      heading: 'Where it fits',
      blocks: [
        {
          type: 'list',
          items: [
            'Importing data — copy a snapshot into a new cloud volume, then create a PV pointing at it.',
            'Local PVs — directly-attached NVMe for latency-sensitive workloads. One PV per node, one per path.',
            'Multi-cluster shared storage — the same backing filesystem is pre-provisioned; clusters each get a PV pointing at it.',
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'static-overview': staticOverview,
  },
  labs: {},
  simulations: {},
};
