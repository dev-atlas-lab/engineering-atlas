import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { MainContent } from './main-content';

function renderWithRoute(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <MainContent />,
        children: [
          { path: '/', element: <div>Home</div> },
          { path: ':domainId', element: <div>Domain</div> },
          { path: ':domainId/:categoryId', element: <div>Category</div> },
          {
            path: ':domainId/:categoryId/:conceptId',
            element: <div>Concept</div>,
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe('MainContent breadcrumbs', () => {
  it('shows no breadcrumb on home page', () => {
    renderWithRoute('/');
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('shows domain breadcrumb on domain page', () => {
    renderWithRoute('/cloud-fundamentals');
    expect(screen.getByText('Cloud Fundamentals')).toBeInTheDocument();
  });

  it('shows domain and category breadcrumbs on category page', () => {
    renderWithRoute('/cloud-fundamentals/compute');
    expect(screen.getByText('Cloud Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Compute')).toBeInTheDocument();
  });

  it('shows full breadcrumb path on concept page', () => {
    renderWithRoute('/cloud-fundamentals/compute/virtual-machines');
    expect(screen.getByText('Cloud Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Compute')).toBeInTheDocument();
    expect(screen.getByText('Virtual Machines')).toBeInTheDocument();
  });

  it('renders breadcrumb links for non-last segments', () => {
    renderWithRoute('/cloud-fundamentals/compute/virtual-machines');
    const cfLink = screen.getByText('Cloud Fundamentals').closest('a');
    expect(cfLink).toHaveAttribute('href', '/cloud-fundamentals');
    const computeLink = screen.getByText('Compute').closest('a');
    expect(computeLink).toHaveAttribute('href', '/cloud-fundamentals/compute');
  });

  it('last breadcrumb segment is not a link', () => {
    renderWithRoute('/cloud-fundamentals/compute/virtual-machines');
    const vm = screen.getByText('Virtual Machines');
    expect(vm.closest('a')).toBeNull();
  });
});
