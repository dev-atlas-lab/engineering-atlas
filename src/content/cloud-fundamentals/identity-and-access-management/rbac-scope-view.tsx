import { cn } from '../../../lib/utils';
import type { RbacState, RbacStepVerdict } from './rbac-scope';

const verdictText: Record<RbacStepVerdict, string> = { info: '', pass: 'Continue', skipped: 'Skipped', allow: 'Allow', deny: 'Deny' };
const verdictClass: Record<RbacStepVerdict, string> = {
  info: 'text-text-muted',
  pass: 'text-text-secondary',
  skipped: 'text-text-muted',
  allow: 'text-success',
  deny: 'text-error',
};

const depthPadding = ['pl-0', 'pl-4', 'pl-8', 'pl-12'];

export function renderRbacScopeState(state: RbacState) {
  return (
    <div className="space-y-4 text-[13px]">
      <div>
        <h4 className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-text-muted">Scope hierarchy</h4>
        <ul className="space-y-0.5" aria-label="Scope hierarchy">
          {state.tree.map((row) => {
            const tags = [
              row.assignedHere && 'role assigned here',
              row.covered && !row.assignedHere && 'inherits the assignment',
              row.denyHere && 'deny assignment',
              row.isTarget && 'target',
            ].filter(Boolean) as string[];
            return (
              <li
                key={row.id}
                className={cn(
                  depthPadding[row.depth] ?? 'pl-12',
                  'flex flex-wrap items-baseline gap-x-2 rounded px-1 py-0.5',
                  row.isTarget && 'bg-accent/10',
                )}
              >
                <span className={cn(row.onPath ? 'font-medium text-text' : 'text-text-muted')}>
                  {row.level}: {row.label}
                </span>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'rounded border px-1 text-[11px]',
                      tag === 'deny assignment' ? 'border-error/60 text-error' : tag === 'target' ? 'border-accent text-accent' : 'border-success/60 text-success',
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </li>
            );
          })}
        </ul>
        <p className="mt-1 text-[12px] text-text-muted">Bold rows are the target’s path to the root — the only scopes whose assignments can apply to it.</p>
      </div>

      <p>
        <span className="font-medium text-text">Action: </span>
        <span className="break-all font-mono text-[12px] text-text-secondary">{state.action}</span>
      </p>

      {state.steps.length === 0 ? (
        <p className="text-text-muted">Not evaluated yet. Step forward to walk through the decision.</p>
      ) : (
        <ol className="space-y-1.5">
          {state.steps.map((step, i) => (
            <li key={`${step.title}-${i}`} className="rounded-md border border-border bg-surface px-3 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-medium text-text">
                  {i + 1}. {step.title}
                </span>
                {verdictText[step.verdict] && <span className={cn('text-[12px] font-medium', verdictClass[step.verdict])}>{verdictText[step.verdict]}</span>}
              </div>
              <p className="mt-0.5 text-text-secondary">{step.detail}</p>
            </li>
          ))}
        </ol>
      )}

      {state.decision && state.decision !== 'not-applicable' && (
        <p className={cn('rounded-md border px-3 py-2 text-text', state.decision === 'allow' ? 'border-success/50' : 'border-error/60 bg-error/5')}>
          {state.reason}
        </p>
      )}

      <p className="text-[12px] text-text-muted">
        Simplified model of Azure RBAC with a single role assignment. Role definitions are abbreviated; group membership,
        conditions, and key-based data access are not modelled.
      </p>
    </div>
  );
}
