import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function ruleMark(label: string) {
  return screen.getByText(label).previousElementSibling?.textContent;
}

describe('LabPage — zone failure simulation', () => {
  const path = '/cloud-fundamentals/global-infrastructure/regions-and-availability-zones/labs/zone-failure-simulation-lab';

  it('fails validation when the zone holding every dependency fails', async () => {
    const user = userEvent.setup();
    renderLab(path);
    await user.selectOptions(screen.getByLabelText('Zone to fail'), '1');
    await user.click(screen.getByLabelText('Jump to last state'));
    expect(screen.getByText(/Service unavailable/)).toBeInTheDocument();
    expect(ruleMark('Service remains available after the zone failure')).toBe('○');
  });

  it('passes every validation rule once the design survives a Zone 1 failure', async () => {
    const user = userEvent.setup();
    renderLab(path);
    await user.selectOptions(screen.getByLabelText('Web tier placement'), 'two-zones');
    await user.selectOptions(screen.getByLabelText('Database deployment'), 'zone-standby');
    await user.selectOptions(screen.getByLabelText('Zone to fail'), '1');
    await user.click(screen.getByLabelText('Jump to last state'));
    expect(screen.getByText(/Service available/)).toBeInTheDocument();
    expect(ruleMark('Tested a failure of Zone 1 (where the database primary lives)')).toBe('✓');
    expect(ruleMark('Web VMs run in at least two zones')).toBe('✓');
    expect(ruleMark('Service remains available after the zone failure')).toBe('✓');
  });

  it('resets to the initial state when Reset is pressed', async () => {
    const user = userEvent.setup();
    renderLab(path);
    await user.click(screen.getByLabelText('Jump to last state'));
    await user.click(screen.getByText('Reset simulation'));
    expect(screen.getByText(/Nothing deployed yet/)).toBeInTheDocument();
  });
});

describe('LabPage — architecture challenge', () => {
  it('assesses the optimal geography design', async () => {
    const user = userEvent.setup();
    renderLab('/cloud-fundamentals/global-infrastructure/geographic-redundancy-and-data-residency/labs/choose-a-deployment-geography');
    expect(screen.getByText('Evaluate My Design')).toBeDisabled();
    await user.click(screen.getByText('An EU region, spread across three zones'));
    await user.click(screen.getByText('Warm standby in a second EU region'));
    await user.click(screen.getByText('Asynchronous replication'));
    await user.click(screen.getByText('Evaluate My Design'));
    expect(screen.getByText('optimal')).toBeInTheDocument();
  });

  it('flags a residency violation', async () => {
    const user = userEvent.setup();
    renderLab('/cloud-fundamentals/global-infrastructure/geographic-redundancy-and-data-residency/labs/choose-a-deployment-geography');
    await user.click(screen.getByText('An EU region, spread across three zones'));
    await user.click(screen.getByText('Warm standby in a non-EU region'));
    await user.click(screen.getByText('Asynchronous replication'));
    await user.click(screen.getByText('Evaluate My Design'));
    expect(screen.getByText('problematic')).toBeInTheDocument();
    expect(screen.getByText(/violates the residency requirement/)).toBeInTheDocument();
  });
});

describe('LabPage — not found', () => {
  it('shows not found for an unknown lab id', () => {
    renderLab('/cloud-fundamentals/compute/virtual-machines/labs/nonexistent');
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});
