import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A conceptual timeline of how an application's credential behaves over three
// hours: how it is obtained, whether it expires and is refreshed, whether the
// target resource authorizes it, and how long a copied credential stays useful.
// Lifetimes are ILLUSTRATIVE (one hour, refreshed at 45 minutes) — real
// lifetimes vary by provider, service, and configuration, and SDKs choose their
// own refresh points. Simulated; nothing is sent to Azure or AWS.

export type Mechanism = 'managed-identity' | 'instance-role' | 'static-key';
export type RefreshBehaviour = 'sdk' | 'cached-at-startup';

export interface CredentialConfig {
  mechanism: Mechanism;
  refresh: RefreshBehaviour;
  authorized: boolean;
  leaked: boolean;
}

export const LIFETIME_MINUTES = 60;
export const REFRESH_AT_MINUTES = 45;
const APP_CALLS = [0, 90, 180];
const LEAK_AT = 100;
const ATTACKER_CALLS = [110, 180];

export type Actor = 'app' | 'platform' | 'attacker';
export type EventResult = 'ok' | 'fail' | 'info';

export interface TimelineEvent {
  minute: number;
  actor: Actor;
  label: string;
  detail: string;
  result: EventResult;
}

export interface CredentialSummary {
  appCallsSucceeded: number;
  appCallsFailed: number;
  failureCause: 'expired' | 'forbidden' | null;
  /** How long a copied credential stays usable by whoever copied it. */
  leakExposure: 'none' | 'until-expiry' | 'until-manually-revoked' | null;
  attackerCallsSucceeded: number;
  secretStoredWithApp: boolean;
}

export interface CredentialState {
  config: CredentialConfig;
  events: TimelineEvent[];
  summary: CredentialSummary | null;
}

const isTemporary = (m: Mechanism) => m !== 'static-key';

const label: Record<Mechanism, string> = {
  'managed-identity': 'Azure managed identity',
  'instance-role': 'AWS IAM role (instance profile)',
  'static-key': 'Long-lived access key in configuration',
};

/** Expiry of the credential the app holds at a given minute, or null for a key with no expiry. */
export function credentialExpiryAt(config: CredentialConfig, minute: number): number | null {
  if (!isTemporary(config.mechanism)) return null;
  if (config.refresh === 'cached-at-startup') return LIFETIME_MINUTES;
  // Refreshed every REFRESH_AT_MINUTES; each credential lives LIFETIME_MINUTES from issue.
  const issuedAt = Math.floor(minute / REFRESH_AT_MINUTES) * REFRESH_AT_MINUTES;
  return issuedAt + LIFETIME_MINUTES;
}

function obtainEvent(config: CredentialConfig): TimelineEvent {
  switch (config.mechanism) {
    case 'managed-identity':
      return {
        minute: 0,
        actor: 'platform',
        label: 'App requests a token from the local metadata endpoint',
        detail: `The SDK calls the Instance Metadata Service (169.254.169.254) with the header Metadata: true. Microsoft Entra ID issues an access token for the managed identity — illustratively valid for ${LIFETIME_MINUTES} minutes. No secret is stored anywhere in the app.`,
        result: 'ok',
      };
    case 'instance-role':
      return {
        minute: 0,
        actor: 'platform',
        label: 'App requests role credentials from instance metadata',
        detail: `The SDK opens an IMDSv2 session and retrieves temporary credentials for the instance profile’s role, issued by AWS STS — illustratively valid for ${LIFETIME_MINUTES} minutes. No access key is stored in the app.`,
        result: 'ok',
      };
    case 'static-key':
      return {
        minute: 0,
        actor: 'app',
        label: 'App reads an access key from its configuration file',
        detail: 'The key was pasted into configuration when the app was deployed. It has no expiry: it works until someone rotates or deactivates it — and it now also lives in every copy of that configuration.',
        result: 'info',
      };
  }
}

