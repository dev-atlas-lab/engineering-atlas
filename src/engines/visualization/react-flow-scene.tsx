import { useMemo, useCallback, type MouseEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type NodeProps,
  type Edge,
  type OnNodesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { primitiveIcons, statusDotClass } from './primitives';
import { resolveSceneAtState, type SceneDefinition, type ScenePrimitive } from './types';

interface FlowNodeData extends Record<string, unknown> {
  label: string;
  primitiveType: ScenePrimitive;
  status?: 'active' | 'inactive' | 'error';
}

type FlowNode = Node<FlowNodeData>;

function PrimitiveNode({ data, selected }: NodeProps<FlowNode>) {
  const Icon = primitiveIcons[data.primitiveType];
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border bg-surface px-3 py-2 shadow-sm ${
        selected ? 'border-accent' : 'border-border'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-text-muted" />
      <Icon className="size-4 text-text-secondary" />
      <span className="text-[13px] font-medium text-text">{data.label}</span>
      {data.status && <span className={`size-1.5 rounded-full ${statusDotClass[data.status]}`} />}
      <Handle type="source" position={Position.Bottom} className="!bg-text-muted" />
    </div>
  );
}

const nodeTypes = { primitive: PrimitiveNode };

interface ReactFlowSceneProps {
  scene: SceneDefinition;
  stateIndex: number;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

export function ReactFlowScene({ scene, stateIndex, selectedNodeId, onSelectNode }: ReactFlowSceneProps) {
  const { nodes: sceneNodes, edges: sceneEdges } = resolveSceneAtState(scene, stateIndex);

  const flowNodes: FlowNode[] = useMemo(
    () =>
      sceneNodes.map((n) => ({
        id: n.id,
        type: 'primitive',
        position: n.position,
        selected: n.id === selectedNodeId,
        ariaLabel: `${n.label} — select to inspect`,
        data: { label: n.label, primitiveType: n.type, status: n.status },
      })),
    [sceneNodes, selectedNodeId],
  );

  // Keyboard selection (Tab to a node, Enter/Space) arrives as a 'select'
  // change, not a click — handling it here is what lets the inspector work
  // without a mouse.
  const handleNodesChange: OnNodesChange<FlowNode> = useCallback(
    (changes) => {
      const selections = changes.getByType('select');
      const picked = selections.find((change) => change.selected);
      if (picked) onSelectNode(picked.id);
      else if (selections.length > 0) onSelectNode(null);
    },
    [onSelectNode],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      sceneEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.animated,
      })),
    [sceneEdges],
  );

  const handleNodeClick = useCallback(
    (_event: MouseEvent, node: FlowNode) => onSelectNode(node.id),
    [onSelectNode],
  );

  return (
    <div className="h-80 rounded-lg border border-border bg-bg-subtle sm:h-96" role="group" aria-label={scene.title}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={() => onSelectNode(null)}
        fitView
        // The default minimum zoom (0.5) stops fitView from fitting wide
        // diagrams on phone-width screens, so the initial view clipped nodes.
        // The left padding keeps the zoom controls from covering a node.
        minZoom={0.2}
        fitViewOptions={{ padding: { top: '16px', right: '16px', bottom: '16px', left: '56px' } }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
