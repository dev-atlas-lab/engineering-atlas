import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { securityContextScene } from '../security-scenes';
import { workloadSecuritySimulation } from '../security-simulations';
import { renderWorkloadSecurityState } from '../security-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const podVsContainer: LessonBody = {
  learningObjectives: [
    'Describe the Pod-level and container-level securityContext',
    'Know which fields live at which level',
  ],
  sections: [
    {
      heading: 'Two layers, container wins on conflicts',
      blocks: [
        {
          type: 'paragraph',
          text: 'securityContext appears on both Pod and container. The Pod-level is the default for all containers; the container-level overrides on a per-container basis. Many fields are only valid at one level.',
        },
        {
          type: 'comparisonTable',
          headers: ['Field', 'Pod-level', 'Container-level'],
          rows: [
            ['runAsUser / runAsGroup', 'Yes (default)', 'Yes (override)'],
            ['runAsNonRoot', 'Yes', 'Yes'],
            ['fsGroup, supplementalGroups', 'Yes', 'No — volume-ownership is Pod-wide'],
            ['capabilities', 'No', 'Yes'],
            ['privileged', 'No', 'Yes'],
            ['readOnlyRootFilesystem', 'No', 'Yes'],
            ['allowPrivilegeEscalation', 'No', 'Yes'],
            ['seccompProfile', 'Yes (default)', 'Yes (override)'],
          ],
        },
      ],
    },
  ],
  visualization: securityContextScene,
};

const coreFields: LessonBody = {
  learningObjectives: ['Set every important securityContext field with intent'],
  sections: [
    {
      heading: 'The restricted-ready template',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          code: `spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile: { type: RuntimeDefault }
  containers:
  - name: app
    image: myapp:v1
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: [ALL]
      # Only when the app needs to bind ports < 1024 as non-root:
      # capabilities: { drop: [ALL], add: [NET_BIND_SERVICE] }`,
        },
        {
          type: 'list',
          items: [
            'runAsNonRoot — the kubelet refuses to start the container if its process would be UID 0. Belt-and-braces alongside the image\'s USER directive.',
            'allowPrivilegeEscalation: false — sets the no_new_privs flag. Even if a setuid binary exists in the image, it cannot elevate.',
            'readOnlyRootFilesystem: true — mount rootfs read-only. Writable paths become explicit emptyDir or tmpfs mounts.',
            'capabilities.drop: [ALL] — start from zero and add only what the app provably needs. Most apps need nothing.',
            'seccompProfile: RuntimeDefault — blocks ~44 dangerous syscalls at near-zero performance cost.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'If your image has `USER root` in the Dockerfile and you don\'t set securityContext, the container runs as root. The restricted profile rejects this at admission — or if admission is permissive, you have the worst of both worlds (root with defaults that the app may not need).',
        },
      ],
    },
  ],
};

const securityLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Configure a Pod security context and see what findings a baseline scan reports. Then simulate the three Pod Security Admission profiles to see which configurations pass or fail.',
  learningObjectives: [
    'Build intuition for which setting flips which finding',
    'Experience what the three PSA profiles enforce',
  ],
  prerequisites: [
    { type: 'knowledge', label: 'Linux capabilities', description: 'Know what SYS_ADMIN means (will be covered in a sibling concept).' },
  ],
  content: {
    simulationId: 'workload-security-simulator',
    instructions: [
      { id: 'step-1', label: 'Insecure baseline', description: 'Set runAsUser=0, privileged=true, drop ALL=false, seccomp=unconfined. Scan: critical + high findings. PSA restricted: rejected.' },
      { id: 'step-2', label: 'Drop privileged', description: 'Set privileged=false. Many findings clear, but runAsUser=0 remains high-severity.' },
      { id: 'step-3', label: 'Non-root with capabilities dropped', description: 'Set runAsUser=1000, runAsNonRoot=true, dropAll=true, seccomp=runtime/default. Scan: clean. PSA restricted: admitted.' },
      { id: 'step-4', label: 'Try adding NET_ADMIN', description: 'Toggle "Add NET_ADMIN". Scan shows a high finding. PSA restricted: rejected (only NET_BIND_SERVICE allowed).' },
      { id: 'step-5', label: 'Switch profile to baseline', description: 'Admission now accepts NET_ADMIN; only SYS_ADMIN would be rejected. Compare scan output vs admission.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'scan-emits-findings',
        label: 'Scan always emits at least one finding (info if nothing else)',
        check: (state) => {
          const s = state as { findings: unknown[] };
          return s.findings.length > 0;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'pod-vs-container': podVsContainer,
    'the-core-fields': coreFields,
  },
  labs: {
    'workload-security-simulator': securityLab,
  },
  simulations: {
    'workload-security-simulator': bindSimulation(workloadSecuritySimulation, renderWorkloadSecurityState),
  },
};
