import type { SceneDefinition } from '../../../engines/visualization/types';

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
