import { describe, it, expect } from 'vitest';
import { computeHistory } from '../../../engines/simulation/use-simulation';
import { cidrSubnetSimulation, evaluateCidrLab, type CidrLabState } from './cidr-simulation';
import {
  packetRoutingSimulation,
  readRoutingConfig,
  routeTableFor,
  traceRoute,
  type RoutingConfig,
  type RoutingState,
} from './routing-simulation';

describe('CIDR lab — evaluateCidrLab', () => {
  it('analyses a valid block, its split, and its overlap', () => {
    const result = evaluateCidrLab({ input: '10.0.0.0/16', newPrefix: 24, compare: '10.0.1.0/24' });
    expect(result.error).toBeNull();
    expect(result.analysis).toMatchObject({
      network: '10.0.0.0',
      last: '10.0.255.255',
      totalAddresses: 65536,
      cloudUsable: 65531,
      range: 'private',
      fitsAwsSubnet: true,
    });
    expect(result.split).toMatchObject({ count: 256, error: null });
    expect(result.overlap).toMatchObject({ overlaps: true, error: null });
  });

  it('normalises host bits and reports them', () => {
    const result = evaluateCidrLab({ input: '10.0.5.77/20', newPrefix: 24, compare: '10.1.0.0/16' });
    expect(result.analysis).toMatchObject({ normalized: '10.0.0.0/20', hostBitsSet: true, last: '10.0.15.255' });
    expect(result.overlap?.overlaps).toBe(false);
  });

  it('reports cloud subnet size limits', () => {
    const tiny = evaluateCidrLab({ input: '10.0.0.0/30', newPrefix: 30, compare: '10.0.0.0/30' }).analysis;
    expect(tiny).toMatchObject({ cloudUsable: null, fitsAzureSubnet: false, fitsAwsSubnet: false });
    const azureOnly = evaluateCidrLab({ input: '10.0.0.0/29', newPrefix: 29, compare: '10.0.0.0/29' }).analysis;
    expect(azureOnly).toMatchObject({ cloudUsable: 3, fitsAzureSubnet: true, fitsAwsSubnet: false });
  });

  it('rejects invalid input with an explanation instead of computing', () => {
    for (const input of ['10.0.0.256/24', '10.0.0.0/33', '10.0.0.010/24', 'not-an-ip', '']) {
      const result = evaluateCidrLab({ input, newPrefix: 24, compare: '10.0.0.0/24' });
      expect(result.error, input).not.toBeNull();
      expect(result.analysis).toBeNull();
    }
  });

  it('reports an invalid split prefix and an invalid comparison block without failing the whole analysis', () => {
    const result = evaluateCidrLab({ input: '10.0.0.0/24', newPrefix: 16, compare: '10.0.0/24' });
    expect(result.analysis).not.toBeNull();
    expect(result.split?.error).toMatch(/only be split/);
    expect(result.overlap?.error).not.toBeNull();
  });
});

