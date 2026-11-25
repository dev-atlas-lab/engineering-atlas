import { describe, it, expect } from 'vitest';
import { computeHistory } from '../../../engines/simulation/use-simulation';
import {
  evaluatePolicies,
  policyEvaluationSimulation,
  wildcardMatch,
  type PolicyConfig,
} from './policy-evaluation';
import { evaluateRbac, rbacScopeSimulation, roleAllows, roles, type RbacConfig } from './rbac-scope';

const base: PolicyConfig = {
  principal: 'role',
  action: 's3:PutObject',
  bucket: 'reports-bucket',
  identityPolicy: 'read-reports',
  explicitDeny: 'none',
  resourcePolicy: 'none',
  scp: 'full-access',
  boundary: 'none',
  sessionPolicy: 'none',
};

const evaluate = (overrides: Partial<PolicyConfig>) => evaluatePolicies({ ...base, ...overrides });

describe('wildcardMatch', () => {
  it('matches IAM-style wildcards', () => {
    expect(wildcardMatch('s3:Get*', 's3:GetObject')).toBe(true);
    expect(wildcardMatch('s3:Get*', 's3:PutObject')).toBe(false);
    expect(wildcardMatch('arn:aws:s3:::reports-bucket/*', 'arn:aws:s3:::reports-bucket/2026/q3.csv')).toBe(true);
    expect(wildcardMatch('arn:aws:s3:::reports-bucket/*', 'arn:aws:s3:::payroll-bucket/x')).toBe(false);
    expect(wildcardMatch('*', 'anything')).toBe(true);
  });

  it('treats regex metacharacters literally', () => {
    expect(wildcardMatch('a.b', 'axb')).toBe(false);
    expect(wildcardMatch('a.b', 'a.b')).toBe(true);
  });

  it('matches action names case-insensitively only when asked', () => {
    expect(wildcardMatch('S3:getobject', 's3:GetObject', true)).toBe(true);
    expect(wildcardMatch('S3:getobject', 's3:GetObject')).toBe(false);
  });
});

