import type { Category } from '../../types';
import { virtualMachines, containers, serverlessFunctions } from './meta';

export const compute: Category = {
  id: 'compute',
  title: 'Compute',
  description: 'Processing resources — from full virtual machines to event-driven serverless functions.',
  concepts: [virtualMachines, containers, serverlessFunctions],
};
