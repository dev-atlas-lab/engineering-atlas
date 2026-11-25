# Cloud Fundamentals — Curriculum Coverage

This document records what the Cloud Fundamentals domain actually contains, what remains, and the rules that decide how content is labelled. It reflects the code at the end of Slice 2A; update it whenever a concept's content or status changes.

---

## Coverage checklist

The domain has 10 categories and 34 concepts. A concept is **Active** only when its lessons are authored and ready to use.

| Category | Concepts | Status | Slice |
|---|---|---|---|
| Cloud Computing Models | What Is Cloud Computing? · Cloud Service Models · Cloud Deployment Models | Coming soon | — |
| Global Infrastructure | Regions and Availability Zones · Data Centers and Edge Locations · Geographic Redundancy and Data Residency | **Active** | 2A |
| Compute | Virtual Machines · Containers · Serverless Functions | **Active** | 1 |
| Storage | Block Storage · Object Storage · File Storage | **Active** | 2A |
| Networking | Virtual Networks · Subnets and Routing · Connecting Networks · DNS and Content Delivery | **Active** | 2A |
| Identity and Access Management | Identity and Authentication · Authorization and Policies · Workload and Federated Identity | Coming soon | — |
| Security | Security Fundamentals · Encryption and Key Management · Network Security · Security Monitoring and Compliance | Coming soon | — |
| Load Balancing | Load Balancing Fundamentals · Application Load Balancing · Network Load Balancing · Global Traffic Distribution | Coming soon | — |
| Scalability and Reliability | Auto-Scaling · High Availability · Disaster Recovery | Coming soon | — |
| Monitoring and Observability | Observability Fundamentals · Metrics and Alerting · Logging · Distributed Tracing | Coming soon | — |

**Totals:** 13 Active concepts, 21 Coming soon, 0 In development.

### Remaining gaps

- Six categories (21 concepts) have no lessons yet.
- Serverless Functions (Slice 1) has no lab; Data Centers and Edge Locations has no lab. Both are Active, because a lab is optional where a concept does not naturally support one.
- Data Centers and Edge Locations maps to providers through a comparison lesson rather than separate Azure and AWS lessons, because the concept is about where provider services run rather than one service per provider.

---

## Slice 2A inventory

57 lessons, 40 knowledge-check questions, 8 labs, 10 visualizations, and 4 simulations across 10 concepts. Lesson kinds: concept (C), provider (P), comparison (X).

### Global Infrastructure

| Concept | Lessons | Visualization | Lab |
|---|---|---|---|
| Regions and Availability Zones | Regions and Availability Zones (C) · Regional, Zonal, and Global Resources (C) · Fault Domains and Failure Isolation (C) · Choosing Regions and Zones (C) · Azure Regions and Availability Zones (P) · AWS Regions and Availability Zones (P) · Comparison: Azure vs. AWS Zones (X) | Region and AZ explorer with zone-failure walkthrough | Survive a Zone Failure (simulation) |
| Data Centers and Edge Locations | Inside a Cloud Datacenter (C) · Edge Locations and Points of Presence (C) · Comparison: Azure and AWS Edge Networks (X) | Infrastructure hierarchy; edge cache miss/hit sequence | — |
| Geographic Redundancy and Data Residency | Why Spread Across Regions (C) · Multi-Region Replication and Failover (C) · Data Residency and Sovereignty (C) · Comparison: Azure Region Pairs vs. AWS Region Choice (X) | Multi-region failover with RPO/RTO walkthrough | Choose a Deployment Geography (challenge) |

### Storage

| Concept | Lessons | Visualization | Lab |
|---|---|---|---|
| Block Storage | Storage Models: Block, File, and Object (C) · How Block Storage Works (C) · Storage Performance: IOPS, Throughput, and Latency (C) · Snapshots, Backup, and Recovery (C) · Azure Managed Disks (P) · Amazon EBS (P) · Comparison (X) | Storage Model Explorer | — |
| Object Storage | How Object Storage Works (C) · Durability, Availability, and Replication (C) · Access Tiers and Lifecycle Management (C) · Securing Object Storage (C) · Azure Blob Storage (P) · Amazon S3 (P) · Comparison (X) | Object upload/download request flow | Replication and Durability (simulation) |
| File Storage | How Managed File Storage Works (C) · Choosing a Storage Model (C) · Azure Files (P) · Amazon EFS and Amazon FSx (P) · Comparison (X) | — | Storage Selection Challenge (challenge) |

The Storage Model Explorer lives in Block Storage, the first concept in the category, rather than in a new "Storage Fundamentals" concept. This keeps the approved three-concept consolidation for Storage; the other two concepts link back to it.

### Networking

