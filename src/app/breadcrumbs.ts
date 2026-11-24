import { findDomain, findCategory, findConcept } from '../content/cloud-fundamentals';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

export function resolveBreadcrumbs(params: {
  domainId?: string;
  categoryId?: string;
  conceptId?: string;
  lessonId?: string;
  labId?: string;
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

  const concept = findConcept(params.domainId, params.categoryId, params.conceptId);
  if (!concept) return crumbs;

  const conceptPath = `/${domain.id}/${category.id}/${concept.id}`;
  crumbs.push({ label: concept.title, path: conceptPath });

  if (params.lessonId) {
    const lesson = concept.lessons?.find((l) => l.id === params.lessonId);
    if (lesson) crumbs.push({ label: lesson.title, path: `${conceptPath}/${lesson.id}` });
    return crumbs;
  }

  if (params.labId) {
    const lab = concept.labs?.find((l) => l.id === params.labId);
    if (lab) crumbs.push({ label: lab.title, path: `${conceptPath}/labs/${lab.id}` });
    return crumbs;
  }

  return crumbs;
}
