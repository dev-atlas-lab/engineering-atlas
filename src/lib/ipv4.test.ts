import { describe, it, expect } from 'vitest';
import {
  addressCount,
  cidrsOverlap,
  classifyRange,
  cloudUsableHosts,
  conventionalUsableHosts,
  formatIpv4,
  lastAddress,
  longestPrefixMatch,
  networkAddress,
  parseCidr,
  parseIpv4,
  prefixToMask,
  splitCidr,
  toBinaryOctets,
  type Cidr,
} from './ipv4';

function cidr(text: string): Cidr {
  const result = parseCidr(text);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('parseIpv4', () => {
  it.each([
    ['0.0.0.0', 0],
    ['255.255.255.255', 4294967295],
    ['10.0.0.1', 167772161],
    ['192.168.1.1', 3232235777],
  ])('parses %s', (text, value) => {
    expect(parseIpv4(text)).toEqual({ ok: true, value });
  });

  it.each(['256.0.0.1', '10.0.0', '10.0.0.0.1', '10..0.1', '10.0.0.-1', '1e1.0.0.1', 'a.b.c.d', '', '10.0.0.1 x', '01.0.0.1', '10.0.0.010'])(
    'rejects %s',
    (text) => {
      expect(parseIpv4(text).ok).toBe(false);
    },
  );

  it('explains a leading-zero rejection', () => {
    const result = parseIpv4('10.0.0.010');
    expect(result.ok === false && result.error).toMatch(/leading zero/);
  });

  it('round-trips through formatIpv4', () => {
    for (const text of ['0.0.0.0', '172.16.254.1', '255.255.255.255']) {
      const parsed = parseIpv4(text);
      expect(parsed.ok && formatIpv4(parsed.value)).toBe(text);
    }
  });
});

describe('parseCidr', () => {
  it('accepts surrounding whitespace but not internal whitespace', () => {
    expect(parseCidr('  10.0.0.0/16 ').ok).toBe(true);
    expect(parseCidr('10.0.0.0 /16').ok).toBe(false);
    expect(parseCidr('10.0.0.0/ 16').ok).toBe(false);
    expect(parseCidr('10.0. 0.0/16').ok).toBe(false);
  });

  it.each(['10.0.0.0', '10.0.0.0/', '10.0.0.0/33', '10.0.0.0/-1', '10.0.0.0/08', '10.0.0.0/24/8', '/24', '10.0.0.0/1.5'])(
    'rejects %s',
    (text) => {
      expect(parseCidr(text).ok).toBe(false);
    },
  );

  it('accepts the prefix boundaries /0 and /32', () => {
    expect(parseCidr('0.0.0.0/0')).toEqual({ ok: true, value: { address: 0, prefix: 0 } });
    expect(parseCidr('10.1.2.3/32').ok).toBe(true);
  });
});

describe('masks and ranges', () => {
  it('builds masks at the edges without shift wrap-around', () => {
    expect(prefixToMask(0)).toBe(0);
    expect(formatIpv4(prefixToMask(8))).toBe('255.0.0.0');
    expect(formatIpv4(prefixToMask(20))).toBe('255.255.240.0');
    expect(formatIpv4(prefixToMask(32))).toBe('255.255.255.255');
  });

  it('computes network and last address for a /24', () => {
    const block = cidr('192.168.10.0/24');
    expect(formatIpv4(networkAddress(block))).toBe('192.168.10.0');
    expect(formatIpv4(lastAddress(block))).toBe('192.168.10.255');
  });

  it('clears host bits when the input address is not the network address', () => {
    const block = cidr('10.0.5.77/20');
    expect(formatIpv4(networkAddress(block))).toBe('10.0.0.0');
    expect(formatIpv4(lastAddress(block))).toBe('10.0.15.255');
  });

  it('handles the whole IPv4 space (/0)', () => {
    const block = cidr('0.0.0.0/0');
    expect(addressCount(0)).toBe(4294967296);
    expect(formatIpv4(lastAddress(block))).toBe('255.255.255.255');
  });

  it('handles single-address (/32) and point-to-point (/31) blocks', () => {
    expect(formatIpv4(lastAddress(cidr('10.0.0.7/32')))).toBe('10.0.0.7');
    expect(conventionalUsableHosts(32)).toBe(1);
    expect(conventionalUsableHosts(31)).toBe(2);
    expect(conventionalUsableHosts(24)).toBe(254);
  });

  it('shows binary octets for teaching the mask', () => {
    expect(toBinaryOctets(prefixToMask(26))).toBe('11111111.11111111.11111111.11000000');
  });
});

describe('cloud usable hosts', () => {
  it('subtracts the five addresses Azure and AWS reserve per subnet', () => {
    expect(cloudUsableHosts(24)).toBe(251);
    expect(cloudUsableHosts(28)).toBe(11);
    expect(cloudUsableHosts(29)).toBe(3);
    expect(cloudUsableHosts(16)).toBe(65531);
  });

  it('returns null for subnets smaller than either provider allows', () => {
    expect(cloudUsableHosts(30)).toBeNull();
    expect(cloudUsableHosts(32)).toBeNull();
  });
});

describe('classifyRange', () => {
  it.each([
    ['10.20.0.0/16', 'private'],
    ['172.16.0.0/12', 'private'],
    ['172.31.255.0/24', 'private'],
    ['192.168.0.0/16', 'private'],
    ['100.64.0.0/10', 'shared'],
    ['8.8.8.0/24', 'public'],
    ['172.32.0.0/16', 'public'],
    ['172.0.0.0/8', 'mixed'],
    ['0.0.0.0/0', 'mixed'],
  ])('%s is %s', (text, expected) => {
    expect(classifyRange(cidr(text))).toBe(expected);
  });
});

describe('splitCidr', () => {
  it('splits a /16 into 256 /24s and lists the first few in order', () => {
    const result = splitCidr(cidr('10.0.0.0/16'), 24, 3);
    expect(result.ok && result.value.count).toBe(256);
    expect(result.ok && result.value.subnets.map((s) => `${formatIpv4(s.address)}/${s.prefix}`)).toEqual([
      '10.0.0.0/24',
      '10.0.1.0/24',
      '10.0.2.0/24',
    ]);
  });

  it('splits from the network address even when the input has host bits set', () => {
    const result = splitCidr(cidr('10.0.0.200/24'), 26);
    expect(result.ok && result.value.subnets.map((s) => formatIpv4(s.address))).toEqual([
      '10.0.0.0',
      '10.0.0.64',
      '10.0.0.128',
      '10.0.0.192',
    ]);
  });

  it('allows splitting into the same prefix (one subnet)', () => {
    const result = splitCidr(cidr('10.0.0.0/24'), 24);
    expect(result.ok && result.value.count).toBe(1);
  });

  it('rejects a new prefix shorter than the original or longer than /32', () => {
    expect(splitCidr(cidr('10.0.0.0/24'), 16).ok).toBe(false);
    expect(splitCidr(cidr('10.0.0.0/24'), 33).ok).toBe(false);
  });
});

describe('cidrsOverlap', () => {
  it.each([
    ['10.0.0.0/16', '10.0.1.0/24', true],
    ['10.0.0.0/24', '10.0.1.0/24', false],
    ['10.0.0.0/23', '10.0.1.0/24', true],
    ['10.0.0.0/16', '10.1.0.0/16', false],
    ['0.0.0.0/0', '192.168.0.0/16', true],
    ['10.0.0.255/32', '10.0.0.0/24', true],
    ['10.0.1.0/32', '10.0.0.0/24', false],
  ])('%s vs %s → %s', (a, b, expected) => {
    expect(cidrsOverlap(cidr(a), cidr(b))).toBe(expected);
    expect(cidrsOverlap(cidr(b), cidr(a))).toBe(expected);
  });
});

describe('longestPrefixMatch', () => {
  const routes = [
    { destination: cidr('0.0.0.0/0'), target: 'internet' },
    { destination: cidr('10.0.0.0/16'), target: 'local' },
    { destination: cidr('10.0.2.0/24'), target: 'firewall' },
  ];

  it('chooses the most specific matching route', () => {
    const address = parseIpv4('10.0.2.9');
    expect(address.ok && longestPrefixMatch(routes, address.value)?.target).toBe('firewall');
  });

  it('falls back to less specific routes', () => {
    const local = parseIpv4('10.0.7.1');
    const internet = parseIpv4('198.51.100.7');
    expect(local.ok && longestPrefixMatch(routes, local.value)?.target).toBe('local');
    expect(internet.ok && longestPrefixMatch(routes, internet.value)?.target).toBe('internet');
  });

  it('returns null when no route matches', () => {
    const address = parseIpv4('198.51.100.7');
    expect(address.ok && longestPrefixMatch(routes.slice(1), address.value)).toBeNull();
  });
});
