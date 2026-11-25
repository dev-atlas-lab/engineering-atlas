import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A deliberately scoped model of AWS IAM policy evaluation for requests within
// ONE account, following the order documented in "Policy evaluation for
// requests within a single account". It models: explicit deny across all
// policy types, SCPs, same-account resource-based policies (including the
// IAM user / role ARN / session ARN distinction), identity-based policies,
// permissions boundaries, and session policies.
//
// Not modelled: resource control policies (assumed to be the default
// RCPFullAWSAccess), conditions, NotAction/NotResource/NotPrincipal,
// cross-account requests, KMS key policy and role trust policy special cases,
// VPC endpoint policies, and the root user. Simulated — nothing is sent to AWS.

export const ACCOUNT = '111122223333';

export type PrincipalChoice = 'user' | 'role';
export type ActionChoice = 's3:GetObject' | 's3:PutObject' | 's3:DeleteObject';
export type BucketChoice = 'reports-bucket' | 'payroll-bucket';
export type IdentityPolicyChoice = 'none' | 'read-reports' | 'read-write-reports' | 's3-full';
export type ExplicitDenyChoice = 'none' | 'identity-deny-delete' | 'bucket-deny-delete' | 'scp-deny-payroll';
export type ResourcePolicyChoice = 'none' | 'allow-principal-read' | 'allow-session-read';
export type ScpChoice = 'not-in-organization' | 'full-access' | 'read-only';
export type BoundaryChoice = 'none' | 'read-only';
export type SessionPolicyChoice = 'none' | 'reports-only';

export interface PolicyConfig {
  principal: PrincipalChoice;
  action: ActionChoice;
  bucket: BucketChoice;
  identityPolicy: IdentityPolicyChoice;
  explicitDeny: ExplicitDenyChoice;
  resourcePolicy: ResourcePolicyChoice;
  scp: ScpChoice;
  boundary: BoundaryChoice;
  sessionPolicy: SessionPolicyChoice;
}

export type PolicyKind = 'scp' | 'resource' | 'identity' | 'boundary' | 'session';

export interface Statement {
  sid: string;
  effect: 'Allow' | 'Deny';
  actions: string[];
  resources: string[];
  /** Resource-based policies only: the principal ARN the statement names, or "*". */
  principal?: string;
}

export interface Policy {
  kind: PolicyKind;
  name: string;
  statements: Statement[];
}

export interface StatementMatch {
  sid: string;
  effect: 'Allow' | 'Deny';
  matches: boolean;
  /** Why it does or does not match this request. */
  note: string;
}

export interface ConsideredPolicy extends Policy {
  json: string;
  matches: StatementMatch[];
}

export type EvalStage = 'request' | 'collect' | 'explicit-deny' | 'scp' | 'resource' | 'identity' | 'boundary' | 'session' | 'decision';
export type StepVerdict = 'info' | 'pass' | 'skipped' | 'allow' | 'deny';

export interface EvalStep {
  stage: EvalStage;
  title: string;
  detail: string;
  verdict: StepVerdict;
}

export type Decision = 'allow' | 'explicit-deny' | 'implicit-deny';

export interface Evaluation {
  principalArn: string;
  sessionArn: string | null;
  resourceArn: string;
  policies: ConsideredPolicy[];
  steps: EvalStep[];
  decision: Decision;
  /** The policy type that settled the result. */
  decidedBy: PolicyKind | 'default';
  /** For an allow: which kind of policy granted it. */
  grantedBy: 'identity' | 'resource' | null;
  reason: string;
}

export interface PolicyEvalState {
  config: PolicyConfig;
  principalArn: string;
  resourceArn: string;
  policies: ConsideredPolicy[];
  steps: EvalStep[];
  decision: Decision | null;
  decidedBy: Evaluation['decidedBy'] | null;
  grantedBy: Evaluation['grantedBy'];
  reason: string | null;
}

// --- Identities and resources -----------------------------------------------

const userArn = `arn:aws:iam::${ACCOUNT}:user/dana`;
const roleArn = `arn:aws:iam::${ACCOUNT}:role/app-role`;
const sessionArn = `arn:aws:sts::${ACCOUNT}:assumed-role/app-role/build-42`;

const objectKey: Record<BucketChoice, string> = {
  'reports-bucket': '2026/q3-summary.csv',
  'payroll-bucket': '2026/october.csv',
};

