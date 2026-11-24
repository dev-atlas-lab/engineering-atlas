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

describe('ConceptPage — unavailable concept (coming-soon)', () => {
  it('renders concept title and description', () => {
    renderConcept('/cloud-fundamentals/cloud-computing-models/cloud-service-models');
    expect(screen.getByText('Cloud Service Models')).toBeInTheDocument();
    expect(screen.getByText(/IaaS, PaaS, and SaaS/)).toBeInTheDocument();
  });

  it('shows the Coming soon badge and explanation for coming-soon concepts', () => {
    renderConcept('/cloud-fundamentals/cloud-computing-models/cloud-service-models');
    expect(screen.getByText('Coming soon')).toHaveAttribute('data-status', 'coming-soon');
    expect(screen.getByText(/Learning content for this concept is planned/)).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('shows not found for invalid concept', () => {
    renderConcept('/cloud-fundamentals/compute/nonexistent');
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});

describe('ConceptPage — available concept with lessons', () => {
  it('renders the concept overview with learning objectives and lesson nav', () => {
    renderConcept('/cloud-fundamentals/compute/virtual-machines');
    expect(screen.getAllByText('Virtual Machines').length).toBeGreaterThan(0);
    expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });

  it('shows the Active badge in the concept header', () => {
    renderConcept('/cloud-fundamentals/compute/virtual-machines');
    expect(screen.getByText('Active')).toHaveAttribute('data-status', 'available');
  });

  it('shows a Start link to the first lesson', () => {
    renderConcept('/cloud-fundamentals/compute/virtual-machines');
    expect(screen.getByText(/Start: Introduction to Virtual Machines/)).toBeInTheDocument();
  });

  it('lists lessons and the lab in the lesson navigation', () => {
    renderConcept('/cloud-fundamentals/compute/virtual-machines');
    expect(screen.getByText('VM Architecture')).toBeInTheDocument();
    expect(screen.getByText('Design a VM Architecture')).toBeInTheDocument();
  });
});
