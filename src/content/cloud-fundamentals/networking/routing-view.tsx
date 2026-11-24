import { cn } from '../../../lib/utils';
import type { HopVerdict, RoutingState } from './routing-simulation';

const verdictText: Record<HopVerdict, string> = {
  pass: 'Forwarded',
  allowed: 'Allowed',
  denied: 'Denied',
  dropped: 'Dropped',
  delivered: 'Delivered',
};

const verdictClass: Record<HopVerdict, string> = {
  pass: 'text-text-secondary',
  allowed: 'text-success',
  delivered: 'text-success',
  denied: 'text-error',
  dropped: 'text-error',
};

export function renderRoutingState(state: RoutingState) {
  if (state.hops.length === 0) {
    return <p className="text-[13px] text-text-muted">The packet has not been sent yet. Step forward to trace it.</p>;
  }

  return (
    <div className="space-y-3 text-[13px]">
      <ol className="space-y-1.5">
        {state.hops.map((hop, i) => (
          <li key={`${hop.stage}-${i}`} className="rounded-md border border-border bg-surface px-3 py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-medium text-text">
                {i + 1}. {hop.label}
              </span>
              <span className={cn('text-[12px] font-medium', verdictClass[hop.verdict])}>{verdictText[hop.verdict]}</span>
            </div>
            <p className="mt-0.5 text-text-secondary">{hop.detail}</p>
          </li>
        ))}
      </ol>

      {state.lookup && (
        <div className="overflow-x-auto rounded-md border border-border p-2">
          <h4 className="mb-1 text-[12px] font-medium text-text">
            {state.lookup.table} — destination {state.lookup.destinationAddress}
          </h4>
          <table className="w-full border-collapse font-mono text-[12px]">
            <thead>
              <tr>
                <th className="border-b border-border px-2 py-1 text-left font-sans font-medium text-text">Destination</th>
                <th className="border-b border-border px-2 py-1 text-left font-sans font-medium text-text">Target</th>
                <th className="border-b border-border px-2 py-1 text-left font-sans font-medium text-text">Match</th>
              </tr>
            </thead>
            <tbody>
              {state.lookup.routes.map((route) => {
                const chosen =
                  state.lookup?.matched?.destination === route.destination && state.lookup.matched.target === route.target;
                return (
                  <tr key={`${route.destination}-${route.target}`} className={chosen ? 'bg-accent/10' : undefined}>
                    <td className="px-2 py-1 text-text">{route.destination}</td>
                    <td className="px-2 py-1 text-text">{route.target}</td>
                    <td className="px-2 py-1 font-sans text-text-secondary">{chosen ? 'Selected (longest prefix)' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!state.lookup.matched && <p className="mt-1 text-error">No matching route</p>}
        </div>
      )}

      {state.outcome && (
        <p
          className={cn(
            'rounded-md border px-3 py-2 font-medium text-text',
            state.outcome === 'delivered' ? 'border-success/50' : 'border-error/60 bg-error/5',
          )}
        >
          Outcome: {state.outcome === 'delivered' ? 'delivered' : state.outcome === 'denied' ? 'denied by a security rule' : 'dropped — no path'}
        </p>
      )}
    </div>
  );
}
