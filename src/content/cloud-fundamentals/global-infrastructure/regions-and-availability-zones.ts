import type { ConceptMeta, LabDefinition, Lesson } from '../../types';
import { regionZoneExplorerScene } from './scenes';
import { zoneFailureSimulation, type ZoneFailureState } from './simulations';

const regionsAndZonesExplained: Lesson = {
  id: 'regions-and-zones-explained',
  title: 'Regions and Availability Zones',
  kind: 'concept',
  learningObjectives: [
    'Describe the relationship between a region and its availability zones',
    'Explain what makes an availability zone an independent failure domain',
  ],
  analogy:
    'A region is a city; its availability zones are separate neighbourhoods, each on its own power substation and water main. A blackout in one neighbourhood leaves the others lit — but they are close enough that crossing between them takes minutes, not hours.',
  sections: [
    {
      heading: 'The problem zones solve',
      blocks: [
        {
          type: 'paragraph',
          text: 'Any single building can lose power, flood, or be cut off by a severed fibre line. If every copy of an application runs in one building, that one event is an outage. The obvious fix — put copies far apart — creates a new problem: the farther apart two copies are, the longer it takes them to agree on every write. Availability zones are the cloud’s answer to that tension: locations far enough apart to fail independently, close enough to replicate synchronously.',
        },
      ],
    },
    {
      heading: 'Region',
      blocks: [
        {
          type: 'paragraph',
          text: 'A region is a geographic area containing a provider’s datacenters, exposed to you under one name (for example, a region in Western Europe). When you create most resources you pick a region, and the resource lives there. Regions are deliberately isolated from one another: they have separate control plane endpoints for most services, and a failure in one region is designed not to spread to another.',
        },
      ],
    },
    {
      heading: 'Availability zone',
      blocks: [
        {
          type: 'paragraph',
          text: 'An availability zone (AZ) is one or more physically separate datacenters within a region, with its own power, cooling, and networking. The zones in a region are connected by a dedicated high-bandwidth, low-latency network — low enough that synchronously replicating a database between zones is practical. That combination is what makes zones useful: independent failure, shared latency budget.',
        },
        {
          type: 'list',
          items: [
            'Independent: a power, cooling, or network failure in one zone is designed not to affect the others',
            'Close: round-trip latency between zones is low enough for synchronous replication',
            'Not universal: whether a region has zones at all, and which services support them there, varies by provider and region',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Step through the explorer below and select components to see their scope. Watch what a single-zone failure does to zonal resources versus zone-redundant ones.',
        },
      ],
    },
  ],
  visualization: regionZoneExplorerScene,
  knowledgeCheck: [
    {
      id: 'rz-kc-1',
      type: 'single-choice',
      prompt: 'Why are availability zones within one region, rather than spread across distant regions, the default unit for high availability?',
      difficulty: 'intermediate',
      learningObjective: 'Explain what makes an availability zone an independent failure domain',
      options: [
        {
          id: 'a',
          label: 'Zones fail independently yet are close enough for synchronous replication without a large latency penalty',
          correct: true,
          explanation: 'Correct — that pairing is the whole point. Distant regions fail even more independently, but synchronous replication across them would add their round-trip time to every write.',
        },
        {
          id: 'b',
          label: 'Zones never fail, so placing resources in one is sufficient',
          correct: false,
          explanation: 'Zones are failure domains precisely because they can fail. One zone alone gives you no protection against its own failure.',
        },
        {
          id: 'c',
          label: 'Data cannot be copied between regions',
          correct: false,
          explanation: 'Cross-region replication is common — usually asynchronous, which is why it suits disaster recovery rather than everyday high availability.',
        },
      ],
    },
  ],
};

const resourceScopes: Lesson = {
  id: 'regional-zonal-and-global-resources',
  title: 'Regional, Zonal, and Global Resources',
  kind: 'concept',
  learningObjectives: [
    'Classify a cloud resource as zonal, zone-redundant, regional, or global',
    'Predict which resources a single-zone failure affects',
  ],
  sections: [
    {
      heading: 'Every resource has a scope',
      blocks: [
        {
          type: 'paragraph',
          text: 'The single most useful question to ask about any cloud resource is: where does it actually live? The answer determines which failures can take it down.',
        },
        {
          type: 'comparisonTable',
          headers: ['Scope', 'Lives in', 'Fails when', 'Typical examples'],
          rows: [
            ['Zonal', 'Exactly one zone', 'That zone fails', 'A virtual machine, a zonal managed disk'],
            ['Zone-redundant', 'Several zones, replicated', 'Multiple zones fail at once', 'Zone-redundant storage, zone-redundant load balancers and databases'],
            ['Regional', 'The region, placement chosen by the provider', 'The region fails (or, for non-zone-aware services, possibly a zone the provider placed it in)', 'Many managed services deployed without zone settings'],
            ['Global', 'Many regions or the edge network', 'Rarely — but a global control plane issue can affect everywhere', 'Identity services, global DNS'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: '“Regional” is not automatically “zone-redundant.” Some services place a regional resource in a single zone behind the scenes unless you explicitly request zone redundancy. Check each service’s documentation instead of assuming.',
        },
      ],
    },
    {
      heading: 'Zonal dependencies are the trap',
      blocks: [
        {
          type: 'paragraph',
          text: 'A zone-redundant front end does not make an application zone-resilient if anything it depends on is zonal. A web tier spread across three zones that writes to a database instance in Zone 1 fails whenever Zone 1 fails — the availability of a request path is limited by its least-redundant dependency.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'List every component a request touches: load balancer, compute, cache, database, storage, and any network appliance in the path',
            'Record each one’s scope',
            'Any zonal component with no counterpart in another zone is a single point of failure for that zone',
          ],
        },
      ],
    },
    {
      heading: 'The network scope differs by provider',
      blocks: [
        {
          type: 'paragraph',
          text: 'Even the network is scoped differently. In AWS, a VPC spans every zone in its region but each subnet lives in exactly one zone, so spreading across zones means creating a subnet per zone. In Azure, a virtual network and its subnets span the whole region; zonal placement is decided per resource (a VM, a public IP) rather than per subnet. The same architectural goal produces different-looking configurations.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'scope-kc-1',
      type: 'scenario',
      prompt:
        'A web tier runs on VMs in Zones 1, 2 and 3 behind a zone-redundant load balancer. Every VM reads sessions from a single cache instance in Zone 2. Zone 2 fails. What happens?',
      difficulty: 'intermediate',
      learningObjective: 'Predict which resources a single-zone failure affects',
      options: [
        {
          id: 'a',
          label: 'Requests fail or lose session state on every VM, because they all depend on a zonal cache in the failed zone',
          correct: true,
          explanation: 'Correct — the VMs in Zones 1 and 3 survive, but their shared dependency did not. The path is only as zone-resilient as its least-redundant component.',
        },
        {
          id: 'b',
          label: 'Nothing changes, because the load balancer is zone-redundant',
          correct: false,
          explanation: 'The load balancer can route around the Zone 2 VM, but it cannot make the Zone 2 cache reachable again.',
        },
        {
          id: 'c',
          label: 'Only the Zone 2 VM is affected',
          correct: false,
          explanation: 'That would be true only if the VMs had no zonal dependency in Zone 2.',
        },
      ],
    },
  ],
};

const faultDomains: Lesson = {
  id: 'fault-domains-and-failure-isolation',
  title: 'Fault Domains and Failure Isolation',
  kind: 'concept',
  learningObjectives: [
    'Explain fault domains and update domains as failure boundaries smaller than a zone',
    'Choose the failure boundary that matches a workload’s resilience goal',
  ],
  sections: [
    {
      heading: 'Failures come in sizes',
      blocks: [
        {
          type: 'paragraph',
          text: 'Not every failure is a zone outage. A single host can crash, a rack can lose its power distribution unit or top-of-rack switch, and planned maintenance can reboot hosts on a schedule. Each of these is a smaller failure domain nested inside a zone, and each has a matching placement control.',
        },
        {
          type: 'comparisonTable',
          headers: ['Failure boundary', 'What fails together', 'Placement control'],
          rows: [
            ['Host', 'VMs on one physical server', 'Spread VMs across hosts (the platform usually does this for groups you declare)'],
            ['Fault domain (rack)', 'Hosts sharing power and a network switch', 'Azure availability sets; AWS spread placement groups'],
            ['Update domain', 'Hosts rebooted together during planned platform maintenance', 'Azure availability sets'],
            ['Zone', 'All datacenters in that zone', 'Deploy across zones'],
            ['Region', 'The whole region', 'Deploy across regions (see Geographic Redundancy)'],
          ],
        },
      ],
    },
    {
      heading: 'Choosing the boundary',
      blocks: [
        {
          type: 'paragraph',
          text: 'Rack-level spreading protects against the most frequent hardware faults at no latency cost and is available even in regions without zones. Zone-level spreading protects against much larger, rarer events, at the cost of a little cross-zone latency and, with some providers, cross-zone data transfer charges. Where zones are available, deploying across them generally subsumes rack-level spreading, because zones are themselves physically separate.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Correlated failure is the enemy. Two copies on the same rack are two copies of one failure. The goal of every placement control in the table above is to make copies fail independently.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'fd-kc-1',
      type: 'single-choice',
      prompt: 'A region does not support availability zones. What is the strongest in-region protection for two VMs running the same role?',
      difficulty: 'intermediate',
      learningObjective: 'Choose the failure boundary that matches a workload’s resilience goal',
      options: [
        {
          id: 'a',
          label: 'Place them in separate fault domains (racks) so a single rack failure cannot take both down',
          correct: true,
          explanation: 'Correct — rack-level spreading is the largest independent failure boundary available inside a region without zones.',
        },
        {
          id: 'b',
          label: 'Place both on the largest available VM size',
          correct: false,
          explanation: 'VM size changes capacity, not failure independence.',
        },
        {
          id: 'c',
          label: 'Nothing can be done without zones',
          correct: false,
          explanation: 'Fault-domain spreading still protects against the most common hardware failures.',
        },
      ],
    },
  ],
};

const choosingRegions: Lesson = {
  id: 'choosing-regions-and-zones',
  title: 'Choosing Regions and Zones',
  kind: 'concept',
  learningObjectives: ['Weigh the factors that drive region selection for a workload'],
  sections: [
    {
      heading: 'Region selection is a multi-factor decision',
      blocks: [
        {
          type: 'list',
          items: [
            'Latency: users far from a region pay the round trip on every request — the speed of light in fibre is a hard floor',
            'Data residency and regulation: some data must be stored within a particular country or jurisdiction',
            'Service and capacity availability: not every service, feature, or VM size exists in every region; newer capabilities often launch in a subset first',
            'Zone support: high availability within the region requires a region with zones and services that support them there',
            'Price: the same resource can cost different amounts in different regions',
            'Disaster recovery partner: if you plan a second region, which one, and is it in the same jurisdiction?',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Check availability before designing around it. A design that assumes three zones, a specific GPU size, and a particular managed service may be impossible in the region your compliance team requires.',
        },
      ],
    },
    {
      heading: 'Zone selection',
      blocks: [
        {
          type: 'paragraph',
          text: 'Within a region, the usual pattern is to spread replicas evenly across zones rather than choosing a “best” zone. Zone names are not portable identifiers: both AWS and Azure map the zone names you see to physical zones independently for each account or subscription, so “Zone 1” in one subscription is not necessarily the same building as “Zone 1” in another. When two accounts must align on physical zones, use the provider’s mechanism for that (AWS AZ IDs; Azure’s logical-to-physical zone mapping APIs).',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'choose-kc-1',
      type: 'single-choice',
      prompt: 'Two teams in different AWS accounts both deploy to “us-east-1a” and assume they share a physical zone. What is the risk?',
      difficulty: 'advanced',
      learningObjective: 'Weigh the factors that drive region selection for a workload',
      options: [
        {
          id: 'a',
          label: 'AZ names are mapped to physical zones per account, so they may be in different physical zones; AZ IDs are the cross-account identifier',
          correct: true,
          explanation: 'Correct. Azure similarly maps logical zone numbers to physical zones per subscription.',
        },
        {
          id: 'b',
          label: 'None — AZ names always refer to the same physical location for every customer',
          correct: false,
          explanation: 'This assumption is exactly what per-account mapping exists to break: it spreads customers across physical zones.',
        },
        {
          id: 'c',
          label: 'The deployment fails because two accounts cannot use the same AZ name',
          correct: false,
          explanation: 'Every account can use every AZ name in a region; the names just do not map identically.',
        },
      ],
    },
  ],
};

const azureRegionsAndZones: Lesson = {
  id: 'azure-regions-and-availability-zones',
  title: 'Azure Regions and Availability Zones',
  kind: 'provider',
  providerId: 'azure',
  learningObjectives: ['Map Azure’s regions, availability zones, and availability sets onto the general model'],
  sections: [
    {
      heading: 'How Azure exposes zones',
      blocks: [
        {
          type: 'paragraph',
          text: 'Not every Azure region supports availability zones. In regions that do, there are at least three zones, numbered 1–3 per subscription. Azure describes resources as zonal (pinned to a zone you choose), zone-redundant (replicated across zones by the platform), or nonzonal (no zone guarantee). Which of those a service offers — and in which regions — is documented per service.',
        },
        {
          type: 'paragraph',
          text: 'Availability sets are the older, rack-level mechanism: VMs in a set are spread across fault domains (shared power and network) and update domains (planned maintenance groups) within a datacenter. Microsoft recommends availability zones where the region supports them; availability sets remain the option where it does not.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure regions and availability zones',
    keyFeatures: [
      'Zonal, zone-redundant, and nonzonal resource deployment models',
      'Availability sets for fault-domain and update-domain spreading',
      'Virtual networks and subnets span all zones in a region',
      'Per-subscription logical-to-physical zone mapping',
    ],
    terminology: {
      'Availability zone': 'Availability zone',
      'Rack-level spreading': 'Availability set (fault domains)',
      'Maintenance grouping': 'Update domain',
      'Replicated across zones': 'Zone-redundant',
    },
    architecturalNotes: [
      'Zone support is per region and per service — not every region has zones, and not every service supports zone redundancy in every zone-enabled region',
      'Subnets are not zonal; zone placement is chosen on individual resources such as VMs and public IPs',
    ],
    limitations: ['A resource deployed as nonzonal has no zone placement guarantee, even in a zone-enabled region'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview',
  },
};

const awsRegionsAndZones: Lesson = {
  id: 'aws-regions-and-availability-zones',
  title: 'AWS Regions and Availability Zones',
  kind: 'provider',
  providerId: 'aws',
  learningObjectives: ['Map AWS’s Regions, Availability Zones, and AZ IDs onto the general model'],
  sections: [
    {
      heading: 'How AWS exposes zones',
      blocks: [
        {
          type: 'paragraph',
          text: 'AWS designs each Region with a minimum of three physically separate Availability Zones, though a small number of accounts see fewer zones in specific Regions. Many core resources are explicitly AZ-scoped: an EC2 instance, an EBS volume, and a VPC subnet each live in exactly one AZ. Others are Regional, such as an S3 bucket, and some are global, such as IAM.',
        },
        {
          type: 'paragraph',
          text: 'AZ names like “us-east-1a” are mapped to physical zones independently per account. AZ IDs (for example “use1-az1”) identify the same physical zone in every account and are what you use to align placement across accounts.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS Regions and Availability Zones',
    keyFeatures: [
      'A minimum of three Availability Zones per Region by design',
      'AZ-scoped subnets, instances, and EBS volumes',
      'AZ IDs for consistent cross-account zone identification',
      'Spread placement groups for rack-level separation',
    ],
    terminology: {
      'Availability zone': 'Availability Zone (AZ)',
      'Rack-level spreading': 'Spread placement group',
      'Cross-account zone identifier': 'AZ ID',
    },
    architecturalNotes: [
      'Subnets are zonal — a multi-AZ design needs at least one subnet per AZ',
      'Because AZ names are shuffled per account, AZ IDs — not names — are the stable reference across accounts',
    ],
    limitations: ['Some newer or smaller Regions may expose fewer AZs to a given account'],
    documentationUrl: 'https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/regions.html',
  },
};

const regionsComparison: Lesson = {
  id: 'regions-and-zones-comparison',
  title: 'Comparison: Azure vs. AWS Zones',
  kind: 'comparison',
  learningObjectives: ['Compare how Azure and AWS scope networks and resources to zones without treating them as identical'],
  sections: [
    {
      heading: 'Same idea, different boundaries',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Dimension', 'Azure', 'AWS'],
          rows: [
            ['Zones per region', 'At least three in zone-enabled regions; not all regions have zones', 'At least three per Region by design, with a few account-level exceptions'],
            ['Subnet scope', 'Regional — spans all zones', 'Zonal — one subnet per AZ'],
            ['Zone naming', 'Logical numbers 1–3, mapped per subscription', 'AZ names mapped per account; AZ IDs are stable'],
            ['Rack-level control', 'Availability sets (fault and update domains)', 'Spread placement groups'],
            ['Service-managed redundancy', 'Often an explicit “zone-redundant” option per service', 'Often built in (for example S3) or a Multi-AZ option per service'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Translating a design between providers is not a rename. A three-subnet AWS VPC (one per AZ) may become a single Azure subnet with zone-pinned VMs. Map the failure boundaries, not the resource names.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'rz-compare-kc-1',
      type: 'single-choice',
      prompt: 'You are porting an AWS design with one subnet per AZ to Azure. What is the most accurate translation?',
      difficulty: 'advanced',
      learningObjective: 'Compare how Azure and AWS scope networks and resources to zones without treating them as identical',
      options: [
        {
          id: 'a',
          label: 'Azure subnets span all zones, so zone spreading is achieved by pinning resources to zones — one subnet per zone is not required',
          correct: true,
          explanation: 'Correct. You may still choose separate subnets for other reasons (segmentation), but not to achieve zone spreading.',
        },
        {
          id: 'b',
          label: 'Create one Azure subnet per zone, because Azure subnets are zonal',
          correct: false,
          explanation: 'Azure subnets are regional, not zonal — this assumes AWS’s model applies.',
        },
        {
          id: 'c',
          label: 'Azure does not support zone spreading',
          correct: false,
          explanation: 'It does, in zone-enabled regions, by placing resources in specific zones or choosing zone-redundant options.',
        },
      ],
    },
  ],
  furtherReading: [
    { label: 'Comparing AWS and Azure regions and zones', url: 'https://learn.microsoft.com/en-us/azure/architecture/aws-professional/regions-zones' },
  ],
};

const zoneFailureLab: LabDefinition = {
  id: 'zone-failure-simulation-lab',
  title: 'Survive a Zone Failure',
  type: 'simulation',
  difficulty: 'intermediate',
  estimatedTime: '15 minutes',
  description:
    'Place a web tier and a database across a region’s zones, fail a zone, and find a configuration that stays available — including when the zone holding the database primary goes down.',
  learningObjectives: [
    'Identify the zonal single points of failure in a two-tier application',
    'Configure placement that survives the loss of any single zone',
  ],
  prerequisites: [
    { type: 'concept', id: 'regional-zonal-and-global-resources', label: 'Regional, Zonal, and Global Resources', description: 'Know what zonal and zone-redundant mean.' },
  ],
  content: {
    simulationId: zoneFailureSimulation.id,
    instructions: [
      { id: 'baseline', label: 'Run the default', description: 'Step through the default configuration (everything in Zone 1, Zone 2 failing). Note that the service survives — because the failure hit a zone it did not use.' },
      { id: 'break', label: 'Fail the right zone', description: 'Set “Zone to fail” to Zone 1 and replay. Identify which tier fails first and why.' },
      { id: 'fix', label: 'Make it resilient', description: 'Change the placement and database settings until the service stays available with Zone 1 failed. Then confirm it also survives Zones 2 and 3.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'tested-hardest-zone',
        label: 'Tested a failure of Zone 1 (where the database primary lives)',
        check: (state) => (state as ZoneFailureState).testedZone === 1,
      },
      {
        id: 'web-spread',
        label: 'Web VMs run in at least two zones',
        check: (state) =>
          new Set((state as ZoneFailureState).resources.filter((r) => r.tier === 'web').map((r) => r.zone)).size >= 2,
      },
      {
        id: 'service-available',
        label: 'Service remains available after the zone failure',
        check: (state) => (state as ZoneFailureState).verdict?.available === true,
      },
    ],
  },
};

export const regionsAndAvailabilityZones: ConceptMeta = {
  id: 'regions-and-availability-zones',
  title: 'Regions and Availability Zones',
  description:
    'Geographic regions and isolated data center groups that provide fault isolation and low-latency access, including fault domains, update domains, and the distinction between regional and zonal resources.',
  status: 'available',
  learningObjectives: [
    'Explain how regions and availability zones form nested, independent failure domains',
    'Classify resources as zonal, zone-redundant, regional, or global and predict the impact of a zone failure',
    'Choose regions and zones based on latency, residency, availability, and resilience requirements',
    'Compare how Azure and AWS scope networks and resources to zones',
  ],
  prerequisites: [],
  relatedConcepts: ['data-centers-and-edge-locations', 'geographic-redundancy-and-data-residency', 'high-availability', 'virtual-machines'],
  estimatedMinutes: 80,
  lessons: [
    regionsAndZonesExplained,
    resourceScopes,
    faultDomains,
    choosingRegions,
    azureRegionsAndZones,
    awsRegionsAndZones,
    regionsComparison,
  ],
  labs: [zoneFailureLab],
};
