import { Link } from 'react-router';
import { BookOpen } from 'lucide-react';
import { domains } from '../content/cloud-fundamentals';
import { countConceptsByStatus, formatStatusSummary } from '../content/status';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl py-16 px-4">
      <h1 className="text-2xl font-semibold text-text">Engineering Atlas</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
        Understand systems. Explore architecture. Master engineering.
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
        Interactive visualizations, step-by-step walkthroughs, and hands-on labs
        for core engineering concepts across cloud providers.
      </p>

      <div className="mt-10">
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Learning Domains
        </h2>
        <div className="mt-4 space-y-3">
          {domains.map((domain) => (
            <Link
              key={domain.id}
              to={`/${domain.id}`}
              className="group block rounded-lg border border-border p-5 transition-colors hover:border-accent hover:bg-bg-subtle"
            >
              <div className="flex items-start gap-3">
                <BookOpen className="mt-0.5 size-5 shrink-0 text-text-muted transition-colors group-hover:text-accent" />
                <div>
                  <h3 className="text-[15px] font-medium text-text">
                    {domain.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
                    {domain.description}
                  </p>
                  <p className="mt-2 text-[13px] text-text-muted">
                    {domain.categories.length} categories &middot;{' '}
                    {domain.categories.reduce((sum, c) => sum + c.concepts.length, 0)} concepts
                  </p>
                  <p className="mt-1 text-[13px] text-text-muted">
                    {formatStatusSummary(countConceptsByStatus(domain.categories.flatMap((c) => c.concepts)))}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
