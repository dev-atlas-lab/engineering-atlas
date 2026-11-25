import { describe, it, expect } from 'vitest';
import { edgeStyle, nodeStyle, nodeWidth, wrapLabel, GEOMETRY } from './svg-tokens';

describe('wrapLabel', () => {
  it('keeps a short label on one line', () => {
    expect(wrapLabel('Web VM')).toEqual(['Web VM']);
  });

  it('wraps a long label to two lines near the middle on a word boundary', () => {
    const lines = wrapLabel('Management group: Corp environment');
    expect(lines).toHaveLength(2);
    expect(lines.join(' ')).toBe('Management group: Corp environment');
    expect(lines.every((l) => !l.startsWith(' ') && !l.endsWith(' '))).toBe(true);
  });

  it('never splits a single long word', () => {
    expect(wrapLabel('supercalifragilisticexpialidocious')).toHaveLength(1);
  });
});

describe('nodeWidth', () => {
  it('clamps within the configured range', () => {
    expect(nodeWidth(['x'])).toBe(GEOMETRY.nodeMinWidth);
    expect(nodeWidth(['a very long single line that would overflow the maximum width'])).toBe(GEOMETRY.nodeMaxWidth);
  });

  it('grows with the longest line', () => {
    expect(nodeWidth(['medium length label'])).toBeGreaterThan(nodeWidth(['short']));
  });
});

describe('edgeStyle', () => {
  it('draws a structural dependency dashed and without an arrow', () => {
    const s = edgeStyle({ edgeType: 'dependency' }, false);
    expect(s.dash).toBe('4 4');
    expect(s.showArrow).toBe(false);
    expect(s.animated).toBe(false);
  });

  it('gives a plain request a solid neutral line with an arrow', () => {
    const s = edgeStyle({ edgeType: 'request' }, false);
    expect(s.showArrow).toBe(true);
    expect(s.stroke).toBe('stroke-text-muted');
    expect(s.dash).toBeUndefined();
  });

  it('colours a denied flow with the error token and a matching arrow fill', () => {
    const s = edgeStyle({ flow: 'deny' }, false);
    expect(s.stroke).toBe('stroke-error');
    expect(s.fill).toBe('fill-error');
    expect(s.showArrow).toBe(true);
  });

  it('animates a blocked and a pending flow, dashed', () => {
    expect(edgeStyle({ flow: 'blocked' }, false).dash).toBe('6 5');
    const pending = edgeStyle({ flow: 'pending' }, false);
    expect(pending.animated).toBe(true);
    expect(pending.stroke).toBe('stroke-warning');
  });

  it('emphasises the current step in accent when no flow is set', () => {
    const s = edgeStyle({ edgeType: 'request' }, true);
    expect(s.animated).toBe(true);
    expect(s.stroke).toBe('stroke-accent');
  });

  it('keeps the flow colour even when active', () => {
    const s = edgeStyle({ flow: 'deny' }, true);
    expect(s.stroke).toBe('stroke-error');
    expect(s.animated).toBe(true);
  });
});

describe('nodeStyle', () => {
  it('prioritises selection over status', () => {
    expect(nodeStyle('error', true).stroke).toBe('stroke-accent');
  });

  it('maps each status to a distinct colour', () => {
    expect(nodeStyle('error', false).stroke).toBe('stroke-error');
    expect(nodeStyle('active', false).stroke).toBe('stroke-success');
    expect(nodeStyle('inactive', false).stroke).toBe('stroke-border');
    expect(nodeStyle(undefined, false).stroke).toBe('stroke-border');
  });
});
