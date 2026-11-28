import type { ConceptContentModule, LessonBody } from '../../types';

const seccompDefault: LessonBody = {
  learningObjectives: [
    'Describe what seccomp\'s runtime/default profile blocks',
    'Know why "RuntimeDefault" should be the floor',
  ],
  sections: [
    {
      heading: 'A kernel-level allow-list on syscalls',
      blocks: [
        {
          type: 'paragraph',
          text: 'seccomp (secure computing) filters system calls using a BPF program attached to the process. Container runtimes ship a default seccomp profile (RuntimeDefault) that blocks syscalls which are either dangerous or unused by application workloads — reboot, swapon, mount, add_key, kexec_load, bpf (prior to 5.8), ptrace (depending on the profile), …',
        },
        {
          type: 'paragraph',
          text: 'The default blocks roughly 44 syscalls. Virtually no application calls them legitimately; most CVE escape chains pass through them. Enabling RuntimeDefault is essentially free protection.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `spec:
  securityContext:
    seccompProfile:
      type: RuntimeDefault`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Before 1.22, seccomp was NOT applied by default — Pods ran unconfined unless you explicitly asked for RuntimeDefault. Since 1.27, kubelet can be configured to apply RuntimeDefault to all workloads via --seccomp-default. Verify your cluster.',
        },
      ],
    },
  ],
};

const customProfiles: LessonBody = {
  learningObjectives: ['Choose when to write a custom profile vs use the default; describe AppArmor\'s role'],
  sections: [
    {
      heading: 'Custom profiles: restrict further',
      blocks: [
        {
          type: 'paragraph',
          text: 'For very sensitive workloads you can write a custom profile — a JSON file in /var/lib/kubelet/seccomp/profiles/ that lists allowed syscalls. The Pod references it by path:',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `seccompProfile:
  type: Localhost
  localhostProfile: profiles/web.json`,
        },
        {
          type: 'paragraph',
          text: 'Writing a custom profile correctly is hard — a misconfigured one silently crashes the app on a blocked syscall. Tools like the Security Profiles Operator can record a profile by observing a Pod during tests. For most workloads, RuntimeDefault is sufficient.',
        },
      ],
    },
    {
      heading: 'AppArmor — complementary, path-based',
      blocks: [
        {
          type: 'paragraph',
          text: 'AppArmor is Linux\'s path-based MAC (Mandatory Access Control). It restricts which files a process may read/write/execute. seccomp filters syscalls; AppArmor filters resource access. The two are complementary — a well-locked-down container runs with both.',
        },
        {
          type: 'list',
          items: [
            'The runtime/default AppArmor profile blocks writes to /etc, /proc, /sys, and prevents mount escapes.',
            'Attach via annotation (older, deprecated) or the appArmorProfile field (since 1.30).',
            'AppArmor is Debian/Ubuntu-first; SELinux is the RHEL/Rocky equivalent (different policy language, same role).',
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'seccomp-default': seccompDefault,
    'custom-profiles': customProfiles,
  },
  labs: {},
  simulations: {},
};
