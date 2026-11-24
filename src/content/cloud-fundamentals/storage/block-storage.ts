import type { ConceptMeta, Lesson } from '../../types';
import { storageModelExplorerScene } from './scenes';

const storageModels: Lesson = {
  id: 'storage-models-block-file-object',
  title: 'Storage Models: Block, File, and Object',
  kind: 'concept',
  learningObjectives: [
    'Distinguish block, file, and object storage by how data is addressed and accessed',
    'Match a workload to the storage model that fits its access pattern',
  ],
  analogy:
    'Block storage is a blank notebook only you write in, page by page. File storage is a shared filing cabinet with labelled folders and a lock on each drawer. Object storage is a warehouse: you hand over a sealed box with a label, and later ask for the box back by its label.',
  sections: [
    {
      heading: 'Three abstractions over the same disks',
      blocks: [
        {
          type: 'paragraph',
          text: 'Underneath, all three models store bytes on physical drives. What differs is the interface: what the unit of data is, how it is addressed, who can access it at once, and whether it can be changed in place. Those interface choices — not the hardware — decide which workloads each model suits.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'Block', 'File', 'Object'],
          rows: [
            ['Unit of data', 'Fixed-size blocks', 'Files in directories', 'Objects (bytes + metadata)'],
            ['Addressed by', 'Block offset on a volume', 'Path in a directory tree', 'Key in a flat namespace'],
            ['Accessed through', 'Attached as a disk to a VM', 'Mounted over NFS or SMB', 'HTTPS API calls'],
            ['Concurrent clients', 'Usually one VM', 'Many', 'Effectively unlimited'],
            ['In-place partial update', 'Yes', 'Yes', 'No — replace the object'],
            ['Typical use', 'OS disks, databases', 'Shared files, lift-and-shift apps', 'Media, backups, data lakes, static websites'],
          ],
        },
      ],
    },
    {
      heading: 'Explore the workloads',
      blocks: [
        {
          type: 'paragraph',
          text: 'Step through the explorer to see one representative workload per model, and select any node to inspect how its data is represented.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The rest of this concept covers block storage in depth. Object storage and file storage each have their own concept in this category; the comparison here is the shared starting point for all three.',
        },
      ],
    },
  ],
  visualization: storageModelExplorerScene,
  knowledgeCheck: [
    {
      id: 'models-kc-1',
      type: 'scenario',
      prompt: 'An application stores 200 million user-uploaded images that mobile clients download directly. Which storage model fits best?',
      difficulty: 'beginner',
      learningObjective: 'Match a workload to the storage model that fits its access pattern',
      options: [
        { id: 'a', label: 'Object storage', correct: true, explanation: 'Correct — massive scale, whole-file writes, and direct HTTPS access by clients are what object storage is designed for.' },
        { id: 'b', label: 'Block storage attached to one VM', correct: false, explanation: 'Every download would have to flow through that VM, and a single volume would struggle with the scale.' },
        { id: 'c', label: 'A file share mounted on every mobile device', correct: false, explanation: 'Mobile clients do not mount NFS or SMB shares over the internet; they speak HTTPS.' },
      ],
    },
    {
      id: 'models-kc-2',
      type: 'single-choice',
      prompt: 'Why is object storage a poor fit for a relational database’s data files?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish block, file, and object storage by how data is addressed and accessed',
      options: [
        { id: 'a', label: 'Objects cannot be updated in place, but databases constantly rewrite small parts of large files', correct: true, explanation: 'Correct — rewriting a whole multi-gigabyte object for each small change would be prohibitively slow.' },
        { id: 'b', label: 'Object storage is not durable', correct: false, explanation: 'Object storage is highly durable; the mismatch is the access pattern, not durability.' },
        { id: 'c', label: 'Object storage cannot hold large files', correct: false, explanation: 'Objects can be very large; size is not the problem.' },
      ],
    },
  ],
};

