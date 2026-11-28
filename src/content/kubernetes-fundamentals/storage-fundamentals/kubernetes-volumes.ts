import type { ConceptContentModule, LessonBody } from '../../types';

const podScopedMounts: LessonBody = {
  learningObjectives: [
    'Describe volumes as Pod-level mountpoints shared across containers',
    'Explain why Kubernetes defines its own volume abstraction instead of reusing Docker volumes',
  ],
  sections: [
    {
      heading: 'A volume belongs to the Pod',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Kubernetes volume is declared on the Pod and can be mounted into one or more containers in that Pod. Unlike Docker\'s container-scoped volumes, a Kubernetes volume\'s lifetime is tied to the Pod — not to a single container. When the Pod is deleted, the volume (or at least its binding; see PVs) goes away or is reclaimed.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `spec:
  volumes:
  - name: shared
    emptyDir: {}
  - name: config
    configMap:
      name: app-config
  containers:
  - name: app
    volumeMounts:
    - name: shared
      mountPath: /scratch
    - name: config
      mountPath: /etc/app
      readOnly: true
  - name: sidecar
    volumeMounts:
    - name: shared
      mountPath: /scratch   # same volume visible in both containers`,
        },
        {
          type: 'list',
          items: [
            'volumes — declared once at the Pod level, by name.',
            'volumeMounts — each container independently decides whether to mount a volume and at what path.',
            'Containers in the same Pod sharing a volume is the canonical "sidecar" pattern: one container writes, another reads.',
          ],
        },
      ],
    },
  ],
};

const volumeTypeTaxonomy: LessonBody = {
  learningObjectives: [
    'Place the common volume types along a lifetime axis',
    'Match a volume type to its use case',
  ],
  sections: [
    {
      heading: 'By lifetime',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Type', 'Lifetime', 'Typical use'],
          rows: [
            ['emptyDir', 'Pod', 'Scratch space, inter-container sharing'],
            ['configMap / secret', 'Pod (object referenced is cluster-scoped)', 'Mount config / secret files into a Pod'],
            ['downwardAPI', 'Pod', 'Expose Pod/node metadata as files'],
            ['projected', 'Pod', 'Composite of several volume sources into one directory'],
            ['hostPath', 'Node', 'Mount host directory; nearly always a bad idea for apps'],
            ['persistentVolumeClaim', 'PV (longer than Pod)', 'Persistent data'],
            ['csi (ephemeral)', 'Pod', 'CSI-provided ephemeral volumes with vendor features'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The upstream list has historically been larger (nfs, iscsi, awsElasticBlockStore, gcePersistentDisk, azureDisk, cephfs, …). Those "in-tree" volume plugins are being replaced by CSI drivers; their removal is called "CSI migration." New code should use CSI exclusively.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'pod-scoped-mounts': podScopedMounts,
    'volume-type-taxonomy': volumeTypeTaxonomy,
  },
  labs: {},
  simulations: {},
};
