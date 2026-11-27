import type { ConceptContentModule, LessonBody } from '../../types';

const overview: LessonBody = {
  learningObjectives: [
    'Explain what Kubernetes is at an architectural level',
    'Identify the problems Kubernetes solves versus the problems it leaves to other systems',
  ],
  analogy:
    'Think of Kubernetes as a cluster-wide operating system: individual containers are its processes, individual VMs are its hardware, and your YAML is its system call.',
  sections: [
    {
      heading: 'A one-sentence definition',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes is an open-source container orchestrator that runs applications as containers across a pool of machines, reconciling what you asked for with what is actually running. The name is often abbreviated to K8s — eight letters elided between the K and the s.',
        },
        {
          type: 'paragraph',
          text: 'The two words that carry the weight are "orchestrator" and "reconciling." Kubernetes does not just start containers; it continuously watches the state of those containers and the machines hosting them, and takes action whenever reality drifts from the declared intent. That continuous loop is what makes a Kubernetes cluster feel like one coherent system rather than a collection of individual hosts.',
        },
      ],
    },
    {
      heading: 'What Kubernetes gives you',
      blocks: [
        {
          type: 'list',
          items: [
            'A declarative API for describing workloads, services, and configuration as objects',
            'A scheduler that places those workloads onto a pool of machines based on their requirements',
            'A control plane that persists cluster state and drives it toward what you declared, continuously',
            'A service abstraction that lets workloads find each other without caring about where they are running',
            'Built-in self-healing: failed containers are restarted, failed nodes get their workloads re-scheduled elsewhere',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The declarative model is the defining choice. You never tell Kubernetes "start a container on node 3" — you say "I want 3 replicas of this image" and the control plane decides where and how. That decoupling is what lets self-healing and automated placement work at all.',
        },
      ],
    },
    {
      heading: 'Where Kubernetes came from',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes was open-sourced by Google in 2014, based on the internal cluster manager (Borg) that Google had been running for roughly a decade at the time. It was donated to the Cloud Native Computing Foundation (CNCF) in 2016 and has been community-governed since. The 10+ years of internal operational experience at planetary scale is why the architecture is opinionated — most design choices are reactions to problems the Borg team had already hit.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'what-is-kubernetes-kc-1',
      type: 'single-choice',
      prompt: 'Which statement best captures what makes Kubernetes an "orchestrator" rather than just a container runtime?',
      difficulty: 'beginner',
      learningObjective: 'Explain what Kubernetes is at an architectural level',
      options: [
        { id: 'a', label: 'Kubernetes continuously reconciles actual cluster state with a declared desired state across many machines', correct: true, explanation: 'Correct. Container runtimes start and stop containers on one host; Kubernetes runs a cluster-wide control loop that keeps the whole fleet converged on what was declared.' },
        { id: 'b', label: 'Kubernetes writes its own container images', correct: false, explanation: 'It does not — building images is a separate concern, handled by tools like docker build or buildah.' },
        { id: 'c', label: 'Kubernetes provides faster container startup than a container runtime alone', correct: false, explanation: 'Container startup time is a property of the container runtime (containerd, CRI-O, …). Kubernetes adds orchestration on top, not raw speed.' },
      ],
    },
  ],
};

const whatItIsNot: LessonBody = {
  learningObjectives: ['Name the parts of a production stack Kubernetes does not provide'],
  sections: [
    {
      heading: 'What Kubernetes does not provide',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes is deliberately scoped. A lot of adjacent concerns are left out by design, so that the ecosystem can fill them with pluggable components rather than one opinionated bundle.',
        },
        {
          type: 'list',
          items: [
            'It does not build container images — you bring images that are already built and pushed to a registry.',
            'It does not provide a logging backend — it exposes container logs, but storing and searching them is on you (Loki, Elasticsearch, a cloud service).',
            'It does not include a monitoring system — it exposes metrics, but something like Prometheus or a cloud monitoring service does the collection.',
            'It does not define an application-level service mesh — Services provide L4 load balancing; mTLS, retries, and traffic shaping are left to Istio/Linkerd or similar.',
            'It does not manage database backups, secrets encryption keys, or TLS certificates by default — these need operators or external systems.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A common beginner mistake is reaching for Kubernetes to "solve deployment" and discovering half the operational burden is still outside the cluster — CI/CD, image registries, observability, secrets management. Kubernetes is the orchestration layer, not the whole platform.',
        },
      ],
    },
    {
      heading: 'And what it is not a substitute for',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes is not a PaaS (like Heroku). You still write the manifests, pick the images, and define the services. Platforms built on top of Kubernetes (Red Hat OpenShift, Google Cloud Run, Azure Container Apps, …) layer a PaaS-like experience over a Kubernetes substrate — the raw API is intentionally lower-level than that.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'what-is-kubernetes-overview': overview,
    'what-kubernetes-is-not': whatItIsNot,
  },
  labs: {},
  simulations: {},
};
