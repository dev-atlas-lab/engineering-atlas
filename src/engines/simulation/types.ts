// Simulation engine types — see docs/ARCHITECTURE.md §5.
// Deterministic: the same `params` always produce the same `steps` and the
// same resulting history. No randomness, no wall-clock dependence.

export type SimulationParamValue = number | string | boolean;
export type SimulationParams = Record<string, SimulationParamValue>;

export interface SimulationParameter {
  key: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  default: SimulationParamValue;
  options?: { label: string; value: SimulationParamValue }[];
  min?: number;
  max?: number;
  description: string;
}

export interface SimulationStep<TState> {
  id: string;
  label: string;
  description: string;
  apply: (state: TState, params: SimulationParams) => TState;
}

export interface SimulationDefinition<TState> {
  id: string;
  title: string;
  description: string;
  parameters: SimulationParameter[];
  createInitialState: (params: SimulationParams) => TState;
  /** Pure function of params — which steps occur can depend on parameters
   *  (e.g. instance count) while the result stays fully deterministic. */
  steps: (params: SimulationParams) => SimulationStep<TState>[];
}

export interface SimulationHistoryEntry<TState> {
  state: TState;
  stepLabel: string;
  stepDescription: string;
}
