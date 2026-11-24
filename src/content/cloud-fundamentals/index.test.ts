import { describe, it, expect } from 'vitest';
import {
  cloudFundamentals,
  domains,
  findDomain,
  findCategory,
  findConcept,
} from './index';

describe('Cloud Fundamentals content index', () => {
  it('has exactly 10 categories', () => {
    expect(cloudFundamentals.categories).toHaveLength(10);
  });

  it('has exactly 25 concepts across all categories', () => {
    const total = cloudFundamentals.categories.reduce(
      (sum, c) => sum + c.concepts.length,
      0,
    );
    expect(total).toBe(25);
  });

  it('every category has at least one concept', () => {
    for (const category of cloudFundamentals.categories) {
      expect(category.concepts.length).toBeGreaterThan(0);
    }
  });

  it('every concept has a valid status', () => {
    const validStatuses = ['available', 'in-development', 'coming-soon'];
    for (const category of cloudFundamentals.categories) {
      for (const concept of category.concepts) {
        expect(validStatuses).toContain(concept.status);
      }
    }
  });

  it('all concepts are coming-soon in M1A', () => {
    for (const category of cloudFundamentals.categories) {
      for (const concept of category.concepts) {
        expect(concept.status).toBe('coming-soon');
      }
    }
  });

  it('every concept has a non-empty description', () => {
    for (const category of cloudFundamentals.categories) {
      for (const concept of category.concepts) {
        expect(concept.description.length).toBeGreaterThan(0);
      }
    }
  });

  it('all IDs are unique within their scope', () => {
    const categoryIds = cloudFundamentals.categories.map((c) => c.id);
    expect(new Set(categoryIds).size).toBe(categoryIds.length);

    for (const category of cloudFundamentals.categories) {
      const conceptIds = category.concepts.map((c) => c.id);
      expect(new Set(conceptIds).size).toBe(conceptIds.length);
    }
  });
});

describe('content lookup functions', () => {
  it('findDomain returns the domain for a valid ID', () => {
    expect(findDomain('cloud-fundamentals')).toBe(cloudFundamentals);
  });

  it('findDomain returns undefined for invalid ID', () => {
    expect(findDomain('nonexistent')).toBeUndefined();
  });

  it('findCategory returns the category for valid IDs', () => {
    const cat = findCategory('cloud-fundamentals', 'compute');
    expect(cat?.title).toBe('Compute');
  });

  it('findCategory returns undefined for invalid IDs', () => {
    expect(findCategory('cloud-fundamentals', 'nope')).toBeUndefined();
    expect(findCategory('nope', 'compute')).toBeUndefined();
  });

  it('findConcept returns the concept for valid IDs', () => {
    const concept = findConcept(
      'cloud-fundamentals',
      'compute',
      'virtual-machines',
    );
    expect(concept?.title).toBe('Virtual Machines');
  });

  it('findConcept returns undefined for invalid IDs', () => {
    expect(
      findConcept('cloud-fundamentals', 'compute', 'nope'),
    ).toBeUndefined();
  });

  it('domains array contains cloud-fundamentals', () => {
    expect(domains).toHaveLength(1);
    expect(domains[0]?.id).toBe('cloud-fundamentals');
  });
});
