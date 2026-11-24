import { Outlet, useParams, Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { resolveBreadcrumbs } from '../breadcrumbs';

export function MainContent() {
  const params = useParams();
  const crumbs = resolveBreadcrumbs({
    domainId: params.domainId,
    categoryId: params.categoryId,
    conceptId: params.conceptId,
  });

  return (
    <main className="min-h-[calc(100dvh-var(--height-header))] px-4 py-6 sm:px-6 lg:px-8">
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1 text-[13px]">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li key={crumb.path} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="size-3 text-text-muted" />
                  )}
                  {isLast ? (
                    <span className="font-medium text-text">{crumb.label}</span>
                  ) : (
                    <Link
                      to={crumb.path}
                      className="text-text-secondary transition-colors hover:text-text"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <Outlet />
    </main>
  );
}
