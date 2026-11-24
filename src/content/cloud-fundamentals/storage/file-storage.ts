import type { ConceptMeta, LabDefinition, Lesson } from '../../types';

const howFileStorageWorks: Lesson = {
  id: 'how-file-storage-works',
  title: 'How Managed File Storage Works',
  kind: 'concept',
  learningObjectives: [
    'Explain how NFS and SMB provide shared filesystem access over a network',
    'Describe the consistency, locking, and performance trade-offs of shared file storage',
  ],
  analogy:
    'A file share is a shared office drive: everyone sees the same folders, and when one person has a document open for editing, others are warned before they overwrite it.',
  sections: [
    {
      heading: 'A filesystem served over the network',
      blocks: [
        {
          type: 'paragraph',
          text: 'Managed file storage runs a filesystem on the provider’s side and exposes it over a network file protocol. Clients mount the share, and from then on applications open, read, write, and lock files by path, exactly as on a local disk. Because the filesystem lives on the server, many clients can mount it at the same time and see one consistent directory tree — the capability a single-attach block volume lacks.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'NFS (Network File System)', 'SMB (Server Message Block)'],
          rows: [
            ['Typical clients', 'Linux and Unix', 'Windows (Linux and macOS clients exist)'],
            ['Identity and permissions', 'POSIX users, groups, and modes', 'Windows identities and access control lists'],
            ['Common use', 'Shared content for Linux fleets, home directories', 'Windows file servers, lift-and-shift of departmental shares'],
          ],
        },
      ],
    },
    {
      heading: 'What sharing costs',
      blocks: [
        {
          type: 'list',
          items: [
            'Latency: every metadata operation (open, stat, lock) is a network round trip, so workloads touching many small files can be much slower than on a local disk',
            'Locking: shared access needs locks to prevent concurrent writers corrupting a file; applications must use them correctly',
            'Throughput scaling: many managed file services scale throughput with stored size or provisioned capacity, so a small share can be slower than expected',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A file share is not a good place for a database’s data files unless the database vendor explicitly supports that configuration. Databases expect the latency and write-ordering guarantees of a block device.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'file-kc-1',
      type: 'scenario',
      prompt: 'Twenty Linux web servers must all read and occasionally update the same set of template files. Which storage fits?',
      difficulty: 'beginner',
      learningObjective: 'Explain how NFS and SMB provide shared filesystem access over a network',
      options: [
        { id: 'a', label: 'An NFS file share mounted by every server', correct: true, explanation: 'Correct — shared, concurrent, path-based access is exactly what a file share provides.' },
        { id: 'b', label: 'One block volume attached to all twenty servers', correct: false, explanation: 'Ordinary block volumes attach to one VM; sharing them read-write corrupts the filesystem.' },
        { id: 'c', label: 'A block volume per server, synced nightly', correct: false, explanation: 'Updates would be invisible to other servers until the next sync, and conflicts would be lost.' },
      ],
    },
  ],
};

const choosingStorage: Lesson = {
  id: 'choosing-a-storage-model',
  title: 'Choosing a Storage Model',
  kind: 'concept',
  learningObjectives: ['Select block, file, or object storage from a workload’s access pattern, sharing needs, and cost profile'],
  sections: [
    {
      heading: 'Questions that decide it',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Does the software need a disk it owns, with low-latency in-place updates? → block',
            'Do several machines need the same files at the same paths, through a normal filesystem? → file',
            'Is data written whole, read over HTTP, very large in volume, or retained cheaply for a long time? → object',
          ],
        },
        {
          type: 'paragraph',
          text: 'Many systems use all three: block volumes for the database, a file share for content shared between application servers, and object storage for uploads, backups, and logs. The choice is per workload, not per application.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Try the Storage Selection challenge to practise these decisions on four workloads.',
        },
      ],
    },
  ],
};

