import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';
import { containsAddress, formatCidr, longestPrefixMatch, parseCidr, parseIpv4, type Cidr } from '../../../lib/ipv4';

export type RoutingScenario = 'web-to-internet' | 'app-to-internet' | 'internet-to-web' | 'internet-to-app' | 'web-to-app';
export type HopStage = 'source' | 'subnet' | 'route-table' | 'next-hop' | 'destination';
export type HopVerdict = 'pass' | 'allowed' | 'denied' | 'dropped' | 'delivered';

export interface Hop {
  stage: HopStage;
  label: string;
  detail: string;
  verdict: HopVerdict;
}

export interface Route {
  destination: Cidr;
  target: string;
}

export interface RouteTableLookup {
  table: string;
  routes: { destination: string; target: string }[];
  destinationAddress: string;
  matched: { destination: string; target: string } | null;
}

export interface RoutingState {
  scenario: RoutingScenario;
  hops: Hop[];
  lookup: RouteTableLookup | null;
  outcome: 'delivered' | 'denied' | 'dropped' | null;
}

export interface RoutingConfig {
  scenario: RoutingScenario;
  privateDefaultRoute: 'nat' | 'none';
  webInboundHttps: boolean;
  appInboundFromWeb: boolean;
}

// Addresses come from the documentation ranges (RFC 5737) so nothing here
// points at a real host.
export const topology = {
  vnet: '10.0.0.0/16',
  publicSubnet: '10.0.1.0/24',
  privateSubnet: '10.0.2.0/24',
  webPrivateIp: '10.0.1.10',
  webPublicIp: '203.0.113.10',
  appPrivateIp: '10.0.2.20',
  natPublicIp: '203.0.113.50',
  internetHost: '198.51.100.7',
} as const;