export function principalArnFor(principal: PrincipalChoice): string {
  return principal === 'user' ? userArn : roleArn;
}

export function resourceArnFor(bucket: BucketChoice): string {
  return `arn:aws:s3:::${bucket}/${objectKey[bucket]}`;
}

// --- Matching ---------------------------------------------------------------

/** IAM-style wildcard match: "*" matches any run of characters, "?" one character. */
export function wildcardMatch(pattern: string, value: string, caseInsensitive = false): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, caseInsensitive ? 'i' : '').test(value);
}

function statementMatches(s: Statement, action: string, resource: string, callerArns: string[]): StatementMatch {
  // Action names are case-insensitive in IAM; resource ARNs are matched as written.
  const actionOk = s.actions.some((a) => wildcardMatch(a, action, true));
  const resourceOk = s.resources.some((r) => wildcardMatch(r, resource));
  const principalOk = s.principal === undefined || s.principal === '*' || callerArns.includes(s.principal);
  const problems = [
    !actionOk && `action ${action} is not in [${s.actions.join(', ')}]`,
    !resourceOk && `resource is not in [${s.resources.join(', ')}]`,
    !principalOk && `principal ${s.principal} is not the caller`,
  ].filter(Boolean);
  return {
    sid: s.sid,
    effect: s.effect,
    matches: problems.length === 0,
    note: problems.length === 0 ? `Matches: action, resource${s.principal ? ', and principal' : ''} all apply.` : `No match: ${problems.join('; ')}.`,
  };
}

// --- Building the policies from the configuration ----------------------------

export function buildPolicies(config: PolicyConfig): Policy[] {
  const policies: Policy[] = [];
  const named = principalArnFor(config.principal);

  if (config.scp !== 'not-in-organization') {
    const statements: Statement[] =
      config.scp === 'full-access'
        ? [{ sid: 'FullAWSAccess', effect: 'Allow', actions: ['*'], resources: ['*'] }]
        : [{ sid: 'ReadOnlyS3', effect: 'Allow', actions: ['s3:Get*', 's3:List*'], resources: ['*'] }];
    if (config.explicitDeny === 'scp-deny-payroll') {
      statements.push({ sid: 'DenyPayroll', effect: 'Deny', actions: ['s3:*'], resources: ['arn:aws:s3:::payroll-bucket/*'] });
    }
    policies.push({ kind: 'scp', name: config.scp === 'full-access' ? 'SCP: FullAWSAccess' : 'SCP: S3 read-only', statements });
  }

  const resourceStatements: Statement[] = [];
  if (config.resourcePolicy === 'allow-principal-read') {
    resourceStatements.push({ sid: 'AllowNamedPrincipalRead', effect: 'Allow', principal: named, actions: ['s3:GetObject'], resources: [`arn:aws:s3:::${config.bucket}/*`] });
  }
  if (config.resourcePolicy === 'allow-session-read') {
    resourceStatements.push({ sid: 'AllowSessionRead', effect: 'Allow', principal: sessionArn, actions: ['s3:GetObject'], resources: [`arn:aws:s3:::${config.bucket}/*`] });
  }
  if (config.explicitDeny === 'bucket-deny-delete') {
    resourceStatements.push({ sid: 'DenyDeleteForEveryone', effect: 'Deny', principal: '*', actions: ['s3:DeleteObject'], resources: [`arn:aws:s3:::${config.bucket}/*`] });
  }
  if (resourceStatements.length > 0) {
    policies.push({ kind: 'resource', name: `Bucket policy on ${config.bucket}`, statements: resourceStatements });
  }

  const identityStatements: Statement[] = [];
  if (config.identityPolicy === 'read-reports') {
    identityStatements.push({ sid: 'ReadReports', effect: 'Allow', actions: ['s3:GetObject'], resources: ['arn:aws:s3:::reports-bucket/*'] });
  }
  if (config.identityPolicy === 'read-write-reports') {
    identityStatements.push({ sid: 'ReadWriteReports', effect: 'Allow', actions: ['s3:GetObject', 's3:PutObject'], resources: ['arn:aws:s3:::reports-bucket/*'] });
  }
  if (config.identityPolicy === 's3-full') {
    identityStatements.push({ sid: 'AllS3', effect: 'Allow', actions: ['s3:*'], resources: ['*'] });
  }
  if (config.explicitDeny === 'identity-deny-delete') {
    identityStatements.push({ sid: 'DenyDeletes', effect: 'Deny', actions: ['s3:DeleteObject'], resources: ['*'] });
  }
  if (identityStatements.length > 0) {
    policies.push({ kind: 'identity', name: `Identity policy on ${config.principal === 'user' ? 'user/dana' : 'role/app-role'}`, statements: identityStatements });
  }

  if (config.boundary === 'read-only') {
    policies.push({
      kind: 'boundary',
      name: 'Permissions boundary: S3 read-only',
      statements: [{ sid: 'BoundaryReadOnly', effect: 'Allow', actions: ['s3:Get*', 's3:List*'], resources: ['*'] }],
    });
  }

  // Session policies exist only for role (and federated) sessions.
  if (config.principal === 'role' && config.sessionPolicy === 'reports-only') {
    policies.push({
      kind: 'session',
      name: 'Session policy passed to AssumeRole',
      statements: [{ sid: 'SessionReportsOnly', effect: 'Allow', actions: ['s3:*'], resources: ['arn:aws:s3:::reports-bucket/*'] }],
    });
  }

  return policies;
}

