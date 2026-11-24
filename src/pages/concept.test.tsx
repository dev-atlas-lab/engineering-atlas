import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import ConceptPage from './concept';

function renderConcept(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: ':domainId/:categoryId/:conceptId',
        element: <ConceptPage />,
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe('ConceptPage', () => {
  it('renders concept title and description', () => {
    renderConcept('/cloud-fundamentals/compute/virtual-machines');
    expect(screen.getByText('Virtual Machines')).toBeInTheDocument();
    expect(
      screen.getByText(/Virtualized servers that provide full OS-level/),
    ).toBeInTheDocument();
  });

  it('shows Coming Soon status for coming-soon concepts', () => {
    renderConcept('/cloud-fundamentals/compute/virtual-machines');
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(
      screen.getByText(/Learning content for this concept is planned/),
    ).toBeInTheDocument();
  });

  it('shows not found for invalid concept', () => {
    renderConcept('/cloud-fundamentals/compute/nonexistent');
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});
