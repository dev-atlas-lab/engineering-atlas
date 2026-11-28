import type { ConceptContentModule, LessonBody } from '../../types';

const namespaceLabels: LessonBody = {
  learningObjectives: [
    'Enable Pod Security Admission on a namespace',
    'Distinguish enforce, audit, and warn modes',
  ],
  sections: [
    {
      heading: 'PSA is label-driven',
      blocks: [
        {
          type: 'paragraph',
          text: 'Pod Security Admission is a built-in admission plugin (since 1.25, GA since 1.22). It reads labels on each Namespace and applies the matching Pod Security Standard to Pods created there. No CRD, no external controller.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# Enforce restricted on this namespace. Also emit warnings to kubectl
# clients and audit events for violations above warn level.
kubectl label ns team-a-prod \\
  pod-security.kubernetes.io/enforce=restricted \\
  pod-security.kubernetes.io/warn=restricted \\
  pod-security.kubernetes.io/audit=restricted \\
  pod-security.kubernetes.io/enforce-version=latest`,
        },
        {
          type: 'comparisonTable',
          headers: ['Mode', 'Effect'],
          rows: [
            ['enforce', 'Reject non-conforming Pods at admission'],
            ['warn', 'Allow, but return a warning to the kubectl client'],
            ['audit', 'Allow, and emit an audit event'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Each mode can be set to a different level. The common rollout: set warn and audit to the target level first (restricted), fix all the warnings over a few weeks, then flip enforce.',
        },
      ],
    },
  ],
};

const rolloutViaWarn: LessonBody = {
  learningObjectives: ['Roll out a stricter profile without breaking production'],
  sections: [
    {
      heading: 'warn first, enforce later',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Day 0: label every namespace `pod-security.kubernetes.io/warn=restricted, audit=restricted`. Nothing breaks; developers see warnings on apply.',
            'Day N: inspect audit logs, fix non-conforming manifests. Pods get securityContext, runAsNonRoot, drop ALL caps.',
            'Day M: when warnings have fallen to near-zero, flip enforce=restricted on namespaces one at a time.',
            'Keep privileged workloads (storage drivers, monitoring agents) in namespaces with enforce=privileged. Review their membership regularly.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The enforce level applies at admission — existing Pods are grandfathered. A cluster upgrade that flips enforce does NOT evict already-running Pods. They remain until they terminate for any other reason (rollout, eviction) and the replacement Pod must conform.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'namespace-labels': namespaceLabels,
    'rollout-via-warn': rolloutViaWarn,
  },
  labs: {},
  simulations: {},
};