describe('IAM policy evaluation', () => {
  it('implicitly denies a missing permission and says so', () => {
    const result = evaluate({});
    expect(result.decision).toBe('implicit-deny');
    expect(result.decidedBy).toBe('identity');
    expect(result.reason).toMatch(/missing permission/);
  });

  it('allows a request granted by a least-privilege identity policy', () => {
    const result = evaluate({ identityPolicy: 'read-write-reports' });
    expect(result).toMatchObject({ decision: 'allow', grantedBy: 'identity' });
    expect(result.reason).toContain('ReadWriteReports');
  });

  it('denies by default when no policy applies at all', () => {
    const result = evaluate({ identityPolicy: 'none', scp: 'not-in-organization' });
    expect(result.policies).toEqual([]);
    expect(result.decision).toBe('implicit-deny');
  });

  it('lets an explicit deny in a resource policy override an allow', () => {
    const result = evaluate({ identityPolicy: 's3-full', action: 's3:DeleteObject', explicitDeny: 'bucket-deny-delete' });
    expect(result.decision).toBe('explicit-deny');
    expect(result.decidedBy).toBe('resource');
    expect(result.reason).toContain('DenyDeleteForEveryone');
    // The allow did match — the deny wins anyway.
    expect(result.policies.find((p) => p.kind === 'identity')!.matches.some((m) => m.effect === 'Allow' && m.matches)).toBe(true);
  });

  it('resolves conflicting statements in one policy in favour of the deny', () => {
    const result = evaluate({ identityPolicy: 's3-full', action: 's3:DeleteObject', explicitDeny: 'identity-deny-delete' });
    expect(result).toMatchObject({ decision: 'explicit-deny', decidedBy: 'identity' });
  });

  it('applies an SCP deny to every principal in the account', () => {
    const result = evaluate({ identityPolicy: 's3-full', action: 's3:GetObject', bucket: 'payroll-bucket', explicitDeny: 'scp-deny-payroll' });
    expect(result).toMatchObject({ decision: 'explicit-deny', decidedBy: 'scp' });
  });

  it('implicitly denies actions outside the SCP even when the identity policy allows them', () => {
    const result = evaluate({ identityPolicy: 's3-full', scp: 'read-only' });
    expect(result).toMatchObject({ decision: 'implicit-deny', decidedBy: 'scp' });
    expect(evaluate({ identityPolicy: 's3-full', scp: 'read-only', action: 's3:GetObject' }).decision).toBe('allow');
  });

  it('skips the SCP step when the account is not in an organization', () => {
    const result = evaluate({ identityPolicy: 's3-full', scp: 'not-in-organization' });
    expect(result.decision).toBe('allow');
    expect(result.steps.find((s) => s.stage === 'scp')!.verdict).toBe('skipped');
  });

  it('limits granted permissions with a permissions boundary', () => {
    expect(evaluate({ identityPolicy: 's3-full', boundary: 'read-only' })).toMatchObject({ decision: 'implicit-deny', decidedBy: 'boundary' });
    expect(evaluate({ identityPolicy: 's3-full', boundary: 'read-only', action: 's3:GetObject' }).decision).toBe('allow');
  });

  it('never lets a boundary grant anything on its own', () => {
    const result = evaluate({ identityPolicy: 'none', boundary: 'read-only', action: 's3:GetObject' });
    expect(result).toMatchObject({ decision: 'implicit-deny', decidedBy: 'identity' });
  });

  it('narrows a role session with a session policy', () => {
    const result = evaluate({ identityPolicy: 's3-full', bucket: 'payroll-bucket', action: 's3:GetObject', sessionPolicy: 'reports-only' });
    expect(result).toMatchObject({ decision: 'implicit-deny', decidedBy: 'session' });
  });

  it('ignores session policies for IAM users', () => {
    const result = evaluate({ principal: 'user', identityPolicy: 's3-full', bucket: 'payroll-bucket', action: 's3:GetObject', sessionPolicy: 'reports-only' });
    expect(result.decision).toBe('allow');
    expect(result.policies.some((p) => p.kind === 'session')).toBe(false);
  });

  describe('same-account resource-based policies', () => {
    it('grant an IAM user access with no identity-based policy', () => {
      const result = evaluate({ principal: 'user', identityPolicy: 'none', bucket: 'payroll-bucket', action: 's3:GetObject', resourcePolicy: 'allow-principal-read' });
      expect(result).toMatchObject({ decision: 'allow', grantedBy: 'resource' });
    });

    it('are not limited by an IAM user’s permissions boundary', () => {
      const result = evaluate({ principal: 'user', identityPolicy: 'none', bucket: 'payroll-bucket', action: 's3:GetObject', resourcePolicy: 'allow-principal-read', boundary: 'read-only' });
      expect(result.decision).toBe('allow');
    });

    it('naming the role ARN are still limited by the session policy', () => {
      const result = evaluate({ identityPolicy: 'none', bucket: 'payroll-bucket', action: 's3:GetObject', resourcePolicy: 'allow-principal-read', sessionPolicy: 'reports-only' });
      expect(result).toMatchObject({ decision: 'implicit-deny', decidedBy: 'session' });
    });

    it('naming the role ARN grant a session without an identity policy when no guardrail blocks it', () => {
      const result = evaluate({ identityPolicy: 'none', bucket: 'payroll-bucket', action: 's3:GetObject', resourcePolicy: 'allow-principal-read' });
      expect(result).toMatchObject({ decision: 'allow', grantedBy: 'resource' });
    });

    it('naming the session ARN are not limited by the session policy', () => {
      const result = evaluate({ identityPolicy: 'none', bucket: 'payroll-bucket', action: 's3:GetObject', resourcePolicy: 'allow-session-read', sessionPolicy: 'reports-only' });
      expect(result).toMatchObject({ decision: 'allow', grantedBy: 'resource' });
    });

    it('do not match a principal they do not name', () => {
      const result = evaluate({ principal: 'user', identityPolicy: 'none', action: 's3:GetObject', resourcePolicy: 'allow-session-read' });
      expect(result.decision).toBe('implicit-deny');
    });
  });

  it('always ends with a decision step that carries the reason', () => {
    const result = evaluate({ identityPolicy: 's3-full' });
    const last = result.steps[result.steps.length - 1]!;
    expect(last.stage).toBe('decision');
    expect(last.detail).toBe(result.reason);
  });

  it('is deterministic: the same parameters produce identical histories', () => {
    const params = { principal: 'user', action: 's3:GetObject', bucket: 'payroll-bucket', identityPolicy: 'none', resourcePolicy: 'allow-principal-read' };
    const a = computeHistory(policyEvaluationSimulation, params);
    const b = computeHistory(policyEvaluationSimulation, params);
    expect(JSON.stringify(a.map((h) => h.state))).toBe(JSON.stringify(b.map((h) => h.state)));
    const final = a[a.length - 1]!.state;
    expect(final.decision).toBe('allow');
    expect(a[0]!.state.decision).toBeNull();
  });

  it('falls back to safe defaults for unknown parameter values', () => {
    const history = computeHistory(policyEvaluationSimulation, { principal: 'root', action: 'iam:*' });
    expect(history[0]!.state.config).toMatchObject({ principal: 'role', action: 's3:PutObject' });
  });
});

