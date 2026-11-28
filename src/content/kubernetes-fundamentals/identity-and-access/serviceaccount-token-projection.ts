import type { ConceptContentModule, LessonBody } from '../../types';

const projectedTokens: LessonBody = {
  learningObjectives: [
    'Describe projected token volumes (expirationSeconds, audience)',
    'Explain the security problem with legacy Secret-mounted tokens',
  ],
  sections: [
    {
      heading: 'The 1.22+ default: short-lived, audience-scoped tokens',
      blocks: [
        {
          type: 'paragraph',
          text: 'Before Kubernetes 1.22, every ServiceAccount had a bound Secret containing a long-lived JWT that worked for the entire life of the Secret (effectively forever). That token was mounted into every Pod using the SA. If leaked, it granted the SA\'s permissions until someone noticed.',
        },
        {
          type: 'paragraph',
          text: 'Since 1.22, Pod spec includes an automatic ProjectedVolume that requests a short-lived token (default 1 hour) from the TokenRequest API. The kubelet rotates the token in place before it expires. Audience scoping restricts which service will accept the token — a Vault audience cannot be re-used against an AWS audience.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `# What the kubelet mounts by default:
volumes:
- name: kube-api-access-xyz
  projected:
    defaultMode: 420
    sources:
    - serviceAccountToken:
        path: token
        expirationSeconds: 3607
        audience: ""    # default audience = this cluster
    - configMap: { name: kube-root-ca.crt, items: [{ key: ca.crt, path: ca.crt }] }
    - downwardAPI: { items: [{ path: namespace, fieldRef: { fieldPath: metadata.namespace } }] }`,
        },
        {
          type: 'list',
          items: [
            'expirationSeconds — 1 hour default; the kubelet renews in the background.',
            'audience — restricts where the token may be presented. Workload identity systems (IRSA on AWS, Workload Identity on GKE) use specific audiences for cloud API federation.',
            'A projected token is per-Pod; deleting the Pod invalidates the token (by non-renewal).',
          ],
        },
      ],
    },
    {
      heading: 'Legacy tokens still exist but shouldn\'t be used',
      blocks: [
        {
          type: 'paragraph',
          text: 'Secrets of type `kubernetes.io/service-account-token` still work but are no longer auto-created. If you find one in an older cluster, it is probably a long-lived credential — rotate it (delete; it will not be re-created) and verify callers switched to projected tokens.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The audience field is the key to OIDC federation to cloud. AWS IAM Roles for Service Accounts (IRSA) specifies an audience like `sts.amazonaws.com`; the Pod\'s token with that audience is traded for a short-lived AWS credential. The cluster needs no long-lived cloud credential anywhere.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'projected-tokens': projectedTokens,
  },
  labs: {},
  simulations: {},
};
