import type { ConceptContentModule, LessonBody } from '../../types';

const staticVsDynamic: LessonBody = {
  learningObjectives: [
    'Distinguish static and dynamic provisioning',
    'Describe the actors involved in each',
  ],
  sections: [
    {
      heading: 'Who creates what',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Step', 'Static', 'Dynamic'],
          rows: [
            ['Create backing storage', 'Administrator (cloud console, Terraform)', 'external-provisioner via CSI CreateVolume'],
            ['Create PV object', 'Administrator (kubectl apply pv.yaml)', 'external-provisioner, after CreateVolume succeeds'],
            ['Create PVC', 'Application team', 'Application team'],
            ['Bind', 'PV controller matches PVC to PV', 'external-provisioner creates PV already bound'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Static provisioning is the pattern when the storage has to exist anyway — imported disks, pre-existing filesystems, local storage with specific hardware. Dynamic provisioning is the pattern for new storage created on demand — the common case.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'A cluster typically has BOTH. Default dynamic for new workloads; a few static PVs for special cases (legacy data, specific hardware).',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'static-vs-dynamic': staticVsDynamic,
  },
  labs: {},
  simulations: {},
};
