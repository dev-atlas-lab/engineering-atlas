import type { ConceptContentModule, LessonBody } from '../../types';

const whatAPodIs: LessonBody = {
  learningObjectives: [
    'Explain why Kubernetes schedules Pods rather than individual containers',
    'Describe what containers inside a Pod share',
  ],
  sections: [
    {
      heading: 'The smallest deployable thing',
      blocks: [
        {
          type: 'paragraph',
          text: 'A Pod is the smallest unit Kubernetes schedules and runs. A Pod wraps one or more containers that always run together on the same node, sharing a network namespace and (optionally) storage volumes. You do not deploy a bare container to Kubernetes; you deploy a Pod containing a container.',
        },
        {
          type: 'paragraph',
          text: 'The reason for the extra layer is co-location. Some containers are logically one unit but still want process-level isolation — a web server with a log-shipping sidecar, an application with an envoy proxy sidecar. The Pod models "these processes always run together, share a network, can talk to each other on localhost" without forcing them to be one container.',
        },
      ],
    },
    {
      heading: 'What containers in a Pod share',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Resource', 'Shared across a Pod?', 'Per-container?'],
          rows: [
            ['Network namespace (IP, ports)', 'Yes — all containers see the same localhost', 'No'],
            ['IPC namespace', 'Yes', 'No'],
            ['Storage volumes (if declared on the Pod)', 'Yes — same mount from each container', 'Per-container mount paths'],
            ['PID namespace', 'Optionally — off by default', 'On by default'],
            ['File system', 'No — each container has its own root filesystem', 'Yes'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Because all containers in a Pod share the Pod\'s IP, two containers in the same Pod cannot both listen on the same port. If your sidecar needs port 8080 and your main container also needs port 8080, one of them has to change.',
        },
      ],
    },
  ],
};

const lifecycle: LessonBody = {
  learningObjectives: ['Trace a Pod through its phases'],
  sections: [
    {
      heading: 'The pod.status.phase field',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Phase', 'Meaning'],
          rows: [
            ['Pending', 'The Pod exists in the API but at least one container has not started (image pull, waiting for scheduling, waiting for a volume)'],
            ['Running', 'The Pod has been bound to a node and at least one container is running or starting'],
            ['Succeeded', 'All containers terminated with exit code 0 and will not be restarted. Only reached when restartPolicy is OnFailure or Never'],
            ['Failed', 'At least one container terminated in failure and will not be restarted'],
            ['Unknown', 'The kubelet could not be reached, so phase is indeterminate'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Pods are immutable in important ways: once scheduled, pod.spec.nodeName does not change; the Pod is never "moved." If a Pod needs to run on a different node, it is deleted and a new Pod is created elsewhere. "Rescheduling" always means "replace with a new Pod," not "move the existing one."',
        },
      ],
    },
    {
      heading: 'Who creates and deletes Pods',
      blocks: [
        {
          type: 'paragraph',
          text: 'In production, you rarely create a Pod directly. You create a higher-level workload (Deployment, StatefulSet, Job, …) and the matching controller creates Pods for you. A directly-created Pod has no owner, so when it dies, nothing recreates it — this is the "standalone Pod" case, useful for one-off debugging and almost nothing else.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'pod-kc-1',
      type: 'single-choice',
      prompt: 'Two containers in the same Pod both try to bind to TCP port 8080. What happens?',
      difficulty: 'intermediate',
      learningObjective: 'Describe what containers inside a Pod share',
      options: [
        { id: 'a', label: 'One of them fails to bind — they share a network namespace and therefore the same localhost', correct: true, explanation: 'Correct. Shared network namespace is the Pod\'s defining feature and the source of this restriction.' },
        { id: 'b', label: 'Both succeed because each container has its own network namespace', correct: false, explanation: 'This would be true for separate Pods, not containers in the same Pod.' },
        { id: 'c', label: 'Kubernetes randomly routes traffic to one of them', correct: false, explanation: 'There is no such layer; the kernel refuses the second bind.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-a-pod-is': whatAPodIs,
    'pod-lifecycle': lifecycle,
  },
  labs: {},
  simulations: {},
};
