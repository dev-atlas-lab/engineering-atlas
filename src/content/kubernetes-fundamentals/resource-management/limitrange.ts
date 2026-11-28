import type { ConceptContentModule, LessonBody } from '../../types';

const whatLimitRangeDoes: LessonBody = {
  learningObjectives: [
    'Define default, defaultRequest, min, and max on a LimitRange',
    'Describe the admission-time mutation that applies defaults',
  ],
  sections: [
    {
      heading: 'An admission webhook built into the API Server',
      blocks: [
        {
          type: 'paragraph',
          text: 'LimitRange is a namespace-scoped object that governs what resource values Pods in that namespace may have. It runs as a built-in admission plugin — at Pod creation time, the plugin reads every LimitRange in the namespace, mutates the Pod to fill in defaults, and then validates min/max constraints.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: v1
kind: LimitRange
metadata: { name: tenant-defaults, namespace: team-a }
spec:
  limits:
  - type: Container
    default:         { cpu: 500m,  memory: 512Mi }  # limits if not set
    defaultRequest:  { cpu: 100m,  memory: 128Mi }  # requests if not set
    min:             { cpu: 50m,   memory: 64Mi }
    max:             { cpu: 2,     memory: 2Gi }`,
        },
        {
          type: 'list',
          items: [
            'default — injected as the container\'s `limits` when the author did not specify any.',
            'defaultRequest — injected as `requests` when the author did not specify any.',
            'min / max — rejected at admission if the final container resources are outside this range.',
            'type can be Container, Pod (aggregate across containers), or PersistentVolumeClaim (storage min/max).',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The most common use is to eliminate BestEffort Pods in a tenant namespace: a `defaultRequest` ensures every Pod has resources, which protects it from being evicted first under node pressure. It costs nothing to opt in.',
        },
      ],
    },
    {
      heading: 'Common operational pattern',
      blocks: [
        {
          type: 'paragraph',
          text: 'Platform teams typically ship a baseline LimitRange in every created namespace (via a Namespace creation hook or a controller like Kyverno). This gives every workload sensible defaults from day one, while letting individual Pods override them explicitly. It does not replace the per-Pod authored values — it only fills in gaps.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-limitrange-does': whatLimitRangeDoes,
  },
  labs: {},
  simulations: {},
};
