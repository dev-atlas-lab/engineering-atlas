import type { ReactNode } from 'react';
import type { SimulationDefinition } from '../simulation/types';
import type { LabSimulationEntry } from '../../content/types';
import { SimulationLabView } from './simulation-lab-view';

/** Binds a simulation to the view of its state, erasing the state type so
 *  simulations with unrelated state shapes fit one LabSimulationEntry type.
 *  Concept content modules call this for the simulation labs they own. */
export function bindSimulation<TState>(
  simulation: SimulationDefinition<TState>,
  renderState: (state: TState) => ReactNode,
): LabSimulationEntry {
  return {
    simulationId: simulation.id,
    render: (content) => <SimulationLabView content={content} simulation={simulation} renderState={renderState} />,
  };
}
