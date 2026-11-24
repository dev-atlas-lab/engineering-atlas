import { cn } from '../../../lib/utils';
import type { Zone, ZoneFailureState, ZoneResource } from './simulations';

const statusText: Record<ZoneResource['status'], string> = {
  healthy: 'Healthy',
  failed: 'Failed',
  serving: 'Serving',
  'out-of-rotation': 'Out of rotation',
};

function ResourceRow({ resource }: { resource: ZoneResource }) {
  const down = resource.status === 'failed' || resource.status === 'out-of-rotation';
  return (
    <li className="rounded-md border border-border bg-surface px-2 py-1.5 text-[12px]">
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <span className="font-medium text-text">{resource.label}</span>
        <span className={down ? 'text-error' : 'text-success'}>{statusText[resource.status]}</span>
      </div>
      {resource.note && <p className="mt-0.5 text-text-muted">{resource.note}</p>}
    </li>
  );
}

export function renderZoneFailureState(state: ZoneFailureState) {
  if (state.resources.length === 0) {
    return <p className="text-[13px] text-text-muted">Nothing deployed yet. Step forward to deploy.</p>;
  }

  const zones: Zone[] = [1, 2, 3];
  const zoneRedundant = state.resources.filter((r) => r.zone === null);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {zones.map((zone) => {
          const failed = state.failedZone === zone;
          const inZone = state.resources.filter((r) => r.zone === zone);
          return (
            <section
              key={zone}
              aria-label={`Zone ${zone}${failed ? ' (failed)' : ''}`}
              className={cn('rounded-md border p-2', failed ? 'border-error/60 bg-error/5' : 'border-border')}
            >
              <h4 className="mb-1.5 text-[12px] font-medium text-text">
                Zone {zone}
                {failed && <span className="ml-1 text-error">— offline</span>}
              </h4>
              {inZone.length === 0 ? (
                <p className="text-[12px] text-text-muted">No resources</p>
              ) : (
                <ul className="space-y-1.5">
                  {inZone.map((r) => (
                    <ResourceRow key={r.id} resource={r} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {zoneRedundant.length > 0 && (
        <section aria-label="Zone-redundant resources" className="rounded-md border border-border p-2">
          <h4 className="mb-1.5 text-[12px] font-medium text-text">Spans all zones</h4>
          <ul className="space-y-1.5">
            {zoneRedundant.map((r) => (
              <ResourceRow key={r.id} resource={r} />
            ))}
          </ul>
        </section>
      )}

      {state.verdict && (
        <p
          className={cn(
            'rounded-md border px-3 py-2 text-[13px] font-medium',
            state.verdict.available ? 'border-success/50 text-text' : 'border-error/60 text-text',
          )}
        >
          {state.verdict.available ? 'Service available. ' : 'Service unavailable. '}
          <span className="font-normal text-text-secondary">{state.verdict.summary}</span>
        </p>
      )}
    </div>
  );
}
