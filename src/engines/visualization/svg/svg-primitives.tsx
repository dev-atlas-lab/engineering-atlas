import type { KeyboardEvent } from 'react';
import { cn } from '../../../lib/utils';
import { primitiveIcons } from '../primitives';
import type { PlacedBoundary, PlacedEdge, PlacedNode } from './svg-layout';
import { boundaryStyle, edgeStyle, GEOMETRY, nodeOpacity, nodeStyle } from './svg-tokens';

// --- Boundary ---------------------------------------------------------------
// A labelled container drawn behind the nodes: a trust boundary, network,
// region, or scope. Decorative, so it is hidden from the accessibility tree
// (its meaning is also in the inspector and step text).

export function SvgBoundary({ placed }: { placed: PlacedBoundary }) {
  const style = boundaryStyle[placed.boundary.kind];
  const { x, y, w, h } = placed.rect;
  return (
    <g aria-hidden>
      <rect x={x} y={y} width={w} height={h} rx={10} className={cn('fill-none', style.stroke, style.fill)} strokeWidth={1} strokeDasharray="5 4" />
      <text x={x + 10} y={y + 13} className={cn('text-[11px] font-medium', style.text)} fill="currentColor">
        {placed.boundary.label}
      </text>
    </g>
  );
}

// --- Edge -------------------------------------------------------------------

export function SvgEdge({ placed, active }: { placed: PlacedEdge; active: boolean }) {
  const { edge, x1, y1, x2, y2, labelX, labelY } = placed;
  const style = edgeStyle(edge, active);

  // Arrowhead as an inline polygon so its colour matches the line in every
  // browser (marker context-stroke support is uneven).
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const a = GEOMETRY.arrow;
  const arrow = `${x2},${y2} ${x2 - ux * a - uy * (a * 0.6)},${y2 - uy * a + ux * (a * 0.6)} ${x2 - ux * a + uy * (a * 0.6)},${y2 - uy * a - ux * (a * 0.6)}`;

  const labelChipW = edge.label ? edge.label.length * 5.7 + 10 : 0;

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth={style.width}
        strokeDasharray={style.dash}
        className={cn(style.stroke, style.animated && 'atlas-flow')}
      />
      {style.showArrow && <polygon points={arrow} className={cn('stroke-none', style.fill)} />}
      {edge.label && (
        <g>
          <rect x={labelX - labelChipW / 2} y={labelY - 9} width={labelChipW} height={16} rx={3} className="fill-bg-subtle" />
          <text x={labelX} y={labelY + 2} textAnchor="middle" className="fill-text-secondary text-[11px]">
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
}

// --- Node -------------------------------------------------------------------

interface SvgNodeProps {
  placed: PlacedNode;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function SvgNode({ placed, selected, onSelect }: SvgNodeProps) {
  const { node, rect, lines } = placed;
  const Icon = primitiveIcons[node.type];
  const style = nodeStyle(node.status, selected);

  const iconX = rect.x + GEOMETRY.nodePadX;
  const iconY = rect.y + rect.h / 2 - GEOMETRY.iconSize / 2;
  const textX = iconX + GEOMETRY.iconSize + GEOMETRY.iconGap;
  const firstLineY = lines.length > 1 ? rect.y + rect.h / 2 - 5 : rect.y + rect.h / 2 + 4;

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(node.id);
    }
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${node.label} — select to inspect`}
      aria-pressed={selected}
      onClick={() => onSelect(node.id)}
      onKeyDown={handleKeyDown}
      className="group/node cursor-pointer outline-none"
      opacity={nodeOpacity(node.status)}
    >
      {/* Visible focus ring, distinct from the selection border. */}
      <rect
        x={rect.x - 3}
        y={rect.y - 3}
        width={rect.w + 6}
        height={rect.h + 6}
        rx={10}
        className="fill-none stroke-accent opacity-0 group-focus-visible/node:opacity-100"
        strokeWidth={2}
      />
      <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={8} strokeWidth={style.strokeWidth} className={cn(style.fill, style.stroke)} />
      <Icon x={iconX} y={iconY} width={GEOMETRY.iconSize} height={GEOMETRY.iconSize} className={style.icon} aria-hidden />
      <text className="fill-text text-[12px] font-medium">
        {lines.map((line, i) => (
          <tspan key={line} x={textX} y={firstLineY + i * 14}>
            {line}
          </tspan>
        ))}
      </text>
      {node.status && node.status !== 'active' && (
        <circle cx={rect.x + rect.w - 8} cy={rect.y + 8} r={3} className={node.status === 'error' ? 'fill-error' : 'fill-text-muted'} />
      )}
    </g>
  );
}
