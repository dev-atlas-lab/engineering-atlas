import { ArrowRight, ArrowLeft, X } from 'lucide-react';
import { primitiveIcons, statusDotClass } from './primitives';
import type { SceneNode } from './types';

/** A relationship of the selected node to another, derived from the scene's
 *  edges — so selecting a node reveals its connections, not just its data. */
export interface NodeConnection {
  id: string;
  direction: 'out' | 'in';
  otherLabel: string;
  edgeLabel?: string;
}

interface ComponentInspectorProps {
  node: SceneNode | null;
  connections?: NodeConnection[];
  onClose: () => void;
}

export function ComponentInspector({ node, connections = [], onClose }: ComponentInspectorProps) {
  if (!node) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-[13px] text-text-muted">
        Click a component in the diagram to inspect it.
      </div>
    );
  }

  const Icon = primitiveIcons[node.type];
  const fields = Object.entries(node.data);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-text-muted" />
          <h3 className="text-[14px] font-medium text-text">{node.label}</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close inspector"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {node.status && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-text-secondary">
          <span className={`size-1.5 rounded-full ${statusDotClass[node.status]}`} />
          <span className="capitalize">{node.status}</span>
        </div>
      )}

      {fields.length > 0 && (
        <dl className="mt-3 space-y-1.5 border-t border-border-subtle pt-3">
          {fields.map(([key, value]) => (
            <div key={key} className="flex items-baseline justify-between gap-3 text-[12px]">
              <dt className="text-text-muted">{key}</dt>
              <dd className="text-right font-medium text-text">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {connections.length > 0 && (
        <div className="mt-3 border-t border-border-subtle pt-3">
          <h4 className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Connections</h4>
          <ul className="mt-1.5 space-y-1">
            {connections.map((c) => (
              <li key={c.id} className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                {c.direction === 'out' ? (
                  <ArrowRight aria-label="to" className="size-3 shrink-0 text-text-muted" />
                ) : (
                  <ArrowLeft aria-label="from" className="size-3 shrink-0 text-text-muted" />
                )}
                <span className="font-medium text-text">{c.otherLabel}</span>
                {c.edgeLabel && <span className="text-text-muted">· {c.edgeLabel}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
