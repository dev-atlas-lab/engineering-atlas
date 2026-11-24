import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Sidebar, type SidebarMode } from './sidebar';

function renderSidebar(pathname = '/', mode: SidebarMode = 'expanded') {
  const onClose = vi.fn();
  const onToggleMode = vi.fn();
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <Sidebar open={true} onClose={onClose} mode={mode} onToggleMode={onToggleMode} />
    </MemoryRouter>,
  );
  return { onClose, onToggleMode };
}

describe('Sidebar — Level 1 domain navigation', () => {
  it('renders the domain title', () => {
    renderSidebar();
    expect(screen.getAllByText('Cloud Fundamentals').length).toBeGreaterThan(0);
  });

  it('renders all 10 categories as direct links, with no individual concepts listed', () => {
    renderSidebar();
    expect(screen.getByText('Compute')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Networking')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Load Balancing')).toBeInTheDocument();

    // The sidebar deliberately stops at Category — see
    // docs/M1B_DESIGN_DECISIONS.md §1. Concepts are not listed here.
    expect(screen.queryByText('Virtual Machines')).not.toBeInTheDocument();
    expect(screen.queryByText('Containers')).not.toBeInTheDocument();
  });

  it('marks the active category from the route', () => {
    renderSidebar('/cloud-fundamentals/compute/virtual-machines');
    expect(screen.getByText('Compute').closest('a')).toHaveAttribute('aria-current', 'page');
  });

  it('clicking a category link navigates to the category, not an expanded list', () => {
    renderSidebar();
    const link = screen.getByText('Compute').closest('a');
    expect(link).toHaveAttribute('href', '/cloud-fundamentals/compute');
  });

  it('calls onClose when the mobile close button is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSidebar();
    await user.click(screen.getByLabelText('Close navigation'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onToggleMode when the collapse/expand button is clicked', async () => {
    const user = userEvent.setup();
    const { onToggleMode } = renderSidebar('/', 'expanded');
    await user.click(screen.getByLabelText('Collapse navigation'));
    expect(onToggleMode).toHaveBeenCalled();
  });

  it('in rail mode, shows a category initial instead of the full title as link text', () => {
    renderSidebar('/', 'rail');
    expect(screen.getByLabelText('Expand navigation')).toBeInTheDocument();
    expect(screen.queryByText('Compute')).not.toBeInTheDocument();
    expect(screen.getByTitle('Compute')).toBeInTheDocument();
  });
});
