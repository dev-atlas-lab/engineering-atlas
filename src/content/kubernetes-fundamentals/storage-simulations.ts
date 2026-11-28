// Deterministic simulation engines for Slice 3D storage & reliability labs.
// All engines are pure functions of (params, state) — no randomness, no
// wall-clock dependence — so the same inputs always produce the same output.
//
// Intentional model simplifications (documented for learners):
// - Lab 1 (PV/PVC Binder): models static PV inventory matching only; omits dynamic
//   provisioning, label selectors, and volumeMode matching.
// - Lab 2 (Dynamic Provisioning): models a single PVC across 2 zones (zone-a / zone-b)
//   without modeling multi-node resource contention or CSIStorageCapacity objects.
// - Lab 3 (StatefulSet Storage): models synchronous OrderedReady scaling and PVC
//   retention without podManagementPolicy: Parallel or PVC retention policies.
// - Lab 4 (Backup & Recovery): uses discrete simulation ticks rather than wall-clock
//   timestamps and restores to a single target rather than point-in-time WAL replay.
// - Lab 5 (Storage Troubleshooting): presents curated diagnostic commands rather than
//   live cluster API queries or arbitrary shell execution.

import type { SimulationDefinition } from '../../engines/simulation/types';

// ---------------------------------------------------------------------------
// Lab 1: PV / PVC Binding Simulator
// ---------------------------------------------------------------------------
// Models the Kubernetes PV ↔ PVC binding algorithm without dynamic
// provisioning: only pre-existing PVs are considered. The control plane
// picks the smallest PV that satisfies the claim.

export type AccessMode = 'ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany' | 'ReadWriteOncePod';

export interface PvObject {
  id: string;
  capacityGb: number;
  accessModes: AccessMode[];
  storageClassName: string;
  status: 'Available' | 'Bound' | 'Released' | 'Failed';
  boundClaim: string | null;
}

export interface PvcObject {
  id: string;
  requestGb: number;
  accessModes: AccessMode[];
  storageClassName: string;
  status: 'Pending' | 'Bound';
  boundPv: string | null;
  reason: string | null;
}

export interface BindingState {
  pvs: PvObject[];
  pvcs: PvcObject[];
  log: string[];
}

const SUBSET = <T>(sub: T[], sup: T[]): boolean => sub.every((v) => sup.includes(v));

export function tryBind(pvc: PvcObject, pvs: PvObject[]): { pvId: string | null; reason: string } {
  const available = pvs.filter((p) => p.status === 'Available');
  if (available.length === 0) {
    return { pvId: null, reason: 'no Available PVs in the cluster for this storageClassName' };
  }
  const classMatches = available.filter((p) => p.storageClassName === pvc.storageClassName);
  if (classMatches.length === 0) {
    return { pvId: null, reason: `no Available PV has storageClassName="${pvc.storageClassName}"` };
  }
  const capacityMatches = classMatches.filter((p) => p.capacityGb >= pvc.requestGb);
  if (capacityMatches.length === 0) {
    return { pvId: null, reason: `no Available PV in class "${pvc.storageClassName}" has >= ${pvc.requestGb} GiB` };
  }
  const accessMatches = capacityMatches.filter((p) => SUBSET(pvc.accessModes, p.accessModes));
  if (accessMatches.length === 0) {
    return { pvId: null, reason: `no PV supports every requested access mode (${pvc.accessModes.join(', ')})` };
  }
  // Choose the smallest-capacity PV among candidates (standard tightest-fit behavior).
  const chosen = accessMatches.reduce((best, p) => (p.capacityGb < best.capacityGb ? p : best), accessMatches[0]!);
  return { pvId: chosen.id, reason: `matched PV ${chosen.id} (tightest fit by capacity)` };
}

function makeInitialPvs(scenario: string): PvObject[] {
  const base: PvObject[] = [
    { id: 'pv-fast-20', capacityGb: 20, accessModes: ['ReadWriteOnce'], storageClassName: 'fast', status: 'Available', boundClaim: null },
    { id: 'pv-fast-50', capacityGb: 50, accessModes: ['ReadWriteOnce'], storageClassName: 'fast', status: 'Available', boundClaim: null },
    { id: 'pv-slow-100', capacityGb: 100, accessModes: ['ReadWriteOnce', 'ReadOnlyMany'], storageClassName: 'slow', status: 'Available', boundClaim: null },
    { id: 'pv-shared-50', capacityGb: 50, accessModes: ['ReadWriteMany'], storageClassName: 'shared', status: 'Available', boundClaim: null },
  ];
  if (scenario === 'all-bound') return base.map((p) => ({ ...p, status: 'Bound', boundClaim: 'some-other-claim' }));
  if (scenario === 'no-shared') return base.filter((p) => p.storageClassName !== 'shared');
  return base;
}

