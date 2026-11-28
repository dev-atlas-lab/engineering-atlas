import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { statefulsetIdentityScene } from '../storage-scenes';
import { statefulsetStorageSimulation } from '../storage-simulations';
import { renderStsState } from '../storage-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const stsWhyNotDeployment: LessonBody = {
  learningObjectives: [
    'Explain why Deployments cannot safely manage clustered stateful workloads',
    'Connect StatefulSet ordinal identity to Headless Services and per-Pod PVCs',
  ],
  visualization: statefulsetIdentityScene,
  sections: [
    {
      heading: 'A Deployment treats Pods and storage as interchangeable',
      blocks: [
        {
          type: 'paragraph',
          text: 'If you attach a single ReadWriteOnce PVC to a Deployment with `replicas: 3`, all three Pods try to mount the same disk. On block storage (EBS, Azure Disk), Pods on other nodes fail with `Multi-Attach error`. If you use ReadWriteMany instead, all three replicas share one directory and overwrite each other’s Write-Ahead Logs unless the application supports shared-disk clustering.',
        },
        {
          type: 'paragraph',
          text: 'A StatefulSet solves this by managing Pods directly (with no ReplicaSet in between) and binding each Pod ordinal `0..N-1` to its own stable name, DNS hostname, and dedicated PersistentVolumeClaim.',
        },
      ],
    },
  ],
};

const stsControllerGuarantees: LessonBody = {
  learningObjectives: [
    'Describe how the StatefulSet controller reconciles Pods and PVCs directly',
  ],
  sections: [
    {
      heading: 'Direct Pod reconciliation and strict invariants',
      blocks: [
        {
          type: 'list',
          items: [
            'No ReplicaSet layer: the StatefulSet controller creates, updates, and deletes Pod objects directly.',
            'Deterministic naming: Pods are always `<statefulset>-0`, `<statefulset>-1`, …, `<statefulset>-(N-1)`.',
            'Monotonic PVC pairing: `<vct-name>-<statefulset>-<ordinal>` is created before or alongside the Pod and re-attached whenever that ordinal is recreated.',
            'At-most-one identity: Kubernetes never runs two Pods with the same ordinal name simultaneously.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Deleting a Pod in a StatefulSet replaces that exact ordinal Pod (`web-1` → `web-1`) on whatever node the scheduler chooses, and the CSI driver re-attaches `data-web-1` to the new node.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'sts-arch-kc-1',
      type: 'single-choice',
      prompt: 'A StatefulSet `pg` with `replicas: 3` uses `volumeClaimTemplates` named `data`. Pod `pg-1` is evicted when its node drains and is rescheduled onto a different node. What storage does the new `pg-1` attach?',
      difficulty: 'beginner',
      learningObjective: 'Describe the three guarantees StatefulSet maintains: identity, ordering, and stable storage',
      options: [
        { id: 'a', label: 'The existing `data-pg-1` PVC, re-attached to the new node with all prior data intact', correct: true, explanation: 'Correct — StatefulSet binds each ordinal to its existing PVC; the volume moves with the ordinal identity.' },
        { id: 'b', label: 'A freshly provisioned empty PVC named `data-pg-3`', correct: false, explanation: 'Replacement of `pg-1` keeps ordinal 1 and reuses `data-pg-1`, not a new ordinal.' },
        { id: 'c', label: 'It shares `data-pg-0` with `pg-0` until resynced', correct: false, explanation: 'Each ordinal owns an independent PVC; Pods never share another ordinal’s template claim.' },
      ],
    },
  ],
};

const stsLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '15 minutes',
  description:
    'Scale a StatefulSet up and down, delete a middle Pod (`web-1`), and verify how ordinal identity and per-replica PVCs behave. (Simplified synchronous OrderedReady model without `podManagementPolicy: Parallel`.)',
  learningObjectives: [
    'Observe per-replica PVC creation during scale-up',
    'Verify identity preservation on Pod deletion and PVC retention on scale-down',
  ],
  prerequisites: [
    { type: 'concept', id: 'statefulset-architecture', label: 'StatefulSet Architecture', description: 'Understand ordinals and volumeClaimTemplates.' },
  ],
  content: {
    simulationId: 'statefulset-storage-simulator',
    instructions: [
      { id: 'step-1', label: 'Scale up to 5', description: 'Start with 3 replicas (`web-0..2`) and scale up to 5. Observe `web-3` and `web-4` receiving `data-web-3` and `data-web-4`.' },
      { id: 'step-2', label: 'Delete web-1', description: 'Simulate deleting `web-1`. Verify the controller recreates `web-1` with `data-web-1`, preserving identity.' },
      { id: 'step-3', label: 'Scale down to 2', description: 'Watch `web-4`, `web-3`, `web-2` terminate in reverse ordinal order while `data-web-2..4` remain retained (orphaned) PVCs.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'sts-pvcs-never-lost-implicitly',
        label: 'All created PVCs are retained across scale-down and Pod replacement',
        check: (state) => {
          const s = state as { pods: { ordinal: number; pvcName: string }[]; pvcs: { ordinal: number; name: string }[] };
          return s.pods.every((p) => s.pvcs.some((pv) => pv.ordinal === p.ordinal && pv.name === p.pvcName));
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'sts-why-not-deployment': stsWhyNotDeployment,
    'sts-controller-guarantees': stsControllerGuarantees,
  },
  labs: {
    'statefulset-storage-simulator': stsLab,
  },
  simulations: {
    'statefulset-storage-simulator': bindSimulation(statefulsetStorageSimulation, renderStsState),
  },
};
