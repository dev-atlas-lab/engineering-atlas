import { HOST_VCPU, HOST_MEMORY_GB, type VmAllocationState } from './simulations';

/** Renders the VM resource allocation simulation's state as a table —
 *  a plain resource table fits this better than forcing it into the
 *  topology scene used elsewhere in this concept. */
export function renderVmAllocationState(state: VmAllocationState) {
  return (
    <div className="space-y-3">
      <div className="flex gap-6 text-[13px] text-text-secondary">
        <span>
          Host capacity: <span className="font-medium text-text">{HOST_VCPU} vCPU / {HOST_MEMORY_GB} GB</span>
        </span>
        <span>
          Remaining:{' '}
          <span className="font-medium text-text">
            {state.remainingVCpu} vCPU / {state.remainingMemoryGb} GB
          </span>
        </span>
      </div>

      {state.instances.length === 0 ? (
        <p className="text-[13px] text-text-muted">No VMs requested yet.</p>
      ) : (
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">VM</th>
              <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">vCPU</th>
              <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">Memory</th>
              <th className="border-b border-border px-2 py-1.5 text-left font-medium text-text">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.instances.map((instance) => (
              <tr key={instance.id} className="border-b border-border-subtle">
                <td className="px-2 py-1.5 text-text">{instance.id}</td>
                <td className="px-2 py-1.5 text-text-secondary">{instance.vCpu}</td>
                <td className="px-2 py-1.5 text-text-secondary">{instance.memoryGb} GB</td>
                <td className="px-2 py-1.5">
                  <span className={instance.status === 'running' ? 'text-success' : 'text-error'}>
                    {instance.status === 'running' ? 'Running' : 'Rejected — insufficient capacity'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
