import { describe, it, expect } from 'vitest';
import { computeHistory } from './use-simulation';
import { vmResourceAllocationSimulation } from '../../content/cloud-fundamentals/compute/simulations';

describe('computeHistory — determinism', () => {
  const params = { instanceCount: 5, vCpuPerInstance: 4, memoryPerInstanceGb: 8 };

  it('produces the same history for the same params, every time', () => {
    const first = computeHistory(vmResourceAllocationSimulation, params);
    const second = computeHistory(vmResourceAllocationSimulation, params);
    expect(second).toEqual(first);
  });

  it('produces one more history entry than there are steps (initial state + one per step)', () => {
    const history = computeHistory(vmResourceAllocationSimulation, params);
    const steps = vmResourceAllocationSimulation.steps(params);
    expect(history.length).toBe(steps.length + 1);
  });

  it('rejects a request once host capacity (16 vCPU / 64 GB) is exhausted', () => {
    // 5 instances x 4 vCPU = 20 vCPU requested against a 16 vCPU host —
    // the 5th request must be rejected, deterministically.
    const history = computeHistory(vmResourceAllocationSimulation, params);
    const finalState = history.at(-1)!.state as {
      instances: { status: string }[];
    };
    expect(finalState.instances.some((i) => i.status === 'rejected')).toBe(true);
  });

  it('grants every request when capacity is never exceeded', () => {
    const smallParams = { instanceCount: 2, vCpuPerInstance: 2, memoryPerInstanceGb: 4 };
    const history = computeHistory(vmResourceAllocationSimulation, smallParams);
    const finalState = history.at(-1)!.state as {
      instances: { status: string }[];
    };
    expect(finalState.instances.every((i) => i.status === 'running')).toBe(true);
  });

  it('step-back correctness: stepping back N times lands on the same state as never having applied those steps', () => {
    const history = computeHistory(vmResourceAllocationSimulation, params);
    // history[2] (after 2 requests) must equal re-running with instanceCount: 2
    const partial = computeHistory(vmResourceAllocationSimulation, { ...params, instanceCount: 2 });
    expect(history[2]).toEqual(partial.at(-1));
  });

  it('different params produce a different, still-deterministic history', () => {
    const otherParams = { instanceCount: 1, vCpuPerInstance: 1, memoryPerInstanceGb: 2 };
    const a = computeHistory(vmResourceAllocationSimulation, otherParams);
    const b = computeHistory(vmResourceAllocationSimulation, otherParams);
    expect(a).toEqual(b);
    expect(a).not.toEqual(computeHistory(vmResourceAllocationSimulation, params));
  });
});
