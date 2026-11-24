import { Link, useParams } from 'react-router';
import { findDomain, findCategory, type ConceptStatus } from '../content/cloud-fundamentals';
import { NotFound } from './not-found';

const statusLabel: Record<ConceptStatus, string> = {
  available: '',
  'in-development': 'In Development',
  'coming-soon': 'Coming Soon',
};

export default function CategoryPage() {
  const { domainId, categoryId } = useParams();
  const domain = domainId ? findDomain(domainId) : undefined;
  const category =
    domainId && categoryId ? findCategory(domainId, categoryId) : undefined;

  if (!domain || !category) return <NotFound />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-text">{category.title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
        {category.description}
      </p>

      <div className="mt-8 space-y-3">
        {category.concepts.map((concept) => (
          <Link
            key={concept.id}
            to={`/${domain.id}/${category.id}/${concept.id}`}
            className="group block rounded-lg border border-border p-4 transition-colors hover:border-accent hover:bg-bg-subtle"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[15px] font-medium text-text group-hover:text-accent">
                {concept.title}
              </h2>
              {concept.status !== 'available' && (
                <span className="shrink-0 rounded-sm bg-bg-muted px-2 py-0.5 text-[11px] font-medium text-text-muted">
                  {statusLabel[concept.status]}
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
              {concept.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
