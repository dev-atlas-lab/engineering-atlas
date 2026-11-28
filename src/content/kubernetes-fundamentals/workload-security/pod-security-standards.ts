import type { ConceptContentModule, LessonBody } from '../../types';

const threeProfiles: LessonBody = {
  learningObjectives: [
    'Describe the three profiles and their constraints',
    'Place a given workload in the right profile',
  ],
  sections: [
    {
      heading: 'Three named profiles, from most permissive to least',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Profile', 'Intent', 'Example constraints'],
          rows: [
            ['Privileged', 'Unrestricted — the policy opts out', 'Allows privileged: true, hostPath, hostNetwork, etc.'],
            ['Baseline', 'Minimum viable guardrails, few app changes', 'No privileged, no SYS_ADMIN, no hostNetwork, no privilege escalation to root'],
            ['Restricted', 'Hardened — fits most apps written with security in mind', 'Must runAsNonRoot, must drop ALL caps (except NET_BIND_SERVICE), seccomp runtime/default'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The profiles are a de facto industry baseline, published by the Kubernetes project. Baseline rejects the obvious breakage vectors; restricted enforces modern container security best practices. Pick the strongest profile your workloads can satisfy.',
        },
      ],
    },
  ],
};

const pickingAProfile: LessonBody = {
  learningObjectives: ['Decide which profile fits a given workload'],
  sections: [
    {
      heading: 'A decision guide',
      blocks: [
        {
          type: 'list',
          items: [
            'Normal application code with no root requirement → restricted. Any modern web service or job falls here.',
            'Needs NET_BIND_SERVICE to listen on port 80 as non-root → restricted still allows this one cap addition.',
            'Needs raw block device or host namespace access (CSI driver, some monitoring agents) → baseline or privileged. These should live in a dedicated namespace with its own PSA policy.',
            'Needs privileged: true (container runtime inside containers, host network configuration) → privileged, in a tightly-controlled system namespace.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The bias should be restricted-by-default. Baseline and privileged are for specific workload classes with documented reasons. If every tenant namespace is baseline because "that\'s simpler," you\'ve given up most of the benefit.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'three-profiles': threeProfiles,
    'picking-a-profile': pickingAProfile,
  },
  labs: {},
  simulations: {},
};
