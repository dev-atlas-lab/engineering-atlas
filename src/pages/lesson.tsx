import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { findConcept, findLesson } from '../content/cloud-fundamentals';
import { LessonNav } from '../app/layout/lesson-nav';
import { LessonSectionView, ProviderDetailsView } from '../components/lesson-content';
import { VisualizationRegion } from '../engines/visualization/visualization-region';
import { KnowledgeCheck } from '../engines/assessment/knowledge-check';
import { useProgressStore } from '../stores/progress-store';
import { NotFound } from './not-found';

export default function LessonPage() {
  const { domainId, categoryId, conceptId, lessonId } = useParams();
  const concept =
    domainId && categoryId && conceptId ? findConcept(domainId, categoryId, conceptId) : undefined;
  const lesson =
    domainId && categoryId && conceptId && lessonId
      ? findLesson(domainId, categoryId, conceptId, lessonId)
      : undefined;

  const markLessonComplete = useProgressStore((s) => s.markLessonComplete);

  useEffect(() => {
    if (lesson) markLessonComplete(lesson.id);
  }, [lesson, markLessonComplete]);

  if (!concept || !lesson || !domainId || !categoryId) return <NotFound />;

  const lessons = concept.lessons ?? [];
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const previous = index > 0 ? lessons[index - 1] : undefined;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined;
  const base = `/${domainId}/${categoryId}/${concept.id}`;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <LessonNav domainId={domainId} categoryId={categoryId} concept={concept} activeLessonId={lesson.id} />

      <div className="max-w-2xl flex-1 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-text">{lesson.title}</h1>
          {lesson.learningObjectives.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-text-secondary">
              {lesson.learningObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          )}
          {lesson.analogy && (
            <p className="mt-4 rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 text-[13px] italic text-text-secondary">
              {lesson.analogy}
            </p>
          )}
        </header>

        {lesson.visualization && <VisualizationRegion scene={lesson.visualization} />}

        <div className="space-y-6">
          {lesson.sections.map((section) => (
            <LessonSectionView key={section.heading} section={section} />
          ))}
        </div>

        {lesson.providerDetails && <ProviderDetailsView details={lesson.providerDetails} />}

        {lesson.knowledgeCheck && lesson.knowledgeCheck.length > 0 && (
          <KnowledgeCheck lessonId={lesson.id} questions={lesson.knowledgeCheck} />
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

        <nav className="flex items-center justify-between border-t border-border-subtle pt-4 text-[13px]">
          {previous ? (
            <Link to={`${base}/${previous.id}`} className="font-medium text-accent hover:text-accent-hover">
              ← {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`${base}/${next.id}`} className="font-medium text-accent hover:text-accent-hover">
              {next.title} →
            </Link>
          ) : (
            <Link to={base} className="font-medium text-accent hover:text-accent-hover">
              Back to {concept.title}
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
