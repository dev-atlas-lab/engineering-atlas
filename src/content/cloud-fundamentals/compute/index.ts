import type { Category } from '../../types';
import { virtualMachines } from './virtual-machines';
import { containers } from './containers';
import { serverlessFunctions } from './serverless-functions';

export const compute: Category = {
  id: 'compute',
  title: 'Compute',
  description: 'Processing resources — from full virtual machines to event-driven serverless functions.',
  concepts: [virtualMachines, containers, serverlessFunctions],
};
