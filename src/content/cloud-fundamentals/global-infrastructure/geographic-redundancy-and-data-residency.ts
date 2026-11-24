import type { ConceptMeta, LabDefinition, Lesson } from '../../types';
import { multiRegionScene } from './scenes';

const whyGeographyMatters: Lesson = {
  id: 'why-geography-matters',
  title: 'Why Spread Across Regions',
  kind: 'concept',
  learningObjectives: [
    'Explain which failures zone redundancy cannot protect against',
    'Relate recovery point objective (RPO) and recovery time objective (RTO) to multi-region design',
  ],
  sections: [
    {
      heading: 'The failure zones cannot absorb',
      blocks: [
        {
          type: 'paragraph',
          text: 'Zones protect against the failure of a building or a group of buildings. They do not protect against events that affect a whole region: a large natural disaster, a regional control-plane or networking fault, or an operator error that propagates across zones. For those, the only protection is a copy of the workload and its data in another region.',
        },
        {
          type: 'paragraph',
          text: 'Two numbers frame every multi-region decision. Recovery point objective (RPO) is how much recent data you can afford to lose, measured in time. Recovery time objective (RTO) is how long the service can be down. A low RPO pushes you toward continuous replication; a low RTO pushes you toward a second region that is already running.',
        },
      ],
    },
    {
      heading: 'Common multi-region patterns',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Pattern', 'Second region holds', 'Typical RTO', 'Cost'],
          rows: [
            ['Backup and restore', 'Backups only', 'Hours or more — infrastructure must be created first', 'Lowest'],
            ['Pilot light', 'Replicated data, minimal running infrastructure', 'Tens of minutes to hours', 'Low'],
            ['Warm standby', 'A scaled-down but running copy', 'Minutes', 'Medium'],
            ['Active-active', 'A full copy serving traffic', 'Near zero for traffic; data conflicts must be designed for', 'Highest'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Recovery objectives are covered in depth in the Disaster Recovery concept (Scalability and Reliability). Here the focus is the geography: which region, how far, and what the data is allowed to cross.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'geo-kc-1',
      type: 'single-choice',
      prompt: 'A service is deployed across three zones in one region. Which event is it NOT protected against?',
      difficulty: 'beginner',
      learningObjective: 'Explain which failures zone redundancy cannot protect against',
      options: [
        { id: 'a', label: 'A region-wide outage', correct: true, explanation: 'Correct — every zone is inside the region, so a region-wide event affects all of them.' },
        { id: 'b', label: 'A single datacenter losing power', correct: false, explanation: 'Zone redundancy exists for exactly this.' },
        { id: 'c', label: 'A rack failure', correct: false, explanation: 'Rack failures are absorbed even more easily than zone failures.' },
      ],
    },
  ],
};

const multiRegionReplication: Lesson = {
  id: 'multi-region-replication',
  title: 'Multi-Region Replication and Failover',
  kind: 'concept',
  learningObjectives: [
    'Explain why cross-region replication is usually asynchronous',
    'Describe what is lost and what takes time during a regional failover',
  ],
  sections: [
    {
      heading: 'Synchronous within a region, asynchronous across regions',
      blocks: [
        {
          type: 'paragraph',
          text: 'A synchronous write is acknowledged only after every replica has it, so its latency includes the round trip to the farthest replica. Between zones that round trip is small. Between regions hundreds or thousands of kilometres apart it can be tens of milliseconds or more — added to every write. That is why most cross-region replication is asynchronous: the write is acknowledged locally and shipped to the other region afterwards.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Asynchronous replication has a non-zero RPO by definition. If the primary region fails, whatever had not yet been replicated is lost or stranded until the primary recovers. Any design claiming zero data loss across regions must explain how it pays the synchronous latency cost.',
        },
      ],
    },
    {
      heading: 'What failover actually involves',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Detect: health checks or monitoring decide the primary is truly unavailable, not briefly degraded',
            'Decide: many teams require a human decision, because failing over on a false alarm causes its own outage and can create two diverging writers',
            'Promote: the replica in the secondary region starts accepting writes',
            'Redirect: DNS or a global traffic manager points users at the secondary region; clients that cached the old DNS answer follow after the TTL expires',
            'Fail back later: once the primary recovers, data must be resynchronised before it can take traffic again',
          ],
        },
        {
          type: 'paragraph',
          text: 'Step through the diagram to see the RPO window open during the outage and the RTO elapse during failover.',
        },
      ],
    },
  ],
  visualization: multiRegionScene,
  knowledgeCheck: [
    {
      id: 'mrr-kc-1',
      type: 'scenario',
      prompt:
        'A primary region fails 3 seconds after a customer’s order was acknowledged. Replication to the secondary region is asynchronous with a typical lag of about 5 seconds. After failover, where is the order?',
      difficulty: 'advanced',
      learningObjective: 'Describe what is lost and what takes time during a regional failover',
      options: [
        { id: 'a', label: 'Probably not in the secondary region — it was acknowledged but likely not yet replicated', correct: true, explanation: 'Correct. This is the RPO in practice: acknowledged writes within the replication lag are at risk.' },
        { id: 'b', label: 'Definitely in the secondary region, because it was acknowledged', correct: false, explanation: 'Asynchronous replication acknowledges before replicating; acknowledgement does not imply the secondary has it.' },
        { id: 'c', label: 'Duplicated in both regions', correct: false, explanation: 'The primary is unavailable, and the secondary probably never received it.' },
      ],
    },
  ],
};

