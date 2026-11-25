// The visual language for every SVG scene (topology and sequence). One place
// defines how each node kind, edge kind, flow outcome, boundary, and state is
// drawn, so diagrams across the whole product read as one system. Colours are
// the existing theme tokens (Tailwind `stroke-*`/`fill-*` utilities that map to
// CSS variables), so everything adapts to light and dark automatically. No
// diagram introduces its own colours — see docs/SVG_VISUALIZATION_STANDARD.md.

import type { BoundaryKind, EdgeFlow, ScenePrimitive, SceneEdge, SceneNode } from '../types';

// --- Geometry ---------------------------------------------------------------

export const GEOMETRY = {
  nodeMinWidth: 124,
  nodeMaxWidth: 216,
  nodeHeight1: 42, // one label line
  nodeHeight2: 56, // two label lines
  nodePadX: 12,
  iconSize: 15,
  iconGap: 7,
  labelFont: 12,
  charWidth: 6.4, // estimate for the 12px system font (no DOM measurement in SVG)
  edgeLabelFont: 11,
  arrow: 7,
  boundaryPad: 18,
  boundaryLabelHeight: 18,
  scenePad: 22,
} as const;

/** Where a node label wraps to a second line. */
export const LABEL_WRAP_CHARS = 20;

// --- Node kinds -------------------------------------------------------------

/** A broad role for each primitive, used only to group the legend. The icon
 *  itself comes from primitives.ts; this keeps the two in one conceptual map. */
export const primitiveRole: Record<ScenePrimitive, string> = {
  client: 'Actor / external',
  user: 'Actor / external',
  server: 'Compute',
  function: 'Compute',
  host: 'Compute',
  database: 'Data',
  storage: 'Data',
  queue: 'Data',
  secret: 'Security',
  key: 'Security',
  policy: 'Security',
  firewall: 'Security',
  identity: 'Identity',
  gateway: 'Network',
  loadbalancer: 'Network',
  network: 'Network',
  region: 'Infrastructure',
  availabilityZone: 'Infrastructure',
  scope: 'Infrastructure',
};

// --- Node status ------------------------------------------------------------

export type NodeStatus = NonNullable<SceneNode['status']>;

export interface NodeStyle {
  stroke: string;
  fill: string;
  icon: string;
  strokeWidth: number;
}

/** Resolves a node's box styling from its status and whether it is selected.
 *  Selection always wins the border so the inspector target is unmistakable. */
export function nodeStyle(status: NodeStatus | undefined, selected: boolean): NodeStyle {
  if (selected) return { stroke: 'stroke-accent', fill: 'fill-surface', icon: 'text-accent', strokeWidth: 2 };
  switch (status) {
    case 'error':
      return { stroke: 'stroke-error', fill: 'fill-error/5', icon: 'text-error', strokeWidth: 1.5 };
    case 'inactive':
      return { stroke: 'stroke-border', fill: 'fill-bg-subtle', icon: 'text-text-muted', strokeWidth: 1 };
    case 'active':
      return { stroke: 'stroke-success', fill: 'fill-surface', icon: 'text-success', strokeWidth: 1.5 };
    default:
      return { stroke: 'stroke-border', fill: 'fill-surface', icon: 'text-text-secondary', strokeWidth: 1 };
  }
}

/** Faded when a state has moved past or not yet reached this element. */
export function nodeOpacity(status: NodeStatus | undefined): number {
  return status === 'inactive' ? 0.55 : 1;
}

// --- Edges ------------------------------------------------------------------

export interface EdgeStyle {
  stroke: string; // Tailwind stroke-* class
  fill: string; // matching fill-* class for the arrowhead (literal, so Tailwind keeps it)
  dash?: string; // strokeDasharray
  animated: boolean;
  width: number;
  showArrow: boolean;
}

// stroke + matching arrow fill as literal class pairs.
const PALETTE = {
  muted: { stroke: 'stroke-text-muted', fill: 'fill-text-muted' },
  accent: { stroke: 'stroke-accent', fill: 'fill-accent' },
  error: { stroke: 'stroke-error', fill: 'fill-error' },
  warning: { stroke: 'stroke-warning', fill: 'fill-warning' },
} as const;

const flowColor: Record<EdgeFlow, keyof typeof PALETTE> = {
  allow: 'accent',
  deny: 'error',
  blocked: 'error',
  pending: 'warning',
};

