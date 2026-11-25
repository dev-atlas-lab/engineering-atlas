# Cloud Fundamentals — Curriculum Coverage

This document records what the Cloud Fundamentals domain actually contains, what remains, and the rules that decide how content is labelled. It reflects the code at the end of Slice 2B; update it whenever a concept's content or status changes.

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
| Identity and Access Management | Identity and Authentication · Authorization and Policies · Workload and Federated Identity | **Active** | 2B |
| Security | Security Fundamentals · Encryption and Key Management · Network Security · Security Monitoring and Compliance | **Active** | 2B |
| Load Balancing | Load Balancing Fundamentals · Application Load Balancing · Network Load Balancing · Global Traffic Distribution | Coming soon | — |
| Scalability and Reliability | Auto-Scaling · High Availability · Disaster Recovery | Coming soon | — |
| Monitoring and Observability | Observability Fundamentals · Metrics and Alerting · Logging · Distributed Tracing | Coming soon | — |

**Totals:** 20 Active concepts, 14 Coming soon, 0 In development. No status of an earlier concept changed in Slice 2B.

### Remaining gaps

- Four categories (14 concepts) have no lessons yet: Cloud Computing Models, Load Balancing, Scalability and Reliability, and Monitoring and Observability.
- Security Fundamentals maps to providers through a comparison lesson only, because it teaches principles that every other security concept implements with provider services.
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

## Slice 2B inventory

40 lessons, 73 knowledge-check questions, 9 labs, 11 visualizations, and 7 simulations across 7 concepts.

### Identity and Access Management

| Concept | Lessons | Visualization | Lab |
|---|---|---|---|
| Identity and Authentication | Identity and Access Management Fundamentals (C) · How Authentication Works: Credentials, MFA, and Tokens (C) · Identity Providers, Federation, and Single Sign-On (C) · Microsoft Entra ID (P) · AWS IAM Identities and IAM Identity Center (P) · Comparison (X) | Access decision lifecycle (sequence); OIDC single sign-on (sequence) | Inspect a Token Locally (hands-on) |
| Authorization and Policies | Authorization Models: RBAC, ABAC, and Policies (C) · How Policy Evaluation Works (C) · Designing for Least Privilege (C) · Azure RBAC: Roles, Assignments, and Scopes (P) · AWS IAM Policies and Policy Evaluation (P) · Comparison (X) | Azure RBAC scope inheritance (topology) | IAM Policy Evaluation Simulator (simulation) · Azure RBAC Scope Explorer (simulation) |
| Workload and Federated Identity | Workload Identity: How Software Authenticates (C) · Temporary Credentials and Workload Identity Federation (C) · Azure Managed Identities and Service Principals (P) · AWS IAM Roles for Workloads and STS (P) · Comparison (X) | Workload identity federation; Azure managed identity token flow; EC2 IMDSv2 role credentials (all sequence) | Workload Credential Lifecycle (simulation) |

### Security

| Concept | Lessons | Visualization | Lab |
|---|---|---|---|
| Security Fundamentals | Core Security Principles: CIA, Threat Modelling, and Zero Trust (C) · Shared Responsibility for Security (C) · Defense in Depth (C) · Comparison: Azure and AWS Security Building Blocks (X) | Defense in depth: one attack through the layers (topology) | Defense-in-Depth Architecture Review (challenge) |
| Encryption and Key Management | Encryption Fundamentals (C) · Envelope Encryption and Key Management Services (C) · Certificates and TLS (C) · Secrets Management (C) · Azure Key Vault and Managed HSM (P) · AWS KMS, CloudHSM, Secrets Manager, and Parameter Store (P) · Comparison (X) | Envelope encryption (sequence); runtime secret retrieval and rotation (sequence) | Envelope Encryption Explorer (simulation) · Secret Retrieval and Rotation (simulation) |
| Network Security | Cloud Firewalls and Traffic Inspection (C) · Web Application Firewalls and DDoS Protection (C) · Segmentation and Private Connectivity as Security Controls (C) · Azure Firewall, WAF, and DDoS Protection (P) · AWS Network Firewall, WAF, and Shield (P) · Comparison (X) | Layered edge, WAF, and egress firewall (topology) | WAF and DDoS Protection Simulator (simulation) |
| Security Monitoring and Compliance | Preventive, Detective, and Corrective Controls (C) · Security Posture and Misconfiguration Risk (C) · Audit Logging, Compliance, and Incident Response (C) · Azure Policy and Microsoft Defender for Cloud (P) · AWS Config, Security Hub, GuardDuty, and CloudTrail (P) · Comparison (X) | Governance loop around one change (sequence) | Misconfiguration Response Simulator (simulation) |

