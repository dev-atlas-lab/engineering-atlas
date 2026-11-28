import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { rbacPermissionSimulation } from '../security-simulations';
import { renderRbacState } from '../security-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const fourKinds: LessonBody = {
  learningObjectives: [
    'Describe the four RBAC objects and how they interact',
    'Explain why there are two Role kinds and two Binding kinds',
  ],
  sections: [
    {
      heading: 'Permissions in one place, subjects in another',
      blocks: [
        {
          type: 'paragraph',
          text: 'RBAC separates "what permissions exist" from "who has them." Roles and ClusterRoles define rules — (apiGroups, resources, verbs). Bindings attach subjects to a role. Neither kind alone grants anything; the combination does.',
        },
        {
          type: 'comparisonTable',
          headers: ['Object', 'Scope', 'What it contains'],
          rows: [
            ['Role', 'Namespaced', 'Rules — valid only inside its namespace'],
            ['ClusterRole', 'Cluster', 'Rules — can be used cluster-wide or inside any namespace via RoleBinding'],
            ['RoleBinding', 'Namespaced', 'Subjects + reference to a Role or ClusterRole; grants only within its namespace'],
            ['ClusterRoleBinding', 'Cluster', 'Subjects + reference to a ClusterRole; grants cluster-wide'],
          ],
        },
      ],
    },
    {
      heading: 'Why two Role kinds, two Binding kinds',
      blocks: [
        {
          type: 'list',
          items: [
            'Role / RoleBinding — tenant-local grants. A team owns its namespace; permissions do not leak across namespaces.',
            'ClusterRole / ClusterRoleBinding — grants for cluster-scoped resources (Nodes, PersistentVolumes, cluster-wide policies).',
            'ClusterRole + RoleBinding — DRY pattern. Define a "view" ClusterRole once; use it in a RoleBinding in each namespace. Grants cluster-role\'s permissions but only inside the binding\'s namespace.',
            'Role + ClusterRoleBinding — NOT allowed. A ClusterRoleBinding cannot reference a namespaced Role.',
          ],
        },
      ],
    },
  ],
};

const walkingTheBinding: LessonBody = {
  learningObjectives: ['Trace how a request is authorized step by step'],
  sections: [
    {
      heading: 'Authz is "find one allowing rule"',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'The authenticated request arrives with (user, groups, extras) and (verb, resource, namespace, name).',
            'The RBAC authorizer scans every RoleBinding and ClusterRoleBinding.',
            'For each binding: filter by namespace scope (RoleBinding grants only in its namespace).',
            'Check that any of the binding\'s subjects matches the caller.',
            'Look up the referenced Role or ClusterRole.',
            'For each rule in that role, check (apiGroups, resources, resourceNames?, verbs) against the request.',
            'If any rule matches: Allow. If no binding\'s rule matches: Deny.',
          ],
        },
        {
          type: 'code',
          language: 'bash',
          code: `# Test authorization without issuing the real request.
kubectl auth can-i delete deployments -n team-a --as bob
# yes

kubectl auth can-i delete deployments -n team-b --as bob
# no`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: '`kubectl auth can-i` is the fastest way to answer "would this work?" It runs the same authorizer the API Server would, without side effects. Use it in CI to assert that your RBAC does not grant unexpected permissions.',
        },
      ],
    },
  ],
};

const rbacLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Submit API requests as different subjects against a cluster with four Roles/ClusterRoles and four bindings. See which binding grants (or denies) each request and why.',
  learningObjectives: [
    'See the chain subject → binding → role → rule execute',
    'Experience the "no binding at all" denial vs the "wrong verb" denial',
  ],
  prerequisites: [
    { type: 'knowledge', label: 'authn/authz/admission', description: 'Know the three gates and that RBAC is the authorization step.' },
  ],
  content: {
    simulationId: 'rbac-permission-simulator',
    instructions: [
      { id: 'step-1', label: 'Baseline: pod reader', description: 'alice gets pods in team-a. Allowed via RoleBinding to pod-reader.' },
      { id: 'step-2', label: 'Wrong verb', description: 'alice tries delete pods. Denied — pod-reader only grants get/list/watch.' },
      { id: 'step-3', label: 'Wrong namespace', description: 'alice tries get pods in team-b. Denied — her RoleBinding only applies in team-a.' },
      { id: 'step-4', label: 'Cluster-admin via Group', description: 'Subject = Group platform-ops, verb=delete, resource=nodes. Allowed — ClusterRoleBinding to cluster-admin.' },
      { id: 'step-5', label: 'ServiceAccount request', description: 'Subject = ServiceAccount tooling/ci, verb=list, resource=deployments, namespace=team-a. Allowed via the view ClusterRole.' },
      { id: 'step-6', label: 'No bindings at all', description: 'Subject = User carol. Every request denied — no binding references her.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'binding-named-when-allowed',
        label: 'An allow verdict always names the binding that granted it',
        check: (state) => {
          const s = state as { decision: { allowed: boolean; matchedBinding: string | null } | null };
          return s.decision === null || !s.decision.allowed || s.decision.matchedBinding !== null;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'four-kinds': fourKinds,
    'walking-the-binding': walkingTheBinding,
  },
  labs: {
    'rbac-permission-simulator': rbacLab,
  },
  simulations: {
    'rbac-permission-simulator': bindSimulation(rbacPermissionSimulation, renderRbacState),
  },
};
