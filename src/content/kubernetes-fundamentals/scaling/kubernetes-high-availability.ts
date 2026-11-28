import type { ConceptContentModule, LessonBody } from '../../types';

const workloadHa: LessonBody = {
  learningObjectives: ['Describe the workload-side ingredients of HA in Kubernetes'],
  sections: [
    {
      heading: 'Four ingredients',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Replica count — at least three replicas so losing one still leaves two running. Two is a quorum-less pair that can both be unavailable in a single zone outage.',
            'Pod topology spread across failure domains — hostname (survive node loss) and zone (survive AZ loss). topologySpreadConstraints or pod-anti-affinity.',
            'PodDisruptionBudget — bound voluntary disruptions so drains and rollouts cannot make the whole workload unavailable.',
            'Readiness probe + Service — traffic only reaches Ready Pods; the single-replica blip is invisible to callers.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Three replicas with no spread constraint is not HA. All three can end up on one node; a single node failure takes them all out. Verify spread with `kubectl get pods -o wide` after a rollout, especially the first few times.',
        },
      ],
    },
    {
      heading: 'StatefulSets add complications',
      blocks: [
        {
          type: 'paragraph',
          text: 'A StatefulSet\'s Pods have identity and attached PersistentVolumes. Recreation on another node may require the volume to reattach (block storage) or pass through regional topology checks (zonal volumes cannot be attached across zones). HA on a StatefulSet usually requires zone-aware volume topology and a stable quorum.',
        },
      ],
    },
  ],
};

const controlPlaneHa: LessonBody = {
  learningObjectives: ['Describe control-plane HA — API Server, scheduler, controller-manager, etcd'],
  sections: [
    {
      heading: 'Each component has a different HA model',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Component', 'HA model', 'Minimum'],
          rows: [
            ['kube-apiserver', 'Horizontal — stateless; multiple replicas behind a load balancer', '2+ instances'],
            ['etcd', 'Raft consensus — needs an odd number for quorum', '3 members (tolerates 1 failure)'],
            ['kube-controller-manager', 'Leader election — multiple replicas, only one active', '2+ replicas'],
            ['kube-scheduler', 'Leader election — same pattern as controller-manager', '2+ replicas'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The etcd choice is the load-bearing one. etcd uses Raft: a 3-member cluster tolerates 1 failure, 5 tolerates 2. Even numbers add nothing (4 tolerates the same as 3), so clusters are always 3 or 5.',
        },
        {
          type: 'list',
          items: [
            'Stacked etcd topology — etcd runs on the same nodes as the control plane. Simplest.',
            'External etcd topology — etcd runs on separate dedicated nodes. More operationally complex but isolates etcd I/O.',
            'Every control-plane node should be in a different zone, so an AZ outage never takes two members down.',
          ],
        },
      ],
    },
    {
      heading: 'What survives a control-plane outage',
      blocks: [
        {
          type: 'paragraph',
          text: 'If the entire control plane goes down, running Pods keep running — the kubelet does not need the API Server to continue executing Pods it already knows about. What stops: new scheduling, scaling, rolling updates, Service endpoint updates in response to Pod changes, any kubectl operation. The cluster degrades into "static" mode until the control plane recovers.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'workload-ha': workloadHa,
    'control-plane-ha': controlPlaneHa,
  },
  labs: {},
  simulations: {},
};
