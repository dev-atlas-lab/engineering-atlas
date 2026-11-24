import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { AppShell } from './layout/app-shell';

const HomePage = lazy(() => import('../pages/home'));
const DomainPage = lazy(() => import('../pages/domain'));
const CategoryPage = lazy(() => import('../pages/category'));
const ConceptPage = lazy(() => import('../pages/concept'));

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ':domainId', element: <DomainPage /> },
      { path: ':domainId/:categoryId', element: <CategoryPage /> },
      { path: ':domainId/:categoryId/:conceptId', element: <ConceptPage /> },
    ],
  },
];
