import type { ConceptContentModule, LessonBody } from '../../types';

const declaring: LessonBody = {
  learningObjectives: [
    'Contrast declarative and imperative approaches with concrete Kubernetes examples',
    'Explain the kind of mistakes each approach is prone to',
  ],
  sections: [
    {
      heading: 'Declaring versus scripting',
      blocks: [
        {
          type: 'paragraph',
          text: 'Imperative configuration describes a sequence of steps to reach a goal: "run this container, then run that one, then update the load balancer." Declarative configuration describes the goal itself: "there should be 3 of this Pod running, behind a Service named web." You write what, not how. In Kubernetes, the YAML manifest you apply is a declaration; the control plane figures out how to make it so.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'Imperative', 'Declarative'],
          rows: [
            ['Example', 'kubectl run web --image=nginx; kubectl scale --replicas=3', 'kubectl apply -f deployment.yaml (replicas: 3 inside the file)'],
            ['Where the truth lives', 'In the sequence of commands actually run', 'In the manifest files (source of truth) + cluster state'],
            ['Idempotence', 'Each command has an effect; re-running can fail or double-apply', 'Re-applying the same file is a no-op if the cluster already matches'],
            ['Diff / drift detection', 'Very hard — no reference to compare against', 'Trivial — compare manifest to cluster'],
          ],
        },
      ],
    },
    {
      heading: 'The same change, two ways',
      blocks: [
        {
          type: 'code',
          language: 'bash',
          caption: 'Imperative — tell Kubernetes the steps',
          code: 'kubectl create deployment web --image=nginx:1.25\nkubectl scale deployment/web --replicas=3\nkubectl set image deployment/web nginx=nginx:1.26',
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'Declarative — describe the desired end state',
          code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: nginx
          image: nginx:1.26`,
        },
        {
          type: 'paragraph',
          text: 'The declarative file is the same whether you are creating the Deployment for the first time or updating an existing one. "kubectl apply -f" reads the file, sends it to the API Server, and the control plane does whatever is needed to make the cluster match: create, update, or no-op.',
        },
      ],
    },
  ],
};

const whyChosen: LessonBody = {
  learningObjectives: ['Explain why Kubernetes commits to declarative configuration and what properties that buys'],
  sections: [
    {
      heading: 'Why Kubernetes picks declarative',
      blocks: [
        {
          type: 'list',
          items: [
            'The manifests are a single source of truth that can live in Git, be reviewed, and be replayed.',
            'The control plane can continuously reconcile actual state toward the declaration — the same mechanism that applies a change is the mechanism that heals from a failure.',
            'Operations become idempotent and diffable: "what would change if I applied this?" is a sensible question with a clear answer.',
            'It naturally supports GitOps: a repo is the source of truth, and an operator (Argo CD, Flux) applies it continuously.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Imperative commands still exist (kubectl create, kubectl scale, kubectl set) and are useful for quick fixes and exploration. The expectation in production is that every real change goes through a manifest in version control — the imperative tools are for the console, not the pipeline.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'declarative-kc-1',
      type: 'single-choice',
      prompt: 'Why does applying the same declarative manifest twice generally cause no harm, whereas running the same imperative command twice might?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why Kubernetes commits to declarative configuration and what properties that buys',
      options: [
        { id: 'a', label: 'The declarative manifest describes an end state, so the control plane computes the diff and does nothing if the cluster already matches', correct: true, explanation: 'Correct — this is why declarative config is idempotent and amenable to GitOps.' },
        { id: 'b', label: 'Kubernetes refuses to apply a manifest twice', correct: false, explanation: 'There is no such refusal — applying is simply a no-op when nothing needs to change.' },
        { id: 'c', label: 'Imperative commands are always rejected', correct: false, explanation: 'Imperative commands exist and are useful — they are just less safe to re-run blindly.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'declaring-what-not-how': declaring,
    'why-kubernetes-chose-declarative': whyChosen,
  },
  labs: {},
  simulations: {},
};
