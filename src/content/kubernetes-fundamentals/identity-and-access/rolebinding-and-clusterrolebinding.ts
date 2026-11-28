import type { ConceptContentModule, LessonBody } from '../../types';

const bindingForms: LessonBody = {
  learningObjectives: [
    'Decide between RoleBinding and ClusterRoleBinding',
    'Explain RoleBinding referring to a ClusterRole',
  ],
  sections: [
    {
      heading: 'Four combinations, three that make sense',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Binding', 'References', 'Grants'],
          rows: [
            ['RoleBinding', 'Role', 'That Role\'s rules, in the binding\'s namespace'],
            ['RoleBinding', 'ClusterRole', 'The ClusterRole\'s rules, but SCOPED to the binding\'s namespace'],
            ['ClusterRoleBinding', 'ClusterRole', 'Cluster-wide'],
            ['ClusterRoleBinding', 'Role', 'NOT ALLOWED — the API Server rejects it'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The middle case is the useful one: reusable ClusterRoles bound per-namespace. Define a "deployment-manager" ClusterRole once; bind it to the deploy team in dev, staging, prod via one RoleBinding per namespace. Each binding grants only in its own namespace.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: devs-can-deploy-to-dev
  namespace: team-a-dev
subjects:
- kind: Group
  name: team-a-devs
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole       # pre-defined cluster-wide role
  name: deployment-manager
  apiGroup: rbac.authorization.k8s.io`,
        },
      ],
    },
    {
      heading: 'subjects',
      blocks: [
        {
          type: 'list',
          items: [
            'kind: User — a user identity (certificate CN, OIDC claim). apiGroup: rbac.authorization.k8s.io.',
            'kind: Group — a group identity. Prefer groups over individual users for team-based access.',
            'kind: ServiceAccount — an in-cluster workload identity. Requires `namespace` field. apiGroup omitted (it\'s a Kubernetes object).',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'roleRef is immutable — to change which role a binding grants, you must delete and recreate. subjects can be edited. This prevents a plausible privilege-escalation path where an attacker with "patch rolebindings" would otherwise redirect existing bindings to cluster-admin.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'binding-forms': bindingForms,
  },
  labs: {},
  simulations: {},
};
