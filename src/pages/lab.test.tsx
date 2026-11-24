import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import LabPage from './lab';

function renderLab(path: string) {
  const router = createMemoryRouter(
    [{ path: ':domainId/:categoryId/:conceptId/labs/:labId', element: <LabPage /> }],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe('LabPage — simulation lab', () => {
  it('renders the simulation lab title, type, and parameters', () => {
    renderLab('/cloud-fundamentals/compute/virtual-machines/labs/vm-resource-allocation-lab');
    expect(screen.getByRole('heading', { name: /Design a VM Architecture/ })).toBeInTheDocument();
    expect(screen.getByText('simulation lab')).toBeInTheDocument();
    expect(screen.getByText('Number of VMs requested')).toBeInTheDocument();
  });

  it('renders validation rules against the live simulation state', () => {
    renderLab('/cloud-fundamentals/compute/virtual-machines/labs/vm-resource-allocation-lab');
    expect(screen.getByText('At least one VM is running')).toBeInTheDocument();
  });

  it('shows a Back-to-concept link', () => {
    renderLab('/cloud-fundamentals/compute/virtual-machines/labs/vm-resource-allocation-lab');
    expect(screen.getByText(/Back to Virtual Machines/)).toBeInTheDocument();
  });
});

describe('LabPage — hands-on lab', () => {
  it('renders environment, tasks, and the self-reported honesty note', () => {
    renderLab('/cloud-fundamentals/compute/containers/labs/run-and-inspect-a-container-locally');
    expect(screen.getByRole('heading', { name: /Run and Inspect a Container Locally/ })).toBeInTheDocument();
    expect(screen.getByText('hands-on lab')).toBeInTheDocument();
    expect(screen.getByText('Run a container')).toBeInTheDocument();
    expect(screen.getByText(/Self-reported — not automatically verified/)).toBeInTheDocument();
  });
});

describe('LabPage — not found', () => {
  it('shows not found for an unknown lab id', () => {
    renderLab('/cloud-fundamentals/compute/virtual-machines/labs/nonexistent');
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});
