import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';
import { wildcardMatch } from './policy-evaluation';

// A scoped model of Azure RBAC authorization: one role assignment, an
// optional illustrative deny assignment, and the documented order — deny
// assignments first, then role assignments that apply at the resource's scope
// or any scope above it. Role definitions are abbreviated subsets of the
// built-in roles. Not modelled: group resolution, multiple assignments,
// role assignment conditions, Microsoft Entra roles, and key- or
// policy-based data access. Simulated — nothing is sent to Azure.

export type ScopeId = 'corp' | 'prod' | 'dev' | 'rg-web' | 'rg-data' | 'rg-dev' | 'app-web' | 'sql-orders' | 'kv-prod' | 'vm-test';
export type TargetId = 'app-web' | 'sql-orders' | 'kv-prod' | 'vm-test';
export type RoleId = 'reader' | 'contributor' | 'owner' | 'kv-secrets-user';
export type OperationId = 'read' | 'write' | 'delete' | 'assign-role' | 'read-secret';

export interface ScopeNode {
  id: ScopeId;
  label: string;
  level: 'Management group' | 'Subscription' | 'Resource group' | 'Resource';
  parent: ScopeId | null;
  resourceType?: string;
}

export const scopes: ScopeNode[] = [
  { id: 'corp', label: 'Corp', level: 'Management group', parent: null },
  { id: 'prod', label: 'Prod', level: 'Subscription', parent: 'corp' },
  { id: 'rg-web', label: 'rg-web', level: 'Resource group', parent: 'prod' },
  { id: 'app-web', label: 'app-web', level: 'Resource', parent: 'rg-web', resourceType: 'Microsoft.Web/sites' },
  { id: 'rg-data', label: 'rg-data', level: 'Resource group', parent: 'prod' },
  { id: 'sql-orders', label: 'sql-orders', level: 'Resource', parent: 'rg-data', resourceType: 'Microsoft.Sql/servers/databases' },
  { id: 'kv-prod', label: 'kv-prod', level: 'Resource', parent: 'rg-data', resourceType: 'Microsoft.KeyVault/vaults' },
  { id: 'dev', label: 'Dev', level: 'Subscription', parent: 'corp' },
  { id: 'rg-dev', label: 'rg-dev', level: 'Resource group', parent: 'dev' },
  { id: 'vm-test', label: 'vm-test', level: 'Resource', parent: 'rg-dev', resourceType: 'Microsoft.Compute/virtualMachines' },
];

export interface RoleDefinition {
  name: string;
  actions: string[];
  notActions: string[];
  dataActions: string[];
}

/** Abbreviated subsets of the built-in role definitions. */
export const roles: Record<RoleId, RoleDefinition> = {
  reader: { name: 'Reader', actions: ['*/read'], notActions: [], dataActions: [] },
  contributor: {
    name: 'Contributor',
    actions: ['*'],
    notActions: ['Microsoft.Authorization/*/Delete', 'Microsoft.Authorization/*/Write', 'Microsoft.Authorization/elevateAccess/Action'],
    dataActions: [],
  },
  owner: { name: 'Owner', actions: ['*'], notActions: [], dataActions: [] },
  'kv-secrets-user': {
    name: 'Key Vault Secrets User',
    actions: [],
    notActions: [],
    dataActions: ['Microsoft.KeyVault/vaults/secrets/getSecret/action', 'Microsoft.KeyVault/vaults/secrets/readMetadata/action'],
  },
};

/** An illustrative deny assignment, like those created by a deployment stack's deny settings. */
export const denyAssignment = { scope: 'rg-data' as ScopeId, actions: ['*/write', '*/delete'] };

export interface RbacConfig {
  role: RoleId;
  assignmentScope: ScopeId;
  target: TargetId;
  operation: OperationId;
  denyAssignmentEnabled: boolean;
}

export type RbacStepVerdict = 'info' | 'pass' | 'allow' | 'deny' | 'skipped';

