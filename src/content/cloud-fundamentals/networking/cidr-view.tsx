import type { ReactNode } from 'react';
import type { CidrLabState } from './cidr-simulation';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words font-mono text-text">{children}</dd>
    </>
  );
}

export function renderCidrState(state: CidrLabState) {
  if (state.stage === 0) {
    return <p className="text-[13px] text-text-muted">Step forward to start the calculation.</p>;
  }
  if (state.error || !state.analysis) {
    return (
      <p role="alert" className="rounded-md border border-error/60 bg-error/5 px-3 py-2 text-[13px] text-text">
        Invalid input: {state.error}
      </p>
    );
  }

  const a = state.analysis;
  return (
    <div className="space-y-3 text-[13px]">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <Row label="Block">{a.normalized}</Row>
        {state.stage >= 2 && (
          <>
            <Row label="Address (binary)">{a.addressBinary}</Row>
            <Row label="Mask (binary)">{a.maskBinary}</Row>
            <Row label="Mask">{a.mask}</Row>
            <Row label="Network address">{a.network}</Row>
          </>
        )}
        {state.stage >= 3 && (
          <>
            <Row label="Last address">{a.last}</Row>
            <Row label="Total addresses">{a.totalAddresses.toLocaleString('en-US')}</Row>
            <Row label="Usable (conventional)">{a.conventionalUsable.toLocaleString('en-US')}</Row>
            <Row label="Usable (Azure/AWS subnet)">
              {a.cloudUsable === null
                ? 'Too small for a cloud subnet'
                : `${a.cloudUsable.toLocaleString('en-US')}  (${a.cloudFirstUsable} – ${a.cloudLastUsable})`}
            </Row>
            <Row label="Address space">{a.range}</Row>
            <Row label="Valid subnet size">
              {`Azure: ${a.fitsAzureSubnet ? 'yes' : 'no (smallest is /29)'} · AWS: ${a.fitsAwsSubnet ? 'yes' : 'no (/16 to /28)'}`}
            </Row>
          </>
        )}
      </dl>

      {state.stage >= 4 && state.split && (
        <div className="rounded-md border border-border p-2">
          <h4 className="mb-1 text-[12px] font-medium text-text">Subnets of /{state.split.newPrefix}</h4>
          {state.split.error ? (
            <p className="text-error">{state.split.error}</p>
          ) : (
            <>
              <p className="text-text-secondary">{state.split.count.toLocaleString('en-US')} subnets</p>
              <ul className="mt-1 grid gap-1 font-mono text-[12px] text-text sm:grid-cols-2">
                {state.split.subnets.map((subnet) => (
                  <li key={subnet}>{subnet}</li>
                ))}
              </ul>
              {state.split.count > state.split.subnets.length && (
                <p className="mt-1 text-[12px] text-text-muted">…and {(state.split.count - state.split.subnets.length).toLocaleString('en-US')} more</p>
              )}
            </>
          )}
        </div>
      )}

      {state.stage >= 5 && state.overlap && (
        <p
          className={`rounded-md border px-3 py-2 ${
            state.overlap.error || state.overlap.overlaps ? 'border-error/60 bg-error/5' : 'border-success/50'
          } text-text`}
        >
          {state.overlap.error
            ? `Comparison block invalid: ${state.overlap.error}`
            : state.overlap.overlaps
              ? `Overlaps with ${state.overlap.compare}`
              : `No overlap with ${state.overlap.compare}`}
        </p>
      )}
    </div>
  );
}
