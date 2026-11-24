export type ConceptStatus = 'available' | 'in-development' | 'coming-soon';

export interface ConceptMeta {
  id: string;
  title: string;
  description: string;
  status: ConceptStatus;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  concepts: ConceptMeta[];
}

export interface Domain {
  id: string;
  title: string;
  description: string;
  categories: Category[];
}

export const cloudFundamentals: Domain = {
  id: 'cloud-fundamentals',
  title: 'Cloud Fundamentals',
  description:
    'Core cloud computing concepts across Azure and AWS — from infrastructure primitives to observability.',
  categories: [
    {
      id: 'cloud-computing-models',
      title: 'Cloud Computing Models',
      description:
        'Service models (IaaS, PaaS, SaaS) and deployment models (public, private, hybrid) that define how cloud resources are delivered and consumed.',
      concepts: [
        {
          id: 'cloud-service-models',
          title: 'Cloud Service Models',
          description:
            'IaaS, PaaS, and SaaS — the three layers of cloud service abstraction and what each provides.',
          status: 'coming-soon',
        },
        {
          id: 'cloud-deployment-models',
          title: 'Cloud Deployment Models',
          description:
            'Public, private, hybrid, and multi-cloud deployment strategies and their trade-offs.',
          status: 'coming-soon',
        },
      ],
    },
    {
      id: 'global-infrastructure',
      title: 'Global Infrastructure',
      description:
        'How cloud providers organize physical infrastructure into regions, availability zones, and edge locations.',
      concepts: [
        {
          id: 'regions-and-availability-zones',
          title: 'Regions and Availability Zones',
          description:
            'Geographic regions and isolated data center groups that provide fault isolation and low-latency access.',
          status: 'coming-soon',
        },
        {
          id: 'edge-locations-and-cdn',
          title: 'Edge Locations and CDN',
          description:
            'Edge points of presence and content delivery networks that cache content close to users.',
          status: 'coming-soon',
        },
      ],
    },
    {
      id: 'compute',
      title: 'Compute',
      description:
        'Processing resources — from full virtual machines to event-driven serverless functions.',
      concepts: [
        {
          id: 'virtual-machines',
          title: 'Virtual Machines',
          description:
            'Virtualized servers that provide full OS-level control over compute resources.',
          status: 'coming-soon',
        },
        {
          id: 'containers',
          title: 'Containers',
          description:
            'Lightweight, portable execution environments that package applications with their dependencies.',
          status: 'coming-soon',
        },
        {
          id: 'serverless-functions',
          title: 'Serverless Functions',
          description:
            'Event-driven compute that runs code without managing servers, scaling automatically per invocation.',
          status: 'coming-soon',
        },
      ],
    },
    {
      id: 'storage',
      title: 'Storage',
      description:
        'Persistent data storage — block devices for VMs, object stores for unstructured data, and file shares.',
      concepts: [
        {
          id: 'block-storage',
          title: 'Block Storage',
          description:
            'Low-level storage volumes attached to compute instances, providing raw disk access.',
          status: 'coming-soon',
        },
        {
          id: 'object-storage',
          title: 'Object Storage',
          description:
            'Scalable storage for unstructured data accessed via HTTP APIs, organized in buckets.',
          status: 'coming-soon',
        },
        {
          id: 'file-storage',
          title: 'File Storage',
          description:
            'Managed file systems accessible over standard protocols like NFS and SMB.',
          status: 'coming-soon',
        },
      ],
    },
    {
      id: 'networking',
      title: 'Networking',
      description:
        'Virtual networking — isolated networks, subnets, routing, DNS, and content delivery.',
      concepts: [
        {
          id: 'virtual-networks',
          title: 'Virtual Networks',
          description:
            'Isolated network environments in the cloud where you define address spaces, connectivity, and security.',
          status: 'coming-soon',
        },
        {
          id: 'subnets-and-routing',
          title: 'Subnets and Routing',
          description:
            'Network segmentation and traffic routing rules that control how data flows between resources.',
          status: 'coming-soon',
        },
        {
          id: 'dns-and-content-delivery',
          title: 'DNS and Content Delivery',
          description:
            'Domain name resolution and global content distribution for fast, reliable access.',
          status: 'coming-soon',
        },
      ],
    },
    {
      id: 'identity-and-access-management',
      title: 'Identity and Access Management',
      description:
        'Authentication, authorization, and access control for cloud resources.',
      concepts: [
        {
          id: 'identity-and-authentication',
          title: 'Identity and Authentication',
          description:
            'How users, services, and applications prove their identity to access cloud resources.',
          status: 'coming-soon',
        },
        {
          id: 'authorization-and-policies',
          title: 'Authorization and Policies',
          description:
            'Permission models and policy languages that control what authenticated principals can do.',
          status: 'coming-soon',
        },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      description:
        'Protecting data and network traffic — encryption, key management, and network-level controls.',
      concepts: [
        {
          id: 'encryption-and-key-management',
          title: 'Encryption and Key Management',
          description:
            'Encrypting data at rest and in transit, and managing cryptographic keys securely.',
          status: 'coming-soon',
        },
        {
          id: 'network-security',
          title: 'Network Security',
          description:
            'Firewalls, security groups, and network access controls that protect cloud resources.',
          status: 'coming-soon',
        },
      ],
    },
    {
      id: 'load-balancing',
      title: 'Load Balancing',
      description:
        'Distributing traffic across multiple targets for performance and availability.',
      concepts: [
        {
          id: 'application-load-balancing',
          title: 'Application Load Balancing',
          description:
            'Layer 7 load balancing that routes HTTP/HTTPS traffic based on content, paths, and headers.',
          status: 'coming-soon',
        },
        {
          id: 'network-load-balancing',
          title: 'Network Load Balancing',
          description:
            'Layer 4 load balancing that distributes TCP/UDP traffic with ultra-low latency.',
          status: 'coming-soon',
        },
      ],
    },
    {
      id: 'scalability-and-reliability',
      title: 'Scalability and Reliability',
      description:
        'Scaling resources to meet demand and designing for failure — auto-scaling, HA, and DR.',
      concepts: [
        {
          id: 'auto-scaling',
          title: 'Auto-Scaling',
          description:
            'Automatically adjusting compute capacity based on demand metrics and schedules.',
          status: 'coming-soon',
        },
        {
          id: 'high-availability',
          title: 'High Availability',
          description:
            'Architectural patterns that minimize downtime through redundancy and failover.',
          status: 'coming-soon',
        },
        {
          id: 'disaster-recovery',
          title: 'Disaster Recovery',
          description:
            'Strategies for recovering from catastrophic failures — backup, replication, and failover across regions.',
          status: 'coming-soon',
        },
      ],
    },
    {
      id: 'monitoring-and-observability',
      title: 'Monitoring and Observability',
      description:
        'Gaining visibility into system behavior — metrics, logs, and distributed traces.',
      concepts: [
        {
          id: 'metrics-and-alerting',
          title: 'Metrics and Alerting',
          description:
            'Collecting numerical measurements of system behavior and triggering alerts on anomalies.',
          status: 'coming-soon',
        },
        {
          id: 'logging',
          title: 'Logging',
          description:
            'Capturing and aggregating event records from applications and infrastructure.',
          status: 'coming-soon',
        },
        {
          id: 'distributed-tracing',
          title: 'Distributed Tracing',
          description:
            'Tracking requests as they flow through distributed systems to identify bottlenecks and failures.',
          status: 'coming-soon',
        },
      ],
    },
  ],
};

export const domains: Domain[] = [cloudFundamentals];

export function findDomain(domainId: string): Domain | undefined {
  return domains.find((d) => d.id === domainId);
}

export function findCategory(
  domainId: string,
  categoryId: string,
): Category | undefined {
  return findDomain(domainId)?.categories.find((c) => c.id === categoryId);
}

export function findConcept(
  domainId: string,
  categoryId: string,
  conceptId: string,
): ConceptMeta | undefined {
  return findCategory(domainId, categoryId)?.concepts.find(
    (c) => c.id === conceptId,
  );
}