const azureFiles: Lesson = {
  id: 'azure-files',
  title: 'Azure Files',
  kind: 'provider',
  providerId: 'azure',
  learningObjectives: ['Map Azure Files onto the managed file storage model'],
  sections: [
    {
      heading: 'SMB and NFS shares in a storage account',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Files provides fully managed file shares inside a storage account, accessible over SMB and, for premium (SSD) shares, NFS. Shares inherit the storage account’s redundancy options (such as LRS or ZRS). Azure File Sync can cache an Azure file share on Windows servers on-premises. For workloads needing very high performance or enterprise NAS features, Azure NetApp Files is a separate service.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Files',
    keyFeatures: [
      'SMB shares, and NFS shares on premium file shares',
      'Redundancy inherited from the storage account',
      'Azure File Sync for on-premises caching',
      'Snapshots and integration with Azure Backup',
    ],
    terminology: {
      'Managed file share': 'Azure file share',
      'Share container': 'Storage account',
    },
    architecturalNotes: [
      'One service covers both Windows (SMB) and Linux (NFS) protocols, with NFS limited to premium shares',
      'Azure NetApp Files is a distinct service for higher-performance NAS needs',
    ],
    limitations: ['Protocol support, performance, and redundancy options differ between standard and premium shares'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/storage/files/storage-files-introduction',
  },
};

const amazonEfs: Lesson = {
  id: 'amazon-efs-and-fsx',
  title: 'Amazon EFS and Amazon FSx',
  kind: 'provider',
  providerId: 'aws',
  learningObjectives: ['Map Amazon EFS and the FSx family onto the managed file storage model'],
  sections: [
    {
      heading: 'NFS with EFS, everything else with FSx',
      blocks: [
        {
          type: 'paragraph',
          text: 'Amazon Elastic File System (EFS) is a managed NFS file system for Linux clients that grows and shrinks automatically with the data stored. Regional EFS file systems store data across multiple Availability Zones; One Zone file systems keep data in a single AZ at lower cost. EFS does not speak SMB — AWS covers Windows file shares with Amazon FSx for Windows File Server, and other workloads with further FSx variants (for NetApp ONTAP, OpenZFS, and Lustre).',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon EFS (and Amazon FSx for SMB workloads)',
    keyFeatures: [
      'NFS file systems that scale capacity automatically',
      'Regional (multi-AZ) and One Zone storage options',
      'Throughput modes, including elastic throughput',
      'Amazon FSx for Windows File Server for SMB',
    ],
    terminology: {
      'Managed file share': 'EFS file system / FSx file system',
      'NFS service': 'Amazon EFS',
      'SMB service': 'Amazon FSx for Windows File Server',
    },
    architecturalNotes: [
      'Clients reach EFS through mount targets placed in subnets of the VPC',
      'Protocol choice selects the service: NFS → EFS, SMB → FSx for Windows File Server',
    ],
    limitations: ['EFS supports NFS only; it is not a Windows file share'],
    documentationUrl: 'https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html',
  },
};

const fileComparison: Lesson = {
  id: 'file-storage-comparison',
  title: 'Comparison: Azure Files vs. Amazon EFS',
  kind: 'comparison',
  learningObjectives: ['Compare Azure Files and Amazon EFS, including where the mapping is only partial'],
  sections: [
    {
      heading: 'A partial mapping',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Dimension', 'Azure Files', 'Amazon EFS'],
          rows: [
            ['Protocols', 'SMB; NFS on premium shares', 'NFS only'],
            ['Windows file shares', 'Yes (SMB)', 'No — use Amazon FSx for Windows File Server'],
            ['Capacity model', 'Share size and tier provisioned or billed by usage depending on share type', 'Grows and shrinks automatically'],
            ['Zone resilience', 'Through the storage account’s ZRS option', 'Regional file systems span multiple AZs; One Zone does not'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: '“Azure Files ↔ EFS” is only accurate for Linux NFS workloads. A Windows SMB share on Azure Files maps to Amazon FSx for Windows File Server, not to EFS.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'file-compare-kc-1',
      type: 'single-choice',
      prompt: 'You are migrating a Windows SMB departmental share from Azure Files to AWS. Which service is the appropriate target?',
      difficulty: 'intermediate',
      learningObjective: 'Compare Azure Files and Amazon EFS, including where the mapping is only partial',
      options: [
        { id: 'a', label: 'Amazon FSx for Windows File Server', correct: true, explanation: 'Correct — it provides SMB with Windows-native permissions.' },
        { id: 'b', label: 'Amazon EFS', correct: false, explanation: 'EFS is NFS-only and does not serve SMB clients.' },
        { id: 'c', label: 'Amazon S3', correct: false, explanation: 'S3 is object storage, not a mountable SMB share.' },
      ],
    },
  ],
};

const storageSelectionChallenge: LabDefinition = {
  id: 'storage-selection-challenge',
  title: 'Storage Selection Challenge',
  type: 'challenge',
  difficulty: 'beginner',
  estimatedTime: '10 minutes',
  description: 'Choose the storage model for four workloads in one system, then compare your choices with an assessed design.',
  learningObjectives: ['Select block, file, or object storage for each workload in a realistic system'],
  prerequisites: [
    { type: 'concept', id: 'storage-models-block-file-object', label: 'Storage Models: Block, File, and Object', description: 'Know what distinguishes the three models.' },
  ],
  content: {
    scenario:
      'A media company runs a content platform. A PostgreSQL database on one VM stores metadata; a fleet of Linux render servers shares templates and fonts; users upload photos and videos that mobile apps download; and nightly backups must be retained for seven years for compliance.',
    requirements: [
      'The database needs low-latency random reads and writes',
      'Every render server must see the same templates immediately after an update',
      'User media must scale to billions of files and be downloadable over HTTPS',
      'Backups must be kept cheaply for seven years; retrieval can take hours',
    ],
    constraints: ['Minimise cost where performance is not required'],
    decisions: [
      {
        id: 'database',
        question: 'PostgreSQL data directory',
        type: 'single-choice',
        options: [
          { id: 'block', label: 'Block volume', description: 'A disk attached to the database VM.' },
          { id: 'file', label: 'File share', description: 'An NFS share mounted by the VM.' },
          { id: 'object', label: 'Object storage', description: 'Objects in a bucket or container.' },
        ],
      },
      {
        id: 'templates',
        question: 'Templates and fonts shared by render servers',
        type: 'single-choice',
        options: [
          { id: 'block', label: 'Block volume per server', description: 'Each server keeps its own copy.' },
          { id: 'file', label: 'File share', description: 'One NFS share mounted by every server.' },
          { id: 'object', label: 'Object storage', description: 'Servers fetch files over HTTPS.' },
        ],
      },
      {
        id: 'media',
        question: 'User-uploaded photos and videos',
        type: 'single-choice',
        options: [
          { id: 'block', label: 'Block volume', description: 'On a file server VM.' },
          { id: 'file', label: 'File share', description: 'A large NFS share.' },
          { id: 'object', label: 'Object storage (hot tier)', description: 'Downloaded directly by clients.' },
        ],
      },
      {
        id: 'backups',
        question: 'Seven-year backup retention',
        type: 'single-choice',
        options: [
          { id: 'block', label: 'Block volume snapshots kept for seven years', description: 'Stored as disk snapshots.' },
          { id: 'file', label: 'File share', description: 'Backups copied to a share.' },
          { id: 'object', label: 'Object storage, archive tier via lifecycle policy', description: 'Cheapest per GB, slow retrieval.' },
        ],
      },
    ],
    solutions: [
      {
        id: 'optimal',
        decisionValues: { database: 'block', templates: 'file', media: 'object', backups: 'object' },
        assessment: 'optimal',
        explanation: 'Each workload gets the model built for its access pattern: a block volume for the database’s random I/O, a shared file system for templates every server must see, object storage for media at scale over HTTPS, and an archive tier for long-term, rarely read backups.',
        tradeoffs: 'Three storage services to operate and secure, in exchange for each one fitting its workload.',
      },
      {
        id: 'db-on-file',
        decisionValues: { database: 'file', templates: 'file', media: 'object', backups: 'object' },
        assessment: 'suboptimal',
        explanation: 'Running the database on a network file share adds latency to every I/O and depends on file-locking behaviour the database may not support. Use a block volume unless the vendor explicitly supports the share.',
        tradeoffs: 'Shared access the database does not need, at the cost of the latency it does care about.',
      },
      {
        id: 'db-on-object',
        decisionValues: { database: 'object', templates: 'file', media: 'object', backups: 'object' },
        assessment: 'problematic',
        explanation: 'Object storage cannot update part of an object in place, so it cannot hold a running database’s data files.',
        tradeoffs: 'Not workable for this access pattern.',
      },
      {
        id: 'templates-per-server',
        decisionValues: { database: 'block', templates: 'block', media: 'object', backups: 'object' },
        assessment: 'suboptimal',
        explanation: 'A copy on every server means an update is not visible everywhere until it is redistributed, violating the “immediately after an update” requirement.',
        tradeoffs: 'Fast local reads, but no shared view and a synchronisation problem to solve.',
      },
      {
        id: 'templates-on-object',
        decisionValues: { database: 'block', templates: 'object', media: 'object', backups: 'object' },
        assessment: 'acceptable',
        explanation: 'Workable if the render software can fetch templates over HTTPS rather than by file path. If it expects a mounted filesystem, a file share fits better.',
        tradeoffs: 'Cheaper and highly scalable, but depends on the application reading from an object API.',
      },
      {
        id: 'media-on-file',
        decisionValues: { database: 'block', templates: 'file', media: 'file', backups: 'object' },
        assessment: 'suboptimal',
        explanation: 'A file share can hold the media, but mobile clients cannot mount it, so every download must flow through servers you run, and the cost per GB is higher than object storage.',
        tradeoffs: 'Familiar filesystem semantics the workload does not need.',
      },
      {
        id: 'backups-snapshots',
        decisionValues: { database: 'block', templates: 'file', media: 'object', backups: 'block' },
        assessment: 'suboptimal',
        explanation: 'Disk snapshots are for operational recovery, not seven-year retention: they cost more than archive storage and are tied to the disk and account they belong to.',
        tradeoffs: 'Simple to take, expensive and less isolated to keep for years.',
      },
    ],
  },
};

export const fileStorage: ConceptMeta = {
  id: 'file-storage',
  title: 'File Storage',
  description:
    'Managed file systems accessible over standard protocols like NFS and SMB, including backup and recovery patterns.',
  status: 'available',
  learningObjectives: [
    'Explain how managed file shares provide shared access over NFS and SMB',
    'Choose between block, file, and object storage for a workload',
    'Compare Azure Files with Amazon EFS and FSx, including where the mapping is only partial',
  ],
  prerequisites: ['block-storage'],
  relatedConcepts: ['block-storage', 'object-storage', 'virtual-networks'],
  estimatedMinutes: 45,
  lessons: [howFileStorageWorks, choosingStorage, azureFiles, amazonEfs, fileComparison],
  labs: [storageSelectionChallenge],
};
