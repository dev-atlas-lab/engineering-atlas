import { Link, useParams } from 'react-router';
import { Clock, Wrench } from 'lucide-react';
import { findConcept, type ConceptStatus } from '../content/cloud-fundamentals';
import { LessonNav } from '../app/layout/lesson-nav';
import { NotFound } from './not-found';

const statusConfig: Record<
  Exclude<ConceptStatus, 'available'>,
  { icon: typeof Clock; label: string; description: string }
> = {
  'coming-soon': {
    icon: Clock,
    label: 'Coming Soon',
    description: 'Learning content for this concept is planned but not yet started.',
  },
  'in-development': {
    icon: Wrench,
    label: 'In Development',
    description: 'Learning content for this concept is currently being built.',
  },
};

export default function ConceptPage() {
  const { domainId, categoryId, conceptId } = useParams();
  const concept =
    domainId && categoryId && conceptId ? findConcept(domainId, categoryId, conceptId) : undefined;

  if (!concept || !domainId || !categoryId) return <NotFound />;

  const hasLessons = concept.status === 'available' && (concept.lessons?.length ?? 0) > 0;

  if (!hasLessons) {
    // Honest empty state — every concept starts here, and most still are here.
    // See docs/M1B_LEARNING_WORKSPACE_SPEC.md §8.
    const config = statusConfig[concept.status as Exclude<ConceptStatus, 'available'>] ?? statusConfig['coming-soon'];
    const Icon = config.icon;

    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-text">{concept.title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{concept.description}</p>

        <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-bg-subtle p-5">
          <Icon className="mt-0.5 size-5 shrink-0 text-text-muted" />
          <div>
            <p className="text-[14px] font-medium text-text">{config.label}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{config.description}</p>
          </div>
        </div>
      </div>
    );
  }

  const firstLesson = concept.lessons?.[0];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <LessonNav domainId={domainId} categoryId={categoryId} concept={concept} />

      <div className="max-w-2xl flex-1">
        <h1 className="text-2xl font-semibold text-text">{concept.title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{concept.description}</p>

        {concept.learningObjectives && concept.learningObjectives.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted">Learning Objectives</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-text-secondary">
              {concept.learningObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </div>
        )}

        {concept.estimatedMinutes && (
          <p className="mt-3 text-[13px] text-text-muted">Estimated time: ~{concept.estimatedMinutes} minutes</p>
        )}

        {firstLesson && (
          <Link
            to={`/${domainId}/${categoryId}/${concept.id}/${firstLesson.id}`}
            className="mt-6 inline-block rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-accent-text hover:bg-accent-hover"
          >
            Start: {firstLesson.title} →
          </Link>
        )}
      </div>
    </div>
  );
}
