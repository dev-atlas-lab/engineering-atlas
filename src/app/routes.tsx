import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { AppShell } from './layout/app-shell';

const HomePage = lazy(() => import('../pages/home'));
const DomainPage = lazy(() => import('../pages/domain'));
const CategoryPage = lazy(() => import('../pages/category'));
const ConceptPage = lazy(() => import('../pages/concept'));
const LessonPage = lazy(() => import('../pages/lesson'));
const LabPage = lazy(() => import('../pages/lab'));

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ':domainId', element: <DomainPage /> },
      { path: ':domainId/:categoryId', element: <CategoryPage /> },
      { path: ':domainId/:categoryId/:conceptId', element: <ConceptPage /> },
      { path: ':domainId/:categoryId/:conceptId/labs/:labId', element: <LabPage /> },
      { path: ':domainId/:categoryId/:conceptId/:lessonId', element: <LessonPage /> },
    ],
  },
];