export interface RbacStep {
  title: string;
  detail: string;
  verdict: RbacStepVerdict;
}

export interface TreeRow {
  id: ScopeId;
  label: string;
  level: ScopeNode['level'];
  depth: number;
  isTarget: boolean;
  onPath: boolean;
  assignedHere: boolean;
  covered: boolean; // the assignment applies here (at or below its scope)
  denyHere: boolean;
}

export type RbacDecision = 'allow' | 'deny' | 'not-applicable';

export interface RbacEvaluation {
  action: string;
  isDataAction: boolean;
  path: ScopeId[]; // target up to root
  assignmentApplies: boolean;
  tree: TreeRow[];
  steps: RbacStep[];
  decision: RbacDecision;
  deniedBy: 'deny-assignment' | 'scope' | 'role' | null;
  reason: string;
}

export interface RbacState {
  config: RbacConfig;
  action: string;
  tree: TreeRow[];
  steps: RbacStep[];
  decision: RbacDecision | null;
  deniedBy: RbacEvaluation['deniedBy'];
  reason: string | null;
}

const byId = new Map(scopes.map((s) => [s.id, s]));

export function ancestorsOf(id: ScopeId): ScopeId[] {
  const path: ScopeId[] = [];
  let current: ScopeId | null = id;
  while (current) {
    path.push(current);
    current = byId.get(current)!.parent;
  }
  return path;
}

function depthOf(id: ScopeId): number {
  return ancestorsOf(id).length - 1;
}

export function actionFor(target: TargetId, operation: OperationId): { action: string; isDataAction: boolean } | null {
  const type = byId.get(target)!.resourceType!;
  switch (operation) {
    case 'read':
      return { action: `${type}/read`, isDataAction: false };
    case 'write':
      return { action: `${type}/write`, isDataAction: false };
    case 'delete':
      return { action: `${type}/delete`, isDataAction: false };
    case 'assign-role':
      return { action: 'Microsoft.Authorization/roleAssignments/write', isDataAction: false };
    case 'read-secret':
      return target === 'kv-prod' ? { action: 'Microsoft.KeyVault/vaults/secrets/getSecret/action', isDataAction: true } : null;
  }
}

/** Effective actions of a role: Actions minus NotActions (or DataActions for data-plane requests). */
export function roleAllows(role: RoleDefinition, action: string, isDataAction: boolean): { allowed: boolean; detail: string } {
  if (isDataAction) {
    const match = role.dataActions.find((a) => wildcardMatch(a, action, true));
    return match
      ? { allowed: true, detail: `${role.name} includes the data action ${match}.` }
      : { allowed: false, detail: `${role.name} has ${role.dataActions.length === 0 ? 'no DataActions at all' : 'no matching DataAction'} — ${action} is a data-plane action, separate from management Actions.` };
  }
  const match = role.actions.find((a) => wildcardMatch(a, action, true));
  if (!match) {
    return { allowed: false, detail: `${role.name}’s Actions (${role.actions.length ? role.actions.join(', ') : 'none'}) do not include ${action}.` };
  }
  const excluded = role.notActions.find((a) => wildcardMatch(a, action, true));
  if (excluded) {
    return { allowed: false, detail: `${role.name}’s Actions include it through “${match}”, but its NotActions remove “${excluded}”. NotActions are not a deny — another role could still grant it.` };
  }
  return { allowed: true, detail: `${role.name} allows it through “${match}”.` };
}

