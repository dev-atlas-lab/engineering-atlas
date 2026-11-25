import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { vmArchitectureScene } from './virtual-machines.scenes';
import { vmResourceAllocationSimulation } from './simulations';
import { renderVmAllocationState } from './vm-allocation-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const introduction: LessonBody = {
  learningObjectives: [
    'Define what a virtual machine is and the problem it solves',
    'Explain why organizations use VMs instead of dedicated physical servers',
  ],
  analogy:
    'A virtual machine is like an apartment building: one physical structure (the host) is divided into independent, lockable units (VMs) that each tenant experiences as a private home, even though every unit shares the same foundation, plumbing, and walls underneath.',
  sections: [
    {
      heading: 'What a virtual machine is',
      blocks: [
        {
          type: 'paragraph',
          text: 'A virtual machine (VM) is a software-based emulation of a physical computer. It has its own virtual CPU, memory, storage, and network interface, and it runs a complete guest operating system that behaves as if it owns dedicated hardware. A layer of software called a hypervisor is what makes this illusion possible — it schedules multiple VMs onto one physical host and enforces isolation between them.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'A VM is not a lightweight trick — it boots a full operating system kernel, complete with its own device drivers, just like a physical machine would. That completeness is exactly what makes VMs flexible and what makes containers (a later concept) lighter weight by comparison.',
        },
      ],
    },
    {
      heading: 'Why virtual machines exist',
      blocks: [
        {
          type: 'paragraph',
          text: 'Before widespread virtualization, one physical server typically ran one application, because operating systems assumed they owned the whole machine. Measured utilization on those servers was often in the 10-15% range — most of the CPU and memory sat idle most of the time.',
        },
        {
          type: 'list',
          items: [
            'Server consolidation: many VMs share one physical host, driving utilization far above what single-application servers achieved',
            'Workload isolation without separate hardware: a crash or compromise in one VM does not directly affect another VM on the same host',
            'Elasticity: a VM can be resized, cloned, or moved to different physical hardware without the workload noticing',
            'Faster provisioning: creating a VM from an image takes minutes; procuring and racking a physical server takes weeks',
          ],
        },
      ],
    },
    {
      heading: 'When a VM is the right abstraction',
      blocks: [
        {
          type: 'paragraph',
          text: 'Use a VM when a workload needs full control over its operating system: custom kernel modules, a specific OS version or patch level, or software that was never designed to share a kernel with other tenants. VMs are also the natural landing point for "lift and shift" migrations of on-premises workloads, since the guest OS does not need to change.',
        },
        {
          type: 'paragraph',
          text: 'A VM is not always the right abstraction. If a workload just needs to run one process efficiently and start quickly, a container shares the host kernel and starts in a fraction of the time. If the workload only needs to run in response to events with no idle server to manage at all, serverless functions remove the server concept entirely. Both are covered as their own concepts next — the comparison matters more once their internals are understood.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'intro-kc-1',
      type: 'single-choice',
      prompt: 'What makes a virtual machine different from a physical server, architecturally?',
      difficulty: 'beginner',
      learningObjective: 'Define what a virtual machine is and the problem it solves',
      options: [
        {
          id: 'a',
          label: 'A VM runs a full guest OS on hardware resources presented by a hypervisor, rather than on real hardware directly',
          correct: true,
          explanation: 'Correct. The hypervisor virtualizes the hardware; the guest OS inside the VM is unaware it is sharing a physical host.',
        },
        {
          id: 'b',
          label: 'A VM does not run a full operating system, only the application process',
          correct: false,
          explanation: 'That describes a container, not a VM. A VM boots a complete guest OS, including its own kernel.',
        },
        {
          id: 'c',
          label: 'A VM is a physical server dedicated entirely to one customer',
          correct: false,
          explanation: 'A dedicated physical server is not virtualized at all — it has no hypervisor layer sharing it among guests.',
        },
      ],
    },
  ],
  furtherReading: [
    { label: 'Azure Virtual Machines overview', url: 'https://learn.microsoft.com/en-us/azure/virtual-machines/overview' },
    { label: 'Amazon EC2 concepts', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html' },
  ],
};

const virtualizationFundamentals: LessonBody = {
  learningObjectives: [
    'Explain how a hypervisor shares one physical host among multiple isolated guest operating systems',
    'Distinguish Type 1 (bare-metal) hypervisors from Type 2 (hosted) hypervisors',
  ],
  sections: [
    {
      heading: 'The hypervisor’s job',
      blocks: [
        {
          type: 'paragraph',
          text: 'A hypervisor sits between physical hardware and guest operating systems. It intercepts privileged instructions a guest OS tries to execute (like directly addressing memory or I/O devices) and emulates them safely, so each guest believes it has exclusive access to CPU, memory, storage, and network — when in reality those resources are time-sliced and partitioned across every VM on the host.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Scheduling: the hypervisor decides which VM’s virtual CPU runs on a physical core at any given moment',
            'Memory management: each VM gets an address space mapped to physical memory the hypervisor controls, so one VM cannot read another’s memory',
            'Device emulation or pass-through: virtual network and storage devices are presented to the guest, backed by real hardware the hypervisor arbitrates',
            'Isolation enforcement: a fault or compromise inside one guest OS cannot cross the hypervisor boundary into another guest',
          ],
        },
      ],
    },
    {
      heading: 'Type 1 vs. Type 2 hypervisors',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Type 1 (bare-metal) hypervisor runs directly on physical hardware with no general-purpose host OS underneath it — this is what every major public cloud uses for VM hosting, because it minimizes overhead and attack surface. A Type 2 (hosted) hypervisor runs as an application on top of a conventional OS (for example, a desktop virtualization tool running on Windows or macOS) — convenient for development, but not how production cloud compute works.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'Type 1 (bare-metal)', 'Type 2 (hosted)'],
          rows: [
            ['Runs on', 'Hardware directly', 'A general-purpose host OS'],
            ['Typical use', 'Production cloud VM hosts', 'Local developer virtualization'],
            ['Overhead', 'Lower — no host OS layer to traverse', 'Higher — every I/O passes through the host OS too'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Public cloud providers all use Type 1 hypervisors at the host level. Azure’s compute fleet runs on a hypervisor derived from Hyper-V; modern AWS EC2 instances run on the Nitro Hypervisor, a lightweight KVM-based Type 1 hypervisor paired with dedicated Nitro Cards that offload networking, storage, and security functions away from the main host CPU entirely. The provider-specific lessons later in this concept return to this distinction.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'virt-kc-1',
      type: 'single-choice',
      prompt: 'Why do public cloud providers use Type 1 hypervisors instead of Type 2?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish Type 1 (bare-metal) hypervisors from Type 2 (hosted) hypervisors',
      options: [
        {
          id: 'a',
          label: 'Type 1 hypervisors run directly on hardware, avoiding the overhead and attack surface of a general-purpose host OS',
          correct: true,
          explanation: 'Correct — removing the host-OS layer reduces latency for every guest I/O operation and shrinks what an attacker could compromise.',
        },
        {
          id: 'b',
          label: 'Type 2 hypervisors cannot run Linux guests',
          correct: false,
          explanation: 'Guest OS compatibility is not the distinguishing factor between the two hypervisor types.',
        },
        {
          id: 'c',
          label: 'Type 1 hypervisors are easier to install on a laptop',
          correct: false,
          explanation: 'The opposite is generally true — Type 2 hypervisors are the ones designed for easy installation on an existing desktop OS.',
        },
      ],
    },
  ],
  furtherReading: [
    { label: 'Azure Hypervisor generation overview', url: 'https://learn.microsoft.com/en-us/azure/virtual-machines/generation-2' },
  ],
};

const vmArchitecture: LessonBody = {
  learningObjectives: [
    'Describe how a host’s physical resources are partitioned and presented to guest VMs',
    'Explain why one VM cannot see or affect another VM on the same host',
  ],
  sections: [
    {
      heading: 'Walking through allocation',
      blocks: [
        {
          type: 'paragraph',
          text: 'Step through the diagram below. It starts with an idle host running only the hypervisor, then allocates two VMs in sequence — notice that the host’s total capacity (16 vCPU / 64 GB in this example) only ever decreases as VMs are added; it is never shared dynamically between running VMs unless the platform explicitly supports overcommit, which production VM platforms generally avoid for predictability.',
        },
      ],
    },
    {
      heading: 'What isolation actually means here',
      blocks: [
        {
          type: 'list',
          items: [
            'Each VM gets its own virtual CPU, backed by time-sliced access to physical cores the hypervisor schedules',
            'Each VM’s memory is mapped to a dedicated physical range the hypervisor controls — VM 2 has no addressing path into VM 1’s memory',
            'Storage is presented as one or more virtual disks, typically backed by network-attached block storage rather than the host’s local disk, so a VM can be moved to a different host without losing its data',
            'Networking is presented through a virtual network interface, connected to the hypervisor’s virtual switch, which enforces which VMs can reach which networks',
          ],
        },
      ],
    },
  ],
  visualization: vmArchitectureScene,
  knowledgeCheck: [
    {
      id: 'arch-kc-1',
      type: 'scenario',
      prompt:
        'A host has 16 vCPU and 64 GB total. Three VMs are already running, consuming 12 vCPU and 48 GB combined. A fourth VM request asks for 4 vCPU and 8 GB. What happens, assuming no overcommit?',
      difficulty: 'intermediate',
      learningObjective: 'Describe how a host’s physical resources are partitioned and presented to guest VMs',
      options: [
        {
          id: 'a',
          label: 'It is granted — 4 vCPU and 16 GB remain, which covers the 4 vCPU / 8 GB request',
          correct: true,
          explanation: 'Correct. 16 - 12 = 4 vCPU free and 64 - 48 = 16 GB free, both enough to satisfy the request.',
        },
        {
          id: 'b',
          label: 'It is rejected because three VMs are already the maximum per host',
          correct: false,
          explanation: 'There is no fixed VM-count ceiling here — capacity is constrained by vCPU and memory, not by how many VMs already exist.',
        },
        {
          id: 'c',
          label: 'It is rejected because memory is exhausted',
          correct: false,
          explanation: '48 GB used out of 64 GB leaves 16 GB free, which is more than the 8 GB the new VM needs.',
        },
      ],
    },
  ],
};

const computeMemoryStorage: LessonBody = {
  learningObjectives: [
    'Explain the trade-offs involved in choosing a VM size',
    'Distinguish network-attached block storage from local/ephemeral instance storage',
  ],
  sections: [
    {
      heading: 'Choosing vCPU and memory',
      blocks: [
        {
          type: 'paragraph',
          text: 'Both major clouds group VM sizes into families tuned for different workload shapes rather than offering arbitrary vCPU/memory combinations: general-purpose (balanced vCPU-to-memory ratio), compute-optimized (more vCPU per GB, for CPU-bound workloads), memory-optimized (more GB per vCPU, for databases and in-memory caches), and burstable (a baseline vCPU allocation that can burst above baseline using accumulated credits, for workloads that are mostly idle with occasional spikes).',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Oversizing is the most common and most expensive VM mistake. A VM is billed for the capacity it reserves, not the capacity it uses — an 8 vCPU VM running at 10% utilization costs the same as one running at 90%.',
        },
      ],
    },
    {
      heading: 'Local vs. network-attached storage',
      blocks: [
        {
          type: 'paragraph',
          text: 'A VM’s primary (boot) disk is almost always network-attached block storage, physically separate from the host and replicated for durability — this is what allows a VM to be restarted on a different physical host after a hardware failure without losing its disk contents. Some VM sizes additionally expose local/ephemeral storage: NVMe or SSD capacity physically attached to that specific host, offering much higher throughput and lower latency, but lost entirely if the VM moves to different hardware or stops.',
        },
        {
          type: 'list',
          items: [
            'Use network-attached storage for anything that must survive a host failure or a VM resize/move — operating system disks, databases, persistent application data',
            'Use local/ephemeral storage only for data that can be regenerated or is explicitly disposable — scratch space, local caches, temporary build artifacts',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'cms-kc-1',
      type: 'single-choice',
      prompt: 'A database VM is resized and happens to move to new physical hardware. What happens to its data, and why?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish network-attached block storage from local/ephemeral instance storage',
      options: [
        {
          id: 'a',
          label: 'Data on the network-attached boot/data disk survives, because the disk is not physically tied to the original host',
          correct: true,
          explanation: 'Correct — network-attached block storage lives independently of any one physical host, which is exactly why it is the right choice for persistent data.',
        },
        {
          id: 'b',
          label: 'All data is lost, because every VM disk is physically attached to its original host',
          correct: false,
          explanation: 'This would only be true for local/ephemeral storage, not the network-attached disks a database should be using.',
        },
        {
          id: 'c',
          label: 'Data survives only if the VM was backed up first',
          correct: false,
          explanation: 'Backups protect against deletion or corruption, but surviving a hardware move is a property of network-attached storage itself, independent of backups.',
        },
      ],
    },
  ],
};

const vmNetworkingAndSecurity: LessonBody = {
  learningObjectives: [
    'Describe how a VM attaches to a virtual network and how traffic to it is controlled',
  ],
  sections: [
    {
      heading: 'The network interface',
      blocks: [
        {
          type: 'paragraph',
          text: 'A VM reaches the network through a virtual network interface — logically equivalent to a physical NIC, but implemented in software by the hypervisor’s virtual switch. The interface is placed inside a subnet of a virtual network, which determines its private IP address range and which other resources it can reach by default.',
        },
      ],
    },
    {
      heading: 'Controlling traffic',
      blocks: [
        {
          type: 'paragraph',
          text: 'Traffic to and from a VM is filtered by a stateful, rule-based firewall attached at the network interface or subnet level — allow/deny rules evaluated by source/destination IP, port, and protocol. This is covered in depth in the Networking and Security categories; what matters here is that network access control for a VM is enforced outside the guest OS, by the platform, not solely by firewall software running inside the VM.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'net-kc-1',
      type: 'single-choice',
      prompt: 'Where is a VM’s network traffic filtered, by default?',
      difficulty: 'beginner',
      learningObjective: 'Describe how a VM attaches to a virtual network and how traffic to it is controlled',
      options: [
        {
          id: 'a',
          label: 'At the platform level, by rules attached to the network interface or subnet',
          correct: true,
          explanation: 'Correct — this is enforced independently of whatever firewall software (if any) runs inside the guest OS.',
        },
        {
          id: 'b',
          label: 'Only by firewall software installed inside the guest OS',
          correct: false,
          explanation: 'Guest-level firewalls are an additional layer, not the platform’s primary enforcement point.',
        },
        {
          id: 'c',
          label: 'VM traffic is not filtered unless a third-party appliance is installed',
          correct: false,
          explanation: 'Every major cloud provides a platform-level network filtering mechanism as a default building block.',
        },
      ],
    },
  ],
};

const azureVirtualMachines: LessonBody = {
  learningObjectives: ['Map Azure’s VM-specific terminology and resiliency features onto the concepts already covered'],
  sections: [
    {
      heading: 'Sizing and images',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure organizes VM sizes into series such as B (burstable), D (general purpose), F (compute-optimized), and E (memory-optimized), each available in multiple size tiers. A VM is created from an image — either a Microsoft- or publisher-provided marketplace image, or a custom image captured from an existing VM and stored in an Azure Compute Gallery for reuse across deployments.',
        },
      ],
    },
    {
      heading: 'Resiliency building blocks',
      blocks: [
        {
          type: 'list',
          items: [
            'Availability Set — groups VMs across distinct fault domains (separate power/network within one datacenter) and update domains (separate maintenance windows), reducing the chance that planned maintenance or a single hardware fault takes down every instance of an application at once',
            'Availability Zone — a physically separate datacenter facility within the same region with independent power and cooling, offering stronger isolation than an Availability Set',
            'Virtual Machine Scale Set (VMSS) — manages a group of identical, load-balanced VMs and can automatically add or remove instances based on demand',
          ],
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Virtual Machines',
    keyFeatures: [
      'VM series tuned for burstable, general-purpose, compute-optimized, and memory-optimized workloads',
      'Availability Sets and Availability Zones for resiliency within a region',
      'Virtual Machine Scale Sets for automatic horizontal scaling of identical VMs',
      'Managed Disks for network-attached block storage with built-in replication',
    ],
    terminology: {
      'Virtual machine': 'Virtual Machine (VM)',
      'Machine image': 'VM image / Azure Compute Gallery image',
      'Auto-scaling group': 'Virtual Machine Scale Set (VMSS)',
      'Block storage volume': 'Managed Disk',
      'Network interface': 'Network Interface Card (NIC)',
    },
    architecturalNotes: [
      'The underlying hypervisor is derived from Hyper-V, a Type 1 hypervisor',
      'Availability Sets and Availability Zones are distinct, composable resiliency mechanisms — a deployment can use either or both',
    ],
    limitations: [
      'Resizing a running VM to a size in a different hardware cluster may require a stop/start cycle',
      'Not every VM size is available in every region — size availability varies regionally',
    ],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/virtual-machines/overview',
  },
};

const awsEc2: LessonBody = {
  learningObjectives: ['Map AWS EC2’s terminology and resiliency features onto the concepts already covered'],
  sections: [
    {
      heading: 'Instance types and AMIs',
      blocks: [
        {
          type: 'paragraph',
          text: 'EC2 organizes instance types into families such as T (burstable), M (general purpose), C (compute-optimized), and R (memory-optimized). An instance launches from an Amazon Machine Image (AMI) — a template containing the OS, any pre-installed software, and launch permissions — which can be an AWS-provided, marketplace, or custom AMI.',
        },
      ],
    },
    {
      heading: 'Resiliency building blocks',
      blocks: [
        {
          type: 'list',
          items: [
            'Availability Zone — EC2 instances are always launched into a specific AZ within a Region; spreading instances across multiple AZs is the primary resiliency pattern',
            'Placement Group — controls physical placement of instances relative to each other: cluster (packed close together for low-latency networking), spread (placed on distinct underlying hardware to minimize simultaneous failure), or partition (grouped into logical partitions that do not share underlying hardware, common for large distributed workloads)',
            'Auto Scaling Group (ASG) — manages a group of instances and automatically launches or terminates them based on demand or health checks',
          ],
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon EC2 (Elastic Compute Cloud)',
    keyFeatures: [
      'Instance families tuned for burstable, general-purpose, compute-optimized, and memory-optimized workloads',
      'Placement groups for controlling physical proximity between instances',
      'Auto Scaling Groups for automatic horizontal scaling',
      'EBS (Elastic Block Store) volumes for network-attached block storage, plus optional local instance store on supported types',
    ],
    terminology: {
      'Virtual machine': 'Instance',
      'Machine image': 'Amazon Machine Image (AMI)',
      'Auto-scaling group': 'Auto Scaling Group (ASG)',
      'Block storage volume': 'EBS (Elastic Block Store) volume',
      'Network interface': 'Elastic Network Interface (ENI)',
    },
    architecturalNotes: [
      'Modern instance types (most current generations) run on the AWS Nitro System — a lightweight, KVM-based Type 1 hypervisor combined with dedicated Nitro Cards that offload networking, storage, and security processing away from the host CPU entirely',
      'Some instance types additionally expose local NVMe instance store, which is physically attached and lost if the instance stops or moves — distinct from EBS',
    ],
    limitations: [
      'Instance store data does not persist through a stop/start cycle, only through a reboot',
      'Not every instance type is available in every Availability Zone within a Region',
    ],
    documentationUrl: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html',
  },
};

const architectureComparison: LessonBody = {
  learningObjectives: ['Compare Azure VMs and EC2 across architecture, resiliency, and storage without treating either as a drop-in equivalent'],
  sections: [
    {
      heading: 'Where they are genuinely equivalent',
      blocks: [
        {
          type: 'paragraph',
          text: 'Both services are the same underlying concept — on-demand, hypervisor-backed VMs billed for reserved capacity, organized into size/type families, launched from a reusable image, and attachable to network-attached block storage. An engineer who understands VM architecture (this concept) can read either provider’s documentation and recognize the same ideas under different names.',
        },
      ],
    },
    {
      heading: 'Where the architecture genuinely differs',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Dimension', 'Azure', 'AWS'],
          rows: [
            ['Resiliency grouping', 'Availability Set (fault/update domains) and Availability Zone are separate, composable mechanisms', 'Availability Zone placement plus Placement Groups (cluster/spread/partition) control physical proximity directly'],
            ['Hypervisor', 'Hyper-V-derived Type 1 hypervisor', 'Nitro System: lightweight KVM-based hypervisor with dedicated offload hardware (Nitro Cards)'],
            ['Scaling unit', 'Virtual Machine Scale Set', 'Auto Scaling Group'],
            ['Local ephemeral storage', 'Available on select VM sizes as "temporary storage"', 'Available on select instance types as "instance store" (NVMe)'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Treating Availability Sets and Placement Groups as the same thing is a common but inaccurate shortcut. An Availability Set groups VMs to reduce correlated failure; a Placement Group’s cluster mode does the opposite for performance — it deliberately packs instances close together. They solve related but not identical problems.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'compare-kc-1',
      type: 'single-choice',
      prompt: 'Which statement accurately compares Azure and AWS VM resiliency mechanisms?',
      difficulty: 'advanced',
      learningObjective: 'Compare Azure VMs and EC2 across architecture, resiliency, and storage without treating either as a drop-in equivalent',
      options: [
        {
          id: 'a',
          label: 'Azure Availability Sets and AWS cluster Placement Groups solve different problems, even though both describe how VMs relate physically to each other',
          correct: true,
          explanation: 'Correct — an Availability Set spreads VMs apart to reduce correlated failure, while a cluster Placement Group intentionally packs instances together for network performance.',
        },
        {
          id: 'b',
          label: 'Azure Availability Sets and AWS Placement Groups are functionally identical, just named differently',
          correct: false,
          explanation: 'They are not identical — their default intents (spreading apart for resiliency vs. packing together for performance) point in different directions.',
        },
        {
          id: 'c',
          label: 'Only AWS offers a mechanism for controlling VM placement relative to other VMs',
          correct: false,
          explanation: 'Azure Availability Sets and Availability Zones also control placement, just with different grouping semantics.',
        },
      ],
    },
  ],
};

const vmResourceAllocationLab: LabBody = {
  difficulty: 'beginner',
  estimatedTime: '15 minutes',
  description:
    'Request virtual machines against a fixed-capacity host and observe, deterministically, when requests are granted and when they are rejected for insufficient capacity.',
  learningObjectives: [
    'Predict whether a given sequence of VM requests will be granted or rejected against a fixed host capacity',
  ],
  prerequisites: [
    { type: 'concept', id: 'vm-architecture', label: 'VM Architecture', description: 'Understand how host capacity is partitioned across VMs.' },
  ],
  content: {
    simulationId: vmResourceAllocationSimulation.id,
    instructions: [
      { id: 'step-1', label: 'Set parameters', description: 'Choose how many VMs to request and the vCPU/memory size of each.' },
      { id: 'step-2', label: 'Step through requests', description: 'Use the timeline to step through each request one at a time and watch the host’s remaining capacity.' },
      { id: 'step-3', label: 'Find the rejection point', description: 'Increase the instance count until a request is rejected, and identify exactly which resource (vCPU or memory) ran out first.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'at-least-one-running',
        label: 'At least one VM is running',
        check: (state) => {
          const s = state as { instances: { status: string }[] };
          return s.instances.some((i) => i.status === 'running');
        },
      },
      {
        id: 'capacity-respected',
        label: 'Running VMs never exceed the host’s total vCPU capacity',
        check: (state) => {
          const s = state as { instances: { status: string; vCpu: number }[] };
          const used = s.instances.filter((i) => i.status === 'running').reduce((sum, i) => sum + i.vCpu, 0);
          return used <= 16;
        },
      },
      {
        id: 'all-resolved',
        label: 'Every requested VM has a definitive status (no request left pending)',
        check: (state) => {
          const s = state as { instances: { status: string }[] };
          return s.instances.every((i) => i.status === 'running' || i.status === 'rejected');
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'introduction-to-virtual-machines': introduction,
    'virtualization-fundamentals': virtualizationFundamentals,
    'vm-architecture': vmArchitecture,
    'compute-memory-and-storage-allocation': computeMemoryStorage,
    'vm-networking-and-security': vmNetworkingAndSecurity,
    'azure-virtual-machines': azureVirtualMachines,
    'aws-ec2': awsEc2,
    'architecture-comparison': architectureComparison,
  },
  labs: {
    'vm-resource-allocation-lab': vmResourceAllocationLab,
  },
  simulations: {
    'vm-resource-allocation-lab': bindSimulation(vmResourceAllocationSimulation, renderVmAllocationState),
  },
};
