import type { Category } from '../../types';
import { regionsAndAvailabilityZones } from './regions-and-availability-zones';
import { dataCentersAndEdgeLocations } from './data-centers-and-edge-locations';
import { geographicRedundancyAndDataResidency } from './geographic-redundancy-and-data-residency';

export const globalInfrastructure: Category = {
  id: 'global-infrastructure',
  title: 'Global Infrastructure',
  description:
    'How cloud providers organize physical infrastructure into regions, availability zones, and edge locations.',
  concepts: [regionsAndAvailabilityZones, dataCentersAndEdgeLocations, geographicRedundancyAndDataResidency],
};
