import type { Category } from '../../types';
import {
  kubernetesObjects,
  yamlManifests,
  labelsAndSelectors,
  namespaces,
  configMaps,
  secrets,
  resourceRequestsAndLimits,
} from './meta';

export const configuration: Category = {
  id: 'configuration',
  title: 'Kubernetes Configuration',
  description:
    'The object model, manifests, labels, namespaces, ConfigMaps, Secrets, and resource requests/limits.',
  concepts: [
    kubernetesObjects,
    yamlManifests,
    labelsAndSelectors,
    namespaces,
    configMaps,
    secrets,
    resourceRequestsAndLimits,
  ],
};
