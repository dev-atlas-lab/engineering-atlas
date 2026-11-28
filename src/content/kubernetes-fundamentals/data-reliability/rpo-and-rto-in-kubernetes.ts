import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { backupRestoreLifecycleScene } from '../storage-scenes';
import { backupRecoverySimulation } from '../storage-simulations';
import { renderBackupState } from '../storage-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const measuringRpoAndRto: LessonBody = {
  learningObjectives: ['Calculate RPO and RTO from backup cadence, failure time, and restore duration'],
  visualization: backupRestoreLifecycleScene,
  sections: [
    {
      heading: 'Two numbers that govern architecture and cost',
      blocks: [
        {
          type: 'list',
          items: [
            '**RPO (Recovery Point Objective):** maximum tolerable data loss measured in time (`failure_time − last_usable_backup_time`). Driven by backup frequency (or WAL shipping cadence).',
            '**RTO (Recovery Time Objective):** maximum tolerable downtime (`service_healthy_time − failure_time`). Driven by detection time, backup transfer/snapshot hydration speed, Pod rescheduling, and database recovery/warmup.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Every tightening of RPO and RTO costs money and operational complexity. Daily snapshots can leave an RPO of 24 hours; continuous WAL archiving plus warm standbys drops RPO to seconds and RTO to minutes, at higher infrastructure cost.',
        },
      ],
    },
  ],
};

const designingBackupSchedules: LessonBody = {
  learningObjectives: ['Tune retention windows to survive delayed detection of silent corruption'],
  sections: [
    {
      heading: 'Why short retention fails against silent corruption',
      blocks: [
        {
          type: 'paragraph',
          text: 'Accidental deletion is noticed immediately — your newest pre-failure backup suffices. **Silent logical corruption** (a buggy migration or corrupted batch job) may go unnoticed for days. If your retention window is only 24 hours and you take hourly backups, every retained backup may already contain the corrupted data!',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Layer retention tiers (for example: hourly for 48 hours, daily for 30 days, weekly for 6 months) so delayed-detection bugs do not overwrite your last clean backup.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'rpo-rto-kc-1',
      type: 'single-choice',
      prompt: 'Snapshots run every 6 hours (00:00, 06:00, 12:00, 18:00), and restoring a snapshot + booting the Pod takes 25 minutes. At 11:45, an operator deletes the database PVC by mistake. Assuming detection is immediate, what are the actual data loss and recovery time?',
      difficulty: 'intermediate',
      learningObjective: 'Calculate RPO and RTO from backup cadence, failure time, and restore duration',
      options: [
        { id: 'a', label: '5 hours 45 minutes of data lost (since 06:00) and ~25 minutes of downtime', correct: true, explanation: 'Correct — the latest pre-failure snapshot was at 06:00 (5h45m lost = actual RPO), and restore + boot takes ~25 minutes (actual RTO).' },
        { id: 'b', label: '25 minutes of data lost and 5 hours 45 minutes of downtime', correct: false, explanation: 'This swaps RPO (data loss window) and RTO (recovery duration).' },
        { id: 'c', label: 'Zero data lost because snapshots are taken every 6 hours', correct: false, explanation: 'Any writes between 06:00 and 11:45 were never captured in the 06:00 snapshot.' },
      ],
    },
  ],
};

const backupLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '15 minutes',
  description:
    'Tune backup frequency, retention count, consistency mode, and restore duration across accidental deletion and silent logical corruption scenarios. (Uses discrete simulation ticks rather than wall-clock timestamps.)',
  learningObjectives: [
    'Observe how backup frequency drives RPO and restore duration drives RTO',
    'Spot why crash-consistent backups and short retention windows create recovery risks',
  ],
  prerequisites: [
    { type: 'concept', id: 'rpo-and-rto-in-kubernetes', label: 'RPO and RTO in Kubernetes', description: 'Understand RPO, RTO, and backup consistency.' },
  ],
  content: {
    simulationId: 'backup-recovery-simulator',
    instructions: [
      { id: 'step-1', label: 'Baseline application-consistent restore', description: 'Run with frequency=3, retention=5, application-consistent, restoreDuration=2, accidental-delete. Advance past t=11 to see RPO=1 tick and RTO=2 ticks.' },
      { id: 'step-2', label: 'Worsen RPO with infrequent backups', description: 'Set frequency=6. Notice the latest backup before t=10 is t=6, raising RPO to 4 ticks.' },
      { id: 'step-3', label: 'Test crash-consistent trade-off', description: 'Switch consistency to crash-consistent and inspect the restore note warning about database recovery overhead.' },
      { id: 'step-4', label: 'Silent corruption trap', description: 'Set scenario to Silent data corruption with frequency=1 and retention=3. Only ticks t=8,9,10 remain — all potentially inside the corruption window!' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'backup-restored-with-metrics',
        label: 'When a failure occurs with an eligible backup, restore completes with measured RPO and RTO',
        check: (state) => {
          const s = state as { scenario: string; tick: number; backups: unknown[]; restored: boolean; rpoTicks: number | null; rtoTicks: number | null };
          if (s.scenario === 'none' || s.tick < 11 || s.backups.length === 0) return true;
          return s.restored && s.rpoTicks !== null && s.rtoTicks !== null;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'measuring-rpo-and-rto': measuringRpoAndRto,
    'designing-backup-schedules': designingBackupSchedules,
  },
  labs: {
    'backup-recovery-simulator': backupLab,
  },
  simulations: {
    'backup-recovery-simulator': bindSimulation(backupRecoverySimulation, renderBackupState),
  },
};
