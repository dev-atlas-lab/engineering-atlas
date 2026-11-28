import type { ConceptContentModule, LessonBody } from '../../types';

const whatResourceQuotaDoes: LessonBody = {
  learningObjectives: [
    'Define compute and object-count quotas',
    'Describe how admission rejects Pods that would exceed quota',
  ],
  sections: [
    {
      heading: 'A namespace-scoped cap',
      blocks: [
        {
          type: 'paragraph',
          text: 'Where LimitRange shapes individual Pods, ResourceQuota caps the aggregate for a namespace. A quota is enforced at admission — a Pod that would push the namespace over any configured field is rejected with a quota-exceeded error.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: v1
kind: ResourceQuota
metadata: { name: team-a-quota, namespace: team-a }
spec:
  hard:
    requests.cpu:    "10"
    requests.memory: 32Gi
    limits.cpu:      "20"
    limits.memory:   64Gi
    pods:            "50"
    persistentvolumeclaims: "10"
    services:        "20"
    secrets:         "100"`,
        },
        {
          type: 'list',
          items: [
            'Compute fields: requests.cpu, requests.memory, limits.cpu, limits.memory, requests.storage, requests.ephemeral-storage.',
            'Count fields: pods, services, secrets, configmaps, persistentvolumeclaims, count/<resource>.<group>.',
            'Extended-resource fields: requests.nvidia.com/gpu.',
          ],
        },
      ],
    },
    {
      heading: 'Interaction with LimitRange',
      blocks: [
        {
          type: 'paragraph',
          text: 'When a quota requires that every Pod set compute requests (`requests.cpu` is a quota field), a LimitRange with defaultRequest is the usual way to keep author-side friction low. Without the LimitRange, authors who forget to set requests get hard rejections at apply time. With it, the LimitRange fills in defaults and the quota accounting still works because the final Pod has values.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'If a ResourceQuota is edited to be more restrictive while over-quota resources exist, the existing resources are not retroactively deleted. Only new creations are blocked. Draining over-quota resources is an operator action, not an automatic one.',
        },
      ],
    },
    {
      heading: 'Scopes: quotas that only apply to subsets',
      blocks: [
        {
          type: 'paragraph',
          text: 'ResourceQuota supports `scopeSelector` to apply only to certain Pods. The useful scopes include BestEffort (quota Pods with no requests), NotTerminating (for long-running Pods), and PriorityClass (quota based on priority). A common pattern is to grant a tenant one quota for regular workloads and a separate, smaller quota for their high-priority workloads.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-resourcequota-does': whatResourceQuotaDoes,
  },
  labs: {},
  simulations: {},
};
