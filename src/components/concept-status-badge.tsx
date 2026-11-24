import { cn } from '../lib/utils';
import { conceptStatusLabel, normalizeConceptStatus } from '../content/status';
import type { ConceptStatus } from '../content/types';

// Colour sits on the dot and border only; the label text keeps the regular
// text tokens so contrast holds in both themes, and the word itself carries
// the meaning (never colour alone).
const style: Record<ConceptStatus, { badge: string; dot: string }> = {
  available: { badge: 'border-success/50 bg-success/10 font-medium text-text', dot: 'bg-success' },
  'in-development': { badge: 'border-warning/50 bg-warning/10 text-text', dot: 'bg-warning' },
  'coming-soon': { badge: 'border-border bg-bg-subtle text-text-secondary', dot: 'bg-text-muted' },
};

export function ConceptStatusBadge({ status, className }: { status: unknown; className?: string }) {
  const normalized = normalizeConceptStatus(status);
  return (
    <span
      data-status={normalized}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] leading-4',
        style[normalized].badge,
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', style[normalized].dot)} />
      {conceptStatusLabel[normalized]}
    </span>
  );
}
