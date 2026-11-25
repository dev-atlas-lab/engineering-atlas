import { useMemo, useState } from 'react';
import { SceneRenderer } from './scene-renderer';
import { TimelineController } from './timeline-controller';
import { ComponentInspector, type NodeConnection } from './component-inspector';
import { resolveSceneAtState, type SceneDefinition } from './types';

interface VisualizationRegionProps {
  scene: SceneDefinition;
}

/**
 * The workspace's Visualization Region (docs/M1B_LEARNING_WORKSPACE_SPEC.md §4):
 * scene + timeline and step explanation (when the scene has more than one
 * state) + inspector. Callers key this by scene so switching scenes resets
 * the step index and selection.
 */
export function VisualizationRegion({ scene }: VisualizationRegionProps) {
  const [stateIndex, setStateIndex] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { nodes, edges, state } = useMemo(() => resolveSceneAtState(scene, stateIndex), [scene, stateIndex]);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const connections = useMemo<NodeConnection[]>(() => {
    if (!selectedNodeId) return [];
    const labelOf = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;
    return edges.flatMap<NodeConnection>((edge) => {
      if (edge.source === selectedNodeId) return [{ id: edge.id, direction: 'out', otherLabel: labelOf(edge.target), edgeLabel: edge.label }];
      if (edge.target === selectedNodeId) return [{ id: edge.id, direction: 'in', otherLabel: labelOf(edge.source), edgeLabel: edge.label }];
      return [];
    });
  }, [edges, nodes, selectedNodeId]);

  return (
    <div className="space-y-3">
      <SceneRenderer
        scene={scene}
        stateIndex={stateIndex}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
      />

      {scene.states.length > 1 && (
        <>
          <TimelineController
            stepIndex={stateIndex}
            totalSteps={scene.states.length}
            stepLabel={state.label}
            onStepTo={setStateIndex}
          />
          <p aria-live="polite" className="text-[13px] leading-relaxed text-text-secondary">
            {state.description}
          </p>
        </>
      )}

      <ComponentInspector node={selectedNode} connections={connections} onClose={() => setSelectedNodeId(null)} />
    </div>
  );
}
