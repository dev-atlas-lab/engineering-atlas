import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentInspector } from './component-inspector';
import type { SceneNode } from './types';

const node: SceneNode = { id: 'db', type: 'database', label: 'Orders DB', position: { x: 0, y: 0 }, data: { Engine: 'PostgreSQL' }, status: 'active' };

describe('ComponentInspector', () => {
  it('prompts when nothing is selected', () => {
    render(<ComponentInspector node={null} onClose={() => {}} />);
    expect(screen.getByText(/Click a component/)).toBeInTheDocument();
  });

  it('shows the selected node, its data, status, and close control', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ComponentInspector node={node} onClose={onClose} />);
    expect(screen.getByRole('heading', { name: 'Orders DB' })).toBeInTheDocument();
    expect(screen.getByText('Engine')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close inspector' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('lists the node’s connections with direction and edge label', () => {
    render(
      <ComponentInspector
        node={node}
        onClose={() => {}}
        connections={[
          { id: 'e1', direction: 'in', otherLabel: 'App tier', edgeLabel: 'SQL over TLS' },
          { id: 'e2', direction: 'out', otherLabel: 'Replica', edgeLabel: 'replication' },
        ]}
      />,
    );
    expect(screen.getByText('Connections')).toBeInTheDocument();
    expect(screen.getByText('App tier')).toBeInTheDocument();
    expect(screen.getByText('Replica')).toBeInTheDocument();
    expect(screen.getByText(/SQL over TLS/)).toBeInTheDocument();
  });

  it('omits the connections section when there are none', () => {
    render(<ComponentInspector node={node} onClose={() => {}} connections={[]} />);
    expect(screen.queryByText('Connections')).not.toBeInTheDocument();
  });
});
