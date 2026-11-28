import type { ConceptContentModule, LessonBody } from '../../types';
import { blueGreenCanaryScene } from '../operations-scenes';

const howBlueGreenWorks: LessonBody = {
  learningObjectives: [
    'Describe the Service-selector-flip pattern',
    'Explain why Kubernetes itself does not ship a "blue-green" API',
  ],
  sections: [
    {
      heading: 'Two Deployments, one Service',
      blocks: [
        {
          type: 'paragraph',
          text: 'Blue-green is a pattern built on top of plain Kubernetes primitives — there is no `kind: BlueGreenDeployment`. You run two Deployments (same application, different labels: `version: blue` and `version: green`) and a Service whose selector includes `version: blue`. To cut over, you edit the Service to select `version: green`.',
        },
        {
          type: 'code',
          language: 'yaml',
          code: `# Stable state: Service points at blue
apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  selector:
    app: web
    version: blue
  ports: [{ port: 80, targetPort: 8080 }]

# Cutover: edit the Service to select version: green
# kubectl patch svc web -p '{"spec":{"selector":{"app":"web","version":"green"}}}'`,
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Deploy green alongside blue (full replica count).',
            'Wait for green to be Ready and (optionally) warm.',
            'Run smoke tests against green via a second Service that always points at green.',
            'Flip the main Service selector to green. Rollback is the reverse flip.',
            'Optionally scale blue down after a soak period.',
          ],
        },
      ],
    },
  ],
  visualization: blueGreenCanaryScene,
};

const blueGreenTradeoffs: LessonBody = {
  learningObjectives: ['Decide whether blue-green fits a given workload'],
  sections: [
    {
      heading: 'What blue-green costs you',
      blocks: [
        {
          type: 'list',
          items: [
            '2x compute during the cutover window — the full green stack runs alongside the full blue stack.',
            'Stateful workloads are hard: you cannot run two independent databases and switch — they must share state or be read-only.',
            'In-flight connections on the old stack still hit blue; the flip only redirects NEW connections. Long-lived connections (WebSockets, SSE) must drain explicitly.',
          ],
        },
        {
          type: 'comparisonTable',
          headers: ['Property', 'Rolling', 'Blue-Green'],
          rows: [
            ['Resource cost during rollout', 'maxSurge extra Pods only', '2x — full new stack'],
            ['Risk model', 'Spread across the rollout window', 'Concentrated at the single cutover moment'],
            ['Rollback speed', 'Trigger a reverse rolling update; minutes', 'Flip selector; seconds'],
            ['Warm-up / smoke-test opportunity', 'Hard — pods receive traffic as soon as Ready', 'Easy — green is idle until cutover'],
            ['DB schema change compatibility', 'Must be backwards-compatible for the whole rollout window', 'Must be backwards-compatible around the cutover'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Blue-green with a 10-minute soak period is a reasonable default for services with real per-request value (payments, user-facing CRUD). Rolling updates with readiness + minReadySeconds are fine for most stateless internal services and are a lot cheaper.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'how-bluegreen-works': howBlueGreenWorks,
    'bluegreen-tradeoffs': blueGreenTradeoffs,
  },
  labs: {},
  simulations: {},
};