export function simulateCredentials(config: CredentialConfig): { events: TimelineEvent[]; summary: CredentialSummary } {
  const events: TimelineEvent[] = [obtainEvent(config)];
  let ok = 0;
  let failed = 0;
  let failureCause: CredentialSummary['failureCause'] = null;

  const appCall = (minute: number) => {
    const expiry = credentialExpiryAt(config, minute);
    if (expiry !== null && minute >= expiry) {
      failed++;
      failureCause ??= 'expired';
      events.push({
        minute,
        actor: 'app',
        label: 'App calls storage — credential expired',
        detail: `The app cached its first credential at startup and never refreshed it. It expired at minute ${expiry}, so the service rejects it as expired. Nothing about the permissions changed; the app simply holds a dead credential.`,
        result: 'fail',
      });
      return;
    }
    if (!config.authorized) {
      failed++;
      failureCause ??= 'forbidden';
      events.push({
        minute,
        actor: 'app',
        label: 'App calls storage — authenticated but forbidden',
        detail: 'The credential is valid, so authentication succeeds, but the identity has no role assignment or policy allowing access to the storage. The service returns 403: identity is not the same as permission.',
        result: 'fail',
      });
      return;
    }
    ok++;
    events.push({
      minute,
      actor: 'app',
      label: 'App calls storage — allowed',
      detail:
        expiry === null
          ? 'The long-lived key authenticates and the identity is authorized.'
          : `The credential (valid until minute ${expiry}) authenticates and the identity’s permissions allow the call.`,
      result: 'ok',
    });
  };

  for (const minute of APP_CALLS) {
    // Show refreshes that happened since the previous call.
    if (isTemporary(config.mechanism) && config.refresh === 'sdk' && minute > 0) {
      const previous = APP_CALLS[APP_CALLS.indexOf(minute) - 1]!;
      for (let t = REFRESH_AT_MINUTES; t <= minute; t += REFRESH_AT_MINUTES) {
        if (t > previous) {
          events.push({
            minute: t,
            actor: 'platform',
            label: 'SDK refreshes the credential before it expires',
            detail: `At minute ${t}, ${LIFETIME_MINUTES - REFRESH_AT_MINUTES} minutes before the current credential expires, the SDK silently obtains a new one valid until minute ${t + LIFETIME_MINUTES}.`,
            result: 'info',
          });
        }
      }
    }
    appCall(minute);
  }

  let attackerOk = 0;
  if (config.leaked) {
    const expiry = credentialExpiryAt(config, LEAK_AT);
    const alreadyExpired = expiry !== null && expiry <= LEAK_AT;
    events.push({
      minute: LEAK_AT,
      actor: 'attacker',
      label: 'The credential the app holds is copied',
      detail:
        expiry === null
          ? 'A copy of the configuration file — from a repository, a backup, or a log — gives an attacker the access key. Nothing about the key changes; both the app and the attacker can now use it.'
          : alreadyExpired
            ? `An attacker copies the credential the app is still holding — but it already expired at minute ${expiry}, so the copy is useless. (The app is broken for the same reason.)`
            : `An attacker copies the credential from the app’s memory or logs. It is valid until minute ${expiry}; the attacker cannot get a new one without the ability to call the metadata endpoint from inside the compute resource.`,
      result: 'info',
    });
    for (const minute of ATTACKER_CALLS) {
      const valid = expiry === null || minute < expiry;
      const allowed = valid && config.authorized;
      if (allowed) attackerOk++;
      events.push({
        minute,
        actor: 'attacker',
        label: allowed ? 'Attacker uses the copied credential — succeeds' : valid ? 'Attacker uses the copied credential — forbidden' : 'Attacker uses the copied credential — expired',
        detail: allowed
          ? expiry === null
            ? 'The key never expires, so it works for the attacker exactly as it works for the app — until someone notices and rotates it.'
            : `Still inside its lifetime (until minute ${expiry}), so the copy works for now.`
          : valid
            ? 'The copy is valid but the identity has no permission on the target, so even the attacker gets 403 — least privilege limited the blast radius.'
            : `The copy expired at minute ${expiry}. The leak was bounded by the credential’s lifetime.`,
        result: allowed ? 'fail' : 'ok',
      });
    }
  }

  events.sort((a, b) => a.minute - b.minute);

  const leakExposure: CredentialSummary['leakExposure'] = !config.leaked
    ? 'none'
    : isTemporary(config.mechanism)
      ? 'until-expiry'
      : 'until-manually-revoked';

  return {
    events,
    summary: {
      appCallsSucceeded: ok,
      appCallsFailed: failed,
      failureCause,
      leakExposure,
      attackerCallsSucceeded: attackerOk,
      secretStoredWithApp: config.mechanism === 'static-key',
    },
  };
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readCredentialConfig(params: SimulationParams): CredentialConfig {
  return {
    mechanism: pick(params.mechanism, ['managed-identity', 'instance-role', 'static-key'] as const, 'managed-identity'),
    refresh: pick(params.refresh, ['sdk', 'cached-at-startup'] as const, 'sdk'),
    authorized: params.authorized !== false,
    leaked: params.leaked === true,
  };
}

export function mechanismLabel(m: Mechanism): string {
  return label[m];
}

export const credentialLifecycleSimulation: SimulationDefinition<CredentialState> = {
  id: 'workload-credential-lifecycle',
  title: 'Workload Credential Lifecycle',
  description:
    'Follows an application’s credential for three hours: how it is obtained, whether it expires and is refreshed, whether the target authorizes it, and how long a copied credential stays useful. Lifetimes are illustrative; simulated, with nothing sent to Azure or AWS.',
  parameters: [
    {
      key: 'mechanism',
      label: 'How the app authenticates',
      type: 'select',
      default: 'managed-identity',
      options: [
        { label: 'Azure managed identity', value: 'managed-identity' },
        { label: 'AWS IAM role via instance profile', value: 'instance-role' },
        { label: 'Long-lived access key in configuration', value: 'static-key' },
      ],
      description: 'Where the app’s credential comes from.',
    },
    {
      key: 'refresh',
      label: 'Credential handling in the app',
      type: 'select',
      default: 'sdk',
      options: [
        { label: 'SDK credential provider (refreshes automatically)', value: 'sdk' },
        { label: 'Fetched once at startup and cached forever', value: 'cached-at-startup' },
      ],
      description: 'Only matters for temporary credentials.',
    },
    { key: 'authorized', label: 'Identity has permission on the storage', type: 'boolean', default: true, description: 'A role assignment or policy allows the app’s calls.' },
    { key: 'leaked', label: 'The credential is copied at minute 100', type: 'boolean', default: false, description: 'Simulates a credential leaking from configuration, memory, or logs.' },
  ],
  createInitialState: (params) => ({ config: readCredentialConfig(params), events: [], summary: null }),
  steps: (params) => {
    const config = readCredentialConfig(params);
    const { events, summary } = simulateCredentials(config);
    return events.map((event, i) => {
      const isLast = i === events.length - 1;
      return {
        id: `cred-${i + 1}`,
        label: `Minute ${event.minute}: ${event.label}`,
        description: event.detail,
        apply: (state: CredentialState): CredentialState => ({
          ...state,
          events: [...state.events, event],
          summary: isLast ? summary : null,
        }),
      };
    });
  },
};
