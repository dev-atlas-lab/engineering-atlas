import type {
  CniNetworkState,
  IngressState,
  NpState,
  RbacState,
  WorkloadSecurityState,
  SecurityFinding,
} from './security-simulations';

// --- CNI view -------------------------------------------------------------

export function renderCniNetworkState(state: CniNetworkState) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-[13px] text-text-secondary">
        <span><span className="font-medium text-text">Mode:</span> {state.mode}</span>
        <span><span className="font-medium text-text">Source:</span> {state.source}</span>
        <span><span className="font-medium text-text">Destination:</span> {state.destination}</span>
        <span className={state.delivered ? 'text-success' : state.hops.length > 0 ? 'text-error' : 'text-text-muted'}>
          {state.hops.length === 0 ? 'not yet traced' : state.delivered ? 'delivered' : 'dropped'}
        </span>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Packet path</h4>
        {state.hops.length === 0 ? (
          <p className="text-[12px] text-text-muted">Advance the simulation to trace the packet.</p>
        ) : (
          <ol className="space-y-1 text-[12px] text-text-secondary">
            {state.hops.map((hop, i) => (
              <li key={i} className={hop.kind === 'dropped' ? 'rounded border border-error/40 bg-error/5 px-2 py-1 text-error' : 'rounded border border-border-subtle bg-bg-subtle px-2 py-1'}>
                <span className="font-mono text-[11px] text-text-muted">{hop.at}</span>
                <span className="mx-2 text-[11px] uppercase tracking-wide text-text-muted">{hop.kind}</span>
                <span>{hop.detail}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      {state.failureReason && (
        <p className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-[13px] text-error">
          {state.failureReason}
        </p>
      )}
    </div>
  );
}

// --- Ingress view ---------------------------------------------------------

export function renderIngressState(state: IngressState) {
  const d = state.decision;
  return (
    <div className="space-y-3">
      <div className="text-[13px] text-text-secondary">
        <span className="font-medium text-text">Request:</span>{' '}
        <code className="font-mono text-[12px]">
          {state.request.scheme}://{state.request.host}{state.request.path}
        </code>
        {' · '}
        <span className="text-text-muted">TLS configured: {state.tlsEnabled ? 'yes' : 'no'}</span>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Rules</h4>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="border-b border-border px-2 py-1 text-left">Host</th>
              <th className="border-b border-border px-2 py-1 text-left">Path</th>
              <th className="border-b border-border px-2 py-1 text-left">Type</th>
              <th className="border-b border-border px-2 py-1 text-left">Backend</th>
            </tr>
          </thead>
          <tbody>
            {state.rules.map((r, i) => {
              const matched = d?.matched && d.rule === r;
              return (
                <tr key={i} className={matched ? 'bg-success/5' : ''}>
                  <td className="px-2 py-1 font-mono">{r.host ?? '*'}</td>
                  <td className="px-2 py-1 font-mono">{r.path}</td>
                  <td className="px-2 py-1">{r.pathType}</td>
                  <td className="px-2 py-1">{r.backendService}:{r.backendPort}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {d && (
        <div className={d.responseCode === 200 ? 'rounded-md border border-success/40 bg-success/5 px-3 py-2 text-[13px]' : 'rounded-md border border-error/40 bg-error/5 px-3 py-2 text-[13px]'}>
          <div className={d.responseCode === 200 ? 'font-medium text-success' : 'font-medium text-error'}>
            HTTP {d.responseCode}
          </div>
          <div className="text-text-secondary">{d.reason}</div>
          {d.tlsTerminated && <div className="text-[11px] text-text-muted">TLS terminated at the controller; backend connection is plain HTTP</div>}
        </div>
      )}
    </div>
  );
}

// --- NetworkPolicy view --------------------------------------------------

export function renderNpState(state: NpState) {
  const d = state.decision;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-[13px] text-text-secondary">
        <span><span className="font-medium text-text">Request:</span> {state.source} → {state.destination}</span>
        <span className="text-text-muted">{state.policies.length} polic{state.policies.length === 1 ? 'y' : 'ies'} installed</span>
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Pods</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {state.pods.map((p) => (
            <div key={p.id} className={
              p.id === state.source ? 'rounded-md border border-accent bg-accent/5 px-2 py-1.5 text-[12px]' :
              p.id === state.destination ? 'rounded-md border border-success bg-success/5 px-2 py-1.5 text-[12px]' :
              'rounded-md border border-border-subtle bg-bg-subtle px-2 py-1.5 text-[12px] text-text-muted'
            }>
              <div className="font-medium text-text">{p.namespace}/{p.id}</div>
              <div className="text-text-muted">{Object.entries(p.labels).map(([k, v]) => `${k}=${v}`).join(' ')}</div>
            </div>
          ))}
        </div>
      </div>
      {state.policies.length > 0 && (
        <div>
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Policies</h4>
          <ul className="space-y-1 text-[12px] text-text-secondary">
            {state.policies.map((p) => (
              <li key={p.id} className="rounded border border-border-subtle bg-bg-subtle px-2 py-1 font-mono">
                {p.namespace}/{p.id} · selects {Object.keys(p.podSelector).length === 0 ? '(all pods)' : JSON.stringify(p.podSelector)} · types [{p.policyTypes.join(', ')}]
              </li>
            ))}
          </ul>
        </div>
      )}
      {d && (
        <div className={d.allowed ? 'rounded-md border border-success/40 bg-success/5 px-3 py-2 text-[13px]' : 'rounded-md border border-error/40 bg-error/5 px-3 py-2 text-[13px]'}>
          <div className={d.allowed ? 'font-medium text-success' : 'font-medium text-error'}>
            {d.allowed ? 'ALLOWED' : 'DENIED'}
          </div>
          <div className="text-text-secondary">{d.reason}</div>
        </div>
      )}
    </div>
  );
}

// --- RBAC view ----------------------------------------------------------

export function renderRbacState(state: RbacState) {
  const d = state.decision;
  const req = state.request;
  return (
    <div className="space-y-3">
      <div className="text-[13px] text-text-secondary">
        <span className="font-medium text-text">Request:</span>{' '}
        <code className="font-mono text-[12px]">
          {req.subject.kind}:{req.subject.name}{req.subject.namespace ? `@${req.subject.namespace}` : ''} → {req.verb} {req.apiGroup || 'core'}/{req.resource}{req.namespace ? ` in ${req.namespace}` : ' (cluster-scoped)'}
        </code>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Roles</h4>
          <ul className="space-y-1 text-[12px] text-text-secondary">
            {state.roles.map((r) => (
              <li key={`${r.namespace ?? 'cluster'}/${r.name}`} className={d?.matchedRole === r.name ? 'rounded border border-success bg-success/5 px-2 py-1 font-mono' : 'rounded border border-border-subtle bg-bg-subtle px-2 py-1 font-mono'}>
                {r.namespace === null ? 'ClusterRole' : `Role ${r.namespace}/`}
                {r.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Bindings</h4>
          <ul className="space-y-1 text-[12px] text-text-secondary">
            {state.bindings.map((b) => (
              <li key={`${b.namespace ?? 'cluster'}/${b.name}`} className={d?.matchedBinding === b.name ? 'rounded border border-success bg-success/5 px-2 py-1 font-mono' : 'rounded border border-border-subtle bg-bg-subtle px-2 py-1 font-mono'}>
                {b.namespace === null ? 'ClusterRoleBinding' : `RoleBinding ${b.namespace}/`}
                {b.name} → {b.roleRef.kind}:{b.roleRef.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {d && (
        <div className={d.allowed ? 'rounded-md border border-success/40 bg-success/5 px-3 py-2 text-[13px]' : 'rounded-md border border-error/40 bg-error/5 px-3 py-2 text-[13px]'}>
          <div className={d.allowed ? 'font-medium text-success' : 'font-medium text-error'}>
            {d.allowed ? 'ALLOWED' : 'FORBIDDEN'}
          </div>
          <div className="text-text-secondary">{d.reason}</div>
        </div>
      )}
    </div>
  );
}

// --- Workload security view ---------------------------------------------

function findingBadgeColor(sev: SecurityFinding['severity']): string {
  switch (sev) {
    case 'critical': return 'bg-error text-white';
    case 'high': return 'bg-error/15 text-error';
    case 'medium': return 'bg-warn/15 text-warn';
    case 'low': return 'bg-accent/15 text-accent';
    case 'info': default: return 'bg-success/15 text-success';
  }
}

export function renderWorkloadSecurityState(state: WorkloadSecurityState) {
  const c = state.ctx;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-[12px] text-text-secondary">
        <span><span className="font-medium text-text">runAsUser:</span> {c.runAsUser ?? 'default'}</span>
        <span><span className="font-medium text-text">runAsNonRoot:</span> {String(c.runAsNonRoot)}</span>
        <span><span className="font-medium text-text">rootfs:</span> {c.readOnlyRootFilesystem ? 'read-only' : 'writable'}</span>
        <span><span className="font-medium text-text">priv escalation:</span> {String(c.allowPrivilegeEscalation)}</span>
        <span><span className="font-medium text-text">privileged:</span> {String(c.privileged)}</span>
        <span><span className="font-medium text-text">seccomp:</span> {c.seccompProfile}</span>
      </div>
      <div className="text-[12px] text-text-secondary">
        <span className="font-medium text-text">capabilities:</span>{' '}
        drop=[{c.capabilitiesDrop.join(', ') || 'none'}] add=[{c.capabilitiesAdd.join(', ') || 'none'}]
      </div>
      <div>
        <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">Findings</h4>
        {state.findings.length === 0 ? (
          <p className="text-[12px] text-text-muted">Advance the simulation to scan.</p>
        ) : (
          <ul className="space-y-1 text-[12px] text-text-secondary">
            {state.findings.map((f) => (
              <li key={f.id} className="rounded border border-border-subtle bg-bg-subtle px-2 py-1">
                <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${findingBadgeColor(f.severity)}`}>{f.severity}</span>
                <span className="font-medium text-text">{f.title}</span>
                <div className="text-text-muted">{f.detail}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {state.admissionReason && (
        <div className={state.admissionAllowed ? 'rounded-md border border-success/40 bg-success/5 px-3 py-2 text-[13px]' : 'rounded-md border border-error/40 bg-error/5 px-3 py-2 text-[13px]'}>
          <div className={state.admissionAllowed ? 'font-medium text-success' : 'font-medium text-error'}>
            Pod Security Admission ({state.admissionProfile}): {state.admissionAllowed ? 'admitted' : 'rejected'}
          </div>
          <div className="text-text-secondary">{state.admissionReason}</div>
        </div>
      )}
    </div>
  );
}
