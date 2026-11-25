import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';

// A conceptual model of the layers a request meets on its way to a web
// application: network-layer DDoS mitigation, HTTP protocol validation at the
// proxy, WAF managed rules, a rate-based rule, and the application's own
// authorization. Traffic is described, not generated — this is a teaching
// model, not a security testing tool. Outcomes are deterministic for each
// configuration; real mitigation depends on attack size, shape, and tuning.

export type TrafficScenario = 'normal' | 'sqli' | 'malformed' | 'volumetric' | 'http-flood' | 'unauthorized-admin';
export type DdosTier = 'baseline' | 'enhanced';
export type WafMode = 'off' | 'detection' | 'prevention';

export interface EdgeConfig {
  traffic: TrafficScenario;
  ddosTier: DdosTier;
  wafMode: WafMode;
  rateLimit: boolean;
  appAuthz: boolean;
}

export type LayerId = 'network-edge' | 'http-proxy' | 'waf' | 'rate-limit' | 'app-authz' | 'app';
export type LayerVerdict = 'pass' | 'blocked' | 'logged' | 'not-applicable' | 'served' | 'overloaded' | 'violation';

export interface LayerResult {
  layer: LayerId;
  title: string;
  verdict: LayerVerdict;
  detail: string;
}

export type EdgeOutcome = 'served' | 'blocked' | 'logged-and-served' | 'degraded' | 'access-violation';

export interface EdgeEvaluation {
  request: string;
  layers: LayerResult[];
  outcome: EdgeOutcome;
  blockedAt: LayerId | null;
  summary: string;
}

export interface EdgeState {
  config: EdgeConfig;
  request: string;
  layers: LayerResult[];
  outcome: EdgeOutcome | null;
  blockedAt: LayerId | null;
  summary: string | null;
}

export const requests: Record<TrafficScenario, string> = {
  normal: 'A customer’s browser sends GET /search?q=concert+tickets — a few requests a minute.',
  sqli: "A scanner sends GET /search?q=' OR '1'='1' -- — a classic SQL injection pattern in the query string.",
  malformed: 'A client sends a request whose header lines are not valid HTTP syntax.',
  volumetric: 'A botnet directs a large UDP reflection flood at the site’s public IP address.',
  'http-flood': 'One client sends thousands of individually valid GET /search requests per minute.',
  'unauthorized-admin': 'A signed-in customer sends a well-formed GET /admin/refunds request.',
};

const layerTitle: Record<LayerId, string> = {
  'network-edge': 'Network-layer DDoS mitigation (L3/L4)',
  'http-proxy': 'TLS termination and HTTP protocol validation',
  waf: 'WAF managed rules (L7)',
  'rate-limit': 'Rate-based rule',
  'app-authz': 'Application authorization',
  app: 'Application',
};