function cidr(text: string): Cidr {
  const parsed = parseCidr(text);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

function ip(text: string): number {
  const parsed = parseIpv4(text);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

export function routeTableFor(subnet: 'public' | 'private', config: RoutingConfig): Route[] {
  const routes: Route[] = [{ destination: cidr(topology.vnet), target: 'local' }];
  if (subnet === 'public') routes.push({ destination: cidr('0.0.0.0/0'), target: 'internet gateway' });
  if (subnet === 'private' && config.privateDefaultRoute === 'nat') {
    routes.push({ destination: cidr('0.0.0.0/0'), target: 'NAT gateway' });
  }
  return routes;
}

function lookup(table: string, routes: Route[], destination: string): RouteTableLookup {
  const match = longestPrefixMatch(routes, ip(destination));
  return {
    table,
    routes: routes.map((r) => ({ destination: formatCidr(r.destination), target: r.target })),
    destinationAddress: destination,
    matched: match ? { destination: formatCidr(match.destination), target: match.target } : null,
  };
}

function explainMatch(l: RouteTableLookup): string {
  if (!l.matched) {
    return `No route in the ${l.table} contains ${l.destinationAddress}, so the packet has nowhere to go and is dropped.`;
  }
  const candidates = l.routes.filter((r) => containsAddress(cidr(r.destination), ip(l.destinationAddress)));
  const ruleText =
    candidates.length > 1
      ? `${candidates.map((c) => c.destination).join(' and ')} both contain ${l.destinationAddress}; the longest prefix, ${l.matched.destination}, wins.`
      : `${l.matched.destination} is the only route containing ${l.destinationAddress}.`;
  return `${ruleText} Next hop: ${l.matched.target}.`;
}

/** Traces one packet through the example network. Pure and deterministic:
 *  the single source of every hop, verdict, and explanation. */
export function traceRoute(config: RoutingConfig): Omit<RoutingState, 'scenario'> {
  const hops: Hop[] = [];
  const t = topology;

  const outbound = (fromSubnet: 'public' | 'private', sourceLabel: string, sourceIp: string, destination: string) => {
    hops.push({
      stage: 'source',
      label: `${sourceLabel} sends a packet`,
      detail: `Source ${sourceIp} in the ${fromSubnet} subnet (${fromSubnet === 'public' ? t.publicSubnet : t.privateSubnet}), destination ${destination}.`,
      verdict: 'pass',
    });
    hops.push({
      stage: 'subnet',
      label: 'Outbound security rules',
      detail: 'Outbound traffic is allowed by the default rules. Security rules here are stateful, so replies to this connection will be allowed back in automatically.',
      verdict: 'allowed',
    });
    const l = lookup(`${fromSubnet} subnet route table`, routeTableFor(fromSubnet, config), destination);
    hops.push({ stage: 'route-table', label: `Route lookup: ${l.table}`, detail: explainMatch(l), verdict: l.matched ? 'pass' : 'dropped' });
    return l;
  };

  switch (config.scenario) {
    case 'web-to-internet': {
      const l = outbound('public', 'Web VM', t.webPrivateIp, t.internetHost);
      hops.push({
        stage: 'next-hop',
        label: 'Internet gateway',
        detail: `The internet gateway translates the private source ${t.webPrivateIp} to the VM’s public IP ${t.webPublicIp} and sends the packet to the internet.`,
        verdict: 'pass',
      });
      hops.push({ stage: 'destination', label: 'Internet host', detail: `${t.internetHost} receives the packet; its reply is translated back on the way in.`, verdict: 'delivered' });
      return { hops, lookup: l, outcome: 'delivered' };
    }
    case 'app-to-internet': {
      const l = outbound('private', 'App VM', t.appPrivateIp, t.internetHost);
      if (!l.matched) return { hops, lookup: l, outcome: 'dropped' };
      hops.push({
        stage: 'next-hop',
        label: 'NAT gateway',
        detail: `The NAT gateway replaces the source ${t.appPrivateIp} with its own public IP ${t.natPublicIp} and remembers the mapping so replies can be returned. The app VM itself still has no public IP.`,
        verdict: 'pass',
      });
      hops.push({ stage: 'destination', label: 'Internet host', detail: `${t.internetHost} sees the connection coming from ${t.natPublicIp}.`, verdict: 'delivered' });
      return { hops, lookup: l, outcome: 'delivered' };
    }
    case 'internet-to-web': {
      hops.push({ stage: 'source', label: 'Internet host sends a packet', detail: `Source ${t.internetHost}, destination ${t.webPublicIp}:443 (the web VM’s public IP).`, verdict: 'pass' });
      hops.push({
        stage: 'next-hop',
        label: 'Internet gateway',
        detail: `The internet gateway maps the public IP ${t.webPublicIp} to the VM’s private IP ${t.webPrivateIp} and forwards the packet into the network.`,
        verdict: 'pass',
      });
      const l = lookup('public subnet route table', routeTableFor('public', config), t.webPrivateIp);
      hops.push({ stage: 'route-table', label: 'Delivery inside the network', detail: explainMatch(l), verdict: 'pass' });
      const allowed = config.webInboundHttps;
      hops.push({
        stage: 'subnet',
        label: 'Inbound security rule on the web VM',
        detail: allowed
          ? 'A rule allows TCP 443 from the internet, so the packet is accepted.'
          : 'No rule allows TCP 443 from the internet. Inbound traffic is denied by default, so the packet is discarded.',
        verdict: allowed ? 'allowed' : 'denied',
      });
      if (!allowed) return { hops, lookup: l, outcome: 'denied' };
      hops.push({ stage: 'destination', label: 'Web VM', detail: `The web server at ${t.webPrivateIp} receives the request.`, verdict: 'delivered' });
      return { hops, lookup: l, outcome: 'delivered' };
    }
    case 'internet-to-app': {
      hops.push({ stage: 'source', label: 'Internet host tries to reach the app VM', detail: `Source ${t.internetHost}, destination ${t.appPrivateIp}.`, verdict: 'pass' });
      hops.push({
        stage: 'next-hop',
        label: 'No path in',
        detail: `${t.appPrivateIp} is a private (RFC 1918) address, which internet routers do not route, and the app VM has no public IP mapped to it. ${
          config.privateDefaultRoute === 'nat'
            ? 'The NAT gateway does not help: it only translates replies to connections the app VM started, never new inbound connections.'
            : ''
        }`.trim(),
        verdict: 'dropped',
      });
      return { hops, lookup: null, outcome: 'dropped' };
    }
    case 'web-to-app': {
      const l = outbound('public', 'Web VM', t.webPrivateIp, t.appPrivateIp);
      const allowed = config.appInboundFromWeb;
      hops.push({
        stage: 'subnet',
        label: 'Inbound security rule on the app VM',
        detail: allowed
          ? `A rule allows TCP 8080 from the public subnet ${t.publicSubnet}, so the packet is accepted.`
          : 'No rule allows this traffic. Being inside the same virtual network does not grant access on its own, so the packet is denied.',
        verdict: allowed ? 'allowed' : 'denied',
      });
      if (!allowed) return { hops, lookup: l, outcome: 'denied' };
      hops.push({ stage: 'destination', label: 'App VM', detail: `The application at ${t.appPrivateIp}:8080 receives the request.`, verdict: 'delivered' });
      return { hops, lookup: l, outcome: 'delivered' };
    }
  }
}

const scenarios: RoutingScenario[] = ['web-to-internet', 'app-to-internet', 'internet-to-web', 'internet-to-app', 'web-to-app'];

export function readRoutingConfig(params: SimulationParams): RoutingConfig {
  const scenario = String(params.scenario) as RoutingScenario;
  return {
    scenario: scenarios.includes(scenario) ? scenario : 'app-to-internet',
    privateDefaultRoute: params.privateDefaultRoute === 'nat' ? 'nat' : 'none',
    webInboundHttps: params.webInboundHttps !== false,
    appInboundFromWeb: params.appInboundFromWeb !== false,
  };
}

export const packetRoutingSimulation: SimulationDefinition<RoutingState> = {
  id: 'packet-routing',
  title: 'Packet Routing',
  description:
    'Sends one packet through a virtual network with a public subnet, a private subnet, an internet gateway, and an optional NAT gateway, and explains every decision on the way. Simulated — no network is created.',
  parameters: [
    {
      key: 'scenario',
      label: 'Packet to send',
      type: 'select',
      default: 'app-to-internet',
      options: [
        { label: 'App VM (private) → internet', value: 'app-to-internet' },
        { label: 'Web VM (public) → internet', value: 'web-to-internet' },
        { label: 'Internet → web VM on port 443', value: 'internet-to-web' },
        { label: 'Internet → app VM', value: 'internet-to-app' },
        { label: 'Web VM → app VM on port 8080', value: 'web-to-app' },
      ],
      description: 'Which source and destination to trace.',
    },
    {
      key: 'privateDefaultRoute',
      label: 'Private subnet default route (0.0.0.0/0)',
      type: 'select',
      default: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'NAT gateway', value: 'nat' },
      ],
      description: 'Where the private subnet sends traffic for addresses outside the network.',
    },
    {
      key: 'webInboundHttps',
      label: 'Web VM allows inbound HTTPS from the internet',
      type: 'boolean',
      default: true,
      description: 'Security rule: allow TCP 443 from any internet address to the web VM.',
    },
    {
      key: 'appInboundFromWeb',
      label: 'App VM allows TCP 8080 from the public subnet',
      type: 'boolean',
      default: true,
      description: 'Security rule: allow the web tier to call the app tier.',
    },
  ],
  createInitialState: (params) => ({ scenario: readRoutingConfig(params).scenario, hops: [], lookup: null, outcome: null }),
  steps: (params) => {
    const config = readRoutingConfig(params);
    const trace = traceRoute(config);
    return trace.hops.map((hop, i) => {
      const isLast = i === trace.hops.length - 1;
      return {
        id: `hop-${i + 1}`,
        label: hop.label,
        description: hop.detail,
        apply: (state: RoutingState): RoutingState => ({
          ...state,
          hops: [...state.hops, hop],
          lookup: hop.stage === 'route-table' ? trace.lookup : state.lookup,
          outcome: isLast ? trace.outcome : null,
        }),
      };
    });
  },
};
