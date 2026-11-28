import type { ConceptMeta } from '../../types';

export const pvcPendingTroubleshooting: ConceptMeta = {
  id: 'pvc-pending-troubleshooting',
  title: 'Pending PVC Troubleshooting',
  description: 'A systematic triage ladder for Pending PVCs — distinguishing missing StorageClasses, failed provisioners, topology conflicts, and intentional WaitForFirstConsumer deferral.',
  status: 'available',
  learningObjectives: [
    'Follow a deterministic decision tree to diagnose any Pending PVC',
    'Inspect PVC Events and external-provisioner logs to isolate root causes',
  ],
  prerequisites: ['persistent-volume-claims', 'dynamic-provisioning'],
  relatedConcepts: ['volume-attach-and-mount-failures', 'waitforfirstconsumer'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'pvc-pending-decision-ladder', title: 'The Pending PVC Decision Ladder', kind: 'concept' },
    { id: 'inspecting-pvc-and-provisioner-events', title: 'Reading Events and Provisioner Logs', kind: 'concept' },
  ],
  labs: [
    { id: 'storage-troubleshooting-lab', title: 'Storage Troubleshooting Lab', type: 'simulation' },
  ],
};

export const volumeAttachAndMountFailures: ConceptMeta = {
  id: 'volume-attach-and-mount-failures',
  title: 'Failed Volume Attachment and Mount Failures',
  description: 'Separating control-plane FailedAttachVolume errors from node-level FailedMount stage/publish/filesystem failures.',
  status: 'available',
  learningObjectives: [
    'Distinguish FailedAttachVolume from FailedMount in Pod Events',
    'Inspect CSI controller vs CSI node DaemonSet logs based on failure layer',
  ],
  prerequisites: ['volume-attach-and-mount-lifecycle'],
  relatedConcepts: ['multi-attach-and-rwo-constraints', 'node-failure-and-volume-recovery'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'diagnosing-failed-attach', title: 'Diagnosing FailedAttachVolume', kind: 'concept' },
    { id: 'diagnosing-failed-mount', title: 'Diagnosing FailedMount on the Node', kind: 'concept' },
  ],
};

export const multiAttachAndRwoConstraints: ConceptMeta = {
  id: 'multi-attach-and-rwo-constraints',
  title: 'ReadWriteOnce and Multi-Attach Constraints',
  description: 'Why ReadWriteOnce volumes deadlock Deployment RollingUpdates across nodes and how Recreate or StatefulSet avoids the collision.',
  status: 'available',
  learningObjectives: [
    'Explain why Deployment RollingUpdate deadlocks with a ReadWriteOnce PVC',
    'Resolve Multi-Attach errors cleanly without corrupting filesystems',
  ],
  prerequisites: ['access-modes', 'volume-attach-and-mount-failures'],
  relatedConcepts: ['rolling-updates', 'node-failure-and-volume-recovery'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'why-multi-attach-happens', title: 'Why Multi-Attach Happens', kind: 'concept' },
    { id: 'resolving-rwo-rollout-deadlocks', title: 'Fixing RWO Deployment Rollout Deadlocks', kind: 'concept' },
  ],
};

export const nodeFailureAndVolumeRecovery: ConceptMeta = {
  id: 'node-failure-and-volume-recovery',
  title: 'Node Failure and Volume Recovery',
  description: 'What happens to attached RWO volumes when a worker node vanishes ungracefully — force-detach timers, Non-Graceful Node Shutdown, and VolumeAttachment cleanup.',
  status: 'available',
  learningObjectives: [
    'Trace attach-detach behavior when a node stops heartbeating',
    'Use the out-of-service taint safely to recover workloads after confirmed node failure',
  ],
  prerequisites: ['volume-attach-and-mount-failures', 'stateful-failure-and-recovery'],
  relatedConcepts: ['multi-attach-and-rwo-constraints', 'storage-observability-and-diagnostics'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'ungraceful-node-shutdown', title: 'What Happens When a Node Vanishes', kind: 'concept' },
    { id: 'non-graceful-node-shutdown-taint', title: 'Non-Graceful Node Shutdown Recovery', kind: 'concept' },
  ],
};

export const storageCapacityAndDiskPressure: ConceptMeta = {
  id: 'storage-capacity-and-disk-pressure',
  title: 'Capacity Exhaustion and DiskPressure',
  description: 'Managing node ephemeral-storage exhaustion, kubelet DiskPressure eviction, and recovering full PersistentVolumes.',
  status: 'available',
  learningObjectives: [
    'Prevent ephemeral-storage evictions with requests, limits, and emptyDir.sizeLimit',
    'Execute an online or offline recovery runbook when a PVC hits 100% usage',
  ],
  prerequisites: ['emptydir', 'csi-volume-expansion'],
  relatedConcepts: ['storage-observability-and-diagnostics', 'resource-requests-and-limits'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'ephemeral-storage-eviction', title: 'Node DiskPressure and Pod Eviction', kind: 'concept' },
    { id: 'pvc-full-and-expansion-runbook', title: 'Recovering a 100% Full PVC', kind: 'concept' },
  ],
};

export const storagePerformanceTuning: ConceptMeta = {
  id: 'storage-performance-tuning',
  title: 'Storage Performance Considerations',
  description: 'IOPS, throughput, queue depth, cloud volume size-coupled limits, burst credits, and distinguishing slow storage from CPU throttling.',
  status: 'available',
  learningObjectives: [
    'Identify cloud volume IOPS/throughput caps and burst-credit depletion',
    'Benchmark volume performance safely and select appropriate StorageClass tiers',
  ],
  prerequisites: ['storageclass', 'volume-attach-and-mount-lifecycle'],
  relatedConcepts: ['storage-observability-and-diagnostics', 'cpu-throttling'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'iops-throughput-and-latency', title: 'IOPS, Throughput, and Queue Depth', kind: 'concept' },
    { id: 'cloud-volume-sizing-traps', title: 'Cloud Volume Sizing and Burst Traps', kind: 'concept' },
  ],
};

export const storageObservabilityAndDiagnostics: ConceptMeta = {
  id: 'storage-observability-and-diagnostics',
  title: 'Operational Observability and Diagnostics',
  description: 'Monitoring kubelet volume stats and CSI sidecar metrics, alerting before volumes fill or detach-stall, and running structured storage incident triage.',
  status: 'available',
  learningObjectives: [
    'Select the key kubelet and CSI metrics to alert on in production',
    'Execute a structured incident runbook from symptom to verified fix',
  ],
  prerequisites: ['pvc-pending-troubleshooting', 'storage-capacity-and-disk-pressure'],
  relatedConcepts: ['metrics-and-alerting', 'storage-performance-tuning'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'kubelet-and-csi-metrics', title: 'Kubelet Volume Stats and CSI Metrics', kind: 'concept' },
    { id: 'storage-incident-runbook', title: 'Structured Storage Incident Triage', kind: 'concept' },
  ],
};
