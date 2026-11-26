import { cn } from '../../../lib/utils';
import type { HealthState, Probe } from './health-check';

const CELL = 30;
const LEFT = 8;
const TOP = 26;

export function renderHealthState(state: HealthState) {
  const probes = state.probes;
  const width = LEFT + Math.max(probes.length, 12) * CELL + 8;
  const current = state.current;

  return (
    <div className="space-y-3 text-[13px]">
      {current && (
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-md border px-2 py-1 text-[12px] font-medium',
              current.inRotation ? 'border-success/60 text-success' : 'border-error/60 text-error',
            )}
          >
            Backend: {current.state === 'healthy' ? 'healthy' : 'unhealthy'} · {current.inRotation ? 'in rotation' : 'out of rotation (draining)'}
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-3">
        <svg viewBox={`0 0 ${width} 88`} width={width} height={88} className="min-w-full" role="group" aria-label="Health probe timeline">
          <title>Health probe timeline</title>
          <desc>Each cell is one probe: filled when it passed, hollow when it failed; the row below marks whether the backend was in rotation.</desc>
          <text x={LEFT} y={14} className="fill-text-muted text-[11px]">Probe result (top) and in-rotation (bottom)</text>
          {probes.map((probe: Probe, i) => {
            const x = LEFT + i * CELL;
            return (
              <g key={probe.n}>
                <rect
                  x={x}
                  y={TOP}
                  width={CELL - 6}
                  height={CELL - 6}
                  rx={4}
                  strokeWidth={1.5}
                  className={cn(probe.result === 'pass' ? 'fill-success/20 stroke-success' : 'fill-error/10 stroke-error')}
                />
                <text x={x + (CELL - 6) / 2} y={TOP + 16} textAnchor="middle" className={cn('text-[11px] font-medium', probe.result === 'pass' ? 'fill-success' : 'fill-error')}>
                  {probe.result === 'pass' ? '✓' : '✕'}
                </text>
                <rect
                  x={x}
                  y={TOP + CELL}
                  width={CELL - 6}
                  height={10}
                  rx={2}
                  className={probe.inRotation ? 'fill-accent' : 'fill-bg-muted'}
                />
                {probe.transition && (
                  <text x={x + (CELL - 6) / 2} y={TOP + CELL + 22} textAnchor="middle" className={cn('text-[10px] font-medium', probe.transition === 'removed' ? 'fill-error' : 'fill-success')}>
                    {probe.transition === 'removed' ? 'out' : 'in'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {probes.length === 0 ? (
        <p className="text-text-muted">Step forward to run probes against the backend.</p>
      ) : (
        <p className="rounded-md border border-border bg-surface px-3 py-2 text-text-secondary">
          <span className="font-medium text-text">
            Probe {probes[probes.length - 1]!.n} (t={probes[probes.length - 1]!.timeSeconds}s):{' '}
          </span>
          {probes[probes.length - 1]!.note}
        </p>
      )}

      <p className="text-[12px] text-text-muted">
        Detection lag ≈ unhealthy threshold × interval; recovery lag ≈ healthy threshold × interval. Illustrative timings only.
      </p>
    </div>
  );
}
