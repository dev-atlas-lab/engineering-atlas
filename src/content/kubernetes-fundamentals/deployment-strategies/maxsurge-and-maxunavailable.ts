import type { ConceptContentModule, LessonBody } from '../../types';

const theTwoKnobs: LessonBody = {
  learningObjectives: [
    'Define maxSurge and maxUnavailable precisely',
    'Compute each from a percentage against a replica count',
  ],
  sections: [
    {
      heading: 'The exact definitions',
      blocks: [
        {
          type: 'paragraph',
          text: 'Both fields live under `spec.strategy.rollingUpdate` on the Deployment. Both default to 25%. Both accept integers or percentages.',
        },
        {
          type: 'comparisonTable',
          headers: ['Field', 'Meaning', 'Rounding'],
          rows: [
            ['maxSurge', 'How many Pods may exist above spec.replicas during rollout', 'Percentages rounded UP (prefer slightly more surge over less)'],
            ['maxUnavailable', 'How many Pods may be unavailable (not Ready) below spec.replicas during rollout', 'Percentages rounded DOWN (prefer fewer unavailable)'],
          ],
        },
        {
          type: 'code',
          language: 'yaml',
          code: `spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%          # up to 3 extra Pods (10 * 0.25 = 2.5 → up to 3)
      maxUnavailable: 25%    # up to 2 Pods may be unavailable (10 * 0.25 = 2.5 → 2)`,
        },
      ],
    },
    {
      heading: 'The forbidden combination',
      blocks: [
        {
          type: 'paragraph',
          text: 'maxSurge=0 AND maxUnavailable=0 is rejected by validation — it would mean "replace Pods without having any extra capacity AND without ever letting a Pod be unavailable," which is impossible. You must give the controller at least one of the two to work with.',
        },
      ],
    },
  ],
};

const pickingValues: LessonBody = {
  learningObjectives: ['Pick values that match the service\'s availability SLO'],
  sections: [
    {
      heading: 'Three common presets',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Preset', 'Values', 'Shape', 'Good for'],
          rows: [
            ['Zero-downtime', 'maxSurge=25% maxUnavailable=0', 'Always add before you remove — capacity grows briefly', 'User-facing services with strict availability'],
            ['Resource-careful', 'maxSurge=0 maxUnavailable=1', 'Remove before add — never exceeds replica count', 'Tight resource budgets (dev clusters) or exclusive-locks'],
            ['Fast rollout', 'maxSurge=50% maxUnavailable=25%', 'Aggressive — half the workload replaced at once', 'Background workers tolerant of brief outages'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'maxSurge=1 absolute (not percentage) is the most common authoring choice. "Add one Pod of the new version, let it become ready, remove one old" — predictable, cheap, works for any replica count.',
        },
      ],
    },
    {
      heading: 'Replica count matters',
      blocks: [
        {
          type: 'paragraph',
          text: 'For a 3-replica Deployment, maxUnavailable=25% rounds to 0 (no Pod may be unavailable), and maxSurge=25% rounds to 1. Effectively surge-only — safe but slow. For a 100-replica Deployment, 25% means 25 Pods may be added or missing at once — the same percentages produce very different rollout shapes at different scales.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-two-knobs': theTwoKnobs,
    'picking-values': pickingValues,
  },
  labs: {},
  simulations: {},
};
