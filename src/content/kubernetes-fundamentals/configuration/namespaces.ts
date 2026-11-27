import type { ConceptContentModule, LessonBody } from '../../types';

const whatANamespaceIs: LessonBody = {
  learningObjectives: [
    'Describe what a namespace scopes',
    'Describe what a namespace does NOT isolate',
  ],
  sections: [
    {
      heading: 'A soft division of one cluster',
      blocks: [
        {
          type: 'paragraph',
          text: 'A namespace is a scoping mechanism for object names and RBAC. Two Services named "api" in different namespaces are two distinct objects with distinct DNS names (api.team-a.svc.cluster.local and api.team-b.svc.cluster.local). Namespaces also provide a target for ResourceQuotas (cap how many CPUs/Pods a team can use), LimitRanges, and NetworkPolicies.',
        },
        {
          type: 'paragraph',
          text: 'Crucially, namespaces are not a strong security boundary. Pods in different namespaces share the same Nodes, the same kernel, the same cluster network. A namespace is "an organizing shelf in a shared garage," not "a separate garage." If you need strong isolation between tenants, you need separate clusters — or at least virtualization-based isolation (Kata Containers, gVisor).',
        },
      ],
    },
    {
      heading: 'What namespaces scope',
      blocks: [
        {
          type: 'list',
          items: [
            'Object names — two Pods named "web" can coexist in different namespaces',
            'DNS entries for Services — see Service Discovery',
            'ResourceQuota and LimitRange — cap resource usage per namespace',
            'RBAC Role bindings — "may read Pods in namespace X" is a common grant',
            'NetworkPolicy defaults — policies often target a namespace\'s Pods',
          ],
        },
      ],
    },
  ],
};

const scopes: LessonBody = {
  learningObjectives: ['Distinguish namespaced from cluster-scoped objects'],
  sections: [
    {
      heading: 'Not everything lives in a namespace',
      blocks: [
        {
          type: 'paragraph',
          text: 'Some objects are cluster-scoped: they exist above namespaces, and you cannot "put" them in one. Nodes are not in a namespace — they describe the physical topology, not a workload. PersistentVolumes are cluster-scoped (their PVCs are namespaced). RBAC ClusterRoles are cluster-scoped (Roles are namespaced).',
        },
        {
          type: 'comparisonTable',
          headers: ['Object type', 'Scope'],
          rows: [
            ['Pod, Deployment, Service, ConfigMap, Secret', 'Namespaced'],
            ['Node, PersistentVolume, StorageClass', 'Cluster-scoped'],
            ['Role, RoleBinding, ResourceQuota', 'Namespaced'],
            ['ClusterRole, ClusterRoleBinding', 'Cluster-scoped'],
            ['Namespace itself', 'Cluster-scoped (by definition)'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'kubectl commands against namespaced objects use the current namespace by default. kubectl --all-namespaces or -A lists across every namespace. Cluster-scoped objects ignore the --namespace flag entirely.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-a-namespace-is': whatANamespaceIs,
    'namespace-scope-vs-cluster-scope': scopes,
  },
  labs: {},
  simulations: {},
};
