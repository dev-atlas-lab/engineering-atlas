import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import CategoryPage from './category';
import DomainPage from './domain';
import { findCategory } from '../content/cloud-fundamentals';
import { conceptStatusLabel } from '../content/status';

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: ':domainId', element: <DomainPage /> },
      { path: ':domainId/:categoryId', element: <CategoryPage /> },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

function badgeForConcept(title: string) {
  const link = screen.getByText(title).closest('a');
  if (!link) throw new Error(`No concept link for ${title}`);
  return within(link).getByText(/^(Active|In development|Coming soon)$/);
}

describe('CategoryPage status labels', () => {
  it('labels each existing Compute concept with its own status', () => {
    renderAt('/cloud-fundamentals/compute');
    expect(badgeForConcept('Virtual Machines')).toHaveTextContent('Active');
    expect(badgeForConcept('Containers')).toHaveTextContent('Active');
    expect(badgeForConcept('Serverless Functions')).toHaveTextContent('Active');
  });

  it.each(['global-infrastructure', 'storage', 'networking', 'identity-and-access-management', 'security', 'monitoring-and-observability'])(
    'labels every concept in %s with the label matching its content status',
    (categoryId) => {
      renderAt(`/cloud-fundamentals/${categoryId}`);
      for (const concept of findCategory('cloud-fundamentals', categoryId)!.concepts) {
        expect(badgeForConcept(concept.title)).toHaveTextContent(conceptStatusLabel[concept.status]);
      }
    },
  );
});

describe('DomainPage status summary', () => {
  it('summarizes each category using the shared labels', () => {
    renderAt('/cloud-fundamentals');
    const computeCard = screen.getByText('Compute').closest('a')!;
    expect(within(computeCard).getByText('3 active')).toBeInTheDocument();
  });
});
