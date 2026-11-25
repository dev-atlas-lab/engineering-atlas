import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A conceptual model of where an application's database password lives and
// what happens on startup, rotation, and exposure. The secret store behaves
// like Azure Key Vault or AWS Secrets Manager at the level described here:
// identity-based authorization, versions, access logging. Simulated — no
// secret store, database, or registry is contacted.

export type SecretLocation = 'secret-store' | 'container-image' | 'source-code';
export type AppSecretHandling = 'reload-on-failure' | 'cache-forever';

export interface SecretConfig {
  location: SecretLocation;
  authorized: boolean;
  rotation: boolean;
  handling: AppSecretHandling;
  exposed: boolean;
}

export interface SecretEvent {
  phase: 'start' | 'authenticate' | 'authorize' | 'retrieve' | 'use' | 'rotate' | 'reconnect' | 'exposure';
  title: string;
  detail: string;
  result: 'info' | 'ok' | 'fail';
}

export interface SecretSummary {
  appWorking: boolean;
  secretExposed: boolean;
  /** Whether retrievals leave an audit trail of who read the secret. */
  auditTrail: boolean;
  rotationOutcome: 'not-rotated' | 'followed' | 'broke-app' | 'requires-rebuild';
}

export interface SecretState {
  config: SecretConfig;
  versions: { version: string; status: 'current' | 'previous' | 'pending' }[];
  appHolds: string | null;
  events: SecretEvent[];
  summary: SecretSummary | null;
}

