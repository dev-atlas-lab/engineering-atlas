import type {
  BindingState,
  DynamicProvState,
  StsState,
  BackupState,
  TroubleshootingState,
} from './storage-simulations';

// --- Binding view --------------------------------------------------------

export function renderBindingState(state: BindingState) {
  const pvc = state.pvcs[0]!;
  return (
    <div className="space-y-3">
      <div className="text-[13px] text-text-secondary">
        <span className="font-medium text-text">PVC:</span>{' '}
        <code className="font-mono text-[12px]">
          {pvc.id} · class={pvc.storageClassName} · request={pvc.requestGb} GiB · access=[{pvc.accessModes.join(', ')}]
        </code>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">PV inventory</h4>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="border-b border-border px-2 py-1 text-left">PV</th>
              <th className="border-b border-border px-2 py-1 text-left">Class</th>
              <th className="border-b border-border px-2 py-1 text-left">Capacity</th>
              <th className="border-b border-border px-2 py-1 text-left">Access</th>
              <th className="border-b border-border px-2 py-1 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.pvs.map((p) => (
              <tr key={p.id} className={p.boundClaim === pvc.id ? 'bg-success/5' : ''}>
                <td className="px-2 py-1 font-mono">{p.id}</td>
                <td className="px-2 py-1">{p.storageClassName}</td>
                <td className="px-2 py-1">{p.capacityGb} GiB</td>
                <td className="px-2 py-1">{p.accessModes.join(', ')}</td>
                <td className={`px-2 py-1 ${p.status === 'Bound' ? 'text-success' : 'text-text-muted'}`}>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={pvc.status === 'Bound' ? 'rounded-md border border-success/40 bg-success/5 px-3 py-2 text-[13px]' : 'rounded-md border border-error/40 bg-error/5 px-3 py-2 text-[13px]'}>
        <div className={pvc.status === 'Bound' ? 'font-medium text-success' : 'font-medium text-error'}>
          PVC {pvc.id}: {pvc.status}{pvc.boundPv ? ` → ${pvc.boundPv}` : ''}
        </div>
        {pvc.reason && <div className="text-text-secondary">{pvc.reason}</div>}
      </div>
      {state.log.length > 0 && (
        <div>
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Log</h4>
          <ul className="space-y-0.5 text-[12px] font-mono text-text-secondary">
            {state.log.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- Dynamic provisioning view ------------------------------------------

export function renderDynamicProvState(state: DynamicProvState) {
  const good = state.phase === 'pod-running' || state.phase === 'pv-provisioned';
  const bad = state.phase === 'failed';
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-[13px] text-text-secondary">
        <span><span className="font-medium text-text">volumeBindingMode:</span> {state.provisioner}</span>
        <span><span className="font-medium text-text">Topology:</span> {state.zoneConstraint}</span>
        <span><span className="font-medium text-text">Phase:</span> {state.phase}</span>
        {state.provisionedPv && <span><span className="font-medium text-text">PV:</span> {state.provisionedPv.id} in {state.provisionedPv.zone}</span>}
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Provisioning log</h4>
        <ul className="space-y-0.5 text-[12px] font-mono text-text-secondary">
          {state.log.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>
      {state.reason && (
        <p className={`rounded-md px-3 py-2 text-[13px] ${bad ? 'border border-error/40 bg-error/10 text-error' : 'border border-text-muted/40 bg-bg-subtle text-text-muted'}`}>
          {state.reason}
        </p>
      )}
      {good && !state.reason && (
        <p className="rounded-md border border-success/40 bg-success/5 px-3 py-2 text-[13px] text-success">
          The PV was provisioned and the Pod can run. In WFC mode, the scheduler drove the zone choice.
        </p>
      )}
    </div>
  );
}

// --- StatefulSet view ---------------------------------------------------

export function renderStsState(state: StsState) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-[13px] text-text-secondary">
        <span><span className="font-medium text-text">Desired replicas:</span> {state.desiredReplicas}</span>
        <span className="text-text-muted">Pods: {state.pods.length} · PVCs: {state.pvcs.length}</span>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Pods (by ordinal)</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {state.pods.map((p) => (
            <div key={p.ordinal} className="rounded-md border border-border-subtle bg-bg-subtle px-2 py-1.5 text-[12px]">
              <div className="font-mono font-medium text-text">{p.name}</div>
              <div className="text-text-muted">status: {p.status}</div>
              <div className="text-text-muted">pvc: <span className="font-mono">{p.pvcName}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">PVCs (persist across scale-down)</h4>
        <div className="flex flex-wrap gap-2">
          {state.pvcs.map((pv) => {
            const stillHasPod = state.pods.some((p) => p.ordinal === pv.ordinal);
            return (
              <div key={pv.name} className={`rounded-md px-2 py-1 text-[12px] font-mono ${stillHasPod ? 'border border-border-subtle bg-bg-subtle text-text' : 'border border-warn/40 bg-warn/5 text-warn'}`}>
                {pv.name}{!stillHasPod && ' (orphaned)'}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Controller log</h4>
        <ul className="space-y-0.5 text-[12px] font-mono text-text-secondary">
          {state.log.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>
    </div>
  );
}

// --- Backup/Recovery view -----------------------------------------------

export function renderBackupState(state: BackupState) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-[13px] text-text-secondary">
        <span><span className="font-medium text-text">Tick:</span> {state.tick}</span>
        <span><span className="font-medium text-text">Data version:</span> v{state.currentDataVersion}</span>
        <span><span className="font-medium text-text">Backup frequency:</span> every {state.frequencyTicks} ticks</span>
        <span><span className="font-medium text-text">Consistency:</span> {state.consistency}</span>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Backups retained</h4>
        <div className="flex flex-wrap gap-2">
          {state.backups.length === 0 && <span className="text-[12px] text-text-muted">— none yet</span>}
          {state.backups.map((b) => {
            const chosen = state.chosenBackup?.tick === b.tick;
            return (
              <div key={b.tick} className={`rounded px-2 py-1 text-[11px] font-mono ${chosen ? 'border border-success bg-success/10 text-success' : b.consistent ? 'border border-border-subtle bg-bg-subtle text-text' : 'border border-warn/40 bg-warn/5 text-warn'}`}>
                t={b.tick} · v{b.dataVersion}{b.consistent ? ' · app' : ' · crash'}
              </div>
            );
          })}
        </div>
      </div>
      {state.restored && (
        <div className="rounded-md border border-success/40 bg-success/5 px-3 py-2 text-[13px]">
          <div className="font-medium text-success">Restored from t={state.chosenBackup?.tick}</div>
          <div className="text-text-secondary">RPO = {state.rpoTicks} ticks of data lost · RTO = {state.rtoTicks} ticks of downtime</div>
        </div>
      )}
      {state.dataLost && !state.restored && (
        <div className="rounded-md border border-error/40 bg-error/5 px-3 py-2 text-[13px] text-error">
          Data loss event, no restore performed yet.
        </div>
      )}
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Log</h4>
        <ul className="space-y-0.5 text-[12px] font-mono text-text-secondary">
          {state.log.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>
    </div>
  );
}

// --- Storage troubleshooting view ---------------------------------------

export function renderTroubleshootingState(state: TroubleshootingState) {
  return (
    <div className="space-y-3">
      <div className="text-[13px] text-text-secondary">
        <span className="font-medium text-text">Symptom:</span> <code className="font-mono text-[12px]">{state.symptom}</code>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Events</h4>
        <ul className="space-y-1 text-[12px]">
          {state.events.map((e, i) => (
            <li key={i} className={e.type === 'Warning' ? 'rounded border border-warn/40 bg-warn/5 px-2 py-1 text-warn' : 'rounded border border-border-subtle bg-bg-subtle px-2 py-1 text-text-secondary'}>
              <span className="font-mono text-[11px] text-text-muted">{e.object}</span>{' · '}
              <span className="font-mono">{e.type}/{e.reason}</span>{' · '}
              {e.message}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Diagnostic log</h4>
        <ul className="space-y-0.5 text-[12px] font-mono text-text-secondary">
          {state.log.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>
      {state.rootCause && (
        <div className={state.resolved ? 'rounded-md border border-success/40 bg-success/5 px-3 py-2 text-[13px]' : 'rounded-md border border-text-muted/40 bg-bg-subtle px-3 py-2 text-[13px] text-text-muted'}>
          <div className="font-medium text-text">Root cause</div>
          <div className="text-text-secondary">{state.rootCause}</div>
        </div>
      )}
    </div>
  );
}
