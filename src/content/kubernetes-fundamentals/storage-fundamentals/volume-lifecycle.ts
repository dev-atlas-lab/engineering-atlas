import type { ConceptContentModule, LessonBody } from '../../types';

const phaseGraph: LessonBody = {
  learningObjectives: [
    'Enumerate the PV phases and transitions',
    'Describe what actor drives each transition',
  ],
  sections: [
    {
      heading: 'Four phases',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Phase', 'Meaning'],
          rows: [
            ['Available', 'The PV exists and is unbound; eligible for matching'],
            ['Bound', 'A PVC is bound to the PV; backing storage attached to a Pod (eventually)'],
            ['Released', 'The PVC that was bound has been deleted, but Kubernetes has not reclaimed the backing storage yet (Retain policy, or Delete in progress)'],
            ['Failed', 'Automatic reclamation (CSI DeleteVolume for Delete policy) failed'],
          ],
        },
        {
          type: 'list',
          items: [
            'Available → Bound: a matching PVC appears (or the external-provisioner creates the PV already-bound).',
            'Bound → Released: the bound PVC is deleted.',
            'Released → (gone): the CSI driver succeeds in deleting the backing storage (Delete) OR the admin recreates a matching PV (Retain, manual cleanup).',
            'Released → Failed: the delete fails (missing credentials, backing storage already gone, cloud API error).',
          ],
        },
      ],
    },
  ],
};

const releasedIsStuck: LessonBody = {
  learningObjectives: ['Recover a Released PV without losing the data'],
  sections: [
    {
      heading: 'Released PVs can\'t be re-bound',
      blocks: [
        {
          type: 'paragraph',
          text: 'A PV in Released state is a semi-stuck state. The old PVC is gone, but the PV is still carrying a reference to it (`spec.claimRef`). No new PVC can bind to it until that reference is cleared — the PV controller does not know whether the backing storage still has important data.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# Recover: clear the claimRef so the PV becomes Available.
kubectl patch pv pv-abc -p '{"spec":{"claimRef":null}}'

# Then create a fresh PVC that matches it:
kubectl apply -f new-pvc.yaml
# The PVC binds to pv-abc; the old data is preserved.`,
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'This recovery is intentional friction for Retain. Clearing the claimRef says "yes, I understand there is old data on this volume and I want to reuse it." Running this on Delete-policy volumes is unusual — normally the PV is already being deleted at that point.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'vol-lifecycle-kc-1',
      type: 'single-choice',
      prompt: 'A Retained PV enters the Released phase after its PVC is deleted. You create a new PVC with the exact same capacity, accessModes, and storageClassName, yet the new PVC stays Pending. Why?',
      difficulty: 'intermediate',
      learningObjective: 'Describe the Released state and the manual recovery path',
      options: [
        { id: 'a', label: 'The PV still holds spec.claimRef pointing to the deleted PVC, preventing automatic re-binding', correct: true, explanation: 'Correct — Kubernetes will not bind a Released PV to a new claim until an operator clears spec.claimRef (or recreates a PV pointing to the volume).' },
        { id: 'b', label: 'Retained PVs can never be mounted again in Kubernetes', correct: false, explanation: 'They can be reused once an operator intentionally clears spec.claimRef or creates a new PV handle.' },
        { id: 'c', label: 'Released means the backing disk was deleted and only metadata remains', correct: false, explanation: 'Released with Retain means the backing storage is still intact; the PV is simply awaiting operator action.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'phase-graph': phaseGraph,
    'released-is-stuck': releasedIsStuck,
  },
  labs: {},
  simulations: {},
};
