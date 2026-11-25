import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SceneDefinition } from '../types';
import { SvgTopologyScene } from './svg-topology-scene';
import { SvgSequenceScene } from './svg-sequence-scene';

const topology: SceneDefinition = {
  id: 'topo',
  type: 'topology',
  title: 'Access topology',
  description: 'A web tier reaching a database.',
  nodes: [
    { id: 'web', type: 'server', label: 'Web tier', position: { x: 0, y: 0 }, data: { Tier: 'web' }, status: 'error' },
    { id: 'db', type: 'database', label: 'Database', position: { x: 0, y: 160 }, data: {}, status: 'active' },
  ],
  edges: [{ id: 'w-d', source: 'web', target: 'db', edgeType: 'request', flow: 'deny', label: 'denied' }],
  boundaries: [{ id: 'net', label: 'Virtual network', kind: 'network', nodeIds: ['web', 'db'] }],
  states: [{ id: 's0', label: 's0', description: 'Start' }],
};

describe('SvgTopologyScene', () => {
  it('exposes an accessible title and description', () => {
    const { container } = render(<SvgTopologyScene scene={topology} stateIndex={0} selectedNodeId={null} onSelectNode={() => {}} />);
    expect(container.querySelector('title')?.textContent).toBe('Access topology');
    expect(container.querySelector('desc')?.textContent).toBe('A web tier reaching a database.');
    expect(screen.getByRole('group', { name: 'Access topology' })).toBeInTheDocument();
  });

  it('renders each node as a focusable button reflecting selection', () => {
    render(<SvgTopologyScene scene={topology} stateIndex={0} selectedNodeId="web" onSelectNode={() => {}} />);
    const web = screen.getByRole('button', { name: 'Web tier — select to inspect' });
    expect(web).toHaveAttribute('tabindex', '0');
    expect(web).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Database — select to inspect' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('selects a node on click and via the keyboard', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<SvgTopologyScene scene={topology} stateIndex={0} selectedNodeId={null} onSelectNode={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Database — select to inspect' }));
    expect(onSelect).toHaveBeenCalledWith('db');
    const web = screen.getByRole('button', { name: 'Web tier — select to inspect' });
    web.focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('web');
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('draws the boundary and a legend of the conventions it uses', () => {
    const { container } = render(<SvgTopologyScene scene={topology} stateIndex={0} selectedNodeId={null} onSelectNode={() => {}} />);
    expect(screen.getByText('Virtual network')).toBeInTheDocument();
    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(within(legend).getByText('Denied by policy')).toBeInTheDocument();
    expect(within(legend).getByText('Network')).toBeInTheDocument();
    expect(within(legend).getByText('Failed / compromised')).toBeInTheDocument();
    expect(within(legend).getByText('Active / healthy')).toBeInTheDocument();
    // The denied edge uses the error token for both line and arrow.
    expect(container.querySelector('line.stroke-error')).toBeTruthy();
    expect(container.querySelector('polygon.fill-error')).toBeTruthy();
  });

  it('is theme-agnostic: colours come from tokens, not hard-coded values', () => {
    const { container } = render(<SvgTopologyScene scene={topology} stateIndex={0} selectedNodeId={null} onSelectNode={() => {}} />);
    // An error node uses the error stroke token (which each theme redefines).
    expect(container.querySelector('rect.stroke-error')).toBeTruthy();
    expect(container.querySelector('[fill^="#"]')).toBeNull();
    expect(container.querySelector('[stroke^="#"]')).toBeNull();
  });
});

const sequence: SceneDefinition = {
  id: 'seq',
  type: 'sequence',
  title: 'Sign-in flow',
  nodes: [
    { id: 'user', type: 'user', label: 'User', position: { x: 0, y: 0 }, data: { Role: 'human' } },
    { id: 'idp', type: 'identity', label: 'Identity provider', position: { x: 0, y: 0 }, data: {} },
  ],
  edges: [
    { id: 'm1', source: 'user', target: 'idp', label: 'sign in' },
    { id: 'm2', source: 'idp', target: 'user', label: 'token' },
  ],
  boundaries: [{ id: 't', label: 'Trusted identity provider', kind: 'trust', nodeIds: ['idp'] }],
  states: [
    { id: 's0', label: 's0', description: 'start' },
    { id: 's1', label: 's1', description: 'asks' },
  ],
};

describe('SvgSequenceScene', () => {
  it('renders actors as focusable buttons and the message labels', () => {
    render(<SvgSequenceScene scene={sequence} stateIndex={1} selectedNodeId={null} onSelectNode={() => {}} />);
    expect(screen.getByRole('button', { name: 'User — select to inspect' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Identity provider — select to inspect' })).toBeInTheDocument();
    expect(screen.getByText('sign in')).toBeInTheDocument();
  });

  it('draws a trust boundary band for the identity provider', () => {
    render(<SvgSequenceScene scene={sequence} stateIndex={0} selectedNodeId={null} onSelectNode={() => {}} />);
    expect(screen.getByText('Trusted identity provider')).toBeInTheDocument();
  });

  it('selects an actor from the keyboard', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<SvgSequenceScene scene={sequence} stateIndex={0} selectedNodeId={null} onSelectNode={onSelect} />);
    screen.getByRole('button', { name: 'User — select to inspect' }).focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('user');
  });
});
