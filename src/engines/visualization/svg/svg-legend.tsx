import type { ReactNode } from 'react';
import type { BoundaryKind, EdgeFlow, SceneDefinition } from '../types';
import { boundaryStyle, flowMeta } from './svg-tokens';

/** The flows, boundaries, and node states a scene uses anywhere across its
 *  states — so the legend is stable as the learner steps through. */
export function sceneConventions(scene: SceneDefinition) {
  const flows = new Set<EdgeFlow>();
  for (const edge of scene.edges) if (edge.flow) flows.add(edge.flow);
  const boundaries = new Set<BoundaryKind>();
  for (const b of scene.boundaries ?? []) boundaries.add(b.kind);
  let hasError = false;
  let hasActive = false;
  const scan = (status?: string) => {
    if (status === 'error') hasError = true;
    if (status === 'active') hasActive = true;
  };
  for (const node of scene.nodes) scan(node.status);
  for (const state of scene.states) {
    for (const edge of Object.values(state.edgeOverrides ?? {})) if (edge.flow) flows.add(edge.flow);
    for (const node of Object.values(state.nodeOverrides ?? {})) scan(node.status);
  }
  return { flows: [...flows], boundaries: [...boundaries], hasError, hasActive };
}

function Swatch({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block size-2.5 rounded-sm ${className}`} />;
}

function Line({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block h-0 w-4 border-t-2 ${className}`} />;
}

/** A compact, text-based key for the conventions a scene uses. Rendered as
 *  HTML below the SVG so it reflows on narrow screens and is fully readable by
 *  a screen reader — none of this information is hover-only. */
export function SvgLegend({ scene }: { scene: SceneDefinition }) {
  const { flows, boundaries, hasError, hasActive } = sceneConventions(scene);
  const items: { key: string; mark: ReactNode; label: string }[] = [];

  for (const flow of flows) items.push({ key: `flow-${flow}`, mark: <Swatch className={flowMeta[flow].swatch} />, label: flowMeta[flow].label });
  if (hasActive) items.push({ key: 'active', mark: <Swatch className="bg-success" />, label: 'Active / healthy' });
  if (hasError) items.push({ key: 'error', mark: <Swatch className="bg-error" />, label: 'Failed / compromised' });
  for (const kind of boundaries) {
    items.push({ key: `b-${kind}`, mark: <Line className={`${boundaryStyle[kind].border} border-dashed`} />, label: boundaryStyle[kind].label });
  }

  if (items.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-text-secondary" aria-label="Legend">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          {item.mark}
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
