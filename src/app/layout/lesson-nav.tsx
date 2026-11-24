import { Link } from 'react-router';
import { FlaskConical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useProgressStore } from '../../stores/progress-store';
import type { ConceptMeta, LessonKind } from '../../content/types';

interface LessonNavProps {
  domainId: string;
  categoryId: string;
  concept: ConceptMeta;
  activeLessonId?: string;
  activeLabId?: string;
}

const kindLabel: Record<LessonKind, string> = {
  concept: 'Lesson',
  provider: 'Lesson · Provider',
  comparison: 'Lesson · Comparison',
};

/** Level 2 — Learning Navigation. See docs/M1B_UX_ARCHITECTURE.md §2 and
 *  docs/M1B_LEARNING_WORKSPACE_SPEC.md §3. Never locks a sequence — every
 *  entry is a direct link regardless of completion state. */
export function LessonNav({ domainId, categoryId, concept, activeLessonId, activeLabId }: LessonNavProps) {
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const labs = useProgressStore((s) => s.labs);

  const lessons = concept.lessons ?? [];
  const conceptLabs = concept.labs ?? [];
  const base = `/${domainId}/${categoryId}/${concept.id}`;

  return (
    <nav aria-label="Lesson navigation" className="lg:w-56 lg:shrink-0">
      <h2 className="mb-2 px-1 text-[13px] font-semibold text-text lg:px-0">{concept.title}</h2>
      <ol className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {lessons.map((lesson, index) => {
          const isActive = lesson.id === activeLessonId;
          const isComplete = Boolean(completedLessons[lesson.id]);
          return (
            <li key={lesson.id} className="shrink-0 lg:shrink">
              <Link
                to={`${base}/${lesson.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] transition-colors lg:whitespace-normal',
                  isActive
                    ? 'bg-bg-subtle font-medium text-accent'
                    : 'text-text-secondary hover:bg-bg-subtle hover:text-text',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px]',
                    isComplete ? 'border-success bg-success text-accent-text' : 'border-border-subtle text-text-muted',
                  )}
                >
                  {isComplete ? '✓' : index + 1}
                </span>
                <span className="truncate">{lesson.title}</span>
                <span className="ml-auto hidden shrink-0 text-[10px] text-text-muted lg:inline">
                  {kindLabel[lesson.kind]}
                </span>
              </Link>
            </li>
          );
        })}

        {conceptLabs.map((lab) => {
          const isActive = lab.id === activeLabId;
          const isComplete = labs[lab.id]?.status === 'completed';
          return (
            <li key={lab.id} className="shrink-0 lg:shrink">
              <Link
                to={`${base}/labs/${lab.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] transition-colors lg:whitespace-normal',
                  isActive
                    ? 'bg-bg-subtle font-medium text-accent'
                    : 'text-text-secondary hover:bg-bg-subtle hover:text-text',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-full border',
                    isComplete ? 'border-success bg-success' : 'border-border-subtle',
                  )}
                >
                  <FlaskConical className="size-2.5 text-text-muted" />
                </span>
                <span className="truncate">{lab.title}</span>
                <span className="ml-auto hidden shrink-0 text-[10px] text-text-muted lg:inline">Lab</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
