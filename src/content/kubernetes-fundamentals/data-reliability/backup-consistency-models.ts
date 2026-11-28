import type { ConceptContentModule, LessonBody } from '../../types';

const crashVsApplicationConsistent: LessonBody = {
  learningObjectives: ['Distinguish crash-consistent snapshots from application-consistent backups'],
  sections: [
    {
      heading: 'What is in RAM when the snapshot fires?',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Consistency level', 'What is captured', 'Restore behavior'],
          rows: [
            ['Crash-consistent', 'Blocks on disk at an instant in time; unflushed OS page cache and in-memory transactions are NOT included', 'Equivalent to pulling the power plug; databases must replay WAL/redo logs and run crash recovery on startup (multi-volume writes may be torn)'],
            ['Application-consistent', 'Application flushes buffers, checkpoints transactions, or pauses writes before the snapshot runs', 'Clean point-in-time state with minimal/no recovery risk across files or multiple volumes'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Taking independent crash-consistent snapshots across two separate PVCs (e.g., data volume + WAL volume) at slightly different seconds can leave them out of sync unless quiesced together or recovered via database-native WAL streaming.',
        },
      ],
    },
  ],
};

const quiescingAndHooks: LessonBody = {
  learningObjectives: ['Design pre/post backup quiescing hooks and WAL-based recovery'],
  sections: [
    {
      heading: 'Coordinating snapshots without breaking production',
      blocks: [
        {
          type: 'list',
          items: [
            'Pre-backup hooks (`CHECKPOINT`, `FLUSH TABLES WITH READ LOCK`, `fsfreeze --freeze`): flush dirty buffers to disk, take the fast copy-on-write snapshot, then immediately unfreeze in a post-backup hook (`fsfreeze --unfreeze`).',
            'Keep freeze windows tiny (milliseconds to a few seconds); a hung post-hook leaves the database frozen and trips liveness probes!',
            'Continuous WAL / binlog archiving: databases like PostgreSQL stream Write-Ahead Log segments continuously to object storage, pairing a base backup with WAL replay for exact **Point-in-Time Recovery (PITR)** to the second before a failure.',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'consistency-kc-1',
      type: 'single-choice',
      prompt: 'A backup tool takes an uncoordinated block snapshot of a busy MySQL Pod’s PVC without running pre-backup flush/quiesce hooks. What consistency guarantee does this snapshot provide?',
      difficulty: 'beginner',
      learningObjective: 'Distinguish crash-consistent snapshots from application-consistent backups',
      options: [
        { id: 'a', label: 'Crash-consistent — equivalent to an unexpected power loss, requiring InnoDB crash recovery on restore', correct: true, explanation: 'Correct — unflushed RAM buffers and open transactions are absent, so MySQL treats the restored disk like an abrupt crash.' },
        { id: 'b', label: 'Application-consistent — guaranteed zero uncommitted dirty state', correct: false, explanation: 'Application-consistent backups require explicit flushing/quiescing coordination with the database.' },
        { id: 'c', label: 'Zero-RPO continuous replication', correct: false, explanation: 'Snapshots still lose everything written after the snapshot timestamp.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'crash-vs-application-consistent': crashVsApplicationConsistent,
    'quiescing-and-hooks': quiescingAndHooks,
  },
  labs: {},
  simulations: {},
};
