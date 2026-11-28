import type { ConceptContentModule, LessonBody } from '../../types';

const replicasetsAreHistory: LessonBody = {
  learningObjectives: [
    'Identify a Deployment\'s past revisions via its ReplicaSets',
    'Explain revisionHistoryLimit',
  ],
  sections: [
    {
      heading: 'The history is the ReplicaSets',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes does not store a separate "Deployment history" object. The history is the set of ReplicaSets the Deployment has created over time. Each ReplicaSet carries the pod template hash in its name and an annotation `deployment.kubernetes.io/revision: "N"`. Active replicas live on the current ReplicaSet; past ReplicaSets sit at scale=0 as revision records.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `$ kubectl get rs -l app=web
NAME                DESIRED   CURRENT   READY   AGE
web-7f8b9c          0         0         0       14d  # revision 1
web-6c4d2e          0         0         0       7d   # revision 2
web-8a1f5b          5         5         5       1h   # revision 3 (current)`,
        },
        {
          type: 'paragraph',
          text: 'spec.revisionHistoryLimit (default 10) caps how many past ReplicaSets at scale=0 the Deployment keeps. Older ones are garbage-collected. Setting this to 0 saves resources but makes rollback impossible.',
        },
      ],
    },
    {
      heading: 'Fast rollback is cheap because of this',
      blocks: [
        {
          type: 'paragraph',
          text: 'Rolling back "re-uses" the old ReplicaSet — it scales it back up and scales the current one down. The pod template on the old RS is identical to what you applied last time, so the controller just needs to create Pods from it. There is no YAML diffing; the revision is stored in full.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'If you have a stuck or problematic ReplicaSet in the history, you can `kubectl delete rs <name>` to drop it. The Deployment\'s current replica count is unaffected because that RS was at 0. The revision history just gets shorter.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'replicasets-are-the-history': replicasetsAreHistory,
  },
  labs: {},
  simulations: {},
};