function policyJson(policy: Policy): string {
  return JSON.stringify(
    {
      Version: '2012-10-17',
      Statement: policy.statements.map((s) => ({
        Sid: s.sid,
        Effect: s.effect,
        ...(s.principal ? { Principal: s.principal === '*' ? '*' : { AWS: s.principal } } : {}),
        Action: s.actions.length === 1 ? s.actions[0] : s.actions,
        Resource: s.resources.length === 1 ? s.resources[0] : s.resources,
      })),
    },
    null,
    2,
  );
}

const kindLabel: Record<PolicyKind, string> = {
  scp: 'service control policy',
  resource: 'resource-based policy',
  identity: 'identity-based policy',
  boundary: 'permissions boundary',
  session: 'session policy',
};

// --- Evaluation ---------------------------------------------------------------

/** Evaluates one request. Pure and deterministic: the single source of every
 *  step, match, and the final decision with its reason. */
export function evaluatePolicies(config: PolicyConfig): Evaluation {
  const principalArn = principalArnFor(config.principal);
  const callerArns = config.principal === 'role' ? [roleArn, sessionArn] : [userArn];
  const resourceArn = resourceArnFor(config.bucket);
  const action = config.action;

  const policies: ConsideredPolicy[] = buildPolicies(config).map((p) => ({
    ...p,
    json: policyJson(p),
    matches: p.statements.map((s) => statementMatches(s, action, resourceArn, callerArns)),
  }));
  const ofKind = (kind: PolicyKind) => policies.find((p) => p.kind === kind);
  const matching = (p: ConsideredPolicy | undefined, effect: 'Allow' | 'Deny') =>
    (p?.matches ?? []).filter((m) => m.effect === effect && m.matches);

  const steps: EvalStep[] = [];
  const caller = config.principal === 'user' ? 'IAM user dana' : 'A session of role app-role (session build-42)';
  steps.push({
    stage: 'request',
    title: 'The request',
    detail: `${caller} calls ${action} on ${resourceArn}. Every request starts implicitly denied.`,
    verdict: 'info',
  });

  const skipped: string[] = [];
  if (config.scp === 'not-in-organization') skipped.push('no SCPs (the account is not in an organization)');
  if (config.principal === 'user' && config.sessionPolicy !== 'none') skipped.push('the session policy (IAM users have no role session)');
  steps.push({
    stage: 'collect',
    title: 'Collect the applicable policies',
    detail:
      (policies.length > 0
        ? `Considered: ${policies.map((p) => p.name).join('; ')}.`
        : 'No policies apply to this request at all.') + (skipped.length > 0 ? ` Not applicable: ${skipped.join('; ')}.` : '') +
      ' Resource control policies are not modelled here (assumed to be the default, which allows everything).',
    verdict: 'info',
  });

  const finish = (decision: Decision, decidedBy: Evaluation['decidedBy'], grantedBy: Evaluation['grantedBy'], reason: string): Evaluation => {
    steps.push({ stage: 'decision', title: decision === 'allow' ? 'Final decision: Allow' : decision === 'explicit-deny' ? 'Final decision: Deny (explicit)' : 'Final decision: Deny (implicit)', detail: reason, verdict: decision === 'allow' ? 'allow' : 'deny' });
    return { principalArn, sessionArn: config.principal === 'role' ? sessionArn : null, resourceArn, policies, steps, decision, decidedBy, grantedBy, reason };
  };

  // 1. Explicit deny anywhere ends evaluation.
  const denies = policies.flatMap((p) => matching(p, 'Deny').map((m) => ({ policy: p, sid: m.sid })));
  if (denies.length > 0) {
    const d = denies[0]!;
    const allowsToo = policies.some((p) => matching(p, 'Allow').length > 0);
    steps.push({
      stage: 'explicit-deny',
      title: 'Check every policy for an explicit Deny',
      detail: `Statement “${d.sid}” in the ${kindLabel[d.policy.kind]} (${d.policy.name}) denies this request.${allowsToo ? ' Other statements allow it, but an explicit deny always overrides an allow.' : ''}`,
      verdict: 'deny',
    });
    return finish('explicit-deny', d.policy.kind, null, `Explicitly denied by “${d.sid}” in the ${kindLabel[d.policy.kind]}. No allow anywhere can override this.`);
  }
  steps.push({ stage: 'explicit-deny', title: 'Check every policy for an explicit Deny', detail: 'No Deny statement matches this request. Evaluation continues.', verdict: 'pass' });

  // 2. Organization guardrail.
  const scp = ofKind('scp');
  if (scp) {
    const allow = matching(scp, 'Allow')[0];
    if (!allow) {
      steps.push({ stage: 'scp', title: 'Service control policy', detail: `The account’s SCP (${scp.name}) has no Allow covering ${action}. SCPs never grant, but everything must fall inside them.`, verdict: 'deny' });
      return finish('implicit-deny', 'scp', null, `Implicitly denied: ${action} is outside the organization’s SCP, so no identity or resource policy can allow it in this account.`);
    }
    steps.push({ stage: 'scp', title: 'Service control policy', detail: `“${allow.sid}” in the SCP allows ${action}, so the request is inside the organization’s ceiling. This grants nothing by itself.`, verdict: 'pass' });
  } else {
    steps.push({ stage: 'scp', title: 'Service control policy', detail: 'Skipped — the account is not in an organization.', verdict: 'skipped' });
  }

  // 3. Same-account resource-based policy.
  const resource = ofKind('resource');
  const resourceAllow = matching(resource, 'Allow')[0];
  let grantedByResource = false;
  if (resourceAllow) {
    const statement = resource!.statements.find((s) => s.sid === resourceAllow.sid)!;
    if (config.principal === 'user' || statement.principal === sessionArn) {
      const whom = config.principal === 'user' ? 'names the IAM user directly' : 'names the role session ARN directly';
      steps.push({
        stage: 'resource',
        title: 'Resource-based policy',
        detail: `“${resourceAllow.sid}” ${whom}. Within one account, that allow is sufficient: an implicit deny in identity policies${config.principal === 'user' ? ' or a permissions boundary' : ', a permissions boundary, or a session policy'} does not limit it.`,
        verdict: 'allow',
      });
      return finish('allow', 'resource', 'resource', `Allowed by “${resourceAllow.sid}” in the bucket policy, which names the caller directly. No identity-based allow was needed.`);
    }
    grantedByResource = true;
    steps.push({
      stage: 'resource',
      title: 'Resource-based policy',
      detail: `“${resourceAllow.sid}” names the role ARN. That grants access, but for a role session it is still limited by any permissions boundary and session policy, which are checked next.`,
      verdict: 'pass',
    });
  } else {
    steps.push({
      stage: 'resource',
      title: 'Resource-based policy',
      detail: resource ? 'The bucket policy has no Allow statement for this caller and action. An identity-based allow is now required.' : 'No resource-based policy applies. An identity-based allow is now required.',
      verdict: resource ? 'pass' : 'skipped',
    });
  }

  // 4. Identity-based policy.
  const identity = ofKind('identity');
  const identityAllow = matching(identity, 'Allow')[0];
  if (!grantedByResource) {
    if (!identityAllow) {
      steps.push({
        stage: 'identity',
        title: 'Identity-based policy',
        detail: identity ? `No statement in ${identity.name} allows ${action} on this resource.` : 'The principal has no identity-based policy.',
        verdict: 'deny',
      });
      return finish('implicit-deny', 'identity', null, `Implicitly denied: nothing grants ${action} on this resource. This is a missing permission, not a deliberate deny.`);
    }
    steps.push({ stage: 'identity', title: 'Identity-based policy', detail: `“${identityAllow.sid}” allows ${action} on this resource.`, verdict: 'pass' });
  } else {
    steps.push({ stage: 'identity', title: 'Identity-based policy', detail: identityAllow ? `“${identityAllow.sid}” also allows it, though the resource policy already granted access.` : 'Not required — the resource-based policy granted access to the role.', verdict: 'skipped' });
  }

  // 5. Permissions boundary.
  const boundary = ofKind('boundary');
  if (boundary) {
    const allow = matching(boundary, 'Allow')[0];
    if (!allow) {
      steps.push({ stage: 'boundary', title: 'Permissions boundary', detail: `The boundary allows only S3 reads and lists, so ${action} falls outside it.`, verdict: 'deny' });
      return finish('implicit-deny', 'boundary', null, `Implicitly denied by the permissions boundary: ${action} is granted but outside the maximum this ${config.principal === 'user' ? 'user' : 'role'} may ever have.`);
    }
    steps.push({ stage: 'boundary', title: 'Permissions boundary', detail: `“${allow.sid}” in the boundary covers ${action}.`, verdict: 'pass' });
  } else {
    steps.push({ stage: 'boundary', title: 'Permissions boundary', detail: 'No permissions boundary is set.', verdict: 'skipped' });
  }

  // 6. Session policy.
  const session = ofKind('session');
  if (session) {
    const allow = matching(session, 'Allow')[0];
    if (!allow) {
      steps.push({ stage: 'session', title: 'Session policy', detail: `The session policy allows only objects in reports-bucket, so this session cannot touch ${config.bucket}.`, verdict: 'deny' });
      return finish('implicit-deny', 'session', null, `Implicitly denied by the session policy, which narrows this one session to reports-bucket — even though the role itself is permitted.`);
    }
    steps.push({ stage: 'session', title: 'Session policy', detail: `“${allow.sid}” in the session policy covers this request.`, verdict: 'pass' });
  } else {
    steps.push({ stage: 'session', title: 'Session policy', detail: config.principal === 'role' ? 'No session policy was passed when the role was assumed.' : 'Not applicable to IAM users.', verdict: 'skipped' });
  }

  return grantedByResource
    ? finish('allow', 'resource', 'resource', `Allowed by “${resourceAllow!.sid}” in the bucket policy, and inside every guardrail that applies to the role session.`)
    : finish('allow', 'identity', 'identity', `Allowed by “${identityAllow!.sid}” in the identity-based policy, and inside every guardrail that applies.`);
}

