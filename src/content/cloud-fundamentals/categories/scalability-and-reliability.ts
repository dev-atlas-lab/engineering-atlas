import type { Category } from '../../types';

export const scalabilityAndReliability: Category = {
  id: 'scalability-and-reliability',
  title: 'Scalability and Reliability',
  description:
    'Scaling resources to meet demand and designing for failure — auto-scaling, high availability, and disaster recovery.',
  concepts: [
    {
      id: 'auto-scaling',
      title: 'Auto-Scaling',
      description:
        'Vertical vs. horizontal scaling, and automatically adjusting compute capacity based on demand metrics and schedules — including why stateless applications scale more cleanly than stateful ones.',
      status: 'coming-soon',
    },
    {
      id: 'high-availability',
      title: 'High Availability',
      description:
        'Architectural patterns — redundancy, failover, multi-zone and multi-region design — that minimize downtime.',
      status: 'coming-soon',
    },
    {
      id: 'disaster-recovery',
      title: 'Disaster Recovery',
      description:
        'Strategies for recovering from catastrophic failures — backup, replication, and failover across regions — framed by Recovery Time Objective and Recovery Point Objective.',
      status: 'coming-soon',
    },
  ],
};