Network Security builds on Virtual Networks' security-rules lesson and does not repeat NSG, security group, or routing fundamentals. Security Monitoring and Compliance covers security governance only; general monitoring, metrics, and logging belong to the Monitoring and Observability category.

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
| IAM Policy Evaluation | Evaluates one S3 request against configurable identity policies, bucket policies, explicit denies, SCPs, permissions boundaries, and session policies, in AWS's documented single-account order, and explains the decision. |
| Azure RBAC Scope | Places one role assignment in a management group → subscription → resource group → resource hierarchy, checks an optional deny assignment first, then the role's Actions/NotActions or DataActions. |
| Workload Credential Lifecycle | Follows a managed identity, an instance role, or a long-lived key over three hours: refresh, expiry, authorization, and how long a copied credential stays usable. |
| Envelope Encryption | Encrypts or decrypts one record with a data key wrapped by a KEK, tracking where each key lives; models KEK permission, rotation, disabling, deletion, and stolen storage. |
| Secret Retrieval and Rotation | Follows a database password stored in a secret store, a container image, or source code through startup, rotation, and a leak. |
| WAF and DDoS Protection | Sends one kind of representative traffic through network-layer DDoS mitigation, HTTP validation, WAF rules, a rate-based rule, and application authorization. |
| Misconfiguration Response | Applies one risky change and shows how preventive, detective, corrective, and alerting controls respond, with the resulting exposure window. |

Every simulation is a pure function of its parameters. The same input always produces the same steps and outcome, and each is covered by unit tests.

### Simulation semantics and limits (Slice 2B)

The security simulations are teaching models with stated scope. Each lab and simulation view says what is not modelled:

- **IAM Policy Evaluation** models requests within one AWS account only. It implements explicit deny across all policy types, SCP allow-listing, same-account resource-based policies (including the documented difference between naming an IAM user, a role ARN, or a role session ARN), identity policies, permissions boundaries, and session policies. It does not model conditions, NotAction/NotResource/NotPrincipal, resource control policies (assumed to be the default allow-all), cross-account requests, KMS key policy or role trust policy special cases, or the root user. It is not the AWS IAM policy simulator and makes no claim of full parity.
- **Azure RBAC Scope** models one role assignment and one illustrative deny assignment. Role definitions are abbreviated subsets of the built-in roles. Group resolution, multiple assignments, role assignment conditions, Microsoft Entra roles, and key- or access-policy-based data access are not modelled.
- **Workload Credential Lifecycle** uses illustrative lifetimes (60 minutes, refreshed at 45). Real lifetimes and refresh points vary by provider, service, and SDK.
- **Envelope Encryption** runs no cryptography; keys and ciphertext are symbolic labels.
- **WAF and DDoS Protection** describes traffic rather than generating it; it is not a security testing tool. Outcomes illustrate each layer's role; real mitigation depends on attack size, shape, and tuning.
- **Misconfiguration Response** uses illustrative timings to compare exposure windows, not measured service behaviour.

### Engine changes made for Slice 2B

- Scene primitives for users, identities, keys, policies, firewalls, secrets, and scopes.
- Architecture challenges support optional per-option feedback (effective, partial, ineffective). After evaluation, every selected option shows its feedback, and effective options the learner missed are listed. An overall verdict is shown only when the learner's exact combination matches an authored solution; otherwise the lab says that no authored overall assessment exists.
- Hands-on labs render their starter files, which the content model already supported.
- Long timeline step labels and long command output wrap on narrow screens.

### Engine changes made for Slice 2A

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
| IAM Policy Evaluation Simulator · Azure RBAC Scope Explorer | Simulation | Simplified authorization models in the browser. No policy is sent to Azure or AWS, and no real permission is evaluated or changed. Validation checks the simulated decision. |
| Workload Credential Lifecycle · Envelope Encryption Explorer · Secret Retrieval and Rotation | Simulation | Conceptual models. No credentials, keys, or secrets are created, and no cryptography runs. |
| WAF and DDoS Protection Simulator · Misconfiguration Response Simulator | Simulation | Conceptual models. No traffic is generated, no rule is deployed, and nothing is tested. |
| Defense-in-Depth Architecture Review | Architecture challenge | Every option has authored feedback; only three exact combinations have an authored overall verdict. Nothing is deployed. |
| Inspect a Token Locally | Hands-on | The learner decodes a deliberately invalid sample token with built-in shell tools. The page runs nothing and verifies nothing; completion is self-reported. |

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
- **Identity placement:** Azure identities live in a Microsoft Entra tenant separate from subscriptions; AWS IAM identities live in each account, with IAM Identity Center as the organization-wide workforce layer.
- **Authorization model:** Azure RBAC grants roles at hierarchical scopes, additively, with deny assignments that only Azure features create. AWS IAM evaluates policy documents attached to identities and resources, with customer-authored denies and permission ceilings (SCPs, RCPs, permissions boundaries, session policies). Azure has no direct SCP or permissions-boundary equivalent.
- **Workload identity:** an Azure managed identity is a principal that receives role assignments and Entra tokens per audience; an AWS workload runs as an IAM role whose credentials sign requests to any service. Federation uses federated identity credentials on Azure and OIDC providers plus role trust policies on AWS.
- **Keys and secrets:** Key Vault combines keys, secrets, and certificates under one RBAC model; AWS splits them across KMS (with mandatory key policies), Secrets Manager, Parameter Store, and ACM. Secrets Manager has built-in rotation; Key Vault secret rotation is event-driven with your own function.
- **DDoS and WAF:** both include baseline DDoS protection. Azure DDoS Protection is L3/L4 and relies on Azure WAF for L7; AWS Shield Advanced can create WAF rate-based rules automatically.
- **Governance:** Azure Policy handles both prevention (deny) and detection (audit); AWS splits prevention (SCPs, RCPs, account settings, proactive controls) from detection (AWS Config, Security Hub CSPM).

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