export function evaluateRbac(config: RbacConfig): RbacEvaluation {
  const target = byId.get(config.target)!;
  const path = ancestorsOf(config.target);
  const assignmentApplies = path.includes(config.assignmentScope);
  const role = roles[config.role];
  const denyApplies = config.denyAssignmentEnabled && path.includes(denyAssignment.scope);
  const coveredIds = new Set(scopes.filter((s) => ancestorsOf(s.id).includes(config.assignmentScope)).map((s) => s.id));

  const tree: TreeRow[] = scopes.map((s) => ({
    id: s.id,
    label: s.label,
    level: s.level,
    depth: depthOf(s.id),
    isTarget: s.id === config.target,
    onPath: path.includes(s.id),
    assignedHere: s.id === config.assignmentScope,
    covered: coveredIds.has(s.id),
    denyHere: config.denyAssignmentEnabled && s.id === denyAssignment.scope,
  }));

  const steps: RbacStep[] = [];
  const resolved = actionFor(config.target, config.operation);
  const pathText = [...path].reverse().map((id) => byId.get(id)!.label).join(' → ');

  const finish = (decision: RbacDecision, deniedBy: RbacEvaluation['deniedBy'], reason: string): RbacEvaluation => {
    steps.push({ title: decision === 'allow' ? 'Decision: Allow' : decision === 'deny' ? 'Decision: Deny' : 'Decision: not applicable', detail: reason, verdict: decision === 'allow' ? 'allow' : decision === 'deny' ? 'deny' : 'info' });
    return { action: resolved?.action ?? '—', isDataAction: resolved?.isDataAction ?? false, path, assignmentApplies, tree, steps, decision, deniedBy, reason };
  };

  if (!resolved) {
    steps.push({ title: 'The request', detail: `Reading a secret is a Key Vault data action; ${target.label} is not a key vault, so the operation does not exist on it.`, verdict: 'info' });
    return finish('not-applicable', null, 'Choose kv-prod as the target to try a data-plane request.');
  }

  steps.push({
    title: 'The request',
    detail: `A member of the web team requests ${resolved.action} on ${target.label} (${resolved.isDataAction ? 'data plane' : 'management plane'}). Its scope path is ${pathText}.`,
    verdict: 'info',
  });

  const assignedAt = byId.get(config.assignmentScope)!;
  steps.push({
    title: 'Collect role assignments on the scope path',
    detail: assignmentApplies
      ? config.assignmentScope === config.target
        ? `The ${role.name} assignment is made directly on ${target.label}.`
        : `The ${role.name} assignment at ${assignedAt.level.toLowerCase()} ${assignedAt.label} is on the path, so ${target.label} inherits it.`
      : `The ${role.name} assignment at ${assignedAt.level.toLowerCase()} ${assignedAt.label} is not on the path ${pathText}. Assignments inherit downward only — never up or sideways — so it does not apply.`,
    verdict: assignmentApplies ? 'pass' : 'deny',
  });

  if (config.denyAssignmentEnabled) {
    const denyMatch = denyApplies ? denyAssignment.actions.find((a) => wildcardMatch(a, resolved.action, true)) : undefined;
    steps.push({
      title: 'Check deny assignments first',
      detail: !denyApplies
        ? `The deny assignment is on rg-data, which is not on this resource’s path.`
        : denyMatch
          ? `The deny assignment on rg-data covers ${target.label} and matches “${denyMatch}”. Deny assignments are evaluated before role assignments.`
          : `The deny assignment on rg-data covers ${target.label} but only denies ${denyAssignment.actions.join(' and ')}; this action does not match.`,
      verdict: denyMatch ? 'deny' : 'pass',
    });
    if (denyMatch) {
      return finish('deny', 'deny-assignment', `Denied by the deny assignment on rg-data. It blocks this action for every principal it does not explicitly exclude — even an Owner.`);
    }
  } else {
    steps.push({ title: 'Check deny assignments first', detail: 'No deny assignment applies on this path.', verdict: 'skipped' });
  }

  if (!assignmentApplies) {
    return finish('deny', 'scope', `Denied: no role assignment covers ${target.label}. Assign the role at ${target.label} or at a scope above it.`);
  }

  const result = roleAllows(role, resolved.action, resolved.isDataAction);
  steps.push({ title: `Does ${role.name} include the action?`, detail: result.detail, verdict: result.allowed ? 'pass' : 'deny' });
  return result.allowed
    ? finish('allow', null, `Allowed: ${role.name}, ${config.assignmentScope === config.target ? 'assigned directly on the resource' : `inherited from ${assignedAt.label}`}, includes ${resolved.action}.`)
    : finish('deny', 'role', `Denied: the assignment applies, but ${role.name} does not include ${resolved.action}.`);
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readRbacConfig(params: SimulationParams): RbacConfig {
  return {
    role: pick(params.role, ['reader', 'contributor', 'owner', 'kv-secrets-user'] as const, 'contributor'),
    assignmentScope: pick(params.assignmentScope, scopes.map((s) => s.id), 'rg-web'),
    target: pick(params.target, ['app-web', 'sql-orders', 'kv-prod', 'vm-test'] as const, 'app-web'),
    operation: pick(params.operation, ['read', 'write', 'delete', 'assign-role', 'read-secret'] as const, 'write'),
    denyAssignmentEnabled: params.denyAssignmentEnabled === true,
  };
}

const scopeOptions = scopes.map((s) => ({ label: `${s.level}: ${s.label}`, value: s.id }));

export const rbacScopeSimulation: SimulationDefinition<RbacState> = {
  id: 'azure-rbac-scope',
  title: 'Azure RBAC Scope Explorer',
  description:
    'Places one role assignment in a management group → subscription → resource group → resource hierarchy and evaluates a request against it, checking deny assignments first. Role definitions are abbreviated; simulated, with nothing sent to Azure.',
  parameters: [
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      default: 'contributor',
      options: [
        { label: 'Reader', value: 'reader' },
        { label: 'Contributor', value: 'contributor' },
        { label: 'Owner', value: 'owner' },
        { label: 'Key Vault Secrets User', value: 'kv-secrets-user' },
      ],
      description: 'The role definition assigned to the web team’s group.',
    },
    { key: 'assignmentScope', label: 'Assignment scope', type: 'select', default: 'rg-web', options: scopeOptions, description: 'Where the role assignment is made.' },
    {
      key: 'target',
      label: 'Target resource',
      type: 'select',
      default: 'app-web',
      options: [
        { label: 'app-web (Prod / rg-web)', value: 'app-web' },
        { label: 'sql-orders (Prod / rg-data)', value: 'sql-orders' },
        { label: 'kv-prod (Prod / rg-data)', value: 'kv-prod' },
        { label: 'vm-test (Dev / rg-dev)', value: 'vm-test' },
      ],
      description: 'The resource the request is made against.',
    },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      default: 'write',
      options: [
        { label: 'Read configuration', value: 'read' },
        { label: 'Modify configuration', value: 'write' },
        { label: 'Delete the resource', value: 'delete' },
        { label: 'Create a role assignment on it', value: 'assign-role' },
        { label: 'Read a secret value (key vault only)', value: 'read-secret' },
      ],
      description: 'The action requested.',
    },
    {
      key: 'denyAssignmentEnabled',
      label: 'Deny assignment on rg-data (write and delete)',
      type: 'boolean',
      default: false,
      description: 'Illustrative deny assignment, like one created by a deployment stack’s deny settings.',
    },
  ],
  createInitialState: (params) => {
    const config = readRbacConfig(params);
    const evaluation = evaluateRbac(config);
    return { config, action: evaluation.action, tree: evaluation.tree, steps: [], decision: null, deniedBy: null, reason: null };
  },
  steps: (params) => {
    const evaluation = evaluateRbac(readRbacConfig(params));
    return evaluation.steps.map((step, i) => {
      const isLast = i === evaluation.steps.length - 1;
      return {
        id: `rbac-${i + 1}`,
        label: step.title,
        description: step.detail,
        apply: (state: RbacState): RbacState => ({
          ...state,
          steps: [...state.steps, step],
          decision: isLast ? evaluation.decision : null,
          deniedBy: isLast ? evaluation.deniedBy : null,
          reason: isLast ? evaluation.reason : null,
        }),
      };
    });
  },
};
