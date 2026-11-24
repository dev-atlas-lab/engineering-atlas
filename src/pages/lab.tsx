import { Link, useParams } from 'react-router';
import { Clock, FlaskConical } from 'lucide-react';
import { findConcept, findLab } from '../content/cloud-fundamentals';
import { labSimulations } from '../content/cloud-fundamentals/lab-simulations';
import { LabPrerequisites } from '../engines/lab/lab-prerequisites';
import { HandsOnLabView } from '../engines/lab/hands-on-lab-view';
import { ChallengeLabView } from '../engines/lab/challenge-lab-view';
import type { SimulationLab, HandsOnLab, ChallengeLab } from '../content/types';
import { NotFound } from './not-found';

export default function LabPage() {
  const { domainId, categoryId, conceptId, labId } = useParams();
  const concept =
    domainId && categoryId && conceptId ? findConcept(domainId, categoryId, conceptId) : undefined;
  const lab = domainId && categoryId && conceptId && labId ? findLab(domainId, categoryId, conceptId, labId) : undefined;

  if (!concept || !lab || !domainId || !categoryId) return <NotFound />;

  const base = `/${domainId}/${categoryId}/${concept.id}`;

  return (
    <div className="max-w-2xl">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-text">
        <FlaskConical className="size-5 text-text-muted" />
        {lab.title}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{lab.description}</p>
      <div className="mt-2 flex items-center gap-3 text-[12px] text-text-muted">
        <span className="capitalize">{lab.type} lab</span>
        <span className="capitalize">{lab.difficulty}</span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {lab.estimatedTime}
        </span>
      </div>

      {/* Keyed by lab so moving between labs resets simulation params and
          challenge answers instead of carrying the previous lab's state over. */}
      <div key={lab.id} className="mt-6 space-y-4">
        <LabPrerequisites prerequisites={lab.prerequisites} />

        {lab.type === 'simulation' &&
          (() => {
            const binding = labSimulations[lab.id];
            if (!binding) {
              // Content declares a simulation lab but nothing registered a
              // SimulationDefinition for it in lab-simulations.ts — surface
              // that plainly rather than rendering a silent blank area.
              return (
                <div className="rounded-lg border border-border bg-bg-subtle p-4 text-[13px] text-text-muted">
                  This lab&apos;s simulation isn&apos;t wired up yet — content exists but no simulation is
                  registered for it.
                </div>
              );
            }
            return binding.render(lab.content as SimulationLab);
          })()}

        {lab.type === 'hands-on' && <HandsOnLabView lab={lab} content={lab.content as HandsOnLab} />}

        {lab.type === 'challenge' && <ChallengeLabView content={lab.content as ChallengeLab} />}
      </div>

      <div className="mt-6 border-t border-border-subtle pt-4 text-[13px]">
        <Link to={base} className="font-medium text-accent hover:text-accent-hover">
          ← Back to {concept.title}
        </Link>
      </div>
    </div>
  );
}
