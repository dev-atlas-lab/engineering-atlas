import type { ConceptContentModule, LessonBody } from '../../types';

const labelsNotReferences: LessonBody = {
  learningObjectives: [
    'Distinguish labels (identifying) from annotations (non-identifying metadata)',
    'Explain how a selector matches labels and why there are no direct references',
  ],
  sections: [
    {
      heading: 'Loose coupling by labels',
      blocks: [
        {
          type: 'paragraph',
          text: 'Objects in Kubernetes do not reference each other by name or UID (with one exception — ownerReferences). A Service does not hold a list of its Pods. A ReplicaSet does not hold a list of its Pods. Instead, each one has a selector that matches labels on Pods. Any Pod whose labels match participates. This is called loose coupling by labels, and it is one of the architecture\'s most distinctive choices.',
        },
        {
          type: 'list',
          items: [
            'Labels: short key/value pairs meant to be matched by selectors (app, tier, version, environment). Appear on nearly every object.',
            'Annotations: arbitrary metadata, often longer, not used for selection (checksum of configuration, deployment revision info, free-text ownership).',
            'The distinction is semantic: labels are for the system, annotations are for people and external tools.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Selectors come in two flavors: "matchLabels" is a simple equality match ({ app: web }). "matchExpressions" supports set-based matches ({ key: tier, operator: In, values: [frontend, backend] }). Both are widely used.',
        },
      ],
    },
    {
      heading: 'Why this works',
      blocks: [
        {
          type: 'paragraph',
          text: 'Loose coupling by labels means a Pod does not need to know anything about who manages it. A new ReplicaSet with a matching selector can adopt existing Pods without the Pods being edited. A Service can "capture" Pods just by having a matching selector. Removing a label from a Pod can quietly remove it from a Service — useful for draining traffic for debugging, confusing when accidental.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'labels-not-references': labelsNotReferences,
  },
  labs: {},
  simulations: {},
};
