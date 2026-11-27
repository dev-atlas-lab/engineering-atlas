import type { ConceptContentModule, LessonBody } from '../../types';

const differentLayers: LessonBody = {
  learningObjectives: ['Describe Docker and Kubernetes as complementary layers'],
  sections: [
    {
      heading: 'They are not alternatives',
      blocks: [
        {
          type: 'paragraph',
          text: '"Kubernetes vs Docker" is a persistent beginner question, and the answer is that they are not competitors — they solve different problems. Docker is a tool for building and running containers on one machine. Kubernetes is a tool for orchestrating containers across many machines. You use Docker (or a Docker-compatible tool) to build the image; you use Kubernetes to run many instances of that image across a fleet.',
        },
        {
          type: 'comparisonTable',
          headers: ['Layer', 'Docker (the toolkit)', 'Kubernetes'],
          rows: [
            ['Build an image', 'Yes — docker build', 'No — brings existing images'],
            ['Run a container on one host', 'Yes — docker run', 'Indirectly, via its container runtime'],
            ['Schedule containers across many hosts', 'No', 'Yes — that is the whole point'],
            ['Service discovery, self-healing, rollouts', 'No', 'Yes'],
            ['Image format and distribution', 'Compatible with OCI standards', 'Pulls OCI images from a registry'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The "vs" framing comes from history. Early Kubernetes used the Docker daemon on every node as its container runtime, so operators saw both products on the same host and treated them as competing. That changed; see the next lesson.',
        },
      ],
    },
  ],
};

const runtimeAfterDockershim: LessonBody = {
  learningObjectives: ['Explain why most Kubernetes nodes no longer run the Docker daemon'],
  sections: [
    {
      heading: 'Dockershim is gone',
      blocks: [
        {
          type: 'paragraph',
          text: 'In Kubernetes 1.24 (released April 2022), the kubelet\'s built-in adapter for the Docker daemon — "dockershim" — was removed. Kubernetes nodes no longer run the Docker daemon as their container runtime by default. Most clusters today use containerd or CRI-O, container runtimes that speak the Container Runtime Interface (CRI) directly.',
        },
        {
          type: 'paragraph',
          text: 'This is not a backward step. Container images are an OCI standard — an image built with "docker build" is identical to one built with buildah or kaniko, and runs identically under containerd, CRI-O, or any OCI-compliant runtime. Removing dockershim removed a layer of adapter code, not a capability.',
        },
      ],
    },
    {
      heading: 'What changes in practice for users',
      blocks: [
        {
          type: 'list',
          items: [
            'Images you build with Docker still run on Kubernetes without modification.',
            'docker commands on a worker node don\'t show Kubernetes\'s containers any more — crictl is the equivalent CRI-level tool.',
            'Logging and metrics plugins that depended on the Docker daemon directly on the node had to be updated.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'If your workflow is "docker build, docker push, kubectl apply", nothing changed. The removal was invisible at the application layer — it only affected tooling that talked to the Docker daemon on the node itself.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'k8s-vs-docker-kc-1',
      type: 'single-choice',
      prompt: 'Does removing the Docker daemon from Kubernetes nodes mean Docker images no longer work with Kubernetes?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why most Kubernetes nodes no longer run the Docker daemon',
      options: [
        { id: 'a', label: 'No — container images are an OCI standard, and OCI-compliant runtimes like containerd run them just fine', correct: true, explanation: 'Correct. The image format is the stable interface; only the runtime below it changed.' },
        { id: 'b', label: 'Yes — Docker-built images no longer run on Kubernetes', correct: false, explanation: 'This is a common misconception. Image compatibility is unchanged.' },
        { id: 'c', label: 'Only images built with "podman" still work', correct: false, explanation: 'Any OCI-compliant image works, including those built with Docker.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'different-layers': differentLayers,
    'runtime-after-dockershim': runtimeAfterDockershim,
  },
  labs: {},
  simulations: {},
};
