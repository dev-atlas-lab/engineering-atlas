import { cn } from '../../../lib/utils';
import { causeNote, STAGES, type IncidentState, type Stage } from './incident-investigation';

const SIGNALS: { stage: Stage; label: string }[] = [
  { stage: 'alert', label: 'Alert' },
  { stage: 'metrics', label: 'Metrics' },
  { stage: 'logs', label: 'Logs' },
  { stage: 'trace', label: 'Traces' },
  { stage: 'rca', label: 'Root cause' },
];

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const w = 220;
  const h = 40;
  const step = w / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${h - (v / max) * (h - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full" role="img" aria-label={`Error rate rising to ${max}%`}>
      <title>Error rate over the incident window</title>
      <desc>Error rate rising sharply from near zero to about {max}%.</desc>
      <polyline points={points} fill="none" strokeWidth={1.75} className="stroke-error atlas-flow" />
    </svg>
  );
}

export function renderIncidentState(state: IncidentState) {
  const c = state.content;
  const seen = new Set(state.seen);

  return (
    <div className="space-y-3 text-[13px]">
      <ol className="flex flex-wrap gap-1.5" aria-label="Investigation progress">
        {SIGNALS.map((s, i) => {
          const done = seen.has(s.stage);
          const current = c?.stage === s.stage;
          return (
            <li key={s.stage} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'rounded-md border px-2 py-1 text-[12px] font-medium',
                  current ? 'border-accent text-accent' : done ? 'border-success/60 text-success' : 'border-border text-text-muted',
                )}
              >
                {done && !current ? '✓ ' : ''}
                {s.label}
              </span>
              {i < SIGNALS.length - 1 && <span aria-hidden className="text-text-muted">→</span>}
            </li>
          );
        })}
      </ol>

      {c ? (
        <div className="rounded-lg border border-border bg-surface p-3">
          <h3 className="text-[13px] font-medium text-text">
            {c.signal}: {c.title}
          </h3>
          {c.spark && (
            <div className="my-2 rounded-md border border-border bg-bg-subtle p-2">
              <p className="mb-1 text-[11px] text-text-muted">Error rate (%)</p>
              <Sparkline values={c.spark} />
            </div>
          )}
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-text-secondary">
            {c.findings.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="mt-2 rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 text-[13px] text-text">{c.hypothesis}</p>
        </div>
      ) : (
        <p className="text-text-muted">Step forward to work the incident from the alert through to root cause.</p>
      )}

      {state.revealedCause !== null && (
        <p className={cn('rounded-md border px-3 py-2 text-text', state.diagnosisCorrect ? 'border-success/60 bg-success/5' : 'border-error/60 bg-error/5')}>
          <span className="font-medium">{state.diagnosisCorrect ? 'Correct. ' : 'Not quite. '}</span>
          Correlating all three signals shows the cause is {causeNote[state.revealedCause]}.
          {!state.diagnosisCorrect && ` You chose ${causeNote[state.diagnosis]} — re-read which signals moved and where the trace’s first error was.`}
        </p>
      )}

      <p className="text-[12px] text-text-muted">
        A guided, deterministic walkthrough over {STAGES.length} stages with fixed, illustrative data — not a real monitoring backend.
      </p>
    </div>
  );
}
