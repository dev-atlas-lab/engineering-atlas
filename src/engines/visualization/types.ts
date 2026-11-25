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
  | 'host'
  | 'user'
  | 'identity'
  | 'key'
  | 'policy'
  | 'firewall'
  | 'secret'
  | 'scope';

export interface SceneNode {
  id: string;
  type: ScenePrimitive;
  label: string;
  position: { x: number; y: number };
  data: Record<string, string | number | boolean>;
  status?: 'active' | 'inactive' | 'error';
}

/** The outcome a flow represents. Distinguishing these is a technical-accuracy
 *  requirement: an allowed path, a denied one (a policy said no), a blocked one
 *  (a control dropped it), and a pending/in-progress one must look different. */
export type EdgeFlow = 'allow' | 'deny' | 'blocked' | 'pending';

export interface SceneEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  edgeType?: 'data' | 'request' | 'response' | 'dependency' | 'network';
  animated?: boolean;
  flow?: EdgeFlow;
}

/** A drawn container around a set of nodes — a trust boundary, a network, a
 *  region, or a management scope. Rendered behind nodes and edges. */
export type BoundaryKind = 'trust' | 'network' | 'region' | 'scope' | 'zone';

export interface SceneBoundary {
  id: string;
  label: string;
  kind: BoundaryKind;
  nodeIds: string[];
}

export interface SceneState {
  id: string;
  label: string;
  description: string;
  nodeOverrides?: Record<string, Partial<Pick<SceneNode, 'status' | 'data' | 'label'>>>;
  edgeOverrides?: Record<string, Partial<Pick<SceneEdge, 'animated' | 'label' | 'flow'>>>;
}

export interface SceneDefinition {
  id: string;
  type: 'topology' | 'sequence';
  title: string;
  /** One-sentence accessible description, emitted as the SVG <desc>. Falls
   *  back to the title. */
  description?: string;
  nodes: SceneNode[];
  edges: SceneEdge[];
  states: SceneState[]; // always at least one — states[0] is the initial view
  boundaries?: SceneBoundary[];
  /** 'graph' loads React Flow for drag/connect/graph navigation (ADR-008).
   *  Omitted or 'static' renders as declarative SVG. */
  interaction?: 'static' | 'graph';
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
