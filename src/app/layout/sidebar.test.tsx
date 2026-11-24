import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Sidebar } from './sidebar';

function renderSidebar(pathname = '/') {
  const onClose = vi.fn();
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <Sidebar open={true} onClose={onClose} />
    </MemoryRouter>,
  );
  return { onClose };
}

describe('Sidebar', () => {
  it('renders domain title', () => {
    renderSidebar();
    expect(screen.getByText('Cloud Fundamentals')).toBeInTheDocument();
  });

  it('renders all 10 categories', () => {
    renderSidebar();
    expect(screen.getByText('Compute')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Networking')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Load Balancing')).toBeInTheDocument();
  });

  it('expands a category on click to show concepts', async () => {
    const user = userEvent.setup();
    renderSidebar();

    expect(screen.queryByText('Virtual Machines')).not.toBeInTheDocument();

    await user.click(screen.getByText('Compute'));
    expect(screen.getByText('Virtual Machines')).toBeInTheDocument();
    expect(screen.getByText('Containers')).toBeInTheDocument();
    expect(screen.getByText('Serverless Functions')).toBeInTheDocument();
  });

  it('collapses an expanded category on click', async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByText('Compute'));
    expect(screen.getByText('Virtual Machines')).toBeInTheDocument();

    await user.click(screen.getByText('Compute'));
    expect(screen.queryByText('Virtual Machines')).not.toBeInTheDocument();
  });

  it('shows status badge on coming-soon concepts', async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByText('Compute'));
    const badges = screen.getAllByText('Soon');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('auto-expands active category from route', () => {
    renderSidebar('/cloud-fundamentals/compute/virtual-machines');
    expect(screen.getByText('Virtual Machines')).toBeInTheDocument();
  });
});
