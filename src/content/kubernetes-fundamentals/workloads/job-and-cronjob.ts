import type { ConceptContentModule, LessonBody } from '../../types';

const jobsForBatchWork: LessonBody = {
  learningObjectives: [
    'Distinguish run-to-completion workloads from long-running ones',
    'Explain completions, parallelism, and backoffLimit',
  ],
  sections: [
    {
      heading: 'A Job runs Pods until they succeed',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Deployment\'s Pods are supposed to keep running — if one exits, something is wrong. A Job\'s Pods are supposed to finish — when enough of them exit with success, the Job is done. This is the right abstraction for batch work: database migrations, image processing, periodic cleanup, report generation.',
        },
        {
          type: 'comparisonTable',
          headers: ['Setting', 'Meaning'],
          rows: [
            ['completions', 'How many Pods must succeed for the Job to be considered complete (default 1)'],
            ['parallelism', 'How many Pods may run concurrently (default 1)'],
            ['backoffLimit', 'How many times to retry a failing Pod before marking the Job failed (default 6)'],
            ['activeDeadlineSeconds', 'Maximum wall-clock time the Job may run; after this, remaining Pods are terminated'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Setting completions=100 and parallelism=5 runs a batch of 100 work units, 5 at a time. The Job tracks progress; failed Pods are retried up to backoffLimit before the Job itself fails.',
        },
      ],
    },
  ],
};

const cronJobs: LessonBody = {
  learningObjectives: ['Describe how a CronJob creates Jobs on a schedule'],
  sections: [
    {
      heading: 'CronJob — a controller that creates Jobs',
      blocks: [
        {
          type: 'paragraph',
          text: 'A CronJob is a schedule plus a Job template. At each scheduled time, the CronJob controller creates a new Job from the template. The Job then runs Pods until it completes. The schedule syntax is standard cron (minute, hour, day of month, month, day of week).',
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'CronJob — runs every 15 minutes',
          code: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup
spec:
  schedule: "*/15 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: cleanup
              image: cleanup:1.0`,
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Two tunables are easy to miss. concurrencyPolicy (Allow/Forbid/Replace) decides what to do when a new scheduled time arrives before the previous Job finished. successfulJobsHistoryLimit and failedJobsHistoryLimit bound how many completed Jobs are kept; without them, "kubectl get jobs" output grows forever.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'jobs-for-batch-work': jobsForBatchWork,
    'cronjobs-on-a-schedule': cronJobs,
  },
  labs: {},
  simulations: {},
};
