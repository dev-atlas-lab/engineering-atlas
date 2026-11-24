import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import LessonPage from './lesson';

function renderLesson(path: string) {
  const router = createMemoryRouter(
    [{ path: ':domainId/:categoryId/:conceptId/:lessonId', element: <LessonPage /> }],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe('LessonPage', () => {
  it('renders the lesson title and learning objectives', () => {
    renderLesson('/cloud-fundamentals/compute/virtual-machines/vm-architecture');
    expect(screen.getByRole('heading', { name: 'VM Architecture' })).toBeInTheDocument();
    expect(
      screen.getByText(/Describe how a host.s physical resources are partitioned/),
    ).toBeInTheDocument();
  });

  it('renders the visualization region when the lesson declares one', () => {
    renderLesson('/cloud-fundamentals/compute/virtual-machines/vm-architecture');
    // role="group", not role="img" — the region contains focusable,
    // interactive descendants (React Flow nodes/controls), so "img" would
    // be the wrong ARIA semantics even though it reads fine visually.
    expect(screen.getByRole('group', { name: /Hypervisor allocating virtual machines/ })).toBeInTheDocument();
  });

  it('does not render a visualization region for a lesson without one', () => {
    renderLesson('/cloud-fundamentals/compute/virtual-machines/introduction-to-virtual-machines');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('renders the knowledge check for a lesson that has one', () => {
    renderLesson('/cloud-fundamentals/compute/virtual-machines/vm-architecture');
    expect(screen.getByText('Knowledge Check')).toBeInTheDocument();
  });

  it('shows no Previous link on the first lesson, and a Next link to the second', () => {
    renderLesson('/cloud-fundamentals/compute/virtual-machines/introduction-to-virtual-machines');
    expect(screen.queryByText(/^← /)).not.toBeInTheDocument();
    expect(screen.getByText(/Virtualization Fundamentals and Hypervisors →/)).toBeInTheDocument();
  });

  it('shows a Previous link on the second lesson', () => {
    renderLesson('/cloud-fundamentals/compute/virtual-machines/virtualization-fundamentals');
    expect(screen.getByText(/← Introduction to Virtual Machines/)).toBeInTheDocument();
  });

  it('on the last lesson, replaces Next with a Back-to-concept link', () => {
    renderLesson('/cloud-fundamentals/compute/virtual-machines/architecture-comparison');
    expect(screen.getByText(/Back to Virtual Machines/)).toBeInTheDocument();
  });

  it('renders provider details for a provider-kind lesson', () => {
    renderLesson('/cloud-fundamentals/compute/virtual-machines/azure-virtual-machines');
    expect(screen.getAllByText('Azure Virtual Machines').length).toBeGreaterThan(1);
    expect(screen.getByText('Official documentation')).toBeInTheDocument();
  });

  it('shows not found for an unknown lesson id', () => {
    renderLesson('/cloud-fundamentals/compute/virtual-machines/nonexistent-lesson');
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});
