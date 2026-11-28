import type { ConceptContentModule, LessonBody } from '../../types';

const authzModes: LessonBody = {
  learningObjectives: ['Enumerate the authorization modes and when each applies'],
  sections: [
    {
      heading: 'RBAC is the default, not the only, authorizer',
      blocks: [
        {
          type: 'paragraph',
          text: 'The API Server is configured with a list of authorizers (`--authorization-mode`). For each request, after authentication, each authorizer in turn returns Allow, Deny, or NoOpinion. The first non-NoOpinion verdict decides. If every authorizer returns NoOpinion, the request is denied.',
        },
        {
          type: 'comparisonTable',
          headers: ['Mode', 'Grants permission via', 'Typical use'],
          rows: [
            ['RBAC', 'Role/ClusterRole + bindings', 'The default; used on virtually every cluster'],
            ['ABAC', 'A policy file of per-subject attributes', 'Legacy; replaced by RBAC'],
            ['Node', 'A built-in authorizer that lets kubelets access only resources on their own node', 'Always on; constrains kubelet credentials'],
            ['Webhook', 'An external HTTPS service returns Allow/Deny', 'Custom corporate policy engines'],
            ['AlwaysAllow / AlwaysDeny', 'Trivial', 'Testing only — never in production'],
          ],
        },
        {
          type: 'paragraph',
          text: 'A production cluster usually runs with `--authorization-mode=Node,RBAC`. Node handles kubelet-specific scoping; RBAC handles everything else.',
        },
      ],
    },
  ],
};

const unionOfAllows: LessonBody = {
  learningObjectives: ['Explain why RBAC is default-deny'],
  sections: [
    {
      heading: 'Only allows; no denies',
      blocks: [
        {
          type: 'paragraph',
          text: 'RBAC has no deny rule. A request is allowed if any binding grants the required permission; it is denied if no binding grants it. This is the opposite of many legacy systems (where denies override allows) and simpler to reason about — permissions always grow by adding bindings.',
        },
        {
          type: 'list',
          items: [
            'Alice has a RoleBinding to pod-reader (read pods). She tries to delete a pod. Deny — no rule grants delete.',
            'Alice also has a ClusterRoleBinding to the system:view ClusterRole. She reads pods anywhere. Allow — the view ClusterRole grants get/list/watch everywhere.',
            'Alice tries to delete a Pod. Still denied — neither binding grants delete.',
            'To forbid Alice from reading a specific namespace, you cannot "deny" — you must remove or narrow the ClusterRoleBinding that grants view.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: '"We tried to add a deny rule and it didn\'t work" is a frequent misunderstanding. Kubernetes RBAC has no such rule. To tighten access, remove or scope down bindings. For richer policy (deny, time-based, attribute-based), use a webhook authorizer like OPA or Kyverno.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'authz-modes': authzModes,
    'union-of-allows': unionOfAllows,
  },
  labs: {},
  simulations: {},
};
