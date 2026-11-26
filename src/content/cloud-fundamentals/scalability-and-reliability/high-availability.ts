import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { haArchitectureScene } from './high-availability.scenes';

const eliminatingSpof: LessonBody = {
  learningObjectives: [
    'Identify single points of failure on the critical path',
    'Explain redundancy, fault domains, and blast radius',
    'Use availability zones and multi-zone deployment to isolate failures',
  ],
  analogy:
    'A chain is exactly as strong as its weakest link. High availability is finding every single link on the critical path and making sure none of them can break the chain alone.',
  sections: [
    {
      heading: 'Single points of failure',
      blocks: [
        {
          type: 'paragraph',
          text: 'A single point of failure (SPOF) is any component on the critical path whose failure takes the whole service down. A load-balanced web tier with one database behind it has a redundant front and a SPOF behind — the database. Finding SPOFs means tracing every request and asking, at each hop, “what if this one thing fails?”',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Redundancy on the obvious tier is not enough. Teams load-balance the web tier and forget the database, the cache, the NAT gateway, the single shared certificate, or the one region. Availability is set by the weakest link, not the strongest.',
        },
      ],
    },
    {
      heading: 'Redundancy, fault domains, and blast radius',
      blocks: [
        {
          type: 'list',
          items: [
            'Redundancy: more than one of each component on the critical path, so one failure removes capacity, not the service.',
            'Fault domain: a boundary that shares a failure cause — a server, a rack, a zone, a region. The goal is to place redundant copies in different fault domains so one event cannot take them all.',
            'Blast radius: how much a single failure can affect. Good design keeps the blast radius small — a bad deploy or a zone outage should degrade a slice, not everything.',
          ],
        },
      ],
    },
    {
      heading: 'Availability zones',
      blocks: [
        {
          type: 'paragraph',
          text: 'An availability zone is an isolated datacenter (or group) within a region, with independent power, cooling, and network, so a zone failure is independent of its neighbours. Spreading redundant instances across zones — a multi-zone deployment — survives a zone outage. The diagram shows a two-zone design: redundant web instances, a zone-redundant load balancer, and a database with a synchronous standby in the second zone. No single zone failure takes it down.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Multi-zone handles the common case (a datacenter-level failure) within one region. Surviving the loss of an entire region needs multi-region design, covered next — and it is a bigger step, because data must be replicated across a long distance.',
        },
      ],
    },
  ],
  visualization: haArchitectureScene,
  knowledgeCheck: [
    {
      id: 'ha-spof-1',
      type: 'scenario',
      prompt: 'A web tier runs two instances behind a load balancer; both connect to one database in one zone. Where is the single point of failure?',
      difficulty: 'beginner',
      learningObjective: 'Identify single points of failure on the critical path',
      options: [
        { id: 'a', label: 'The database — it has no redundancy, so its failure takes the whole application down despite the redundant web tier', correct: true, explanation: 'Correct — redundancy must cover every tier on the critical path.' },
        { id: 'b', label: 'There is none — the web tier is load balanced', correct: false, explanation: 'The single database is still a SPOF.' },
        { id: 'c', label: 'The load balancer, always', correct: false, explanation: 'Managed load balancers are themselves redundant; the un-replicated database is the exposed SPOF here.' },
      ],
    },
    {
      id: 'ha-spof-2',
      type: 'single-choice',
      prompt: 'Why place redundant instances in different availability zones rather than just on different servers in one datacenter?',
      difficulty: 'intermediate',
      learningObjective: 'Explain redundancy, fault domains, and blast radius',
      options: [
        { id: 'a', label: 'Zones are independent fault domains (power, cooling, network), so a datacenter-level failure does not take all copies at once', correct: true, explanation: 'Correct — different fault domains are what make redundancy survive a shared-cause failure.' },
        { id: 'b', label: 'Zones are faster', correct: false, explanation: 'Zones are about failure isolation, not raw speed; cross-zone adds a little latency.' },
        { id: 'c', label: 'It is cheaper', correct: false, explanation: 'Multi-zone is about resilience, not cost reduction.' },
      ],
    },
  ],
};

