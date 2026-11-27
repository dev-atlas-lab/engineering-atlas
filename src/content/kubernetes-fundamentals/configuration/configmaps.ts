import type { ConceptContentModule, LessonBody } from '../../types';

const configMapsOverview: LessonBody = {
  learningObjectives: [
    'Create a ConfigMap and consume it from a Pod',
    'Distinguish ConfigMaps from Secrets and from image-baked configuration',
  ],
  sections: [
    {
      heading: 'Configuration, decoupled from the image',
      blocks: [
        {
          type: 'paragraph',
          text: 'A ConfigMap is a Kubernetes object that holds non-confidential configuration data as key/value pairs or whole files. Pods consume it as environment variables or mounted files. This decouples configuration from the container image — the same image can be deployed to dev, staging, and prod with three different ConfigMaps.',
        },
        {
          type: 'code',
          language: 'yaml',
          caption: 'A ConfigMap and a Pod consuming it',
          code: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: debug
  app.properties: |
    cache.ttl=60s
    feature.new-ui=true
---
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
    - name: app
      image: app:1.0
      envFrom:
        - configMapRef:
            name: app-config
      volumeMounts:
        - name: config-files
          mountPath: /etc/app
  volumes:
    - name: config-files
      configMap:
        name: app-config`,
        },
      ],
    },
    {
      heading: 'What changes when the ConfigMap changes',
      blocks: [
        {
          type: 'list',
          items: [
            'Env-var consumption: fixed at Pod startup. Updating the ConfigMap does NOT retroactively update env vars; the Pod has to be restarted.',
            'Volume-mount consumption: files on disk are updated (within a minute or so), but the application still needs to re-read them to notice.',
            'Neither mode is "hot" — a change to a ConfigMap does not automatically ripple through to a running Pod\'s behavior without application-level work or a Pod restart.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The common pattern is "trigger a rolling restart when the ConfigMap changes" — e.g. add an annotation on the Deployment with a hash of the ConfigMap content, so any change to the content changes the Pod spec and triggers a rollout. Tools like Reloader automate this.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'configmaps-overview': configMapsOverview,
  },
  labs: {},
  simulations: {},
};
