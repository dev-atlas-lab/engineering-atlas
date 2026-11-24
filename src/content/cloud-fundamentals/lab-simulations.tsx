import type { ReactNode } from 'react';
import type { SimulationDefinition } from '../../engines/simulation/types';
import { SimulationLabView } from '../../engines/lab/simulation-lab-view';
import type { SimulationLab } from '../types';
import { vmResourceAllocationSimulation } from './compute/simulations';
import { renderVmAllocationState } from './compute/vm-allocation-view';
import { zoneFailureSimulation } from './global-infrastructure/simulations';
import { renderZoneFailureState } from './global-infrastructure/zone-failure-view';
import { replicationSimulation } from './storage/simulations';
import { renderReplicationState } from './storage/replication-view';

// Maps a simulation lab's id to the live SimulationDefinition it runs and
// the lab-specific view of that simulation's state. Each entry is bound
// with its own state type, so labs with unrelated state shapes can share
// one registry without losing type safety.

export interface LabSimulationEntry {
  simulationId: string;
  render: (content: SimulationLab) => ReactNode;
}

function bind<TState>(
  simulation: SimulationDefinition<TState>,
  renderState: (state: TState) => ReactNode,
): LabSimulationEntry {
  return {
    simulationId: simulation.id,
    render: (content) => <SimulationLabView content={content} simulation={simulation} renderState={renderState} />,
  };
}

export const labSimulations: Record<string, LabSimulationEntry> = {
  'vm-resource-allocation-lab': bind(vmResourceAllocationSimulation, renderVmAllocationState),
  'zone-failure-simulation-lab': bind(zoneFailureSimulation, renderZoneFailureState),
  'replication-and-durability-lab': bind(replicationSimulation, renderReplicationState),
};
