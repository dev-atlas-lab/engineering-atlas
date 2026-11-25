import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory stand-in for IndexedDB, with a controllable read so tests can
// interleave writes with a load that has not resolved yet.
const db = new Map<string, unknown>();
let releaseRead: (() => void) | null = null;
let holdReads = false;

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => {
    if (holdReads) await new Promise<void>((resolve) => (releaseRead = resolve));
    return structuredClone(db.get(key));
  }),
  set: vi.fn(async (key: string, value: unknown) => {
    db.set(key, structuredClone(value));
  }),
}));

const { useProgressStore } = await import('./progress-store');

const STORAGE_KEY = 'engineering-atlas-progress';

function resetStore() {
  useProgressStore.setState({ loaded: false, completedLessons: {}, knowledgeCheckResults: {}, labs: {} });
}

beforeEach(() => {
  db.clear();
  holdReads = false;
  releaseRead = null;
  resetStore();
});

describe('progressStore persistence', () => {
  it('persists a completed lesson so a later load (a page reload) restores it', async () => {
    await useProgressStore.getState().load();
    useProgressStore.getState().markLessonComplete('vm-architecture');
    await vi.waitFor(() => expect(db.has(STORAGE_KEY)).toBe(true));

    resetStore(); // simulate a fresh page load: empty in-memory state
    await useProgressStore.getState().load();
    expect(useProgressStore.getState().completedLessons).toEqual({ 'vm-architecture': true });
    expect(useProgressStore.getState().loaded).toBe(true);
  });

  it('keeps writes made before the IndexedDB load resolves (deep-link race)', async () => {
    db.set(STORAGE_KEY, {
      completedLessons: { 'older-lesson': true },
      knowledgeCheckResults: { 'older-lesson': { q1: false } },
      labs: {},
    });
    holdReads = true;
    const loading = useProgressStore.getState().load();

    // The lesson page marks itself complete before the stored snapshot arrives.
    useProgressStore.getState().markLessonComplete('how-dns-resolution-works');
    useProgressStore.getState().recordKnowledgeCheckAnswer('older-lesson', 'q1', true);

    // Those early writes must not have overwritten the stored snapshot.
    expect(db.get(STORAGE_KEY)).toMatchObject({ completedLessons: { 'older-lesson': true } });

    releaseRead!();
    await loading;
    const state = useProgressStore.getState();
    expect(state.completedLessons).toEqual({ 'older-lesson': true, 'how-dns-resolution-works': true });
    // The newer in-memory answer wins over the older stored one.
    expect(state.knowledgeCheckResults['older-lesson']).toEqual({ q1: true });

    // And the merged result — not just this session's writes — is what gets saved.
    await vi.waitFor(() =>
      expect(db.get(STORAGE_KEY)).toMatchObject({
        completedLessons: { 'older-lesson': true, 'how-dns-resolution-works': true },
        knowledgeCheckResults: { 'older-lesson': { q1: true } },
      }),
    );
  });

  it('tracks lab checklist items and marks a lab complete once every task is complete', () => {
    const store = useProgressStore.getState();
    store.setLabChecklistItem('lab-1', 'task-a', 'item', true);
    store.setLabTaskCompleted('lab-1', 'task-a', true);
    expect(useProgressStore.getState().labs['lab-1']).toMatchObject({
      status: 'completed',
      taskProgress: { 'task-a': { completed: true, checklist: { item: true } } },
    });
    useProgressStore.getState().setLabTaskCompleted('lab-1', 'task-b', false);
    expect(useProgressStore.getState().labs['lab-1']?.status).toBe('in-progress');
  });

  it('starts empty and marks itself loaded when nothing is stored', async () => {
    await useProgressStore.getState().load();
    expect(useProgressStore.getState()).toMatchObject({ loaded: true, completedLessons: {}, labs: {} });
  });
});
