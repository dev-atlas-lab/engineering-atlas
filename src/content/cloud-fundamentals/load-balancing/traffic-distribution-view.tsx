import { cn } from '../../../lib/utils';
import { algorithmLabel, type BackendRuntime, type TrafficState } from './traffic-distribution';

const ROW = 46;
const TOP = 16;
const LB_X = 150;
const POOL_X = 320;
const BOX_W = 150;
const BAR_MAX = 120;

function BackendRow({ backend, y, maxCount, highlighted }: { backend: BackendRuntime; y: number; maxCount: number; highlighted: boolean }) {
  const barW = maxCount > 0 ? Math.round((backend.count / maxCount) * BAR_MAX) : 0;
  const stroke = !backend.healthy ? 'stroke-error' : highlighted ? 'stroke-accent' : 'stroke-border';
  return (
    <g>
      <rect x={POOL_X} y={y} width={BOX_W} height={32} rx={6} strokeWidth={highlighted ? 2 : 1} className={cn('fill-surface', stroke)} opacity={backend.healthy ? 1 : 0.6} />
      <text x={POOL_X + 10} y={y + 20} className="fill-text text-[12px] font-medium">
        {backend.label}
      </text>
      <text x={POOL_X + BOX_W - 10} y={y + 20} textAnchor="end" className={cn('text-[12px] font-medium', backend.healthy ? 'fill-text-secondary' : 'fill-error')}>
        {backend.healthy ? `${backend.count}` : 'down'}
      </text>
      {/* Count bar under the box. */}
      <rect x={POOL_X} y={y + 34} width={BAR_MAX} height={4} rx={2} className="fill-bg-muted" />
      {barW > 0 && <rect x={POOL_X} y={y + 34} width={barW} height={4} rx={2} className={backend.healthy ? 'fill-accent' : 'fill-error'} />}
    </g>
  );
}

export function renderTrafficState(state: TrafficState) {
  const n = state.backends.length;
  const height = TOP + n * ROW + 8;
  const maxCount = Math.max(1, ...state.backends.map((b) => b.count));
  const last = state.assigned[state.assigned.length - 1];
  const lbY = TOP + ((n - 1) * ROW) / 2;
  const totalHealthy = state.backends.filter((b) => b.healthy).length;

  return (
    <div className="space-y-3 text-[13px]">
      <div className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-3">
        <svg viewBox={`0 0 490 ${height}`} width={490} height={height} className="min-w-full" role="group" aria-label="Load balancer traffic distribution">
          <title>Load balancer distributing requests across a backend pool</title>
          <desc>A client sends requests through a load balancer to {totalHealthy} healthy backends; each backend shows its request count.</desc>

          {/* Client + load balancer. */}
          <rect x={0} y={lbY} width={96} height={32} rx={6} className="fill-surface stroke-border" />
          <text x={48} y={lbY + 20} textAnchor="middle" className="fill-text text-[12px] font-medium">Client</text>
          <rect x={LB_X} y={lbY} width={120} height={32} rx={6} className="fill-surface stroke-border" strokeWidth={1} />
          <text x={LB_X + 60} y={lbY + 20} textAnchor="middle" className="fill-text text-[12px] font-medium">Load balancer</text>
          <line x1={96} y1={lbY + 16} x2={LB_X} y2={lbY + 16} className="stroke-text-muted" strokeWidth={1.5} />
          <polygon points={`${LB_X},${lbY + 16} ${LB_X - 7},${lbY + 12} ${LB_X - 7},${lbY + 20}`} className="fill-text-muted" />

          {state.backends.map((b, i) => {
            const y = TOP + i * ROW;
            const highlighted = last?.backendId === b.id;
            const midY = y + 16;
            return (
              <g key={b.id}>
                <line
                  x1={LB_X + 120}
                  y1={lbY + 16}
                  x2={POOL_X}
                  y2={midY}
                  strokeWidth={highlighted ? 2 : 1}
                  strokeDasharray={b.healthy ? undefined : '4 3'}
                  className={cn(highlighted ? 'stroke-accent atlas-flow' : b.healthy ? 'stroke-text-muted' : 'stroke-error')}
                />
                <BackendRow backend={b} y={y} maxCount={maxCount} highlighted={highlighted} />
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-text-secondary">
        <span className="font-medium text-text">Algorithm:</span> {algorithmLabel[state.config.algorithm]} · {totalHealthy} of {state.backends.length} backends healthy
      </p>

      {last ? (
        <p className="rounded-md border border-border bg-surface px-3 py-2 text-text-secondary">
          <span className="font-medium text-text">Request {last.n} ({last.clientIp}): </span>
          {last.reason}
        </p>
      ) : (
        <p className="text-text-muted">Step forward to send requests and watch them distribute.</p>
      )}

      <p className="text-[12px] text-text-muted">Simplified: whole requests are assigned one at a time; real connection lifetimes and in-flight load are not modelled.</p>
    </div>
  );
}
