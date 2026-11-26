import { cn } from '../../../lib/utils';
import { depthOf, type Span, type TraceState } from './trace-waterfall';

const LABEL_W = 170;
const BAR_W = 300;
const ROW = 26;
const TOP = 8;

export function renderTraceState(state: TraceState) {
  const spans = state.spans;
  const byId = new Map(spans.map((s) => [s.id, s]));
  const critical = new Set(state.critical);
  const width = LABEL_W + BAR_W + 50;
  const height = TOP + Math.max(spans.length, 1) * ROW + 6;

  const barX = (s: Span) => LABEL_W + (s.start / state.total) * BAR_W;
  const barWidth = (s: Span) => Math.max((s.duration / state.total) * BAR_W, 2);

  return (
    <div className="space-y-3 text-[13px]">
      <p className="text-text-secondary">
        <span className="font-medium text-text">Total: {state.total} ms</span> · {spans.length} span{spans.length === 1 ? '' : 's'} revealed ·{' '}
        <span className="text-accent">accent = critical path</span>, <span className="text-error">red = error</span>
      </p>

      <div className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-3">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="min-w-full" role="group" aria-label="Distributed trace waterfall">
          <title>Distributed trace waterfall</title>
          <desc>Each row is a span positioned by its start time and duration; indentation shows parent-child depth, and the critical path and errors are highlighted.</desc>
          {spans.map((s, i) => {
            const y = TOP + i * ROW;
            const depth = depthOf(s, byId);
            const onCritical = critical.has(s.id);
            const isError = s.status === 'error';
            return (
              <g key={s.id}>
                <text x={4 + depth * 12} y={y + 15} className={cn('text-[11px]', isError ? 'fill-error' : 'fill-text')}>
                  {s.service}
                </text>
                <rect
                  x={barX(s)}
                  y={y + 4}
                  width={barWidth(s)}
                  height={14}
                  rx={3}
                  className={cn(isError ? 'fill-error/70' : onCritical ? 'fill-accent/70' : 'fill-text-muted/50', (isError || onCritical) && i === spans.length - 1 && 'atlas-flow')}
                />
                <text x={barX(s) + barWidth(s) + 4} y={y + 15} className="fill-text-secondary text-[10px]">
                  {s.name} · {s.duration}ms
                </text>
              </g>
            );
          })}
          {spans.length === 0 && (
            <text x={width / 2} y={TOP + ROW} textAnchor="middle" className="fill-text-muted text-[12px]">Step forward to reveal the trace</text>
          )}
        </svg>
      </div>

      <p className="rounded-md border border-border bg-surface px-3 py-2 text-text-secondary">{state.note}</p>

      {state.revealedCause !== null && (
        <p className={cn('rounded-md border px-3 py-2 text-text', state.diagnosisCorrect ? 'border-success/60 bg-success/5' : 'border-error/60 bg-error/5')}>
          <span className="font-medium">{state.diagnosisCorrect ? 'Correct. ' : 'Not quite. '}</span>
          The trace points to <span className="font-mono">{state.revealedCause}</span>.
          {!state.diagnosisCorrect && ` You chose ${state.diagnosis} — follow the critical path (or the earliest error span) to the service actually responsible.`}
        </p>
      )}

      <p className="text-[12px] text-text-muted">Fixed, illustrative trace. A real trace has many more spans; the reading — critical path and earliest error — is the same.</p>
    </div>
  );
}
