// IPv4 and CIDR arithmetic on unsigned 32-bit integers. Parsing is strict:
// exactly four decimal octets 0–255 without leading zeros (some tools read
// "010" as octal), and a prefix length 0–32.

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface Cidr {
  /** The address exactly as written, which may have host bits set. */
  address: number;
  prefix: number;
}

export function parseIpv4(text: string): Result<number> {
  const trimmed = text.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 4) {
    return { ok: false, error: `“${trimmed}” is not an IPv4 address — it needs exactly four numbers separated by dots.` };
  }
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return { ok: false, error: `“${part}” is not a valid octet — each part must be a whole number from 0 to 255.` };
    }
    if (part.length > 1 && part.startsWith('0')) {
      return { ok: false, error: `Octet “${part}” has a leading zero, which some tools interpret as octal. Write it without leading zeros.` };
    }
    const octet = Number(part);
    if (octet > 255) return { ok: false, error: `Octet ${octet} is out of range — each octet must be 0–255.` };
    value = value * 256 + octet;
  }
  return { ok: true, value };
}

export function parseCidr(text: string): Result<Cidr> {
  const trimmed = text.trim();
  if (/\s/.test(trimmed)) {
    return { ok: false, error: `“${trimmed}” contains spaces — write CIDR notation without spaces, such as 10.0.0.0/16.` };
  }
  const pieces = trimmed.split('/');
  if (pieces.length !== 2) {
    return { ok: false, error: `“${trimmed}” is not CIDR notation — write an address, a slash, and a prefix length, such as 10.0.0.0/16.` };
  }
  const [addressText, prefixText] = pieces as [string, string];
  const address = parseIpv4(addressText);
  if (!address.ok) return address;
  if (!/^\d{1,2}$/.test(prefixText) || (prefixText.length > 1 && prefixText.startsWith('0'))) {
    return { ok: false, error: `“/${prefixText}” is not a valid prefix length — use a whole number from 0 to 32.` };
  }
  const prefix = Number(prefixText);
  if (prefix > 32) return { ok: false, error: `/${prefix} is out of range — an IPv4 prefix length is at most 32.` };
  return { ok: true, value: { address: address.value, prefix } };
}

export function formatIpv4(value: number): string {
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.');
}

export function toBinaryOctets(value: number): string {
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]
    .map((octet) => octet.toString(2).padStart(8, '0'))
    .join('.');
}

export function prefixToMask(prefix: number): number {
  // JavaScript shift counts are taken modulo 32, so /0 needs special handling.
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

export function networkAddress(cidr: Cidr): number {
  return (cidr.address & prefixToMask(cidr.prefix)) >>> 0;
}

export function lastAddress(cidr: Cidr): number {
  return (networkAddress(cidr) | ~prefixToMask(cidr.prefix)) >>> 0;
}

export function addressCount(prefix: number): number {
  return 2 ** (32 - prefix);
}

export function formatCidr(cidr: Cidr): string {
  return `${formatIpv4(cidr.address)}/${cidr.prefix}`;
}

export function containsAddress(cidr: Cidr, address: number): boolean {
  return address >= networkAddress(cidr) && address <= lastAddress(cidr);
}

export function cidrsOverlap(a: Cidr, b: Cidr): boolean {
  return networkAddress(a) <= lastAddress(b) && networkAddress(b) <= lastAddress(a);
}

/** Conventional (on-premises) usable host count: the network and broadcast
 *  addresses are excluded, except for /31 point-to-point links (RFC 3021)
 *  and /32 single-host routes. */
export function conventionalUsableHosts(prefix: number): number {
  if (prefix === 32) return 1;
  if (prefix === 31) return 2;
  return addressCount(prefix) - 2;
}

/** Azure and AWS both reserve five addresses in every subnet: the first
 *  four and the last. Returns null where the subnet is smaller than either
 *  provider allows (Azure's smallest subnet is /29, AWS's is /28). */
export function cloudUsableHosts(prefix: number): number | null {
  return prefix > 29 ? null : addressCount(prefix) - 5;
}

export type AddressRange = 'private' | 'shared' | 'loopback' | 'link-local' | 'public' | 'mixed';

const specialRanges: { label: AddressRange; cidr: Cidr }[] = [
  { label: 'private', cidr: { address: 10 * 2 ** 24, prefix: 8 } },
  { label: 'private', cidr: { address: (172 * 256 + 16) * 2 ** 16, prefix: 12 } },
  { label: 'private', cidr: { address: (192 * 256 + 168) * 2 ** 16, prefix: 16 } },
  { label: 'shared', cidr: { address: (100 * 256 + 64) * 2 ** 16, prefix: 10 } },
  { label: 'loopback', cidr: { address: 127 * 2 ** 24, prefix: 8 } },
  { label: 'link-local', cidr: { address: (169 * 256 + 254) * 2 ** 16, prefix: 16 } },
];

/** Classifies a block: 'private' = entirely within RFC 1918 space,
 *  'mixed' = partly inside a special range and partly outside it. */
export function classifyRange(cidr: Cidr): AddressRange {
  const start = networkAddress(cidr);
  const end = lastAddress(cidr);
  for (const range of specialRanges) {
    const rStart = networkAddress(range.cidr);
    const rEnd = lastAddress(range.cidr);
    if (start >= rStart && end <= rEnd) return range.label;
    if (start <= rEnd && rStart <= end) return 'mixed';
  }
  return 'public';
}

export function splitCidr(cidr: Cidr, newPrefix: number, limit = 8): Result<{ count: number; subnets: Cidr[] }> {
  if (!Number.isInteger(newPrefix) || newPrefix < cidr.prefix || newPrefix > 32) {
    return {
      ok: false,
      error: `A /${cidr.prefix} block can only be split into prefixes from /${cidr.prefix} to /32 — /${newPrefix} is outside that range.`,
    };
  }
  const count = 2 ** (newPrefix - cidr.prefix);
  const size = addressCount(newPrefix);
  const start = networkAddress(cidr);
  const subnets: Cidr[] = [];
  for (let i = 0; i < Math.min(count, limit); i += 1) {
    subnets.push({ address: start + i * size, prefix: newPrefix });
  }
  return { ok: true, value: { count, subnets } };
}

/** Longest prefix match: of the routes whose destination contains the
 *  address, the most specific one wins. */
export function longestPrefixMatch<T extends { destination: Cidr }>(routes: T[], address: number): T | null {
  let best: T | null = null;
  for (const route of routes) {
    if (containsAddress(route.destination, address) && (best === null || route.destination.prefix > best.destination.prefix)) {
      best = route;
    }
  }
  return best;
}
