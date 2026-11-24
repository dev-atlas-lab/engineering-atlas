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

export const objectRequestFlowScene: SceneDefinition = {
  id: 'object-request-flow',
  type: 'sequence',
  title: 'Uploading and then retrieving an object',
  nodes: [
    { id: 'client', type: 'client', label: 'Client', position: { x: 0, y: 0 }, data: { Holds: 'Credentials or a time-limited signed URL' } },
    {
      id: 'endpoint',
      type: 'gateway',
      label: 'Storage endpoint',
      position: { x: 0, y: 0 },
      data: { Is: 'The HTTPS front end for the account or bucket', Enforces: 'TLS, request signing, and authorization' },
    },
    {
      id: 'auth',
      type: 'gateway',
      label: 'Authorization',
      position: { x: 0, y: 0 },
      data: { Evaluates: 'Identity, policies, and access settings for this key and action', 'Default answer': 'Deny unless something grants access' },
    },
    {
      id: 'index',
      type: 'database',
      label: 'Namespace index',
      position: { x: 0, y: 0 },
      data: { Maps: 'Container/bucket + key → where the bytes live', Stores: 'System and user metadata (size, content type, ETag, custom tags)' },
    },
    {
      id: 'data',
      type: 'storage',
      label: 'Data nodes',
      position: { x: 0, y: 0 },
      data: { Holds: 'The object’s bytes, replicated per the redundancy setting', 'Encrypted at rest': 'Yes, by default on both Azure and AWS' },
    },
  ],
  edges: [
    { id: 'o1', source: 'client', target: 'endpoint', label: 'PUT photos/cat.jpg' },
    { id: 'o2', source: 'endpoint', target: 'auth', label: 'may caller write this key?' },
    { id: 'o3', source: 'auth', target: 'endpoint', label: 'allow' },
    { id: 'o4', source: 'endpoint', target: 'data', label: 'store bytes (replicated)' },
    { id: 'o5', source: 'endpoint', target: 'index', label: 'record key + metadata' },
    { id: 'o6', source: 'endpoint', target: 'client', label: '201/200 + ETag' },
    { id: 'o7', source: 'client', target: 'endpoint', label: 'GET photos/cat.jpg' },
    { id: 'o8', source: 'endpoint', target: 'auth', label: 'may caller read this key?' },
    { id: 'o9', source: 'endpoint', target: 'index', label: 'look up key' },
    { id: 'o10', source: 'endpoint', target: 'data', label: 'read bytes' },
    { id: 'o11', source: 'endpoint', target: 'client', label: '200 + body + metadata' },
  ],
  states: [
    { id: 's0', label: 'Ready', description: 'An empty bucket (AWS) or container (Azure). The client holds credentials or a pre-signed URL.' },
    { id: 's1', label: 'Upload request', description: 'The client sends the object’s bytes over HTTPS to a URL made of the account or bucket name and the object key. There is no file handle or mounted drive — every operation is a separate HTTP request.' },
    { id: 's2', label: 'Authorization check', description: 'Before touching data, the service evaluates who the caller is and whether any policy grants this action on this key. This is the conceptual security boundary: storage is private unless something explicitly grants access.' },
    { id: 's3', label: 'Access granted', description: 'A role assignment, bucket policy, access key, or signed URL permits the write. Had nothing granted it, the request would end here with 403 Forbidden.' },
    { id: 's4', label: 'Bytes written durably', description: 'The bytes are written to storage nodes and replicated according to the redundancy setting before the write is acknowledged, and encrypted at rest.' },
    { id: 's5', label: 'Key and metadata recorded', description: 'The namespace records the key, size, content type, an ETag (a version fingerprint of the content), and any custom metadata. The key is the object’s only address — “photos/” is a prefix, not a real directory.' },
    { id: 's6', label: 'Upload acknowledged', description: 'The client receives success and the ETag. Both Azure Blob Storage and Amazon S3 provide strong read-after-write consistency: a read that starts after this point sees the new object.' },
    { id: 's7', label: 'Download request', description: 'Later, a client requests the same key.' },
    { id: 's8', label: 'Authorization check', description: 'Reads are authorized independently of writes. Being allowed to upload does not imply being allowed to read, and vice versa.' },
    { id: 's9', label: 'Key lookup', description: 'The namespace resolves the key to the object’s location and metadata. Listing “folders” is the same operation: find keys sharing a prefix.' },
    { id: 's10', label: 'Bytes read', description: 'The bytes are read from a healthy replica — a failed disk elsewhere does not affect the response.' },
    { id: 's11', label: 'Object returned', description: 'The body is returned with metadata as HTTP headers (Content-Type, ETag, Last-Modified). Clients can use the ETag to avoid re-downloading unchanged content.' },
  ],
};
