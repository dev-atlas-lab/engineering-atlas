// Eager metadata for this category's concepts: ids, titles, status, and
// lesson/lab ids, titles, and order. Never import concept content modules
// from here — they load per concept through ../concept-loaders.ts.

import type { ConceptMeta } from '../../types';

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
    { id: 'regions-and-zones-explained', title: 'Regions and Availability Zones', kind: 'concept' },
    { id: 'regional-zonal-and-global-resources', title: 'Regional, Zonal, and Global Resources', kind: 'concept' },
    { id: 'fault-domains-and-failure-isolation', title: 'Fault Domains and Failure Isolation', kind: 'concept' },
    { id: 'choosing-regions-and-zones', title: 'Choosing Regions and Zones', kind: 'concept' },
    { id: 'azure-regions-and-availability-zones', title: 'Azure Regions and Availability Zones', kind: 'provider', providerId: 'azure' },
    { id: 'aws-regions-and-availability-zones', title: 'AWS Regions and Availability Zones', kind: 'provider', providerId: 'aws' },
    { id: 'regions-and-zones-comparison', title: 'Comparison: Azure vs. AWS Zones', kind: 'comparison' },
  ],
  labs: [
    { id: 'zone-failure-simulation-lab', title: 'Survive a Zone Failure', type: 'simulation' },
  ],
};

export const dataCentersAndEdgeLocations: ConceptMeta = {
  id: 'data-centers-and-edge-locations',
  title: 'Data Centers and Edge Locations',
  description:
    'Physical data center design and the edge points of presence that cache content and route traffic close to users.',
  status: 'available',
  learningObjectives: [
    'Describe the physical hierarchy behind a cloud region and its failure boundaries',
    'Distinguish edge locations from regions and from infrastructure extensions',
    'Trace how an edge cache serves a miss and a hit',
  ],
  prerequisites: ['regions-and-availability-zones'],
  relatedConcepts: ['regions-and-availability-zones', 'dns-and-content-delivery', 'global-traffic-distribution'],
  estimatedMinutes: 40,
  lessons: [
    { id: 'inside-a-cloud-datacenter', title: 'Inside a Cloud Datacenter', kind: 'concept' },
    { id: 'edge-locations-and-points-of-presence', title: 'Edge Locations and Points of Presence', kind: 'concept' },
    { id: 'edge-networks-comparison', title: 'Comparison: Azure and AWS Edge Networks', kind: 'comparison' },
  ],
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
  lessons: [
    { id: 'why-geography-matters', title: 'Why Spread Across Regions', kind: 'concept' },
    { id: 'multi-region-replication', title: 'Multi-Region Replication and Failover', kind: 'concept' },
    { id: 'data-residency-and-sovereignty', title: 'Data Residency and Sovereignty', kind: 'concept' },
    { id: 'geography-comparison', title: 'Comparison: Azure Region Pairs vs. AWS Region Choice', kind: 'comparison' },
  ],
  labs: [
    { id: 'choose-a-deployment-geography', title: 'Choose a Deployment Geography', type: 'challenge' },
  ],
};
