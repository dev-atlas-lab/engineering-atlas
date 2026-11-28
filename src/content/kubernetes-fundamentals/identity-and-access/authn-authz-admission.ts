import type { ConceptContentModule, LessonBody } from '../../types';
import { rbacFlowScene } from '../security-scenes';

const threeGates: LessonBody = {
  learningObjectives: [
    'Order the three gates and name what each checks',
    'Identify which gate is responsible for a given error',
  ],
  sections: [
    {
      heading: 'Authentication → authorization → admission',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every API request passes through three gates in order. Each has its own responsibility and its own failure code. Diagnosing "why was this request rejected?" starts with identifying which gate rejected it.',
        },
        {
          type: 'comparisonTable',
          headers: ['Gate', 'Question', 'Failure code', 'Example failure'],
          rows: [
            ['Authentication', 'Who is calling?', '401 Unauthorized', 'Invalid certificate; expired token'],
            ['Authorization', 'May this subject do this?', '403 Forbidden', 'User has no RoleBinding for this verb'],
            ['Admission', 'Is this object acceptable?', '400 / 422 (varies)', 'Pod violates Pod Security Admission policy; ResourceQuota exceeded'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Authentication is terse: identify the subject, emit a user + groups tuple. Authorization is a yes/no verdict against the resource/verb. Admission is a pipeline: mutating plugins first (may rewrite the object), then validating plugins (may reject).',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'A request that fails authentication never reaches authorization; a request that fails authorization never reaches admission. Error messages make this explicit — a 403 means authentication worked (you are known) but authorization refused.',
        },
      ],
    },
    {
      heading: 'What admission sees',
      blocks: [
        {
          type: 'paragraph',
          text: 'Admission runs on write operations (create, update, delete, connect). Get and list do not pass through admission. Admission plugins that mutate (MutatingAdmissionWebhook, defaulters) run first; validators (ValidatingAdmissionWebhook, Pod Security Admission, ResourceQuota) run last. If any validator rejects, the request fails before persisting to etcd.',
        },
      ],
    },
  ],
  visualization: rbacFlowScene,
  knowledgeCheck: [
    {
      id: 'authn-kc-1',
      type: 'single-choice',
      prompt: 'An API request returns 403 Forbidden. What do we know?',
      difficulty: 'intermediate',
      learningObjective: 'Identify which gate is responsible for a given error',
      options: [
        { id: 'a', label: 'Authentication succeeded; authorization refused', correct: true, explanation: 'Correct. 403 means "we know who you are; you may not do this."' },
        { id: 'b', label: 'Authentication failed', correct: false, explanation: 'That would be 401.' },
        { id: 'c', label: 'Admission control refused the object', correct: false, explanation: 'Admission failures use 400/422 with a specific validation message, not 403.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'three-gates': threeGates,
  },
  labs: {},
  simulations: {},
};
