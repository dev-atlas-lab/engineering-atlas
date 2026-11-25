import type { ConceptContentModule, LessonBody } from '../../types';
import { rbacScopeScene } from './authorization-and-policies.scenes';

const authorizationModels: LessonBody = {
  learningObjectives: [
    'Define principals, actions, resources, conditions, permissions, roles, and policies',
    'Compare role-based and attribute-based access control',
    'Distinguish identity-based policies, resource-based policies, and permission guardrails',
  ],
  analogy:
    'A hospital grants access by job: every nurse’s badge opens the wards a nurse needs (a role). Some doors add a rule — “only staff assigned to this ward, only during their shift” (attributes and conditions). And the pharmacy keeps its own list of who may enter, whatever their badge says (a resource-based policy).',
  sections: [
    {
      heading: 'The vocabulary of an access decision',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Term', 'Meaning', 'Example'],
          rows: [
            ['Principal', 'The authenticated identity making the request', 'A user, group member, role session, or managed identity'],
            ['Action', 'The operation requested', 'Read a blob, delete a VM, assume a role'],
            ['Resource', 'The precise target, including its place in the hierarchy', 'An Azure resource ID or an AWS ARN'],
            ['Condition', 'Context that must also be true', 'Request over TLS, from a given network, resource tagged “team=payments”'],
            ['Permission', 'An allowed (or denied) action on a set of resources', '“Read objects in the reports bucket”'],
            ['Role', 'A named bundle of permissions', 'Reader, Contributor, a custom “Log Analyst” role'],
            ['Policy', 'A document stating permissions and where they apply', 'An AWS IAM policy, an Azure role assignment with its role definition'],
          ],
        },
      ],
    },
    {
      heading: 'Role-based access control (RBAC)',
      blocks: [
        {
          type: 'paragraph',
          text: 'In RBAC, permissions are grouped into roles, and principals receive roles — usually through group membership — at a scope. Access is managed by changing who holds which role, not by editing individual permissions. RBAC works well when job functions are stable and well understood, and it is easy to review: “who is Contributor on production?” has a clear answer.',
        },
        {
          type: 'paragraph',
          text: 'Its weakness is granularity. If every project and every environment needs its own variation, the number of roles and assignments explodes (“role explosion”), and people accumulate roles they no longer need.',
        },
      ],
    },
    {
      heading: 'Attribute-based access control (ABAC)',
      blocks: [
        {
          type: 'paragraph',
          text: 'ABAC adds conditions on attributes of the principal, the resource, and the request — for example, “allow if the principal’s team tag equals the resource’s team tag.” One rule can then cover many resources without a new assignment for each, and new resources are covered as soon as they are tagged correctly.',
        },
        {
          type: 'list',
          items: [
            'Azure supports conditions on role assignments for some data actions, such as Azure Storage blobs and queues, based on attributes like blob index tags.',
            'AWS supports tag-based conditions widely, for example comparing aws:PrincipalTag with aws:ResourceTag in an IAM policy.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'ABAC moves trust onto the attributes. If a principal can change a resource’s tags, or its own, it may be able to grant itself access. Control who can set the tags that policies depend on.',
        },
      ],
    },
    {
      heading: 'Where permissions are attached',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Mechanism', 'Attached to', 'Answers', 'Examples'],
          rows: [
            ['Identity-based policy or role assignment', 'The principal (or the scope it applies at)', 'What may this identity do?', 'AWS IAM policies on users and roles; Azure role assignments'],
            ['Resource-based policy', 'The resource', 'Who may act on this resource?', 'S3 bucket policies, KMS key policies, role trust policies'],
            ['Guardrail (permission ceiling)', 'An organization, account, or identity', 'What is the most that can ever be allowed here?', 'AWS SCPs and permissions boundaries; Azure deny assignments'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Grants and guardrails do different jobs. A grant says “allowed.” A guardrail never grants anything; it only limits what grants can achieve. An action must get through every applicable guardrail and be allowed by at least one grant.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Azure Policy and AWS Config rules govern how resources are configured — “storage accounts must not allow public access” — rather than which principals may call which actions. They are covered in Security Monitoring and Compliance.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'authz-kc-1',
      type: 'scenario',
      prompt:
        'A company has 200 project teams, each needing read access only to its own project’s storage. Which approach scales best without creating hundreds of near-identical roles?',
      difficulty: 'intermediate',
      learningObjective: 'Compare role-based and attribute-based access control',
      options: [
        { id: 'a', label: 'An attribute-based condition: allow when the principal’s project attribute matches the resource’s project tag, with tag changes restricted', correct: true, explanation: 'Correct — one rule covers every project, as long as the tags themselves are protected.' },
        { id: 'b', label: 'A custom role per project', correct: false, explanation: 'This is the role explosion ABAC is designed to avoid.' },
        { id: 'c', label: 'One Reader role on all storage for everyone', correct: false, explanation: 'Simple, but every team could read every other team’s data.' },
      ],
    },
    {
      id: 'authz-kc-2',
      type: 'single-choice',
      prompt: 'What does a permission guardrail such as an AWS service control policy do on its own?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish identity-based policies, resource-based policies, and permission guardrails',
      options: [
        { id: 'a', label: 'Limits the maximum permissions available; it grants nothing by itself', correct: true, explanation: 'Correct — an action still needs an allow from an identity-based or resource-based policy.' },
        { id: 'b', label: 'Grants its allowed actions to every principal in the account', correct: false, explanation: 'Guardrails never grant; that is the most common misunderstanding of SCPs.' },
        { id: 'c', label: 'Replaces identity-based policies', correct: false, explanation: 'Both are evaluated; the guardrail only filters.' },
      ],
    },
  ],
};

const howPolicyEvaluationWorks: LessonBody = {
  learningObjectives: [
    'Apply default deny, explicit deny, and allow rules to decide a request',
    'Explain why effective permissions are the intersection of grants and guardrails',
    'Distinguish an explicit deny from an implicit deny when troubleshooting',
  ],
  sections: [
    {
      heading: 'Three rules that cover most decisions',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Default deny: if nothing allows the action, it is denied. This is called an implicit deny.',
            'Explicit deny wins: if any applicable policy explicitly denies the action, it is denied, no matter how many policies allow it.',
            'Every guardrail must allow: when ceilings such as an organization policy or a permissions boundary apply, the action must fall inside all of them, as well as being granted somewhere.',
          ],
        },
        {
          type: 'code',
          code: 'decision(request):\n  policies = all policies that apply to this principal, action, and resource\n  if any statement in policies explicitly DENIES the request:\n      return DENY  (explicit)\n  for each guardrail in policies:\n      if the guardrail does not ALLOW the request:\n          return DENY  (implicit — outside a ceiling)\n  if some grant (identity-based or resource-based) ALLOWS the request:\n      return ALLOW\n  return DENY  (implicit — nothing allowed it)',
          caption: 'A generic model. Each provider adds its own rules — for example, AWS treats resource-based policies specially in some cases.',
        },
      ],
    },
    {
      heading: 'Effective permissions are an intersection',
      blocks: [
        {
          type: 'paragraph',
          text: 'Picture each policy as a set of allowed actions. Grants add to what a principal could do; guardrails cut the result down to their overlap; explicit denies punch holes through it. The effective permissions are what remains.',
        },
        {
          type: 'code',
          code: 'Identity policy grants:      s3:GetObject, s3:PutObject, s3:DeleteObject\nOrganization guardrail:      everything except s3:DeleteObject\nPermissions boundary:        s3:GetObject, s3:ListBucket\n----------------------------------------------------------------\nEffective:                   s3:GetObject\n(s3:ListBucket is inside the boundary but never granted;\n s3:PutObject is granted but outside the boundary.)',
        },
      ],
    },
    {
      heading: 'Conflicting statements',
      blocks: [
        {
          type: 'paragraph',
          text: 'Statements frequently overlap: one policy allows “all storage actions” while another denies “delete on the audit bucket.” There is no ordering, priority, or “most specific wins” among allow and deny statements in these models — the deny simply wins wherever both match. This is what makes explicit denies useful as safety rails: a deny for deleting audit logs cannot be overridden by a broader allow added later.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Azure RBAC role assignments contain no deny statements. A role’s NotActions only remove actions from that role’s own grant; another role assignment can still allow them. Only deny assignments deny in Azure RBAC.',
        },
      ],
    },
    {
      heading: 'Why the type of deny matters',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Result', 'Meaning', 'How to fix it'],
          rows: [
            ['Implicit deny — nothing granted it', 'No assignment or policy allows this action on this resource', 'Grant the narrowest permission that covers it'],
            ['Implicit deny — outside a guardrail', 'A grant exists, but an organization policy or boundary does not allow the action', 'Change the guardrail, which usually needs a different, more senior owner — or reconsider the request'],
            ['Explicit deny', 'A statement denies it on purpose', 'Find out why the deny exists before working around it; it is often a deliberate control'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Both providers include the reason in their tooling: AWS error messages often name the policy type that caused a denial, and Azure’s check-access tools show which assignments apply. The IAM Policy Evaluation Simulator lab lets you build these situations and watch each step.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'eval-kc-1',
      type: 'scenario',
      prompt:
        'A role’s identity policy allows s3:* on all buckets. A bucket policy on the audit bucket denies s3:DeleteObject for everyone. The role tries to delete an object in the audit bucket. What happens?',
      difficulty: 'intermediate',
      learningObjective: 'Apply default deny, explicit deny, and allow rules to decide a request',
      options: [
        { id: 'a', label: 'Denied — the explicit deny wins over the broader allow', correct: true, explanation: 'Correct — explicit denies are not outweighed by any number of allows.' },
        { id: 'b', label: 'Allowed — identity policies take priority over bucket policies', correct: false, explanation: 'There is no priority between policy types for a deny; any explicit deny wins.' },
        { id: 'c', label: 'Allowed — s3:* is more permissive', correct: false, explanation: 'Breadth does not matter; deny wins wherever it matches.' },
      ],
    },
    {
      id: 'eval-kc-2',
      type: 'multi-select',
      prompt: 'An identity policy allows ec2:StartInstances and ec2:StopInstances. A permissions boundary allows ec2:StartInstances and ec2:DescribeInstances. Which actions are effectively allowed? Select all that apply.',
      difficulty: 'advanced',
      learningObjective: 'Explain why effective permissions are the intersection of grants and guardrails',
      options: [
        { id: 'a', label: 'ec2:StartInstances', correct: true, explanation: 'Correct — granted and inside the boundary.' },
        { id: 'b', label: 'ec2:StopInstances', correct: false, explanation: 'Granted, but outside the boundary.' },
        { id: 'c', label: 'ec2:DescribeInstances', correct: false, explanation: 'Inside the boundary, but never granted. A boundary does not grant.' },
      ],
    },
    {
      id: 'eval-kc-3',
      type: 'single-choice',
      prompt: 'In Azure RBAC, a user holds Contributor (which lists Microsoft.Authorization/*/Write in NotActions) and also User Access Administrator. Can they write role assignments?',
      difficulty: 'advanced',
      learningObjective: 'Distinguish an explicit deny from an implicit deny when troubleshooting',
      options: [
        { id: 'a', label: 'Yes — NotActions only narrow Contributor’s own grant; User Access Administrator allows it, and role assignments are additive', correct: true, explanation: 'Correct — NotActions are not a deny.' },
        { id: 'b', label: 'No — NotActions deny the action across all roles', correct: false, explanation: 'Only deny assignments deny in Azure RBAC.' },
        { id: 'c', label: 'Only if both roles are assigned at the same scope', correct: false, explanation: 'Effective permissions combine assignments from all scopes that contain the resource.' },
      ],
    },
  ],
};

