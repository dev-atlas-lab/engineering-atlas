import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { dynamicProvLifecycleScene } from '../storage-scenes';
import { dynamicProvisioningSimulation } from '../storage-simulations';
import { renderDynamicProvState } from '../storage-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const dynTimeline: LessonBody = {
  learningObjectives: [
    'Trace the dynamic provisioning timeline from PVC creation to Pod running',
    'Explain how StorageClass volumeBindingMode changes the order of scheduling and provisioning',
  ],
  visualization: dynamicProvLifecycleScene,
  sections: [
    {
      heading: 'How a claim produces a backing volume',
      blocks: [
        {
          type: 'paragraph',
          text: 'In dynamic provisioning, no PersistentVolume exists ahead of time. A tenant submits a PersistentVolumeClaim naming a StorageClass, and the external-provisioner sidecar watches the API Server for unbound claims whose class matches its CSI driver name.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'The API Server accepts the PVC in Pending state (applying the default StorageClass if storageClassName was omitted).',
            'When provisioning is triggered (immediately, or after the Pod is scheduled under WaitForFirstConsumer), external-provisioner calls CSI CreateVolume with capacity, access modes, StorageClass parameters, and topology constraints.',
            'The CSI controller plugin creates the backing storage volume in the cloud or SAN.',
            'external-provisioner creates a PersistentVolume object referencing the new volumeHandle and binds it to the PVC via spec.claimRef.',
            'Once the Pod is scheduled to a node, the attach-detach controller and kubelet attach, stage, and mount the volume.',
          ],
        },
      ],
    },
    {
      heading: 'Annotations that coordinate the flow',
      blocks: [
        {
          type: 'list',
          items: [
            '`volume.beta.kubernetes.io/storage-provisioner` (and `volume.kubernetes.io/storage-provisioner`) — tells controllers which provisioner owns the claim.',
            '`volume.kubernetes.io/selected-node` — written by the Scheduler under WaitForFirstConsumer so external-provisioner knows which node/zone topology to allocate in.',
            '`pv.kubernetes.io/bind-completed` — marks that binding finished, preventing re-binding after transient state updates.',
          ],
        },
      ],
    },
  ],
};

const provisionerMatching: LessonBody = {
  learningObjectives: [
    'Describe how a provisioner identifies which PVCs to act on',
    'Troubleshoot common dynamic provisioning failures',
  ],
  sections: [
    {
      heading: 'Ownership and failure modes',
      blocks: [
        {
          type: 'paragraph',
          text: 'Multiple CSI drivers can run in the same cluster (for example EBS for block disks and EFS for shared filesystems). Each external-provisioner instance ignores PVCs whose StorageClass names a different provisioner string, ensuring controllers do not race over the same claim.',
        },
        {
          type: 'comparisonTable',
          headers: ['Symptom', 'Likely cause', 'Where to check'],
          rows: [
            ['No ProvisioningFailed event; stays Pending', 'WaitForFirstConsumer waiting for a Pod, or no provisioner Pod running for that driver', 'kubectl describe pvc; check Pods in kube-system'],
            ['ProvisioningFailed: quota / limit exceeded', 'Cloud account volume or IOPS quota exhausted', 'external-provisioner container logs'],
            ['ProvisioningFailed: invalid parameter', 'StorageClass parameters contain a typo or unsupported disk type', 'StorageClass YAML vs CSI driver docs'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Because external-provisioner retries with exponential backoff, transient cloud API throttling eventually recovers once resolved — watch `kubectl describe pvc` Events to verify whether retries are succeeding.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'dyn-prov-kc-1',
      type: 'single-choice',
      prompt: 'A cluster runs both ebs.csi.aws.com and efs.csi.aws.com. How does the EFS external-provisioner know NOT to create a volume for an EBS PVC?',
      difficulty: 'beginner',
      learningObjective: 'Describe how a provisioner identifies which PVCs to act on',
      options: [
        { id: 'a', label: 'It resolves the PVC’s StorageClass and only acts when storageClass.provisioner matches its configured driver name', correct: true, explanation: 'Correct — each external-provisioner filters PVCs by the provisioner field on the referenced StorageClass.' },
        { id: 'b', label: 'It inspects the Pod container image to guess whether the app needs block or file storage', correct: false, explanation: 'Provisioners never inspect container images; matching is purely driven by StorageClass.provisioner.' },
        { id: 'c', label: 'The kubelet assigns each PVC to a driver after the container starts', correct: false, explanation: 'Dynamic provisioning happens via the control-plane external-provisioner before the container starts.' },
      ],
    },
  ],
};

const dynamicProvLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '15 minutes',
  description:
    'Compare Immediate and WaitForFirstConsumer binding across zonal topology constraints. Observe why Immediate can trap a Pod in Pending when the PV lands in the wrong zone. (Simplified 2-zone, single-PVC model.)',
  learningObjectives: [
    'Trace the step order difference between Immediate and WaitForFirstConsumer',
    'Trigger and diagnose a topology scheduling conflict caused by Immediate binding',
  ],
  prerequisites: [
    { type: 'concept', id: 'storageclass', label: 'StorageClass', description: 'Understand volumeBindingMode on a StorageClass.' },
  ],
  content: {
    simulationId: 'dynamic-provisioning-simulator',
    instructions: [
      { id: 'step-1', label: 'WaitForFirstConsumer baseline', description: 'Keep WFC with podZonePreference=zone-b and zoneConstraint=none. Watch the scheduler choose zone-b first, then provision the PV in zone-b.' },
      { id: 'step-2', label: 'Trigger an Immediate zone conflict', description: 'Switch volumeBindingMode to Immediate with zoneConstraint=none and podZonePreference=zone-b. The provisioner places the PV in zone-a before scheduling, making the Pod Unschedulable.' },
      { id: 'step-3', label: 'Unconsumed PVC under WFC', description: 'Set podRequestsVolume to false with WFC. Notice the PVC intentionally stays Pending until a consumer Pod arrives.' },
      { id: 'step-4', label: 'Impossible topology under WFC', description: 'Set WFC, zoneConstraint=zone-a, and podZonePreference=zone-b. No zone satisfies both constraints, so scheduling fails cleanly.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'dyn-prov-valid-outcome',
        label: 'Pod runs on a matching-zone PV, OR an explicit Pending/topology reason is surfaced',
        check: (state) => {
          const s = state as { phase: string; reason: string | null; podRequestsVolume: boolean };
          if (!s.podRequestsVolume) return s.phase === 'waiting-for-consumer' || s.phase === 'pv-provisioned';
          return s.phase === 'pod-running' || (s.phase === 'failed' && !!s.reason);
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'dyn-timeline': dynTimeline,
    'provisioner-matching': provisionerMatching,
  },
  labs: {
    'dynamic-provisioning-simulator': dynamicProvLab,
  },
  simulations: {
    'dynamic-provisioning-simulator': bindSimulation(dynamicProvisioningSimulation, renderDynamicProvState),
  },
};
