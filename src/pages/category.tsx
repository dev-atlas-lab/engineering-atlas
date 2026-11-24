import { Link, useParams } from 'react-router';
import { findDomain, findCategory } from '../content/cloud-fundamentals';
import { ConceptStatusBadge } from '../components/concept-status-badge';
import { NotFound } from './not-found';

export default function CategoryPage() {
  const { domainId, categoryId } = useParams();
  const domain = domainId ? findDomain(domainId) : undefined;
  const category = domainId && categoryId ? findCategory(domainId, categoryId) : undefined;

  if (!domain || !category) return <NotFound />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-text">{category.title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{category.description}</p>

      <ul className="mt-8 space-y-3">
        {category.concepts.map((concept) => (
          <li key={concept.id}>
            <Link
              to={`/${domain.id}/${category.id}/${concept.id}`}
              className="group block rounded-lg border border-border p-4 transition-colors hover:border-accent hover:bg-bg-subtle"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 text-[15px] font-medium text-text group-hover:text-accent">
                  {concept.title}
                </h2>
                <ConceptStatusBadge status={concept.status} />
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{concept.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
