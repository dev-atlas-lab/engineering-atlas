import { cn } from '../../../lib/utils';
import { mechanismLabel, type CredentialState, type TimelineEvent } from './credential-lifecycle';

const actorLabel: Record<TimelineEvent['actor'], string> = { app: 'App', platform: 'Platform', attacker: 'Attacker' };

function resultText(event: TimelineEvent): { text: string; className: string } {
  if (event.result === 'info') return { text: '', className: '' };
  if (event.actor === 'attacker') {
    return event.result === 'fail' ? { text: 'Attacker succeeds', className: 'text-error' } : { text: 'Attacker blocked', className: 'text-success' };
  }
  return event.result === 'ok' ? { text: 'Succeeded', className: 'text-success' } : { text: 'Failed', className: 'text-error' };
}

const exposureText = {
  none: 'No credential was copied.',
  'until-expiry': 'A copied credential stays usable only until it expires.',
  'until-manually-revoked': 'A copied key stays usable until someone notices and rotates or deactivates it.',
} as const;

export function renderCredentialState(state: CredentialState) {
  return (
    <div className="space-y-3 text-[13px]">
      <p className="text-text-secondary">
        <span className="font-medium text-text">Mechanism:</span> {mechanismLabel(state.config.mechanism)}
      </p>
      {state.events.length === 0 ? (
        <p className="text-text-muted">The app has not started yet. Step forward to follow its credential over three hours.</p>
      ) : (
        <ol className="space-y-1.5">
          {state.events.map((event, i) => {
            const result = resultText(event);
            return (
              <li
                key={`${event.minute}-${event.actor}-${i}`}
                className={cn('rounded-md border bg-surface px-3 py-2', event.actor === 'attacker' ? 'border-error/40' : 'border-border')}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-medium text-text">
                    <span className="mr-1.5 inline-block min-w-[4.5rem] font-mono text-[12px] text-text-muted">min {event.minute}</span>
                    {actorLabel[event.actor]}: {event.label}
                  </span>
                  {result.text && <span className={cn('text-[12px] font-medium', result.className)}>{result.text}</span>}
                </div>
                <p className="mt-0.5 text-text-secondary">{event.detail}</p>
              </li>
            );
          })}
        </ol>
      )}

      {state.summary && (
        <div className="rounded-md border border-border p-3">
          <h4 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Summary</h4>
          <ul className="mt-1 space-y-0.5 text-text-secondary">
            <li>
              App calls: {state.summary.appCallsSucceeded} succeeded, {state.summary.appCallsFailed} failed
              {state.summary.failureCause === 'expired' && ' — the cached credential expired'}
              {state.summary.failureCause === 'forbidden' && ' — authenticated but not authorized'}
            </li>
            <li>{exposureText[state.summary.leakExposure ?? 'none']}</li>
            {state.config.leaked && <li>Attacker calls that succeeded: {state.summary.attackerCallsSucceeded}</li>}
            <li>{state.summary.secretStoredWithApp ? 'A secret is stored alongside the app and must be protected, rotated, and kept out of repositories.' : 'No secret is stored with the app: the platform issues and rotates its credentials.'}</li>
          </ul>
        </div>
      )}

      <p className="text-[12px] text-text-muted">
        Illustrative lifetimes: credentials live 60 minutes and are refreshed after 45. Real lifetimes and refresh
        points vary by provider, service, and SDK.
      </p>
    </div>
  );
}
