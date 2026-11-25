import type { SceneDefinition } from '../../../engines/visualization/types';

const blockNodes = ['dbVm', 'disk'];
const fileNodes = ['appA', 'appB', 'share'];
const objectNodes = ['clients', 'bucket'];

function highlight(active: string[]) {
  const all = [...blockNodes, ...fileNodes, ...objectNodes];
  return Object.fromEntries(
    all.map((id) => [id, { status: active.includes(id) ? ('active' as const) : ('inactive' as const) }]),
  );
}

export const storageModelExplorerScene: SceneDefinition = {
  id: 'storage-model-explorer',
  type: 'topology',
  title: 'Block, file, and object storage serving three representative workloads',
  nodes: [
    {
      id: 'dbVm',
      type: 'server',
      label: 'Database VM',
      position: { x: 0, y: 0 },
      data: { Workload: 'A relational database on one VM', Needs: 'Low-latency random reads and writes to parts of large files' },
      status: 'active',
    },
    {
      id: 'disk',
      type: 'storage',
      label: 'Block volume',
      position: { x: 0, y: 160 },
      data: {
        'Unit of data': 'Fixed-size blocks, addressed by offset',
        'Accessed as': 'A raw disk; the VM’s OS puts a filesystem on it',
        'Typically attached to': 'One VM at a time',
        'Partial update': 'Yes — rewrite any block in place',
      },
      status: 'active',
    },
    {
      id: 'appA',
      type: 'server',
      label: 'App server A',
      position: { x: 230, y: 0 },
      data: { Workload: 'Web servers sharing uploaded documents', Needs: 'The same files visible to every server' },
      status: 'active',
    },
    {
      id: 'appB',
      type: 'server',
      label: 'App server B',
      position: { x: 400, y: 0 },
      data: { Workload: 'Web servers sharing uploaded documents', Needs: 'The same files visible to every server' },
      status: 'active',
    },
    {
      id: 'share',
      type: 'storage',
      label: 'File share',
      position: { x: 310, y: 160 },
      data: {
        'Unit of data': 'Files in a directory tree',
        'Accessed via': 'Network file protocols (NFS or SMB)',
        'Shared by': 'Many clients concurrently',
        'Provides': 'Paths, permissions, and file locking',
      },
      status: 'active',
    },
    {
      id: 'clients',
      type: 'client',
      label: 'Web and mobile clients',
      position: { x: 620, y: 0 },
      data: { Workload: 'Photos and videos for an app', Needs: 'Huge scale, HTTP access, no server in the path' },
      status: 'active',
    },
    {
      id: 'bucket',
      type: 'storage',
      label: 'Object bucket',
      position: { x: 620, y: 160 },
      data: {
        'Unit of data': 'Whole objects: bytes plus metadata, under a key',
        'Accessed via': 'An HTTPS API (PUT, GET, DELETE, LIST)',
        Namespace: 'Flat keys; “folders” are key prefixes',
        'Partial update': 'No — replace the whole object',
      },
      status: 'active',
    },
  ],
  edges: [
    { id: 'db-disk', source: 'dbVm', target: 'disk', label: 'read/write blocks', edgeType: 'data' },
    { id: 'a-share', source: 'appA', target: 'share', label: 'NFS / SMB', edgeType: 'data' },
    { id: 'b-share', source: 'appB', target: 'share', label: 'NFS / SMB', edgeType: 'data' },
    { id: 'c-bucket', source: 'clients', target: 'bucket', label: 'HTTPS GET / PUT', edgeType: 'request' },
  ],
  states: [
    {
      id: 'overview',
      label: 'Three models, three workloads',
      description:
        'Each storage model exposes data through a different abstraction: blocks addressed by offset, files in a directory tree, or whole objects under a key. Step through to see why each workload fits its model. Select any node to inspect it.',
    },
    {
      id: 'block',
      label: 'Block: a database on one VM',
      description:
        'A database rewrites small pieces of large files constantly and needs predictable low latency. Block storage gives the VM’s operating system a raw disk it can format and update in place, block by block — exactly what a database engine expects. The trade-off: one VM typically owns the volume.',
      nodeOverrides: highlight(blockNodes),
      edgeOverrides: { 'db-disk': { animated: true } },
    },
    {
      id: 'file',
      label: 'File: shared files across servers',
      description:
        'Several servers need to see the same files at the same paths, with permissions and locks so two writers do not corrupt each other. A file share provides a real filesystem over the network that many clients mount at once — something a single-attach block volume cannot do.',
      nodeOverrides: highlight(fileNodes),
      edgeOverrides: { 'a-share': { animated: true }, 'b-share': { animated: true } },
    },
    {
      id: 'object',
      label: 'Object: media for web and mobile',
      description:
        'Billions of photos, read directly by clients over HTTPS, written once and rarely changed. Object storage scales to that volume without a server in the request path and charges for what is stored — but it has no in-place partial updates and no real directories, so it is a poor fit for a database’s data files.',
      nodeOverrides: highlight(objectNodes),
      edgeOverrides: { 'c-bucket': { animated: true } },
    },
  ],
};
