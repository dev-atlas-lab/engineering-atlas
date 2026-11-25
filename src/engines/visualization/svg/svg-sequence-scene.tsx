import { useId, type KeyboardEvent } from 'react';
import { cn } from '../../../lib/utils';
import { primitiveIcons } from '../primitives';
import { resolveSceneAtState, type SceneDefinition } from '../types';
import { edgeStyle, nodeStyle, wrapLabel } from './svg-tokens';
import { SvgLegend } from './svg-legend';

interface SvgSequenceSceneProps {
  scene: SceneDefinition;
  stateIndex: number;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

const ACTOR_GAP = 180;
const ACTOR_W = 150;
const ACTOR_H = 40;
const TOP = 52;
const ROW = 50;
const ARROW = 7;

/**
 * Declarative SVG sequence renderer (ADR-008), sharing the visual language and
 * legend with the topology renderer. Actors are focusable headers with
 * lifelines; messages are arrowed rows styled by flow and emphasised at the
 * current step. Optional boundaries render as vertical bands behind the actors
 * they span (for example a trust boundary around an identity provider).
 */
export function SvgSequenceScene({ scene, stateIndex, selectedNodeId, onSelectNode }: SvgSequenceSceneProps) {
  const { nodes: actors, edges } = resolveSceneAtState(scene, stateIndex);
  const titleId = useId();
  const descId = useId();

  const width = Math.max(actors.length * ACTOR_GAP, 320);
  const height = TOP + edges.length * ROW + 24;
  const actorX = new Map(actors.map((actor, i) => [actor.id, i * ACTOR_GAP + ACTOR_GAP / 2]));

  function onKey(event: KeyboardEvent<SVGGElement>, id: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectNode(id);
    }
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-4">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="min-w-full" role="group" aria-labelledby={titleId} aria-describedby={descId}>
          <title id={titleId}>{scene.title}</title>
          <desc id={descId}>{scene.description ?? scene.title}</desc>

          {/* Boundaries: vertical bands behind the actors they span. */}
          {(scene.boundaries ?? []).map((boundary) => {
            const xs = boundary.nodeIds.map((id) => actorX.get(id)).filter((x): x is number => x !== undefined);
            if (xs.length === 0) return null;
            const left = Math.min(...xs) - ACTOR_W / 2 - 10;
            const right = Math.max(...xs) + ACTOR_W / 2 + 10;
            return (
              <g key={boundary.id} aria-hidden>
                <rect x={left} y={2} width={right - left} height={height - 4} rx={10} className="fill-warning/5 stroke-warning" strokeWidth={1} strokeDasharray="5 4" />
                <text x={left + 8} y={height - 8} className="fill-warning text-[10px] font-medium">
                  {boundary.label}
                </text>
              </g>
            );
          })}

          {/* Actors with lifelines. */}
          {actors.map((actor) => {
            const x = actorX.get(actor.id) ?? 0;
            const Icon = primitiveIcons[actor.type];
            const selected = actor.id === selectedNodeId;
            const style = nodeStyle(actor.status, selected);
            const lines = wrapLabel(actor.label);
            return (
              <g
                key={actor.id}
                role="button"
                tabIndex={0}
                aria-label={`${actor.label} — select to inspect`}
                aria-pressed={selected}
                onClick={() => onSelectNode(actor.id)}
                onKeyDown={(e) => onKey(e, actor.id)}
                className="group/actor cursor-pointer outline-none"
              >
                <line x1={x} y1={TOP - 8} x2={x} y2={height - 8} className="stroke-border" strokeDasharray="4 4" />
                <rect
                  x={x - ACTOR_W / 2 - 3}
                  y={1}
                  width={ACTOR_W + 6}
                  height={ACTOR_H + 6}
                  rx={9}
                  className="fill-none stroke-accent opacity-0 group-focus-visible/actor:opacity-100"
                  strokeWidth={2}
                />
                <rect x={x - ACTOR_W / 2} y={4} width={ACTOR_W} height={ACTOR_H} rx={7} strokeWidth={style.strokeWidth} className={cn(style.fill, style.stroke)} />
                <Icon x={x - ACTOR_W / 2 + 10} y={4 + ACTOR_H / 2 - 7} width={14} height={14} className={style.icon} aria-hidden />
                <text className="fill-text text-[11px] font-medium">
                  {lines.map((line, i) => (
                    <tspan key={line} x={x + 8} y={lines.length > 1 ? 18 + i * 12 : 27} textAnchor="middle">
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}

          {/* Messages. */}
          {edges.map((edge, i) => {
            const y = TOP + i * ROW;
            const x1 = actorX.get(edge.source) ?? 0;
            const x2 = actorX.get(edge.target) ?? 0;
            const isPast = i < stateIndex;
            const isCurrent = i === stateIndex - 1;
            const forward = x2 >= x1;
            const style = edgeStyle(edge, isCurrent);
            const ax = forward ? x2 - 2 : x2 + 2;
            const arrow = forward
              ? `${ax},${y} ${ax - ARROW},${y - 4} ${ax - ARROW},${y + 4}`
              : `${ax},${y} ${ax + ARROW},${y - 4} ${ax + ARROW},${y + 4}`;
            const chipW = edge.label ? edge.label.length * 5.7 + 10 : 0;
            return (
              <g key={edge.id} opacity={isPast || isCurrent ? 1 : 0.32}>
                <line x1={x1} y1={y} x2={x2} y2={y} strokeWidth={style.width} strokeDasharray={style.dash} className={cn(style.stroke, style.animated && 'atlas-flow')} />
                <polygon points={arrow} className={cn('stroke-none', style.fill)} />
                {edge.label && (
                  <>
                    <rect x={(x1 + x2) / 2 - chipW / 2} y={y - 20} width={chipW} height={15} rx={3} className="fill-bg-subtle" />
                    <text x={(x1 + x2) / 2} y={y - 9} textAnchor="middle" className="fill-text-secondary text-[11px]">
                      {edge.label}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <SvgLegend scene={scene} />
    </div>
  );
}
