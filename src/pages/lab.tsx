import { Link, useParams } from 'react-router';
import { Clock, FlaskConical } from 'lucide-react';
import { findConcept, findLabMeta } from '../content/cloud-fundamentals';
import type { LoadedConcept } from '../content/cloud-fundamentals/concept-loaders';
import type { LabDefinition, SimulationLab, HandsOnLab, ChallengeLab } from '../content/types';
import { useConceptContent } from '../hooks/use-concept-content';
import { ContentLoadErrorPanel, ContentLoading } from '../components/content-status';
import { LabPrerequisites } from '../engines/lab/lab-prerequisites';
import { HandsOnLabView } from '../engines/lab/hands-on-lab-view';
import { ChallengeLabView } from '../engines/lab/challenge-lab-view';
import { NotFound } from './not-found';

function LabBodyView({ lab, concept }: { lab: LabDefinition; concept: LoadedConcept }) {
  const simulation = concept.simulations[lab.id];
  return (
    <>
      <p className="text-[15px] leading-relaxed text-text-secondary">{lab.description}</p>
      <div className="mt-2 flex items-center gap-3 text-[12px] text-text-muted">
        <span className="capitalize">{lab.type} lab</span>
        <span className="capitalize">{lab.difficulty}</span>
        <span className="flex items-center gap-1">
          <Clock aria-hidden className="size-3" />
          {lab.estimatedTime}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <LabPrerequisites prerequisites={lab.prerequisites} />

        {lab.type === 'simulation' &&
          (simulation ? (
            simulation.render(lab.content as SimulationLab)
          ) : (
            // The concept's content declares a simulation lab but registers no
            // simulation for it — surface that plainly instead of a blank area.
            <div className="rounded-lg border border-border bg-bg-subtle p-4 text-[13px] text-text-muted">
              This lab&apos;s simulation isn&apos;t wired up yet — content exists but no simulation is registered for it.
            </div>
          ))}

        {lab.type === 'hands-on' && <HandsOnLabView lab={lab} content={lab.content as HandsOnLab} />}

        {lab.type === 'challenge' && <ChallengeLabView content={lab.content as ChallengeLab} />}
      </div>
    </>
  );
}

export default function LabPage() {
  const { domainId, categoryId, conceptId, labId } = useParams();
  const concept = domainId && categoryId && conceptId ? findConcept(domainId, categoryId, conceptId) : undefined;
  const labMeta = concept && labId ? findLabMeta(concept, labId) : undefined;
  const content = useConceptContent(labMeta ? concept?.id : undefined);

  if (!concept || !labMeta || !domainId || !categoryId) return <NotFound />;

  const base = `/${domainId}/${categoryId}/${concept.id}`;
  const lab = content.status === 'ready' ? content.concept.labs.find((l) => l.id === labMeta.id) : undefined;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-semibold text-text">
        <FlaskConical aria-hidden className="size-5 text-text-muted" />
        {labMeta.title}
      </h1>

      {content.status === 'error' && (
        <ContentLoadErrorPanel error={content.error} backTo={base} backLabel={`Back to ${concept.title}`} />
      )}
      {(content.status === 'loading' || content.status === 'idle') && <ContentLoading label="Loading lab…" />}
      {/* Keyed by lab so moving between labs resets simulation params and
          challenge answers instead of carrying the previous lab's state over. */}
      {content.status === 'ready' && lab && <LabBodyView key={lab.id} lab={lab} concept={content.concept} />}

      <div className="mt-6 border-t border-border-subtle pt-4 text-[13px]">
        <Link to={base} className="font-medium text-accent hover:text-accent-hover">
          ← Back to {concept.title}
        </Link>
      </div>
    </div>
  );
}
