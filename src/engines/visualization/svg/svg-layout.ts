// Pure geometry for an SVG topology scene: node boxes, edge endpoints clipped
// to those boxes, boundary rectangles, and the viewBox that contains them all.
// No DOM and no React — so it is unit-testable and deterministic.

import { resolveSceneAtState, type SceneBoundary, type SceneDefinition, type SceneEdge, type SceneNode } from '../types';
import { GEOMETRY, nodeWidth, wrapLabel } from './svg-tokens';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlacedNode {
  node: SceneNode;
  rect: Rect;
  lines: string[];
}

export interface PlacedEdge {
  edge: SceneEdge;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
}

export interface PlacedBoundary {
  boundary: SceneBoundary;
  rect: Rect;
}

export interface SceneLayout {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  boundaries: PlacedBoundary[];
  viewBox: string;
  width: number;
  height: number;
}

function centerToBorder(rect: Rect, towardX: number, towardY: number): { x: number; y: number } {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const dx = towardX - cx;
  const dy = towardY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hw = rect.w / 2;
  const hh = rect.h / 2;
  const tx = dx === 0 ? Infinity : hw / Math.abs(dx);
  const ty = dy === 0 ? Infinity : hh / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: cx + dx * t, y: cy + dy * t };
}

export function layoutScene(scene: SceneDefinition, stateIndex: number): SceneLayout {
  const { nodes, edges } = resolveSceneAtState(scene, stateIndex);

  const placed: PlacedNode[] = nodes.map((node) => {
    const lines = wrapLabel(node.label);
    const w = nodeWidth(lines);
    const h = lines.length > 1 ? GEOMETRY.nodeHeight2 : GEOMETRY.nodeHeight1;
    return { node, rect: { x: node.position.x, y: node.position.y, w, h }, lines };
  });
  const byId = new Map(placed.map((p) => [p.node.id, p]));

  const placedEdges: PlacedEdge[] = edges.flatMap((edge) => {
    const from = byId.get(edge.source);
    const to = byId.get(edge.target);
    if (!from || !to) return [];
    const fc = { x: from.rect.x + from.rect.w / 2, y: from.rect.y + from.rect.h / 2 };
    const tc = { x: to.rect.x + to.rect.w / 2, y: to.rect.y + to.rect.h / 2 };
    const start = centerToBorder(from.rect, tc.x, tc.y);
    const end = centerToBorder(to.rect, fc.x, fc.y);
    return [{ edge, x1: start.x, y1: start.y, x2: end.x, y2: end.y, labelX: (start.x + end.x) / 2, labelY: (start.y + end.y) / 2 }];
  });

  const placedBoundaries: PlacedBoundary[] = (scene.boundaries ?? []).flatMap((boundary) => {
    const members = boundary.nodeIds.map((id) => byId.get(id)).filter((p): p is PlacedNode => Boolean(p));
    if (members.length === 0) return [];
    const minX = Math.min(...members.map((m) => m.rect.x));
    const minY = Math.min(...members.map((m) => m.rect.y));
    const maxX = Math.max(...members.map((m) => m.rect.x + m.rect.w));
    const maxY = Math.max(...members.map((m) => m.rect.y + m.rect.h));
    const pad = GEOMETRY.boundaryPad;
    return [
      {
        boundary,
        rect: {
          x: minX - pad,
          y: minY - pad - GEOMETRY.boundaryLabelHeight,
          w: maxX - minX + pad * 2,
          h: maxY - minY + pad * 2 + GEOMETRY.boundaryLabelHeight,
        },
      },
    ];
  });

  const boxes: Rect[] = [...placed.map((p) => p.rect), ...placedBoundaries.map((b) => b.rect)];
  const pad = GEOMETRY.scenePad;
  const minX = Math.min(...boxes.map((b) => b.x)) - pad;
  const minY = Math.min(...boxes.map((b) => b.y)) - pad;
  const maxX = Math.max(...boxes.map((b) => b.x + b.w)) + pad;
  const maxY = Math.max(...boxes.map((b) => b.y + b.h)) + pad;
  const width = Math.round(maxX - minX);
  const height = Math.round(maxY - minY);

  return {
    nodes: placed,
    edges: placedEdges,
    boundaries: placedBoundaries,
    viewBox: `${Math.round(minX)} ${Math.round(minY)} ${width} ${height}`,
    width,
    height,
  };
}
