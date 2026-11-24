import { ReactFlowScene } from './react-flow-scene';
import { SequenceScene } from './sequence-scene';
import type { SceneDefinition } from './types';

interface SceneRendererProps {
  scene: SceneDefinition;
  stateIndex: number;
  onSelectNode: (nodeId: string | null) => void;
}

/** Picks the rendering strategy from `scene.type` — see docs/VISUALIZATION_ENGINE.md. */
export function SceneRenderer({ scene, stateIndex, onSelectNode }: SceneRendererProps) {
  switch (scene.type) {
    case 'topology':
      return <ReactFlowScene scene={scene} stateIndex={stateIndex} onSelectNode={onSelectNode} />;
    case 'sequence':
      return <SequenceScene scene={scene} stateIndex={stateIndex} onSelectNode={onSelectNode} />;
  }
}
