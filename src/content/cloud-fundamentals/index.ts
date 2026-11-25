// The eager curriculum index: metadata only (titles, status, lesson and lab
// outlines). It must never import a concept content module — those load per
// concept through ./concept-loaders.ts. A test guards this boundary.
import type { Domain, Category, ConceptMeta, LessonMeta, LabMeta } from '../types';
import { cloudComputingModels } from './categories/cloud-computing-models';
import { globalInfrastructure } from './global-infrastructure';
import { compute } from './compute';
import { storage } from './storage';
import { networking } from './networking';
import { identityAndAccessManagement } from './categories/identity-and-access-management';
import { security } from './categories/security';
import { loadBalancing } from './categories/load-balancing';
import { scalabilityAndReliability } from './categories/scalability-and-reliability';
import { monitoringAndObservability } from './categories/monitoring-and-observability';

export type { ConceptStatus, Domain, Category, ConceptMeta, LessonMeta, LabMeta } from '../types';

export const cloudFundamentals: Domain = {
  id: 'cloud-fundamentals',
  title: 'Cloud Fundamentals',
  description:
    'Core cloud computing concepts across Azure and AWS — from infrastructure primitives to observability.',
  categories: [
    cloudComputingModels,
    globalInfrastructure,
    compute,
    storage,
    networking,
    identityAndAccessManagement,
    security,
    loadBalancing,
    scalabilityAndReliability,
    monitoringAndObservability,
  ],
};

export const domains: Domain[] = [cloudFundamentals];

export function findDomain(domainId: string): Domain | undefined {
  return domains.find((d) => d.id === domainId);
}

export function findCategory(domainId: string, categoryId: string): Category | undefined {
  return findDomain(domainId)?.categories.find((c) => c.id === categoryId);
}

export function findConcept(domainId: string, categoryId: string, conceptId: string): ConceptMeta | undefined {
  return findCategory(domainId, categoryId)?.concepts.find((c) => c.id === conceptId);
}

/** Concept ids are unique across the domain (enforced by tests), so a
 *  concept can be found by id alone — which is how content is loaded. */
export function findConceptById(conceptId: string): ConceptMeta | undefined {
  for (const domain of domains) {
    for (const category of domain.categories) {
      const concept = category.concepts.find((c) => c.id === conceptId);
      if (concept) return concept;
    }
  }
  return undefined;
}

export function findLessonMeta(concept: ConceptMeta, lessonId: string): LessonMeta | undefined {
  return concept.lessons?.find((l) => l.id === lessonId);
}

export function findLabMeta(concept: ConceptMeta, labId: string): LabMeta | undefined {
  return concept.labs?.find((l) => l.id === labId);
}
