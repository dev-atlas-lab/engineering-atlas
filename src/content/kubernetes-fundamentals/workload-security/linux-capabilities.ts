import type { ConceptContentModule, LessonBody } from '../../types';

const whatCapabilitiesAre: LessonBody = {
  learningObjectives: [
    'Describe Linux capabilities as splitting root into many privileges',
    'Enumerate the capabilities containers have by default',
  ],
  sections: [
    {
      heading: 'Not one privilege, 40+',
      blocks: [
        {
          type: 'paragraph',
          text: 'Historically, Unix had two levels of privilege: root (UID 0) and not-root. Capabilities (introduced in Linux 2.2) split root into dozens of named privileges, each gating a specific kernel ability. Instead of granting a process "root," you can grant it just CAP_NET_BIND_SERVICE to bind low ports, or CAP_SYS_PTRACE to attach to processes.',
        },
        {
          type: 'paragraph',
          text: 'Container runtimes set a default capability set for every container. The default (per OCI runtime-spec) is deliberately smaller than "root":',
        },
        {
          type: 'list',
          items: [
            'CHOWN, DAC_OVERRIDE, FSETID, FOWNER — file ownership',
            'MKNOD, SETGID, SETUID, SETPCAP, NET_BIND_SERVICE, NET_RAW, SYS_CHROOT, KILL, AUDIT_WRITE',
          ],
        },
        {
          type: 'paragraph',
          text: 'Notably absent from the default: NET_ADMIN, SYS_ADMIN, SYS_MODULE, SYS_PTRACE, DAC_READ_SEARCH. Adding any of these significantly expands attack surface.',
        },
      ],
    },
    {
      heading: 'The most dangerous ones',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Capability', 'What it enables', 'Why it matters'],
          rows: [
            ['SYS_ADMIN', 'Mounts, pivot_root, cgroup tweaks, keyctl, etc.', 'Covers ~50% of all container escape techniques'],
            ['NET_ADMIN', 'Interface configuration, routing changes, raw sockets', 'Lets a container reroute node traffic or sniff it'],
            ['SYS_PTRACE', 'ptrace any process on the host (with other caps)', 'Debug-level access to other containers\' memory'],
            ['SYS_MODULE', 'Insert kernel modules', 'Effectively root on the kernel'],
            ['DAC_READ_SEARCH / DAC_OVERRIDE', 'Bypass file permission checks', 'Read /etc/shadow etc.'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: '"privileged: true" is approximately equivalent to adding ALL capabilities plus removing seccomp, AppArmor, and a few other hardening layers. If you find yourself wanting privileged, step back and check whether a specific capability would suffice.',
        },
      ],
    },
  ],
};

const droppingAll: LessonBody = {
  learningObjectives: ['Drop ALL and add minimum for a given app'],
  sections: [
    {
      heading: 'Drop ALL first, add later',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          code: `securityContext:
  capabilities:
    drop: [ALL]
    # Only add if the application proves it needs this:
    # add: [NET_BIND_SERVICE]  # bind ports < 1024 as non-root`,
        },
        {
          type: 'paragraph',
          text: 'The syntax is additive: drop runs first, then add. "drop: [ALL], add: [NET_BIND_SERVICE]" means "no caps except NET_BIND_SERVICE." If the app does not need low ports, no add is needed — zero capabilities.',
        },
        {
          type: 'list',
          items: [
            'How to know what the app needs: run it with drop: [ALL] in a dev environment. The error will name the missing capability (or EPERM on a specific syscall).',
            'If the app errors with "operation not permitted" on bind to port 80, it needs NET_BIND_SERVICE OR to bind an unprivileged port (8080) and use a Service for :80 translation. The second option avoids the cap entirely.',
            'Capabilities are additive across the containers in a Pod — the Pod does not have a single capability set.',
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-capabilities-are': whatCapabilitiesAre,
    'dropping-all': droppingAll,
  },
  labs: {},
  simulations: {},
};
