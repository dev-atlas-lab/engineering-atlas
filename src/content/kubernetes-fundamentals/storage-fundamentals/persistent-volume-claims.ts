import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { binderSimulation } from '../storage-simulations';
import { renderBindingState } from '../storage-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const whatAPvcIs: LessonBody = {
  learningObjectives: [
    'Describe a PVC as a request, not an allocation',
    'Enumerate the PVC fields that drive matching',
  ],
  sections: [
    {
      heading: 'A PVC is what the application asks for',
      blocks: [
        {
          type: 'paragraph',
          text: 'A PersistentVolumeClaim is a namespaced object declaring what the application needs: capacity, access modes, a StorageClass. It does not describe where the storage comes from. The control plane (static matching) or the external provisioner (dynamic) is responsible for producing a PV that satisfies the claim.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: db-data, namespace: team-a }
spec:
  storageClassName: fast
  accessModes: [ReadWriteOnce]
  resources:
    requests: { storage: 10Gi }`,
        },
        {
          type: 'list',
          items: [
            'storageClassName — if set, only PVs of this class are considered. If omitted, cluster behavior depends on whether a default StorageClass exists.',
            'accessModes — what access modes the claim needs (a subset of what any matching PV supports).',
            'resources.requests.storage — minimum capacity. Matching PVs must be at least this size.',
            'volumeMode — Filesystem or Block.',
            'selector — a label selector to pick a specific PV. Rarely used; most workloads let the class-and-size matching decide.',
          ],
        },
      ],
    },
    {
      heading: 'What happens after apply',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'API Server stores the PVC in Pending state.',
            'The PV controller searches for a matching Available PV (static path).',
            'If nothing matches and the PVC\'s class names a provisioner, the external-provisioner creates a PV (dynamic path).',
            'Once a PV is matched or created, both sides are bound — PVC.status.phase = Bound and PV.status.phase = Bound.',
            'A Pod can reference the PVC; the kubelet mounts the backing storage per the PV\'s CSI driver.',
          ],
        },
      ],
    },
  ],
};

const pvcPendingReasons: LessonBody = {
  learningObjectives: ['List the distinct reasons a PVC stays Pending'],
  sections: [
    {
      heading: 'Pending is not one state',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Reason', 'What happened', 'Fix'],
          rows: [
            ['No StorageClass named AND no default exists', 'Static matching finds no PV; nothing to provision', 'Set storageClassName or create a matching PV'],
            ['StorageClass does not exist', 'Provisioner can\'t be identified', 'Create the class or fix the name'],
            ['Dynamic provisioner is unhealthy / missing credentials', 'CSI provisioner can\'t create a volume', 'Check external-provisioner Pod logs and IAM'],
            ['volumeBindingMode: WaitForFirstConsumer', 'By design — Pending until a Pod references this claim', 'Not an error; create the Pod'],
            ['Topology conflict', 'Storage can only exist in zones where the Pod cannot be scheduled', 'Switch to WaitForFirstConsumer or relax Pod nodeSelector'],
            ['Capacity exhausted on the storage backend', 'CSI returns ResourceExhausted', 'Free capacity or move to a different storage pool'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Every one of these surfaces a distinct message in `kubectl describe pvc` Events. Reading events before guessing is almost always the fastest path.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'pvc-kc-1',
      type: 'single-choice',
      prompt: 'A PVC with storageClassName: standard-wfc stays Pending. kubectl describe shows no error — just that the volume will be bound when the first consumer is scheduled. What is happening?',
      difficulty: 'intermediate',
      learningObjective: 'List the distinct reasons a PVC stays Pending',
      options: [
        { id: 'a', label: 'The StorageClass is WaitForFirstConsumer; provisioning is deferred until a Pod references the claim', correct: true, explanation: 'Correct — this is intended behavior, not a failure.' },
        { id: 'b', label: 'The dynamic provisioner is broken', correct: false, explanation: 'A broken provisioner surfaces an error event; "waiting for first consumer" is distinct.' },
        { id: 'c', label: 'Capacity on the cloud backend is exhausted', correct: false, explanation: 'Exhaustion surfaces ProvisioningFailed; waiting-for-consumer is silent and intentional.' },
      ],
    },
  ],
};

const binderLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '15 minutes',
  description:
    'Walk through PV/PVC matching by hand. Change claim size, class, and access mode and see when it binds and when it stays Pending.',
  learningObjectives: [
    'See class, capacity, and access-mode matching in action',
    'Diagnose a Pending PVC from the exact matching step that failed',
  ],
  prerequisites: [
    { type: 'knowledge', label: 'PV and PVC shapes', description: 'Know the fields on each object.' },
  ],
  content: {
    simulationId: 'pv-pvc-binder-simulator',
    instructions: [
      { id: 'step-1', label: 'Baseline bind', description: 'class=fast, 10 GiB, RWO. Should bind to pv-fast-20 (tightest fit).' },
      { id: 'step-2', label: 'Oversize request', description: 'Bump to 80 GiB in class=fast. No class-fast PV has 80 GiB — Pending with a capacity reason.' },
      { id: 'step-3', label: 'Wrong class', description: 'Switch class to archive. No PV has that class — Pending with a class reason.' },
      { id: 'step-4', label: 'RWX request', description: 'class=shared, RWX, 50 GiB. Binds to the shared RWX PV.' },
      { id: 'step-5', label: 'Empty inventory', description: 'Switch scenario to "No shared PV". RWX claim becomes Pending — no PV supports the mode.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'bound-or-pending-with-reason',
        label: 'A claim is either Bound or Pending with an explicit reason',
        check: (state) => {
          const s = state as { pvcs: { status: string; reason: string | null }[] };
          const c = s.pvcs[0];
          return !!c && (c.status === 'Bound' || !!c.reason);
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'what-a-pvc-is': whatAPvcIs,
    'pvc-pending-reasons': pvcPendingReasons,
  },
  labs: {
    'pv-pvc-binder-simulator': binderLab,
  },
  simulations: {
    'pv-pvc-binder-simulator': bindSimulation(binderSimulation, renderBindingState),
  },
};