Slice 2B:

- AWS single-account policy evaluation: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-basics.html
- AWS policy evaluation logic (deny/allow): https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html
- AWS permissions boundaries: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html
- Azure RBAC overview and evaluation: https://learn.microsoft.com/en-us/azure/role-based-access-control/overview
- Azure deny assignments: https://learn.microsoft.com/en-us/azure/role-based-access-control/deny-assignments
- Azure managed identity tokens from IMDS: https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/how-to-use-vm-token
- Microsoft Entra workload identity federation: https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation
- Amazon EKS Pod Identity and IRSA: https://docs.aws.amazon.com/eks/latest/userguide/service-accounts.html
- AWS KMS key rotation (90–2,560 days, default 365): https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html
- Secrets Manager rotation and staging labels: https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_lambda-functions.html
- Key Vault soft delete and purge protection: https://learn.microsoft.com/en-us/azure/key-vault/general/soft-delete-overview
- Key Vault RBAC: https://learn.microsoft.com/en-us/azure/key-vault/general/rbac-guide
- Azure DDoS Protection tiers: https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-protection-sku-comparison
- AWS WAF protected resources: https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html
- AWS Security Hub CSPM: https://aws.amazon.com/security-hub/cspm/

No Slice 2B content quotes prices, SLAs, or compliance certifications. The few numeric facts it states (KMS rotation range, Key Vault soft-delete retention, STS session durations, the federated identity credential limit) were checked against the sources above.

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

### Slice 2B

All new content follows per-concept loading. Each IAM and Security concept is its own chunk, 29–79 KB raw (9.8–22.2 KB gzip); the largest, Authorization and Policies, contains both IAM simulators. The eager entry bundle grew by 9.1 KB raw (2.2 KB gzip) for the seven concepts' metadata. Measured gzip JavaScript per page, cold cache, production build:

| Page | Slice 2A.1 | Slice 2B |
|---|---|---|
| Home | 118.4 KB | 120.5 KB |
| Category (IAM) | — | 121.0 KB |
| Lesson (Azure RBAC) | — | 236.0 KB |
| Lab (IAM Policy Evaluation Simulator) | — | 150.3 KB |
| Lab (WAF and DDoS) | — | 141.0 KB |
| Lab (CIDR) | 136.4 KB | 139.3 KB |

Browser checks confirmed that Home and the IAM and Security category pages download no concept chunks, and that IAM and Security concept, lesson, and lab pages download only their own concept's chunk.

### Visualization phase (SVG-first)

Making declarative SVG the default scene renderer and lazy-loading React Flow (ADR-008) moved `@xyflow/react` (242 KB raw / 82 KB gzip) and its 16 KB stylesheet off the eager lesson path into a chunk no current route fetches. The lesson page's own chunk fell from 258 KB raw (87 KB gzip) to 31 KB raw (9.7 KB gzip). Measured gzip JavaScript per page, cold cache, production build:

| Page | Slice 2B | SVG-first |
|---|---|---|
| Home | 120.5 KB | 120.5 KB |
| Category (IAM) | 121.0 KB | 121.0 KB |
| Lesson (Virtual Networks) | 225.0 KB | 146.5 KB |
| Lesson (Azure RBAC) | 236.0 KB | 157.6 KB |
| Lab (CIDR) | 139.3 KB | 139.3 KB |
| Lab (IAM Policy Evaluation Simulator) | 150.3 KB | 150.3 KB |

Every lesson page drops about 78 KB gzip (~35%); discovery and lab pages are unchanged, because they never rendered a topology scene. A browser run confirmed that opening any scene lesson renders an SVG diagram and never fetches the React Flow chunk.
