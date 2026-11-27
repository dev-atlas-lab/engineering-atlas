import type { ConceptContentModule, LessonBody } from '../../types';

const shapeOfObjects: LessonBody = {
  learningObjectives: [
    'Describe the common structure of every Kubernetes object',
    'Explain the distinction between the object record in etcd and the thing it describes',
  ],
  sections: [
    {
      heading: 'Four top-level fields, every time',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every Kubernetes object — Pod, Deployment, Service, ConfigMap, CustomResourceDefinition, anything — has the same four top-level fields: apiVersion, kind, metadata, spec. Most also have status. The uniformity is not cosmetic: tools, libraries, and the API Server itself rely on this shape to validate, route, and process objects generically.',
        },
        {
          type: 'comparisonTable',
          headers: ['Field', 'What it carries'],
          rows: [
            ['apiVersion', 'Group and version — e.g. apps/v1, v1, batch/v1 — for schema negotiation'],
            ['kind', 'The object type — Pod, Deployment, Service, …'],
            ['metadata', 'name, namespace, labels, annotations, ownerReferences, resourceVersion'],
            ['spec', 'Desired state — what you declare'],
            ['status', 'Actual state — what the system observes'],
          ],
        },
      ],
    },
    {
      heading: 'The record is not the thing',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Pod object in etcd is not the running processes. It is a record that says "there should be a Pod with this spec, and the latest I know is that the status is this." The kubelet reads the record to decide what to do; the actual containers live on a node, not in the API. Losing or editing the record does not immediately touch the running workload; the next reconciliation is what does that. This is subtle enough to catch experienced operators, especially when manually editing objects.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'shape-of-every-object': shapeOfObjects,
  },
  labs: {},
  simulations: {},
};
