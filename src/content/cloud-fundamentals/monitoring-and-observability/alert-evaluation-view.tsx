import { cn } from '../../../lib/utils';
import type { AlertRuntimeState, AlertState } from './alert-evaluation';

const PLOT_W = 440;
const PLOT_H = 130;
const LEFT = 8;
const TOP = 10;
const STEP = PLOT_W / 11;
const Y_MAX = 600;

const stateMeta: Record<AlertState, { label: string; cls: string }> = {
  'insufficient-data': { label: 'Insufficient data', cls: 'border-border text-text-muted' },
  ok: { label: 'OK', cls: 'border-success/60 text-success' },
  pending: { label: 'Pending (breaching)', cls: 'border-warning/60 text-warning' },
  firing: { label: 'Firing', cls: 'border-error/60 text-error' },
  resolved: { label: 'Resolved', cls: 'border-success/60 text-success' },
};

const y = (v: number) => TOP + (1 - Math.min(v, Y_MAX) / Y_MAX) * PLOT_H;

export function renderAlertState(state: AlertRuntimeState) {
  const evals = state.evaluations;
  const current = evals[evals.length - 1];
  const upper = current?.upper ?? state.config.threshold;
  const thresholdY = y(upper);
  const linePoints = evals.map((e) => `${LEFT + e.tick * STEP},${y(e.value)}`).join(' ');

  return (
    <div className="space-y-3 text-[13px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-md border px-2 py-1 text-[12px] font-medium', current ? stateMeta[current.state].cls : stateMeta['insufficient-data'].cls)}>
          Alert: {current ? stateMeta[current.state].label : 'not started'}
        </span>
        <span className="rounded-md border border-border px-2 py-1 text-[12px] text-text-secondary">
          {state.config.thresholdType === 'dynamic' ? `Dynamic band ≈ ${upper} ms` : `Static threshold ${upper} ms`} · fire after {state.config.evaluationPeriods} periods
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-3">
        <svg viewBox={`0 0 ${PLOT_W + LEFT * 2} ${PLOT_H + TOP + 20}`} width={PLOT_W + LEFT * 2} height={PLOT_H + TOP + 20} className="min-w-full" role="group" aria-label="Alert evaluation">
          <title>Latency against the alert threshold over time</title>
          <desc>The latency metric is plotted over time with the alert threshold; points above the threshold are breaching.</desc>
          {/* breach zone */}
          <rect x={LEFT} y={TOP} width={PLOT_W} height={Math.max(thresholdY - TOP, 0)} className="fill-error/5" />
          <line x1={LEFT} y1={thresholdY} x2={LEFT + PLOT_W} y2={thresholdY} className="stroke-error" strokeDasharray="4 3" />
          <text x={LEFT + PLOT_W} y={thresholdY - 3} textAnchor="end" className="fill-error text-[10px]">threshold {upper} ms</text>
          <line x1={LEFT} y1={TOP + PLOT_H} x2={LEFT + PLOT_W} y2={TOP + PLOT_H} className="stroke-border" />
          {evals.length === 0 ? (
            <text x={LEFT + PLOT_W / 2} y={TOP + PLOT_H / 2} textAnchor="middle" className="fill-text-muted text-[12px]">Step forward to evaluate the alert</text>
          ) : (
            <>
              <polyline points={linePoints} fill="none" strokeWidth={1.75} className={cn('stroke-text-secondary', current?.state === 'firing' && 'atlas-flow stroke-error')} />
              {evals.map((e) => (
                <circle key={e.tick} cx={LEFT + e.tick * STEP} cy={y(e.value)} r={2.5} className={e.breaching ? 'fill-error' : 'fill-success'} />
              ))}
            </>
          )}
        </svg>
      </div>

      {current ? (
        <p className="rounded-md border border-border bg-surface px-3 py-2 text-text-secondary">
          <span className="font-medium text-text">t={current.tick} ({current.value} ms): </span>
          {current.note}
        </p>
      ) : (
        <p className="text-text-muted">Step forward to evaluate the alert against the metric.</p>
      )}

      <p className="text-[12px] text-text-muted">Illustrative latency values and a single metric. Real alerts aggregate over windows and route through action groups / notification targets.</p>
    </div>
  );
}
