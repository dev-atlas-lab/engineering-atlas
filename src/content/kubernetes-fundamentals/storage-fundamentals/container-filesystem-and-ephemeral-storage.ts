import type { ConceptContentModule, LessonBody } from '../../types';
import { storageLayersScene } from '../storage-scenes';

const ephemeralRootfs: LessonBody = {
  learningObjectives: [
    'Describe the overlay filesystem layers inside a container',
    'Explain what happens to a container\'s writable layer on restart',
  ],
  analogy:
    'A container\'s filesystem is like a transparency over a printed page: the base is the image\'s read-only layers; your pen marks go on the transparency. Replacing the transparency wipes your marks without touching the printed page.',
  sections: [
    {
      heading: 'An image is read-only; the container adds one writable layer',
      blocks: [
        {
          type: 'paragraph',
          text: 'A container image is a stack of read-only filesystem layers. When the runtime starts a container, it adds one more layer on top — writable — using a union filesystem (overlayfs on Linux). Reads pass through to the first layer that has the file. Writes go to the top layer. Deletes create "whiteout" markers on the top layer that hide files in lower layers.',
        },
        {
          type: 'list',
          items: [
            'The writable top layer is per-container, not per-image. A Deployment with 10 replicas has 10 independent writable layers.',
            'The layer is stored under the container runtime\'s overlayfs directory on the node (/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/... or similar).',
            'When the container exits — crash, restart, image update — the top layer is destroyed. A fresh one is created for the next run from the same (unchanged) image layers.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Writing valuable data to `/` or any path inside the image tree is a bug waiting to happen. The next container restart loses it. Even a transient container restart from a failing liveness probe is enough.',
        },
      ],
    },
  ],
  visualization: storageLayersScene,
};

const whereWritesGo: LessonBody = {
  learningObjectives: [
    'Identify paths that are ephemeral vs volume-backed',
    'Describe what writes go into node ephemeral storage',
  ],
  sections: [
    {
      heading: 'Three different "ephemeral"',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Write destination', 'Lifetime', 'Backed by'],
          rows: [
            ['A path inside the image (e.g. /var/cache/app)', 'Container restart', 'Container\'s overlayfs writable layer on the node'],
            ['An emptyDir volume mount', 'Pod deletion', 'Node disk (or memory with medium: Memory)'],
            ['A tmpfs mount via emptyDir medium: Memory', 'Pod deletion', 'Node RAM, counts against the Pod memory limit'],
            ['A PVC-backed mount', 'PV lifetime (longer than Pod by default)', 'Backing storage system via CSI'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Writes to the container\'s own filesystem and to emptyDir both count against the node\'s ephemeral-storage capacity. If the node runs out of ephemeral storage, the kubelet begins evicting Pods — see the disk-pressure concept in Production Storage Operations.',
        },
      ],
    },
    {
      heading: 'readOnlyRootFilesystem changes this',
      blocks: [
        {
          type: 'paragraph',
          text: 'Setting `securityContext.readOnlyRootFilesystem: true` makes the container rootfs non-writable. Attempts to write to `/` fail with EROFS. Apps that need scratch space must mount an emptyDir (or similar) at the writable paths. This is a hardening recommendation — a compromised process cannot drop binaries or tamper with the container image.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'ephemeral-rootfs': ephemeralRootfs,
    'where-writes-go': whereWritesGo,
  },
  labs: {},
  simulations: {},
};
