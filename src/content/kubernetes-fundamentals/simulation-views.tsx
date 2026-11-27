import type {
  SchedulerState,
  DeploymentState,
  ReconciliationState,
  ArchitectureExplorerState,
  ArchitectureComponent,
} from './simulations';
import { ARCHITECTURE_COMPONENTS } from './simulations';

// --- Scheduler view -------------------------------------------------------

export function renderSchedulerState(state: SchedulerState) {
  return (
    <div className="space-y-3">
      <div className="text-[13px] text-text-secondary">
        <span className="font-medium text-text">Pod requests:</span> {state.pod.cpu} CPU / {state.pod.memoryGb} GiB memory
      </div>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">Node</th>
            <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">Capacity</th>
            <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">Currently allocated</th>
            <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">Decision</th>
          </tr>
        </thead>
        <tbody>
          {state.nodes.map((node) => {
            const isChosen = state.chosenNodeId === node.id;
            const ev = node.evaluation;
            return (
              <tr key={node.id} className="border-b border-border-subtle">
                <td className="px-2 py-1.5 text-text">
                  {node.id}
                  {isChosen && <span className="ml-2 rounded bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">bound</span>}
                </td>
                <td className="px-2 py-1.5 text-text-secondary">{node.cpu} CPU / {node.memoryGb} GiB</td>
                <td className="px-2 py-1.5 text-text-secondary">
                  {node.cpuAllocated} CPU / {node.memoryAllocated} GiB
                </td>
                <td className="px-2 py-1.5">
                  {!ev ? (
                    <span className="text-text-muted">— not evaluated yet</span>
                  ) : ev.filteredOut ? (
                    <span className="text-error">filtered out — {ev.reason}</span>
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
          Pod is Unschedulable — every node was filtered out. In a real cluster the Pod would stay Pending until a node has enough free capacity (or the autoscaler adds one).
        </p>
      )}
    </div>
  );
}

// --- Deployment scaling view ---------------------------------------------

export function renderDeploymentState(state: DeploymentState) {
  const running = state.pods.filter((p) => p.health === 'running');
  const failed = state.pods.filter((p) => p.health === 'failed');
  return (
    <div className="space-y-3">
      <div className="flex gap-6 text-[13px] text-text-secondary">
        <span>
          <span className="font-medium text-text">Desired replicas:</span> {state.desiredReplicas}
        </span>
        <span>
          <span className="font-medium text-text">Running:</span> {running.length}
        </span>
        <span>
          <span className="font-medium text-text">Image version:</span> {state.rolloutVersion}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {state.pods.map((pod) => (
          <div
            key={pod.id}
            className={
              pod.health === 'failed'
                ? 'rounded-md border border-error/40 bg-error/5 px-2 py-1.5 text-[12px] text-error'
                : 'rounded-md border border-border-subtle bg-bg-subtle px-2 py-1.5 text-[12px] text-text'
            }
          >
            <div className="font-medium">{pod.id}</div>
            <div className="text-text-muted">{pod.version} · {pod.health}</div>
          </div>
        ))}
      </div>

      {failed.length > 0 && (
        <p className="text-[12px] text-text-muted">
          Failed Pods remain in the list to show what the ReplicaSet reacted to; in a real cluster they are garbage-collected shortly after their replacement starts.
        </p>
      )}

      {state.events.length > 0 && (
        <div>
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Events</h4>
          <ul className="space-y-1 text-[12px] text-text-secondary">
            {state.events.map((e, i) => (
              <li key={i} className="font-mono">{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- Reconciliation view --------------------------------------------------

export function renderReconciliationState(state: ReconciliationState) {
  const gap = state.desired - state.actual;
  return (
    <div className="space-y-3">
      <div className="flex gap-6 text-[13px]">
        <span className="text-text-secondary">
          <span className="font-medium text-text">Desired:</span> {state.desired}
        </span>
        <span className="text-text-secondary">
          <span className="font-medium text-text">Actual:</span> {state.actual}
        </span>
        <span className={gap === 0 ? 'text-success' : 'text-error'}>
          {gap === 0 ? 'converged' : `gap = ${gap}`}
        </span>
        <span className="text-text-muted">tick {state.tick}</span>
      </div>

      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Loop log</h4>
        <ul className="space-y-1 text-[12px] font-mono text-text-secondary">
          {state.log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// --- Cluster Architecture Explorer view ----------------------------------

function ComponentCard({ component, selected }: { component: ArchitectureComponent; selected: boolean }) {
  return (
    <div
      className={
        selected
          ? 'rounded-md border border-accent bg-accent/5 px-3 py-2 text-[12px]'
          : 'rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 text-[12px] text-text-muted'
      }
    >
      <div className="font-medium text-text">{component.name}</div>
      <div className="text-text-muted">{component.tier === 'control-plane' ? 'control plane' : 'node'}</div>
    </div>
  );
}

export function renderArchitectureExplorerState(state: ArchitectureExplorerState) {
  const selected = ARCHITECTURE_COMPONENTS.find((c) => c.id === state.selectedId);
  const cp = ARCHITECTURE_COMPONENTS.filter((c) => c.tier === 'control-plane');
  const node = ARCHITECTURE_COMPONENTS.filter((c) => c.tier === 'node');
  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">Control plane</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cp.map((c) => (
            <ComponentCard key={c.id} component={c} selected={state.selectedId === c.id} />
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">Node components</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {node.map((c) => (
            <ComponentCard key={c.id} component={c} selected={state.selectedId === c.id} />
          ))}
        </div>
      </div>

      {selected ? (
        <div className="space-y-3 rounded-md border border-border bg-surface p-3">
          <div>
            <h3 className="text-[13px] font-semibold text-text">{selected.name}</h3>
            <p className="text-[11px] uppercase tracking-wide text-text-muted">
              {selected.tier === 'control-plane' ? 'Control plane' : 'Node'}
            </p>
          </div>
          <div>
            <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Responsibilities</h4>
            <ul className="list-disc space-y-0.5 pl-5 text-[12px] text-text-secondary">
              {selected.responsibilities.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Internal behavior</h4>
            <p className="text-[12px] text-text-secondary">{selected.internal}</p>
          </div>
          <div>
            <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Communicates with</h4>
            <p className="text-[12px] text-text-secondary">{selected.communicatesWith.join(' · ')}</p>
          </div>
          <div>
            <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Failure behavior</h4>
            <p className="text-[12px] text-text-secondary">{selected.failure}</p>
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-text-muted">Advance the simulation to inspect each component in turn.</p>
      )}
    </div>
  );
}
