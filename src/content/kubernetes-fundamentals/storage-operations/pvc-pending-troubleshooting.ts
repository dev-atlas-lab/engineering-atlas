import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { pvcTroubleshootingScene } from '../storage-scenes';
import { storageTroubleshootingSimulation } from '../storage-simulations';
import { renderTroubleshootingState } from '../storage-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const pvcPendingDecisionLadder: LessonBody = {
  learningObjectives: ['Follow a deterministic decision tree to diagnose any Pending PVC'],
  visualization: pvcTroubleshootingScene,
  sections: [
    {
      heading: 'Four root causes behind one Pending status',
      blocks: [
        {
          type: 'paragraph',
          text: 'Seeing `STATUS: Pending` in `kubectl get pvc` is only the symptom. Never guess or delete Pods before reading Events — deleting a Pod never unsticks a broken StorageClass or missing PV, and under WaitForFirstConsumer a Pending PVC is completely normal until a Pod schedules.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Check `spec.storageClassName`: if unset and no default class exists, static binding looks for a PV with `storageClassName: ""`.',
            'Verify the named `StorageClass` exists in `kubectl get sc`.',
            'Inspect `kubectl describe pvc <name>` Events: `WaitingForFirstConsumer` means check the consuming Pod’s scheduling events instead.',
            'If `ProvisioningFailed` appears, check `external-provisioner` logs for IAM, quota, or parameter errors.',
          ],
        },
      ],
    },
  ],
};

const inspectingPvcAndProvisionerEvents: LessonBody = {
  learningObjectives: ['Inspect PVC Events and external-provisioner logs to isolate root causes'],
  sections: [
    {
      heading: 'Commands that reveal the exact failure boundary',
      blocks: [
        {
          type: 'code',
          language: 'bash',
          code: `# 1. Read PVC Events first
kubectl describe pvc db-data -n prod

# 2. If WaitForFirstConsumer or topology conflict, inspect the Pod Events
kubectl describe pod db-0 -n prod

# 3. Inspect CSI controller / external-provisioner logs for backend errors
kubectl logs -n kube-system deploy/ebs-csi-controller -c csi-provisioner --tail=100`,
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'pvc-triage-kc-1',
      type: 'single-choice',
      prompt: '`kubectl describe pvc app-data` shows `WaitForFirstConsumer: waiting for first consumer to be created before binding`. Meanwhile `kubectl describe pod app-0` shows `0/3 nodes are available: 3 Insufficient cpu`. Where is the actual problem?',
      difficulty: 'intermediate',
      learningObjective: 'Inspect PVC Events and external-provisioner logs to isolate root causes',
      options: [
        { id: 'a', label: 'The Pod cannot be scheduled due to CPU capacity, so WFC never selects a node to trigger PVC provisioning', correct: true, explanation: 'Correct — WFC waits for the Scheduler to place the Pod first; fixing CPU availability unblocks both the Pod and the PVC.' },
        { id: 'b', label: 'The CSI external-provisioner Pod is crashed', correct: false, explanation: 'external-provisioner has not even been asked to run yet because the Scheduler has not placed the Pod.' },
        { id: 'c', label: 'The storage backend is out of disk space', correct: false, explanation: 'No storage allocation was attempted; the bottleneck is CPU on cluster nodes.' },
      ],
    },
  ],
};

const troubleshootingLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Triage seven realistic Kubernetes storage incidents from cluster Events, apply diagnostic steps in order, and distinguish useful diagnostics from useless or misleading distractions. (Curated offline diagnostic runbook model.)',
  learningObjectives: [
    'Select the exact diagnostic command that reveals each storage failure layer',
    'Avoid distracting actions like deleting Pods or reinstalling CNI during storage outages',
  ],
  prerequisites: [
    { type: 'concept', id: 'pvc-pending-troubleshooting', label: 'Pending PVC Troubleshooting', description: 'Know the PVC and Pod Event layers.' },
  ],
  content: {
    simulationId: 'storage-troubleshooting-lab',
    instructions: [
      { id: 'step-1', label: 'Topology conflict', description: 'Start on `PVC Pending — topology conflict`. Step through diagnostics until `kubectl describe pod` reveals the node affinity conflict.' },
      { id: 'step-2', label: 'FailedAttachVolume vs DiskPressure', description: 'Switch symptoms to `FailedAttachVolume` (resolved via `describe-pod`) and `Node DiskPressure` (resolved via `describe-node`), noticing how useless steps (`Delete the Pod`) fail to move the needle.' },
      { id: 'step-3', label: 'Slow I/O', description: 'Select `Slow I/O on an attached volume` and verify why `iostat` + `Inspect StorageClass parameters` diagnose IOPS caps while Kubernetes Events stay Normal.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'triage-reaches-root-cause',
        label: 'Diagnostic steps identify the symptom’s root cause cleanly',
        check: (state) => {
          const s = state as { resolved: boolean; rootCause: string | null };
          return s.resolved && !!s.rootCause;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'pvc-pending-decision-ladder': pvcPendingDecisionLadder,
    'inspecting-pvc-and-provisioner-events': inspectingPvcAndProvisionerEvents,
  },
  labs: {
    'storage-troubleshooting-lab': troubleshootingLab,
  },
  simulations: {
    'storage-troubleshooting-lab': bindSimulation(storageTroubleshootingSimulation, renderTroubleshootingState),
  },
};