| Concept | Lessons | Visualization | Lab |
|---|---|---|---|
| Virtual Networks | IP Addressing and CIDR Notation (C) · Subnets and Address Planning (C) · Virtual Network Architecture (C) · Network Security Rules and Firewalls (C) · Azure Virtual Network (P) · AWS VPC (P) · Comparison (X) | VNet/VPC architecture explorer | CIDR and Subnet Lab (simulation) |
| Subnets and Routing | How Routing Works (C) · Internet Access and NAT (C) · Public vs. Private Access (C) · Azure Routing and NAT (P) · AWS Routing and NAT (P) · Comparison (X) | Public vs. private access explorer | Packet Routing Lab (simulation) |
| Connecting Networks | Peering and Hub-and-Spoke Topologies (C) · Hybrid and Private Connectivity (C) · Azure Network Connectivity (P) · AWS Network Connectivity (P) · Comparison (X) | Hub-and-spoke peering and transit | Connect Three Networks (challenge) |
| DNS and Content Delivery | How DNS Resolution Works (C) · DNS in Cloud Networks (C) · DNS and Content Delivery Together (C) · Azure DNS (P) · Amazon Route 53 (P) · Comparison (X) | Recursive DNS resolution sequence | Trace DNS Resolution Locally (hands-on) |

Network security rules (stateful vs. stateless filtering, NSGs, security groups, network ACLs) are taught in Virtual Networks at the depth needed for routing and segmentation. Firewalls, WAF, and DDoS protection remain in the Security category's Network Security concept, which is still Coming soon.

---

## Status labels

### Source of truth

`ConceptMeta.status` in the content index is the only availability field. The user-facing label is derived from it in one place, `src/content/status.ts`:

| `status` | Label |
|---|---|
| `available` | Active |
| `in-development` | In development |
| `coming-soon` | Coming soon |

Any missing or unrecognised value is treated as `coming-soon`, so a content error can never make a concept appear Active. A concept marked `available` with no lessons is also shown as Coming soon rather than as an empty workspace.

### Where labels appear

- **Category pages:** a badge on every concept card.
- **Concept page header:** for both Active concepts and unavailable ones.
- **Domain page:** a per-category summary, e.g. "4 active".
- **Home:** an overall summary, e.g. "13 active · 21 coming soon".

Labels deliberately do **not** appear in the domain sidebar, which stops at categories (M1B Design Decision §1), or next to individual lessons, because status belongs to the concept.

### Rules for setting a status

- `available` — lessons are authored, reviewed for accuracy, and usable end to end. A missing lab does not block this when the concept does not naturally support one.
- `in-development` — some instructional content exists but the concept is not complete.
- `coming-soon` — no meaningful content yet.

`src/content/cloud-fundamentals/index.test.ts` asserts that every concept in an authored category is `available` and every other concept is `coming-soon`, so a status change must be made deliberately in both the content and that test.

---

## Visualizations and simulations

| Visualization | Type | Lesson |
|---|---|---|
| Region and AZ explorer | Topology | Regions and Availability Zones |
| Infrastructure hierarchy | Topology | Inside a Cloud Datacenter |
| Edge cache flow | Sequence | Edge Locations and Points of Presence |
| Multi-region failover | Topology | Multi-Region Replication and Failover |
| Storage Model Explorer | Topology | Storage Models: Block, File, and Object |
| Object request flow | Sequence | How Object Storage Works |
| VNet/VPC explorer | Topology | Virtual Network Architecture |
| Public vs. private explorer | Topology | Public vs. Private Access |
| Hub-and-spoke connectivity | Topology | Peering and Hub-and-Spoke Topologies |
| DNS resolution | Sequence | How DNS Resolution Works |

| Simulation | What it computes |
|---|---|
| Zone Failure | Places a web tier and database across three zones, fails one, and derives load balancer, database, and service outcomes. |
| Replication and Durability | Places copies for four redundancy strategies, applies a disk, zone, or region failure, and reports durability, read/write availability, and data at risk. |
| CIDR and Subnet Calculator | Parses a CIDR block and computes its mask, network, range, conventional and cloud-usable hosts, address class, subnets, and overlap with a second block. |
| Packet Routing | Traces a packet through route tables (with real longest-prefix matching), gateways, and security rules for five source/destination scenarios. |

Every simulation is a pure function of its parameters. The same input always produces the same steps and outcome, and each is covered by unit tests.

### Engine changes made for this slice

- The simulation-lab registry now holds simulations with different state types. (Since Slice 2A.1, each concept module binds its own simulations with `bindSimulation`; the central `lab-simulations.tsx` registry is gone.)
- Simulations support a `text` parameter type, used by the CIDR lab.
- React Flow nodes can be selected from the keyboard (Tab, then Enter or Space) and populate the inspector.
- The current step's explanation is shown under the timeline.
- Lessons and labs remount their visualization or simulation when navigating between them, so step indices and parameters do not carry over.
- Topology diagrams fit phone-width screens.

