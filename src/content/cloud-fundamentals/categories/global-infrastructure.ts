import type { Category } from '../../types';

export const globalInfrastructure: Category = {
  id: 'global-infrastructure',
  title: 'Global Infrastructure',
  description:
    'How cloud providers organize physical infrastructure into regions, availability zones, and edge locations.',
  concepts: [
    {
      id: 'regions-and-availability-zones',
      title: 'Regions and Availability Zones',
      description:
        'Geographic regions and isolated data center groups that provide fault isolation and low-latency access, including fault domains, update domains, and the distinction between regional and zonal resources.',
      status: 'coming-soon',
    },
    {
      id: 'data-centers-and-edge-locations',
      title: 'Data Centers and Edge Locations',
      description:
        'Physical data center design and the edge points of presence that cache content and route traffic close to users.',
      status: 'coming-soon',
    },
    {
      id: 'geographic-redundancy-and-data-residency',
      title: 'Geographic Redundancy and Data Residency',
      description:
        'Replicating data and workloads across geography for resilience, balanced against data residency and sovereignty requirements that constrain where data may legally live.',
      status: 'coming-soon',
    },
  ],
};
