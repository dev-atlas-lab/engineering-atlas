import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { cloudFundamentals, type ConceptStatus } from '../../content/cloud-fundamentals';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const statusStyle: Record<ConceptStatus, string> = {
  available: 'text-text',
  'in-development': 'text-text-muted',
  'coming-soon': 'text-text-muted',
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const activeDomainId = pathSegments[0];
  const activeCategoryId = pathSegments[1];
  const activeConceptId = pathSegments[2];

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(activeCategoryId ? [activeCategoryId] : []),
  );

  function toggleCategory(categoryId: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  const domain = cloudFundamentals;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-[var(--height-header)] z-50 flex h-[calc(100dvh-var(--height-header))] w-(--width-sidebar) flex-col border-r border-border bg-surface transition-transform duration-200',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 lg:hidden">
          <span className="text-[13px] font-medium text-text-muted">
            Navigation
          </span>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="flex size-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Domain navigation">
          <div className="mb-2 px-2 pt-3">
            <Link
              to={`/${domain.id}`}
              className={cn(
                'text-[13px] font-semibold uppercase tracking-wider',
                activeDomainId === domain.id && !activeCategoryId
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text',
              )}
              onClick={onClose}
            >
              {domain.title}
            </Link>
          </div>

          <ul className="space-y-0.5">
            {domain.categories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const isActiveCategory = activeCategoryId === category.id;

              return (
                <li key={category.id}>
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[14px] transition-colors',
                      isActiveCategory
                        ? 'font-medium text-text'
                        : 'text-text-secondary hover:bg-bg-subtle hover:text-text',
                    )}
                  >
                    <ChevronRight
                      className={cn(
                        'size-3.5 shrink-0 transition-transform',
                        isExpanded && 'rotate-90',
                      )}
                    />
                    {category.title}
                  </button>

                  {isExpanded && (
                    <ul className="ml-3 border-l border-border-subtle pl-3 pt-0.5">
                      {category.concepts.map((concept) => {
                        const isActive = activeConceptId === concept.id && isActiveCategory;
                        return (
                          <li key={concept.id}>
                            <Link
                              to={`/${domain.id}/${category.id}/${concept.id}`}
                              onClick={onClose}
                              className={cn(
                                'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors',
                                isActive
                                  ? 'bg-bg-subtle font-medium text-accent'
                                  : cn(
                                      statusStyle[concept.status],
                                      'hover:bg-bg-subtle hover:text-text',
                                    ),
                              )}
                            >
                              <span className="truncate">{concept.title}</span>
                              {concept.status !== 'available' && (
                                <span className="ml-auto shrink-0 rounded-sm bg-bg-muted px-1.5 py-0.5 text-[10px] text-text-muted">
                                  {concept.status === 'coming-soon' ? 'Soon' : 'Dev'}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
