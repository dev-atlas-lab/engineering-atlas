// Visualization engine types — see docs/VISUALIZATION_ENGINE.md.
// Only the `topology` (React Flow) and `sequence` (SVG) scene types are
// implemented in M2; `structure`/`flow`/`timeline`/`custom` are added when a
// concept actually needs one (docs/M1B_DESIGN_DECISIONS.md §2.2 reasoning,
// carried into the M2 implementation plan).

export type ScenePrimitive =
  | 'server'
  | 'database'
  | 'loadbalancer'
  | 'client'
  | 'network'
  | 'queue'
  | 'function'
  | 'storage'
  | 'gateway'
  | 'region'
  | 'availabilityZone'
  | 'host';

export interface SceneNode {
  id: string;
  type: ScenePrimitive;
  label: string;
  position: { x: number; y: number };
  data: Record<string, string | number | boolean>;
  status?: 'active' | 'inactive' | 'error';
}

export interface SceneEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  edgeType?: 'data' | 'request' | 'response' | 'dependency' | 'network';
  animated?: boolean;
}

export interface SceneState {
  id: string;
  label: string;
  description: string;
  nodeOverrides?: Record<string, Partial<Pick<SceneNode, 'status' | 'data' | 'label'>>>;
  edgeOverrides?: Record<string, Partial<Pick<SceneEdge, 'animated' | 'label'>>>;
}

export interface SceneDefinition {
  id: string;
  type: 'topology' | 'sequence';
  title: string;
  nodes: SceneNode[];
  edges: SceneEdge[];
  states: SceneState[]; // always at least one — states[0] is the initial view
}

/** Resolves a scene's nodes/edges as they should render at a given state
 *  index. A SceneDefinition is only ever authored with a non-empty
 *  `states` array (states[0] is always the initial view), so the fallback
 *  below is guaranteed to be defined. */
export function resolveSceneAtState(scene: SceneDefinition, stateIndex: number) {
  const state = scene.states[stateIndex] ?? scene.states[0]!;

  const nodes = scene.nodes.map((node) => ({
    ...node,
    ...state.nodeOverrides?.[node.id],
    data: { ...node.data, ...state.nodeOverrides?.[node.id]?.data },
  }));

  const edges = scene.edges.map((edge) => ({
    ...edge,
    ...state.edgeOverrides?.[edge.id],
  }));

  return { nodes, edges, state };
}