const rbacBase: RbacConfig = { role: 'contributor', assignmentScope: 'rg-web', target: 'app-web', operation: 'write', denyAssignmentEnabled: false };
const rbac = (overrides: Partial<RbacConfig>) => evaluateRbac({ ...rbacBase, ...overrides });

describe('Azure RBAC scope evaluation', () => {
  it('allows an action granted directly on the resource group', () => {
    expect(rbac({}).decision).toBe('allow');
  });

  it('inherits assignments downward from subscription and management group scopes', () => {
    for (const scope of ['prod', 'corp'] as const) {
      const result = rbac({ assignmentScope: scope });
      expect(result.decision).toBe('allow');
      expect(result.reason).toContain('inherited');
    }
  });

  it('never applies an assignment sideways or upward', () => {
    expect(rbac({ target: 'sql-orders' })).toMatchObject({ decision: 'deny', deniedBy: 'scope' });
    expect(rbac({ assignmentScope: 'kv-prod', target: 'sql-orders' })).toMatchObject({ decision: 'deny', deniedBy: 'scope' });
    expect(rbac({ assignmentScope: 'dev', target: 'app-web' })).toMatchObject({ decision: 'deny', deniedBy: 'scope' });
  });

  it('marks exactly the scopes beneath the assignment as covered', () => {
    const tree = rbac({ assignmentScope: 'prod' }).tree;
    const covered = tree.filter((r) => r.covered).map((r) => r.id).sort();
    expect(covered).toEqual(['app-web', 'kv-prod', 'prod', 'rg-data', 'rg-web', 'sql-orders']);
  });

  it('applies Reader to reads only', () => {
    expect(rbac({ role: 'reader', operation: 'read' }).decision).toBe('allow');
    expect(rbac({ role: 'reader', operation: 'write' })).toMatchObject({ decision: 'deny', deniedBy: 'role' });
  });

  it('excludes role assignment writes from Contributor through NotActions, but not from Owner', () => {
    const contributor = rbac({ assignmentScope: 'prod', operation: 'assign-role' });
    expect(contributor).toMatchObject({ decision: 'deny', deniedBy: 'role' });
    expect(contributor.steps.some((s) => s.detail.includes('NotActions'))).toBe(true);
    expect(rbac({ role: 'owner', assignmentScope: 'prod', operation: 'assign-role' }).decision).toBe('allow');
  });

  it('separates the data plane: Owner cannot read a secret, Key Vault Secrets User can', () => {
    expect(rbac({ role: 'owner', assignmentScope: 'prod', target: 'kv-prod', operation: 'read-secret' })).toMatchObject({ decision: 'deny', deniedBy: 'role' });
    expect(rbac({ role: 'kv-secrets-user', assignmentScope: 'kv-prod', target: 'kv-prod', operation: 'read-secret' }).decision).toBe('allow');
    expect(rbac({ role: 'kv-secrets-user', assignmentScope: 'kv-prod', target: 'kv-prod', operation: 'write' }).decision).toBe('deny');
  });

  it('reports a data action on a non-vault resource as not applicable', () => {
    expect(rbac({ operation: 'read-secret' }).decision).toBe('not-applicable');
  });

  it('checks deny assignments before role assignments, even for Owner', () => {
    const result = rbac({ role: 'owner', assignmentScope: 'prod', target: 'sql-orders', operation: 'delete', denyAssignmentEnabled: true });
    expect(result).toMatchObject({ decision: 'deny', deniedBy: 'deny-assignment' });
  });

  it('leaves reads and resources outside the deny assignment unaffected', () => {
    expect(rbac({ role: 'owner', assignmentScope: 'prod', target: 'sql-orders', operation: 'read', denyAssignmentEnabled: true }).decision).toBe('allow');
    expect(rbac({ role: 'owner', assignmentScope: 'prod', target: 'app-web', operation: 'delete', denyAssignmentEnabled: true }).decision).toBe('allow');
  });

  it('computes role effective actions as Actions minus NotActions', () => {
    expect(roleAllows(roles.contributor, 'Microsoft.Compute/virtualMachines/write', false).allowed).toBe(true);
    expect(roleAllows(roles.contributor, 'Microsoft.Authorization/roleAssignments/write', false).allowed).toBe(false);
    expect(roleAllows(roles.owner, 'Microsoft.KeyVault/vaults/secrets/getSecret/action', true).allowed).toBe(false);
  });

  it('is deterministic and ends with the decision', () => {
    const params = { role: 'owner', assignmentScope: 'corp', target: 'vm-test', operation: 'delete' };
    const a = computeHistory(rbacScopeSimulation, params);
    const b = computeHistory(rbacScopeSimulation, params);
    expect(JSON.stringify(a.map((h) => h.state))).toBe(JSON.stringify(b.map((h) => h.state)));
    expect(a[a.length - 1]!.state.decision).toBe('allow');
  });
});
