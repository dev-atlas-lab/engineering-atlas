import type { ConceptContentModule, LessonBody } from '../../types';

const overlayVsRouting: LessonBody = {
  learningObjectives: ['Compare overlay and native-routing dataplanes'],
  sections: [
    {
      heading: 'The choice is "who routes the Pod packet"',
      blocks: [
        {
          type: 'paragraph',
          text: 'In an overlay dataplane, nodes route node-to-node and encapsulate Pod packets as payload. The underlay only ever sees node IPs. In a native-routing dataplane, the Pod packet itself travels; the underlay routers must know the Pod CIDRs.',
        },
        {
          type: 'comparisonTable',
          headers: ['Property', 'Overlay (VXLAN)', 'Native routing (BGP)'],
          rows: [
            ['Needs underlay BGP?', 'No', 'Yes (or static routes on routers)'],
            ['Overhead per packet', '~50 bytes (VXLAN/UDP/outer IP)', 'None'],
            ['Pod IPs visible to L3 switches', 'No', 'Yes'],
            ['Works on arbitrary cloud/underlay?', 'Yes', 'Only if BGP is permitted'],
            ['Crosses subnets cleanly?', 'Yes (overlay hides topology)', 'Yes, if routes are advertised'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The common rule: on bare-metal datacenters with controllable routers, native routing is faster and more visible. On public cloud VPCs or environments where BGP is not available, overlay is the default.',
        },
      ],
    },
  ],
};

const mtuAndPerformance: LessonBody = {
  learningObjectives: ['Explain MTU implications of overlay encapsulation'],
  sections: [
    {
      heading: 'Encapsulation eats MTU',
      blocks: [
        {
          type: 'paragraph',
          text: 'The underlay has an MTU — typically 1500 for Ethernet, 9000 on jumbo-frame enabled networks. Every encapsulation shaves bytes off the usable Pod MTU.',
        },
        {
          type: 'comparisonTable',
          headers: ['Encapsulation', 'Overhead', 'Pod MTU on a 1500 underlay'],
          rows: [
            ['None (native routing)', '0', '1500'],
            ['VXLAN', '50 bytes (outer IP 20 + UDP 8 + VXLAN 8 + inner MAC 14)', '1450'],
            ['Geneve', '~54 bytes (variable)', '1446'],
            ['IPsec', '~73 bytes', '1427'],
            ['VXLAN + IPsec', 'Both', '~1370'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'MTU mismatches cause "sometimes works" failures: small packets pass, large payloads hang. Set the Pod MTU explicitly in the CNI config (not left at 1500); monitor with `ip link show`. Enabling path-MTU discovery on the underlay helps, but a conservative Pod MTU is the more reliable fix.',
        },
      ],
    },
    {
      heading: 'Jumbo frames',
      blocks: [
        {
          type: 'paragraph',
          text: 'If your underlay supports MTU 9000, the overhead becomes negligible. This is the single largest Pod-network performance win on self-hosted clusters. Public clouds often default to 9001 on VPC traffic; verify both the VPC and the NICs.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'overlay-vs-routing': overlayVsRouting,
    'mtu-and-performance': mtuAndPerformance,
  },
  labs: {},
  simulations: {},
};
