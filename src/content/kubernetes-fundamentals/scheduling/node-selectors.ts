import type { ConceptContentModule, LessonBody } from '../../types';

const theSimpleConstraint: LessonBody = {
  learningObjectives: [
    'Use nodeSelector to constrain Pods to a node class',
    'State the limitations that drive teams toward node affinity',
  ],
  sections: [
    {
      heading: 'nodeSelector is just an equality match',
      blocks: [
        {
          type: 'paragraph',
          text: 'The simplest placement constraint — a map of key=value pairs that every target node must have as labels. During filter, any node that is missing any of the pairs is rejected.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `spec:
  nodeSelector:
    disktype: ssd
    kubernetes.io/arch: amd64`,
        },
        {
          type: 'paragraph',
          text: 'Only the labels on the Node object matter, not labels on the Pod. The scheduler treats nodeSelector as a hard requirement with no preference — there is no "prefer SSD, accept HDD" dialect in nodeSelector.',
        },
      ],
    },
    {
      heading: 'Where nodeSelector runs out',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Need', 'nodeSelector', 'Node affinity'],
          rows: [
            ['Pod must run on nodes with disktype=ssd', 'Supported', 'Supported'],
            ['Prefer SSD nodes but accept HDD if needed', 'Not supported', 'preferredDuringSchedulingIgnoredDuringExecution'],
            ['Match one of several values (ssd OR nvme)', 'Not supported', 'operator: In with multiple values'],
            ['Require a label to be absent', 'Not supported', 'operator: DoesNotExist'],
            ['Match a numeric range', 'Not supported', 'operator: Gt / Lt'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'nodeSelector is still used for its brevity when the constraint is genuinely simple. Don\'t reach for node affinity when a two-line nodeSelector will do — the extra expressiveness is overhead when you don\'t need it.',
        },
      ],
    },
    {
      heading: 'Well-known labels Kubernetes provides',
      blocks: [
        {
          type: 'list',
          items: [
            'kubernetes.io/hostname — the node\'s hostname, unique per node.',
            'kubernetes.io/os and kubernetes.io/arch — set from the kubelet\'s OS and CPU architecture.',
            'topology.kubernetes.io/region and topology.kubernetes.io/zone — cloud provider region/AZ.',
            'node.kubernetes.io/instance-type — cloud VM instance type.',
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-simple-constraint': theSimpleConstraint,
  },
  labs: {},
  simulations: {},
};
