import type { ConceptContentModule, LessonBody } from '../../types';
import { csiArchitectureScene } from '../storage-scenes';

const whatCsiIs: LessonBody = {
  learningObjectives: [
    'Describe CSI\'s role as a vendor-neutral interface',
    'Explain why in-tree storage plugins are being removed',
  ],
  sections: [
    {
      heading: 'An interface, not an implementation',
      blocks: [
        {
          type: 'paragraph',
          text: 'CSI is a specification (a set of gRPC services) that storage vendors implement, with no Kubernetes-specific code in the Kubernetes source tree. The Kubernetes storage layer calls CSI RPCs; the vendor\'s CSI driver translates those into native cloud/SAN/NFS API calls. The same CSI driver can be used in Kubernetes, Mesos, Nomad, Cloud Foundry — anywhere a CSI client exists.',
        },
        {
          type: 'list',
          items: [
            'Before CSI, every cloud vendor had to upstream its storage plugin into Kubernetes ("in-tree" plugins). Every Kubernetes release bundled every vendor\'s code, and a storage bug meant a Kubernetes release.',
            'With CSI, vendors ship their drivers out-of-tree and release on their own cadence. Kubernetes core shrinks.',
            'The project is now actively removing in-tree plugins and redirecting them to CSI equivalents (CSI migration). GCE PD, EBS, Azure Disk, Azure File, vSphere, OpenStack Cinder, Ceph RBD have all migrated.',
          ],
        },
      ],
    },
  ],
  visualization: csiArchitectureScene,
};

const csiServices: LessonBody = {
  learningObjectives: ['Enumerate the three CSI gRPC services'],
  sections: [
    {
      heading: 'Identity, Controller, Node',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Service', 'Responsibility', 'Deployed on'],
          rows: [
            ['Identity', 'Reports the driver name, version, and which capabilities it implements', 'Both controller and node processes'],
            ['Controller', 'Cluster-scoped operations: CreateVolume, DeleteVolume, ControllerPublishVolume (attach), ControllerUnpublishVolume (detach), CreateSnapshot, ControllerExpandVolume', 'One or more controller Pods per cluster'],
            ['Node', 'Per-node operations: NodeStageVolume (first mount on this node), NodePublishVolume (mount into Pod dir), NodeUnpublishVolume, NodeUnstageVolume, NodeGetVolumeStats', 'DaemonSet, one Pod per node'],
          ],
        },
        {
          type: 'paragraph',
          text: 'A CSI driver may support only a subset of these. Local-storage drivers can skip the Controller service entirely (no attach step). Immutable read-only drivers can skip writes. The driver reports its capabilities via Identity so Kubernetes knows what to expect.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-csi-is': whatCsiIs,
    'csi-services': csiServices,
  },
  labs: {},
  simulations: {},
};
