import { cn } from '../../../lib/utils';
import type { DataCopy, ReplicationOutcome, ReplicationState } from './simulations';

const copyStatusText: Record<DataCopy['status'], string> = {
  intact: 'Intact',
  rebuilding: 'Failed — rebuilding',
  unreachable: 'Unreachable',
};

const outcomeText = {
  dataSurvives: {
    yes: 'Yes — at least one copy is intact',
    'only-if-the-outage-is-temporary': 'Only if the outage is temporary — no copy exists outside the failed location',
  },
  readsNow: {
    yes: 'Yes',
    'stale-reads-from-secondary': 'Yes, from the secondary — may be missing recent writes',
    no: 'No',
  },
  writesNow: { yes: 'Yes', 'after-failover': 'Only after failover to the secondary', no: 'No' },
  recoveryPoint: {
    'no-acknowledged-writes-lost': 'No acknowledged writes lost',
    'writes-within-replication-lag': 'Writes within the replication lag may be lost',
    'everything-if-permanent': 'Everything, if the outage is permanent',
  },
} satisfies { [K in keyof ReplicationOutcome]: Record<ReplicationOutcome[K], string> };

function CopyChip({ copy }: { copy: DataCopy }) {
  const bad = copy.status !== 'intact';
  return (
    <li
      className={cn(
        'rounded-md border px-2 py-1 text-[12px]',
        bad ? 'border-error/60 bg-error/5' : 'border-border bg-surface',
      )}
    >
      <span className="font-medium text-text">{copy.id}</span>{' '}
      <span className="text-text-muted">· Zone {copy.zone} · {copy.replication}</span>
      <span className={cn('block', bad ? 'text-error' : 'text-success')}>{copyStatusText[copy.status]}</span>
    </li>
  );
}

function RegionColumn({ title, copies }: { title: string; copies: DataCopy[] }) {
  return (
    <section aria-label={title} className="rounded-md border border-border p-2">
      <h4 className="mb-1.5 text-[12px] font-medium text-text">{title}</h4>
      {copies.length === 0 ? (
        <p className="text-[12px] text-text-muted">No copies</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-3">
          {copies.map((copy) => (
            <CopyChip key={copy.id} copy={copy} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function renderReplicationState(state: ReplicationState) {
  if (state.copies.length === 0) {
    return <p className="text-[13px] text-text-muted">No data stored yet. Step forward to place copies.</p>;
  }

  return (
    <div className="space-y-3">
      <RegionColumn title="Primary region" copies={state.copies.filter((c) => c.region === 'primary')} />
      <RegionColumn title="Secondary region" copies={state.copies.filter((c) => c.region === 'secondary')} />

      {state.outcome && (
        <dl className="grid gap-x-4 gap-y-1.5 rounded-md border border-border p-3 text-[13px] sm:grid-cols-[auto_1fr]">
          <dt className="text-text-muted">Data survives</dt>
          <dd className="font-medium text-text">{outcomeText.dataSurvives[state.outcome.dataSurvives]}</dd>
          <dt className="text-text-muted">Reads right now</dt>
          <dd className="font-medium text-text">{outcomeText.readsNow[state.outcome.readsNow]}</dd>
          <dt className="text-text-muted">Writes right now</dt>
          <dd className="font-medium text-text">{outcomeText.writesNow[state.outcome.writesNow]}</dd>
          <dt className="text-text-muted">Data at risk</dt>
          <dd className="font-medium text-text">{outcomeText.recoveryPoint[state.outcome.recoveryPoint]}</dd>
        </dl>
      )}
    </div>
  );
}
