import { describe, it, expect } from 'vitest';
import { resolveBreadcrumbs } from './breadcrumbs';

describe('resolveBreadcrumbs', () => {
  it('returns empty array for no params', () => {
    expect(resolveBreadcrumbs({})).toEqual([]);
  });

  it('returns domain breadcrumb for domain route', () => {
    const crumbs = resolveBreadcrumbs({ domainId: 'cloud-fundamentals' });
    expect(crumbs).toEqual([
      { label: 'Cloud Fundamentals', path: '/cloud-fundamentals' },
    ]);
  });

  it('returns domain + category breadcrumbs for category route', () => {
    const crumbs = resolveBreadcrumbs({
      domainId: 'cloud-fundamentals',
      categoryId: 'compute',
    });
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0]?.label).toBe('Cloud Fundamentals');
    expect(crumbs[1]?.label).toBe('Compute');
    expect(crumbs[1]?.path).toBe('/cloud-fundamentals/compute');
  });

  it('returns full breadcrumbs for concept route', () => {
    const crumbs = resolveBreadcrumbs({
      domainId: 'cloud-fundamentals',
      categoryId: 'compute',
      conceptId: 'virtual-machines',
    });
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]?.label).toBe('Cloud Fundamentals');
    expect(crumbs[1]?.label).toBe('Compute');
    expect(crumbs[2]?.label).toBe('Virtual Machines');
    expect(crumbs[2]?.path).toBe(
      '/cloud-fundamentals/compute/virtual-machines',
    );
  });

  it('returns empty for invalid domain', () => {
    expect(resolveBreadcrumbs({ domainId: 'nonexistent' })).toEqual([]);
  });

  it('returns only domain crumb for invalid category', () => {
    const crumbs = resolveBreadcrumbs({
      domainId: 'cloud-fundamentals',
      categoryId: 'nonexistent',
    });
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0]?.label).toBe('Cloud Fundamentals');
  });

  it('returns domain + category for invalid concept', () => {
    const crumbs = resolveBreadcrumbs({
      domainId: 'cloud-fundamentals',
      categoryId: 'compute',
      conceptId: 'nonexistent',
    });
    expect(crumbs).toHaveLength(2);
  });

  it('uses display titles not URL slugs', () => {
    const crumbs = resolveBreadcrumbs({
      domainId: 'cloud-fundamentals',
      categoryId: 'identity-and-access-management',
    });
    expect(crumbs[1]?.label).toBe('Identity and Access Management');
  });
});