const failoverAndArchitectures: LessonBody = {
  learningObjectives: [
    'Distinguish active-active from active-passive and load balancing from failover',
    'Explain RTO and RPO and graceful degradation',
    'Explain why high availability does not guarantee zero downtime',
  ],
  sections: [
    {
      heading: 'Active-active and active-passive',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'Active-active', 'Active-passive'],
          rows: [
            ['Who serves', 'All replicas/regions at once', 'One serves; another stands by'],
            ['On failure', 'Lose only the failed node’s share', 'Promote the standby (a failover step)'],
            ['Capacity use', 'All capacity is working', 'Standby capacity is idle until needed'],
            ['Hard part', 'Consistency across active nodes (especially writes)', 'Failover must be fast and actually tested'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Load balancing and failover are related but different. Load balancing spreads traffic across healthy peers that are all active. Failover switches to a standby when the active one fails. Active-active uses load balancing; active-passive uses failover. Many systems combine them: load-balanced active nodes within a region, failover to a standby region.',
        },
      ],
    },
    {
      heading: 'RTO, RPO, and graceful degradation',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Objective', 'Question', 'Driven by'],
          rows: [
            ['RTO (Recovery Time Objective)', 'How long can recovery take?', 'Failover speed, automation, health detection'],
            ['RPO (Recovery Point Objective)', 'How much recent data can we lose?', 'Replication: synchronous (near-zero RPO) vs asynchronous (some loss)'],
          ],
        },
        {
          type: 'paragraph',
          text: 'These targets drive the architecture. A near-zero RPO needs synchronous replication, which costs latency and usually limits distance; an asynchronous replica is cheaper and works across regions but can lose the last few seconds of writes on failover. Graceful degradation is the fallback when full service cannot be maintained: shed load, serve read-only or cached data, disable non-essential features — stay partly up rather than fully down.',
        },
      ],
    },
    {
      heading: 'High availability is not zero downtime',
      blocks: [
        {
          type: 'list',
          items: [
            'Failover takes time: the system must detect the failure, decide to fail over, promote a standby, and let clients reconnect — each step adds to the RTO.',
            'Detection is imperfect: too sensitive and it fails over on a blip; too slow and users feel the outage longer.',
            'Correlated failures defeat redundancy: a bad deployment, an expired certificate, or a misconfiguration can break all replicas at once — redundancy only helps against independent failures.',
            'The data layer is the hard part: stateless tiers fail over easily; databases and their consistency and RPO are where most of the real work is.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'An untested failover is a hope, not a control. Availability comes from redundancy that is regularly exercised — game days, failover drills — not from a standby nobody has ever switched to.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'ha-fo-1',
      type: 'scenario',
      prompt: 'A database replicates asynchronously to a standby region. The primary region fails and you promote the standby. What is the likely consequence?',
      difficulty: 'advanced',
      learningObjective: 'Explain RTO and RPO and graceful degradation',
      options: [
        { id: 'a', label: 'The last few seconds of writes that had not yet replicated are lost — a non-zero RPO', correct: true, explanation: 'Correct — asynchronous replication trades some potential data loss for lower latency and cross-region reach.' },
        { id: 'b', label: 'No data is ever lost with any replication', correct: false, explanation: 'Only synchronous replication gives near-zero RPO, at a latency and distance cost.' },
        { id: 'c', label: 'The standby cannot be promoted', correct: false, explanation: 'It can be promoted; the issue is unreplicated recent writes.' },
      ],
    },
    {
      id: 'ha-fo-2',
      type: 'single-choice',
      prompt: 'Why can a multi-zone, multi-region deployment still have an outage?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why high availability does not guarantee zero downtime',
      options: [
        { id: 'a', label: 'Redundancy only protects against independent failures; a bad deploy or misconfiguration can break all replicas at once, and failover itself takes time', correct: true, explanation: 'Correct — correlated failures and failover delay are the limits of redundancy.' },
        { id: 'b', label: 'It cannot — multi-region means zero downtime', correct: false, explanation: 'No design guarantees zero downtime.' },
        { id: 'c', label: 'Only if the load balancer is misconfigured', correct: false, explanation: 'Many causes exist: correlated failures, detection lag, data-layer issues.' },
      ],
    },
  ],
};

const azureHighAvailability: LessonBody = {
  learningObjectives: ['Describe Azure availability zones, zone-redundant services, and cross-region options'],
  sections: [
    {
      heading: 'Zones, zone-redundancy, and regions',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure regions that support availability zones offer independent zones for failure isolation. You achieve high availability by spreading resources across zones: Virtual Machine Scale Sets across zones, zone-redundant Standard Load Balancer and Application Gateway, and zone-redundant storage and databases. Within a single datacenter, availability sets spread VMs across fault and update domains. For region-level resilience, Azure offers cross-region options — paired or flexible region replication for data, and global services such as Front Door or Traffic Manager to route across regions.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Zone-redundant managed services place their own redundant instances across zones for you. Confirm each service and SKU actually supports zone redundancy — it is a property of the service and tier, not automatic everywhere.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure high availability',
    keyFeatures: [
      'Availability zones for intra-region failure isolation',
      'Zone-redundant Load Balancer, Application Gateway, storage, and databases',
      'Availability sets (fault and update domains) within a datacenter',
      'Cross-region replication and global routing (Front Door, Traffic Manager) for regional resilience',
    ],
    terminology: {
      'Failure-isolated datacenter group': 'Availability zone',
      'Spread within a datacenter': 'Availability set (fault/update domains)',
      'Zone-spanning managed service': 'Zone-redundant service',
      'Cross-region resilience': 'Region pairs / multi-region + global routing',
    },
    architecturalNotes: [
      'Multi-zone handles datacenter-level failures within a region.',
      'Zone redundancy is a per-service, per-SKU property.',
      'Regional resilience adds cross-region data replication and global routing.',
    ],
    limitations: ['Not all services/SKUs support zone redundancy.', 'Cross-region adds replication lag and cost.'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview',
  },
  knowledgeCheck: [
    {
      id: 'ha-az-1',
      type: 'single-choice',
      prompt: 'To survive a datacenter-level failure within an Azure region, what is the primary approach?',
      difficulty: 'beginner',
      learningObjective: 'Describe Azure availability zones, zone-redundant services, and cross-region options',
      options: [
        { id: 'a', label: 'Spread resources across availability zones (and use zone-redundant services)', correct: true, explanation: 'Correct — zones are independent fault domains within a region.' },
        { id: 'b', label: 'Run everything in one zone with bigger VMs', correct: false, explanation: 'That concentrates the failure domain.' },
        { id: 'c', label: 'Use DNS caching', correct: false, explanation: 'DNS caching does not provide zone redundancy.' },
      ],
    },
  ],
  furtherReading: [{ label: 'Azure availability zones overview', url: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview' }],
};

const awsHighAvailability: LessonBody = {
  learningObjectives: ['Describe AWS Multi-AZ and multi-region high availability patterns'],
  sections: [
    {
      heading: 'Multi-AZ and multi-region',
      blocks: [
        {
          type: 'paragraph',
          text: 'AWS Regions contain multiple Availability Zones. The standard high-availability pattern is Multi-AZ: run instances in an Auto Scaling group across several AZs, front them with an Elastic Load Balancer that spans those AZs, and use a Multi-AZ database (a synchronous standby in another AZ that is promoted on failure). This survives an AZ outage automatically. For region-level resilience, replicate data across regions and route with Route 53 or Global Accelerator — a bigger step with cross-region replication to manage.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS high availability',
    keyFeatures: [
      'Multi-AZ: Auto Scaling group across AZs behind an ELB',
      'Multi-AZ databases with synchronous standby and automatic failover',
      'Elastic Load Balancing spanning AZs',
      'Multi-region replication with Route 53 or Global Accelerator routing',
    ],
    terminology: {
      'Failure-isolated datacenter group': 'Availability Zone',
      'Spread compute across AZs': 'Auto Scaling group across subnets/AZs',
      'Database with standby': 'Multi-AZ database deployment',
      'Cross-region resilience': 'Multi-region + Route 53 / Global Accelerator',
    },
    architecturalNotes: [
      'Multi-AZ is the default resilience pattern within a region.',
      'Multi-AZ databases fail over to a synchronous standby automatically.',
      'Multi-region adds asynchronous cross-region replication and global routing.',
    ],
    limitations: ['Multi-region failover is bounded by replication lag (RPO) and routing/detection time (RTO).'],
    documentationUrl: 'https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/availability-zones.html',
  },
  knowledgeCheck: [
    {
      id: 'ha-aws-1',
      type: 'single-choice',
      prompt: 'What does an AWS Multi-AZ database deployment provide?',
      difficulty: 'beginner',
      learningObjective: 'Describe AWS Multi-AZ and multi-region high availability patterns',
      options: [
        { id: 'a', label: 'A synchronous standby in another AZ that is promoted automatically if the primary’s AZ fails', correct: true, explanation: 'Correct — it survives an AZ-level failure with automatic failover.' },
        { id: 'b', label: 'A read cache in the same AZ', correct: false, explanation: 'That describes a cache, not Multi-AZ failover.' },
        { id: 'c', label: 'Automatic multi-region replication', correct: false, explanation: 'Multi-AZ is within one region; cross-region is a separate configuration.' },
      ],
    },
  ],
  furtherReading: [{ label: 'AWS Availability Zones (fault isolation)', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/availability-zones.html' }],
};

const comparison: LessonBody = {
  learningObjectives: ['Compare Azure and AWS high availability building blocks'],
  sections: [
    {
      heading: 'Side by side',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Need', 'Azure', 'AWS'],
          rows: [
            ['Failure-isolated datacenter', 'Availability zone', 'Availability Zone'],
            ['Spread compute', 'Scale set across zones; availability set within a datacenter', 'Auto Scaling group across AZs'],
            ['Zone-redundant load balancing', 'Zone-redundant Standard Load Balancer / Application Gateway', 'ELB spanning AZs'],
            ['Database with standby', 'Zone-redundant / failover database options', 'Multi-AZ database'],
            ['Regional resilience', 'Multi-region + Front Door / Traffic Manager', 'Multi-region + Route 53 / Global Accelerator'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The patterns are nearly identical in shape: spread redundant tiers across zones, add a database standby, and route across regions for the biggest failures. The services differ in name and in exactly which SKUs are zone-redundant — always verify per service.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'ha-cmp-1',
      type: 'single-choice',
      prompt: 'Which pairing is correct for a database with an automatically promoted standby in another zone?',
      difficulty: 'beginner',
      learningObjective: 'Compare Azure and AWS high availability building blocks',
      options: [
        { id: 'a', label: 'Azure zone-redundant/failover database ↔ AWS Multi-AZ database', correct: true, explanation: 'Correct — both place a standby in another zone with failover.' },
        { id: 'b', label: 'Azure availability set ↔ AWS Route 53', correct: false, explanation: 'Those are unrelated (intra-datacenter spread vs DNS).' },
        { id: 'c', label: 'Azure Front Door ↔ AWS Multi-AZ database', correct: false, explanation: 'Front Door is a global router, not a database.' },
      ],
    },
  ],
};

const haChallenge: LabBody = {
  difficulty: 'advanced',
  estimatedTime: '30 minutes',
  description:
    'Review a fragile single-zone application and choose how to make it highly available across compute, data, network, zones, scaling, and operations. Every option has authored feedback; only a few exact combinations have an authored overall verdict, and the lab says so when yours does not. Nothing is deployed — this is a design exercise.',
  learningObjectives: [
    'Find single points of failure across every tier, not just the obvious one',
    'Choose redundancy, failover, and multi-zone controls that work together',
    'Recognise measures that look like high availability but do not remove the SPOF',
  ],
  prerequisites: [
    { type: 'concept', id: 'eliminating-single-points-of-failure', label: 'Eliminating Single Points of Failure', description: 'SPOFs, redundancy, fault domains, and zones.' },
    { type: 'concept', id: 'failover-and-architectures', label: 'Failover and Availability Architectures', description: 'Active-active vs active-passive, RTO/RPO.' },
  ],
  content: {
    scenario:
      'A booking service runs on a single large VM in one availability zone. It serves web traffic, holds user sessions in memory, and connects to one database on another single VM in the same zone. Uploaded documents are written to that VM’s local disk. A single public IP points straight at the web VM. There is no load balancer, no auto-scaling, and no health checking; deploys are done by restarting the VM. The business needs the service to survive a single datacenter (zone) failure and a traffic spike during sales, with minimal data loss.',
    requirements: [
      'Survive the loss of a single availability zone without a full outage',
      'Handle a sudden traffic spike',
      'Keep recent data loss small on failover',
    ],
    constraints: [
      'A small team; prefer managed services over bespoke machinery',
      'The service must stay reachable from the internet',
      'Avoid unnecessary cost — do not add capacity that addresses no listed risk',
    ],
    decisions: [
      {
        id: 'compute',
        question: 'Compute tier',
        type: 'multi-choice',
        options: [
          { id: 'c-asg', label: 'Run the web tier as an auto-scaling group across two zones behind a load balancer', description: 'Redundant, zone-spread, elastic compute.', feedback: { rating: 'effective', text: 'Removes the web-tier SPOF, spreads across zones, and handles the spike. The foundation of the design.' } },
          { id: 'c-stateless', label: 'Move session state out of instance memory into a shared store', description: 'So any instance can serve any request.', feedback: { rating: 'effective', text: 'Required before the web tier can scale horizontally — otherwise users break when routed to another instance.' } },
          { id: 'c-bigger', label: 'Replace the VM with a much larger one', description: 'Scale up instead.', feedback: { rating: 'ineffective', text: 'A bigger single VM is still a single point of failure in one zone and still a hard capacity ceiling.' } },
          { id: 'c-second-ip', label: 'Add a second public IP to the same VM', description: 'For redundancy.', feedback: { rating: 'ineffective', text: 'Two IPs on one VM do not help — the VM (and its zone) is still the single failure domain.' } },
        ],
      },
      {
        id: 'data',
        question: 'Data tier',
        type: 'multi-choice',
        options: [
          { id: 'd-multiaz', label: 'Use a managed database with a synchronous standby in a second zone', description: 'Automatic failover, near-zero RPO within the region.', feedback: { rating: 'effective', text: 'Removes the database SPOF and keeps data loss minimal on a zone failure — exactly the requirement.' } },
          { id: 'd-objectstore', label: 'Store uploaded documents in object storage instead of a VM’s local disk', description: 'Shared, durable, multi-replica storage.', feedback: { rating: 'effective', text: 'Local disk is lost with the VM and is not shared across instances; object storage is durable and reachable from any instance.' } },
          { id: 'd-backups-only', label: 'Rely on nightly backups of the single database', description: 'Restore if it fails.', feedback: { rating: 'partial', text: 'Backups are essential, but restoring loses up to a day of data (poor RPO) and takes time (poor RTO). They complement, not replace, a standby.' } },
          { id: 'd-cache-as-db', label: 'Put all data in an in-memory cache for speed', description: 'Drop the database.', feedback: { rating: 'ineffective', text: 'A cache is not a durable system of record; losing the node loses the data.' } },
        ],
      },
      {
        id: 'network',
        question: 'Entry point and health',
        type: 'multi-choice',
        options: [
          { id: 'n-lb-health', label: 'Put a zone-redundant load balancer in front with health checks', description: 'One endpoint; route around unhealthy instances and zones.', feedback: { rating: 'effective', text: 'Gives a stable entry point, removes failed instances automatically, and survives a single zone.' } },
          { id: 'n-drain', label: 'Enable connection draining for deploys', description: 'Finish in-flight requests before removing an instance.', feedback: { rating: 'effective', text: 'Enables graceful rolling deploys instead of restarting the one VM and dropping every request.' } },
          { id: 'n-dns-rr', label: 'Use DNS round robin across two VM IPs instead of a load balancer', description: 'Cheaper than a load balancer.', feedback: { rating: 'partial', text: 'It spreads traffic, but DNS has no fast health checking: clients keep hitting a dead VM until caches expire. A health-checking load balancer is far better here.' } },
        ],
      },
      {
        id: 'ops',
        question: 'Operations and regional resilience',
        type: 'multi-choice',
        options: [
          { id: 'o-test-failover', label: 'Regularly test zone failover (game days)', description: 'Exercise the failover path on purpose.', feedback: { rating: 'effective', text: 'An untested failover is a hope, not a control. Drills are what make redundancy actually work when it matters.' } },
          { id: 'o-multiregion', label: 'Add a second region with cross-region replication now', description: 'Guard against a whole-region outage.', feedback: { rating: 'partial', text: 'Legitimate for region-level resilience, but the stated requirement is surviving a zone failure. Multi-region adds real cost and complexity beyond this requirement — a deliberate future step, not needed to meet the brief.' } },
          { id: 'o-nothing', label: 'Document a manual rebuild runbook and leave the architecture as is', description: 'Rebuild by hand if it fails.', feedback: { rating: 'ineffective', text: 'A manual rebuild means a long outage and likely data loss — it meets none of the requirements.' } },
        ],
      },
    ],
    solutions: [
      {
        id: 'ha',
        decisionValues: {
          compute: ['c-asg', 'c-stateless'],
          data: ['d-multiaz', 'd-objectstore'],
          network: ['n-lb-health', 'n-drain'],
          ops: ['o-test-failover'],
        },
        assessment: 'optimal',
        explanation:
          'Every tier is now redundant and spread across two zones: a stateless, auto-scaling web tier behind a zone-redundant load balancer with health checks and draining; a managed database with a synchronous standby; shared durable object storage for uploads; and tested failover. It survives a zone failure, absorbs the spike, and keeps data loss minimal — meeting all three requirements within the constraints.',
        tradeoffs: 'More moving parts than one VM, and cross-zone adds a little latency and cost. Multi-region remains a deliberate future step if whole-region resilience is later required.',
      },
      {
        id: 'ha-plus-region',
        decisionValues: {
          compute: ['c-asg', 'c-stateless'],
          data: ['d-multiaz', 'd-objectstore'],
          network: ['n-lb-health', 'n-drain'],
          ops: ['o-test-failover', 'o-multiregion'],
        },
        assessment: 'acceptable',
        explanation:
          'The same zone-resilient design, plus a second region now. It exceeds the stated requirement (which is zone-level survival) and adds real cost and the complexity of cross-region replication for a small team. Reasonable if whole-region resilience is genuinely needed, but not required by this brief.',
        tradeoffs: 'Cross-region replication, data-consistency decisions, and routing to manage — justified only when a region-level outage is in scope.',
      },
      {
        id: 'cosmetic',
        decisionValues: {
          compute: ['c-bigger', 'c-second-ip'],
          data: ['d-backups-only'],
          network: ['n-dns-rr'],
          ops: ['o-nothing'],
        },
        assessment: 'problematic',
        explanation:
          'A bigger single VM with two IPs, backups only, DNS round robin, and no tested failover leaves every single point of failure in place. A zone outage is still a full outage with significant data loss — none of the requirements are met.',
        tradeoffs: 'Low effort and low cost, but it does not deliver high availability.',
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'eliminating-single-points-of-failure': eliminatingSpof,
    'failover-and-architectures': failoverAndArchitectures,
    'azure-high-availability': azureHighAvailability,
    'aws-high-availability': awsHighAvailability,
    'high-availability-comparison': comparison,
  },
  labs: {
    'design-a-highly-available-application-lab': haChallenge,
  },
  simulations: {},
};
