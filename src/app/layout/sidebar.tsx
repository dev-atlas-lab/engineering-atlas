import { Link, useLocation } from 'react-router';
import { X, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { cloudFundamentals } from '../../content/cloud-fundamentals';

export type SidebarMode = 'expanded' | 'rail';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  mode: SidebarMode;
  onToggleMode: () => void;
}

/**
 * Level 1 — Domain Navigation. Stops at Category, deliberately — see
 * docs/M1B_DESIGN_DECISIONS.md §1 for why this no longer expands to list
 * individual concepts the way the M1A sidebar did.
 */
export function Sidebar({ open, onClose, mode, onToggleMode }: SidebarProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const activeDomainId = pathSegments[0];
  const activeCategoryId = pathSegments[1];

  const domain = cloudFundamentals;
  const isRail = mode === 'rail';

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed top-(--height-header) z-50 flex h-[calc(100dvh-var(--height-header))] w-(--width-sidebar) flex-col border-r border-border bg-surface transition-transform duration-200',
          'lg:translate-x-0',
          isRail ? 'lg:w-(--width-sidebar-rail)' : 'lg:w-(--width-sidebar)',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 lg:hidden">
          <span className="text-[13px] font-medium text-text-muted">Navigation</span>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="flex size-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="hidden items-center justify-between gap-2 border-b border-border-subtle px-3 py-3 lg:flex">
          {!isRail && (
            <Link
              to={`/${domain.id}`}
              className={cn(
                'truncate text-[13px] font-semibold uppercase tracking-wider',
                activeDomainId === domain.id && !activeCategoryId ? 'text-accent' : 'text-text-muted hover:text-text',
              )}
            >
              {domain.title}
            </Link>
          )}
          <button
            onClick={onToggleMode}
            aria-label={isRail ? 'Expand navigation' : 'Collapse navigation'}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle hover:text-text"
          >
            {isRail ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>

        <nav aria-label="Domain navigation" className="flex-1 overflow-y-auto px-2 pb-4">
          <div className="mb-1 px-2 pt-3 lg:hidden">
            <Link
              to={`/${domain.id}`}
              onClick={onClose}
              className={cn(
                'text-[13px] font-semibold uppercase tracking-wider',
                activeDomainId === domain.id && !activeCategoryId ? 'text-accent' : 'text-text-muted hover:text-text',
              )}
            >
              {domain.title}
            </Link>
          </div>

          <ul className="space-y-0.5 pt-2 lg:pt-2">
            {domain.categories.map((category) => {
              const isActive = activeDomainId === domain.id && activeCategoryId === category.id;
              return (
                <li key={category.id}>
                  <Link
                    to={`/${domain.id}/${category.id}`}
                    onClick={onClose}
                    title={isRail ? category.title : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-2 text-[13px] transition-colors',
                      isActive
                        ? 'bg-bg-subtle font-medium text-accent'
                        : 'text-text-secondary hover:bg-bg-subtle hover:text-text',
                      isRail && 'justify-center',
                    )}
                  >
                    {isRail ? (
                      <span
                        aria-hidden
                        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border-subtle text-[11px] font-medium"
                      >
                        {category.title.charAt(0)}
                      </span>
                    ) : (
                      <span className="truncate">{category.title}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
