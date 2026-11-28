import type { ConceptContentModule, LessonBody } from '../../types';

const howRollbackWorks: LessonBody = {
  learningObjectives: [
    'Use kubectl rollout undo to revert a Deployment',
    'Describe what rollback actually does under the hood',
  ],
  sections: [
    {
      heading: 'Rollback is "re-apply an old template"',
      blocks: [
        {
          type: 'paragraph',
          text: 'Rollback is not a special API — it is a client-side shortcut. `kubectl rollout undo deployment/web` takes the previous revision\'s pod template (stored on the old ReplicaSet annotation `deployment.kubernetes.io/revision`), writes it back onto the Deployment, which triggers a NEW rolling update back to the old template.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# List revisions
$ kubectl rollout history deployment/web
REVISION  CHANGE-CAUSE
1         kubectl apply --filename=web-v1.yaml --record=true
2         kubectl apply --filename=web-v2.yaml --record=true
3         kubectl apply --filename=web-v3.yaml --record=true

# Roll back one revision
$ kubectl rollout undo deployment/web

# Or to a specific revision
$ kubectl rollout undo deployment/web --to-revision=1`,
        },
        {
          type: 'list',
          items: [
            'The result is a new rollout, not a hot-swap. The same maxSurge/maxUnavailable rules apply.',
            'Revision numbers increase monotonically. Rolling back to revision 2 creates revision 4 with the same template as 2.',
            'CHANGE-CAUSE is set when the Deployment is applied with `--record` or an annotation `kubernetes.io/change-cause`. Otherwise it is blank.',
          ],
        },
      ],
    },
  ],
};

const whatRollbackDoesNotCover: LessonBody = {
  learningObjectives: ['Enumerate what rollback does NOT roll back'],
  sections: [
    {
      heading: 'Only the Deployment template',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Object', 'Rolled back?'],
          rows: [
            ['Deployment spec.template', 'Yes — pod template, container images, env vars, resources, probes, volumes'],
            ['Deployment replicas', 'No — stays at current value'],
            ['ConfigMap used by the Pods', 'No — unless you use immutable ConfigMaps with versioned names and the template references the old name'],
            ['Secret used by the Pods', 'No'],
            ['CRD custom resource the app uses', 'No'],
            ['Database schema', 'No — a forward-only migration is a classic foot-gun'],
            ['PersistentVolume contents', 'No'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A v2 that added a new required column to the DB cannot be rolled back by Deployment rollback alone — the v1 image no longer matches the schema. Expand/contract migration patterns (always backwards-compatible) are the usual answer.',
        },
      ],
    },
    {
      heading: 'The immutable-ConfigMap pattern',
      blocks: [
        {
          type: 'paragraph',
          text: 'Rolling back a Deployment without rolling back its config is a common cause of post-rollback failures. The clean pattern is to make ConfigMaps immutable (set `immutable: true`) and version their names (my-config-v123). The Deployment template references the specific name. When you release a new config, create a new ConfigMap AND a new Deployment revision; rolling back the Deployment reverts to the old ConfigMap name automatically.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'how-rollback-works': howRollbackWorks,
    'what-rollback-does-not-cover': whatRollbackDoesNotCover,
  },
  labs: {},
  simulations: {},
};
