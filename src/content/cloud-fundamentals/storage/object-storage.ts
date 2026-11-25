import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { objectRequestFlowScene } from './object-storage.scenes';
import { replicationSimulation, type ReplicationState } from './simulations';
import { renderReplicationState } from './replication-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const howObjectStorageWorks: LessonBody = {
  learningObjectives: [
    'Describe the object storage namespace: account or bucket, keys, and metadata',
    'Trace an upload and a download through authorization, the namespace, and the data layer',
  ],
  sections: [
    {
      heading: 'Objects, keys, and a flat namespace',
      blocks: [
        {
          type: 'paragraph',
          text: 'An object is a blob of bytes plus metadata, stored under a key. Keys live in a flat namespace inside a top-level container — a bucket in Amazon S3, a container inside a storage account in Azure. A key such as photos/2026/cat.jpg looks like a path, but there is no directory called photos: the slashes are just characters, and “listing a folder” means listing keys that share a prefix.',
        },
        {
          type: 'comparisonTable',
          headers: ['Level', 'Azure Blob Storage', 'Amazon S3'],
          rows: [
            ['Top-level resource', 'Storage account (its name forms the endpoint hostname)', 'Bucket (its name is unique within the AWS partition)'],
            ['Grouping', 'Container', '— (the bucket itself)'],
            ['Item', 'Blob', 'Object'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Azure also offers a hierarchical namespace on storage accounts (Azure Data Lake Storage) that adds real directories with atomic rename — useful for analytics engines. Standard blob containers and S3 buckets are flat.',
        },
      ],
    },
    {
      heading: 'An object’s lifecycle in requests',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every operation is an independent HTTPS request — there is no open file handle or mounted drive. Step through the diagram to follow an upload and a later download, and select each participant to inspect its role. Notice that authorization is checked on every request, before any data is touched.',
        },
        {
          type: 'list',
          items: [
            'Writes replace whole objects; there is no seek-and-overwrite. Large uploads are split into parts (multipart upload / block blobs) and committed together',
            'Both Azure Blob Storage and Amazon S3 provide strong read-after-write consistency for new and overwritten objects',
            'Metadata travels with the object as HTTP headers; the ETag lets clients detect whether content changed',
          ],
        },
      ],
    },
  ],
  visualization: objectRequestFlowScene,
  knowledgeCheck: [
    {
      id: 'obj-kc-1',
      type: 'single-choice',
      prompt: 'A bucket contains the key reports/2026/q1.pdf. What does deleting “the reports folder” actually involve?',
      difficulty: 'intermediate',
      learningObjective: 'Describe the object storage namespace: account or bucket, keys, and metadata',
      options: [
        { id: 'a', label: 'Deleting every object whose key starts with reports/', correct: true, explanation: 'Correct — the folder is a prefix shared by keys, so “deleting it” means deleting each matching object.' },
        { id: 'b', label: 'Deleting a single directory entry', correct: false, explanation: 'In a flat namespace there is no directory entry to delete.' },
        { id: 'c', label: 'It is impossible to delete objects by prefix', correct: false, explanation: 'Tools commonly list by prefix and delete each object found, or use lifecycle rules scoped to a prefix.' },
      ],
    },
  ],
};

