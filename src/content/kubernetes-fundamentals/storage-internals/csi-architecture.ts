import type { ConceptContentModule, LessonBody } from '../../types';

const sidecarPattern: LessonBody = {
  learningObjectives: [
    'Describe the sidecar pattern in CSI',
    'Match each sidecar to its Kubernetes responsibility',
  ],
  sections: [
    {
      heading: 'Sidecars bridge Kubernetes API to gRPC',
      blocks: [
        {
          type: 'paragraph',
          text: 'The CSI driver is a gRPC server that speaks only CSI — it does not know about Kubernetes objects. Sidecars run alongside the driver, watch Kubernetes objects, and translate between them. Each sidecar is a separate project maintained by the Kubernetes SIG Storage group.',
        },
        {
          type: 'comparisonTable',
          headers: ['Sidecar', 'Watches', 'Calls'],
          rows: [
            ['external-provisioner', 'PVCs', 'CreateVolume / DeleteVolume on the driver'],
            ['external-attacher', 'VolumeAttachments', 'ControllerPublishVolume / ControllerUnpublishVolume'],
            ['external-resizer', 'PVCs with spec.resources updated', 'ControllerExpandVolume / NodeExpandVolume'],
            ['external-snapshotter', 'VolumeSnapshotContents', 'CreateSnapshot / DeleteSnapshot'],
            ['livenessprobe', 'kubelet probes', 'ProbeRequest on Identity service'],
            ['node-driver-registrar', 'registration directory', 'Registers the driver with the kubelet'],
          ],
        },
      ],
    },
  ],
};

const deploymentTopology: LessonBody = {
  learningObjectives: ['Describe how CSI plugins are deployed on a cluster'],
  sections: [
    {
      heading: 'Two deployments per driver',
      blocks: [
        {
          type: 'list',
          items: [
            'Controller Deployment (cluster-scoped work) — typically 1–3 replicas with leader election. Contains the driver container plus the control-plane sidecars (external-provisioner, external-attacher, external-resizer, external-snapshotter).',
            'Node DaemonSet (per-node work) — one Pod on every node that may host user workloads. Contains the driver container plus node-driver-registrar and livenessprobe.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          code: `# Inspect what a vendor shipped.
kubectl get deployment -n kube-system -l app=ebs-csi-controller
kubectl get daemonset -n kube-system -l app=ebs-csi-node

# One per node, scheduled where the DaemonSet tolerates taints.
kubectl get pod -n kube-system -l app=ebs-csi-node -o wide`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The driver container is the same binary in both Deployments. It is told which services to run (`--all` or `--controller`/`--node`). Sidecars vary; the controller deployment has the heavy ones.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'sidecar-pattern': sidecarPattern,
    'deployment-topology': deploymentTopology,
  },
  labs: {},
  simulations: {},
};
