import type { ConceptContentModule, LessonBody } from '../../types';

const whatHostpathIs: LessonBody = {
  learningObjectives: [
    'Describe hostPath as a direct mount of a host filesystem path',
    'Enumerate the security and portability costs it imposes',
  ],
  sections: [
    {
      heading: 'A bind mount from the node into the Pod',
      blocks: [
        {
          type: 'paragraph',
          text: 'hostPath mounts a directory (or file, or socket) from the node\'s filesystem directly into the Pod. There is no abstraction — the Pod sees exactly what the node has at that path. Writes from the Pod land on the node. Deletions from the node disappear from the Pod.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `volumes:
- name: dockersock
  hostPath:
    path: /var/run/docker.sock
    type: Socket`,
        },
        {
          type: 'paragraph',
          text: 'The `type` field protects against typos: Directory, DirectoryOrCreate, File, FileOrCreate, Socket, CharDevice, BlockDevice. Without it, hostPath will mount anything at the path, which has caused real production incidents.',
        },
      ],
    },
  ],
};

const whyRarely: LessonBody = {
  learningObjectives: ['Decide when hostPath is appropriate and when it is not'],
  sections: [
    {
      heading: 'The costs',
      blocks: [
        {
          type: 'list',
          items: [
            'Node coupling — the Pod only works on nodes where that path exists. Scheduling is effectively pinned.',
            'Security — any process that can read the Pod can read parts of the host fs. hostPath on `/` is approximately root on the node.',
            'No portability — moving the workload to a different cluster or node class may silently break at runtime.',
            'No replication, no snapshotting — hostPath is the raw node disk; cluster-level data protection does not apply.',
          ],
        },
        {
          type: 'comparisonTable',
          headers: ['Need', 'hostPath appropriate?', 'Alternative'],
          rows: [
            ['A log collector reading /var/log', 'Yes — intentional node-level work', '—'],
            ['An admission webhook reading the kubelet socket', 'Yes — a single system Pod', '—'],
            ['An application needing persistent data', 'No', 'PVC'],
            ['A cache that should outlive the Pod', 'No', 'PVC or external cache service'],
            ['A test setup, "it\'s just my dev cluster"', 'Discouraged', 'A local-path CSI provisioner is just as easy and portable'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Pod Security Standards reject hostPath in the baseline and restricted profiles. If you plan to adopt restricted PSA, hostPath use must be audited and migrated first.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-hostpath-is': whatHostpathIs,
    'why-rarely': whyRarely,
  },
  labs: {},
  simulations: {},
};
