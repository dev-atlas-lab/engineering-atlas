import { useId } from 'react';
import type { SceneDefinition } from '../types';
import { layoutScene } from './svg-layout';
import { SvgBoundary, SvgEdge, SvgNode } from './svg-primitives';
import { SvgLegend } from './svg-legend';

interface SvgTopologySceneProps {
  scene: SceneDefinition;
  stateIndex: number;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

/**
 * Declarative SVG renderer for topology scenes (ADR-008). Draws boundaries,
 * edges, and focusable nodes from the scene's existing `SceneDefinition`, with
 * an accessible title/description and a legend. Boundaries render behind
 * edges, which render behind nodes, so node boxes and labels stay on top.
 */
export function SvgTopologyScene({ scene, stateIndex, selectedNodeId, onSelectNode }: SvgTopologySceneProps) {
  const layout = layoutScene(scene, stateIndex);
  const titleId = useId();
  const descId = useId();

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-4">
        <svg
          viewBox={layout.viewBox}
          width={layout.width}
          height={layout.height}
          className="min-w-full"
          role="group"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <title id={titleId}>{scene.title}</title>
          <desc id={descId}>{scene.description ?? scene.title}</desc>

          {layout.boundaries.map((b) => (
            <SvgBoundary key={b.boundary.id} placed={b} />
          ))}
          {layout.edges.map((e) => (
            <SvgEdge key={e.edge.id} placed={e} active={false} />
          ))}
          {layout.nodes.map((n) => (
            <SvgNode key={n.node.id} placed={n} selected={n.node.id === selectedNodeId} onSelect={onSelectNode} />
          ))}
        </svg>
      </div>
      <SvgLegend scene={scene} />
    </div>
  );
}
