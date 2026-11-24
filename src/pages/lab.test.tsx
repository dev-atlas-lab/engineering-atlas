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

describe('LabPage — replication and durability simulation', () => {
  const path = '/cloud-fundamentals/storage/object-storage/labs/replication-and-durability-lab';

  it('reports local redundancy as unreadable through a zone failure and fails validation', async () => {
    const user = userEvent.setup();
    renderLab(path);
    await user.selectOptions(screen.getByLabelText('Failure to simulate'), 'zone');
    await user.click(screen.getByLabelText('Jump to last state'));
    expect(screen.getByText(/Only if the outage is temporary/)).toBeInTheDocument();
    expect(ruleMark('Data stays readable with no failover')).toBe('○');
  });

  it('passes validation with zone-redundant storage under a zone failure', async () => {
    const user = userEvent.setup();
    renderLab(path);
    await user.selectOptions(screen.getByLabelText('Redundancy strategy'), 'zone');
    await user.selectOptions(screen.getByLabelText('Failure to simulate'), 'zone');
    await user.click(screen.getByLabelText('Jump to last state'));
    expect(ruleMark('Tested against a zone failure')).toBe('✓');
    expect(ruleMark('Data stays readable with no failover')).toBe('✓');
    expect(ruleMark('No second region paid for when the requirement does not need one')).toBe('✓');
  });

  it('marks geo-zone storage as over-provisioned for this requirement', async () => {
    const user = userEvent.setup();
    renderLab(path);
    await user.selectOptions(screen.getByLabelText('Redundancy strategy'), 'geo-zone');
    await user.selectOptions(screen.getByLabelText('Failure to simulate'), 'zone');
    await user.click(screen.getByLabelText('Jump to last state'));
    expect(ruleMark('Data stays readable with no failover')).toBe('✓');
    expect(ruleMark('No second region paid for when the requirement does not need one')).toBe('○');
  });
});

describe('LabPage — storage selection challenge', () => {
  it('assesses the optimal storage design', async () => {
    const user = userEvent.setup();
    renderLab('/cloud-fundamentals/storage/file-storage/labs/storage-selection-challenge');
    const fieldsets = screen.getAllByRole('group');
    const pick = async (index: number, label: RegExp) => {
      const option = Array.from(fieldsets[index]!.querySelectorAll('label')).find((l) => label.test(l.textContent ?? ''));
      await user.click(option!);
    };
    await pick(0, /^Block volume/);
    await pick(1, /^File share/);
    await pick(2, /^Object storage/);
    await pick(3, /^Object storage, archive tier/);
    await user.click(screen.getByText('Evaluate My Design'));
    expect(screen.getByText('optimal')).toBeInTheDocument();
  });
});

describe('LabPage — CIDR and subnet lab', () => {
  const path = '/cloud-fundamentals/networking/virtual-networks/labs/cidr-and-subnet-lab';

  it('calculates the range for a typed block and passes validation', async () => {
    const user = userEvent.setup();
    renderLab(path);
    const input = screen.getByLabelText('CIDR block');
    await user.clear(input);
    await user.type(input, '192.168.10.0/26');
    await user.click(screen.getByLabelText('Jump to last state'));
    expect(screen.getByText('192.168.10.63')).toBeInTheDocument();
    expect(screen.getByText(/^59 /)).toBeInTheDocument();
    expect(ruleMark('The CIDR block was parsed successfully')).toBe('✓');
    expect(ruleMark('An overlap check was completed')).toBe('✓');
  });

  it('explains invalid input and fails validation', async () => {
    const user = userEvent.setup();
    renderLab(path);
    const input = screen.getByLabelText('CIDR block');
    await user.clear(input);
    await user.type(input, '10.0.0.256/24');
    await user.click(screen.getByLabelText('Jump to last state'));
    expect(screen.getByRole('alert')).toHaveTextContent(/out of range/);
    expect(ruleMark('The CIDR block was parsed successfully')).toBe('○');
  });
});

describe('LabPage — packet routing lab', () => {
  const path = '/cloud-fundamentals/networking/subnets-and-routing/labs/packet-routing-lab';

  it('starts with a dropped packet and passes once the NAT route is added', async () => {
    const user = userEvent.setup();
    renderLab(path);
    await user.click(screen.getByLabelText('Jump to last state'));
    expect(screen.getByText(/dropped — no path/)).toBeInTheDocument();
    expect(ruleMark('The app VM’s outbound packet was delivered')).toBe('○');

    await user.selectOptions(screen.getByLabelText('Private subnet default route (0.0.0.0/0)'), 'nat');
    await user.click(screen.getByLabelText('Jump to last state'));
    expect(screen.getByText('Outcome: delivered')).toBeInTheDocument();
    expect(ruleMark('The app VM’s outbound packet was delivered')).toBe('✓');
    expect(ruleMark('Outbound access goes through the NAT gateway, not a public IP on the app VM')).toBe('✓');
  });
});

describe('LabPage — DNS hands-on lab', () => {
  it('presents local commands with the honesty note and no claim of verification', () => {
    renderLab('/cloud-fundamentals/networking/dns-and-content-delivery/labs/trace-dns-resolution-locally');
    expect(screen.getByText('hands-on lab')).toBeInTheDocument();
    expect(screen.getByText('$ dig +trace www.example.com')).toBeInTheDocument();
    expect(screen.getByText(/Self-reported — not automatically verified/)).toBeInTheDocument();
  });
});

describe('LabPage — not found', () => {
  it('shows not found for an unknown lab id', () => {
    renderLab('/cloud-fundamentals/compute/virtual-machines/labs/nonexistent');
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});
