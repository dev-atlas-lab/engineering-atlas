import type { ConceptContentModule, LessonBody } from '../../types';

const whatSaIs: LessonBody = {
  learningObjectives: [
    'Describe what a ServiceAccount is and how a Pod uses one',
    'Author a Pod that uses a specific ServiceAccount',
  ],
  sections: [
    {
      heading: 'An identity for in-cluster workloads',
      blocks: [
        {
          type: 'paragraph',
          text: 'A ServiceAccount is a Kubernetes-native identity, scoped to a namespace, used by Pods that need to call the API Server. Humans authenticate with X.509 or OIDC; workloads authenticate with ServiceAccount tokens. The username the API Server records for an SA-authenticated request is `system:serviceaccount:<namespace>:<name>`.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: v1
kind: ServiceAccount
metadata: { name: prometheus, namespace: observability }
---
apiVersion: v1
kind: Pod
metadata: { name: prometheus-0, namespace: observability }
spec:
  serviceAccountName: prometheus
  containers: [...]`,
        },
        {
          type: 'list',
          items: [
            'Every Pod has a ServiceAccount — if spec.serviceAccountName is omitted, the Pod gets the namespace\'s "default" ServiceAccount.',
            'The token for the SA is mounted into the Pod at /var/run/secrets/kubernetes.io/serviceaccount/token.',
            'Kubernetes libraries (client-go, python-kubernetes) read this token automatically — no credentials wiring in-app.',
          ],
        },
      ],
    },
  ],
};

const defaultSa: LessonBody = {
  learningObjectives: ['Avoid the default ServiceAccount trap'],
  sections: [
    {
      heading: 'The default SA has API access unless you say otherwise',
      blocks: [
        {
          type: 'paragraph',
          text: 'The "default" ServiceAccount in each namespace has no bindings — meaning it can\'t do much. But it CAN read some discovery endpoints, and historically its token was automounted into every Pod. A compromised container with the default SA token can query the API, enumerate Services, and start lateral movement.',
        },
        {
          type: 'list',
          items: [
            'If your Pod does not call the API: set `automountServiceAccountToken: false`. The token is not mounted at all.',
            'If your Pod needs API access: create a dedicated ServiceAccount with the minimum RBAC. Do NOT reuse the default.',
            'Audit `kubectl get pods -o yaml | grep -c serviceAccountName: default` — a positive count is a review item.',
          ],
        },
        {
          type: 'code',
          language: 'yaml',
          code: `spec:
  serviceAccountName: web-sa
  automountServiceAccountToken: false  # when the app does not need the API`,
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Combine ServiceAccount with namespace-scoped RBAC. A dedicated SA with no bindings grants nothing. A dedicated SA with cluster-admin via ClusterRoleBinding is worse than reusing default. The SA is the subject, not the authorization.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-a-sa-is': whatSaIs,
    'default-sa': defaultSa,
  },
  labs: {},
  simulations: {},
};
