import type { SceneDefinition } from '../../../engines/visualization/types';

const allResources = ['corp', 'prod', 'dev', 'rgWeb', 'rgData', 'rgDev', 'appWeb', 'sqlOrders', 'kvProd', 'vmTest'] as const;

function inactiveExcept(active: readonly string[]) {
  return Object.fromEntries(
    allResources.map((id) => [id, { status: active.includes(id) ? ('active' as const) : ('inactive' as const) }]),
  );
}

export const rbacScopeScene: SceneDefinition = {
  id: 'azure-rbac-scope-explorer',
  type: 'topology',
  title: 'Azure RBAC scopes and inheritance',
  nodes: [
    { id: 'corp', type: 'scope', label: 'Management group: Corp', position: { x: 230, y: 0 }, data: { Level: 'Management group', Contains: 'Subscriptions (and other management groups)' } },
    { id: 'prod', type: 'scope', label: 'Subscription: Prod', position: { x: 90, y: 130 }, data: { Level: 'Subscription', Trusts: 'One Microsoft Entra tenant' } },
    { id: 'dev', type: 'scope', label: 'Subscription: Dev', position: { x: 400, y: 130 }, data: { Level: 'Subscription' } },
    { id: 'rgWeb', type: 'scope', label: 'RG: rg-web', position: { x: 0, y: 260 }, data: { Level: 'Resource group' } },
    { id: 'rgData', type: 'scope', label: 'RG: rg-data', position: { x: 200, y: 260 }, data: { Level: 'Resource group' } },
    { id: 'rgDev', type: 'scope', label: 'RG: rg-dev', position: { x: 400, y: 260 }, data: { Level: 'Resource group' } },
    { id: 'appWeb', type: 'server', label: 'app-web', position: { x: 0, y: 390 }, data: { Level: 'Resource', Type: 'Web app' } },
    { id: 'sqlOrders', type: 'database', label: 'sql-orders', position: { x: 140, y: 390 }, data: { Level: 'Resource', Type: 'SQL database' } },
    { id: 'kvProd', type: 'key', label: 'kv-prod', position: { x: 280, y: 390 }, data: { Level: 'Resource', Type: 'Key Vault (Azure RBAC permission model)' } },
    { id: 'vmTest', type: 'server', label: 'vm-test', position: { x: 400, y: 390 }, data: { Level: 'Resource', Type: 'Virtual machine' } },
  ],
  edges: [
    { id: 'c-p', source: 'corp', target: 'prod', edgeType: 'dependency' },
    { id: 'c-d', source: 'corp', target: 'dev', edgeType: 'dependency' },
    { id: 'p-w', source: 'prod', target: 'rgWeb', edgeType: 'dependency' },
    { id: 'p-da', source: 'prod', target: 'rgData', edgeType: 'dependency' },
    { id: 'd-rd', source: 'dev', target: 'rgDev', edgeType: 'dependency' },
    { id: 'w-a', source: 'rgWeb', target: 'appWeb', edgeType: 'dependency' },
    { id: 'da-s', source: 'rgData', target: 'sqlOrders', edgeType: 'dependency' },
    { id: 'da-k', source: 'rgData', target: 'kvProd', edgeType: 'dependency' },
    { id: 'rd-v', source: 'rgDev', target: 'vmTest', edgeType: 'dependency' },
  ],
  states: [
    {
      id: 'hierarchy',
      label: 'Four levels of scope',
      description:
        'Azure organizes resources in a hierarchy: management groups contain subscriptions, subscriptions contain resource groups, and resource groups contain resources. A role assignment is made at one of these scopes. Select any node to see its level.',
    },
    {
      id: 'mg-reader',
      label: 'Reader at the management group',
      description:
        'The operations team is assigned Reader at the Corp management group. Assignments inherit downward, so they can read every subscription, resource group, and resource below — including subscriptions created later. Broad scope is convenient and exactly why it must be used sparingly for powerful roles.',
      nodeOverrides: Object.fromEntries(
        allResources.map((id) => [id, { status: 'active' as const, data: { 'Ops team': id === 'corp' ? 'Reader — assigned here' : 'Reader — inherited from Corp' } }]),
      ),
    },
    {
      id: 'rg-contributor',
      label: 'Contributor at one resource group',
      description:
        'The web team is assigned Contributor on rg-web. They can manage app-web, but nothing in rg-data or the Dev subscription: assignments never flow up or sideways. Contributor also cannot grant access to others — its NotActions exclude writing role assignments.',
      nodeOverrides: {
        ...inactiveExcept(['rgWeb', 'appWeb']),
        rgWeb: { status: 'active', data: { 'Web team': 'Contributor — assigned here' } },
        appWeb: { status: 'active', data: { 'Web team': 'Contributor — inherited from rg-web' } },
      },
    },
    {
      id: 'data-plane',
      label: 'Management plane vs. data plane',
      description:
        'The web team is now Contributor on the whole Prod subscription. They can reconfigure kv-prod — but they still cannot read its secrets. With the Azure RBAC permission model, reading a secret is a data action that Contributor does not include; it needs a role such as Key Vault Secrets User, ideally assigned on the vault alone.',
      nodeOverrides: {
        ...inactiveExcept(['prod', 'rgWeb', 'rgData', 'appWeb', 'sqlOrders', 'kvProd']),
        prod: { status: 'active', data: { 'Web team': 'Contributor — assigned here' } },
        kvProd: { status: 'error', data: { 'Manage the vault': 'Allowed — inherited Contributor', 'Read a secret value': 'Denied — no data action granted' } },
      },
    },
    {
      id: 'deny-assignment',
      label: 'A deny assignment wins',
      description:
        'A deployment stack protects rg-data with a deny setting, which Azure implements as a deny assignment blocking writes and deletes. Even a subscription Owner is blocked there, because deny assignments are evaluated before role assignments. You cannot create deny assignments directly; Azure features such as deployment stacks and managed applications create them.',
      nodeOverrides: {
        ...inactiveExcept(['prod', 'rgWeb', 'appWeb']),
        prod: { status: 'active', data: { 'Platform team': 'Owner — assigned here' } },
        rgData: { status: 'error', data: { 'Deny assignment': 'Write and delete denied for everyone except excluded principals' } },
        sqlOrders: { status: 'error', data: { 'Delete database': 'Denied by the deny assignment, despite Owner' } },
        kvProd: { status: 'error', data: { 'Delete vault': 'Denied by the deny assignment, despite Owner' } },
      },
    },
  ],
};
