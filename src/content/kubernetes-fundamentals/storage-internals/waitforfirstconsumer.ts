import type { ConceptContentModule, LessonBody } from '../../types';

const wfcOverview: LessonBody = {
  learningObjectives: [
    'Describe the WaitForFirstConsumer scheduling-first flow',
    'Explain how topology-aware provisioning and CSIStorageCapacity work with the scheduler',
  ],
  sections: [
    {
      heading: 'Schedule first, provision second',
      blocks: [
        {
          type: 'paragraph',
          text: 'Setting `volumeBindingMode: WaitForFirstConsumer` (WFC) on a StorageClass tells external-provisioner to leave new PVCs unbound in Pending until a Pod referencing the PVC enters the scheduling queue. The VolumeBinding scheduler plugin then jointly evaluates Pod constraints (CPU, memory, nodeSelector, taints, anti-affinity) and storage topology.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'PVC is created and intentionally stays Pending (`WaitForFirstConsumer`).',
            'A Pod referencing the PVC is scheduled. The scheduler filters nodes whose topology (such as `topology.ebs.csi.aws.com/zone`) is compatible with the StorageClass.',
            'Once the scheduler chooses a node, it annotates the PVC with `volume.kubernetes.io/selected-node` and holds Pod binding briefly.',
            'external-provisioner reads the selected node’s topology labels, calls CreateVolume in that exact zone, and binds the PV.',
            'The scheduler sees the PVC is now Bound and completes binding the Pod to the chosen node.',
          ],
        },
      ],
    },
    {
      heading: 'Storage capacity tracking (CSIStorageCapacity)',
      blocks: [
        {
          type: 'paragraph',
          text: 'For local storage or capacity-constrained pools, knowing the zone is not enough — a node or pool might already be full. When a CSIDriver enables `storageCapacity: true`, external-provisioner publishes `CSIStorageCapacity` objects per topology segment so the scheduler avoids placing a Pod where the requested PVC size cannot fit.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'WaitForFirstConsumer is the default on modern managed Kubernetes StorageClasses (EKS gp3/gp2, AKS managed-csi, GKE standard-rwo) specifically to prevent cross-zone volume affinity deadlocks.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'wfc-kc-1',
      type: 'single-choice',
      prompt: 'With `volumeBindingMode: WaitForFirstConsumer`, which component chooses the availability zone where a new zonal cloud disk will be created?',
      difficulty: 'intermediate',
      learningObjective: 'Describe the WaitForFirstConsumer scheduling-first flow',
      options: [
        { id: 'a', label: 'The Kubernetes Scheduler, by selecting a node for the consuming Pod and annotating the PVC before provisioning runs', correct: true, explanation: 'Correct — the scheduler selects the node first and sets volume.kubernetes.io/selected-node, guiding external-provisioner.' },
        { id: 'b', label: 'kube-proxy, based on Service endpoint locality', correct: false, explanation: 'kube-proxy programs Service networking rules and is not involved in storage provisioning or scheduling.' },
        { id: 'c', label: 'The cloud provider API randomly at PVC creation time', correct: false, explanation: 'Random zone selection at PVC creation time is the Immediate problem that WaitForFirstConsumer eliminates.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'wfc-overview': wfcOverview,
  },
  labs: {},
  simulations: {},
};
