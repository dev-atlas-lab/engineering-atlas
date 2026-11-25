import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { SceneDefinition } from './types';
import { SceneRenderer } from './scene-renderer';

const base = {
  id: 'x',
  title: 'Scene',
  nodes: [
    { id: 'a', type: 'server' as const, label: 'A', position: { x: 0, y: 0 }, data: {} },
    { id: 'b', type: 'database' as const, label: 'B', position: { x: 0, y: 160 }, data: {} },
  ],
  edges: [{ id: 'e', source: 'a', target: 'b' }],
  states: [{ id: 's0', label: 's0', description: '' }],
};

const noop = () => {};

describe('SceneRenderer dispatch', () => {
  it('renders a topology scene as SVG by default (no React Flow)', () => {
    const scene: SceneDefinition = { ...base, type: 'topology' };
    const { container } = render(<SceneRenderer scene={scene} stateIndex={0} selectedNodeId={null} onSelectNode={noop} />);
    expect(container.querySelector('svg title')?.textContent).toBe('Scene');
    expect(container.querySelector('.react-flow')).toBeNull();
    expect(screen.getByRole('button', { name: 'A — select to inspect' })).toBeInTheDocument();
  });

  it('renders a sequence scene as SVG', () => {
    const scene: SceneDefinition = { ...base, type: 'sequence' };
    const { container } = render(<SceneRenderer scene={scene} stateIndex={0} selectedNodeId={null} onSelectNode={noop} />);
    expect(container.querySelector('svg title')?.textContent).toBe('Scene');
  });

  it('lazy-loads React Flow only when a scene opts into graph interaction', async () => {
    const scene: SceneDefinition = { ...base, type: 'topology', interaction: 'graph' };
    const { container } = render(<SceneRenderer scene={scene} stateIndex={0} selectedNodeId={null} onSelectNode={noop} />);
    // First paint shows the Suspense fallback while the chunk loads.
    expect(screen.getByRole('status', { name: 'Loading diagram' })).toBeInTheDocument();
    // Then React Flow mounts.
    await waitFor(() => expect(container.querySelector('.react-flow')).toBeTruthy());
  });
});
