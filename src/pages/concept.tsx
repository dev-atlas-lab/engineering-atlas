import { useParams } from 'react-router';
import { Clock, Wrench } from 'lucide-react';
import { findConcept, type ConceptStatus } from '../content/cloud-fundamentals';
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
    domainId && categoryId && conceptId
      ? findConcept(domainId, categoryId, conceptId)
      : undefined;

  if (!concept) return <NotFound />;

  if (concept.status === 'available') {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-text">{concept.title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
          {concept.description}
        </p>
      </div>
    );
  }

  const config = statusConfig[concept.status];
  const Icon = config.icon;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-text">{concept.title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
        {concept.description}
      </p>

      <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-bg-subtle p-5">
        <Icon className="mt-0.5 size-5 shrink-0 text-text-muted" />
        <div>
          <p className="text-[14px] font-medium text-text">{config.label}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
}
