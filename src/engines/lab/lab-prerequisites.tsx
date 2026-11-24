import type { Prerequisite } from '../../content/types';

export function LabPrerequisites({ prerequisites }: { prerequisites: Prerequisite[] }) {
  if (prerequisites.length === 0) return null;

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="text-[13px] font-medium text-text">Prerequisites</h3>
      <ul className="mt-2 space-y-1.5">
        {prerequisites.map((prereq) => (
          <li key={prereq.label} className="text-[13px] text-text-secondary">
            <span className="font-medium text-text">{prereq.label}</span> — {prereq.description}
            {prereq.installUrl && (
              <>
                {' '}
                <a
                  href={prereq.installUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent-hover"
                >
                  install
                </a>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
