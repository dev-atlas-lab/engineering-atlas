import type { ConceptContentModule, LessonBody } from '../../types';

const scaleUpTrigger: LessonBody = {
  learningObjectives: ['Describe how the autoscaler reacts to Unschedulable Pods'],
  sections: [
    {
      heading: 'Scale-up is driven by Pending Pods, not metrics',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Cluster Autoscaler watches the API Server for Pods with PodScheduled=False, reason: Unschedulable. For each such Pod it simulates placing it on every available node group; if a hypothetical new node from some node group would make the Pod fit, the autoscaler asks the cloud provider to add one. It does not use CPU or memory metrics — it uses scheduling outcomes.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'An HPA (or any other actor) scales a Deployment up.',
            'The new Pods are created. The scheduler cannot find a feasible node.',
            'Pods go Pending with reason=Unschedulable.',
            'Cluster Autoscaler sees them; it simulates each node-group template against each Pod.',
            'If a template fits, autoscaler asks the cloud API to increase the node-group size.',
            'A new VM boots; kubelet registers; the scheduler reconsiders the Pending Pods; they land.',
          ],
        },
      ],
    },
    {
      heading: 'Node groups and expander policies',
      blocks: [
        {
          type: 'paragraph',
          text: 'In cloud environments, nodes are grouped (ASGs on AWS, MIGs on GCP, VMSS on Azure). The autoscaler respects per-group min/max and uses an "expander" to pick WHICH group to grow when multiple would fit: `most-pods` (fit the most Pending Pods), `least-waste` (smallest leftover resources), `random`, `priority` (operator-defined list).',
        },
      ],
    },
  ],
};

const scaleDownCriteria: LessonBody = {
  learningObjectives: ['Describe the scale-down criteria and the Pods that block it'],
  sections: [
    {
      heading: 'When a node is safe to remove',
      blocks: [
        {
          type: 'paragraph',
          text: 'The autoscaler considers a node for removal when its resource utilization has been below a threshold (default 50%) for a consecutive period (default 10 minutes). If the Pods on that node can be moved to other nodes without violating requests, affinity, or PDBs, the autoscaler cordons the node, drains it, and asks the cloud to terminate the VM.',
        },
        {
          type: 'list',
          items: [
            'Pods with `cluster-autoscaler.kubernetes.io/safe-to-evict: "false"` annotation block removal of their node.',
            'Pods owned by nothing (no controller — bare Pods from kubectl run) block removal by default, since nothing recreates them elsewhere.',
            'Pods using local hostPath/emptyDir with non-restorable state block removal.',
            'kube-system Pods not covered by a PDB block removal by default.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A single mis-annotated Pod can pin a node forever. If your cluster never scales down, grep Pods for `safe-to-evict: "false"` and verify each has a real reason. The annotation is sticky — it survives Pod restarts if set in the controller template.',
        },
      ],
    },
    {
      heading: 'Not the same as HPA',
      blocks: [
        {
          type: 'paragraph',
          text: 'HPA scales replicas (horizontal) to react to load; Cluster Autoscaler scales nodes (horizontal) to react to scheduling demand the current node set cannot satisfy. They work together but on different signals, and are configured independently.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'scale-up-trigger': scaleUpTrigger,
    'scale-down-criteria': scaleDownCriteria,
  },
  labs: {},
  simulations: {},
};
