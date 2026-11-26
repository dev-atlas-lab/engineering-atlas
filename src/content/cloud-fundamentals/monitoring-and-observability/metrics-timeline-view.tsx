import { cn } from '../../../lib/utils';
import { diagnosisNote, SCENARIOS, type MetricsState, type Series } from './metrics-timeline';

const PLOT_W = 460;
const PLOT_H = 150;
const LEFT = 8;
const TOP = 10;
const STEP = PLOT_W / 11;

const seriesColor: Record<Series['key'], { stroke: string; text: string; border: string }> = {
  throughput: { stroke: 'stroke-accent', text: 'text-accent', border: 'border-accent' },
  latency: { stroke: 'stroke-warning', text: 'text-warning', border: 'border-warning' },
  errors: { stroke: 'stroke-error', text: 'text-error', border: 'border-error' },
  saturation: { stroke: 'stroke-success', text: 'text-success', border: 'border-success' },
};

export function renderMetricsState(state: MetricsState) {
  const { series, tick } = state;
  const maxes = Object.fromEntries(series.map((s) => [s.key, Math.max(...s.values, 1)])) as Record<Series['key'], number>;
  const eventX = LEFT + state.eventTick * STEP;

  const linePoints = (s: Series) =>
    s.values
      .slice(0, Math.max(tick + 1, 0))
      .map((v, i) => `${LEFT + i * STEP},${TOP + (1 - v / maxes[s.key]) * PLOT_H}`)
      .join(' ');

  return (
    <div className="space-y-3 text-[13px]">
      <div className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-3">
        <svg viewBox={`0 0 ${PLOT_W + LEFT * 2} ${PLOT_H + TOP + 22}`} width={PLOT_W + LEFT * 2} height={PLOT_H + TOP + 22} className="min-w-full" role="group" aria-label="Metrics timeline">
          <title>Four correlated metrics over time</title>
          <desc>Throughput, latency, error rate, and saturation plotted on a shared normalized scale, revealed up to the current time, with an event marker.</desc>
          {/* baseline + axis labels */}
          <line x1={LEFT} y1={TOP + PLOT_H} x2={LEFT + PLOT_W} y2={TOP + PLOT_H} className="stroke-border" />
          <text x={LEFT} y={TOP + PLOT_H + 16} className="fill-text-muted text-[10px]">t=0</text>
          <text x={LEFT + PLOT_W} y={TOP + PLOT_H + 16} textAnchor="end" className="fill-text-muted text-[10px]">t=11</text>
          {/* event marker */}
          {tick >= state.eventTick && (
            <>
              <line x1={eventX} y1={TOP} x2={eventX} y2={TOP + PLOT_H} className="stroke-text-muted" strokeDasharray="3 3" />
              <text x={eventX + 3} y={TOP + 10} className="fill-text-muted text-[10px]">{state.eventLabel}</text>
            </>
          )}
          {tick < 0 ? (
            <text x={LEFT + PLOT_W / 2} y={TOP + PLOT_H / 2} textAnchor="middle" className="fill-text-muted text-[12px]">Step forward to reveal the metrics</text>
          ) : (
            series.map((s) => <polyline key={s.key} points={linePoints(s)} fill="none" strokeWidth={1.75} className={cn(seriesColor[s.key].stroke, tick >= state.eventTick && (s.key === 'latency' || s.key === 'errors') && 'atlas-flow')} />)
          )}
        </svg>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Series legend and current values">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-[12px]">
            <span aria-hidden className={cn('inline-block h-0 w-4 border-t-2', seriesColor[s.key].border)} />
            <span className="text-text-secondary">{s.label}:</span>
            <span className={cn('font-medium', seriesColor[s.key].text)}>{tick >= 0 ? `${s.values[tick]} ${s.unit}` : '—'}</span>
          </li>
        ))}
      </ul>

      <p className="rounded-md border border-border bg-surface px-3 py-2 text-text-secondary">{state.note}</p>

      {state.revealedCause !== null && (
        <p className={cn('rounded-md border px-3 py-2 text-text', state.diagnosisCorrect ? 'border-success/60 bg-success/5' : 'border-error/60 bg-error/5')}>
          <span className="font-medium">{state.diagnosisCorrect ? 'Correct diagnosis. ' : 'Not quite. '}</span>
          The signals point to {diagnosisNote[SCENARIOS[state.scenario].cause]}.
          {!state.diagnosisCorrect && ` You chose ${diagnosisNote[state.diagnosis]} — re-read which signals moved and which stayed flat.`}
        </p>
      )}

      <p className="text-[12px] text-text-muted">Series are normalized to their own peak so their shapes can be compared. Illustrative values, not a real backend.</p>
    </div>
  );
}
