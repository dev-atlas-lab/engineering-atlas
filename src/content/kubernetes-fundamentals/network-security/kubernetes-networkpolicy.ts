import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { networkPolicyScene } from '../security-scenes';
import { networkPolicySimulation } from '../security-simulations';
import { renderNpState } from '../security-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const whatANetpolIs: LessonBody = {
  learningObjectives: [
    'Describe the structure of a NetworkPolicy object',
    'Explain how podSelector picks the affected Pods',
  ],
  sections: [
    {
      heading: 'An object with three fields that matter',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          code: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
  namespace: backend
spec:
  podSelector:           # which Pods this policy affects
    matchLabels: { app: api }
  policyTypes: [Ingress] # this policy restricts ingress only
  ingress:               # allow rules — anything not matched is denied
  - from:
    - namespaceSelector: { matchLabels: { tier: frontend } }
      podSelector:       { matchLabels: { app: web } }
    ports:
    - port: 8080
      protocol: TCP`,
        },
        {
          type: 'list',
          items: [
            'podSelector (required) — a label selector in this policy\'s namespace. An empty selector `{}` selects every Pod in the namespace.',
            'policyTypes — explicitly declares which directions are restricted. Set to `[Ingress]`, `[Egress]`, or both.',
            'ingress / egress — each is a list of rules. A rule either lists `from`/`to` peers only (any port permitted) or combines peers with specific ports.',
          ],
        },
      ],
    },
    {
      heading: 'Selected vs unselected',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Pod is in one of two states for a given direction. "Unselected" — no policy of the relevant policyType selects this Pod. Behavior: allow all. "Selected" — at least one policy selects it. Behavior: deny by default, allow what any selecting policy permits (union).',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The transition happens the instant the FIRST policy is applied. A namespace with no policies at all: everything communicates. The moment you add ONE policy selecting even one Pod, that Pod becomes default-deny. This is why the default-deny-everything pattern is typically applied first.',
        },
      ],
    },
  ],
  visualization: networkPolicyScene,
};

const additiveSemantics: LessonBody = {
  learningObjectives: [
    'Describe additive policy semantics with examples',
    'Explain what cannot be denied via NetworkPolicy',
  ],
  sections: [
    {
      heading: 'Policies union — they do not intersect',
      blocks: [
        {
          type: 'paragraph',
          text: 'When several policies select the same Pod, their allow rules are OR\'d. There is no deny rule in NetworkPolicy; adding a stricter policy cannot override a looser one. To tighten, you must remove or edit the permissive policy — adding another one does not help.',
        },
        {
          type: 'list',
          items: [
            'Policy A allows ingress from the frontend namespace. Policy B (also selecting the same Pod) allows ingress from the analytics namespace. Effect: ingress from EITHER is allowed.',
            'To restrict traffic you authored earlier, edit or delete the policy that allowed it.',
            'Logs showing blocked traffic from a Pod you expected to be allowed → check for a missing selecting policy, not a "deny" policy somewhere.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Vendor extensions (Calico\'s GlobalNetworkPolicy, Cilium\'s CiliumNetworkPolicy) DO support deny rules and are evaluated with precedence. Standard upstream NetworkPolicy is allow-only.',
        },
      ],
    },
  ],
};

const netpolLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Four Pods, three namespaces, four policy scenarios. Submit traffic between any pair and see which policies apply and why the verdict is allow or deny.',
  learningObjectives: [
    'See allow-all baseline flip to default-deny after a single policy applies',
    'See additive ingress semantics',
    'Diagnose a missing cross-namespace selector',
  ],
  prerequisites: [
    { type: 'knowledge', label: 'Pod networking', description: 'Know that Pod IPs and labels are what selectors match against.' },
  ],
  content: {
    simulationId: 'networkpolicy-simulator',
    instructions: [
      { id: 'step-1', label: 'No policies', description: 'Scenario = "No policies". web → api is allowed because nothing selects any Pod.' },
      { id: 'step-2', label: 'Default-deny ingress on backend', description: 'web → api is now denied — the default-deny policy selects all Pods in backend and allows nothing.' },
      { id: 'step-3', label: 'Add the allow policy', description: 'Scenario = "default-deny plus allow web → api". web → api is allowed again; analytics → api is still denied (the allow rule only matches the frontend namespace).' },
      { id: 'step-4', label: 'Try an unexpected pair', description: 'With the allow scenario active, change source to analytics. Denied — no rule matches the analytics namespace.' },
      { id: 'step-5', label: 'Egress scenario', description: 'Scenario = "restrict egress on web". web may only reach api; try web → db (denied by egress at source).' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'deterministic',
        label: 'The same request always yields the same verdict',
        check: (state) => {
          const s = state as { decision: { allowed: boolean; reason: string } | null };
          return s.decision === null || typeof s.decision.allowed === 'boolean';
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'what-a-netpol-is': whatANetpolIs,
    'additive-semantics': additiveSemantics,
  },
  labs: {
    'networkpolicy-simulator': netpolLab,
  },
  simulations: {
    'networkpolicy-simulator': bindSimulation(networkPolicySimulation, renderNpState),
  },
};
