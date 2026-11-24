import type { SimulationDefinition, SimulationParams } from '../../../engines/simulation/types';
import {
  addressCount,
  cidrsOverlap,
  classifyRange,
  cloudUsableHosts,
  conventionalUsableHosts,
  formatCidr,
  formatIpv4,
  lastAddress,
  networkAddress,
  parseCidr,
  prefixToMask,
  splitCidr,
  toBinaryOctets,
  type AddressRange,
  type Cidr,
} from '../../../lib/ipv4';

export interface CidrAnalysis {
  normalized: string;
  hostBitsSet: boolean;
  addressBinary: string;
  mask: string;
  maskBinary: string;
  network: string;
  last: string;
  totalAddresses: number;
  conventionalUsable: number;
  cloudUsable: number | null;
  cloudFirstUsable: string | null;
  cloudLastUsable: string | null;
  range: AddressRange;
  fitsAzureSubnet: boolean;
  fitsAwsSubnet: boolean;
}

export interface CidrLabState {
  input: string;
  /** How many calculation stages have been revealed (0–5). */
  stage: number;
  error: string | null;
  analysis: CidrAnalysis | null;
  split: { newPrefix: number; count: number; subnets: string[]; error: string | null } | null;
  overlap: { compare: string; overlaps: boolean | null; error: string | null } | null;
}

export function analyzeCidr(cidr: Cidr): CidrAnalysis {
  const network = networkAddress(cidr);
  const last = lastAddress(cidr);
  const cloudUsable = cloudUsableHosts(cidr.prefix);
  return {
    normalized: formatCidr({ address: network, prefix: cidr.prefix }),
    hostBitsSet: network !== cidr.address,
    addressBinary: toBinaryOctets(cidr.address),
    mask: formatIpv4(prefixToMask(cidr.prefix)),
    maskBinary: toBinaryOctets(prefixToMask(cidr.prefix)),
    network: formatIpv4(network),
    last: formatIpv4(last),
    totalAddresses: addressCount(cidr.prefix),
    conventionalUsable: conventionalUsableHosts(cidr.prefix),
    cloudUsable,
    cloudFirstUsable: cloudUsable === null ? null : formatIpv4(network + 4),
    cloudLastUsable: cloudUsable === null ? null : formatIpv4(last - 1),
    range: classifyRange(cidr),
    fitsAzureSubnet: cidr.prefix <= 29,
    fitsAwsSubnet: cidr.prefix >= 16 && cidr.prefix <= 28,
  };
}

interface CidrConfig {
  input: string;
  newPrefix: number;
  compare: string;
}

function readConfig(params: SimulationParams): CidrConfig {
  return {
    input: String(params.cidr ?? ''),
    newPrefix: Number(params.subnetPrefix),
    compare: String(params.compareCidr ?? ''),
  };
}

export function evaluateCidrLab(config: CidrConfig): Omit<CidrLabState, 'stage'> {
  const parsed = parseCidr(config.input);
  if (!parsed.ok) {
    return { input: config.input, error: parsed.error, analysis: null, split: null, overlap: null };
  }
  const cidr = parsed.value;
  const split = splitCidr(cidr, config.newPrefix);
  const compare = parseCidr(config.compare);
  return {
    input: config.input,
    error: null,
    analysis: analyzeCidr(cidr),
    split: split.ok
      ? { newPrefix: config.newPrefix, count: split.value.count, subnets: split.value.subnets.map(formatCidr), error: null }
      : { newPrefix: config.newPrefix, count: 0, subnets: [], error: split.error },
    overlap: compare.ok
      ? { compare: formatCidr({ address: networkAddress(compare.value), prefix: compare.value.prefix }), overlaps: cidrsOverlap(cidr, compare.value), error: null }
      : { compare: config.compare, overlaps: null, error: compare.error },
  };
}

const rangeExplanation: Record<AddressRange, string> = {
  private: 'It lies entirely within RFC 1918 private address space, the normal choice for virtual networks.',
  shared: 'It lies within 100.64.0.0/10, shared address space reserved for carrier-grade NAT — avoid it for virtual networks unless you know why you need it.',
  loopback: 'It is loopback space (127.0.0.0/8) and cannot be used for a network.',
  'link-local': 'It is link-local space (169.254.0.0/16), which cloud platforms use for internal services — do not use it for a network.',
  public: 'It is public address space. Using public ranges privately makes those real internet addresses unreachable from inside your network.',
  mixed: 'It spans both special-purpose and public address space — almost certainly not what you want for a network.',
};

