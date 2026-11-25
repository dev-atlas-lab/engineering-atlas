import { lazy, Suspense } from 'react';
import { SvgTopologyScene } from './svg/svg-topology-scene';
import { SvgSequenceScene } from './svg/svg-sequence-scene';
import type { SceneDefinition } from './types';

// React Flow is loaded only when a scene opts into graph interaction
// (ADR-008). Lazy-importing it keeps @xyflow/react and its stylesheet out of
// the eager lesson chunk; no current scene sets interaction: 'graph'.
const ReactFlowScene = lazy(() => import('./react-flow-scene').then((m) => ({ default: m.ReactFlowScene })));

interface SceneRendererProps {
  scene: SceneDefinition;
  stateIndex: number;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

/** Picks the rendering strategy — see docs/SVG_VISUALIZATION_STANDARD.md and
 *  ADR-008. Declarative SVG is the default; React Flow is the opt-in for
 *  genuine node-dragging / graph navigation. */
export function SceneRenderer(props: SceneRendererProps) {
  if (props.scene.interaction === 'graph') {
    return (
      <Suspense
        fallback={<div role="status" aria-label="Loading diagram" className="h-80 animate-pulse rounded-lg border border-border bg-bg-subtle sm:h-96" />}
      >
        <ReactFlowScene {...props} />
      </Suspense>
    );
  }

  switch (props.scene.type) {
    case 'topology':
      return <SvgTopologyScene {...props} />;
    case 'sequence':
      return <SvgSequenceScene {...props} />;
  }
}
