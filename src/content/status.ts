import type { ConceptMeta, ConceptStatus } from './types';

// The single mapping from ConceptStatus to user-facing text. Every surface
// that shows a concept's status reads from here — see
// docs/CLOUD_FUNDAMENTALS_CURRICULUM.md "Status labels".
export const conceptStatusLabel: Record<ConceptStatus, string> = {
  available: 'Active',
  'in-development': 'In development',
  'coming-soon': 'Coming soon',
};

const knownStatuses = new Set<string>(Object.keys(conceptStatusLabel));

/** Unknown or missing values degrade to 'coming-soon' — the conservative
 *  reading — so bad content data can never make a concept look Active. */
export function normalizeConceptStatus(status: unknown): ConceptStatus {
  return typeof status === 'string' && knownStatuses.has(status) ? (status as ConceptStatus) : 'coming-soon';
}

export function countConceptsByStatus(concepts: ConceptMeta[]): Record<ConceptStatus, number> {
  const counts: Record<ConceptStatus, number> = { available: 0, 'in-development': 0, 'coming-soon': 0 };
  for (const concept of concepts) counts[normalizeConceptStatus(concept.status)] += 1;
  return counts;
}

/** e.g. "3 active · 1 coming soon" — zero counts are omitted. */
export function formatStatusSummary(counts: Record<ConceptStatus, number>): string {
  return (Object.keys(conceptStatusLabel) as ConceptStatus[])
    .filter((status) => counts[status] > 0)
    .map((status) => `${counts[status]} ${conceptStatusLabel[status].toLowerCase()}`)
    .join(' · ');
}
