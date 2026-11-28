import type { ConceptContentModule, LessonBody } from '../../types';

const rulesAndVerbs: LessonBody = {
  learningObjectives: [
    'Author Role and ClusterRole with the correct scope',
    'Use resourceNames to restrict a rule to specific objects',
  ],
  sections: [
    {
      heading: 'Each rule is a 3- or 4-tuple',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { name: pod-reader, namespace: team-a }
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["shared-config"]   # ONLY this specific object
  verbs: ["get"]`,
        },
        {
          type: 'list',
          items: [
            'apiGroups — "" for the core API group (pods, services, configmaps). "apps" for Deployments, DaemonSets. "rbac.authorization.k8s.io" for RBAC objects themselves.',
            'resources — resource types in that API group. Subresources use `/` ("pods/log", "pods/exec", "deployments/scale").',
            'resourceNames — optional whitelist by exact name. Use for "only edit THIS ConfigMap" patterns. Does not work with list/watch/create.',
            'verbs — get, list, watch, create, update, patch, delete, deletecollection. Plus "*" for all.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Granting `*` on verbs or resources is the most common over-permission. Avoid it even in internal tooling — write out the explicit list. A ClusterRoleBinding to `*/*` is effectively cluster-admin regardless of what you intended.',
        },
      ],
    },
    {
      heading: 'Subresources can be forgotten',
      blocks: [
        {
          type: 'paragraph',
          text: 'Subresources are distinct from the parent. A rule on "pods" verb "update" does NOT let you update "pods/status" — you need "pods/status" in the resources list. The scale subresource (deployments/scale) is often the one teams miss: an app with full access to Deployments but missing pods/log cannot read logs.',
        },
      ],
    },
  ],
};

const aggregation: LessonBody = {
  learningObjectives: ['Describe ClusterRole aggregation and when it is useful'],
  sections: [
    {
      heading: 'Composing ClusterRoles by label',
      blocks: [
        {
          type: 'paragraph',
          text: 'A ClusterRole can be marked as an "aggregate" — its rules are not authored directly, but are collected from other ClusterRoles that carry a specified label. The upstream `view`, `edit`, and `admin` ClusterRoles work this way, which is how custom resources from operators automatically become readable by users with the view role.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: aggregated-view
aggregationRule:
  clusterRoleSelectors:
  - matchLabels:
      rbac.authorization.k8s.io/aggregate-to-view: "true"
rules: []   # filled in by the controller
---
# A separate ClusterRole provided by an operator that wants to be included:
kind: ClusterRole
metadata:
  name: view-my-cr
  labels:
    rbac.authorization.k8s.io/aggregate-to-view: "true"
rules:
- apiGroups: ["myapp.example.com"]
  resources: ["myresources"]
  verbs: ["get", "list", "watch"]`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Aggregation is the reason you don\'t have to re-author the view ClusterRole every time a new operator adds a CRD. The operator ships a tiny aggregate-to-view ClusterRole and gets picked up automatically.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'rules-and-verbs': rulesAndVerbs,
    'aggregation': aggregation,
  },
  labs: {},
  simulations: {},
};
