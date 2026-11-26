import { cn } from '../../../lib/utils';
import { LOGS, ROOT_SERVICE, TARGET_CORRELATION, type Level, type LogEntry, type LogState } from './log-investigation';

const levelClass: Record<Level, string> = {
  INFO: 'text-text-muted',
  WARN: 'text-warning',
  ERROR: 'text-error',
};

const filterLabel: Record<LogState['filter'], string> = {
  all: 'all logs in the window',
  errors: 'level = ERROR',
  correlation: `correlationId = ${TARGET_CORRELATION}`,
  root: `correlationId = ${TARGET_CORRELATION} (root highlighted)`,
};

function isRoot(entry: LogEntry): boolean {
  return entry.service === ROOT_SERVICE && entry.level === 'ERROR' && entry.correlationId === TARGET_CORRELATION;
}

export function renderLogState(state: LogState) {
  return (
    <div className="space-y-3 text-[13px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-border px-2 py-1 font-mono text-[12px] text-text-secondary">filter: {filterLabel[state.filter]}</span>
        <span className="text-[12px] text-text-muted">
          {state.visible.length} of {LOGS.length} entries
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-left font-mono text-[12px]">
          <thead>
            <tr className="bg-bg-subtle">
              <th className="px-2 py-1 font-sans font-medium text-text">t</th>
              <th className="px-2 py-1 font-sans font-medium text-text">service</th>
              <th className="px-2 py-1 font-sans font-medium text-text">level</th>
              <th className="px-2 py-1 font-sans font-medium text-text">correlationId</th>
              <th className="px-2 py-1 font-sans font-medium text-text">message</th>
            </tr>
          </thead>
          <tbody>
            {state.visible.map((e, i) => {
              const root = state.highlightRoot && isRoot(e);
              const correlated = state.highlightCorrelation === e.correlationId;
              return (
                <tr
                  key={`${e.t}-${e.service}-${i}`}
                  className={cn('border-t border-border-subtle', root ? 'bg-error/10' : correlated ? 'bg-accent/5' : undefined)}
                >
                  <td className="px-2 py-1 text-text-muted">{e.t}s</td>
                  <td className="px-2 py-1 text-text">{e.service}</td>
                  <td className={cn('px-2 py-1 font-medium', levelClass[e.level])}>{e.level}</td>
                  <td className={cn('px-2 py-1', correlated ? 'font-medium text-accent' : 'text-text-muted')}>{e.correlationId}</td>
                  <td className="px-2 py-1 text-text-secondary">
                    {e.message}
                    {root && <span className="ml-1 font-sans font-medium text-error">← first failure</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="rounded-md border border-border bg-surface px-3 py-2 text-text-secondary">{state.note}</p>

      {state.diagnosisCorrect !== null && (
        <p className={cn('rounded-md border px-3 py-2 text-text', state.diagnosisCorrect ? 'border-success/60 bg-success/5' : 'border-error/60 bg-error/5')}>
          <span className="font-medium">{state.diagnosisCorrect ? 'Correct. ' : 'Not quite. '}</span>
          The root cause is the <span className="font-mono">{ROOT_SERVICE}</span> service timing out on its downstream dependency; the order failure and the 502 are symptoms.
          {!state.diagnosisCorrect && ` You chose ${state.diagnosis} — trace back to the earliest error in the correlated chain.`}
        </p>
      )}

      <p className="text-[12px] text-text-muted">Fixed, illustrative log data. A real log store holds far more; the technique — narrow, filter, pivot on a correlation ID — is the same.</p>
    </div>
  );
}