const durabilityAndReplication: LessonBody = {
  learningObjectives: [
    'Distinguish durability from availability',
    'Predict which failures each redundancy strategy tolerates',
  ],
  sections: [
    {
      heading: 'Two different promises',
      blocks: [
        {
          type: 'list',
          items: [
            'Durability: the data still exists — it has not been lost',
            'Availability: you can read or write the data right now',
          ],
        },
        {
          type: 'paragraph',
          text: 'They fail independently. During a zone outage, data stored only in that zone may be perfectly intact on disks that are unreachable: durable, but unavailable. Providers publish design targets for both; when you need the figures, read them from the provider’s current documentation for the exact storage option, because they differ between options and are easy to misquote.',
        },
      ],
    },
    {
      heading: 'Redundancy strategies',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Strategy', 'Copies live', 'Survives', 'Trade-off'],
          rows: [
            ['Local', 'Several copies in one datacenter', 'Disk and node failures', 'Cheapest; one site failure affects every copy'],
            ['Zone-redundant', 'Copies spread across zones, written synchronously', 'Plus a zone failure, with no failover', 'Modest extra cost and write latency'],
            ['Geo-redundant', 'Local copies plus an asynchronous copy in another region', 'Plus a region failure, after failover', 'Higher cost; recent writes at risk; check the secondary’s jurisdiction'],
            ['Geo-zone-redundant', 'Zone-redundant primary plus an asynchronous copy in another region', 'Zone failures without failover; region failures after failover', 'Highest cost'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Use the Replication and Durability lab to apply each failure to each strategy and see whether the data survives, whether it is readable right now, and what could be lost.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'dur-kc-1',
      type: 'scenario',
      prompt: 'Data uses geo-redundant storage without read access to the secondary. The entire primary region goes down. What is true immediately afterwards?',
      difficulty: 'advanced',
      learningObjective: 'Predict which failures each redundancy strategy tolerates',
      options: [
        { id: 'a', label: 'The data is durable in the secondary region, but it cannot be read or written until a failover happens', correct: true, explanation: 'Correct — durable but unavailable. Writes within the replication lag may also be missing from the secondary.' },
        { id: 'b', label: 'Reads and writes continue transparently from the secondary region', correct: false, explanation: 'Without read access configured, the secondary is not readable before failover, and writes always need failover.' },
        { id: 'c', label: 'The data is permanently lost', correct: false, explanation: 'The secondary region holds copies, so the data survives (apart from the replication-lag window).' },
      ],
    },
  ],
};

const tiersAndLifecycle: LessonBody = {
  learningObjectives: [
    'Explain the trade-off between storage cost and access cost across tiers',
    'Design a lifecycle policy for data whose access pattern changes over time',
  ],
  sections: [
    {
      heading: 'Paying for storage vs. paying for access',
      blocks: [
        {
          type: 'paragraph',
          text: 'Most data is read often when new and rarely afterwards. Object storage tiers exploit that: colder tiers charge less to store each gigabyte but more to read it, often with a minimum storage duration and, for archive tiers, a delay of hours before the data can be read at all. The right tier depends on how often the data is actually accessed.',
        },
        {
          type: 'comparisonTable',
          headers: ['Access pattern', 'Azure Blob tier', 'Amazon S3 storage class'],
          rows: [
            ['Frequent', 'Hot', 'S3 Standard'],
            ['Infrequent, immediate access', 'Cool, Cold', 'S3 Standard-IA, S3 Glacier Instant Retrieval'],
            ['Unknown or changing', 'Lifecycle rules (or last-access-time tracking)', 'S3 Intelligent-Tiering'],
            ['Archive, retrieval in hours', 'Archive (must be rehydrated before reading)', 'S3 Glacier Flexible Retrieval, S3 Glacier Deep Archive'],
          ],
        },
      ],
    },
    {
      heading: 'Lifecycle policies',
      blocks: [
        {
          type: 'paragraph',
          text: 'A lifecycle policy moves or deletes objects automatically based on age or other conditions, so the tiering decision does not depend on anyone remembering to do it.',
        },
        {
          type: 'code',
          code: 'logs/  ── after 30 days  → cool / infrequent-access tier\n       ── after 180 days → archive tier\n       ── after 7 years  → delete',
          caption: 'A typical policy for logs that must be retained but are rarely read after the first month.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Colder is not always cheaper overall. Moving frequently read data to a cold tier, or deleting data before a tier’s minimum storage duration, can cost more than leaving it in a warmer tier.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'tier-kc-1',
      type: 'single-choice',
      prompt: 'Audit files must be kept for seven years, are almost never read, and may take hours to retrieve when they are. Which choice fits best?',
      difficulty: 'beginner',
      learningObjective: 'Explain the trade-off between storage cost and access cost across tiers',
      options: [
        { id: 'a', label: 'An archive tier, moved there by a lifecycle policy', correct: true, explanation: 'Correct — the lowest storage cost, and the retrieval delay is acceptable for this access pattern.' },
        { id: 'b', label: 'The hot tier, so they are always instantly available', correct: false, explanation: 'You would pay the highest storage price for seven years for data nobody reads.' },
        { id: 'c', label: 'A block volume attached to a VM', correct: false, explanation: 'Block storage costs more per GB and needs a running VM to reach the data.' },
      ],
    },
  ],
};

const securingObjectStorage: LessonBody = {
  learningObjectives: [
    'Explain encryption at rest and in transit for object storage',
    'Identify how object storage accidentally becomes public, and how to prevent it',
  ],
  sections: [
    {
      heading: 'Encryption',
      blocks: [
        {
          type: 'list',
          items: [
            'At rest: Azure Storage encrypts all data at rest by default, and Amazon S3 applies server-side encryption to all new objects by default. Both let you use provider-managed keys or keys you control in a key management service',
            'In transit: requests should use HTTPS only. Azure storage accounts have a “secure transfer required” setting; on S3, a bucket policy can deny any request where aws:SecureTransport is false',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Encryption at rest protects against someone obtaining the physical disks. It does not protect against a caller who is authorised to read the object — the service decrypts it for them. Access control is what limits who that is.',
        },
      ],
    },
    {
      heading: 'Access control and the public-bucket problem',
      blocks: [
        {
          type: 'paragraph',
          text: 'Storage is private by default; access is granted through identity-based permissions (role assignments, IAM policies), resource policies (bucket policies), or time-limited signed URLs and shared access signatures. Many well-known data leaks came from a bucket or container being made publicly readable by mistake. Both providers now ship account-level guardrails that block public access unless deliberately disabled — S3 Block Public Access and Azure’s setting that disallows anonymous blob access.',
        },
        {
          type: 'list',
          items: [
            'Prefer short-lived signed URLs over making objects public when a client needs temporary access',
            'Keep account- or bucket-level public access blocks enabled unless you are intentionally hosting public content',
            'Use versioning, soft delete, or immutable (write-once) policies to protect against deletion and ransomware',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'sec-kc-1',
      type: 'single-choice',
      prompt: 'A mobile app needs to let one user download one private file for the next ten minutes. What is the best mechanism?',
      difficulty: 'intermediate',
      learningObjective: 'Identify how object storage accidentally becomes public, and how to prevent it',
      options: [
        { id: 'a', label: 'Generate a short-lived signed URL (pre-signed URL or SAS) for that object', correct: true, explanation: 'Correct — scoped to one object, one action, and a short time window.' },
        { id: 'b', label: 'Make the container or bucket public', correct: false, explanation: 'That exposes every object to everyone indefinitely.' },
        { id: 'c', label: 'Embed the storage account key in the app', correct: false, explanation: 'Anyone who extracts the key from the app gets full control of the account.' },
      ],
    },
  ],
};

const azureBlob: LessonBody = {
  learningObjectives: ['Map Azure Blob Storage onto the object storage model'],
  sections: [
    {
      heading: 'Accounts, containers, blobs, and redundancy',
      blocks: [
        {
          type: 'paragraph',
          text: 'Blobs live in containers inside a storage account. Redundancy is chosen per storage account: locally redundant (LRS — three copies in one datacenter), zone-redundant (ZRS — copies across availability zones), geo-redundant (GRS — LRS in the primary region plus asynchronous replication to the paired region), and geo-zone-redundant (GZRS — ZRS in the primary plus asynchronous replication). The read-access variants RA-GRS and RA-GZRS also allow reads from the secondary before failover.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Blob Storage',
    keyFeatures: [
      'LRS, ZRS, GRS, GZRS, RA-GRS, and RA-GZRS redundancy options per storage account',
      'Hot, Cool, Cold, and Archive access tiers with lifecycle management',
      'Encryption at rest by default; versioning, soft delete, and immutability policies',
      'Optional hierarchical namespace (Azure Data Lake Storage)',
    ],
    terminology: {
      'Top-level namespace': 'Storage account',
      'Object grouping': 'Container',
      Object: 'Blob',
      'Temporary signed access': 'Shared access signature (SAS)',
    },
    architecturalNotes: [
      'Geo-redundant options replicate to the region’s designated pair — verify the pair’s location for residency requirements',
      'Redundancy is a property of the storage account, not of individual containers or blobs',
    ],
    limitations: ['Archive-tier blobs must be rehydrated to an online tier before they can be read'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy',
  },
};

const amazonS3: LessonBody = {
  learningObjectives: ['Map Amazon S3 onto the object storage model'],
  sections: [
    {
      heading: 'Buckets, storage classes, and redundancy',
      blocks: [
        {
          type: 'paragraph',
          text: 'Objects live in buckets in a chosen Region. Redundancy is tied to the storage class: S3 Standard, Standard-IA, Intelligent-Tiering, and the Glacier classes store data across a minimum of three Availability Zones, while S3 One Zone-IA keeps data in a single AZ at lower cost. Copies in another Region are not automatic — you configure S3 Replication (Cross-Region Replication) on a bucket, choosing the destination Region yourself.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon Simple Storage Service (S3)',
    keyFeatures: [
      'Storage classes from S3 Standard to S3 Glacier Deep Archive, plus Intelligent-Tiering',
      'Multi-AZ storage by default; single-AZ classes available',
      'S3 Replication to another Region or bucket, configured explicitly',
      'Default encryption, Block Public Access, Versioning, and Object Lock',
    ],
    terminology: {
      'Top-level namespace': 'Bucket',
      Object: 'Object',
      'Access tier': 'Storage class',
      'Temporary signed access': 'Pre-signed URL',
    },
    architecturalNotes: [
      'Zone redundancy is the default for most storage classes rather than an account-level option',
      'Cross-Region copies are an explicit replication configuration, not a redundancy tier',
    ],
    limitations: ['Single-AZ storage classes do not survive the loss of their Availability Zone'],
    documentationUrl: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html',
  },
};

const objectComparison: LessonBody = {
  learningObjectives: ['Compare where Azure Blob Storage and Amazon S3 put redundancy and namespace decisions'],
  sections: [
    {
      heading: 'Same model, different knobs',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Dimension', 'Azure Blob Storage', 'Amazon S3'],
          rows: [
            ['Namespace', 'Account → container → blob', 'Bucket → object'],
            ['Where redundancy is chosen', 'Storage account redundancy setting', 'Storage class per object; Replication configured per bucket'],
            ['Default zone redundancy', 'Only if ZRS or GZRS is chosen', 'Yes for most storage classes'],
            ['Second region', 'Built into GRS/GZRS, to the paired region', 'S3 Replication, to a Region you choose'],
            ['Readable secondary before failover', 'RA-GRS / RA-GZRS', 'The replica bucket is readable as its own bucket'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The practical difference: in Azure, an account-level setting decides how every blob in it is protected; in S3, protection follows each object’s storage class, and cross-Region copies are a separate replication rule. Translating a design means mapping each requirement — zone failure, region failure, cost — onto the right knob, not renaming LRS to “S3 Standard”.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'obj-compare-kc-1',
      type: 'single-choice',
      prompt: 'Which statement about default zone redundancy is accurate?',
      difficulty: 'intermediate',
      learningObjective: 'Compare where Azure Blob Storage and Amazon S3 put redundancy and namespace decisions',
      options: [
        { id: 'a', label: 'Most S3 storage classes are multi-AZ by default; an Azure storage account is zone-redundant only if ZRS or GZRS is selected', correct: true, explanation: 'Correct — the defaults differ, so the same “just create a bucket/account” step yields different resilience.' },
        { id: 'b', label: 'Both are single-zone by default', correct: false, explanation: 'S3 Standard stores data across a minimum of three AZs.' },
        { id: 'c', label: 'Both are multi-region by default', correct: false, explanation: 'Neither replicates to another region unless you choose a geo option or configure replication.' },
      ],
    },
  ],
};

const replicationLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '15 minutes',
  description:
    'Apply disk, zone, and region failures to four redundancy strategies and find the cheapest strategy that keeps data readable through a zone outage without any failover.',
  learningObjectives: [
    'Predict whether data survives, and whether it stays readable, for each strategy and failure',
    'Choose the least expensive redundancy that meets a stated requirement',
  ],
  prerequisites: [
    { type: 'concept', id: 'durability-availability-and-replication', label: 'Durability, Availability, and Replication', description: 'Know the four strategies and the difference between durable and available.' },
  ],
  content: {
    simulationId: replicationSimulation.id,
    instructions: [
      { id: 'explore', label: 'Explore', description: 'Keep “A single disk fails” and step through each strategy. All of them survive — disk failures are what every strategy is built for.' },
      { id: 'zone', label: 'Fail a zone', description: 'Switch to a zone failure and compare Local with Zone-redundant. Note the difference between “data survives” and “reads right now”.' },
      { id: 'region', label: 'Fail a region', description: 'Switch to a region failure. Compare the geo strategies with and without read access to the secondary, and note what is at risk.' },
      { id: 'goal', label: 'Meet the requirement', description: 'Requirement: data must stay readable during a zone outage with no failover, at the lowest cost. Configure it, run it, and check the validation below.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'zone-tested',
        label: 'Tested against a zone failure',
        check: (state) => (state as ReplicationState).failure === 'zone' && (state as ReplicationState).failureApplied,
      },
      {
        id: 'readable',
        label: 'Data stays readable with no failover',
        check: (state) => (state as ReplicationState).outcome?.readsNow === 'yes',
      },
      {
        id: 'cheapest',
        label: 'No second region paid for when the requirement does not need one',
        check: (state) => {
          const s = state as ReplicationState;
          return s.outcome !== null && (s.strategy === 'local' || s.strategy === 'zone');
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'how-object-storage-works': howObjectStorageWorks,
    'durability-availability-and-replication': durabilityAndReplication,
    'access-tiers-and-lifecycle': tiersAndLifecycle,
    'securing-object-storage': securingObjectStorage,
    'azure-blob-storage': azureBlob,
    'amazon-s3': amazonS3,
    'object-storage-comparison': objectComparison,
  },
  labs: {
    'replication-and-durability-lab': replicationLab,
  },
  simulations: {
    'replication-and-durability-lab': bindSimulation(replicationSimulation, renderReplicationState),
  },
};