describe('CIDR lab — simulation', () => {
  it('reveals one calculation per step', () => {
    const history = computeHistory(cidrSubnetSimulation, { cidr: '192.168.0.0/24', subnetPrefix: 26, compareCidr: '192.168.1.0/24' });
    expect(history.map((h) => (h.state as CidrLabState).stage)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(history[4]!.stepDescription).toMatch(/4 subnets of \/26/);
  });

  it('stops after the parse step for invalid input', () => {
    const history = computeHistory(cidrSubnetSimulation, { cidr: '300.0.0.0/8', subnetPrefix: 16, compareCidr: '10.0.0.0/8' });
    expect(history).toHaveLength(2);
    expect((history.at(-1)!.state as CidrLabState).error).toMatch(/out of range/);
  });

  it('is deterministic', () => {
    const params = { cidr: '10.0.0.0/16', subnetPrefix: 24, compareCidr: '10.0.1.0/24' };
    expect(computeHistory(cidrSubnetSimulation, params)).toEqual(computeHistory(cidrSubnetSimulation, params));
  });
});

describe('packet routing — traceRoute', () => {
  const base: RoutingConfig = { scenario: 'app-to-internet', privateDefaultRoute: 'none', webInboundHttps: true, appInboundFromWeb: true };

  it('drops private outbound traffic when the private subnet has no default route', () => {
    const trace = traceRoute(base);
    expect(trace.outcome).toBe('dropped');
    expect(trace.lookup?.matched).toBeNull();
    expect(trace.hops.at(-1)?.verdict).toBe('dropped');
  });

  it('delivers private outbound traffic through the NAT gateway once the route exists', () => {
    const trace = traceRoute({ ...base, privateDefaultRoute: 'nat' });
    expect(trace.outcome).toBe('delivered');
    expect(trace.lookup?.matched).toEqual({ destination: '0.0.0.0/0', target: 'NAT gateway' });
  });

  it('still drops unsolicited inbound traffic to the private VM even with NAT configured', () => {
    for (const privateDefaultRoute of ['none', 'nat'] as const) {
      const trace = traceRoute({ ...base, scenario: 'internet-to-app', privateDefaultRoute });
      expect(trace.outcome).toBe('dropped');
    }
  });

  it('uses longest prefix match to keep web → app traffic local despite the default route', () => {
    const trace = traceRoute({ ...base, scenario: 'web-to-app' });
    expect(trace.lookup?.matched).toEqual({ destination: '10.0.0.0/16', target: 'local' });
    expect(trace.outcome).toBe('delivered');
  });

  it('denies web → app when the app rule is removed, with the route unchanged', () => {
    const allowed = traceRoute({ ...base, scenario: 'web-to-app' });
    const denied = traceRoute({ ...base, scenario: 'web-to-app', appInboundFromWeb: false });
    expect(denied.lookup).toEqual(allowed.lookup);
    expect(denied.outcome).toBe('denied');
  });

  it('denies inbound HTTPS to the web VM when its rule is removed', () => {
    expect(traceRoute({ ...base, scenario: 'internet-to-web' }).outcome).toBe('delivered');
    expect(traceRoute({ ...base, scenario: 'internet-to-web', webInboundHttps: false }).outcome).toBe('denied');
  });

  it('sends public outbound traffic to the internet gateway', () => {
    const trace = traceRoute({ ...base, scenario: 'web-to-internet' });
    expect(trace.lookup?.matched?.target).toBe('internet gateway');
    expect(trace.outcome).toBe('delivered');
  });

  it('builds the private route table from the configuration', () => {
    expect(routeTableFor('private', base)).toHaveLength(1);
    expect(routeTableFor('private', { ...base, privateDefaultRoute: 'nat' })).toHaveLength(2);
  });
});

describe('packet routing — simulation', () => {
  it('reveals one hop per step and sets the outcome only at the end', () => {
    const history = computeHistory(packetRoutingSimulation, { scenario: 'web-to-app', privateDefaultRoute: 'none', webInboundHttps: true, appInboundFromWeb: true });
    const states = history.map((h) => h.state as RoutingState);
    expect(states.map((s) => s.hops.length)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(states.slice(0, -1).every((s) => s.outcome === null)).toBe(true);
    expect(states.at(-1)!.outcome).toBe('delivered');
  });

  it('defaults to the broken outbound scenario and treats unknown values safely', () => {
    expect(readRoutingConfig({})).toEqual({ scenario: 'app-to-internet', privateDefaultRoute: 'none', webInboundHttps: true, appInboundFromWeb: true });
    expect(readRoutingConfig({ scenario: 'bogus', privateDefaultRoute: 'bogus' }).scenario).toBe('app-to-internet');
  });

  it('is deterministic', () => {
    const params = { scenario: 'internet-to-web', privateDefaultRoute: 'nat', webInboundHttps: false, appInboundFromWeb: true };
    expect(computeHistory(packetRoutingSimulation, params)).toEqual(computeHistory(packetRoutingSimulation, params));
  });
});
