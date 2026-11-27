import type { ConceptContentModule, LessonBody } from '../../types';

const readingAManifest: LessonBody = {
  learningObjectives: ['Read a basic manifest for a Pod, Deployment, and Service'],
  sections: [
    {
      heading: 'The three manifests you will meet first',
      blocks: [
        {
          type: 'code',
          language: 'yaml',
          caption: 'A single Pod',
          code: `apiVersion: v1
kind: Pod
metadata:
  name: hello
  labels: { app: hello }
spec:
  containers:
    - name: nginx
      image: nginx:1.26
      ports: [{ containerPort: 80 }]`,
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'A Deployment of the same image — the normal way to run a workload',
          code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello
spec:
  replicas: 3
  selector:
    matchLabels: { app: hello }
  template:
    metadata:
      labels: { app: hello }
    spec:
      containers:
        - name: nginx
          image: nginx:1.26`,
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'A Service in front of it',
          code: `apiVersion: v1
kind: Service
metadata:
  name: hello
spec:
  selector:
    app: hello
  ports:
    - port: 80
      targetPort: 80`,
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Notice the labels pattern: the Pod template labels (template.metadata.labels) must be selected by the Deployment\'s selector AND by the Service\'s selector. This is how three separate objects are "wired together" — by matching labels, not by direct references.',
        },
      ],
    },
  ],
};

const applyVsCreate: LessonBody = {
  learningObjectives: ['Explain what kubectl apply actually does, and how it differs from create'],
  sections: [
    {
      heading: 'apply is declarative',
      blocks: [
        {
          type: 'paragraph',
          text: 'kubectl apply -f file.yaml does one of three things depending on current cluster state: create the object if it does not exist, patch it to match the file if it does, or do nothing if it already matches. It is idempotent — re-running the same apply is safe. It is the normal command for GitOps-style workflows.',
        },
        {
          type: 'paragraph',
          text: 'kubectl create -f file.yaml is imperative — it creates the object, failing if one with the same name already exists. It does not know how to patch; it does not record its intent. Create is useful in scripts that explicitly want "fail if already there" semantics.',
        },
      ],
    },
    {
      heading: 'Server-Side Apply',
      blocks: [
        {
          type: 'paragraph',
          text: 'The older "client-side apply" computed the patch locally in kubectl and sent it to the API Server. Server-Side Apply (the default now) sends the full manifest and lets the API Server compute the diff, tracking which fields each "field manager" (a user, a controller) is responsible for. This means two managers can safely update different fields of the same object without stepping on each other.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The main user-visible effect: "kubectl apply" no longer leaves a last-applied-configuration annotation on objects by default, and ownership of fields is tracked explicitly. Scripts that read that annotation needed updating when the default switched to Server-Side Apply.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'reading-a-manifest': readingAManifest,
    'apply-vs-create': applyVsCreate,
  },
  labs: {},
  simulations: {},
};