export function simulateSecret(config: SecretConfig): { events: SecretEvent[]; summary: SecretSummary; finalVersions: SecretState['versions']; appHolds: string | null } {
  const events: SecretEvent[] = [];
  let appWorking = true;
  let rotationOutcome: SecretSummary['rotationOutcome'] = 'not-rotated';
  let appHolds: string | null = null;
  let versions: SecretState['versions'] = [{ version: 'v1', status: 'current' }];

  if (config.location === 'secret-store') {
    events.push({ phase: 'start', title: 'Application starts', detail: 'The image and configuration hold only the vault address and the secret name, db-password. Nothing sensitive is baked in.', result: 'info' });
    events.push({ phase: 'authenticate', title: 'Workload identity authenticates', detail: 'The app obtains a short-lived token for its managed identity or IAM role from the platform — no stored credential is involved.', result: 'ok' });
    if (!config.authorized) {
      events.push({
        phase: 'authorize',
        title: 'Secret store denies access',
        detail: 'The identity has no permission to read db-password (for example, no Key Vault Secrets User role, or no secretsmanager:GetSecretValue). The denial is logged, and the app fails at startup with a clear error instead of running half-configured.',
        result: 'fail',
      });
      return { events, summary: { appWorking: false, secretExposed: false, auditTrail: true, rotationOutcome: 'not-rotated' }, finalVersions: versions, appHolds };
    }
    events.push({ phase: 'authorize', title: 'Secret store authorizes the identity', detail: 'The identity may read this one secret. The request is recorded in the access log with the caller, the secret, and the time.', result: 'ok' });
    events.push({ phase: 'retrieve', title: 'Current version retrieved', detail: 'The store returns v1, the current version of db-password.', result: 'ok' });
    appHolds = 'v1';
    events.push({ phase: 'use', title: 'App connects to the database', detail: 'The password lives only in the app’s memory.', result: 'ok' });

    if (config.rotation) {
      versions = [
        { version: 'v2', status: 'current' },
        { version: 'v1', status: 'previous' },
      ];
      events.push({
        phase: 'rotate',
        title: 'Scheduled rotation',
        detail: 'Rotation generates a new password, sets it on the database, and stores it as v2, the new current version. v1 is kept as the previous version for rollback, but the database no longer accepts it.',
        result: 'info',
      });
      if (config.handling === 'cache-forever') {
        appWorking = false;
        rotationOutcome = 'broke-app';
        events.push({
          phase: 'reconnect',
          title: 'App reconnects with its cached v1 — rejected',
          detail: 'The app read the secret once at startup and never again. Its next database connection uses the old password and fails until someone restarts it. Rotation must be designed together with retrieval.',
          result: 'fail',
        });
      } else {
        appHolds = 'v2';
        rotationOutcome = 'followed';
        events.push({
          phase: 'reconnect',
          title: 'Login fails once — app re-reads the latest version',
          detail: 'When the database rejects v1, the app fetches the current version (v2) from the store and reconnects. Users notice nothing, and the retrieval is logged.',
          result: 'ok',
        });
      }
    }

    if (config.exposed) {
      events.push({
        phase: 'exposure',
        title: 'The image and repository leak',
        detail: 'An outsider obtains the container image and the source repository. They find the vault address and the secret name — and no secret. Reading it would require the workload’s identity and its permission, and any attempt would appear in the access log.',
        result: 'ok',
      });
    }
    return { events, summary: { appWorking, secretExposed: false, auditTrail: true, rotationOutcome }, finalVersions: versions, appHolds };
  }

  const where = config.location === 'container-image' ? 'an environment variable baked into the container image' : 'a constant in the application’s source code';
  events.push({ phase: 'start', title: 'Application starts', detail: `The password is in ${where}. It is present in every copy of the ${config.location === 'container-image' ? 'image, in every registry and node cache it was pulled into' : 'repository, including its full history and every clone'}.`, result: 'info' });
  events.push({ phase: 'authorize', title: 'No authorization step', detail: 'Nothing checks who is reading the password: whoever has the image or code has the secret. There is no record of who read it.', result: 'info' });
  appHolds = 'v1';
  events.push({ phase: 'use', title: 'App connects to the database', detail: 'The app works — which is why this pattern survives so long.', result: 'ok' });

  if (config.rotation) {
    versions = [
      { version: 'v2', status: 'current' },
      { version: 'v1', status: 'previous' },
    ];
    appWorking = false;
    rotationOutcome = 'requires-rebuild';
    events.push({
      phase: 'rotate',
      title: 'Password rotated on the database',
      detail: `The app cannot pick up the new password: it is fixed in ${config.location === 'container-image' ? 'the image' : 'the code'}. Rotation now requires ${config.location === 'container-image' ? 'rebuilding and redeploying the image' : 'a code change, build, and redeploy'}, and until then the app fails. Teams facing this tend to stop rotating — and the old password lives on in every earlier ${config.location === 'container-image' ? 'image' : 'commit'}.`,
      result: 'fail',
    });
  }

  if (config.exposed) {
    events.push({
      phase: 'exposure',
      title: 'The image and repository leak',
      detail:
        config.location === 'container-image'
          ? 'Image layers and their configuration are readable by anyone who can pull the image; the environment variable is visible in the image’s metadata. The attacker now holds a working password, and no log recorded the read.'
          : 'The password is readable in the source, and stays in the git history even if the line is later deleted. The attacker now holds a working password, and no log recorded the read.',
      result: 'fail',
    });
  }
  return {
    events,
    summary: { appWorking, secretExposed: config.exposed, auditTrail: false, rotationOutcome },
    finalVersions: versions,
    appHolds,
  };
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readSecretConfig(params: SimulationParams): SecretConfig {
  return {
    location: pick(params.location, ['secret-store', 'container-image', 'source-code'] as const, 'secret-store'),
    authorized: params.authorized !== false,
    rotation: params.rotation === true,
    handling: pick(params.handling, ['reload-on-failure', 'cache-forever'] as const, 'reload-on-failure'),
    exposed: params.exposed === true,
  };
}

export const secretRetrievalSimulation: SimulationDefinition<SecretState> = {
  id: 'secret-retrieval',
  title: 'Secret Retrieval and Rotation',
  description:
    'Follows a database password from where it is stored, through startup, rotation, and an exposure of the image and repository. Simulated: no secret store, database, or registry is contacted.',
  parameters: [
    {
      key: 'location',
      label: 'Where the password lives',
      type: 'select',
      default: 'secret-store',
      options: [
        { label: 'Secret store, fetched at runtime with a workload identity', value: 'secret-store' },
        { label: 'Environment variable baked into the container image', value: 'container-image' },
        { label: 'Hardcoded in source code', value: 'source-code' },
      ],
      description: 'How the application gets its database password.',
    },
    { key: 'authorized', label: 'Identity may read the secret', type: 'boolean', default: true, description: 'Only applies to the secret store.' },
    { key: 'rotation', label: 'Rotate the password', type: 'boolean', default: false, description: 'A new password is set on the database and stored as a new version.' },
    {
      key: 'handling',
      label: 'App behaviour after rotation',
      type: 'select',
      default: 'reload-on-failure',
      options: [
        { label: 'Re-read the latest version when login fails', value: 'reload-on-failure' },
        { label: 'Cache the secret read at startup forever', value: 'cache-forever' },
      ],
      description: 'Only applies to the secret store.',
    },
    { key: 'exposed', label: 'Image and repository leak', type: 'boolean', default: false, description: 'An outsider obtains the container image and source repository.' },
  ],
  createInitialState: (params) => ({ config: readSecretConfig(params), versions: [{ version: 'v1', status: 'current' }], appHolds: null, events: [], summary: null }),
  steps: (params) => {
    const config = readSecretConfig(params);
    const result = simulateSecret(config);
    const rotateIndex = result.events.findIndex((e) => e.phase === 'rotate');
    let holds: string | null = null;
    return result.events.map((event, i) => {
      const isLast = i === result.events.length - 1;
      if (event.phase === 'use') holds = 'v1';
      if (event.phase === 'reconnect' && event.result === 'ok') holds = 'v2';
      const holdsNow = holds;
      return {
        id: `secret-${i + 1}`,
        label: event.title,
        description: event.detail,
        apply: (state: SecretState): SecretState => ({
          ...state,
          versions: rotateIndex >= 0 && i >= rotateIndex ? result.finalVersions : state.versions,
          appHolds: holdsNow,
          events: [...state.events, event],
          summary: isLast ? result.summary : null,
        }),
      };
    });
  },
};
