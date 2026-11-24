import type { ReactNode } from 'react';
import type { SimulationDefinition } from '../../engines/simulation/types';
import { vmResourceAllocationSimulation, type VmAllocationState } from './compute/simulations';
import { renderVmAllocationState } from './compute/vm-allocation-view';

// Simulation labs need a live SimulationDefinition plus a lab-specific
// render function for its state — deliberately not a generic registry
// abstraction (docs/M1B_DESIGN_DECISIONS.md / M2 implementation plan §2.2):
// there is exactly one simulation lab today, so this is the simplest
// mechanism that works, not a speculative framework.

interface LabSimulationBinding<TState> {
  simulation: SimulationDefinition<TState>;
  renderState: (state: TState) => ReactNode;
}

export const labSimulations: Record<string, LabSimulationBinding<VmAllocationState>> = {
  'vm-resource-allocation-lab': {
    simulation: vmResourceAllocationSimulation,
    renderState: renderVmAllocationState,
  },
};
