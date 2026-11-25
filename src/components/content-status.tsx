import { Link } from 'react-router';
import { AlertTriangle, RotateCw } from 'lucide-react';
import type { ContentLoadError } from '../content/cloud-fundamentals/concept-loaders';

/** Placeholder shown while a concept's content downloads. It reserves
 *  vertical space so the layout does not jump when content arrives. */
export function ContentLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-3">
      <p className="text-[13px] text-text-muted">{label}</p>
      <div aria-hidden className="space-y-2">
        <div className="h-3 w-11/12 animate-pulse rounded bg-bg-muted motion-reduce:animate-none" />
        <div className="h-3 w-10/12 animate-pulse rounded bg-bg-muted motion-reduce:animate-none" />
        <div className="h-3 w-9/12 animate-pulse rounded bg-bg-muted motion-reduce:animate-none" />
        <div className="h-40 animate-pulse rounded-lg bg-bg-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}

const guidance: Record<ContentLoadError['kind'], string> = {
  'import-failed': 'This is usually a network problem. Check your connection, then reload to try again — your progress is kept.',
  'missing-module': 'This is a problem with the site, not your connection. Other concepts are unaffected.',
  'content-mismatch': 'This is a problem with the site, not your connection. Other concepts are unaffected.',
  'unknown-concept': 'Check the address, or return to the concept list.',
};

/** Shown when a concept's content fails to load. Deliberately distinct from
 *  the “Coming soon” state: a loading failure is not missing content.
 *
 *  The retry action reloads the page rather than re-importing in place:
 *  Chromium-based browsers cache a failed dynamic import for the life of the
 *  page, so an in-place retry fails again without even making a request. A
 *  reload keeps the same URL, and progress lives in IndexedDB. */
export function ContentLoadErrorPanel({
  error,
  backTo,
  backLabel,
}: {
  error: ContentLoadError;
  backTo: string;
  backLabel: string;
}) {
  return (
    <div role="alert" className="rounded-lg border border-error/60 bg-error/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-error" />
        <div className="min-w-0 space-y-2">
          <p className="text-[14px] font-medium text-text">{error.message}</p>
          <p className="text-[13px] text-text-secondary">{guidance[error.kind]}</p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-[13px]">
            {error.kind === 'import-failed' && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 font-medium text-accent-text hover:bg-accent-hover"
              >
                <RotateCw aria-hidden className="size-3.5" />
                Reload and try again
              </button>
            )}
            <Link to={backTo} className="font-medium text-accent hover:text-accent-hover">
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
