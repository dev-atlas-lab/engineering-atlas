import type { ConceptContentModule, LessonBody } from '../../types';

const requiredVsPreferred: LessonBody = {
  learningObjectives: [
    'Distinguish required and preferred node affinity',
    'Explain what "IgnoredDuringExecution" means',
  ],
  sections: [
    {
      heading: 'Two flavors, two phases of scheduling',
      blocks: [
        {
          type: 'paragraph',
          text: 'Node affinity has two expressions matched to the scheduler\'s two phases:',
        },
        {
          type: 'comparisonTable',
          headers: ['Field', 'Phase', 'Behavior'],
          rows: [
            ['requiredDuringSchedulingIgnoredDuringExecution', 'Filter', 'Must match or the node is rejected — hard constraint'],
            ['preferredDuringSchedulingIgnoredDuringExecution', 'Score', 'Contributes a weighted bonus (1-100) to matching nodes — soft preference'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The clumsy field names are explicit on purpose: scheduling-time only. Once a Pod is placed, the label it matched is "ignored during execution" — if the node label changes afterwards, the Pod is not evicted. A future field (requiredDuringSchedulingRequiredDuringExecution) was planned but has never shipped.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: topology.kubernetes.io/zone
          operator: In
          values: [eu-west-1a, eu-west-1b]
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 50
      preference:
        matchExpressions:
        - key: node.kubernetes.io/instance-type
          operator: In
          values: [c5.4xlarge]`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'nodeSelectorTerms is a top-level OR — a node satisfies required affinity if it matches any term. matchExpressions inside one term is an AND — all expressions must match.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'affinity-kc-1',
      type: 'single-choice',
      prompt: 'A Pod is placed with requiredDuringSchedulingIgnoredDuringExecution matching zone=eu-west-1a. An operator relabels the node to eu-west-1b. What happens?',
      difficulty: 'intermediate',
      learningObjective: 'Explain what "IgnoredDuringExecution" means',
      options: [
        { id: 'a', label: 'Nothing — the Pod stays on the node; affinity is scheduling-time only', correct: true, explanation: 'Correct. IgnoredDuringExecution means the constraint is not re-checked after binding.' },
        { id: 'b', label: 'The Pod is evicted because it no longer matches', correct: false, explanation: 'This behavior would be RequiredDuringExecution — which has never been implemented.' },
        { id: 'c', label: 'The kubelet refuses to run the Pod anymore', correct: false, explanation: 'The kubelet does not evaluate scheduling constraints.' },
      ],
    },
  ],
};

const expressionLanguage: LessonBody = {
  learningObjectives: ['Use the five operators in matchExpressions'],
  sections: [
    {
      heading: 'Set-based operators',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Operator', 'Semantics', 'Example'],
          rows: [
            ['In', 'Label value is in the list', 'zone In [eu-1a, eu-1b]'],
            ['NotIn', 'Label value is not in the list', 'instance-type NotIn [t3.micro]'],
            ['Exists', 'Label key exists (any value)', 'gpu Exists'],
            ['DoesNotExist', 'Label key is absent', 'preemptible DoesNotExist'],
            ['Gt / Lt', 'Numeric comparison on integer label values', 'cpu-cores Gt 8'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Anti-affinity on nodes is expressed with `NotIn` or `DoesNotExist` — there is no separate anti-affinity field for nodes (unlike for Pods). "Keep this workload off GPU nodes" is `nodeAffinity: ... matchExpressions: [key: gpu, operator: DoesNotExist]` or `operator: NotIn, values: ["true"]`.',
        },
      ],
    },
    {
      heading: 'Combining required with preferred',
      blocks: [
        {
          type: 'paragraph',
          text: 'The typical pattern: required narrows the candidate pool (zone, OS), preferred ranks within it (instance type, hostname affinity). Keep required minimal and expressive; keep preferred weights relative — the scheduler sums weights across all preferred rules, so 1 vs 100 matters more than absolute magnitude.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Over-specifying required affinity across many dimensions is the top cause of "my Pods are Unschedulable even though I have capacity" tickets. Each additional required dimension narrows the feasible set multiplicatively.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'required-vs-preferred': requiredVsPreferred,
    'the-expression-language': expressionLanguage,
  },
  labs: {},
  simulations: {},
};
