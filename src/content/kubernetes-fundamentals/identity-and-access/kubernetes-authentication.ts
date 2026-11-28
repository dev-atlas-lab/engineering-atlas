import type { ConceptContentModule, LessonBody } from '../../types';

const theAuthenticators: LessonBody = {
  learningObjectives: [
    'Enumerate the authentication methods the API Server supports',
    'Describe how authenticators run as a chain',
  ],
  sections: [
    {
      heading: 'The chain stops at the first that identifies',
      blocks: [
        {
          type: 'paragraph',
          text: 'The API Server is configured with an ordered list of authenticators. For each incoming request, it tries them in turn. The first one that recognises the credential produces a (user, groups, extras) tuple; the rest are skipped. If every authenticator declines, the request fails with 401.',
        },
        {
          type: 'list',
          items: [
            'X.509 client certificates — the certificate CN becomes the user, each O becomes a group. Used by kubectl, cluster components.',
            'Service account tokens — projected tokens inside Pods. Subject is `system:serviceaccount:<namespace>:<name>`; group is `system:serviceaccounts` plus the namespace group.',
            'Bootstrap tokens — short-lived tokens used by kubeadm to join new nodes.',
            'OIDC — an external identity provider issues JWTs; the API Server validates them and reads claims for user/groups.',
            'Webhook token authentication — custom authenticator; the API Server POSTs the token to an external HTTPS endpoint for verification.',
            'Static token file / basic auth — deprecated and insecure; only on legacy clusters.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Anonymous requests have a special name — `system:anonymous` in the group `system:unauthenticated`. By default anonymous is enabled for discovery endpoints only. Make sure nothing grants cluster-wide read to this group.',
        },
      ],
    },
  ],
};

const tokensAndCerts: LessonBody = {
  learningObjectives: ['Compare the credential kinds and pick one for a given scenario'],
  sections: [
    {
      heading: 'Different credentials for different callers',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Caller', 'Typical credential', 'Lifetime'],
          rows: [
            ['Human on kubectl', 'OIDC token from SSO, or client cert', 'Short-lived (OIDC) or long-lived (cert)'],
            ['Pod inside cluster', 'Projected ServiceAccount token', 'Short-lived (1 hour default)'],
            ['CI system outside cluster', 'OIDC via workload identity federation', 'Short-lived, request-time'],
            ['kubelet, scheduler, controller-manager', 'Client certs issued by cluster CA', 'Long-lived; rotated via kubeadm'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The modern pattern for CI is OIDC federation: the CI runner proves its identity to its OIDC provider (GitHub Actions, GitLab, Vault), the provider issues a JWT, and Kubernetes trusts that provider as an OIDC issuer. No long-lived secret is stored anywhere.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Legacy "kubectl token in a password manager" is a credential exfiltration risk. If a token must exist as a file, scope it tightly via RBAC and make it short-lived; never grant cluster-admin to a long-lived token.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-authenticators': theAuthenticators,
    'tokens-and-certs': tokensAndCerts,
  },
  labs: {},
  simulations: {},
};
