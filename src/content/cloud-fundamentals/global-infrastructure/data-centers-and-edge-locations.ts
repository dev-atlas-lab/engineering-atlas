import type { ConceptMeta, Lesson } from '../../types';
import { edgeCacheScene, infrastructureHierarchyScene } from './scenes';

const insideADatacenter: Lesson = {
  id: 'inside-a-cloud-datacenter',
  title: 'Inside a Cloud Datacenter',
  kind: 'concept',
  learningObjectives: [
    'Describe the physical hierarchy from geography down to rack',
    'Explain why datacenters are designed around redundant power, cooling, and networking',
  ],
  analogy:
    'A datacenter is to a region what an engine room is to a ship: you never see it from your cabin, but every promise the ship makes — speed, heat, light — is kept by redundant machinery down there.',
  sections: [
    {
      heading: 'What a datacenter is',
      blocks: [
        {
          type: 'paragraph',
          text: 'A datacenter is a building engineered to keep thousands of servers powered, cooled, and connected. Servers sit in racks; racks sit in rows; each rack draws power through redundant power distribution and connects to a top-of-rack switch that uplinks into the datacenter fabric. Utility power is backed by uninterruptible power supplies (UPS) that bridge the seconds until on-site generators start.',
        },
        {
          type: 'paragraph',
          text: 'As a cloud customer you never choose a datacenter. You choose a region and, for zonal resources, a zone; the provider decides which building and which rack. The datacenter matters to you only through the failure boundaries it creates: a rack, a power distribution path, or a whole building can fail.',
        },
      ],
    },
    {
      heading: 'Redundancy at every layer',
      blocks: [
        {
          type: 'list',
          items: [
            'Power: multiple utility feeds where available, UPS, and generators, so a single power event does not drop the floor',
            'Cooling: redundant cooling units, because servers overheat within minutes without them',
            'Network: multiple uplinks and diverse fibre paths out of the building, so one cut cable does not isolate it',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Redundancy inside a building reduces the probability of failure; it never removes it. A fire, flood, or a fault in shared infrastructure can still take a building down — which is why zones exist above the datacenter level.',
        },
      ],
    },
    {
      heading: 'The hierarchy at a glance',
      blocks: [
        {
          type: 'paragraph',
          text: 'Select each level in the diagram below to see whether you control it directly. Notice that the edge network sits outside the region hierarchy entirely — it is the subject of the next lesson.',
        },
      ],
    },
  ],
  visualization: infrastructureHierarchyScene,
  knowledgeCheck: [
    {
      id: 'dc-kc-1',
      type: 'single-choice',
      prompt: 'Which placement decision do you, as a cloud customer, typically make directly?',
      difficulty: 'beginner',
      learningObjective: 'Describe the physical hierarchy from geography down to rack',
      options: [
        { id: 'a', label: 'The region and, for zonal resources, the availability zone', correct: true, explanation: 'Correct — datacenters and racks are chosen by the provider, though rack-level spreading can be requested through availability sets or placement groups.' },
        { id: 'b', label: 'The specific datacenter building', correct: false, explanation: 'Providers do not expose individual datacenters as a placement option.' },
        { id: 'c', label: 'The rack and host for each VM', correct: false, explanation: 'You can request spreading across racks, but you do not pick specific racks or hosts on shared infrastructure.' },
      ],
    },
  ],
};

const edgeLocations: Lesson = {
  id: 'edge-locations-and-points-of-presence',
  title: 'Edge Locations and Points of Presence',
  kind: 'concept',
  learningObjectives: [
    'Distinguish edge locations from regions',
    'Trace a cache miss and a cache hit through an edge location',
  ],
  sections: [
    {
      heading: 'Why edges exist',
      blocks: [
        {
          type: 'paragraph',
          text: 'A user far from a region pays a long network round trip on every request. Providers therefore operate many more small sites than regions: edge locations, also called points of presence (PoPs), placed close to large populations and well connected to local internet providers. Edge locations run a narrow set of services — content caching, DNS, TLS termination, and traffic security such as DDoS mitigation — rather than general-purpose compute and storage.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'Region', 'Edge location'],
          rows: [
            ['Number of sites', 'Tens', 'Hundreds'],
            ['Runs', 'Almost every service', 'Caching, DNS, TLS termination, traffic filtering'],
            ['You deploy to it directly', 'Yes', 'No — you configure a global service that uses it'],
            ['Holds your system of record', 'Yes', 'No — only cached or transient copies'],
          ],
        },
      ],
    },
    {
      heading: 'How caching at the edge works',
      blocks: [
        {
          type: 'paragraph',
          text: 'Step through the diagram: the first request for a file is a cache miss and travels all the way to the origin; the origin’s Cache-Control header tells the edge how long it may reuse the response; the next nearby request is served from the edge without touching the origin.',
        },
        {
          type: 'list',
          items: [
            'Cache hit ratio is the main lever: a rarely requested file gains little, because most requests are misses',
            'Personalised or private responses must not be shared through a cache — mark them private or no-store',
            'Changing a cached file requires waiting for expiry, invalidating the cache, or (more reliably) publishing it under a new versioned URL',
          ],
        },
      ],
    },
    {
      heading: 'Infrastructure extensions are not edge locations',
      blocks: [
        {
          type: 'paragraph',
          text: 'Providers also offer smaller compute sites closer to users — for example AWS Local Zones and Azure Extended Zones — that run a subset of compute and storage services attached to a parent region. These host your workloads; CDN edge locations do not. Do not confuse the two when someone says “run it at the edge.”',
        },
      ],
    },
  ],
  visualization: edgeCacheScene,
  knowledgeCheck: [
    {
      id: 'edge-kc-1',
      type: 'single-choice',
      prompt: 'A product page is personalised per user and sent with Cache-Control: private. What does a shared edge cache do with it?',
      difficulty: 'intermediate',
      learningObjective: 'Trace a cache miss and a cache hit through an edge location',
      options: [
        { id: 'a', label: 'It does not serve the response to other users from cache; requests go to the origin', correct: true, explanation: 'Correct — private responses are for the requesting user only. Caching them in a shared cache could leak one user’s data to another.' },
        { id: 'b', label: 'It caches the page and serves it to every user in the region', correct: false, explanation: 'That is exactly the leak that the private directive exists to prevent.' },
        { id: 'c', label: 'It rejects the request', correct: false, explanation: 'The request is still served — just not from a shared cached copy.' },
      ],
    },
    {
      id: 'edge-kc-2',
      type: 'multi-select',
      prompt: 'Which of these typically run at a CDN edge location? Select all that apply.',
      difficulty: 'beginner',
      learningObjective: 'Distinguish edge locations from regions',
      options: [
        { id: 'a', label: 'Caching of static content', correct: true, explanation: 'Correct — the core edge workload.' },
        { id: 'b', label: 'TLS termination close to the user', correct: true, explanation: 'Correct — terminating TLS nearby shortens the handshake round trips.' },
        { id: 'c', label: 'Your primary relational database', correct: false, explanation: 'Systems of record live in a region. The edge holds only cached or transient data.' },
        { id: 'd', label: 'DNS responses', correct: true, explanation: 'Correct — global DNS services answer queries from edge locations.' },
      ],
    },
  ],
};

const edgeComparison: Lesson = {
  id: 'edge-networks-comparison',
  title: 'Comparison: Azure and AWS Edge Networks',
  kind: 'comparison',
  learningObjectives: ['Map the edge concepts to the Azure and AWS services that use them'],
  sections: [
    {
      heading: 'Which services use the edge',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Capability', 'Azure', 'AWS'],
          rows: [
            ['Content delivery and edge caching', 'Azure Front Door (which includes CDN capabilities)', 'Amazon CloudFront'],
            ['Global DNS answered from the edge', 'Azure DNS', 'Amazon Route 53'],
            ['Compute sites closer to users, attached to a region', 'Azure Extended Zones', 'AWS Local Zones'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Both providers run a private global backbone between regions and edge locations, so traffic that enters at an edge location near the user travels most of its distance on the provider’s network rather than the public internet. The details — the number and placement of edge sites, tiered caching layers, and which features run at the edge — differ between providers and change over time, so check current documentation rather than relying on counts.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Global traffic routing and CDN configuration are covered in depth in the Load Balancing category (Global Traffic Distribution) and DNS in the Networking category. This lesson only establishes where these services physically run.',
        },
      ],
    },
  ],
  furtherReading: [
    { label: 'Azure Front Door overview', url: 'https://learn.microsoft.com/en-us/azure/frontdoor/front-door-overview' },
    { label: 'How CloudFront delivers content', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/HowCloudFrontWorks.html' },
  ],
};

export const dataCentersAndEdgeLocations: ConceptMeta = {
  id: 'data-centers-and-edge-locations',
  title: 'Data Centers and Edge Locations',
  description:
    'Physical data center design and the edge points of presence that cache content and route traffic close to users.',
  status: 'available',
  learningObjectives: [
    'Describe the physical hierarchy behind a cloud region and its failure boundaries',
    'Distinguish edge locations from regions and from infrastructure extensions',
    'Trace how an edge cache serves a miss and a hit',
  ],
  prerequisites: ['regions-and-availability-zones'],
  relatedConcepts: ['regions-and-availability-zones', 'dns-and-content-delivery', 'global-traffic-distribution'],
  estimatedMinutes: 40,
  lessons: [insideADatacenter, edgeLocations, edgeComparison],
};
