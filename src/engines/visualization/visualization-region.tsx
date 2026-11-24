import { useMemo, useState } from 'react';
import { SceneRenderer } from './scene-renderer';
import { TimelineController } from './timeline-controller';
import { ComponentInspector } from './component-inspector';
import { resolveSceneAtState, type SceneDefinition } from './types';

interface VisualizationRegionProps {
  scene: SceneDefinition;
}

/**
 * The workspace's Visualization Region (docs/M1B_LEARNING_WORKSPACE_SPEC.md §4):
 * scene + timeline (when the scene has more than one state) + inspector.
 */
export function VisualizationRegion({ scene }: VisualizationRegionProps) {
  const [stateIndex, setStateIndex] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { nodes, state } = useMemo(() => resolveSceneAtState(scene, stateIndex), [scene, stateIndex]);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <div className="space-y-3">
      <SceneRenderer scene={scene} stateIndex={stateIndex} onSelectNode={setSelectedNodeId} />

      {scene.states.length > 1 && (
        <TimelineController
          stepIndex={stateIndex}
          totalSteps={scene.states.length}
          stepLabel={state.label}
          onStepTo={setStateIndex}
        />
      )}

      <ComponentInspector node={selectedNode} onClose={() => setSelectedNodeId(null)} />
    </div>
  );
}