/** Resolves an edge's line styling. `edgeType` sets the base (structural
 *  dependency vs. a communicating request/data link); `flow` sets the
 *  outcome colour; `active` is the current step's emphasis. */
export function edgeStyle(edge: Pick<SceneEdge, 'edgeType' | 'flow' | 'animated'>, active: boolean): EdgeStyle {
  const structural = edge.edgeType === 'dependency';
  const network = edge.edgeType === 'network';
  let color: keyof typeof PALETTE = 'muted';
  const base: EdgeStyle = {
    ...PALETTE.muted,
    dash: structural ? '4 4' : network ? '2 5' : undefined,
    animated: false,
    width: 1,
    showArrow: !structural,
  };
  if (edge.flow) {
    color = flowColor[edge.flow];
    base.width = 1.75;
    if (edge.flow === 'blocked' || edge.flow === 'pending') base.dash = '6 5';
    if (edge.flow === 'pending') base.animated = true;
    base.showArrow = true;
  }
  if (edge.animated || active) {
    base.animated = true;
    base.width = Math.max(base.width, 1.75);
    if (!edge.flow) color = 'accent';
    base.dash = base.dash ?? '6 5';
    base.showArrow = true;
  }
  base.stroke = PALETTE[color].stroke;
  base.fill = PALETTE[color].fill;
  return base;
}

export const flowMeta: Record<EdgeFlow, { label: string; swatch: string }> = {
  allow: { label: 'Allowed path', swatch: 'bg-accent' },
  deny: { label: 'Denied by policy', swatch: 'bg-error' },
  blocked: { label: 'Blocked / dropped', swatch: 'bg-error' },
  pending: { label: 'In progress', swatch: 'bg-warning' },
};

export const edgeTypeMeta: Partial<Record<NonNullable<SceneEdge['edgeType']>, string>> = {
  data: 'Data',
  request: 'Request',
  response: 'Response',
  dependency: 'Depends on / contains',
  network: 'Network link',
};

// --- Boundaries -------------------------------------------------------------

export interface BoundaryStyle {
  stroke: string;
  fill: string;
  border: string; // matching border-* class for the HTML legend (literal)
  label: string;
  text: string;
}

export const boundaryStyle: Record<BoundaryKind, BoundaryStyle> = {
  trust: { stroke: 'stroke-warning', fill: 'fill-warning/5', border: 'border-warning', label: 'Trust boundary', text: 'text-warning' },
  network: { stroke: 'stroke-info', fill: 'fill-info/5', border: 'border-info', label: 'Network', text: 'text-info' },
  region: { stroke: 'stroke-text-muted', fill: 'fill-bg-subtle/40', border: 'border-text-muted', label: 'Region', text: 'text-text-muted' },
  scope: { stroke: 'stroke-text-muted', fill: 'fill-bg-subtle/40', border: 'border-text-muted', label: 'Scope', text: 'text-text-muted' },
  zone: { stroke: 'stroke-border', fill: 'fill-bg-subtle/40', border: 'border-border', label: 'Zone', text: 'text-text-muted' },
};

// --- Label layout -----------------------------------------------------------

/** Wraps a label to at most two lines near a word boundary, for node boxes. */
export function wrapLabel(label: string): string[] {
  if (label.length <= LABEL_WRAP_CHARS) return [label];
  const words = label.split(' ');
  if (words.length === 1) return [label];
  const target = Math.ceil(label.length / 2);
  let line1 = '';
  let i = 0;
  while (i < words.length && (line1.length + words[i]!.length <= target || line1 === '')) {
    line1 = line1 ? `${line1} ${words[i]}` : words[i]!;
    i++;
  }
  const line2 = words.slice(i).join(' ');
  return line2 ? [line1, line2] : [line1];
}

/** Estimated pixel width of a node box that fits its label. */
export function nodeWidth(lines: string[]): number {
  const longest = Math.max(...lines.map((l) => l.length));
  const raw = GEOMETRY.iconSize + GEOMETRY.iconGap + longest * GEOMETRY.charWidth + GEOMETRY.nodePadX * 2;
  return Math.round(Math.min(Math.max(raw, GEOMETRY.nodeMinWidth), GEOMETRY.nodeMaxWidth));
}