---

## Labs: what is simulated and what is real

| Lab | Type | What happens |
|---|---|---|
| Survive a Zone Failure | Simulation | Runs entirely in the browser. No cloud resources are created. Validation checks the simulated outcome. |
| Replication and Durability | Simulation | Same. Outcomes model each redundancy strategy's documented behaviour, not measured provider performance. |
| CIDR and Subnet Lab | Simulation | Real IPv4 arithmetic on the learner's input, computed locally. |
| Packet Routing Lab | Simulation | A modelled network. It illustrates routing and filtering decisions; it is not a packet capture. |
| Choose a Deployment Geography · Storage Selection Challenge · Connect Three Networks | Architecture challenge | Choices are matched against authored assessments. Unlisted combinations get general guidance instead of a verdict. |
| Trace DNS Resolution Locally | Hands-on | Read-only DNS lookups the learner runs on their own machine. The page runs nothing and verifies nothing. Completion is self-reported and labelled as such. |

The lab instructions and descriptions say this explicitly.

---

## Azure and AWS mapping notes

These mappings are conceptual. Several are only partial, and the lessons call that out instead of treating the services as identical:

- **Subnet scope:** Azure subnets span all zones in a region; AWS subnets live in one AZ.
- **Zone naming:** both map zone names to physical zones per subscription or account; AWS AZ IDs are the stable cross-account identifier.
- **Rack-level spreading:** Azure availability sets and AWS spread placement groups solve related problems, but cluster placement groups do the opposite.
- **Zone resilience for disks:** Azure ZRS managed disks have no EBS equivalent.
- **Object storage redundancy:** Azure chooses it per storage account (LRS/ZRS/GRS/GZRS). S3 ties it to the storage class and configures cross-Region copies separately.
- **File storage:** Azure Files ↔ Amazon EFS holds only for NFS. SMB shares map to Amazon FSx for Windows File Server.
- **Network security:** an NSG (stateful, allow and deny, subnet or NIC) is not the same as a security group (stateful, allow-only, NIC). AWS network ACLs are stateless.
- **Internet access:** Azure routes to the internet through system routes with no gateway resource; AWS requires an attached internet gateway and a route to it.
- **NAT:** AWS NAT gateways are zonal by default, with a newer regional mode. Azure is moving new networks to private subnets by default.
- **Transit:** Azure Virtual WAN and AWS Transit Gateway solve the same problem with different service boundaries.
- **DNS:** Azure DNS ↔ Route 53 holds only for zone hosting. Route 53 also covers registration and routing policies, which Azure splits into App Service Domains and Traffic Manager.

No content quotes SLAs, prices, durability percentages, or service limits beyond the subnet sizes and reserved-address counts below, which were verified.

### Sources checked during authoring

- Azure default outbound access: https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/default-outbound-access
- Azure subnet sizing and reserved addresses: https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-manage-subnet
- AWS subnet sizing and reserved addresses: https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html
- Azure Storage redundancy: https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy
- Amazon S3 storage classes: https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html
- AWS Regions and AZs: https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/regions.html
- Azure availability zones and zone mapping: https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview
- AWS regional NAT gateways: https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateways-regional.html

Each provider lesson also links its primary documentation page.

---

## Bundle size

| | Slice 1 | Slice 2A |
|---|---|---|
| `cloud-fundamentals` content chunk | 173 KB (55 KB gzip) | 397 KB (119 KB gzip) |
| `lab` page chunk | 14 KB (4 KB gzip) | 26 KB (6 KB gzip) |

In Slice 2A, that content chunk loaded on every page, including Home, because every page read the content index synchronously.

**Resolved in Slice 2A.1** (`docs/decisions/ADR-007-per-concept-content-loading.md`):
- Metadata stays eager.
- Each concept's content is its own chunk, 12.8–32.6 KB raw (4.7–10.5 KB gzip), loaded only when one of its pages opens.

Measured gzip JavaScript per page, cold cache, against a production build:

| Page | Slice 2A | Slice 2A.1 |
|---|---|---|
| Home | 194.6 KB | 118.4 KB |
| Domain | 194.6 KB | 118.4 KB |
| Category | 195.0 KB | 118.8 KB |
| Concept overview (Virtual Networks) | 197.0 KB | 135.3 KB |
| Coming-soon concept | 197.0 KB | 122.0 KB |
| Lesson (Virtual Networks) | 282.7 KB | 221.7 KB |
| Lab (CIDR) | 201.0 KB | 136.4 KB |

New categories now add only their metadata to the eager bundle. Today's metadata for all 34 concepts is about 23 KB raw. Their lesson content goes into new per-concept chunks. The lesson page's own chunk (258 KB raw, 87 KB gzip) is mostly React Flow and Motion for visualizations, and it is shared by every lesson.
