import { Link, useParams } from 'react-router';
import { findDomain } from '../content/cloud-fundamentals';
import { NotFound } from './not-found';

export default function DomainPage() {
  const { domainId } = useParams();
  const domain = domainId ? findDomain(domainId) : undefined;

  if (!domain) return <NotFound />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-text">{domain.title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
        {domain.description}
      </p>

      <div className="mt-8 space-y-4">
        {domain.categories.map((category) => (
          <Link
            key={category.id}
            to={`/${domain.id}/${category.id}`}
            className="group block rounded-lg border border-border p-4 transition-colors hover:border-accent hover:bg-bg-subtle"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-[15px] font-medium text-text">
                {category.title}
              </h2>
              <span className="shrink-0 text-[13px] text-text-muted">
                {category.concepts.length}{' '}
                {category.concepts.length === 1 ? 'concept' : 'concepts'}
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
              {category.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
