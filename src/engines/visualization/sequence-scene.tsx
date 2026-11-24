import type { KeyboardEvent } from 'react';
import { resolveSceneAtState, type SceneDefinition } from './types';

interface SequenceSceneProps {
  scene: SceneDefinition;
  stateIndex: number;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

const ACTOR_GAP = 180;
const ROW_HEIGHT = 48;
const TOP_PADDING = 48;

export function SequenceScene({ scene, stateIndex, selectedNodeId, onSelectNode }: SequenceSceneProps) {
  const { nodes: actors, edges } = resolveSceneAtState(scene, stateIndex);
  const width = Math.max(actors.length * ACTOR_GAP, 320);
  const height = TOP_PADDING + edges.length * ROW_HEIGHT + 32;
  const actorX = new Map(actors.map((actor, i) => [actor.id, i * ACTOR_GAP + ACTOR_GAP / 2]));

  function handleKeyDown(event: KeyboardEvent<SVGGElement>, nodeId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectNode(nodeId);
    }
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-4"
      role="group"
      aria-label={scene.title}
    >
      <svg width={width} height={height} className="min-w-full">
        {actors.map((actor) => {
          const x = actorX.get(actor.id) ?? 0;
          return (
            <g
              key={actor.id}
              role="button"
              tabIndex={0}
              aria-label={`Inspect ${actor.label}`}
              aria-pressed={actor.id === selectedNodeId}
              onClick={() => onSelectNode(actor.id)}
              onKeyDown={(e) => handleKeyDown(e, actor.id)}
              className="group/actor cursor-pointer outline-none"
            >
              <line
                x1={x}
                y1={TOP_PADDING - 8}
                x2={x}
                y2={height - 8}
                className="stroke-border"
                strokeDasharray="4 4"
              />
              <rect
                x={x - 56}
                y={4}
                width={112}
                height={28}
                rx={6}
                strokeWidth={actor.id === selectedNodeId ? 2 : 1}
                className={`fill-surface group-focus-visible/actor:stroke-accent ${
                  actor.id === selectedNodeId ? 'stroke-accent' : 'stroke-border'
                }`}
              />
              <text x={x} y={22} textAnchor="middle" className="fill-text text-[12px] font-medium">
                {actor.label}
              </text>
            </g>
          );
        })}

        {edges.map((edge, i) => {
          const y = TOP_PADDING + i * ROW_HEIGHT;
          const x1 = actorX.get(edge.source) ?? 0;
          const x2 = actorX.get(edge.target) ?? 0;
          const isPast = i < stateIndex;
          const isCurrent = i === stateIndex - 1;
          const forward = x2 >= x1;

          return (
            <g key={edge.id} opacity={isPast || isCurrent ? 1 : 0.35}>
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                className={isCurrent ? 'stroke-accent' : 'stroke-text-muted'}
                strokeWidth={isCurrent ? 2 : 1}
              />
              <polygon
                points={
                  forward
                    ? `${x2 - 7},${y - 4} ${x2},${y} ${x2 - 7},${y + 4}`
                    : `${x2 + 7},${y - 4} ${x2},${y} ${x2 + 7},${y + 4}`
                }
                className={isCurrent ? 'fill-accent' : 'fill-text-muted'}
              />
              <text
                x={(x1 + x2) / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-text-secondary text-[11px]"
              >
                {edge.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
