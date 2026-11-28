import type { ConceptContentModule, LessonBody } from '../../types';

const restoreExecutionPaths: LessonBody = {
  learningObjectives: ['Execute an isolated namespace or cluster restore safely'],
  sections: [
    {
      heading: 'Restore beside production, never overwrite blindly',
      blocks: [
        {
          type: 'paragraph',
          text: 'Restoring over live namespaces risks destroying recent forensic state or clobbering running workloads. Prefer restoring into a parallel staging namespace (for example `prod-restore-verify`) or provisioning fresh PVCs from snapshots, validating data integrity, and then cutting traffic or renaming cleanly.',
        },
        {
          type: 'list',
          items: [
            'Remap StorageClasses when restoring to another cluster/environment whose StorageClass names differ.',
            'Watch out for hardcoded NodePorts, static LoadBalancer IPs, or conflicting Ingress hosts when restoring side-by-side in the same cluster.',
          ],
        },
      ],
    },
  ],
};

const testingBackupsAndCorruption: LessonBody = {
  learningObjectives: ['Design automated restore verification drills to catch broken backups early'],
  sections: [
    {
      heading: 'An untested backup is an assumption, not a recovery plan',
      blocks: [
        {
          type: 'paragraph',
          text: 'Backups silently fail in practice due to expired encryption keys, IAM permissions missing `kms:Decrypt`, empty snapshots from mismatched label selectors, or un-quiesced corrupted tables. The only proof a backup works is periodically restoring it into an isolated namespace and running application-level sanity queries.',
        },
        {
          type: 'list',
          items: [
            'Automate a weekly/monthly restore job in an ephemeral namespace that checks row counts, checksums, and migration version.',
            'Measure actual restore duration during drills — cloud disk hydration and lazy snapshot loading (e.g., EBS first-read latency) often surprise teams with much worse RTO than expected.',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'restore-ver-kc-1',
      type: 'single-choice',
      prompt: 'A backup job reports `Completed` every night, yet during a real incident the restored database fails checksum verification. Which practice prevents discovering this during an outage?',
      difficulty: 'beginner',
      learningObjective: 'Design automated restore verification drills to catch broken backups early',
      options: [
        { id: 'a', label: 'Scheduled automated restore-and-verify drills in an isolated namespace that start the database and run integrity checks', correct: true, explanation: 'Correct — exit code 0 on a backup upload does not prove the restored database boots cleanly or passes data integrity checks.' },
        { id: 'b', label: 'Checking that `kubectl get volumesnapshot` shows `READYTOUSE: true`', correct: false, explanation: 'READYTOUSE confirms the storage array finished creating the snapshot, not that the database files inside it are logically valid.' },
        { id: 'c', label: 'Increasing the backup retention count from 7 to 30', correct: false, explanation: 'Longer retention keeps more copies, but if the backup mechanism produces corrupt copies, all 30 will be unusable.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'restore-execution-paths': restoreExecutionPaths,
    'testing-backups-and-corruption': testingBackupsAndCorruption,
  },
  labs: {},
  simulations: {},
};
