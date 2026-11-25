import { cn } from '../../../lib/utils';
import type { ArtifactId, ArtifactStatus, EnvelopeState } from './envelope-encryption';

const order: ArtifactId[] = ['plaintext', 'dek', 'wrappedDek', 'ciphertext', 'kek'];
const kind: Record<ArtifactId, string> = {
  plaintext: 'Plaintext',
  dek: 'Data encryption key (DEK)',
  wrappedDek: 'Wrapped DEK',
  ciphertext: 'Ciphertext',
  kek: 'Key encryption key (KEK)',
};

const statusText: Record<ArtifactStatus, string> = {
  absent: 'Not created',
  'in-memory': 'In memory',
  stored: 'Stored',
  erased: 'Erased',
  'in-kms': 'Inside the key service',
  unusable: 'Unusable',
};

const statusClass: Record<ArtifactStatus, string> = {
  absent: 'text-text-muted',
  'in-memory': 'text-warning',
  stored: 'text-text-secondary',
  erased: 'text-text-muted',
  'in-kms': 'text-success',
  unusable: 'text-error',
};

export function renderEnvelopeState(state: EnvelopeState) {
  return (
    <div className="space-y-4 text-[13px]">
      <ul className="grid gap-2 sm:grid-cols-2" aria-label="Keys and data">
        {order.map((id) => {
          const a = state.artifacts[id];
          return (
            <li key={id} className={cn('rounded-md border border-border bg-surface p-2', a.status === 'absent' && 'opacity-60')}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="font-medium text-text">{kind[id]}</span>
                <span className={cn('text-[12px] font-medium', statusClass[a.status])}>{statusText[a.status]}</span>
              </div>
              <p className="text-text-secondary">{a.label}</p>
              <p className="text-[12px] text-text-muted">Where: {a.location}</p>
            </li>
          );
        })}
      </ul>

      {state.events.length === 0 ? (
        <p className="text-text-muted">Step forward to run the {state.config.operation === 'encrypt' ? 'encryption' : 'decryption'} flow.</p>
      ) : (
        <ol className="space-y-1.5">
          {state.events.map((event, i) => (
            <li key={`${event.title}-${i}`} className="rounded-md border border-border bg-surface px-3 py-2">
              <span className={cn('font-medium', event.result === 'fail' ? 'text-error' : 'text-text')}>
                {i + 1}. {event.title}
              </span>
              <p className="mt-0.5 text-text-secondary">{event.detail}</p>
            </li>
          ))}
        </ol>
      )}

      {state.outcome && (
        <p className={cn('rounded-md border px-3 py-2 text-text', state.outcome === 'failed' ? 'border-error/60 bg-error/5' : 'border-success/50')}>
          <span className="font-medium">
            {state.outcome === 'encrypted' ? 'Record encrypted and stored.' : state.outcome === 'decrypted' ? 'Record decrypted.' : 'Operation failed.'}
          </span>{' '}
          {state.attackerCanRead === false && 'The attacker’s copy of the storage is unreadable without permission to use the KEK.'}
        </p>
      )}

      <p className="text-[12px] text-text-muted">
        Conceptual model: keys and ciphertext are labels, not real cryptographic material.
      </p>
    </div>
  );
}
