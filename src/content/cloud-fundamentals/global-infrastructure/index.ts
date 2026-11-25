import type { Category } from '../../types';
import { regionsAndAvailabilityZones, dataCentersAndEdgeLocations, geographicRedundancyAndDataResidency } from './meta';

export const globalInfrastructure: Category = {
  id: 'global-infrastructure',
  title: 'Global Infrastructure',
  description:
    'How cloud providers organize physical infrastructure into regions, availability zones, and edge locations.',
  concepts: [regionsAndAvailabilityZones, dataCentersAndEdgeLocations, geographicRedundancyAndDataResidency],
};
