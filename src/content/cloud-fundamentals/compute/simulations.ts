import type { SimulationDefinition } from '../../../engines/simulation/types';

export const HOST_VCPU = 16;
export const HOST_MEMORY_GB = 64;

export interface VmInstanceState {
  id: string;
  vCpu: number;
  memoryGb: number;
  status: 'running' | 'rejected';
}

export interface VmAllocationState {
  instances: VmInstanceState[];
  remainingVCpu: number;
  remainingMemoryGb: number;
}

/**
 * Deterministic bin-packing simulation: VM requests are allocated in order
 * against a fixed host capacity (16 vCPU / 64 GB, matching
 * virtual-machines.scenes.ts's vmArchitectureScene). A request is granted if the host has
 * enough remaining capacity, otherwise it is rejected — same params always
 * produce the same sequence of grants and rejections.
 */
export const vmResourceAllocationSimulation: SimulationDefinition<VmAllocationState> = {
  id: 'vm-resource-allocation',
  title: 'VM Resource Allocation',
  description:
    'Requests a number of identically-sized virtual machines against a fixed-capacity host (16 vCPU / 64 GB) and allocates them in order, rejecting any request the host can no longer satisfy.',
  parameters: [
    {
      key: 'instanceCount',
      label: 'Number of VMs requested',
      type: 'number',
      default: 3,
      min: 1,
      max: 8,
      description: 'How many identically-sized VMs to request from the host, in order.',
    },
    {
      key: 'vCpuPerInstance',
      label: 'vCPU per VM',
      type: 'select',
      default: 4,
      options: [
        { label: '1 vCPU', value: 1 },
        { label: '2 vCPU', value: 2 },
        { label: '4 vCPU', value: 4 },
        { label: '8 vCPU', value: 8 },
      ],
      description: 'vCPU allocated to each requested VM.',
    },
    {
      key: 'memoryPerInstanceGb',
      label: 'Memory per VM (GB)',
      type: 'select',
      default: 8,
      options: [
        { label: '2 GB', value: 2 },
        { label: '4 GB', value: 4 },
        { label: '8 GB', value: 8 },
        { label: '16 GB', value: 16 },
      ],
      description: 'Memory allocated to each requested VM.',
    },
  ],
  createInitialState: () => ({
    instances: [],
    remainingVCpu: HOST_VCPU,
    remainingMemoryGb: HOST_MEMORY_GB,
  }),
  steps: (params) => {
    const count = Number(params.instanceCount);
    const vCpu = Number(params.vCpuPerInstance);
    const memoryGb = Number(params.memoryPerInstanceGb);

    return Array.from({ length: count }, (_, i) => {
      const index = i + 1;
      return {
        id: `request-${index}`,
        label: `Request VM ${index}`,
        description: `Requests ${vCpu} vCPU / ${memoryGb} GB. Granted if the host still has that much capacity free, otherwise rejected.`,
        apply: (state: VmAllocationState): VmAllocationState => {
          const canAllocate = state.remainingVCpu >= vCpu && state.remainingMemoryGb >= memoryGb;
          const instance: VmInstanceState = {
            id: `vm-${index}`,
            vCpu,
            memoryGb,
            status: canAllocate ? 'running' : 'rejected',
          };
          return {
            instances: [...state.instances, instance],
            remainingVCpu: canAllocate ? state.remainingVCpu - vCpu : state.remainingVCpu,
            remainingMemoryGb: canAllocate ? state.remainingMemoryGb - memoryGb : state.remainingMemoryGb,
          };
        },
      };
    });
  },
};
