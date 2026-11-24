import { useCallback, useMemo, useState } from 'react';
import type {
  SimulationDefinition,
  SimulationHistoryEntry,
  SimulationParamValue,
  SimulationParams,
} from './types';

/**
 * Computes the full state history for a simulation given a set of params.
 * Pure function — same `def` + `params` always produces the same history,
 * which is what makes step-forward/step-back/replay correct by construction
 * (the runtime below never mutates state in place, it recomputes and indexes).
 */
export function computeHistory<TState>(
  def: SimulationDefinition<TState>,
  params: SimulationParams,
): SimulationHistoryEntry<TState>[] {
  const steps = def.steps(params);
  let state = def.createInitialState(params);
  const history: SimulationHistoryEntry<TState>[] = [
    { state, stepLabel: 'Initial state', stepDescription: def.description },
  ];
  for (const step of steps) {
    state = step.apply(state, params);
    history.push({ state, stepLabel: step.label, stepDescription: step.description });
  }
  return history;
}

function defaultParams<TState>(def: SimulationDefinition<TState>): SimulationParams {
  return Object.fromEntries(def.parameters.map((p) => [p.key, p.default]));
}

export function useSimulation<TState>(def: SimulationDefinition<TState>) {
  const [params, setParams] = useState<SimulationParams>(() => defaultParams(def));
  const [stepIndex, setStepIndex] = useState(0);

  const history = useMemo(() => computeHistory(def, params), [def, params]);
  // history always has at least one entry (the initial state is pushed
  // unconditionally in computeHistory), so an index clamped into
  // [0, history.length - 1] is always in range — safe to assert past
  // noUncheckedIndexedAccess here.
  const clampedIndex = Math.min(stepIndex, history.length - 1);
  const current = history[clampedIndex]!;

  const setParameter = useCallback((key: string, value: SimulationParamValue) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setStepIndex(0);
  }, []);

  const stepTo = useCallback(
    (index: number) => setStepIndex(Math.max(0, Math.min(index, history.length - 1))),
    [history.length],
  );
  const stepForward = useCallback(() => stepTo(clampedIndex + 1), [stepTo, clampedIndex]);
  const stepBackward = useCallback(() => stepTo(clampedIndex - 1), [stepTo, clampedIndex]);
  const reset = useCallback(() => setStepIndex(0), []);

  return {
    params,
    setParameter,
    history,
    stepIndex: clampedIndex,
    totalSteps: history.length,
    current,
    stepForward,
    stepBackward,
    stepTo,
    reset,
  };
}
