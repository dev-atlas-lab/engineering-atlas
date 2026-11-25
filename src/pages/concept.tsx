import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { conceptContentLoader } from '../content/cloud-fundamentals/concept-loaders';
import { Clock, Wrench } from 'lucide-react';
import { findConcept, type ConceptStatus } from '../content/cloud-fundamentals';
import { normalizeConceptStatus } from '../content/status';
import { ConceptStatusBadge } from '../components/concept-status-badge';
import { LessonNav } from '../app/layout/lesson-nav';
import { NotFound } from './not-found';

const unavailableDetail: Record<Exclude<ConceptStatus, 'available'>, { icon: typeof Clock; description: string }> = {
  'coming-soon': {
    icon: Clock,
    description: 'Learning content for this concept is planned but not yet started.',
  },
  'in-development': {
    icon: Wrench,
    description: 'Learning content for this concept is being built and is not ready to use yet.',
  },
};

function ConceptHeader({ title, status }: { title: string; status: ConceptStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <h1 className="text-2xl font-semibold text-text">{title}</h1>
      <ConceptStatusBadge status={status} />
    </div>
  );
}

export default function ConceptPage() {
  const { domainId, categoryId, conceptId } = useParams();
  const concept =
    domainId && categoryId && conceptId ? findConcept(domainId, categoryId, conceptId) : undefined;

  // The overview renders from metadata alone. Start downloading this one
  // concept's content now, since the learner's next step is usually a
  // lesson; failures are ignored here and surface on the lesson page.
  const prefetchId =
    concept && normalizeConceptStatus(concept.status) === 'available' && (concept.lessons?.length ?? 0) > 0
      ? concept.id
      : undefined;
  useEffect(() => {
    if (prefetchId) conceptContentLoader.load(prefetchId).catch(() => {});
  }, [prefetchId]);

  if (!concept || !domainId || !categoryId) return <NotFound />;

  const status = normalizeConceptStatus(concept.status);
  const hasLessons = status === 'available' && (concept.lessons?.length ?? 0) > 0;

  if (!hasLessons) {
    // Honest empty state — see docs/M1B_LEARNING_WORKSPACE_SPEC.md §8. An
    // 'available' concept with no lessons is a content error; it is shown
    // as Coming soon rather than as an empty Active workspace.
    const shownStatus: Exclude<ConceptStatus, 'available'> = status === 'in-development' ? 'in-development' : 'coming-soon';
    const detail = unavailableDetail[shownStatus];
    const Icon = detail.icon;

    return (
      <div className="max-w-2xl">
        <ConceptHeader title={concept.title} status={shownStatus} />
        <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{concept.description}</p>

        <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-bg-subtle p-5">
          <Icon className="mt-0.5 size-5 shrink-0 text-text-muted" />
          <p className="text-[13px] leading-relaxed text-text-secondary">{detail.description}</p>
        </div>
      </div>
    );
  }

  const firstLesson = concept.lessons?.[0];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <LessonNav domainId={domainId} categoryId={categoryId} concept={concept} />

      <div className="min-w-0 max-w-2xl flex-1">
        <ConceptHeader title={concept.title} status={status} />
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
