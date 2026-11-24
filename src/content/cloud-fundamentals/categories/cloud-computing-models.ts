import type { Category } from '../../types';

export const cloudComputingModels: Category = {
  id: 'cloud-computing-models',
  title: 'Cloud Computing Models',
  description:
    'Service models (IaaS, PaaS, SaaS) and deployment models (public, private, hybrid) that define how cloud resources are delivered and consumed.',
  concepts: [
    {
      id: 'what-is-cloud-computing',
      title: 'What Is Cloud Computing?',
      description:
        'The shift from owned, on-premises infrastructure to on-demand computing resources — why it happened, how cloud economics work, and what the shared responsibility model means for who manages what.',
      status: 'coming-soon',
    },
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
};
