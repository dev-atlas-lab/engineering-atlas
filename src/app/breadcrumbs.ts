import { findDomain, findCategory, findConcept } from '../content/cloud-fundamentals';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

export function resolveBreadcrumbs(params: {
  domainId?: string;
  categoryId?: string;
  conceptId?: string;
}): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [];

  if (!params.domainId) return crumbs;

  const domain = findDomain(params.domainId);
  if (!domain) return crumbs;

  crumbs.push({ label: domain.title, path: `/${domain.id}` });

  if (!params.categoryId) return crumbs;

  const category = findCategory(params.domainId, params.categoryId);
  if (!category) return crumbs;

  crumbs.push({
    label: category.title,
    path: `/${domain.id}/${category.id}`,
  });

  if (!params.conceptId) return crumbs;

  const concept = findConcept(
    params.domainId,
    params.categoryId,
    params.conceptId,
  );
  if (!concept) return crumbs;

  crumbs.push({
    label: concept.title,
    path: `/${domain.id}/${category.id}/${concept.id}`,
  });

  return crumbs;
}