const designingForLeastPrivilege: LessonBody = {
  learningObjectives: [
    'Scope permissions to the actions, resources, and time a task actually needs',
    'Recognize privilege-escalation paths in permission sets',
    'Describe a policy lifecycle that keeps permissions right-sized over time',
  ],
  sections: [
    {
      heading: 'Least privilege has three dimensions',
      blocks: [
        {
          type: 'list',
          items: [
            'Actions: only the operations the task requires — read-only where writing is not needed.',
            'Resources and scope: the specific resource or resource group, not the whole subscription or every bucket in the account.',
            'Time: elevated rights only while they are being used — just-in-time activation or short role sessions instead of standing access.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Least privilege limits the blast radius of mistakes and compromises. If a deployment pipeline only has rights on its own resource group, a leaked pipeline credential cannot delete the database next door.',
        },
      ],
    },
    {
      heading: 'Privilege escalation: permissions that grant permissions',
      blocks: [
        {
          type: 'paragraph',
          text: 'Some permissions are dangerous less for what they do than for what they let you become. Reviewers should treat these as administrator-equivalent:',
        },
        {
          type: 'comparisonTable',
          headers: ['Permission', 'Why it escalates'],
          rows: [
            ['Azure: Microsoft.Authorization/roleAssignments/write', 'Lets the holder assign any role, including Owner, to anyone — including themselves'],
            ['AWS: iam:AttachRolePolicy, iam:PutRolePolicy, iam:CreatePolicyVersion', 'Lets the holder change what a role (possibly their own) is allowed to do'],
            ['AWS: iam:PassRole with broad resources', 'Lets the holder hand a powerful role to a new EC2 instance or function they control, then act as it'],
            ['Azure: control-plane rights that can read storage account keys', 'Account keys give full data access, bypassing data-plane role assignments — one reason to disable shared key authorization'],
            ['Writing to code or pipelines that run with a powerful identity', 'Whoever controls what runs controls the identity it runs as'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Guardrails exist partly for this: an AWS permissions boundary lets a team create roles without being able to create roles more powerful than the boundary, and Azure role assignment conditions can restrict which roles a delegated administrator may assign.',
        },
      ],
    },
    {
      heading: 'A lifecycle, not a one-time design',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Start from the task: list the actions and resources it needs, using provider documentation and policy generation tools rather than broad built-in roles.',
            'Write policies as code and review them like code, with automated validation for wildcards and escalation paths.',
            'Deploy with narrow scope and, for humans, time-limited activation.',
            'Monitor actual use: audit logs and unused-access analysis show which permissions are never exercised.',
            'Right-size: remove unused permissions and stale assignments; run periodic access reviews where a manager confirms each person still needs their access.',
          ],
        },
        {
          type: 'comparisonTable',
          headers: ['Capability', 'Azure', 'AWS'],
          rows: [
            ['Just-in-time elevation', 'Privileged Identity Management (eligible role assignments)', 'Short role sessions; temporary elevated access patterns for IAM Identity Center'],
            ['Periodic review', 'Microsoft Entra access reviews', 'IAM Access Analyzer unused-access findings; last-accessed information'],
            ['Policy authoring help', 'Built-in roles as a starting point; custom roles', 'IAM Access Analyzer policy validation and policy generation from CloudTrail activity'],
          ],
        },
      ],
    },
    {
      heading: 'Common misconfigurations',
      blocks: [
        {
          type: 'list',
          items: [
            'Wildcards everywhere: "Action": "*" or Owner at subscription scope for an application identity.',
            'Assignments to individuals instead of groups, which are never cleaned up when people move.',
            'Production and development in the same scope, so development credentials can reach production.',
            'Resource policies that allow a whole other account or “*” as principal without conditions.',
            'Permissions added during an incident and never removed.',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'lp-kc-1',
      type: 'scenario',
      prompt:
        'A deployment pipeline needs to create and update resources in one resource group. Which assignment follows least privilege best?',
      difficulty: 'intermediate',
      learningObjective: 'Scope permissions to the actions, resources, and time a task actually needs',
      options: [
        { id: 'a', label: 'Contributor on that resource group, to the pipeline’s own workload identity', correct: true, explanation: 'Correct — narrow scope, no ability to grant access, and an identity used only by the pipeline.' },
        { id: 'b', label: 'Owner on the subscription, so deployments never fail', correct: false, explanation: 'Owner includes granting access, and subscription scope covers everything else too.' },
        { id: 'c', label: 'Contributor on the subscription, to a shared engineer account', correct: false, explanation: 'Too broad, and a shared human account destroys accountability.' },
      ],
    },
    {
      id: 'lp-kc-2',
      type: 'multi-select',
      prompt: 'Which permissions should a reviewer treat as administrator-equivalent? Select all that apply.',
      difficulty: 'advanced',
      learningObjective: 'Recognize privilege-escalation paths in permission sets',
      options: [
        { id: 'a', label: 'Microsoft.Authorization/roleAssignments/write at subscription scope', correct: true, explanation: 'Correct — it can assign Owner to anyone.' },
        { id: 'b', label: 'iam:PassRole on "*" together with permission to launch EC2 instances', correct: true, explanation: 'Correct — the holder can run code as any role that EC2 may use.' },
        { id: 'c', label: 'Read-only access to CloudWatch metrics', correct: false, explanation: 'Read-only monitoring data does not change anyone’s permissions.' },
        { id: 'd', label: 'iam:CreatePolicyVersion on a policy attached to the holder’s own role', correct: true, explanation: 'Correct — they can rewrite their own permissions.' },
      ],
    },
  ],
};

const azureRbac: LessonBody = {
  learningObjectives: [
    'Read an Azure role definition, including Actions, NotActions, and DataActions',
    'Explain how role assignments inherit through management groups, subscriptions, resource groups, and resources',
    'Explain how deny assignments and role assignment conditions affect a decision',
  ],
  sections: [
    {
      heading: 'Role definitions',
      blocks: [
        {
          type: 'paragraph',
          text: 'An Azure role definition lists permissions in four fields. Actions and NotActions cover the management plane (creating, configuring, and deleting resources). DataActions and NotDataActions cover the data plane (reading blobs, getting secrets). AssignableScopes says where a custom role may be assigned.',
        },
        {
          type: 'code',
          language: 'json',
          code: '{\n  "roleName": "Contributor",\n  "actions": ["*"],\n  "notActions": [\n    "Microsoft.Authorization/*/Delete",\n    "Microsoft.Authorization/*/Write",\n    "Microsoft.Authorization/elevateAccess/Action",\n    "…"\n  ],\n  "dataActions": [],\n  "notDataActions": []\n}',
          caption: 'Abbreviated built-in Contributor role: every management action except managing access — and no data actions at all.',
        },
        {
          type: 'paragraph',
          text: 'Effective permissions for a role are its Actions minus its NotActions (and likewise for data actions). The built-in roles cover most needs: Reader, Contributor, Owner, service-specific roles such as Virtual Machine Contributor, and data roles such as Storage Blob Data Reader and Key Vault Secrets User.',
        },
      ],
    },
    {
      heading: 'Role assignments and scope',
      blocks: [
        {
          type: 'paragraph',
          text: 'A role assignment joins three things: a security principal (user, group, service principal, or managed identity), a role definition, and a scope. Scopes form a hierarchy — management group, subscription, resource group, resource — and an assignment applies at its scope and everything beneath it. Management groups can be nested up to six levels deep below the root management group.',
        },
        {
          type: 'list',
          items: [
            'Inheritance flows down only: an assignment on a resource group never grants anything on the subscription above it or on sibling resource groups.',
            'Assignments are additive: a principal’s effective permissions are the union of all roles assigned to it and its groups at every scope that contains the resource.',
            'You cannot remove an inherited permission lower down by assigning a weaker role; you must change the assignment where it was made.',
          ],
        },
      ],
    },
    {
      heading: 'How Azure decides',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'The caller’s token is validated, and their group memberships are resolved.',
            'Azure Resource Manager collects the role assignments and deny assignments that apply at the resource’s scope and above.',
            'If a deny assignment applies to the action, the request is denied.',
            'Otherwise, if any applicable role includes the action (and any role assignment condition is satisfied), it is allowed.',
            'Otherwise it is denied.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Deny assignments are created by Azure, not directly by administrators — for example by deployment stacks’ deny settings and by managed applications — to protect resources even from Owners. Role assignment conditions add attribute checks to specific data actions, such as allowing blob reads only for blobs with a particular index tag.',
        },
      ],
    },
    {
      heading: 'Management plane vs. data plane',
      blocks: [
        {
          type: 'paragraph',
          text: 'Being able to manage a resource does not imply being able to read its data. Contributor can reconfigure a Key Vault but has no data action to read secret values in a vault that uses the Azure RBAC permission model. The reverse also holds: Key Vault Secrets User can read secrets but not change the vault. Keep the two kinds of access separate, and grant data roles at the narrowest scope.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Some services offer data access outside RBAC — storage account keys and shared access signatures, or Key Vault’s legacy access policies. A management-plane role that can list keys or edit access policies can reach the data anyway. Prefer Microsoft Entra authorization and disable key-based access where you can.',
        },
      ],
    },
  ],
  visualization: rbacScopeScene,
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure role-based access control (Azure RBAC)',
    keyFeatures: [
      'Role definitions with Actions, NotActions, DataActions, and NotDataActions',
      'Role assignments at management group, subscription, resource group, or resource scope, inherited downward',
      'Hundreds of built-in roles, plus custom roles',
      'Deny assignments created by Azure features such as deployment stacks and managed applications',
      'Role assignment conditions (Azure ABAC) for supported data actions',
    ],
    terminology: {
      'Permission bundle': 'Role definition',
      'Grant': 'Role assignment (principal + role + scope)',
      'Explicit deny': 'Deny assignment',
      'Attribute-based condition': 'Role assignment condition (Azure ABAC)',
      'Resource hierarchy': 'Management group → subscription → resource group → resource',
    },
    architecturalNotes: [
      'Assignments are additive; NotActions are subtractions within one role, not denies.',
      'Authorization for Azure resources is separate from Microsoft Entra directory roles.',
      'Management-plane and data-plane permissions are distinct fields and should be granted separately.',
    ],
    limitations: [
      'Administrators cannot author arbitrary deny assignments directly.',
      'Role assignment conditions are supported only for specific data actions and services.',
      'Services with key- or policy-based data access can bypass RBAC unless those mechanisms are disabled.',
    ],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/overview',
  },
  knowledgeCheck: [
    {
      id: 'arbac-kc-1',
      type: 'scenario',
      prompt:
        'Ana is Reader on the Prod subscription and Contributor on resource group rg-web. What can she do to a VM in rg-data, another resource group in Prod?',
      difficulty: 'intermediate',
      learningObjective: 'Explain how role assignments inherit through management groups, subscriptions, resource groups, and resources',
      options: [
        { id: 'a', label: 'Read it only — Reader is inherited from the subscription; the rg-web assignment does not reach rg-data', correct: true, explanation: 'Correct — inheritance flows down from each assignment’s scope, never sideways.' },
        { id: 'b', label: 'Modify it — her strongest role applies everywhere', correct: false, explanation: 'A role applies only at its scope and below.' },
        { id: 'c', label: 'Nothing — the narrower assignment overrides the broader one', correct: false, explanation: 'Assignments are additive; none overrides another.' },
      ],
    },
    {
      id: 'arbac-kc-2',
      type: 'single-choice',
      prompt: 'A team is Contributor on a subscription. Why can’t they read secrets from a Key Vault in it that uses the Azure RBAC permission model?',
      difficulty: 'intermediate',
      learningObjective: 'Read an Azure role definition, including Actions, NotActions, and DataActions',
      options: [
        { id: 'a', label: 'Contributor has no DataActions; reading a secret is a data action that needs a role such as Key Vault Secrets User', correct: true, explanation: 'Correct — management and data permissions are separate fields.' },
        { id: 'b', label: 'Key Vault blocks all Contributors with a deny assignment', correct: false, explanation: 'No deny assignment is involved; the permission simply is not granted.' },
        { id: 'c', label: 'Secrets can only be read by Owners', correct: false, explanation: 'Owner also has no secret-reading data action by default.' },
      ],
    },
    {
      id: 'arbac-kc-3',
      type: 'single-choice',
      prompt: 'A subscription Owner tries to delete a resource group protected by a deployment stack with deny settings. What happens?',
      difficulty: 'advanced',
      learningObjective: 'Explain how deny assignments and role assignment conditions affect a decision',
      options: [
        { id: 'a', label: 'Denied — deny assignments are checked before role assignments and block even Owners', correct: true, explanation: 'Correct — unless the Owner is listed as an excluded principal.' },
        { id: 'b', label: 'Allowed — Owner has "*"', correct: false, explanation: 'Deny assignments take precedence over role assignments.' },
        { id: 'c', label: 'Allowed after the Owner adds Contributor at the resource group', correct: false, explanation: 'More allows cannot outweigh a deny.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Understand Azure role definitions', url: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/role-definitions' },
    { label: 'Understand Azure deny assignments', url: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/deny-assignments' },
    { label: 'Azure role assignment conditions (ABAC)', url: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/conditions-overview' },
  ],
};

const awsIamPolicies: LessonBody = {
  learningObjectives: [
    'Read an IAM policy statement: Effect, Action, Resource, Condition, and Principal',
    'Explain the order in which AWS evaluates SCPs, resource-based policies, identity-based policies, permissions boundaries, and session policies',
    'Explain why cross-account access needs both sides to allow',
  ],
  sections: [
    {
      heading: 'Anatomy of a policy',
      blocks: [
        {
          type: 'code',
          language: 'json',
          code: '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Sid": "ReadReports",\n      "Effect": "Allow",\n      "Action": ["s3:GetObject"],\n      "Resource": "arn:aws:s3:::reports-bucket/*",\n      "Condition": { "Bool": { "aws:SecureTransport": "true" } }\n    }\n  ]\n}',
          caption: 'An identity-based policy: read objects in one bucket, only over TLS.',
        },
        {
          type: 'paragraph',
          text: 'Each statement has an Effect (Allow or Deny), the Actions it covers (wildcards allowed, such as s3:Get*), the Resources as ARNs, and optional Conditions. Resource-based policies — bucket policies, KMS key policies, role trust policies — add a Principal element saying who the statement applies to. Policies are attached as AWS managed policies, customer managed policies, or inline policies.',
        },
      ],
    },
    {
      heading: 'Policy types and what each one does',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Policy type', 'Attached to', 'Grants?', 'Purpose'],
          rows: [
            ['Identity-based policy', 'IAM user, group, or role', 'Yes', 'What the identity may do'],
            ['Resource-based policy', 'A resource (bucket, key, queue, role trust policy)', 'Yes', 'Who may use this resource, including other accounts'],
            ['Service control policy (SCP)', 'AWS Organizations root, OU, or account', 'No', 'Maximum permissions for principals in member accounts'],
            ['Resource control policy (RCP)', 'AWS Organizations root, OU, or account', 'No', 'Maximum permissions on resources in member accounts, for supported services'],
            ['Permissions boundary', 'IAM user or role', 'No', 'Maximum permissions identity-based policies can give that identity'],
            ['Session policy', 'Passed when assuming a role or federating', 'No', 'Further narrows one session'],
          ],
        },
      ],
    },
    {
      heading: 'Evaluation within one account',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every request starts implicitly denied (the root user is the exception within its own account). AWS then works through the applicable policies:',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Explicit deny: if any applicable policy of any type denies the request, it is denied.',
            'Organization policies: if the account is in an organization, the request must be allowed by the applicable RCPs and SCPs; otherwise it is implicitly denied.',
            'Resource-based policy: if the resource’s policy allows the principal, the request can be allowed — with exceptions for role sessions described below.',
            'Identity-based policy: otherwise, an identity-based policy must allow the request.',
            'Permissions boundary: if one is set, it must also allow the request.',
            'Session policy: for a role or federated session with a session policy, it must also allow the request.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The resource-based policy step has subtleties. Within one account, a bucket policy that names an IAM user directly can allow access even if that user’s identity policies and permissions boundary do not. If it names a role ARN, an implicit deny in the role session’s permissions boundary or session policy still blocks it; if it names the specific session ARN, it does not. Across accounts, both the identity policy in the caller’s account and the resource policy in the resource’s account must allow the request.',
        },
      ],
    },
    {
      heading: 'Guardrails in practice',
      blocks: [
        {
          type: 'list',
          items: [
            'SCPs affect all users and roles in member accounts, including the member account’s root user, but not the organization’s management account or service-linked roles. They never grant permissions.',
            'Permissions boundaries let administrators delegate role creation safely: a developer may create roles, but only with a required boundary attached, so no new role can exceed it.',
            'Session policies are useful when one role serves many callers, each of which should receive only a slice of its permissions.',
            'Conditions such as aws:PrincipalOrgID in resource policies restrict access to principals from your own organization, which prevents accidental grants to the whole of AWS.',
          ],
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS Identity and Access Management (IAM) policies',
    keyFeatures: [
      'JSON policies with Effect, Action, Resource, Condition, and (for resource policies) Principal',
      'Identity-based and resource-based policies that grant',
      'SCPs, RCPs, permissions boundaries, and session policies that only limit',
      'Explicit deny overrides any allow',
      'IAM Access Analyzer for policy validation, external-access findings, and unused-access findings',
    ],
    terminology: {
      'Grant attached to an identity': 'Identity-based policy',
      'Grant attached to a resource': 'Resource-based policy (bucket policy, key policy, trust policy)',
      'Organization-wide ceiling': 'Service control policy (SCP) and resource control policy (RCP)',
      'Per-identity ceiling': 'Permissions boundary',
      'Per-session ceiling': 'Session policy',
      'Resource identifier': 'Amazon Resource Name (ARN)',
    },
    architecturalNotes: [
      'Policies are attached to identities and resources rather than assigned at hierarchical scopes.',
      'Cross-account access requires an allow on both sides.',
      'Resource-based policies interact with boundaries and session policies differently for IAM users, role ARNs, and session ARNs.',
    ],
    limitations: [
      'SCPs do not apply to the management account or to service-linked roles.',
      'RCPs apply only to a subset of AWS services.',
      'Evaluation has additional rules for KMS key policies and role trust policies, which must allow access explicitly.',
    ],
    documentationUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html',
  },
  knowledgeCheck: [
    {
      id: 'awspol-kc-1',
      type: 'scenario',
      prompt:
        'An account is in an organization whose SCP allows only s3:Get* and s3:List*. A role in that account has an identity policy allowing s3:*. Can the role upload an object?',
      difficulty: 'intermediate',
      learningObjective: 'Explain the order in which AWS evaluates SCPs, resource-based policies, identity-based policies, permissions boundaries, and session policies',
      options: [
        { id: 'a', label: 'No — s3:PutObject is outside the SCP, so it is implicitly denied regardless of the identity policy', correct: true, explanation: 'Correct — SCPs set the ceiling for member accounts.' },
        { id: 'b', label: 'Yes — identity policies override SCPs', correct: false, explanation: 'SCPs are a ceiling; identity policies cannot exceed it.' },
        { id: 'c', label: 'Yes — SCPs only affect the root user', correct: false, explanation: 'SCPs affect all IAM users and roles in member accounts, including the root user.' },
      ],
    },
    {
      id: 'awspol-kc-2',
      type: 'single-choice',
      prompt: 'A role in account A needs to read a bucket in account B. What must be true?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why cross-account access needs both sides to allow',
      options: [
        { id: 'a', label: 'Account A’s identity policy must allow the read, and account B’s bucket policy must allow the role', correct: true, explanation: 'Correct — each account controls its own side of the trust.' },
        { id: 'b', label: 'Only the bucket policy in account B must allow it', correct: false, explanation: 'Within one account that can be enough for some principals, but across accounts the caller’s side must also allow it.' },
        { id: 'c', label: 'Only account A’s identity policy must allow it', correct: false, explanation: 'Account B must explicitly trust the outside principal.' },
      ],
    },
    {
      id: 'awspol-kc-3',
      type: 'scenario',
      prompt:
        'A bucket policy in the same account allows the IAM user “dana” to read objects. Dana has no identity-based policies. Can Dana read objects?',
      difficulty: 'advanced',
      learningObjective: 'Read an IAM policy statement: Effect, Action, Resource, Condition, and Principal',
      options: [
        { id: 'a', label: 'Yes — within one account, a resource-based policy that names the IAM user can grant access on its own', correct: true, explanation: 'Correct — provided no explicit deny or organization policy blocks it.' },
        { id: 'b', label: 'No — every request needs an identity-based allow', correct: false, explanation: 'Within an account, a resource-based policy allow is sufficient for an IAM user named in it.' },
        { id: 'c', label: 'Only if Dana also has a permissions boundary', correct: false, explanation: 'A boundary never grants anything.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Policy evaluation for requests within a single account', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-basics.html' },
    { label: 'Cross-account policy evaluation logic', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html' },
    { label: 'Service control policies (SCPs)', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html' },
  ],
};

const authorizationComparison: LessonBody = {
  learningObjectives: [
    'Compare the scope-based Azure RBAC model with the policy-document AWS IAM model',
    'Map grants, denies, and guardrails across both platforms without treating them as identical',
  ],
  sections: [
    {
      heading: 'Two shapes of the same problem',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure RBAC is organized around a resource hierarchy: you choose a role and a scope, and the assignment flows down. AWS IAM is organized around policy documents: you write statements naming actions and resource ARNs, and attach them to identities or resources. Azure answers “what can this identity do here?” mostly through where assignments sit; AWS answers it mostly through what the statements say.',
        },
        {
          type: 'comparisonTable',
          headers: ['Aspect', 'Azure RBAC', 'AWS IAM'],
          rows: [
            ['Unit of grant', 'Role assignment: principal + role definition + scope', 'Policy statement attached to an identity or a resource'],
            ['Inheritance', 'Downward through management groups, subscriptions, resource groups, resources', 'None by hierarchy; organization policies cascade through OUs as ceilings only'],
            ['Explicit deny', 'Deny assignments, created by Azure features', 'Any policy statement with "Effect": "Deny", written by you'],
            ['Organization ceiling', 'No direct equivalent of SCPs for permissions; Azure Policy governs resource configuration instead', 'SCPs (principals) and RCPs (resources)'],
            ['Per-identity ceiling', 'No direct equivalent; delegation limited with role assignment conditions', 'Permissions boundary'],
            ['Resource-side grants', 'Assignments at resource scope; some services have their own data-plane permissions', 'Resource-based policies, including cross-account'],
            ['Attribute-based rules', 'Role assignment conditions for specific data actions', 'Conditions on tags and request context, broadly supported'],
            ['Management vs. data plane', 'Separate Actions and DataActions in each role', 'One action namespace per service, covering both'],
          ],
        },
      ],
    },
    {
      heading: 'Where the differences bite',
      blocks: [
        {
          type: 'list',
          items: [
            'Writing denies: on AWS you can add a targeted Deny statement yourself; on Azure, preventing an action usually means not granting it, or using Azure Policy to block the resource configuration.',
            'Cross-boundary access: AWS resource policies can grant to principals in other accounts directly. Azure typically uses guest identities (B2B), multi-tenant applications, or Azure Lighthouse delegation.',
            'Reviewing access: in Azure, list assignments at each scope above the resource; in AWS, consider every policy type that could apply, which is why tools like the IAM policy simulator and IAM Access Analyzer matter.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Neither model is simply “more secure.” Both reach least privilege when used carefully, and both fail the same way when wildcards and broad scopes become the default.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'authzcmp-kc-1',
      type: 'single-choice',
      prompt: 'A security team wants to guarantee that nobody in a set of AWS accounts can disable CloudTrail. What is the closest native mechanism, and what is the nearest Azure approach?',
      difficulty: 'advanced',
      learningObjective: 'Map grants, denies, and guardrails across both platforms without treating them as identical',
      options: [
        { id: 'a', label: 'An SCP denying the CloudTrail actions on AWS; on Azure, restrict who holds roles that can change diagnostic settings and use Azure Policy to enforce and audit the configuration', correct: true, explanation: 'Correct — Azure has no administrator-authored deny equivalent to an SCP, so it combines narrow grants with configuration policy.' },
        { id: 'b', label: 'A permissions boundary on every role on AWS; a deny assignment written by the team on Azure', correct: false, explanation: 'Boundaries are per identity and easy to miss; Azure deny assignments cannot be authored directly.' },
        { id: 'c', label: 'Both clouds use identical organization policies for this', correct: false, explanation: 'The mechanisms differ significantly.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'authorization-models': authorizationModels,
    'how-policy-evaluation-works': howPolicyEvaluationWorks,
    'designing-for-least-privilege': designingForLeastPrivilege,
    'azure-rbac': azureRbac,
    'aws-iam-policies': awsIamPolicies,
    'authorization-comparison': authorizationComparison,
  },
  labs: {},
  simulations: {},
};
