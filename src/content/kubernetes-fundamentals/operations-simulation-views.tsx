import type {
  PodHealthState,
  SchedulingState,
  ResourceState,
  HpaState,
  RolloutState,
} from './operations-simulations';

// --- Pod health view ------------------------------------------------------

export function renderPodHealthState(state: PodHealthState) {
  const probeBadge = (label: string, enabled: boolean, outcome: PodHealthState['startup']) => {
    if (!enabled) return <span className="rounded bg-bg-subtle px-1.5 py-0.5 text-[11px] text-text-muted">{label}: off</span>;
    const color =
      outcome.lastOutcome === 'success' ? 'bg-success/10 text-success'
      : outcome.lastOutcome === 'failure' ? 'bg-error/10 text-error'
      : 'bg-bg-subtle text-text-muted';
    return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${color}`}>{label}: {outcome.lastOutcome}</span>;
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-[13px]">
        <span className="text-text-secondary">
          <span className="font-medium text-text">Phase:</span> {state.phase}
        </span>
        <span className="text-text-secondary">
          <span className="font-medium text-text">Ready:</span> {state.ready ? 'yes' : 'no'}
        </span>
        <span className="text-text-secondary">
          <span className="font-medium text-text">Service endpoints:</span> {state.endpointsIncluded ? 'included' : 'removed'}
        </span>
        <span className="text-text-secondary">
          <span className="font-medium text-text">Restarts:</span> {state.restartCount}
        </span>
        <span className="text-text-muted">tick {state.tick}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {probeBadge('startup', state.startup.lastOutcome !== 'disabled', state.startup)}
        {probeBadge('liveness', state.liveness.lastOutcome !== 'disabled', state.liveness)}
        {probeBadge('readiness', state.readiness.lastOutcome !== 'disabled', state.readiness)}
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">kubelet log</h4>
        <ul className="space-y-0.5 text-[12px] font-mono text-text-secondary">
          {state.log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// --- Scheduling view ------------------------------------------------------

export function renderSchedulingState(state: SchedulingState) {
  return (
    <div className="space-y-3">
      <div className="text-[13px] text-text-secondary">
        <span className="font-medium text-text">Pod:</span> {state.pod.cpu} CPU · {state.pod.memoryGb} GiB
        {state.pod.requireGpu && <> · <code>nodeSelector: gpu=true</code></>}
        {state.pod.tolerateDedicatedTaint && <> · tolerates <code>dedicated=gpu:NoSchedule</code></>}
        {state.pod.preferZone !== 'any' && <> · prefers {state.pod.preferZone}</>}
        {state.pod.spreadConstraint && <> · topology spread across zones</>}
      </div>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">Node</th>
            <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">Capacity</th>
            <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">Zone</th>
            <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">Decision</th>
          </tr>
        </thead>
        <tbody>
          {state.nodes.map((n) => {
            const ev = state.evaluations.find((e) => e.nodeId === n.id);
            const isChosen = state.chosenNodeId === n.id;
            return (
              <tr key={n.id} className="border-b border-border-subtle">
                <td className="px-2 py-1.5 text-text">
                  {n.id}
                  {n.taint && <span className="ml-2 text-[11px] text-text-muted">taint: {n.taint.key}:{n.taint.effect}</span>}
                  {n.gpu && <span className="ml-2 text-[11px] text-text-muted">gpu</span>}
                  {isChosen && <span className="ml-2 rounded bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">bound</span>}
                </td>
                <td className="px-2 py-1.5 text-text-secondary">
                  {(n.cpu - n.cpuAllocated).toFixed(1)}/{n.cpu} CPU · {(n.memoryGb - n.memoryAllocated).toFixed(1)}/{n.memoryGb} GiB free
                </td>
                <td className="px-2 py-1.5 text-text-secondary">{n.zone}</td>
                <td className="px-2 py-1.5">
                  {!ev ? (
                    <span className="text-text-muted">— not evaluated yet</span>
                  ) : ev.filteredOut ? (
                    <span className="text-error">filtered out — {ev.reasons.join('; ')}</span>
                  ) : (
                    <span className={isChosen ? 'font-medium text-success' : 'text-text-secondary'}>feasible · score {ev.score}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {state.unschedulable && (
        <p className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-[13px] text-error">
          Pod is Unschedulable — every node was filtered out. Relax a constraint (toleration, nodeSelector, or request a smaller Pod).
        </p>
      )}
    </div>
  );
}

// --- Resource management view --------------------------------------------

export function renderResourceState(state: ResourceState) {
  const c = state.container;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-[13px] text-text-secondary">
        <span><span className="font-medium text-text">QoS:</span> {state.qos}</span>
        <span><span className="font-medium text-text">CPU:</span> req {c.cpuRequest || '—'} / lim {c.cpuLimit || '—'}</span>
        <span><span className="font-medium text-text">Memory:</span> req {c.memoryRequestMi || '—'} / lim {c.memoryLimitMi || '—'} MiB</span>
        <span><span className="font-medium text-text">Restarts:</span> {state.restartCount}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-md border border-border-subtle bg-bg-subtle p-3 text-[12px]">
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">CPU</h4>
          <div className="text-text-secondary">demand {state.cpuDemand} · assigned {state.cpuAssigned.toFixed(2)}</div>
          {state.throttlingPct > 0 && <div className="text-error">throttled {state.throttlingPct}%</div>}
        </div>
        <div className="rounded-md border border-border-subtle bg-bg-subtle p-3 text-[12px]">
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Memory</h4>
          <div className="text-text-secondary">demand {state.memoryDemandMi} MiB · used {state.memoryUsedMi} MiB</div>
          {state.oomKilled && <div className="text-error">OOMKilled</div>}
        </div>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Timeline</h4>
        <ul className="space-y-0.5 text-[12px] font-mono text-text-secondary">
          {state.events.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// --- HPA scaling view ----------------------------------------------------

export function renderHpaState(state: HpaState) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-[13px] text-text-secondary">
        <span><span className="font-medium text-text">Replicas:</span> {state.currentReplicas}</span>
        <span><span className="font-medium text-text">Desired:</span> {state.desiredReplicas}</span>
        <span><span className="font-medium text-text">Current CPU util:</span> {state.currentUtilization}%</span>
        <span><span className="font-medium text-text">Target:</span> {state.targetUtilization}%</span>
        <span className="text-text-muted">tick {state.tick}</span>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: state.currentReplicas }).map((_, i) => (
          <div key={i} className="h-6 w-6 rounded-sm bg-accent/60" />
        ))}
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">HPA controller log</h4>
        <ul className="space-y-0.5 text-[12px] font-mono text-text-secondary">
          {state.log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// --- Rollout view --------------------------------------------------------

export function renderRolloutState(state: RolloutState) {
  const totalReady = state.oldRs.ready + state.newRs.ready;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-[13px] text-text-secondary">
        <span><span className="font-medium text-text">Strategy:</span> {state.strategy}</span>
        <span><span className="font-medium text-text">Phase:</span> {state.phase}</span>
        <span><span className="font-medium text-text">Total ready:</span> {totalReady}/{state.totalReplicas}</span>
        {state.strategy === 'rolling' && (
          <span className="text-text-muted">maxSurge {state.maxSurge} · maxUnavailable {state.maxUnavailable}</span>
        )}
        <span className="text-text-muted">tick {state.tick}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-md border border-border-subtle bg-bg-subtle p-3 text-[12px]">
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Old ReplicaSet (v1)</h4>
          <div className="text-text-secondary">desired {state.oldRs.desired} · ready {state.oldRs.ready}</div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: state.oldRs.desired }).map((_, i) => (
              <div key={i} className="h-5 w-5 rounded-sm bg-text-muted/40" />
            ))}
          </div>
        </div>
        <div className="rounded-md border border-border-subtle bg-bg-subtle p-3 text-[12px]">
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">New ReplicaSet (v2)</h4>
          <div className="text-text-secondary">desired {state.newRs.desired} · ready {state.newRs.ready}</div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: state.newRs.desired }).map((_, i) => (
              <div
                key={i}
                className={i < state.newRs.ready ? 'h-5 w-5 rounded-sm bg-accent/70' : 'h-5 w-5 rounded-sm border border-dashed border-accent/60'}
              />
            ))}
          </div>
        </div>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Deployment controller log</h4>
        <ul className="space-y-0.5 text-[12px] font-mono text-text-secondary">
          {state.log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
