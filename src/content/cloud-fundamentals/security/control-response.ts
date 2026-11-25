import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A conceptual timeline of how preventive, detective, and corrective controls
// respond to one risky configuration change. Timings are ILLUSTRATIVE
// (evaluation and response delays vary widely by service, rule type, and
// team) and exist only to compare the exposure window each combination
// leaves. Simulated — no policy engine or cloud account is involved.

export type ChangeId = 'public-storage' | 'open-ssh' | 'audit-log-disabled';

export interface ControlConfig {
  change: ChangeId;
  preventive: boolean;
  detective: boolean;
  corrective: boolean;
  alerting: boolean;
}

export interface ControlEvent {
  minute: number;
  control: 'change' | 'preventive' | 'detective' | 'corrective' | 'alert' | 'human' | 'exposure';
  title: string;
  detail: string;
  result: 'info' | 'ok' | 'fail';
}

export type ControlOutcome = 'prevented' | 'auto-remediated' | 'fixed-after-alert' | 'found-in-review' | 'undetected';

export interface ControlSummary {
  outcome: ControlOutcome;
  /** Minutes the risky configuration existed, or null if it was never fixed. */
  exposureMinutes: number | null;
}

export interface ControlState {
  config: ControlConfig;
  events: ControlEvent[];
  summary: ControlSummary | null;
}

export const EVALUATION_DELAY = 15;
export const REMEDIATION_DELAY = 5;
export const HUMAN_RESPONSE = 60;
export const REVIEW_INTERVAL = 7 * 24 * 60;

interface ChangeInfo {
  label: string;
  risk: string;
  preventiveExample: string;
  detectiveExample: string;
  correctiveExample: string;
}

export const changes: Record<ChangeId, ChangeInfo> = {
  'public-storage': {
    label: 'An engineer enables anonymous public read access on a storage container',
    risk: 'Anyone on the internet can list and download its contents.',
    preventiveExample: 'Examples: an Azure Policy assignment with the deny effect for storage accounts that allow public blob access; S3 Block Public Access enabled at the AWS account level.',
    detectiveExample: 'Examples: Microsoft Defender for Cloud recommendations; an AWS Config rule or Security Hub CSPM control for public buckets.',
    correctiveExample: 'Examples: an Azure Policy modify remediation; an AWS Config remediation that runs a Systems Manager Automation document.',
  },
  'open-ssh': {
    label: 'An engineer adds a security rule allowing SSH (port 22) from any internet address',
    risk: 'Management access is exposed to constant automated scanning and password-guessing.',
    preventiveExample: 'Examples: an Azure Policy deny on network security group rules that open management ports to the internet; on AWS, proactive checks on infrastructure-as-code templates before deployment, or Firewall Manager security group policies.',
    detectiveExample: 'Examples: Defender for Cloud recommendations on open management ports; an AWS Config rule for unrestricted SSH.',
    correctiveExample: 'Examples: an automated workflow that removes the rule; AWS Firewall Manager remediation of non-compliant security groups.',
  },
  'audit-log-disabled': {
    label: 'Someone deletes the export of control-plane audit logs',
    risk: 'Later activity — including an attacker’s — will leave no central record.',
    preventiveExample: 'Examples: an SCP denying cloudtrail:StopLogging and cloudtrail:DeleteTrail; on Azure, withholding permission to change diagnostic settings from everyone except a small platform team.',
    detectiveExample: 'Examples: an alert on the StopLogging or DeleteTrail event; Azure Policy auditIfNotExists on diagnostic settings.',
    correctiveExample: 'Examples: Azure Policy deployIfNotExists re-creating the diagnostic setting; an automated remediation re-enabling the trail.',
  },
};

