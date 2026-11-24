import { describe, it, expect } from 'vitest';
import {
  conceptStatusLabel,
  countConceptsByStatus,
  formatStatusSummary,
  normalizeConceptStatus,
} from './status';
import type { ConceptMeta } from './types';

const concept = (id: string, status: unknown) => ({ id, title: id, description: id, status }) as ConceptMeta;

describe('conceptStatusLabel', () => {
  it('maps every status to its exact user-facing label', () => {
    expect(conceptStatusLabel.available).toBe('Active');
    expect(conceptStatusLabel['in-development']).toBe('In development');
    expect(conceptStatusLabel['coming-soon']).toBe('Coming soon');
  });
});

describe('normalizeConceptStatus', () => {
  it('passes known statuses through unchanged', () => {
    expect(normalizeConceptStatus('available')).toBe('available');
    expect(normalizeConceptStatus('in-development')).toBe('in-development');
    expect(normalizeConceptStatus('coming-soon')).toBe('coming-soon');
  });

  it('treats missing or unknown values as coming-soon, never as available', () => {
    expect(normalizeConceptStatus(undefined)).toBe('coming-soon');
    expect(normalizeConceptStatus('')).toBe('coming-soon');
    expect(normalizeConceptStatus('Active')).toBe('coming-soon');
    expect(normalizeConceptStatus(42)).toBe('coming-soon');
  });
});

describe('status summaries', () => {
  it('counts concepts by normalized status', () => {
    const counts = countConceptsByStatus([
      concept('a', 'available'),
      concept('b', 'available'),
      concept('c', 'in-development'),
      concept('d', 'bogus'),
    ]);
    expect(counts).toEqual({ available: 2, 'in-development': 1, 'coming-soon': 1 });
  });

  it('formats a summary with the shared labels and omits zero counts', () => {
    expect(formatStatusSummary({ available: 3, 'in-development': 0, 'coming-soon': 2 })).toBe(
      '3 active · 2 coming soon',
    );
  });
});
