import { cn } from '../../../lib/utils';
import type { FailoverState, RegionRuntime } from './regional-failover';

const ROW = 56;
const TOP = 12;
const ROUTER_X = 10;
const REGION_X = 250;
const REGION_W = 170;

function RegionBox({ region, y, active }: { region: RegionRuntime; y: number; active: boolean }) {
  const stroke = !region.healthy ? 'stroke-error' : active ? 'stroke-accent' : 'stroke-success';
  return (
    <g opacity={region.healthy ? 1 : 0.7}>
      <rect x={REGION_X} y={y} width={REGION_W} height={40} rx={7} strokeWidth={active ? 2 : 1.5} className={cn('fill-surface', stroke)} />
      <text x={REGION_X + 12} y={y + 18} className="fill-text text-[12px] font-medium">{region.label}</text>
      <text x={REGION_X + 12} y={y + 33} className={cn('text-[11px]', region.healthy ? 'fill-text-muted' : 'fill-error')}>
        {region.healthy ? `healthy · capacity ${region.capacity}%` : 'failed — out of service'}
      </text>
    </g>
  );
}

export function renderFailoverState(state: FailoverState) {
  const regions = state.regions;
  const height = TOP + regions.length * ROW + 4;
  const routerY = TOP + ((regions.length - 1) * ROW) / 2;
  const activeRegions = new Set(state.clients.filter((c) => c.status === 'ok' && c.region).map((c) => c.region));

  return (
    <div className="space-y-3 text-[13px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-border px-2 py-1 text-[12px] text-text-secondary">
          Routing: {state.config.routingType === 'dns' ? 'DNS-based' : 'anycast proxy'} · {state.phase}
        </span>
        <span
          className={cn(
            'rounded-md border px-2 py-1 text-[12px] font-medium',
            state.healthyCapacityPct === 100 ? 'border-success/60 text-success' : 'border-warning/60 text-warning',
          )}
        >
          Healthy capacity: {state.healthyCapacityPct}%
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-3">
        <svg viewBox={`0 0 ${REGION_X + REGION_W + 10} ${height}`} width={REGION_X + REGION_W + 10} height={height} className="min-w-full" role="group" aria-label="Global routing and regional health">
          <title>Global routing layer directing clients to regional endpoints</title>
          <desc>A global routing layer sends clients to one of three regions; failed regions are marked, and active routes are highlighted.</desc>
          <rect x={ROUTER_X} y={routerY} width={120} height={40} rx={7} className="fill-surface stroke-border" />
          <text x={ROUTER_X + 60} y={routerY + 18} textAnchor="middle" className="fill-text text-[12px] font-medium">Global routing</text>
          <text x={ROUTER_X + 60} y={routerY + 33} textAnchor="middle" className="fill-text-muted text-[10px]">{state.config.routingType === 'dns' ? 'DNS answers' : 'anycast edge'}</text>
          {regions.map((region, i) => {
            const y = TOP + i * ROW;
            const active = activeRegions.has(region.id);
            return (
              <g key={region.id}>
                <line
                  x1={ROUTER_X + 120}
                  y1={routerY + 20}
                  x2={REGION_X}
                  y2={y + 20}
                  strokeWidth={active ? 2 : 1}
                  strokeDasharray={region.healthy ? undefined : '4 3'}
                  className={cn(active ? 'stroke-accent atlas-flow' : region.healthy ? 'stroke-text-muted' : 'stroke-error')}
                />
                <RegionBox region={region} y={y} active={active} />
              </g>
            );
          })}
        </svg>
      </div>

      {state.clients.length > 0 ? (
        <ul className="space-y-1">
          {state.clients.map((c) => (
            <li key={c.id} className="flex flex-wrap items-baseline gap-x-2 rounded-md border border-border bg-surface px-3 py-1.5">
              <span className="font-medium text-text">{c.label}</span>
              <span className={cn('text-[12px] font-medium', c.status === 'ok' ? 'text-success' : c.status === 'error' ? 'text-error' : 'text-text-muted')}>
                {c.status === 'ok' ? '→ served' : c.status === 'error' ? '✕ failing' : 'pending'}
              </span>
              <span className="w-full text-[12px] text-text-secondary">{c.reason}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted">Step forward to route clients and then fail a region.</p>
      )}

      {state.note && <p className="rounded-md border border-border bg-bg-subtle px-3 py-2 text-[12px] text-text-secondary">{state.note}</p>}
      <p className="text-[12px] text-text-muted">Simplified: fixed regions and clients, one TTL window, illustrative latencies. Real DNS caching and health detection vary.</p>
    </div>
  );
}
