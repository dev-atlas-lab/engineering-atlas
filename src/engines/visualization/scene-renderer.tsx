import { ReactFlowScene } from './react-flow-scene';
import { SequenceScene } from './sequence-scene';
import type { SceneDefinition } from './types';

interface SceneRendererProps {
  scene: SceneDefinition;
  stateIndex: number;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

/** Picks the rendering strategy from `scene.type` — see docs/VISUALIZATION_ENGINE.md. */
export function SceneRenderer(props: SceneRendererProps) {
  switch (props.scene.type) {
    case 'topology':
      return <ReactFlowScene {...props} />;
    case 'sequence':
      return <SequenceScene {...props} />;
  }
}