export function evaluateEdge(config: EdgeConfig): EdgeEvaluation {
  const layers: LayerResult[] = [];
  const add = (layer: LayerId, verdict: LayerVerdict, detail: string) => layers.push({ layer, title: layerTitle[layer], verdict, detail });
  const finish = (outcome: EdgeOutcome, blockedAt: LayerId | null, summary: string): EdgeEvaluation => ({ request: requests[config.traffic], layers, outcome, blockedAt, summary });
  const tierNote =
    config.ddosTier === 'enhanced'
      ? 'With an enhanced tier (Azure DDoS Network or IP Protection, AWS Shield Advanced), detection is tuned to this application’s traffic and you get attack metrics, alerts, and access to the provider’s response team.'
      : 'Baseline protection is included automatically on both clouds. It is tuned for the platform as a whole and gives little attack-specific visibility.';

  // 1. Network edge
  if (config.traffic === 'volumetric') {
    add('network-edge', 'blocked', `The flood is mitigated at the provider’s network edge before it reaches your resources. ${tierNote}`);
    add('http-proxy', 'not-applicable', 'Never reached. A UDP flood is not HTTP at all, so no HTTP-layer control could have inspected it.');
    return finish('blocked', 'network-edge', 'Volumetric attacks are a network-layer problem: they are absorbed by provider-scale DDoS mitigation, not by a WAF or the application. No mitigation is a guarantee; very large or unusual attacks may still cause impact.');
  }
  add('network-edge', 'pass', config.traffic === 'http-flood'
    ? 'Each connection is ordinary TCP carrying valid HTTP, and the total volume is small by network standards, so network-layer DDoS mitigation forwards it. Network-layer protection does not interpret HTTP requests.'
    : 'Ordinary TCP traffic at normal volume is forwarded.');

  // 2. HTTP proxy
  if (config.traffic === 'malformed') {
    add('http-proxy', 'blocked', 'The gateway or CDN that terminates TLS cannot parse the request as HTTP and rejects it with 400 Bad Request. WAF managed rule sets add protocol-enforcement rules for subtler anomalies in requests that do parse.');
    return finish('blocked', 'http-proxy', 'Requests that are not valid HTTP are rejected by the proxy itself, before any WAF rule or application code runs.');
  }
  add('http-proxy', 'pass', 'TLS is terminated and the request parses as valid HTTP.');

  // 3. WAF managed rules
  if (config.wafMode === 'off') {
    add('waf', 'not-applicable', 'No WAF policy is attached, so the request is not inspected at layer 7.');
  } else if (config.traffic === 'sqli') {
    if (config.wafMode === 'prevention') {
      add('waf', 'blocked', 'The SQL injection rules in the managed rule set match the query string, and in prevention mode the WAF returns 403 and logs the match.');
      return finish('blocked', 'waf', 'The WAF blocked a known attack pattern at the edge. It still matters that the application uses parameterized queries: a WAF recognises patterns it has rules for, and novel variants exist.');
    }
    add('waf', 'logged', 'The SQL injection rules match, but the WAF is in detection mode: the match is logged and the request is forwarded. Detection mode is for tuning rules before blocking real traffic.');
  } else {
    add('waf', 'pass', config.traffic === 'http-flood'
      ? 'Each request on its own is harmless, so no managed rule matches. Pattern rules look at individual requests, not request rates.'
      : 'No managed rule matches this request.');
  }

  // 4. Rate-based rule
  if (config.traffic === 'http-flood') {
    if (config.rateLimit && config.wafMode !== 'off') {
      add('rate-limit', 'blocked', 'The rate-based rule counts requests per client IP over a time window. This client exceeds the threshold, so its further requests are blocked until its rate falls again; other customers are unaffected.');
      return finish('blocked', 'rate-limit', 'Application-layer floods are stopped by rate-based WAF rules (and bot controls), not by network-layer DDoS protection. On AWS, Shield Advanced can create such rules automatically when a web ACL is associated.');
    }
    add('rate-limit', config.rateLimit ? 'not-applicable' : 'pass', config.rateLimit
      ? 'Rate-based rules are part of the WAF policy, which is off — so the rule is not evaluated.'
      : 'No rate-based rule is configured, so the volume of requests from this client is not limited.');
    add('app', 'overloaded', 'Thousands of valid search requests reach the application and its database. Response times rise for every customer until capacity is exhausted.');
    return finish('degraded', null, 'An HTTP flood looks like normal traffic to every layer except one that counts requests. Without a rate-based rule, the application absorbs the whole flood.');
  }
  add('rate-limit', config.rateLimit && config.wafMode !== 'off' ? 'pass' : 'not-applicable', config.rateLimit && config.wafMode !== 'off' ? 'This client is well under the threshold.' : 'No rate-based rule is evaluated.');

  // 5. Application authorization
  if (config.traffic === 'unauthorized-admin') {
    if (config.appAuthz) {
      add('app-authz', 'blocked', 'The application checks the signed-in user’s permissions: a customer does not hold the refunds-approval permission, so it returns 403.');
      return finish('blocked', 'app-authz', 'Only the application knows who the user is and what they may do. Every edge control correctly forwarded this well-formed request; authorization had to happen in the application.');
    }
    add('app-authz', 'violation', 'The application checks only that the user is signed in, not what they are allowed to do.');
    add('app', 'violation', 'The refunds page is served to a customer: broken access control. No network or WAF control could catch this, because the request is perfectly legitimate in form.');
    return finish('access-violation', null, 'Edge controls filter malicious-looking traffic; they cannot enforce business permissions. That is the application’s job.');
  }
  add('app-authz', 'pass', 'The search page is public, so no special permission is needed.');

  if (config.traffic === 'sqli') {
    add('app', 'served', 'The malicious input reaches the application. Whether anything bad happens now depends entirely on the application code — with parameterized queries, the input is treated as text and the search simply returns no results.');
    return finish(config.wafMode === 'detection' ? 'logged-and-served' : 'served', null, config.wafMode === 'detection'
      ? 'Detection mode recorded the attack but let it through. Review the logs for false positives, then switch to prevention.'
      : 'With no WAF, the application is the only line of defense against this request.');
  }

  add('app', 'served', 'The application returns search results.');
  return finish('served', null, 'Legitimate traffic passes every layer. Tune WAF rules in detection mode first so that prevention mode does not block real customers (false positives).');
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readEdgeConfig(params: SimulationParams): EdgeConfig {
  return {
    traffic: pick(params.traffic, ['normal', 'sqli', 'malformed', 'volumetric', 'http-flood', 'unauthorized-admin'] as const, 'sqli'),
    ddosTier: pick(params.ddosTier, ['baseline', 'enhanced'] as const, 'baseline'),
    wafMode: pick(params.wafMode, ['off', 'detection', 'prevention'] as const, 'prevention'),
    rateLimit: params.rateLimit === true,
    appAuthz: params.appAuthz !== false,
  };
}

export const edgeProtectionSimulation: SimulationDefinition<EdgeState> = {
  id: 'waf-ddos-protection',
  title: 'WAF and DDoS Protection',
  description:
    'Sends one representative kind of traffic through network-layer DDoS mitigation, HTTP validation, WAF managed rules, a rate-based rule, and application authorization, and shows which layer handles it. A conceptual model — no traffic is generated and nothing is tested.',
  parameters: [
    {
      key: 'traffic',
      label: 'Traffic',
      type: 'select',
      default: 'sqli',
      options: [
        { label: 'Normal search request', value: 'normal' },
        { label: 'SQL injection pattern', value: 'sqli' },
        { label: 'Malformed HTTP request', value: 'malformed' },
        { label: 'Volumetric UDP flood', value: 'volumetric' },
        { label: 'HTTP request flood from one client', value: 'http-flood' },
        { label: 'Customer requests an admin page', value: 'unauthorized-admin' },
      ],
      description: 'The representative traffic to send.',
    },
    {
      key: 'ddosTier',
      label: 'DDoS protection',
      type: 'select',
      default: 'baseline',
      options: [
        { label: 'Baseline (included automatically)', value: 'baseline' },
        { label: 'Enhanced (paid tier)', value: 'enhanced' },
      ],
      description: 'Azure DDoS infrastructure protection or Shield Standard vs. Azure DDoS Network/IP Protection or Shield Advanced.',
    },
    {
      key: 'wafMode',
      label: 'WAF policy',
      type: 'select',
      default: 'prevention',
      options: [
        { label: 'Off', value: 'off' },
        { label: 'Detection mode (log only)', value: 'detection' },
        { label: 'Prevention mode (block)', value: 'prevention' },
      ],
      description: 'A WAF with a managed rule set on the gateway or CDN.',
    },
    { key: 'rateLimit', label: 'Rate-based rule in the WAF policy', type: 'boolean', default: false, description: 'Limits requests per client IP over a time window.' },
    { key: 'appAuthz', label: 'Application checks user permissions', type: 'boolean', default: true, description: 'The app verifies what the signed-in user may do, not only that they signed in.' },
  ],
  createInitialState: (params) => {
    const config = readEdgeConfig(params);
    return { config, request: requests[config.traffic], layers: [], outcome: null, blockedAt: null, summary: null };
  },
  steps: (params) => {
    const evaluation = evaluateEdge(readEdgeConfig(params));
    return evaluation.layers.map((layer, i) => {
      const isLast = i === evaluation.layers.length - 1;
      return {
        id: `edge-${i + 1}`,
        label: layer.title,
        description: layer.detail,
        apply: (state: EdgeState): EdgeState => ({
          ...state,
          layers: [...state.layers, layer],
          outcome: isLast ? evaluation.outcome : null,
          blockedAt: isLast ? evaluation.blockedAt : null,
          summary: isLast ? evaluation.summary : null,
        }),
      };
    });
  },
};