// --- Simulation definition ----------------------------------------------------

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readPolicyConfig(params: SimulationParams): PolicyConfig {
  return {
    principal: pick(params.principal, ['user', 'role'] as const, 'role'),
    action: pick(params.action, ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'] as const, 's3:PutObject'),
    bucket: pick(params.bucket, ['reports-bucket', 'payroll-bucket'] as const, 'reports-bucket'),
    identityPolicy: pick(params.identityPolicy, ['none', 'read-reports', 'read-write-reports', 's3-full'] as const, 'read-reports'),
    explicitDeny: pick(params.explicitDeny, ['none', 'identity-deny-delete', 'bucket-deny-delete', 'scp-deny-payroll'] as const, 'none'),
    resourcePolicy: pick(params.resourcePolicy, ['none', 'allow-principal-read', 'allow-session-read'] as const, 'none'),
    scp: pick(params.scp, ['not-in-organization', 'full-access', 'read-only'] as const, 'full-access'),
    boundary: pick(params.boundary, ['none', 'read-only'] as const, 'none'),
    sessionPolicy: pick(params.sessionPolicy, ['none', 'reports-only'] as const, 'none'),
  };
}

export const policyEvaluationSimulation: SimulationDefinition<PolicyEvalState> = {
  id: 'iam-policy-evaluation',
  title: 'IAM Policy Evaluation',
  description:
    'Evaluates one S3 request against the policies you configure, in the order AWS documents for requests within a single account. Simplified and simulated: conditions, resource control policies, and cross-account rules are not modelled, and nothing is sent to AWS.',
  parameters: [
    {
      key: 'principal',
      label: 'Principal',
      type: 'select',
      default: 'role',
      options: [
        { label: 'Role session: app-role/build-42', value: 'role' },
        { label: 'IAM user: dana', value: 'user' },
      ],
      description: 'Who is making the request.',
    },
    {
      key: 'action',
      label: 'Requested action',
      type: 'select',
      default: 's3:PutObject',
      options: [
        { label: 's3:GetObject (read)', value: 's3:GetObject' },
        { label: 's3:PutObject (write)', value: 's3:PutObject' },
        { label: 's3:DeleteObject (delete)', value: 's3:DeleteObject' },
      ],
      description: 'The API action requested.',
    },
    {
      key: 'bucket',
      label: 'Resource',
      type: 'select',
      default: 'reports-bucket',
      options: [
        { label: 'reports-bucket/2026/q3-summary.csv', value: 'reports-bucket' },
        { label: 'payroll-bucket/2026/october.csv', value: 'payroll-bucket' },
      ],
      description: 'The object being accessed.',
    },
    {
      key: 'identityPolicy',
      label: 'Identity-based policy',
      type: 'select',
      default: 'read-reports',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Read reports-bucket', value: 'read-reports' },
        { label: 'Read and write reports-bucket', value: 'read-write-reports' },
        { label: 's3:* on all resources', value: 's3-full' },
      ],
      description: 'Permissions attached to the principal.',
    },
    {
      key: 'resourcePolicy',
      label: 'Bucket policy grant',
      type: 'select',
      default: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Allow read to the principal (user or role ARN)', value: 'allow-principal-read' },
        { label: 'Allow read to the role session ARN', value: 'allow-session-read' },
      ],
      description: 'A resource-based policy on the bucket being accessed.',
    },
    {
      key: 'explicitDeny',
      label: 'Explicit deny',
      type: 'select',
      default: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Identity policy: deny s3:DeleteObject everywhere', value: 'identity-deny-delete' },
        { label: 'Bucket policy: deny s3:DeleteObject for everyone', value: 'bucket-deny-delete' },
        { label: 'SCP: deny all S3 actions on payroll-bucket', value: 'scp-deny-payroll' },
      ],
      description: 'A Deny statement added to one of the policies.',
    },
    {
      key: 'scp',
      label: 'Service control policy',
      type: 'select',
      default: 'full-access',
      options: [
        { label: 'FullAWSAccess (allow everything)', value: 'full-access' },
        { label: 'Allow only s3:Get* and s3:List*', value: 'read-only' },
        { label: 'Account is not in an organization', value: 'not-in-organization' },
      ],
      description: 'The organization guardrail for the account.',
    },
    {
      key: 'boundary',
      label: 'Permissions boundary',
      type: 'select',
      default: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Allow only s3:Get* and s3:List*', value: 'read-only' },
      ],
      description: 'A maximum for this user or role’s identity-based permissions.',
    },
    {
      key: 'sessionPolicy',
      label: 'Session policy (role sessions only)',
      type: 'select',
      default: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Allow s3:* on reports-bucket only', value: 'reports-only' },
      ],
      description: 'Passed when the role was assumed; narrows this session only.',
    },
  ],
  createInitialState: (params) => {
    const config = readPolicyConfig(params);
    const evaluation = evaluatePolicies(config);
    return {
      config,
      principalArn: evaluation.principalArn,
      resourceArn: evaluation.resourceArn,
      policies: evaluation.policies,
      steps: [],
      decision: null,
      decidedBy: null,
      grantedBy: null,
      reason: null,
    };
  },
  steps: (params) => {
    const evaluation = evaluatePolicies(readPolicyConfig(params));
    return evaluation.steps.map((step, i) => {
      const isLast = i === evaluation.steps.length - 1;
      return {
        id: `eval-${i + 1}`,
        label: step.title,
        description: step.detail,
        apply: (state: PolicyEvalState): PolicyEvalState => ({
          ...state,
          steps: [...state.steps, step],
          decision: isLast ? evaluation.decision : null,
          decidedBy: isLast ? evaluation.decidedBy : null,
          grantedBy: isLast ? evaluation.grantedBy : null,
          reason: isLast ? evaluation.reason : null,
        }),
      };
    });
  },
};
