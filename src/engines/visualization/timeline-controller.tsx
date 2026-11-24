import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

interface TimelineControllerProps {
  stepIndex: number;
  totalSteps: number;
  stepLabel: string;
  onStepTo: (index: number) => void;
}

export function TimelineController({
  stepIndex,
  totalSteps,
  stepLabel,
  onStepTo,
}: TimelineControllerProps) {
  const atStart = stepIndex === 0;
  const atEnd = stepIndex === totalSteps - 1;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onStepTo(0)}
          disabled={atStart}
          aria-label="Jump to first state"
          className="flex size-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle disabled:opacity-30"
        >
          <ChevronsLeft className="size-4" />
        </button>
        <button
          onClick={() => onStepTo(stepIndex - 1)}
          disabled={atStart}
          aria-label="Step back"
          className="flex size-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => onStepTo(stepIndex + 1)}
          disabled={atEnd}
          aria-label="Step forward"
          className="flex size-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          onClick={() => onStepTo(totalSteps - 1)}
          disabled={atEnd}
          aria-label="Jump to last state"
          className="flex size-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle disabled:opacity-30"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(totalSteps - 1, 0)}
        value={stepIndex}
        onChange={(e) => onStepTo(Number(e.target.value))}
        aria-label="Scrub timeline"
        className="min-w-24 flex-1 accent-accent"
      />

      <span className="shrink-0 text-[12px] text-text-secondary">
        Step {stepIndex + 1} of {totalSteps}: &ldquo;{stepLabel}&rdquo;
      </span>
    </div>
  );
}
