import { cn } from '../../../lib/utils';
import type { ScalingState, Tick } from './scaling-model';

const BAR_W = 300;
const BOX = 26;
const GAP = 6;

const actionLabel: Record<Tick['action'], string> = {
  'scale-out': 'Scale out',
  'scale-in': 'Scale in',
  hold: 'Hold',
  cooldown: 'Cooldown — holding',
  scheduled: 'Scheduled change',
};

const actionClass: Record<Tick['action'], string> = {
  'scale-out': 'text-success',
  'scale-in': 'text-accent',
  hold: 'text-text-secondary',
  cooldown: 'text-warning',
  scheduled: 'text-accent',
};

function MetricBar({ tick, target }: { tick: Tick; target: number }) {
  const shown = Math.min(tick.metric, 100);
  const w = Math.round((shown / 100) * BAR_W);
  const targetX = Math.round((target / 100) * BAR_W);
  const over = tick.overloaded;
  return (
    <svg viewBox={`0 0 ${BAR_W + 60} 26`} width={BAR_W + 60} height={26} className="min-w-full" role="group" aria-label={`Metric ${Math.min(tick.metric, 100)} percent, target ${target} percent`}>
      <title>Observed metric against target</title>
      <rect x={0} y={6} width={BAR_W} height={12} rx={3} className="fill-bg-muted" />
      <rect x={0} y={6} width={w} height={12} rx={3} className={over ? 'fill-error' : tick.metric > target ? 'fill-warning' : 'fill-success'} />
      <line x1={targetX} y1={2} x2={targetX} y2={22} className="stroke-text" strokeWidth={1.5} strokeDasharray="2 2" />
      <text x={BAR_W + 6} y={16} className="fill-text text-[12px] font-medium">
        {over ? `${tick.metric}% ⚠` : `${tick.metric}%`}
      </text>
    </svg>
  );
}

export function renderScalingState(state: ScalingState) {
  const tick = state.current;
  const { min, max, target } = state.config;

  return (
    <div className="space-y-3 text-[13px]">
      {tick ? (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-text-secondary">
              <span className="font-medium text-text">t={tick.t}</span> · load {tick.load}
            </span>
            <span className={cn('text-[12px] font-medium', actionClass[tick.action])}>{actionLabel[tick.action]}</span>
            <span className="text-text-secondary">
              capacity {tick.serving}
              {tick.desired !== tick.serving && <span className={tick.desired > tick.serving ? 'text-success' : 'text-accent'}> → {tick.desired}</span>}
              <span className="text-text-muted"> (min {min} / max {max})</span>
            </span>
          </div>

          <div className="rounded-lg border border-border bg-bg-subtle p-3">
            <p className="mb-1 text-[11px] text-text-muted">Metric (dashed line = {target}% target)</p>
            <MetricBar tick={tick} target={target} />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-3">
            <svg
              viewBox={`0 0 ${Math.max(max, tick.desired) * (BOX + GAP) + 4} 44`}
              width={Math.max(max, tick.desired) * (BOX + GAP) + 4}
              height={44}
              className="min-w-full"
              role="group"
              aria-label={`${tick.serving} instances serving, ${tick.warming} warming up`}
            >
              <title>Instance capacity</title>
              <desc>{tick.serving} instances are serving traffic; {tick.warming} newly added instances are warming up.</desc>
              {Array.from({ length: Math.max(tick.serving, tick.desired) }).map((_, i) => {
                const warming = i >= tick.serving && i < tick.desired;
                const draining = i >= tick.desired && i < tick.serving;
                return (
                  <g key={i}>
                    <rect
                      x={2 + i * (BOX + GAP)}
                      y={8}
                      width={BOX}
                      height={BOX}
                      rx={5}
                      strokeWidth={1.5}
                      strokeDasharray={warming || draining ? '3 2' : undefined}
                      className={cn(warming ? 'fill-warning/15 stroke-warning' : draining ? 'fill-bg-muted stroke-text-muted' : 'fill-success/15 stroke-success')}
                    />
                    <text x={2 + i * (BOX + GAP) + BOX / 2} y={26} textAnchor="middle" className="fill-text-secondary text-[10px]">
                      {warming ? '…' : draining ? '×' : '✓'}
                    </text>
                  </g>
                );
              })}
            </svg>
            <p className="mt-1 text-[11px] text-text-muted">
              <span className="text-success">✓ serving</span> · <span className="text-warning">… warming up (1 tick)</span>
              {tick.serving > tick.desired && <> · <span className="text-text-muted">× draining</span></>}
            </p>
          </div>

          <p className="rounded-md border border-border bg-surface px-3 py-2 text-text-secondary">{tick.note}</p>
        </>
      ) : (
        <p className="text-text-muted">Step forward to run the scaling loop over the load timeline.</p>
      )}

      <p className="text-[12px] text-text-muted">
        Simplified: whole-instance capacity, one metric, a one-tick warm-up, and a short cooldown. Real policies use richer maths and timings.
      </p>
    </div>
  );
}