const howBlockStorageWorks: Lesson = {
  id: 'how-block-storage-works',
  title: 'How Block Storage Works',
  kind: 'concept',
  learningObjectives: [
    'Explain how a network-attached block volume appears to a VM as a local disk',
    'Describe the zone scope and attachment model of cloud block volumes',
  ],
  sections: [
    {
      heading: 'A disk that is not in the server',
      blocks: [
        {
          type: 'paragraph',
          text: 'A cloud block volume looks to the VM’s operating system exactly like a physical disk: a range of blocks it can read and write by offset. The OS formats it with a filesystem (ext4, XFS, NTFS) and from then on applications see ordinary files. Behind the scenes, those block reads and writes travel over the provider’s storage network to a replicated storage service — which is why the volume survives a host failure and can be detached and attached to another VM.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'The application writes to a file',
            'The VM’s filesystem translates that into writes to specific blocks',
            'The virtual disk driver sends the block writes over the storage network',
            'The storage service writes the blocks to multiple replicas before acknowledging',
          ],
        },
      ],
    },
    {
      heading: 'Scope and attachment',
      blocks: [
        {
          type: 'list',
          items: [
            'Volumes are zonal by default: the volume and the VM it attaches to must be in the same zone, and the volume’s replicas live in that zone',
            'A volume is normally attached to one VM; multi-attach exists on some volume types for clustered software that coordinates its own writes — ordinary filesystems will corrupt if two VMs mount the same volume read-write',
            'Capacity is provisioned up front; you pay for the provisioned size whether or not it is full',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Do not confuse network block volumes with local instance storage. Local NVMe disks on some VM sizes are physically in the host — very fast, but their contents are lost when the VM stops or moves. Only network-attached volumes persist independently of the host.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'block-kc-1',
      type: 'single-choice',
      prompt: 'Two VMs mount the same block volume read-write with an ordinary filesystem such as ext4. What is the likely result?',
      difficulty: 'intermediate',
      learningObjective: 'Describe the zone scope and attachment model of cloud block volumes',
      options: [
        { id: 'a', label: 'Filesystem corruption, because neither OS knows the other is changing the same blocks', correct: true, explanation: 'Correct — each kernel caches and writes metadata independently. Shared access needs a file share or a cluster-aware filesystem.' },
        { id: 'b', label: 'Both VMs see each other’s changes immediately and safely', correct: false, explanation: 'Ordinary filesystems assume exclusive ownership of the disk.' },
        { id: 'c', label: 'The provider merges their writes', correct: false, explanation: 'Block storage has no notion of files to merge — it only stores the blocks it is told to.' },
      ],
    },
  ],
};

const blockPerformance: Lesson = {
  id: 'block-storage-performance',
  title: 'Storage Performance: IOPS, Throughput, and Latency',
  kind: 'concept',
  learningObjectives: [
    'Define IOPS, throughput, and latency and how they relate',
    'Identify the volume-level and VM-level limits that cap storage performance',
  ],
  sections: [
    {
      heading: 'Three different measures',
      blocks: [
        {
          type: 'list',
          items: [
            'IOPS (input/output operations per second): how many read or write operations complete each second — what matters for many small random operations, such as a database',
            'Throughput: how many bytes move per second — what matters for large sequential transfers, such as a backup or analytics scan',
            'Latency: how long one operation takes to complete — what users feel on every query',
          ],
        },
        {
          type: 'code',
          code: 'throughput = IOPS × I/O size\n\n10,000 IOPS × 4 KiB   ≈  40 MiB/s   (small random I/O: IOPS-bound)\n   500 IOPS × 1 MiB   ≈ 500 MiB/s   (large sequential I/O: throughput-bound)',
          caption: 'The same volume can be IOPS-bound or throughput-bound depending on the I/O size of the workload.',
        },
      ],
    },
    {
      heading: 'Two ceilings, not one',
      blocks: [
        {
          type: 'paragraph',
          text: 'A volume’s performance is limited by its type and configuration — some volume types scale IOPS and throughput with size, others let you provision them independently of size. But the VM also has its own storage limits, set by its size. The effective limit is whichever ceiling is lower. Attaching a very fast volume to a small VM buys nothing beyond the VM’s cap.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A common diagnosis mistake: upgrading the disk when the VM’s storage bandwidth limit is the actual bottleneck. Check both limits in the provider’s documentation for the VM size and volume type you use.',
        },
      ],
    },
    {
      heading: 'Choosing a volume type',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Volume class', 'Optimised for', 'Typical workload'],
          rows: [
            ['HDD-backed', 'Lowest cost per GB, sequential throughput', 'Infrequent access, large sequential reads'],
            ['General-purpose SSD', 'Balanced price and performance', 'Boot disks, most applications'],
            ['Provisioned high-performance SSD', 'High, consistent IOPS and low latency', 'Production databases'],
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'perf-kc-1',
      type: 'scenario',
      prompt:
        'A database VM is slow. Its volume is provisioned for far more IOPS than the database uses, but monitoring shows storage operations queuing. What should you check next?',
      difficulty: 'advanced',
      learningObjective: 'Identify the volume-level and VM-level limits that cap storage performance',
      options: [
        { id: 'a', label: 'The VM size’s own storage IOPS and throughput limits', correct: true, explanation: 'Correct — the effective limit is the lower of the volume’s and the VM’s limits.' },
        { id: 'b', label: 'Nothing — a fast volume guarantees fast storage', correct: false, explanation: 'A fast volume is capped by the VM it is attached to.' },
        { id: 'c', label: 'Switch to object storage', correct: false, explanation: 'Object storage does not fit a database’s random-access pattern.' },
      ],
    },
  ],
};

const snapshotsAndBackup: Lesson = {
  id: 'snapshots-and-backup',
  title: 'Snapshots, Backup, and Recovery',
  kind: 'concept',
  learningObjectives: [
    'Distinguish replication, snapshots, and backups by what each protects against',
    'Explain crash-consistent versus application-consistent snapshots',
  ],
  sections: [
    {
      heading: 'Replication is not backup',
      blocks: [
        {
          type: 'paragraph',
          text: 'A replicated volume protects against hardware failure: if a drive dies, another replica has the data. It does nothing against deletion, corruption, or ransomware — those changes are replicated faithfully to every copy within milliseconds. Recovering from them needs a point-in-time copy taken before the damage.',
        },
        {
          type: 'comparisonTable',
          headers: ['Mechanism', 'Protects against', 'Does not protect against'],
          rows: [
            ['Replication', 'Drive and node failure', 'Deletion, corruption, ransomware'],
            ['Snapshot', 'Mistakes after the snapshot was taken', 'Loss of the snapshot’s own storage or account'],
            ['Backup in a separate account or region', 'Most failures, including account compromise', 'Data changed since the last backup'],
          ],
        },
      ],
    },
    {
      heading: 'How cloud snapshots work',
      blocks: [
        {
          type: 'paragraph',
          text: 'A volume snapshot captures the volume’s blocks at a point in time. Cloud snapshots are typically incremental: after the first, each snapshot stores only blocks that changed, while still restoring to a complete volume. Snapshots are stored by the provider outside the volume itself and can be copied to other regions.',
        },
        {
          type: 'list',
          items: [
            'Crash-consistent: the volume as it would be after a sudden power loss. Filesystems and databases can usually recover, but in-flight writes in memory are lost',
            'Application-consistent: the application is told to flush and pause writes (for example via VSS on Windows or filesystem freeze on Linux) so the snapshot captures a clean state',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A backup you have never restored is a hypothesis. Restore tests are the only proof that backups contain what you think they do and that recovery fits within your RTO.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'backup-kc-1',
      type: 'single-choice',
      prompt: 'Ransomware encrypts files on a zone-redundant volume. Which mechanism lets you recover?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish replication, snapshots, and backups by what each protects against',
      options: [
        { id: 'a', label: 'A snapshot or backup taken before the encryption', correct: true, explanation: 'Correct — a point-in-time copy from before the attack is the only clean source.' },
        { id: 'b', label: 'Zone redundancy, because the other zones still have the data', correct: false, explanation: 'Every replica received the encrypted blocks as they were written.' },
        { id: 'c', label: 'Detaching the volume', correct: false, explanation: 'Detaching stops further damage but does not undo what was already written.' },
      ],
    },
  ],
};

const azureManagedDisks: Lesson = {
  id: 'azure-managed-disks',
  title: 'Azure Managed Disks',
  kind: 'provider',
  providerId: 'azure',
  learningObjectives: ['Map Azure Managed Disks onto the block storage model'],
  sections: [
    {
      heading: 'Disk types and redundancy',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Managed Disks are block volumes managed by the platform and attached to VMs. Disk types range from Standard HDD and Standard SSD to Premium SSD, Premium SSD v2, and Ultra Disk; some tie performance to disk size, while Premium SSD v2 and Ultra Disk let you provision IOPS and throughput separately from capacity. Disks use locally redundant storage (LRS) by default, and some types offer zone-redundant storage (ZRS), which replicates a disk across zones so it can be attached to a VM in another zone if its zone fails.',
        },
        {
          type: 'paragraph',
          text: 'Snapshots are incremental and can be copied across regions; Azure Backup adds scheduled, application-consistent backups with retention policies. Shared disks allow attaching one disk to multiple VMs for cluster-aware software.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Managed Disks',
    keyFeatures: [
      'Standard HDD, Standard SSD, Premium SSD, Premium SSD v2, and Ultra Disk types',
      'Locally redundant (LRS) or, on supported types, zone-redundant (ZRS) disks',
      'Incremental snapshots and integration with Azure Backup',
      'Shared disks for cluster-aware workloads',
    ],
    terminology: {
      'Block volume': 'Managed disk',
      'Volume type': 'Disk type / SKU',
      'Point-in-time copy': 'Snapshot',
    },
    architecturalNotes: [
      'ZRS disks are an Azure-specific option: the disk itself survives a zone failure and can be reattached to a VM in another zone',
      'Effective performance is capped by the VM size’s disk IOPS and throughput limits as well as by the disk',
    ],
    limitations: ['ZRS is not available for every disk type or in every region', 'Disk type availability varies by region'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machines/managed-disks-overview',
  },
};

const awsEbs: Lesson = {
  id: 'aws-ebs',
  title: 'Amazon EBS',
  kind: 'provider',
  providerId: 'aws',
  learningObjectives: ['Map Amazon EBS onto the block storage model'],
  sections: [
    {
      heading: 'Volume types and scope',
      blocks: [
        {
          type: 'paragraph',
          text: 'Amazon Elastic Block Store (EBS) provides block volumes for EC2 instances. Each volume lives in one Availability Zone and is replicated within that AZ; it can only attach to instances in the same AZ. Volume types include General Purpose SSD (gp3, which lets you set IOPS and throughput independently of size, and the older gp2), Provisioned IOPS SSD (io1, io2), and HDD-backed Throughput Optimized (st1) and Cold (sc1). io1 and io2 support Multi-Attach for cluster-aware applications.',
        },
        {
          type: 'paragraph',
          text: 'EBS snapshots are incremental and stored by AWS at the Region level, so a volume can be restored from a snapshot into any AZ in the Region — the standard way to move a volume across AZs. Snapshots can be copied to other Regions.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon Elastic Block Store (EBS)',
    keyFeatures: [
      'gp3, gp2, io1, io2, st1, and sc1 volume types',
      'AZ-scoped volumes replicated within their AZ',
      'Incremental snapshots stored at the Region level',
      'Multi-Attach on io1 and io2',
    ],
    terminology: {
      'Block volume': 'EBS volume',
      'Volume type': 'Volume type (gp3, io2, …)',
      'Point-in-time copy': 'EBS snapshot',
    },
    architecturalNotes: [
      'There is no zone-redundant EBS volume; resilience to an AZ failure comes from snapshots or from application-level replication across AZs',
      'Instance EBS bandwidth limits cap performance regardless of the volume’s provisioned IOPS',
    ],
    limitations: ['A volume can attach only to instances in its own AZ'],
    documentationUrl: 'https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html',
  },
};

const blockComparison: Lesson = {
  id: 'block-storage-comparison',
  title: 'Comparison: Azure Managed Disks vs. Amazon EBS',
  kind: 'comparison',
  learningObjectives: ['Compare Azure Managed Disks and Amazon EBS, including their different answers to zone failure'],
  sections: [
    {
      heading: 'Where they differ architecturally',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Dimension', 'Azure Managed Disks', 'Amazon EBS'],
          rows: [
            ['Default redundancy', 'LRS', 'Replicated within the volume’s AZ'],
            ['Surviving a zone failure', 'ZRS disks (supported types and regions) can reattach in another zone', 'Restore from a snapshot in another AZ, or replicate at the application level'],
            ['Performance decoupled from size', 'Premium SSD v2 and Ultra Disk', 'gp3, io1, io2'],
            ['Multi-VM attach', 'Shared disks', 'Multi-Attach (io1, io2)'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The zone-failure row is the meaningful architectural difference. An Azure design that relies on ZRS disks has no direct EBS equivalent; on AWS the same goal is met with replication between instances in different AZs or with snapshot-based recovery, which has a non-zero recovery point.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'block-compare-kc-1',
      type: 'single-choice',
      prompt: 'An Azure design uses a ZRS managed disk so a VM can be rebuilt in another zone with no data loss. What is the closest accurate AWS approach?',
      difficulty: 'advanced',
      learningObjective: 'Compare Azure Managed Disks and Amazon EBS, including their different answers to zone failure',
      options: [
        { id: 'a', label: 'Replicate data at the application level to an instance in another AZ (or accept the recovery point of snapshot restores)', correct: true, explanation: 'Correct — EBS volumes are AZ-scoped, so cross-AZ resilience comes from the application or from snapshots.' },
        { id: 'b', label: 'Choose the zone-redundant EBS volume type', correct: false, explanation: 'EBS has no zone-redundant volume type.' },
        { id: 'c', label: 'Use instance store', correct: false, explanation: 'Instance store is lost when the instance stops; it is less durable, not more.' },
      ],
    },
  ],
};

export const blockStorage: ConceptMeta = {
  id: 'block-storage',
  title: 'Block Storage',
  description:
    'Low-level storage volumes attached to compute instances, including IOPS/throughput characteristics, durability and replication options, and lifecycle management.',
  status: 'available',
  learningObjectives: [
    'Distinguish block, file, and object storage and match workloads to each',
    'Explain how network-attached block volumes work, including their zone scope',
    'Reason about IOPS, throughput, latency, and the limits that cap them',
    'Use snapshots and backups appropriately, and compare Azure Managed Disks with Amazon EBS',
  ],
  prerequisites: ['virtual-machines'],
  relatedConcepts: ['object-storage', 'file-storage', 'virtual-machines', 'regions-and-availability-zones'],
  estimatedMinutes: 75,
  lessons: [storageModels, howBlockStorageWorks, blockPerformance, snapshotsAndBackup, azureManagedDisks, awsEbs, blockComparison],
};
