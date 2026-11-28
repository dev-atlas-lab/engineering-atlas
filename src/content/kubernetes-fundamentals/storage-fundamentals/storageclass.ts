import type { ConceptContentModule, LessonBody } from '../../types';

const storageClassOverview: LessonBody = {
  learningObjectives: [
    'Describe a StorageClass as the recipe behind dynamic provisioning',
    'Enumerate the key StorageClass fields',
  ],
  sections: [
    {
      heading: 'A class is a recipe, not a pool',
      blocks: [
        {
          type: 'paragraph',
          text: 'A StorageClass describes how to create a PV on demand. It names a CSI provisioner, parameters for the storage system, a reclaim policy, and a binding mode. It is NOT a quota or a physical pool — many different volumes may exist from one class.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "6000"
  throughput: "250"
  encrypted: "true"
reclaimPolicy: Delete           # PVs dynamic-provisioned by this class are deleted with the PVC
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
mountOptions: ["noatime"]`,
        },
        {
          type: 'list',
          items: [
            'provisioner — the CSI driver name (ebs.csi.aws.com, pd.csi.storage.gke.io, disk.csi.azure.com, …). "kubernetes.io/no-provisioner" is a sentinel used only by static PV workflows.',
            'parameters — vendor-specific. gp3 vs gp2 on AWS, pd-ssd vs pd-standard on GCP, provisioning tiers on Azure, etc.',
            'reclaimPolicy — what happens to a dynamically-provisioned PV when its PVC is deleted. Delete (default; actually deletes the backing volume) or Retain (keep for manual recovery).',
            'volumeBindingMode — Immediate (provision now) or WaitForFirstConsumer (provision once a Pod schedules).',
            'allowVolumeExpansion — whether an admin can grow this class\'s volumes by editing the PVC.',
          ],
        },
      ],
    },
  ],
};

const defaultClass: LessonBody = {
  learningObjectives: [
    'Describe how the default StorageClass is chosen',
    'Avoid the "two defaults" trap',
  ],
  sections: [
    {
      heading: 'One class per cluster carries the default-class annotation',
      blocks: [
        {
          type: 'paragraph',
          text: 'A StorageClass is the default when it carries the `storageclass.kubernetes.io/is-default-class: "true"` annotation. PVCs that omit `storageClassName` get this class at admission. Clusters are expected to have exactly one default StorageClass.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# List StorageClasses — the default is marked with (default).
kubectl get sc
NAME                 PROVISIONER         AGE
standard (default)   kubernetes.io/gce-pd  90d
premium              pd.csi.storage.gke.io 90d`,
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Two classes marked default is accepted by the API Server but produces undefined behavior — admission picks "a" default, not a specified one. If you see two default marks in `kubectl get sc`, fix it immediately.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'sc-kc-1',
      type: 'single-choice',
      prompt: 'A PVC omits spec.storageClassName on a cluster that has one StorageClass annotated is-default-class: "true". What happens when the PVC is submitted?',
      difficulty: 'beginner',
      learningObjective: 'Describe how the default StorageClass is chosen',
      options: [
        { id: 'a', label: 'The DefaultStorageClass admission plugin assigns the default StorageClass name to the PVC', correct: true, explanation: 'Correct — omitting storageClassName falls back to the annotated default class (unlike setting storageClassName: "", which explicitly requests no StorageClass).' },
        { id: 'b', label: 'The API Server rejects the PVC because storageClassName is required', correct: false, explanation: 'storageClassName is optional; admission fills in the default class if one exists.' },
        { id: 'c', label: 'Kubernetes creates a new StorageClass automatically for the namespace', correct: false, explanation: 'StorageClasses are cluster-scoped resources created by cluster administrators, never auto-generated per namespace.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'storageclass-overview': storageClassOverview,
    'default-class': defaultClass,
  },
  labs: {},
  simulations: {},
};
