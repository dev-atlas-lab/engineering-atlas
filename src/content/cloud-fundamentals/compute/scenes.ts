import type { SceneDefinition } from '../../../engines/visualization/types';

export const vmArchitectureScene: SceneDefinition = {
  id: 'vm-architecture',
  type: 'topology',
  title: 'Hypervisor allocating virtual machines on a host',
  nodes: [
    { id: 'client', type: 'client', label: 'Client', position: { x: 0, y: 160 }, data: {} },
    {
      id: 'host',
      type: 'host',
      label: 'Physical Host',
      position: { x: 220, y: 40 },
      data: { vCPU: '16 cores', memory: '64 GB' },
      status: 'active',
    },
    {
      id: 'hypervisor',
      type: 'server',
      label: 'Hypervisor',
      position: { x: 220, y: 160 },
      data: { role: 'Allocates and isolates guest resources' },
      status: 'active',
    },
    {
      id: 'vm1',
      type: 'server',
      label: 'VM 1',
      position: { x: 120, y: 300 },
      data: { vCPU: '4', memory: '8 GB' },
      status: 'inactive',
    },
    {
      id: 'vm2',
      type: 'server',
      label: 'VM 2',
      position: { x: 320, y: 300 },
      data: { vCPU: '4', memory: '8 GB' },
      status: 'inactive',
    },
  ],
  edges: [
    { id: 'client-hypervisor', source: 'client', target: 'hypervisor', edgeType: 'request', label: 'request' },
    { id: 'host-hypervisor', source: 'host', target: 'hypervisor', edgeType: 'dependency' },
    { id: 'hypervisor-vm1', source: 'hypervisor', target: 'vm1', edgeType: 'dependency' },
    { id: 'hypervisor-vm2', source: 'hypervisor', target: 'vm2', edgeType: 'dependency' },
  ],
  states: [
    {
      id: 'idle',
      label: 'Host idle',
      description: 'The physical host is running only the hypervisor. No guest VMs have been allocated yet.',
    },
    {
      id: 'vm1-allocated',
      label: 'Hypervisor allocates VM 1',
      description:
        'The hypervisor carves 4 vCPUs and 8 GB of memory out of the host and presents them to VM 1 as if they were dedicated hardware.',
      nodeOverrides: { vm1: { status: 'active' } },
    },
    {
      id: 'vm2-allocated',
      label: 'Hypervisor allocates VM 2',
      description:
        'A second, fully isolated VM is allocated from the same host. VM 2 cannot see or access VM 1’s memory or storage — isolation is enforced by the hypervisor, not by the guest OS.',
      nodeOverrides: { vm1: { status: 'active' }, vm2: { status: 'active' } },
    },
    {
      id: 'both-running',
      label: 'Both VMs running, isolated',
      description:
        'Two guest operating systems run concurrently on one physical host, each believing it owns dedicated hardware. The host has 8 vCPUs and 48 GB unallocated — available for further VMs.',
      nodeOverrides: { vm1: { status: 'active' }, vm2: { status: 'active' } },
    },
  ],
};

export const serverlessRequestFlowScene: SceneDefinition = {
  id: 'serverless-request-flow',
  type: 'sequence',
  title: 'A request triggering a serverless function, including cold start',
  nodes: [
    { id: 'client', type: 'client', label: 'Client', position: { x: 0, y: 0 }, data: {} },
    { id: 'trigger', type: 'gateway', label: 'Trigger', position: { x: 0, y: 0 }, data: {} },
    { id: 'platform', type: 'server', label: 'Function Platform', position: { x: 0, y: 0 }, data: {} },
    { id: 'instance', type: 'function', label: 'Function Instance', position: { x: 0, y: 0 }, data: {} },
  ],
  edges: [
    { id: 'e1', source: 'client', target: 'trigger', label: 'HTTP request' },
    { id: 'e2', source: 'trigger', target: 'platform', label: 'invoke' },
    { id: 'e3', source: 'platform', target: 'instance', label: 'provision + run (cold start)' },
    { id: 'e4', source: 'instance', target: 'client', label: 'response' },
  ],
  states: [
    { id: 's0', label: 'No request yet', description: 'The platform has no running instance of this function.' },
    { id: 's1', label: 'Client sends request', description: 'A client sends an HTTP request that matches a configured trigger.' },
    { id: 's2', label: 'Trigger invokes the platform', description: 'The trigger forwards the invocation to the serverless platform.' },
    {
      id: 's3',
      label: 'Cold start: environment provisioned and function runs',
      description:
        'No warm instance exists, so the platform allocates a new execution environment, loads the function code, and runs it — the cold start penalty. A warm instance would skip provisioning entirely.',
    },
    { id: 's4', label: 'Response returned', description: 'The result flows back through the trigger to the client.' },
  ],
};