export function simulateControls(config: ControlConfig): { events: ControlEvent[]; summary: ControlSummary } {
  const info = changes[config.change];
  const events: ControlEvent[] = [
    { minute: 0, control: 'change', title: 'A risky change is attempted', detail: `${info.label}. Risk: ${info.risk}`, result: 'info' },
  ];

  if (config.preventive) {
    events.push({
      minute: 0,
      control: 'preventive',
      title: 'Preventive guardrail denies the change',
      detail: `The request is rejected before the configuration exists, so there is no exposure at all. ${info.preventiveExample} The trade-off: legitimate needs (a deliberately public website container, for example) need a documented exemption process.`,
      result: 'ok',
    });
    return { events, summary: { outcome: 'prevented', exposureMinutes: 0 } };
  }

  events.push({ minute: 0, control: 'exposure', title: 'The risky configuration is live', detail: 'No guardrail stopped it. The exposure window starts now.', result: 'fail' });

  if (!config.detective) {
    events.push({
      minute: 0,
      control: 'exposure',
      title: 'Nothing is watching',
      detail: config.corrective
        ? 'Automatic remediation is configured, but it is triggered by detection — with no detective control, it never runs. The configuration stays until someone happens to notice it, possibly an attacker.'
        : 'No detective control evaluates the configuration. It stays until someone happens to notice it — possibly an attacker.',
      result: 'fail',
    });
    return { events, summary: { outcome: 'undetected', exposureMinutes: null } };
  }

  events.push({
    minute: EVALUATION_DELAY,
    control: 'detective',
    title: 'Detective control flags the resource as non-compliant',
    detail: `A configuration rule evaluates the change and records a finding (here after ${EVALUATION_DELAY} illustrative minutes; real evaluation is change-triggered or periodic). ${info.detectiveExample}`,
    result: 'ok',
  });

  if (config.corrective) {
    const fixedAt = EVALUATION_DELAY + REMEDIATION_DELAY;
    events.push({
      minute: fixedAt,
      control: 'corrective',
      title: 'Automatic remediation restores the safe configuration',
      detail: `The finding triggers a remediation that reverts the setting. ${info.correctiveExample} Automatic fixes need care: test them, and make sure they cannot break a legitimate exception.`,
      result: 'ok',
    });
    if (config.alerting) {
      events.push({ minute: fixedAt, control: 'alert', title: 'The team is notified of what happened', detail: 'Someone still needs to ask why the change was made — a mistake, a missing process, or a compromised account.', result: 'info' });
    }
    return { events, summary: { outcome: 'auto-remediated', exposureMinutes: fixedAt } };
  }

  if (config.alerting) {
    events.push({ minute: EVALUATION_DELAY + 1, control: 'alert', title: 'High-severity finding pages the on-call engineer', detail: 'The finding is routed to a person with the authority to act.', result: 'ok' });
    events.push({
      minute: HUMAN_RESPONSE,
      control: 'human',
      title: 'An engineer investigates and reverts the change',
      detail: `After triage (illustratively ${HUMAN_RESPONSE} minutes in), the engineer reverts the setting and checks the logs for access during the exposure window.`,
      result: 'ok',
    });
    return { events, summary: { outcome: 'fixed-after-alert', exposureMinutes: HUMAN_RESPONSE } };
  }

  events.push({
    minute: REVIEW_INTERVAL,
    control: 'human',
    title: 'Found during the weekly posture review',
    detail: 'The finding sat on a dashboard that nobody was alerted about. It is fixed at the next scheduled review, a week later. Detection without routing to a person is only slightly better than no detection.',
    result: 'fail',
  });
  return { events, summary: { outcome: 'found-in-review', exposureMinutes: REVIEW_INTERVAL } };
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readControlConfig(params: SimulationParams): ControlConfig {
  return {
    change: pick(params.change, ['public-storage', 'open-ssh', 'audit-log-disabled'] as const, 'public-storage'),
    preventive: params.preventive === true,
    detective: params.detective !== false,
    corrective: params.corrective === true,
    alerting: params.alerting === true,
  };
}

export const controlResponseSimulation: SimulationDefinition<ControlState> = {
  id: 'misconfiguration-response',
  title: 'Misconfiguration Response',
  description:
    'Applies one risky configuration change and shows how preventive, detective, corrective, and alerting controls respond, and how long the exposure lasts. Timings are illustrative; simulated with no cloud account involved.',
  parameters: [
    {
      key: 'change',
      label: 'Risky change',
      type: 'select',
      default: 'public-storage',
      options: [
        { label: 'Make a storage container public', value: 'public-storage' },
        { label: 'Open SSH to the internet', value: 'open-ssh' },
        { label: 'Delete the audit log export', value: 'audit-log-disabled' },
      ],
      description: 'The configuration change being made.',
    },
    { key: 'preventive', label: 'Preventive guardrail (deny)', type: 'boolean', default: false, description: 'A policy that rejects the change.' },
    { key: 'detective', label: 'Detective rule (compliance check)', type: 'boolean', default: true, description: 'A rule that flags the configuration as non-compliant.' },
    { key: 'corrective', label: 'Automatic remediation', type: 'boolean', default: false, description: 'Reverts the configuration when the detective rule fires.' },
    { key: 'alerting', label: 'Route findings to on-call', type: 'boolean', default: false, description: 'High-severity findings notify a person.' },
  ],
  createInitialState: (params) => ({ config: readControlConfig(params), events: [], summary: null }),
  steps: (params) => {
    const { events, summary } = simulateControls(readControlConfig(params));
    return events.map((event, i) => {
      const isLast = i === events.length - 1;
      return {
        id: `ctl-${i + 1}`,
        label: event.title,
        description: event.detail,
        apply: (state: ControlState): ControlState => ({ ...state, events: [...state.events, event], summary: isLast ? summary : null }),
      };
    });
  },
};