export const cidrSubnetSimulation: SimulationDefinition<CidrLabState> = {
  id: 'cidr-subnet-calculator',
  title: 'CIDR and Subnet Calculator',
  description:
    'Parses an IPv4 CIDR block and works through its network address, range, capacity, subnetting, and overlap with another block, one calculation at a time.',
  parameters: [
    {
      key: 'cidr',
      label: 'CIDR block',
      type: 'text',
      default: '10.0.0.0/16',
      description: 'An IPv4 address and prefix length, for example 10.0.0.0/16.',
    },
    {
      key: 'subnetPrefix',
      label: 'Split into subnets of prefix length',
      type: 'number',
      default: 24,
      min: 0,
      max: 32,
      description: 'The prefix length of each subnet when dividing the block.',
    },
    {
      key: 'compareCidr',
      label: 'Check overlap with',
      type: 'text',
      default: '10.0.1.0/24',
      description: 'Another block, for example a network you plan to peer with.',
    },
  ],
  createInitialState: (params) => ({ ...evaluateCidrLab(readConfig(params)), stage: 0 }),
  steps: (params) => {
    const config = readConfig(params);
    const result = evaluateCidrLab(config);
    const a = result.analysis;
    const stage = (n: number) => (state: CidrLabState) => ({ ...state, stage: n });

    if (!a) {
      return [
        {
          id: 'parse',
          label: 'Parse the input',
          description: `The input cannot be used: ${result.error} Correct it in the parameters to continue.`,
          apply: stage(1),
        },
      ];
    }

    const prefix = Number(a.normalized.split('/')[1]);
    return [
      {
        id: 'parse',
        label: 'Parse the input',
        description: `“${config.input.trim()}” is a valid IPv4 CIDR block: a 32-bit address and a /${prefix} prefix, meaning the first ${prefix} bits identify the network and the remaining ${32 - prefix} identify hosts within it.`,
        apply: stage(1),
      },
      {
        id: 'mask',
        label: 'Apply the mask',
        description: `The /${prefix} mask is ${a.mask}. A bitwise AND of the address with the mask clears the host bits, giving the network address ${a.network}.${
          a.hostBitsSet ? ` The input had host bits set, so the block is really ${a.normalized} — always write the network address.` : ''
        }`,
        apply: stage(2),
      },
      {
        id: 'range',
        label: 'Range and capacity',
        description: `Setting every host bit gives the last address, ${a.last}, for 2^${32 - prefix} = ${a.totalAddresses.toLocaleString('en-US')} addresses. ${
          a.cloudUsable === null
            ? 'This block is smaller than the smallest subnet Azure (/29) or AWS (/28) allows.'
            : `Azure and AWS reserve the first four and the last address of every subnet, leaving ${a.cloudUsable.toLocaleString('en-US')} assignable, versus ${a.conventionalUsable.toLocaleString('en-US')} on a conventional network.`
        } ${rangeExplanation[a.range]}`,
        apply: stage(3),
      },
      {
        id: 'split',
        label: 'Split into subnets',
        description: result.split?.error
          ? result.split.error
          : `Borrowing ${(result.split?.newPrefix ?? prefix) - prefix} more bits for the network yields 2^${(result.split?.newPrefix ?? prefix) - prefix} = ${result.split?.count.toLocaleString('en-US')} subnets of /${result.split?.newPrefix}, each starting where the previous one ends.`,
        apply: stage(4),
      },
      {
        id: 'overlap',
        label: 'Check for overlap',
        description: result.overlap?.error
          ? `The comparison block cannot be used: ${result.overlap.error}`
          : result.overlap?.overlaps
            ? `${a.normalized} and ${result.overlap.compare} overlap: some addresses belong to both. Two networks with overlapping ranges cannot be peered or routed to each other without NAT, because a destination address would be ambiguous.`
            : `${a.normalized} and ${result.overlap?.compare} do not overlap — they could be peered or connected without address conflicts.`,
        apply: stage(5),
      },
    ];
  },
};
