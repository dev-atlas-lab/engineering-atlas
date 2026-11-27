import type { ConceptContentModule, LessonBody } from '../../types';

const runtimeUnderPod: LessonBody = {
  learningObjectives: ['Distinguish the container runtime from Kubernetes'],
  sections: [
    {
      heading: 'The layer that actually runs containers',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes does not run containers. The container runtime does. On every node, a container runtime process (typically containerd or CRI-O) is what pulls images, sets up Linux namespaces and cgroups, and starts container processes. The kubelet tells the runtime what to run; the runtime does the work.',
        },
        {
          type: 'list',
          items: [
            'Pulls OCI container images from the configured registries',
            'Creates and destroys Linux namespaces (pid, net, mount, uts, ipc, user) for each container',
            'Applies cgroup limits for CPU and memory',
            'Starts and stops container processes; captures their stdout/stderr for the kubelet to serve as logs',
          ],
        },
      ],
    },
  ],
};

const criAndRuntimeChoices: LessonBody = {
  learningObjectives: ['Explain the role of the Container Runtime Interface (CRI)'],
  sections: [
    {
      heading: 'CRI: one interface, many runtimes',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Container Runtime Interface (CRI) is a gRPC protocol the kubelet speaks to the runtime. Any runtime that implements CRI can be used — the kubelet does not care whether containerd or CRI-O is on the other end. This is what makes the container runtime genuinely pluggable rather than a built-in part of Kubernetes.',
        },
        {
          type: 'comparisonTable',
          headers: ['Runtime', 'Origin', 'Typical use'],
          rows: [
            ['containerd', 'Extracted from Docker; CNCF-graduated', 'Default on most managed Kubernetes services (EKS, GKE, AKS)'],
            ['CRI-O', 'Built by Red Hat specifically as a CRI runtime', 'Default on OpenShift and some Red Hat distributions'],
            ['Docker (via dockershim)', 'Historical; removed from Kubernetes in 1.24', 'Not used in modern clusters'],
          ],
        },
      ],
    },
    {
      heading: 'Why dockershim was removed',
      blocks: [
        {
          type: 'paragraph',
          text: 'Early Kubernetes talked to Docker directly, before CRI existed. When CRI was introduced, Kubernetes shipped an adapter — dockershim — that translated CRI calls into Docker API calls so existing Docker-based clusters kept working. dockershim was always extra maintenance burden: Docker itself used containerd internally, so dockershim was "CRI → Docker → containerd," three hops where one would do.',
        },
        {
          type: 'paragraph',
          text: 'In Kubernetes 1.24 (April 2022), dockershim was removed. Clusters either moved to containerd directly (the same engine Docker was using underneath) or to CRI-O. Image compatibility was unaffected — OCI images built with "docker build" run fine on either. The removal simplified the kubelet and eliminated one maintenance target; see the Kubernetes vs Docker concept for the end-user impact.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'runtime-under-the-pod': runtimeUnderPod,
    'cri-and-runtime-choices': criAndRuntimeChoices,
  },
  labs: {},
  simulations: {},
};
