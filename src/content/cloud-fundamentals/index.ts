import type { Domain, Category, ConceptMeta, Lesson, LabDefinition } from '../types';
import { cloudComputingModels } from './categories/cloud-computing-models';
import { globalInfrastructure } from './categories/global-infrastructure';
import { compute } from './compute';
import { storage } from './categories/storage';
import { networking } from './categories/networking';
import { identityAndAccessManagement } from './categories/identity-and-access-management';
import { security } from './categories/security';
import { loadBalancing } from './categories/load-balancing';
import { scalabilityAndReliability } from './categories/scalability-and-reliability';
import { monitoringAndObservability } from './categories/monitoring-and-observability';

export type { ConceptStatus, Domain, Category, ConceptMeta, Lesson, LabDefinition } from '../types';

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

export function findLesson(
  domainId: string,
  categoryId: string,
  conceptId: string,
  lessonId: string,
): Lesson | undefined {
  return findConcept(domainId, categoryId, conceptId)?.lessons?.find((l) => l.id === lessonId);
}

export function findLab(domainId: string, categoryId: string, conceptId: string, labId: string): LabDefinition | undefined {
  return findConcept(domainId, categoryId, conceptId)?.labs?.find((l) => l.id === labId);
}
