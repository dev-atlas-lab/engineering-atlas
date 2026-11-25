import { useEffect, useState } from 'react';
import {
  ContentLoadError,
  conceptContentLoader,
  type ConceptContentLoader,
  type LoadedConcept,
} from '../content/cloud-fundamentals/concept-loaders';

export type ConceptContentState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; concept: LoadedConcept }
  | { status: 'error'; error: ContentLoadError };

type Settled = { conceptId: string; result: { ok: true; concept: LoadedConcept } | { ok: false; error: ContentLoadError } };

function toContentLoadError(conceptId: string, error: unknown): ContentLoadError {
  return error instanceof ContentLoadError
    ? error
    : new ContentLoadError('import-failed', conceptId, 'The content could not be loaded.', { cause: error });
}

/**
 * Loads a concept's lazily loaded content.
 *
 * - Content already in the loader's cache is returned synchronously, so
 *   moving between lessons of one concept never shows a loading state.
 * - Every settled result records which concept it belongs to, and is only
 *   used while that concept is still the one requested — a slow import for
 *   a previous route can never replace the current concept's content.
 *
 * There is deliberately no in-place retry: Chromium-based browsers cache a
 * failed dynamic import for the life of the page, so importing the same
 * chunk again fails without a new request. Recovery is a page reload (see
 * ContentLoadErrorPanel).
 */
export function useConceptContent(
  conceptId: string | undefined,
  loader: ConceptContentLoader = conceptContentLoader,
): ConceptContentState {
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    if (!conceptId || loader.peek(conceptId)) return;
    let active = true;
    loader.load(conceptId).then(
      (concept) => {
        if (active) setSettled({ conceptId, result: { ok: true, concept } });
      },
      (error: unknown) => {
        if (active) setSettled({ conceptId, result: { ok: false, error: toContentLoadError(conceptId, error) } });
      },
    );
    return () => {
      active = false;
    };
  }, [conceptId, loader]);

  if (!conceptId) return { status: 'idle' };
  const cached = loader.peek(conceptId);
  if (cached) return { status: 'ready', concept: cached };
  if (settled?.conceptId === conceptId) {
    return settled.result.ok
      ? { status: 'ready', concept: settled.result.concept }
      : { status: 'error', error: settled.result.error };
  }
  return { status: 'loading' };
}
