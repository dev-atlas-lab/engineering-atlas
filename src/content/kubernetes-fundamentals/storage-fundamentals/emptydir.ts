import type { ConceptContentModule, LessonBody } from '../../types';

const whatEmptyDirIs: LessonBody = {
  learningObjectives: [
    'Describe emptyDir\'s lifetime and backing storage options',
    'Use emptyDir for scratch space and tmpfs-backed buffers',
  ],
  sections: [
    {
      heading: 'An empty directory that lives as long as the Pod',
      blocks: [
        {
          type: 'paragraph',
          text: 'emptyDir is the simplest Kubernetes volume: when the Pod is placed on a node, the kubelet creates a new, empty directory under /var/lib/kubelet and mounts it into whichever containers reference it. When the Pod is deleted, the directory is removed. Container restarts within the Pod do NOT clear it — that is how emptyDir survives individual container crashes.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `volumes:
- name: scratch
  emptyDir: {}
- name: cache
  emptyDir:
    medium: Memory             # tmpfs — backed by node RAM
    sizeLimit: 512Mi           # counted against the Pod's memory limit`,
        },
        {
          type: 'list',
          items: [
            'medium: "" (default) — node-local filesystem storage.',
            'medium: Memory — tmpfs; writes land in node RAM. Counted against the Pod\'s memory.',
            'sizeLimit — a hard cap. Writes beyond the limit fail with ENOSPC.',
          ],
        },
      ],
    },
    {
      heading: 'Common use cases',
      blocks: [
        {
          type: 'list',
          items: [
            'Caches that are safe to rebuild — short-term, high-churn data.',
            'Inter-container communication in a Pod (one writes files, another consumes them).',
            'Writable paths on top of a read-only root filesystem. `emptyDir` at /tmp lets you keep `readOnlyRootFilesystem: true` without breaking anything that writes temp files.',
            'Memory-backed scratch for tiny, latency-sensitive data (keys being derived, short-lived request state).',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'emptyDir counts against node ephemeral-storage capacity. If several Pods on one node write GiB-scale data to emptyDir, the node hits DiskPressure and the kubelet starts evicting. Set sizeLimit, or use PVCs for larger scratch.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-emptydir-is': whatEmptyDirIs,
  },
  labs: {},
  simulations: {},
};
