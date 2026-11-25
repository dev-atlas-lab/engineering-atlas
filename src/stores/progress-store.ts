import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';

// The one Zustand store M2 actually introduces — see
// docs/decisions/ADR-006-reduced-state-management-footprint.md for why the
// other five stores in ARCHITECTURE.md's original blueprint are deferred.
// Progress is read by the Level 2 nav, Concept Overview, Home's "Continue"
// card, and written by lesson/lab/knowledge-check views — genuinely
// cross-cutting, unlike the others.

export interface LabTaskProgress {
  taskId: string;
  completed: boolean;
  checklist: Record<string, boolean>;
}

export interface LabProgress {
  labId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  taskProgress: Record<string, LabTaskProgress>;
}

interface PersistedProgress {
  completedLessons: Record<string, true>;
  knowledgeCheckResults: Record<string, Record<string, boolean>>;
  labs: Record<string, LabProgress>;
}

function emptyPersisted(): PersistedProgress {
  return { completedLessons: {}, knowledgeCheckResults: {}, labs: {} };
}

/** Merges two lessonId -> questionId -> boolean maps, one level deep —
 *  values from `current` (in-memory, possibly written after `stored` was
 *  read) win over `stored` on conflict. */
function mergeNested(
  stored: Record<string, Record<string, boolean>>,
  current: Record<string, Record<string, boolean>>,
): Record<string, Record<string, boolean>> {
  const merged: Record<string, Record<string, boolean>> = { ...stored };
  for (const [lessonId, answers] of Object.entries(current)) {
    merged[lessonId] = { ...merged[lessonId], ...answers };
  }
  return merged;
}

/** Merges two labId -> LabProgress maps, including each lab's nested
 *  per-task checklist — `current` (in-memory) wins on conflict. */
function mergeLabs(
  stored: Record<string, LabProgress>,
  current: Record<string, LabProgress>,
): Record<string, LabProgress> {
  const merged: Record<string, LabProgress> = { ...stored };
  for (const [labId, lab] of Object.entries(current)) {
    const storedLab = merged[labId];
    merged[labId] = {
      labId,
      status: lab.status,
      taskProgress: { ...storedLab?.taskProgress, ...lab.taskProgress },
    };
  }
  return merged;
}

const STORAGE_KEY = 'engineering-atlas-progress';

async function persist(data: PersistedProgress) {
  try {
    await idbSet(STORAGE_KEY, data);
  } catch {
    // IndexedDB unavailable (e.g. private browsing) — in-memory state still
    // works for the session; no error surfaced to the user.
  }
}

interface ProgressState extends PersistedProgress {
  loaded: boolean;
  load: () => Promise<void>;
  markLessonComplete: (lessonId: string) => void;
  recordKnowledgeCheckAnswer: (lessonId: string, questionId: string, correct: boolean) => void;
  setLabChecklistItem: (labId: string, taskId: string, item: string, checked: boolean) => void;
  setLabTaskCompleted: (labId: string, taskId: string, completed: boolean) => void;
}

export const useProgressStore = create<ProgressState>((set, get) => {
  // Writes made before the stored snapshot has been loaded must not be
  // persisted yet: they hold only this session's progress, and saving them
  // would overwrite everything stored earlier. They are recorded in memory,
  // merged with the snapshot by load(), and the merged state is saved then.
  let writesBeforeLoad = false;

  function persistCurrent() {
    const state = get();
    if (!state.loaded) {
      writesBeforeLoad = true;
      return;
    }
    void persist({
      completedLessons: state.completedLessons,
      knowledgeCheckResults: state.knowledgeCheckResults,
      labs: state.labs,
    });
  }

  return {
    loaded: false,
    ...emptyPersisted(),

    load: async () => {
      let stored: PersistedProgress | undefined;
      try {
        stored = await idbGet<PersistedProgress>(STORAGE_KEY);
      } catch {
        stored = undefined;
      }
      // Merge, don't replace: a lesson/lab view can call markLessonComplete
      // (or another write) in its own mount effect before this async read
      // resolves. Replacing state outright here would silently discard that
      // write. In-memory state — whatever has been recorded since mount —
      // always wins over the possibly-older persisted snapshot.
      set((state) =>
        stored
          ? {
              completedLessons: { ...stored.completedLessons, ...state.completedLessons },
              knowledgeCheckResults: mergeNested(stored.knowledgeCheckResults, state.knowledgeCheckResults),
              labs: mergeLabs(stored.labs, state.labs),
              loaded: true,
            }
          : { loaded: true },
      );
      if (writesBeforeLoad) {
        writesBeforeLoad = false;
        persistCurrent();
      }
    },

    markLessonComplete: (lessonId) => {
      set({ completedLessons: { ...get().completedLessons, [lessonId]: true as const } });
      persistCurrent();
    },

    recordKnowledgeCheckAnswer: (lessonId, questionId, correct) => {
      const forLesson = { ...(get().knowledgeCheckResults[lessonId] ?? {}), [questionId]: correct };
      set({ knowledgeCheckResults: { ...get().knowledgeCheckResults, [lessonId]: forLesson } });
      persistCurrent();
    },

    setLabChecklistItem: (labId, taskId, item, checked) => {
      const lab = get().labs[labId] ?? { labId, status: 'in-progress' as const, taskProgress: {} };
      const task = lab.taskProgress[taskId] ?? { taskId, completed: false, checklist: {} };
      const checklist = { ...task.checklist, [item]: checked };
      const taskProgress = { ...lab.taskProgress, [taskId]: { ...task, checklist } };
      set({ labs: { ...get().labs, [labId]: { ...lab, taskProgress } } });
      persistCurrent();
    },

    setLabTaskCompleted: (labId, taskId, completed) => {
      const lab = get().labs[labId] ?? { labId, status: 'in-progress' as const, taskProgress: {} };
      const task = lab.taskProgress[taskId] ?? { taskId, completed: false, checklist: {} };
      const taskProgress = { ...lab.taskProgress, [taskId]: { ...task, completed } };
      const allDone = Object.values(taskProgress).every((t) => t.completed);
      set({
        labs: {
          ...get().labs,
          [labId]: { ...lab, status: allDone ? ('completed' as const) : ('in-progress' as const), taskProgress },
        },
      });
      persistCurrent();
    },
  };
});
