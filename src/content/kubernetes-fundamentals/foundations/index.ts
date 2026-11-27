import type { Category } from '../../types';
import {
  whatIsKubernetes,
  whyContainerOrchestration,
  kubernetesVsDocker,
  declarativeVsImperative,
  desiredVsActualState,
  reconciliationLoop,
} from './meta';

export const foundations: Category = {
  id: 'foundations',
  title: 'Kubernetes Foundations',
  description:
    'First principles: what Kubernetes is, the orchestration problem it solves, and the declarative, reconciling model that shapes everything on top of it.',
  concepts: [
    whatIsKubernetes,
    whyContainerOrchestration,
    kubernetesVsDocker,
    declarativeVsImperative,
    desiredVsActualState,
    reconciliationLoop,
  ],
};
