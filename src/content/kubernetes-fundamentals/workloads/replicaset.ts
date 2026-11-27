import type { ConceptContentModule, LessonBody } from '../../types';

const howItWorks: LessonBody = {
  learningObjectives: [
    'Describe how a ReplicaSet uses a label selector to track its Pods',
    'Trace what happens when a Pod managed by a ReplicaSet dies',
  ],
  sections: [
    {
      heading: 'Keeping the count right',
      blocks: [
        {
          type: 'paragraph',
          text: 'A ReplicaSet\'s job is a single reconciliation loop: "there should be spec.replicas Pods matching this selector; create or delete Pods until that is true." It watches both the ReplicaSet object and every Pod matching its selector. Any change to either wakes up the loop.',
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'A ReplicaSet — selector, replicas, template',
          code: `apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: nginx
          image: nginx:1.26`,
        },
      ],
    },
    {
      heading: 'Selection, not ownership-by-reference',
      blocks: [
        {
          type: 'paragraph',
          text: 'The selector (app: web) is how the ReplicaSet decides which Pods are "its own." Any Pod carrying those labels counts toward spec.replicas, even if the ReplicaSet did not create it. Label the right Pods wrong and the ReplicaSet will happily adopt them or create replacements for them — this is powerful and occasionally confusing.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'If you create a Pod by hand with labels matching a ReplicaSet\'s selector, the ReplicaSet will adopt it. The next Pod it tries to create may get deleted because the count is already right. Label discipline matters more than it looks like it should.',
        },
      ],
    },
  ],
};

const ownership: LessonBody = {
  learningObjectives: ['Explain why ReplicaSets are almost never created directly'],
  sections: [
    {
      heading: 'Use a Deployment, not a ReplicaSet',
      blocks: [
        {
          type: 'paragraph',
          text: 'A ReplicaSet does one thing: keep a count of Pods matching a selector. It does not support rolling updates, rollbacks, or versioned history. Changing the Pod template (new image, new env) on a ReplicaSet would require deleting all existing Pods manually to pick up the change — a Deployment does that for you automatically.',
        },
        {
          type: 'paragraph',
          text: 'In practice, nobody writes a ReplicaSet manifest by hand. You write a Deployment, and the Deployment controller creates and manages one or more ReplicaSets on your behalf (one per rollout). "kubectl get rs" is how you see them; "kubectl describe deployment" is how you reason about them.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The old name was ReplicationController. ReplicaSet replaced it with support for set-based selectors ("in", "notin") instead of just equality. Deployment then became the normal way to use ReplicaSets. The three-tier hierarchy — Deployment → ReplicaSet → Pod — is a legacy of this evolution, and it is helpful to know how to read "kubectl get deploy,rs,po" output.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'how-a-replicaset-works': howItWorks,
    'replicaset-ownership': ownership,
  },
  labs: {},
  simulations: {},
};
