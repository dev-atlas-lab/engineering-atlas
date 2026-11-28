import type { ConceptContentModule, LessonBody } from '../../types';

const whatPrivilegedMeans: LessonBody = {
  learningObjectives: [
    'Describe what privileged: true disables',
    'Identify the few legitimate uses',
  ],
  sections: [
    {
      heading: 'An escape hatch, not a convenience',
      blocks: [
        {
          type: 'paragraph',
          text: '`securityContext.privileged: true` is a single boolean that disables virtually every container isolation layer. Specifically it:',
        },
        {
          type: 'list',
          items: [
            'Grants ALL capabilities (including SYS_ADMIN, SYS_MODULE, SYS_BOOT).',
            'Removes the AppArmor / SELinux confinement profile.',
            'Removes the seccomp filter (unconfined).',
            'Allows the container to access host devices (/dev/*).',
            'Permits mounting filesystems at arbitrary paths.',
            'Disables many cgroup restrictions.',
          ],
        },
        {
          type: 'paragraph',
          text: 'The net effect: a privileged container is effectively root on the node. It can read the host\'s filesystem (mount / into itself), modify kernel settings, load modules, and read every other Pod\'s memory via /proc. Treat it as equivalent to adding a user with `sudo` to the node.',
        },
      ],
    },
    {
      heading: 'When it is legitimately used',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Workload', 'Needs privileged?', 'Why'],
          rows: [
            ['CNI node agent (Calico, Cilium)', 'Often yes', 'Writes iptables, loads eBPF, configures interfaces'],
            ['CSI node plugin', 'Often yes', 'Mounts volumes into the kubelet\'s mount propagation namespace'],
            ['Node monitoring (eBPF-based)', 'Yes', 'Needs to attach BPF to kernel hooks'],
            ['Normal application', 'No', 'Nothing an app does requires this'],
            ['Debug container', 'Usually no', 'kubectl debug can run as privileged ephemeral container'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Pod Security Standards reject privileged in both baseline and restricted profiles. A workload that needs privileged must live in a namespace with pod-security.kubernetes.io/enforce=privileged. Keep those namespaces audit-logged and periodically reviewed — the list of "needs privileged" tends to grow for operational convenience rather than genuine necessity.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-privileged-means': whatPrivilegedMeans,
  },
  labs: {},
  simulations: {},
};
