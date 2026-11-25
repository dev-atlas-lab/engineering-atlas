import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useConceptContent } from './use-concept-content';
import { ContentLoadError, type ConceptContentLoader, type LoadedConcept } from '../content/cloud-fundamentals/concept-loaders';

function concept(id: string): LoadedConcept {
  return { conceptId: id, lessons: [], labs: [], simulations: {} };
}

/** A loader whose loads resolve only when the test says so. */
function controllableLoader() {
  const resolved = new Map<string, LoadedConcept>();
  const pending = new Map<string, { resolve: (c: LoadedConcept) => void; reject: (e: unknown) => void }>();
  const calls: string[] = []; // every load request, in order
  const loader: ConceptContentLoader = {
    load(id) {
      calls.push(id);
      const done = resolved.get(id);
      if (done) return Promise.resolve(done);
      return new Promise((resolve, reject) => {
        pending.set(id, {
          resolve: (c) => {
            resolved.set(id, c);
            resolve(c);
          },
          reject,
        });
      });
    },
    peek: (id) => resolved.get(id),
  };
  return { loader, pending, calls };
}

describe('useConceptContent', () => {
  it('reports loading, then ready with the loaded content', async () => {
    const { loader, pending } = controllableLoader();
    const { result } = renderHook(() => useConceptContent('alpha', loader));
    expect(result.current.status).toBe('loading');
    await act(async () => pending.get('alpha')!.resolve(concept('alpha')));
    expect(result.current).toMatchObject({ status: 'ready', concept: { conceptId: 'alpha' } });
  });

  it('is idle and loads nothing when there is no concept id', () => {
    const { loader, calls } = controllableLoader();
    const { result } = renderHook(() => useConceptContent(undefined, loader));
    expect(result.current.status).toBe('idle');
    expect(calls).toEqual([]);
  });

  it('returns already-loaded content synchronously, with no loading state', async () => {
    const { loader, pending } = controllableLoader();
    void loader.load('alpha');
    pending.get('alpha')!.resolve(concept('alpha'));
    await Promise.resolve();
    const { result } = renderHook(() => useConceptContent('alpha', loader));
    expect(result.current.status).toBe('ready');
  });

  it('never lets a slow earlier concept overwrite the concept now being viewed', async () => {
    const { loader, pending } = controllableLoader();
    const { result, rerender } = renderHook(({ id }) => useConceptContent(id, loader), { initialProps: { id: 'alpha' } });
    rerender({ id: 'beta' });
    await act(async () => pending.get('beta')!.resolve(concept('beta')));
    expect(result.current).toMatchObject({ status: 'ready', concept: { conceptId: 'beta' } });

    // alpha's import finishes late — it must not replace beta.
    await act(async () => pending.get('alpha')!.resolve(concept('alpha')));
    expect(result.current).toMatchObject({ status: 'ready', concept: { conceptId: 'beta' } });
  });

  it('shows loading (not the previous concept) immediately after switching concepts', async () => {
    const { loader, pending } = controllableLoader();
    const { result, rerender } = renderHook(({ id }) => useConceptContent(id, loader), { initialProps: { id: 'alpha' } });
    await act(async () => pending.get('alpha')!.resolve(concept('alpha')));
    rerender({ id: 'beta' });
    expect(result.current.status).toBe('loading');
  });

  it('reports a load failure as an error, keeping its kind', async () => {
    const { loader, pending } = controllableLoader();
    const { result } = renderHook(() => useConceptContent('alpha', loader));
    await act(async () => pending.get('alpha')!.reject(new ContentLoadError('import-failed', 'alpha', 'Could not download.')));
    expect(result.current).toMatchObject({ status: 'error', error: { kind: 'import-failed' } });
  });

  it('a failure in one concept does not leak into the next concept viewed', async () => {
    const { loader, pending } = controllableLoader();
    const { result, rerender } = renderHook(({ id }) => useConceptContent(id, loader), { initialProps: { id: 'alpha' } });
    await act(async () => pending.get('alpha')!.reject(new Error('boom')));
    expect(result.current.status).toBe('error');
    rerender({ id: 'beta' });
    expect(result.current.status).toBe('loading');
    await act(async () => pending.get('beta')!.resolve(concept('beta')));
    expect(result.current).toMatchObject({ status: 'ready', concept: { conceptId: 'beta' } });
  });

  it('wraps an unexpected (non-ContentLoadError) failure in a ContentLoadError', async () => {
    const { loader, pending } = controllableLoader();
    const { result } = renderHook(() => useConceptContent('alpha', loader));
    await act(async () => pending.get('alpha')!.reject(new Error('boom')));
    expect(result.current.status).toBe('error');
    expect(result.current.status === 'error' && result.current.error).toBeInstanceOf(ContentLoadError);
  });
});
