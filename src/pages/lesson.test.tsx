import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import LessonPage from './lesson';

/** Renders a lesson route and waits until its lazily loaded body is on
 *  screen (immediately, if the concept's content is already cached). */
async function renderLesson(path: string) {
  const router = createMemoryRouter(
    [{ path: ':domainId/:categoryId/:conceptId/:lessonId', element: <LessonPage /> }],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  await waitForContent();
  return router;
}

async function waitForContent() {
  await waitFor(() => expect(screen.queryByText('Loading lesson content…')).not.toBeInTheDocument());
}

describe('LessonPage', () => {
  it('renders the lesson title and learning objectives', async () => {
    await renderLesson('/cloud-fundamentals/compute/virtual-machines/vm-architecture');
    expect(screen.getByRole('heading', { name: 'VM Architecture' })).toBeInTheDocument();
    expect(
      screen.getByText(/Describe how a host.s physical resources are partitioned/),
    ).toBeInTheDocument();
  });

  it('renders the visualization region when the lesson declares one', async () => {
    await renderLesson('/cloud-fundamentals/compute/virtual-machines/vm-architecture');
    // role="group", not role="img" — the region contains focusable,
    // interactive descendants (React Flow nodes/controls), so "img" would
    // be the wrong ARIA semantics even though it reads fine visually.
    expect(screen.getByRole('group', { name: /Hypervisor allocating virtual machines/ })).toBeInTheDocument();
  });

  it('does not render a visualization region for a lesson without one', async () => {
    await renderLesson('/cloud-fundamentals/compute/virtual-machines/introduction-to-virtual-machines');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('renders the knowledge check for a lesson that has one', async () => {
    await renderLesson('/cloud-fundamentals/compute/virtual-machines/vm-architecture');
    expect(screen.getByText('Knowledge Check')).toBeInTheDocument();
  });

  it('shows no Previous link on the first lesson, and a Next link to the second', async () => {
    await renderLesson('/cloud-fundamentals/compute/virtual-machines/introduction-to-virtual-machines');
    expect(screen.queryByText(/^← /)).not.toBeInTheDocument();
    expect(screen.getByText(/Virtualization Fundamentals and Hypervisors →/)).toBeInTheDocument();
  });

  it('shows a Previous link on the second lesson', async () => {
    await renderLesson('/cloud-fundamentals/compute/virtual-machines/virtualization-fundamentals');
    expect(screen.getByText(/← Introduction to Virtual Machines/)).toBeInTheDocument();
  });

  it('on the last lesson, replaces Next with a Back-to-concept link', async () => {
    await renderLesson('/cloud-fundamentals/compute/virtual-machines/architecture-comparison');
    expect(screen.getByText(/Back to Virtual Machines/)).toBeInTheDocument();
  });

  it('renders provider details for a provider-kind lesson', async () => {
    await renderLesson('/cloud-fundamentals/compute/virtual-machines/azure-virtual-machines');
    expect(screen.getAllByText('Azure Virtual Machines').length).toBeGreaterThan(1);
    expect(screen.getByText('Official documentation')).toBeInTheDocument();
  });

  it('shows not found for an unknown lesson id', async () => {
    await renderLesson('/cloud-fundamentals/compute/virtual-machines/nonexistent-lesson');
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});

describe('LessonPage — interactive diagrams', () => {
  const edgeLesson = '/cloud-fundamentals/global-infrastructure/data-centers-and-edge-locations/edge-locations-and-points-of-presence';

  it('lets a keyboard user select a sequence-diagram actor and populate the inspector', async () => {
    const user = userEvent.setup();
    await renderLesson(edgeLesson);
    const actor = screen.getByRole('button', { name: 'Edge location — select to inspect' });
    actor.focus();
    await user.keyboard('{Enter}');
    expect(actor).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Cached copies of responses')).toBeInTheDocument();
  });

  it('shows the explanation for the current step and updates it when stepping', async () => {
    const user = userEvent.setup();
    await renderLesson(edgeLesson);
    expect(screen.getByText('The edge location has no copy of /logo.png yet.')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Step forward'));
    await user.click(screen.getByLabelText('Step forward'));
    expect(screen.getByText(/forwards the request to the origin/)).toBeInTheDocument();
  });

  it('resets the timeline when navigating directly between two lessons that both have visualizations', async () => {
    const user = userEvent.setup();
    const router = await renderLesson(
      '/cloud-fundamentals/global-infrastructure/regions-and-availability-zones/regions-and-zones-explained',
    );
    await user.click(screen.getByLabelText('Jump to last state'));
    expect(screen.getByText(/Step 4 of 4/)).toBeInTheDocument();

    // Same route element, new params: LessonPage stays mounted. Without a
    // key on the visualization, the old step index (3) would carry over.
    await act(() =>
      router.navigate('/cloud-fundamentals/global-infrastructure/geographic-redundancy-and-data-residency/multi-region-replication'),
    );
    await waitForContent();
    expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
  });
});

describe('LessonPage — React warnings', () => {
  it('renders a lesson with both a visualization and a knowledge check without duplicate-key warnings', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    await renderLesson('/cloud-fundamentals/networking/virtual-networks/virtual-network-architecture');
    const keyWarnings = errors.mock.calls.filter((args) => String(args[0]).includes('same key'));
    errors.mockRestore();
    expect(keyWarnings).toEqual([]);
  });
});
