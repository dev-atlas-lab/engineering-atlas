import { describe, it, expect } from 'vitest';
import type { SceneDefinition } from '../types';
import { layoutScene } from './svg-layout';

const scene: SceneDefinition = {
  id: 's',
  type: 'topology',
  title: 'Test',
  nodes: [
    { id: 'a', type: 'server', label: 'A', position: { x: 0, y: 0 }, data: {} },
    { id: 'b', type: 'database', label: 'B', position: { x: 0, y: 200 }, data: {} },
  ],
  edges: [{ id: 'e', source: 'a', target: 'b' }],
  boundaries: [{ id: 'bnd', label: 'Group', kind: 'network', nodeIds: ['a', 'b'] }],
  states: [{ id: 's0', label: 's0', description: '' }],
};

describe('layoutScene', () => {
  it('places each node at its authored position with a sized box', () => {
    const layout = layoutScene(scene, 0);
    const a = layout.nodes.find((n) => n.node.id === 'a')!;
    expect(a.rect.x).toBe(0);
    expect(a.rect.y).toBe(0);
    expect(a.rect.w).toBeGreaterThan(0);
    expect(a.rect.h).toBeGreaterThan(0);
  });

  it('clips an edge to the node borders, not their centres', () => {
    const layout = layoutScene(scene, 0);
    const e = layout.edges[0]!;
    const a = layout.nodes.find((n) => n.node.id === 'a')!;
    const b = layout.nodes.find((n) => n.node.id === 'b')!;
    // A is above B, so the edge leaves A's bottom edge and enters B's top edge.
    expect(e.y1).toBeCloseTo(a.rect.y + a.rect.h, 5);
    expect(e.y2).toBeCloseTo(b.rect.y, 5);
    expect(e.y1).toBeLessThan(e.y2);
  });

  it('drops an edge whose endpoint is missing', () => {
    const broken = { ...scene, edges: [{ id: 'x', source: 'a', target: 'ghost' }] };
    expect(layoutScene(broken, 0).edges).toHaveLength(0);
  });

  it('wraps a boundary around its member nodes with padding', () => {
    const layout = layoutScene(scene, 0);
    const bnd = layout.boundaries[0]!;
    const a = layout.nodes.find((n) => n.node.id === 'a')!;
    expect(bnd.rect.x).toBeLessThan(a.rect.x);
    expect(bnd.rect.y).toBeLessThan(a.rect.y);
    expect(bnd.rect.w).toBeGreaterThan(a.rect.w);
  });

  it('produces a viewBox that contains every node and boundary', () => {
    const layout = layoutScene(scene, 0);
    const [vx, vy, vw, vh] = layout.viewBox.split(' ').map(Number);
    const bnd = layout.boundaries[0]!.rect;
    expect(vx).toBeLessThanOrEqual(bnd.x);
    expect(vy).toBeLessThanOrEqual(bnd.y);
    expect(vx! + vw!).toBeGreaterThanOrEqual(bnd.x + bnd.w);
    expect(vy! + vh!).toBeGreaterThanOrEqual(bnd.y + bnd.h);
    expect(layout.width).toBe(vw);
    expect(layout.height).toBe(vh);
  });

  it('applies the active state overrides when resolving', () => {
    const withState: SceneDefinition = {
      ...scene,
      states: [
        { id: 's0', label: 's0', description: '' },
        { id: 's1', label: 's1', description: '', nodeOverrides: { a: { status: 'error' } } },
      ],
    };
    expect(layoutScene(withState, 1).nodes.find((n) => n.node.id === 'a')!.node.status).toBe('error');
    expect(layoutScene(withState, 0).nodes.find((n) => n.node.id === 'a')!.node.status).toBeUndefined();
  });
});
