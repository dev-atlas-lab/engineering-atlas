import { cn } from '../../../lib/utils';
import type { EdgeOutcome, EdgeState, LayerVerdict } from './edge-protection';

const verdictText: Record<LayerVerdict, string> = {
  pass: 'Forwarded',
  blocked: 'Blocked',
  logged: 'Logged, forwarded',
  'not-applicable': 'Not applied',
  served: 'Served',
  overloaded: 'Overloaded',
  violation: 'Access violation',
};

const verdictClass: Record<LayerVerdict, string> = {
  pass: 'text-text-secondary',
  blocked: 'text-success',
  logged: 'text-warning',
  'not-applicable': 'text-text-muted',
  served: 'text-text-secondary',
  overloaded: 'text-error',
  violation: 'text-error',
};

const outcomeText: Record<EdgeOutcome, string> = {
  served: 'Request served.',
  blocked: 'Stopped before it could do harm.',
  'logged-and-served': 'Detected and logged, but served.',
  degraded: 'The application is degraded for everyone.',
  'access-violation': 'Data was exposed to an unauthorized user.',
};

export function renderEdgeState(state: EdgeState) {
  const bad = state.outcome === 'degraded' || state.outcome === 'access-violation';
  return (
    <div className="space-y-3 text-[13px]">
      <p className="rounded-md border border-border bg-surface px-3 py-2 text-text-secondary">
        <span className="font-medium text-text">Traffic: </span>
        {state.request}
      </p>
      {state.layers.length === 0 ? (
        <p className="text-text-muted">Step forward to send the traffic through each layer.</p>
      ) : (
        <ol className="space-y-1.5">
          {state.layers.map((layer, i) => (
            <li key={`${layer.layer}-${i}`} className="rounded-md border border-border bg-surface px-3 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-medium text-text">
                  {i + 1}. {layer.title}
                </span>
                <span className={cn('text-[12px] font-medium', verdictClass[layer.verdict])}>{verdictText[layer.verdict]}</span>
              </div>
              <p className="mt-0.5 text-text-secondary">{layer.detail}</p>
            </li>
          ))}
        </ol>
      )}
      {state.outcome && (
        <p className={cn('rounded-md border px-3 py-2 text-text', bad ? 'border-error/60 bg-error/5' : 'border-success/50')}>
          <span className="font-medium">{outcomeText[state.outcome]}</span> {state.summary}
        </p>
      )}
      <p className="text-[12px] text-text-muted">
        Conceptual model: traffic is described, not generated, and outcomes illustrate each layer’s role. It is not a
        security testing tool.
      </p>
    </div>
  );
}