const dataResidency: Lesson = {
  id: 'data-residency-and-sovereignty',
  title: 'Data Residency and Sovereignty',
  kind: 'concept',
  learningObjectives: [
    'Distinguish data residency from data sovereignty',
    'Identify where replication and global services can move data outside a chosen region',
  ],
  sections: [
    {
      heading: 'Two related but different ideas',
      blocks: [
        {
          type: 'list',
          items: [
            'Data residency: where data is physically stored and processed — a requirement such as “customer records must be stored in Germany”',
            'Data sovereignty: which jurisdiction’s laws govern the data and who can compel access to it — which can depend on the provider’s legal home, not only on where the disk is',
          ],
        },
        {
          type: 'paragraph',
          text: 'Choosing a region addresses residency for the data you store there. It does not, by itself, settle sovereignty questions, which is why providers also offer dedicated government and sovereign cloud environments operated separately from their public regions. Whether those are needed is a legal and compliance decision, not a purely technical one.',
        },
      ],
    },
    {
      heading: 'Where data quietly leaves the region',
      blocks: [
        {
          type: 'list',
          items: [
            'Geo-replication options that copy data to another region automatically — check where that region is',
            'Global services such as identity, DNS, and CDN, which by design operate across regions',
            'Backups, logs, and diagnostics configured to land in a different region',
            'Support access and telemetry, governed by the provider’s published data-handling commitments',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Example: Azure pairs most regions with another region in the same geography, but some pairs cross a geography boundary — Brazil South is paired with South Central US. A geo-redundant storage default can therefore replicate data outside the original country. Always verify the secondary location before enabling geo-replication for regulated data.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'res-kc-1',
      type: 'single-choice',
      prompt: 'A regulated dataset must stay within one country. Which configuration is most likely to violate that by accident?',
      difficulty: 'intermediate',
      learningObjective: 'Identify where replication and global services can move data outside a chosen region',
      options: [
        { id: 'a', label: 'Enabling a geo-redundant replication option without checking where its secondary region is', correct: true, explanation: 'Correct — the secondary region is chosen by the option or by region pairing, and it may be in another country.' },
        { id: 'b', label: 'Deploying across three availability zones in an in-country region', correct: false, explanation: 'Zones are inside the region, so the data stays in that region.' },
        { id: 'c', label: 'Encrypting data at rest', correct: false, explanation: 'Encryption protects confidentiality; it does not move data.' },
      ],
    },
  ],
};

const geographyComparison: Lesson = {
  id: 'geography-comparison',
  title: 'Comparison: Azure Region Pairs vs. AWS Region Choice',
  kind: 'comparison',
  learningObjectives: ['Compare how Azure and AWS approach the choice of a secondary region'],
  sections: [
    {
      heading: 'Paired by default vs. chosen by you',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Dimension', 'Azure', 'AWS'],
          rows: [
            ['Secondary region', 'Many regions have a designated pair, used by geo-redundant storage and for sequencing platform updates; some newer regions have no pair', 'No built-in pairs — you choose the secondary Region for each replication feature'],
            ['Storage geo-replication', 'Geo-redundant storage options replicate to the paired region asynchronously', 'Cross-Region Replication is configured explicitly per bucket to the Region you choose'],
            ['Implication for residency', 'Check that the pair is in an acceptable jurisdiction', 'The choice is explicit, so the risk is in configuration rather than defaults'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Neither model is strictly safer. Azure’s pairing gives a sensible default and coordinated maintenance between pairs; AWS’s explicit choice gives control and makes the destination visible in configuration. In both, the architect must confirm where the second copy lives.',
        },
      ],
    },
  ],
  furtherReading: [
    { label: 'Azure region pairs and nonpaired regions', url: 'https://learn.microsoft.com/en-us/azure/reliability/cross-region-replication-azure' },
    { label: 'AWS fault isolation boundaries: Regions', url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/regions.html' },
  ],
};

const geographyChallenge: LabDefinition = {
  id: 'choose-a-deployment-geography',
  title: 'Choose a Deployment Geography',
  type: 'challenge',
  difficulty: 'intermediate',
  estimatedTime: '10 minutes',
  description: 'Choose regions, a recovery pattern, and a replication mode for a regulated application, then compare your design against assessed alternatives.',
  learningObjectives: [
    'Balance residency, resilience, and latency when placing a workload geographically',
  ],
  prerequisites: [
    { type: 'concept', id: 'multi-region-replication', label: 'Multi-Region Replication and Failover', description: 'Understand asynchronous replication and RPO.' },
  ],
  content: {
    scenario:
      'A payments company serves customers in Germany and France. Regulation requires customer data to stay within the European Union. The business accepts losing at most a few minutes of data in a region-wide disaster, and needs to be serving again within an hour. Day-to-day, it must survive the loss of a single datacenter with no interruption.',
    requirements: [
      'Customer data stored only in EU regions',
      'Survive a single datacenter failure with no interruption',
      'RPO of a few minutes and RTO under one hour for a region-wide disaster',
    ],
    constraints: ['Synchronous cross-region writes would add unacceptable latency to payments', 'Budget does not allow a full active-active deployment'],
    decisions: [
      {
        id: 'primary',
        question: 'Where should the primary deployment run?',
        type: 'single-choice',
        options: [
          { id: 'eu-single-zone', label: 'An EU region, one zone', description: 'Lowest cost, no zone redundancy.' },
          { id: 'eu-multi-zone', label: 'An EU region, spread across three zones', description: 'Zone-redundant within the region.' },
          { id: 'us-multi-zone', label: 'A US region, spread across three zones', description: 'Large region with every service available.' },
        ],
      },
      {
        id: 'secondary',
        question: 'What should provide regional disaster recovery?',
        type: 'single-choice',
        options: [
          { id: 'none', label: 'Nothing — rely on zones', description: 'No second region.' },
          { id: 'eu-warm', label: 'Warm standby in a second EU region', description: 'Scaled-down running copy, data replicated.' },
          { id: 'non-eu-warm', label: 'Warm standby in a non-EU region', description: 'Picked for lower cost.' },
        ],
      },
      {
        id: 'replication',
        question: 'How should data reach the secondary region?',
        type: 'single-choice',
        options: [
          { id: 'async', label: 'Asynchronous replication', description: 'Acknowledge locally, replicate shortly after.' },
          { id: 'sync', label: 'Synchronous replication', description: 'Acknowledge only after both regions have the write.' },
          { id: 'nightly', label: 'Nightly backups copied to the secondary', description: 'One copy per day.' },
        ],
      },
    ],
    solutions: [
      {
        id: 'optimal',
        decisionValues: { primary: 'eu-multi-zone', secondary: 'eu-warm', replication: 'async' },
        assessment: 'optimal',
        explanation: 'Zones absorb datacenter failures with no interruption; a warm standby in a second EU region meets the one-hour RTO; asynchronous replication keeps RPO to the replication lag without adding cross-region latency to payments; all data stays in the EU.',
        tradeoffs: 'You pay for a second, scaled-down region and accept that writes within the replication lag can be lost in a regional disaster.',
      },
      {
        id: 'sync-latency',
        decisionValues: { primary: 'eu-multi-zone', secondary: 'eu-warm', replication: 'sync' },
        assessment: 'suboptimal',
        explanation: 'Residency and recovery goals are met, and RPO drops toward zero — but every payment now waits for a cross-region round trip, which the constraints rule out.',
        tradeoffs: 'Stronger durability at the cost of user-facing latency on every write.',
      },
      {
        id: 'nightly',
        decisionValues: { primary: 'eu-multi-zone', secondary: 'eu-warm', replication: 'nightly' },
        assessment: 'problematic',
        explanation: 'Nightly copies mean up to a day of lost payments in a regional disaster, far beyond the few-minute RPO.',
        tradeoffs: 'Cheap and simple, but the RPO requirement is not met.',
      },
      {
        id: 'zones-only',
        decisionValues: { primary: 'eu-multi-zone', secondary: 'none', replication: 'async' },
        assessment: 'problematic',
        explanation: 'Datacenter failures are covered, but there is nowhere to recover to in a region-wide disaster, so neither the RPO nor the RTO can be met for that scenario.',
        tradeoffs: 'Lowest cost for good in-region resilience, with no regional disaster recovery.',
      },
      {
        id: 'non-eu',
        decisionValues: { primary: 'eu-multi-zone', secondary: 'non-eu-warm', replication: 'async' },
        assessment: 'problematic',
        explanation: 'The recovery design is sound, but replicating customer data to a non-EU region violates the residency requirement.',
        tradeoffs: 'Residency is a hard constraint; cost savings cannot trade against it.',
      },
      {
        id: 'single-zone',
        decisionValues: { primary: 'eu-single-zone', secondary: 'eu-warm', replication: 'async' },
        assessment: 'suboptimal',
        explanation: 'Regional disasters are covered, but a single datacenter failure now forces a full regional failover — an interruption the requirements do not allow.',
        tradeoffs: 'Saves the cost of zone redundancy by turning routine failures into disaster recoveries.',
      },
      {
        id: 'us-primary',
        decisionValues: { primary: 'us-multi-zone', secondary: 'eu-warm', replication: 'async' },
        assessment: 'problematic',
        explanation: 'The primary copy of customer data would live in the US, violating the EU residency requirement regardless of the secondary region.',
        tradeoffs: 'Service availability in a large region does not outweigh a regulatory constraint.',
      },
    ],
  },
};

export const geographicRedundancyAndDataResidency: ConceptMeta = {
  id: 'geographic-redundancy-and-data-residency',
  title: 'Geographic Redundancy and Data Residency',
  description:
    'Replicating data and workloads across geography for resilience, balanced against data residency and sovereignty requirements that constrain where data may legally live.',
  status: 'available',
  learningObjectives: [
    'Explain which failures require a second region and how RPO and RTO shape the design',
    'Describe asynchronous cross-region replication and what failover involves',
    'Identify how replication and global services can move data across jurisdictions',
  ],
  prerequisites: ['regions-and-availability-zones'],
  relatedConcepts: ['regions-and-availability-zones', 'disaster-recovery', 'object-storage'],
  estimatedMinutes: 50,
  lessons: [whyGeographyMatters, multiRegionReplication, dataResidency, geographyComparison],
  labs: [geographyChallenge],
};
