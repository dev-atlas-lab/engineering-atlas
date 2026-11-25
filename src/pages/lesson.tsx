import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { findConcept, findLessonMeta } from '../content/cloud-fundamentals';
import type { Lesson } from '../content/types';
import { useConceptContent } from '../hooks/use-concept-content';
import { LessonNav } from '../app/layout/lesson-nav';
import { LessonSectionView, ProviderDetailsView } from '../components/lesson-content';
import { ContentLoadErrorPanel, ContentLoading } from '../components/content-status';
import { VisualizationRegion } from '../engines/visualization/visualization-region';
import { KnowledgeCheck } from '../engines/assessment/knowledge-check';
import { useProgressStore } from '../stores/progress-store';
import { NotFound } from './not-found';

function LessonBodyView({ lesson }: { lesson: Lesson }) {
  const markLessonComplete = useProgressStore((s) => s.markLessonComplete);

  // A lesson counts as viewed once its content is actually on screen — not
  // when the route is entered, and not if its content failed to load.
  useEffect(() => {
    markLessonComplete(lesson.id);
  }, [lesson.id, markLessonComplete]);

  return (
    <>
      {(lesson.learningObjectives.length > 0 || lesson.analogy) && (
        <div className="space-y-4">
          {lesson.learningObjectives.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-[13px] text-text-secondary">
              {lesson.learningObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          )}
          {lesson.analogy && (
            <p className="rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 text-[13px] italic text-text-secondary">
              {lesson.analogy}
            </p>
          )}
        </div>
      )}

      {/* Keyed so Previous/Next between two lessons with visualizations
          resets the step and selection rather than reusing the old instance. */}
      {lesson.visualization && <VisualizationRegion key={`visualization-${lesson.id}`} scene={lesson.visualization} />}

      <div className="space-y-6">
        {lesson.sections.map((section) => (
          <LessonSectionView key={section.heading} section={section} />
        ))}
      </div>

      {lesson.providerDetails && <ProviderDetailsView details={lesson.providerDetails} />}

      {lesson.knowledgeCheck && lesson.knowledgeCheck.length > 0 && (
        <KnowledgeCheck key={`knowledge-check-${lesson.id}`} lessonId={lesson.id} questions={lesson.knowledgeCheck} />
      )}

      {lesson.furtherReading && lesson.furtherReading.length > 0 && (
        <div>
          <h3 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Further Reading</h3>
          <ul className="mt-1.5 space-y-1">
            {lesson.furtherReading.map((ref) => (
              <li key={ref.url}>
                <a href={ref.url} target="_blank" rel="noreferrer" className="text-[13px] text-accent hover:text-accent-hover">
                  {ref.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default function LessonPage() {
  const { domainId, categoryId, conceptId, lessonId } = useParams();
  const concept = domainId && categoryId && conceptId ? findConcept(domainId, categoryId, conceptId) : undefined;
  const lessonMeta = concept && lessonId ? findLessonMeta(concept, lessonId) : undefined;

  // Only load content for a lesson that exists in the metadata; an unknown
  // lesson id is a Not Found, decided without downloading anything.
  const content = useConceptContent(lessonMeta ? concept?.id : undefined);

  if (!concept || !lessonMeta || !domainId || !categoryId) return <NotFound />;

  const lessons = concept.lessons ?? [];
  const index = lessons.findIndex((l) => l.id === lessonMeta.id);
  const previous = index > 0 ? lessons[index - 1] : undefined;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined;
  const base = `/${domainId}/${categoryId}/${concept.id}`;
  const lesson = content.status === 'ready' ? content.concept.lessons.find((l) => l.id === lessonMeta.id) : undefined;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <LessonNav domainId={domainId} categoryId={categoryId} concept={concept} activeLessonId={lessonMeta.id} />

      <div className="min-w-0 max-w-2xl flex-1 space-y-6">
        <h1 className="text-2xl font-semibold text-text">{lessonMeta.title}</h1>

        {content.status === 'error' && (
          <ContentLoadErrorPanel error={content.error} backTo={base} backLabel={`Back to ${concept.title}`} />
        )}
        {(content.status === 'loading' || content.status === 'idle') && <ContentLoading label="Loading lesson content…" />}
        {lesson && <LessonBodyView lesson={lesson} />}

        <nav aria-label="Lesson pagination" className="flex items-center justify-between gap-4 border-t border-border-subtle pt-4 text-[13px]">
          {previous ? (
            <Link to={`${base}/${previous.id}`} className="font-medium text-accent hover:text-accent-hover">
              ← {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`${base}/${next.id}`} className="text-right font-medium text-accent hover:text-accent-hover">
              {next.title} →
            </Link>
          ) : (
            <Link to={base} className="text-right font-medium text-accent hover:text-accent-hover">
              Back to {concept.title}
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