export const binderSimulation: SimulationDefinition<BindingState> = {
  id: 'pv-pvc-binder-simulator',
  title: 'PV / PVC Binding Simulator',
  description:
    'Walk through how the control plane matches a PVC against existing PVs — class, capacity, access modes, tightest-fit selection — and why a claim stays Pending when no match exists.',
  parameters: [
    { key: 'claimClass', label: 'PVC storageClassName', type: 'select', default: 'fast', options: [
      { label: 'fast', value: 'fast' }, { label: 'slow', value: 'slow' }, { label: 'shared', value: 'shared' }, { label: 'archive', value: 'archive' },
    ], description: 'Which StorageClass the PVC requests.' },
    { key: 'claimRequestGb', label: 'PVC requested capacity (GiB)', type: 'select', default: 10, options: [
      { label: '5', value: 5 }, { label: '10', value: 10 }, { label: '30', value: 30 }, { label: '80', value: 80 }, { label: '200', value: 200 },
    ], description: 'Requested size.' },
    { key: 'claimAccessMode', label: 'PVC access mode', type: 'select', default: 'ReadWriteOnce', options: [
      { label: 'ReadWriteOnce', value: 'ReadWriteOnce' }, { label: 'ReadOnlyMany', value: 'ReadOnlyMany' }, { label: 'ReadWriteMany', value: 'ReadWriteMany' },
    ], description: 'Requested access mode.' },
    { key: 'scenario', label: 'Cluster PV inventory', type: 'select', default: 'default', options: [
      { label: 'Default (4 unbound PVs)', value: 'default' },
      { label: 'All PVs already bound', value: 'all-bound' },
      { label: 'No RWX "shared" PV available', value: 'no-shared' },
    ], description: 'Starting cluster state.' },
  ],
  createInitialState: (params) => ({
    pvs: makeInitialPvs(String(params.scenario)),
    pvcs: [{
      id: 'claim-1',
      requestGb: Number(params.claimRequestGb),
      accessModes: [String(params.claimAccessMode) as AccessMode],
      storageClassName: String(params.claimClass),
      status: 'Pending',
      boundPv: null,
      reason: null,
    }],
    log: ['claim-1 submitted; API Server accepted the PVC in Pending state.'],
  }),
  steps: () => [
    {
      id: 'match',
      label: 'Match the claim against existing PVs',
      description: 'The control plane scans PVs for a matching class, sufficient capacity, and the required access modes.',
      apply: (s: BindingState): BindingState => {
        const pvc = s.pvcs[0]!;
        const { pvId, reason } = tryBind(pvc, s.pvs);
        if (pvId === null) {
          return {
            ...s,
            pvcs: [{ ...pvc, status: 'Pending', reason }],
            log: [...s.log, `No match: ${reason}. PVC stays Pending.`],
          };
        }
        return {
          ...s,
          pvs: s.pvs.map((p) => (p.id === pvId ? { ...p, status: 'Bound', boundClaim: pvc.id } : p)),
          pvcs: [{ ...pvc, status: 'Bound', boundPv: pvId, reason }],
          log: [...s.log, `Bound claim-1 ↔ ${pvId}. ${reason}`],
        };
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Lab 2: Dynamic Provisioning Simulator
// ---------------------------------------------------------------------------
// Models the dynamic-provisioning lifecycle with WaitForFirstConsumer and
// topology constraints: the provisioner only materialises the volume once
// the scheduler chooses a node.

export type ProvMode = 'Immediate' | 'WaitForFirstConsumer';
export type Zone = 'zone-a' | 'zone-b';

export interface ProvisionedPv {
  id: string;
  storageClassName: string;
  capacityGb: number;
  zone: Zone;
}

export type ProvPhase =
  | 'pvc-created'
  | 'waiting-for-consumer'
  | 'awaiting-scheduling'
  | 'provisioning'
  | 'pv-provisioned'
  | 'pod-scheduled'
  | 'pod-running'
  | 'failed';

export interface DynamicProvState {
  provisioner: ProvMode;
  zoneConstraint: Zone | 'any';
  podRequestsVolume: boolean;
  phase: ProvPhase;
  pvcZone: Zone | null;
  provisionedPv: ProvisionedPv | null;
  log: string[];
  reason: string | null;
}

export const dynamicProvisioningSimulation: SimulationDefinition<DynamicProvState> = {
  id: 'dynamic-provisioning-simulator',
  title: 'Dynamic Provisioning Simulator',
  description:
    'Submit a PVC against a dynamic provisioner, with Immediate or WaitForFirstConsumer binding and optional topology constraints. See how volumeBindingMode changes the order of provisioning and scheduling.',
  parameters: [
    { key: 'provisioner', label: 'StorageClass volumeBindingMode', type: 'select', default: 'WaitForFirstConsumer', options: [
      { label: 'Immediate', value: 'Immediate' },
      { label: 'WaitForFirstConsumer', value: 'WaitForFirstConsumer' },
    ], description: 'When to bind/provision the volume.' },
    { key: 'zoneConstraint', label: 'Topology constraint on PV', type: 'select', default: 'any', options: [
      { label: 'none (multi-zone)', value: 'any' },
      { label: 'zone-a only', value: 'zone-a' },
      { label: 'zone-b only', value: 'zone-b' },
    ], description: 'Where the backing storage system can create the volume.' },
    { key: 'podRequestsVolume', label: 'A Pod references this PVC', type: 'boolean', default: true, description: 'Simulates whether a Pod is created that uses this claim.' },
    { key: 'podZonePreference', label: 'Pod nodeSelector zone', type: 'select', default: 'zone-b', options: [
      { label: 'none', value: 'any' }, { label: 'zone-a', value: 'zone-a' }, { label: 'zone-b', value: 'zone-b' },
    ], description: 'Where the scheduler wants to place the Pod.' },
  ],
  createInitialState: (params) => ({
    provisioner: String(params.provisioner) as ProvMode,
    zoneConstraint: String(params.zoneConstraint) as Zone | 'any',
    podRequestsVolume: Boolean(params.podRequestsVolume),
    phase: 'pvc-created',
    pvcZone: null,
    provisionedPv: null,
    log: [`PVC created — storageClassName with volumeBindingMode=${params.provisioner}.`],
    reason: null,
  }),
  steps: (params) => {
    const podZone = String(params.podZonePreference);
    const immediate = String(params.provisioner) === 'Immediate';
    const zoneConstraint = String(params.zoneConstraint) as Zone | 'any';
    const podRefs = Boolean(params.podRequestsVolume);
    return [
      {
        id: 'binding-mode',
        label: immediate ? 'Immediate: provision now' : 'WaitForFirstConsumer: wait for a Pod',
        description: immediate
          ? 'The external provisioner is invoked immediately; a PV and backing volume are created in the storage system.'
          : 'No provisioning yet — the PVC is Pending until a Pod that references it is scheduled.',
        apply: (s: DynamicProvState): DynamicProvState => {
          if (immediate) {
            const zone: Zone = zoneConstraint === 'any' ? 'zone-a' : zoneConstraint;
            const pv: ProvisionedPv = { id: 'pvc-123', storageClassName: 'fast-ssd', capacityGb: 20, zone };
            return {
              ...s,
              phase: 'pv-provisioned',
              provisionedPv: pv,
              pvcZone: zone,
              log: [...s.log, `Provisioner created ${pv.id} in ${zone}. PVC transitions to Bound.`],
            };
          }
          return {
            ...s,
            phase: 'waiting-for-consumer',
            log: [...s.log, 'WaitForFirstConsumer: PVC is Pending; the external provisioner is NOT invoked yet.'],
          };
        },
      },
      {
        id: 'schedule',
        label: 'Scheduler decides where to run the Pod',
        description: 'The scheduler reads topology from the PVC\'s StorageClass. With WFC the scheduler picks a zone before provisioning; with Immediate the already-bound PV\'s zone constrains the Pod.',
        apply: (s): DynamicProvState => {
          if (!podRefs) {
            return { ...s, log: [...s.log, 'No Pod references the PVC; nothing to schedule.'] };
          }
          if (immediate) {
            if (s.provisionedPv && podZone !== 'any' && podZone !== s.provisionedPv.zone) {
              return {
                ...s,
                phase: 'failed',
                reason: `Pod requires nodeSelector ${podZone} but the already-provisioned PV is in ${s.provisionedPv.zone}`,
                log: [...s.log, `Scheduler conflict: ${podZone} Pod vs ${s.provisionedPv.zone} PV. Pod is Unschedulable; the PV cannot migrate.`],
              };
            }
            return { ...s, phase: 'pod-scheduled', log: [...s.log, `Pod scheduled onto the same zone as the PV (${s.provisionedPv?.zone}).`] };
          }
          // WFC: scheduler picks a zone, taking both the Pod nodeSelector AND the StorageClass topology constraint into account.
          const chosen: Zone | null = (() => {
            if (podZone !== 'any' && zoneConstraint !== 'any' && podZone !== zoneConstraint) return null;
            if (podZone !== 'any') return podZone as Zone;
            if (zoneConstraint !== 'any') return zoneConstraint;
            return 'zone-a';
          })();
          if (chosen === null) {
            return {
              ...s,
              phase: 'failed',
              reason: `No zone satisfies both Pod (${podZone}) and StorageClass topology (${zoneConstraint}).`,
              log: [...s.log, 'Scheduler finds no feasible zone; Pod stays Pending and PVC stays Pending.'],
            };
          }
          return {
            ...s,
            pvcZone: chosen,
            phase: 'awaiting-scheduling',
            log: [...s.log, `Scheduler picks zone ${chosen}; provisioner will create the PV there.`],
          };
        },
      },
      {
        id: 'provision',
        label: immediate ? 'Pod starts on the already-bound PV' : 'Provision now that the zone is known',
        description: immediate
          ? 'The kubelet attaches and mounts the PV on the Pod\'s node.'
          : 'Now that the scheduler has committed to a zone, the provisioner creates the PV in that zone. The PVC transitions to Bound and the Pod starts.',
        apply: (s): DynamicProvState => {
          if (s.phase === 'failed') return s;
          if (!podRefs) {
            return { ...s, log: [...s.log, 'No Pod — nothing to attach.'] };
          }
          if (immediate) {
            return { ...s, phase: 'pod-running', log: [...s.log, 'CSI attach + mount done; Pod is Running.'] };
          }
          const zone = s.pvcZone ?? 'zone-a';
          const pv: ProvisionedPv = { id: 'pvc-123', storageClassName: 'fast-ssd', capacityGb: 20, zone };
          return {
            ...s,
            phase: 'pod-running',
            provisionedPv: pv,
            log: [...s.log, `Provisioner created ${pv.id} in ${zone}; PVC Bound; Pod attached and Running.`],
          };
        },
      },
    ];
  },
};

// ---------------------------------------------------------------------------
// Lab 3: StatefulSet Storage Simulator
// ---------------------------------------------------------------------------
// Each replica has a stable ordinal identity (web-0, web-1, …) and its own
// PVC derived from volumeClaimTemplates. Scaling up appends; scaling down
// deletes Pods but KEEPS the PVCs by default.

export interface StsPod {
  ordinal: number;
  name: string;
  status: 'Pending' | 'Running' | 'Terminating' | 'Absent';
  pvcName: string;
  phase: 'starting' | 'ready' | 'stopped';
}

export interface StsPvc {
  name: string;
  ordinal: number;
  claimed: boolean;
}

export interface StsState {
  desiredReplicas: number;
  partition: number;
  pods: StsPod[];
  pvcs: StsPvc[];
  log: string[];
}

function ensurePvc(pvcs: StsPvc[], ordinal: number): StsPvc[] {
  if (pvcs.some((p) => p.ordinal === ordinal)) return pvcs;
  return [...pvcs, { name: `data-web-${ordinal}`, ordinal, claimed: true }];
}

export function applyStsEvent(state: StsState, event: { kind: 'scale'; to: number } | { kind: 'delete-pod'; ordinal: number }): StsState {
  if (event.kind === 'scale') {
    const to = event.to;
    if (to > state.desiredReplicas) {
      // Scale up: create new Pods and their PVCs one at a time by ordinal.
      let pvcs = state.pvcs;
      const newPods: StsPod[] = [];
      for (let i = state.desiredReplicas; i < to; i += 1) {
        pvcs = ensurePvc(pvcs, i);
        newPods.push({ ordinal: i, name: `web-${i}`, status: 'Running', pvcName: `data-web-${i}`, phase: 'ready' });
      }
      return {
        ...state,
        desiredReplicas: to,
        pods: [...state.pods, ...newPods],
        pvcs,
        log: [...state.log, `Scaled up to ${to}: created Pods web-${state.desiredReplicas}..web-${to - 1} with new PVCs.`],
      };
    }
    if (to < state.desiredReplicas) {
      // Scale down: remove Pods with highest ordinal first. KEEP the PVCs.
      const kept = state.pods.filter((p) => p.ordinal < to);
      return {
        ...state,
        desiredReplicas: to,
        pods: kept,
        log: [...state.log, `Scaled down to ${to}: deleted web-${state.desiredReplicas - 1}..web-${to}. PVCs retained (manual cleanup required).`],
      };
    }
    return { ...state, log: [...state.log, `Already at ${to} replicas.`] };
  }
  if (event.kind === 'delete-pod') {
    const ord = event.ordinal;
    if (!state.pods.some((p) => p.ordinal === ord)) return state;
    const nextPods = state.pods.map((p) => (p.ordinal === ord ? { ...p, status: 'Running' as const, phase: 'ready' as const, name: `web-${ord}`, pvcName: `data-web-${ord}` } : p));
    return {
      ...state,
      pods: nextPods,
      log: [...state.log, `web-${ord} deleted; the StatefulSet controller re-created it with the SAME name and reattached ${state.pvcs.find((pv) => pv.ordinal === ord)?.name ?? 'its PVC'}.`],
    };
  }
  return state;
}

export const statefulsetStorageSimulation: SimulationDefinition<StsState> = {
  id: 'statefulset-storage-simulator',
  title: 'StatefulSet Storage Simulator',
  description:
    'Deploy a StatefulSet with multiple replicas and watch volumeClaimTemplates create per-replica PVCs. Delete a Pod to see identity preserved. Scale down to see that PVCs are retained.',
  parameters: [
    { key: 'initialReplicas', label: 'Initial replicas', type: 'select', default: 3, options: [
      { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '5', value: 5 },
    ], description: 'Starting replica count.' },
    { key: 'scaleTo', label: 'Scale to', type: 'select', default: 5, options: [
      { label: '1', value: 1 }, { label: '3', value: 3 }, { label: '5', value: 5 }, { label: '7', value: 7 },
    ], description: 'Target replicas after the first scale event.' },
    { key: 'deletePod', label: 'Delete web-1 to show identity preservation', type: 'boolean', default: true, description: 'After scaling, delete one Pod and watch the controller re-create it with the same identity.' },
    { key: 'scaleDown', label: 'Then scale down to 2', type: 'boolean', default: true, description: 'Scale-down removes Pods but KEEPS their PVCs.' },
  ],
  createInitialState: (params) => {
    const n = Number(params.initialReplicas);
    const pvcs: StsPvc[] = Array.from({ length: n }, (_, i) => ({ name: `data-web-${i}`, ordinal: i, claimed: true }));
    const pods: StsPod[] = Array.from({ length: n }, (_, i) => ({ ordinal: i, name: `web-${i}`, status: 'Running', pvcName: `data-web-${i}`, phase: 'ready' }));
    return {
      desiredReplicas: n,
      partition: 0,
      pods,
      pvcs,
      log: [`StatefulSet web created with ${n} replicas; PVCs ${pvcs.map((pv) => pv.name).join(', ')} created from volumeClaimTemplates.`],
    };
  },
  steps: (params) => {
    const scaleTo = Number(params.scaleTo);
    const steps: { id: string; label: string; description: string; apply: (s: StsState) => StsState }[] = [
      {
        id: 'scale',
        label: `Scale to ${scaleTo}`,
        description: `Scale up appends Pods ordinal by ordinal; each new Pod gets its own PVC from the volumeClaimTemplates. Scale down removes Pods in reverse ordinal order and KEEPS the PVCs.`,
        apply: (s) => applyStsEvent(s, { kind: 'scale', to: scaleTo }),
      },
    ];
    if (params.deletePod) {
      steps.push({
        id: 'delete',
        label: 'Delete web-1',
        description: 'Watch the controller recreate web-1 with the SAME name and reattach the same PVC. Pod identity is persisted via the (name, ordinal) tuple.',
        apply: (s) => applyStsEvent(s, { kind: 'delete-pod', ordinal: 1 }),
      });
    }
    if (params.scaleDown) {
      steps.push({
        id: 'scale-down',
        label: 'Scale down to 2',
        description: 'Pods web-N..web-2 terminate in reverse ordinal order. Their PVCs are RETAINED — StatefulSet never deletes PVCs; manual cleanup required (or the policy must be configured).',
        apply: (s) => applyStsEvent(s, { kind: 'scale', to: 2 }),
      });
    }
    return steps;
  },
};

// ---------------------------------------------------------------------------
// Lab 4: Backup & Recovery Simulator
// ---------------------------------------------------------------------------

export interface BackupPoint {
  tick: number;
  dataVersion: number;
  consistent: boolean;
}

export type RecoveryScenarioKind = 'accidental-delete' | 'logical-corruption' | 'none';

export interface BackupState {
  tick: number;
  currentDataVersion: number;
  backups: BackupPoint[];
  retention: number;
  frequencyTicks: number;
  consistency: 'crash' | 'application';
  scenario: RecoveryScenarioKind;
  dataLost: boolean;
  restored: boolean;
  chosenBackup: BackupPoint | null;
  rpoTicks: number | null;
  rtoTicks: number | null;
  log: string[];
}

export function computeRpoRto(opts: {
  failureTick: number;
  backups: BackupPoint[];
  restoreDurationTicks: number;
}): { chosen: BackupPoint | null; rpoTicks: number | null; rtoTicks: number | null } {
  const beforeFailure = opts.backups.filter((b) => b.tick <= opts.failureTick);
  if (beforeFailure.length === 0) return { chosen: null, rpoTicks: null, rtoTicks: null };
  const latest = beforeFailure.reduce((best, b) => (b.tick > best.tick ? b : best), beforeFailure[0]!);
  return {
    chosen: latest,
    rpoTicks: opts.failureTick - latest.tick,
    rtoTicks: opts.restoreDurationTicks,
  };
}

export const backupRecoverySimulation: SimulationDefinition<BackupState> = {
  id: 'backup-recovery-simulator',
  title: 'Backup & Recovery Simulator',
  description:
    'Configure backup frequency and consistency, write data, trigger a failure, then restore. See how backup gap drives RPO and how restore time drives RTO — and why crash-consistent backups of running databases can be unusable.',
  parameters: [
    { key: 'frequency', label: 'Backup frequency (ticks)', type: 'select', default: 3, options: [
      { label: 'every 1 tick', value: 1 }, { label: 'every 3 ticks', value: 3 }, { label: 'every 6 ticks', value: 6 },
    ], description: 'How often a backup runs. Longer gaps = worse RPO.' },
    { key: 'retention', label: 'Retention (backups kept)', type: 'select', default: 5, options: [
      { label: '3', value: 3 }, { label: '5', value: 5 }, { label: '10', value: 10 },
    ], description: 'How many backups are kept.' },
    { key: 'consistency', label: 'Backup consistency', type: 'select', default: 'application', options: [
      { label: 'crash-consistent (snapshot a live volume)', value: 'crash' },
      { label: 'application-consistent (fsfreeze or pre-backup hook)', value: 'application' },
    ], description: 'Crash-consistent = you can restore but your DB may need recovery. Application-consistent = clean, coordinated point-in-time.' },
    { key: 'restoreDuration', label: 'Restore duration (ticks)', type: 'select', default: 2, options: [
      { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '5', value: 5 },
    ], description: 'Time to restore a backup once chosen (drives RTO).' },
    { key: 'scenario', label: 'Failure scenario', type: 'select', default: 'accidental-delete', options: [
      { label: 'Accidental DROP TABLE at tick 10', value: 'accidental-delete' },
      { label: 'Silent data corruption discovered at tick 10', value: 'logical-corruption' },
      { label: 'No failure', value: 'none' },
    ], description: 'What happens during the simulation.' },
  ],
  createInitialState: (params) => ({
    tick: 0,
    currentDataVersion: 0,
    backups: [],
    retention: Number(params.retention),
    frequencyTicks: Number(params.frequency),
    consistency: String(params.consistency) as 'crash' | 'application',
    scenario: String(params.scenario) as RecoveryScenarioKind,
    dataLost: false,
    restored: false,
    chosenBackup: null,
    rpoTicks: null,
    rtoTicks: null,
    log: ['DB starts at data version 0.'],
  }),
  steps: (params) => {
    const ticks = 14;
    const failureTick = 10;
    const restoreDuration = Number(params.restoreDuration);
    const steps: { id: string; label: string; description: string; apply: (s: BackupState) => BackupState }[] = [];
    for (let t = 1; t <= ticks; t += 1) {
      steps.push({
        id: `tick-${t}`,
        label: `t=${t}`,
        description: 'One simulation tick: data may grow, a backup may fire, and at the failure tick the scenario triggers.',
        apply: (s: BackupState): BackupState => {
          let backups = s.backups;
          let log = s.log;
          let currentDataVersion = s.currentDataVersion + 1;
          // Backup fires every frequency ticks.
          if (t % s.frequencyTicks === 0) {
            const bp: BackupPoint = { tick: t, dataVersion: currentDataVersion, consistent: s.consistency === 'application' };
            backups = [...backups, bp].slice(-s.retention);
            log = [...log, `t=${t}: backup captured (data v${currentDataVersion}, ${bp.consistent ? 'application' : 'crash'}-consistent).`];
          }
          let dataLost = s.dataLost;
          let restored = s.restored;
          let chosenBackup = s.chosenBackup;
          let rpoTicks = s.rpoTicks;
          let rtoTicks = s.rtoTicks;
          if (t === failureTick && s.scenario !== 'none') {
            dataLost = true;
            log = [...log, `t=${t}: ${s.scenario === 'accidental-delete' ? 'accidental delete — all data wiped.' : 'silent corruption discovered — recent data suspect.'}`];
          }
          if (t === failureTick + 1 && dataLost && !restored) {
            const r = computeRpoRto({ failureTick: t - 1, backups, restoreDurationTicks: restoreDuration });
            if (!r.chosen) {
              log = [...log, `t=${t}: no usable backup — data permanently lost.`];
            } else {
              chosenBackup = r.chosen;
              rpoTicks = r.rpoTicks;
              rtoTicks = r.rtoTicks;
              restored = true;
              currentDataVersion = r.chosen.dataVersion;
              log = [...log, `t=${t}: restored from t=${r.chosen.tick} (data v${r.chosen.dataVersion}). RPO = ${r.rpoTicks} ticks lost; RTO = ${r.rtoTicks} ticks of downtime.`];
              if (!r.chosen.consistent && s.scenario === 'accidental-delete') {
                log = [...log, `  Note: crash-consistent snapshot — DB recovery may be required before the service is usable.`];
              }
              if (s.scenario === 'logical-corruption' && r.chosen.tick > failureTick - 5) {
                log = [...log, `  Warning: the chosen backup is within the corruption window — restore may contain corrupted rows. Pick an older backup.`];
              }
            }
          }
          return { ...s, tick: t, currentDataVersion, backups, log, dataLost, restored, chosenBackup, rpoTicks, rtoTicks };
        },
      });
    }
    return steps;
  },
};

// ---------------------------------------------------------------------------
// Lab 5: Storage Troubleshooting Lab
// ---------------------------------------------------------------------------

export type SymptomKind =
  | 'pvc-pending-no-sc'
  | 'pvc-pending-no-match'
  | 'pvc-pending-topology'
  | 'failed-attach'
  | 'failed-mount'
  | 'disk-pressure'
  | 'slow-io';

export interface DiagnosticEvent {
  object: string;
  type: 'Normal' | 'Warning';
  reason: string;
  message: string;
}

export interface DiagnosticStep {
  id: string;
  label: string;
  description: string;
  verdict: 'useful' | 'useless' | 'misleading';
  reveals: string;
}

export interface TroubleshootingState {
  symptom: SymptomKind;
  events: DiagnosticEvent[];
  stepsTaken: string[];
  rootCause: string | null;
  resolved: boolean;
  log: string[];
}

function makeEvents(symptom: SymptomKind): DiagnosticEvent[] {
  switch (symptom) {
    case 'pvc-pending-no-sc':
      return [
        { object: 'PVC/data', type: 'Warning', reason: 'ProvisioningFailed', message: 'storageclass "fast-ssd" not found' },
      ];
    case 'pvc-pending-no-match':
      return [
        { object: 'PVC/data', type: 'Warning', reason: 'FailedBinding', message: 'no persistent volumes available for this claim and no storage class is set' },
      ];
    case 'pvc-pending-topology':
      return [
        { object: 'Pod/web-0', type: 'Warning', reason: 'FailedScheduling', message: '0/3 nodes are available: 3 node(s) had volume node affinity conflict.' },
      ];
    case 'failed-attach':
      return [
        { object: 'Pod/web-0', type: 'Warning', reason: 'FailedAttachVolume', message: 'Multi-Attach error for volume "pvc-abc" — Volume is already exclusively attached to one node and cannot be attached to another' },
      ];
    case 'failed-mount':
      return [
        { object: 'Pod/web-0', type: 'Warning', reason: 'FailedMount', message: 'MountVolume.SetUp failed for volume "data": mount failed: exit status 32' },
      ];
    case 'disk-pressure':
      return [
        { object: 'Node/node-1', type: 'Warning', reason: 'NodeHasDiskPressure', message: 'Node condition DiskPressure=True; starting Pod eviction' },
        { object: 'Pod/cache-7', type: 'Warning', reason: 'Evicted', message: 'The node was low on resource: ephemeral-storage' },
      ];
    case 'slow-io':
      return [
        { object: 'Pod/db-0', type: 'Normal', reason: 'Healthy', message: 'liveness passed' },
      ];
  }
}

function makeDiagnostics(symptom: SymptomKind): DiagnosticStep[] {
  const common: DiagnosticStep[] = [
    { id: 'describe-pvc', label: 'kubectl describe pvc', description: 'Read PVC Events for the exact Pending reason.', verdict: 'useful', reveals: 'Events say ProvisioningFailed, FailedBinding, or similar.' },
    { id: 'describe-pod', label: 'kubectl describe pod', description: 'Read Pod Events for scheduling, attach, mount problems.', verdict: 'useful', reveals: 'FailedScheduling / FailedAttachVolume / FailedMount appear here.' },
    { id: 'describe-node', label: 'kubectl describe node', description: 'Node Conditions include DiskPressure, MemoryPressure, PIDPressure.', verdict: 'useful', reveals: 'DiskPressure=True reveals eviction cause.' },
    { id: 'logs-csi', label: 'Logs of CSI controller and node pods', description: 'Backend-level attach/provision errors land here.', verdict: 'useful', reveals: 'Cloud API errors, credential problems, rate limits.' },
    { id: 'restart-pod', label: 'Delete the Pod to "fix" it', description: 'Hoping deletion resolves the issue.', verdict: 'useless', reveals: 'Does not change the PVC or PV state; same failure recurs.' },
    { id: 'reinstall-cni', label: 'Reinstall the CNI', description: 'Assumes a network issue.', verdict: 'misleading', reveals: 'Storage problems are not CNI problems; this is a distraction.' },
  ];
  if (symptom === 'slow-io') {
    return [
      { id: 'iostat', label: 'Run iostat/kubectl exec pod -- dd test', description: 'Measure IOPS and throughput directly against the volume.', verdict: 'useful', reveals: 'High %util with low MB/s indicates volume bandwidth or IOPS cap.' },
      { id: 'check-sc', label: 'Inspect StorageClass parameters', description: 'Many cloud SCs cap IOPS/throughput by capacity.', verdict: 'useful', reveals: 'Small PVCs often hit cloud-provider IOPS floor.' },
      ...common,
    ];
  }
  return common;
}

function makeRootCause(symptom: SymptomKind): string {
  switch (symptom) {
    case 'pvc-pending-no-sc': return 'The referenced StorageClass does not exist in the cluster.';
    case 'pvc-pending-no-match': return 'No StorageClass is set on the PVC and no matching pre-provisioned PV exists.';
    case 'pvc-pending-topology': return 'The PV is in a zone no node can satisfy; usually a stale Immediate-bound PV after cluster resize.';
    case 'failed-attach': return 'The volume is still attached to a previous node (RWO semantics). A prior Pod on another node did not fully terminate.';
    case 'failed-mount': return 'Backing filesystem corrupt, missing, or using wrong mount options for the Pod. Common with nfs/share servers down or wrong fsType.';
    case 'disk-pressure': return 'Node ephemeral-storage threshold exceeded; kubelet is evicting BestEffort and over-request Burstable Pods.';
    case 'slow-io': return 'Cloud-provider IOPS or throughput cap on the volume type/size. Not a Kubernetes problem per se.';
  }
}

function revealingStepIdForSymptom(symptom: SymptomKind): string {
  switch (symptom) {
    case 'pvc-pending-no-sc':
    case 'pvc-pending-no-match':
      return 'describe-pvc';
    case 'pvc-pending-topology':
    case 'failed-attach':
    case 'failed-mount':
      return 'describe-pod';
    case 'disk-pressure':
      return 'describe-node';
    case 'slow-io':
      return 'iostat';
  }
}

export const storageTroubleshootingSimulation: SimulationDefinition<TroubleshootingState> = {
  id: 'storage-troubleshooting-lab',
  title: 'Storage Troubleshooting Lab',
  description:
    'Pick a symptom, review events, and apply diagnostic steps one at a time. Each step gives context about whether it was useful, useless, or a misleading distraction.',
  parameters: [
    { key: 'symptom', label: 'Reported symptom', type: 'select', default: 'pvc-pending-topology', options: [
      { label: 'PVC Pending — no StorageClass', value: 'pvc-pending-no-sc' },
      { label: 'PVC Pending — no matching PV', value: 'pvc-pending-no-match' },
      { label: 'PVC Pending — topology conflict', value: 'pvc-pending-topology' },
      { label: 'FailedAttachVolume on Pod', value: 'failed-attach' },
      { label: 'FailedMount on Pod', value: 'failed-mount' },
      { label: 'Node DiskPressure, Pods evicted', value: 'disk-pressure' },
      { label: 'Slow I/O on an attached volume', value: 'slow-io' },
    ], description: 'The scenario the operator is handed.' },
  ],
  createInitialState: (params) => {
    const sy = String(params.symptom) as SymptomKind;
    return {
      symptom: sy,
      events: makeEvents(sy),
      stepsTaken: [],
      rootCause: null,
      resolved: false,
      log: [`Scenario: ${sy}. Begin by reading events and apply diagnostic steps one at a time.`],
    };
  },
  steps: (params) => {
    const sy = String(params.symptom) as SymptomKind;
    const diagnostics = makeDiagnostics(sy);
    const targetStepId = revealingStepIdForSymptom(sy);
    return diagnostics.map((d) => ({
      id: d.id,
      label: d.label,
      description: d.description,
      apply: (s: TroubleshootingState): TroubleshootingState => {
        const alreadyTaken = s.stepsTaken.includes(d.id);
        const log = [
          ...s.log,
          `${alreadyTaken ? '[repeat] ' : ''}${d.label} → ${d.verdict}. ${d.reveals}`,
        ];
        const revealedRoot = d.id === targetStepId || s.rootCause !== null;
        return {
          ...s,
          stepsTaken: alreadyTaken ? s.stepsTaken : [...s.stepsTaken, d.id],
          rootCause: revealedRoot ? makeRootCause(sy) : s.rootCause,
          resolved: revealedRoot,
          log,
        };
      },
    }));
  },
};
