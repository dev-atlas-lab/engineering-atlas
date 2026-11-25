import { cn } from '../../../lib/utils';
import type { SecretState } from './secret-retrieval';

const rotationText = {
  'not-rotated': 'The password was not rotated.',
  followed: 'Rotation succeeded and the app followed it without downtime.',
  'broke-app': 'Rotation broke the app because it cached the old version.',
  'requires-rebuild': 'Rotation broke the app until a rebuild and redeploy — the secret is fixed in the artifact.',
} as const;

export function renderSecretState(state: SecretState) {
  return (
    <div className="space-y-4 text-[13px]">
      <div className="flex flex-wrap gap-2" aria-label="Secret versions">
        {state.versions.map((v) => (
          <span key={v.version} className={cn('rounded border px-2 py-0.5 text-[12px]', v.status === 'current' ? 'border-success/60 text-success' : 'border-border text-text-muted')}>
            db-password {v.version} · {v.status}
          </span>
        ))}
        <span className="rounded border border-border px-2 py-0.5 text-[12px] text-text-secondary">App holds: {state.appHolds ?? 'nothing yet'}</span>
      </div>

      {state.events.length === 0 ? (
        <p className="text-text-muted">Step forward to start the application.</p>
      ) : (
        <ol className="space-y-1.5">
          {state.events.map((event, i) => (
            <li key={`${event.phase}-${i}`} className="rounded-md border border-border bg-surface px-3 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-medium text-text">
                  {i + 1}. {event.title}
                </span>
                {event.result !== 'info' && (
                  <span className={cn('text-[12px] font-medium', event.result === 'ok' ? 'text-success' : 'text-error')}>
                    {event.result === 'ok' ? 'OK' : 'Problem'}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-text-secondary">{event.detail}</p>
            </li>
          ))}
        </ol>
      )}

      {state.summary && (
        <ul className="space-y-0.5 rounded-md border border-border p-3 text-text-secondary">
          <li>
            <span className="font-medium text-text">App:</span> {state.summary.appWorking ? 'working' : 'not working'}
          </li>
          <li>
            <span className="font-medium text-text">Rotation:</span> {rotationText[state.summary.rotationOutcome]}
          </li>
          <li>
            <span className="font-medium text-text">Exposure:</span>{' '}
            {state.summary.secretExposed ? 'the password leaked and still works' : 'no usable secret leaked'}
          </li>
          <li>
            <span className="font-medium text-text">Audit trail:</span>{' '}
            {state.summary.auditTrail ? 'every read is logged with the caller identity' : 'none — reads are invisible'}
          </li>
        </ul>
      )}

      <p className="text-[12px] text-text-muted">Simulated: no secret store, database, or registry is contacted.</p>
    </div>
  );
}
