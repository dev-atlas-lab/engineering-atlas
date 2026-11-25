import { cn } from '../../../lib/utils';
import type { ControlOutcome, ControlState } from './control-response';

const controlLabel = {
  change: 'Change',
  preventive: 'Preventive',
  detective: 'Detective',
  corrective: 'Corrective',
  alert: 'Alert',
  human: 'People',
  exposure: 'Exposure',
} as const;

const outcomeText: Record<ControlOutcome, string> = {
  prevented: 'Prevented — the risky configuration never existed.',
  'auto-remediated': 'Detected and automatically remediated.',
  'fixed-after-alert': 'Detected, alerted, and fixed by a person.',
  'found-in-review': 'Detected, but nobody was told until the weekly review.',
  undetected: 'Never detected.',
};

function formatMinutes(minutes: number): string {
  if (minutes === 0) return 'none';
  if (minutes < 120) return `${minutes} minutes`;
  if (minutes < 2 * 24 * 60) return `${Math.round(minutes / 60)} hours`;
  return `${Math.round(minutes / (24 * 60))} days`;
}

function timeLabel(minute: number): string {
  return minute < 120 ? `min ${minute}` : `day ${Math.round(minute / (24 * 60))}`;
}

export function renderControlState(state: ControlState) {
  return (
    <div className="space-y-3 text-[13px]">
      {state.events.length === 0 ? (
        <p className="text-text-muted">Step forward to make the change.</p>
      ) : (
        <ol className="space-y-1.5">
          {state.events.map((event, i) => (
            <li key={`${event.control}-${i}`} className={cn('rounded-md border bg-surface px-3 py-2', event.result === 'fail' ? 'border-error/40' : 'border-border')}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="inline-block min-w-[4.5rem] font-mono text-[12px] text-text-muted">{timeLabel(event.minute)}</span>
                <span className="text-[12px] font-medium uppercase tracking-wide text-text-muted">{controlLabel[event.control]}</span>
                <span className="font-medium text-text">{event.title}</span>
              </div>
              <p className="mt-0.5 text-text-secondary">{event.detail}</p>
            </li>
          ))}
        </ol>
      )}
      {state.summary && (
        <p className={cn('rounded-md border px-3 py-2 text-text', state.summary.outcome === 'prevented' || state.summary.outcome === 'auto-remediated' ? 'border-success/50' : 'border-error/60 bg-error/5')}>
          <span className="font-medium">{outcomeText[state.summary.outcome]}</span> Exposure window:{' '}
          {state.summary.exposureMinutes === null ? 'indefinite' : formatMinutes(state.summary.exposureMinutes)}.
        </p>
      )}
      <p className="text-[12px] text-text-muted">Illustrative timings, for comparing combinations of controls — not measured service behaviour.</p>
    </div>
  );
}
