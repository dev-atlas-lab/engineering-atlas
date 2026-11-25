import { cn } from '../../../lib/utils';
import type { PolicyEvalState, StepVerdict } from './policy-evaluation';

const verdictText: Record<StepVerdict, string> = {
  info: '',
  pass: 'Continue',
  skipped: 'Skipped',
  allow: 'Allow',
  deny: 'Deny',
};

const verdictClass: Record<StepVerdict, string> = {
  info: 'text-text-muted',
  pass: 'text-text-secondary',
  skipped: 'text-text-muted',
  allow: 'text-success',
  deny: 'text-error',
};

export function renderPolicyEvaluationState(state: PolicyEvalState) {
  return (
    <div className="space-y-4 text-[13px]">
      <dl className="grid gap-x-3 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="font-medium text-text">Principal</dt>
        <dd className="break-all font-mono text-[12px] text-text-secondary">{state.principalArn}</dd>
        <dt className="font-medium text-text">Action</dt>
        <dd className="font-mono text-[12px] text-text-secondary">{state.config.action}</dd>
        <dt className="font-medium text-text">Resource</dt>
        <dd className="break-all font-mono text-[12px] text-text-secondary">{state.resourceArn}</dd>
      </dl>

      <div>
        <h4 className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-text-muted">Policies considered</h4>
        {state.policies.length === 0 ? (
          <p className="text-text-secondary">No policies apply. With nothing to allow the request, the default implicit deny will decide it.</p>
        ) : (
          <ul className="space-y-2">
            {state.policies.map((policy) => (
              <li key={policy.name} className="rounded-md border border-border bg-surface p-2">
                <p className="font-medium text-text">{policy.name}</p>
                <ul className="mt-1 space-y-0.5">
                  {policy.matches.map((m) => (
                    <li key={m.sid} className="text-[12px] text-text-secondary">
                      <span className={cn('font-medium', m.matches ? (m.effect === 'Deny' ? 'text-error' : 'text-success') : 'text-text-muted')}>
                        {m.sid} ({m.effect}) — {m.matches ? 'matches' : 'does not match'}
                      </span>
                      <span className="block">{m.note}</span>
                    </li>
                  ))}
                </ul>
                <details className="mt-1">
                  <summary className="cursor-pointer text-[12px] text-accent">Show policy JSON</summary>
                  <pre className="mt-1 overflow-x-auto rounded bg-bg-subtle p-2 font-mono text-[11px] text-text">{policy.json}</pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-text-muted">Evaluation</h4>
        {state.steps.length === 0 ? (
          <p className="text-text-muted">Not evaluated yet. Step forward to walk through the evaluation.</p>
        ) : (
          <ol className="space-y-1.5">
            {state.steps.map((step, i) => (
              <li key={`${step.stage}-${i}`} className="rounded-md border border-border bg-surface px-3 py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-medium text-text">
                    {i + 1}. {step.title}
                  </span>
                  {verdictText[step.verdict] && (
                    <span className={cn('text-[12px] font-medium', verdictClass[step.verdict])}>{verdictText[step.verdict]}</span>
                  )}
                </div>
                <p className="mt-0.5 text-text-secondary">{step.detail}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {state.decision && (
        <p
          className={cn(
            'rounded-md border px-3 py-2 text-text',
            state.decision === 'allow' ? 'border-success/50' : 'border-error/60 bg-error/5',
          )}
        >
          <span className="font-medium">
            Decision: {state.decision === 'allow' ? 'Allow' : state.decision === 'explicit-deny' ? 'Explicit deny' : 'Implicit deny'}.
          </span>{' '}
          {state.reason}
        </p>
      )}

      <p className="text-[12px] text-text-muted">
        Simplified model of AWS evaluation within one account. Not modelled: conditions, resource control policies,
        cross-account requests, and service-specific rules such as KMS key policies. Use the AWS IAM policy simulator
        and IAM Access Analyzer to check real policies.
      </p>
    </div>
  );
}
