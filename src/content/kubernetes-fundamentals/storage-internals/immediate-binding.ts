import type { ConceptContentModule, LessonBody } from '../../types';

const immediateOverview: LessonBody = {
  learningObjectives: [
    'Describe Immediate volumeBindingMode behavior',
    'Identify when Immediate causes zonal scheduling conflicts',
  ],
  sections: [
    {
      heading: 'Provision as soon as the PVC is created',
      blocks: [
        {
          type: 'paragraph',
          text: '`volumeBindingMode: Immediate` is the default when omitted on a StorageClass. As soon as a PVC is created, external-provisioner calls CSI CreateVolume and binds the resulting PV — without waiting for any Pod to reference the claim.',
        },
        {
          type: 'list',
          items: [
            'Works seamlessly for cluster-wide/regional storage (NFS, CephFS, multi-zone replicated volumes) that any node in any zone can mount.',
            'Creates a trap for single-zone block disks (AWS EBS, Azure Managed Disks, GCP Persistent Disks): if the provisioner picks zone-a at random while the Pod’s nodeAffinity, anti-affinity, or CPU capacity forces it onto zone-b, the Pod stays stuck in Pending forever.',
            'Fixing a wrong-zone PV requires deleting the PVC/PV (losing data if policy is Delete) or manually migrating the disk across zones.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Whenever you see `0/N nodes are available: N node(s) had volume node affinity conflict`, check the StorageClass `volumeBindingMode`. Immediate binding on zonal block storage is the most common culprit.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'immediate-kc-1',
      type: 'single-choice',
      prompt: 'Why can `volumeBindingMode: Immediate` cause a Pod to fail scheduling with "volume node affinity conflict" in a multi-AZ cluster?',
      difficulty: 'intermediate',
      learningObjective: 'Identify when Immediate causes zonal scheduling conflicts',
      options: [
        { id: 'a', label: 'The PV was provisioned in one availability zone before the scheduler evaluated where the Pod could actually run', correct: true, explanation: 'Correct — Immediate provisions blindly without Pod scheduling constraints, pinning the PV to a zone that may conflict with the Pod.' },
        { id: 'b', label: 'Immediate disables the CSI node plugin on worker nodes', correct: false, explanation: 'CSI node plugins remain active; the issue is a zonal topology mismatch during scheduling.' },
        { id: 'c', label: 'Immediate creates local hostPath volumes on the control plane', correct: false, explanation: 'Immediate still calls the StorageClass provisioner; the problem is premature zone selection.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'immediate-overview': immediateOverview,
  },
  labs: {},
  simulations: {},
};
