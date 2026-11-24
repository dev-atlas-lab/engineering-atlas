import type { ConceptMeta, Lesson, LabDefinition } from '../../types';

const introductionToContainers: Lesson = {
  id: 'introduction-to-containers',
  title: 'Introduction to Containers',
  kind: 'concept',
  learningObjectives: [
    'Explain how containers achieve isolation without a full guest OS',
    'Contrast container architecture with VM architecture',
  ],
  analogy:
    'If a VM is an apartment building with fully separate utilities per unit, a container is more like cubicles in one open-plan office: isolated workspaces, but everyone is still breathing the same building air — the host kernel.',
  sections: [
    {
      heading: 'How containers isolate without a hypervisor',
      blocks: [
        {
          type: 'paragraph',
          text: 'A container packages an application with its dependencies, but — unlike a VM — it does not boot its own kernel. Instead, it shares the host operating system’s kernel and relies on two Linux kernel features to create isolation: namespaces, which give a process its own view of resources (process IDs, network interfaces, mount points, hostname) separate from other processes on the host, and cgroups (control groups), which limit how much CPU, memory, and I/O a process or group of processes can consume.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Because there is no guest kernel to boot, a container typically starts in well under a second, versus the tens of seconds a VM needs to boot a full OS. That speed is a direct consequence of what containers do not virtualize, not an optimization bolted on afterward.',
        },
      ],
    },
    {
      heading: 'Container images',
      blocks: [
        {
          type: 'paragraph',
          text: 'A container image is a layered filesystem: a base layer (often a minimal OS userland), plus additional layers for dependencies and application code, stacked using a union filesystem. Layers are content-addressed and cacheable, so pulling an updated image only transfers the layers that actually changed. This layered image format is standardized by the Open Container Initiative (OCI) image specification, which is why images built with one tool can run on any OCI-compliant container runtime.',
        },
      ],
    },
    {
      heading: 'Containers vs. virtual machines',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'Virtual Machine', 'Container'],
          rows: [
            ['Isolation boundary', 'Hypervisor; separate guest kernel per VM', 'Kernel namespaces/cgroups; kernel shared with host'],
            ['Startup time', 'Tens of seconds (full OS boot)', 'Typically under a second'],
            ['Density per host', 'Lower — each VM carries its own OS overhead', 'Higher — no per-instance OS overhead'],
            ['Kernel flexibility', 'Guest can run a different kernel/OS than the host', 'Must share the host kernel (Linux containers need a Linux host kernel)'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Neither is strictly "better" — a VM’s stronger isolation and kernel independence make it the right choice for multi-tenant hosting or workloads needing a specific kernel; a container’s speed and density make it the right choice for horizontally-scaled application services. Many production architectures use both: containers for application workloads, running on top of VMs that provide the underlying compute.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'intro-containers-kc-1',
      type: 'single-choice',
      prompt: 'What is the primary architectural reason containers start faster than VMs?',
      difficulty: 'beginner',
      learningObjective: 'Contrast container architecture with VM architecture',
      options: [
        {
          id: 'a',
          label: 'Containers do not boot a separate guest kernel — they share the host’s already-running kernel',
          correct: true,
          explanation: 'Correct. Booting a kernel is the slow part of starting a VM; containers skip it entirely by using namespaces/cgroups on the host kernel.',
        },
        {
          id: 'b',
          label: 'Containers use faster physical hardware than VMs',
          correct: false,
          explanation: 'Containers and VMs can run on identical hardware — the speed difference is architectural, not hardware-based.',
        },
        {
          id: 'c',
          label: 'Containers skip loading application code at startup',
          correct: false,
          explanation: 'Application code still loads when a container starts — what it skips is booting an entire guest operating system.',
        },
      ],
    },
  ],
  furtherReading: [{ label: 'Open Container Initiative image spec', url: 'https://github.com/opencontainers/image-spec' }],
};

const containerArchitecture: Lesson = {
  id: 'container-architecture',
  title: 'Container Architecture and Orchestration',
  kind: 'concept',
  learningObjectives: ['Explain why running containers at scale requires an orchestrator, not just a container runtime'],
  sections: [
    {
      heading: 'From one container to many',
      blocks: [
        {
          type: 'paragraph',
          text: 'Running a single container on a single host is straightforward. Running dozens of container instances across multiple hosts — restarting failed ones, routing traffic to healthy ones, scaling the count up or down with demand — is a distributed systems problem, and that is the job of a container orchestrator. An orchestrator decides which host runs which container, monitors health, and reacts to failure, so application teams describe desired state ("run 4 copies of this image") rather than managing individual container lifecycles by hand.',
        },
        {
          type: 'list',
          items: [
            'Scheduling: placing container instances onto hosts with available capacity',
            'Service discovery and load balancing: routing requests to healthy instances as they come and go',
            'Health checking and self-healing: restarting or replacing instances that fail a health check',
            'Scaling: adding or removing instances in response to load',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Kubernetes is the best-known container orchestrator, but it is its own domain of knowledge and is intentionally out of scope for Cloud Fundamentals. What matters here is the role an orchestrator plays — the two managed services covered in this concept (Azure Container Apps and AWS ECS) are each a managed, opinionated orchestration layer that absorbs these responsibilities for you.',
        },
      ],
    },
    {
      heading: 'Where the compute underneath a container actually runs',
      blocks: [
        {
          type: 'paragraph',
          text: 'A container still has to execute on something — typically a VM, whether that VM is one your organization manages directly or one the cloud provider manages on your behalf. This is the distinction between "server-managed" and "serverless" container platforms: with a server-managed model, you choose and scale the underlying VM fleet yourself; with a serverless container model, the provider handles host capacity entirely and you are billed for container-level resource usage instead. Both provider lessons that follow return to this distinction.',
        },
      ],
    },
  ],
};

const azureContainerServices: Lesson = {
  id: 'azure-container-apps',
  title: 'Azure Container Apps',
  kind: 'provider',
  providerId: 'azure',
  learningObjectives: ['Describe how Azure Container Apps manages scaling and ingress for containerized services'],
  sections: [
    {
      heading: 'What Azure Container Apps provides',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Container Apps is a serverless container platform built for running microservices and event-driven applications without directly managing the underlying orchestrator or VM fleet. It is built on open-source technology under the hood — KEDA for event-driven autoscaling, Dapr for optional service-to-service communication building blocks, and Envoy for ingress — but exposes a simpler, application-focused model on top.',
        },
        {
          type: 'list',
          items: [
            'Scale-to-zero: an app with no traffic can scale down to zero running instances and back up on the next request, so idle services are not billed for compute',
            'Revisions: each deployment creates a new revision, and traffic can be split between revisions for gradual rollout',
            'Built-in HTTPS ingress, with optional traffic splitting and internal-only access',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Azure Container Instances (ACI) is a separate, narrower service worth distinguishing: ACI runs a single container or a small container group with no built-in scaling, traffic splitting, or ingress management — it is closer to "a VM-less way to run one container" than a full application platform. Azure Container Apps is the more direct comparison point to AWS ECS/Fargate, covered next.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Container Apps',
    keyFeatures: [
      'Scale-to-zero and event-driven autoscaling via KEDA',
      'Revision-based deployments with traffic splitting',
      'Built-in HTTPS ingress',
      'Optional Dapr integration for service-to-service communication patterns',
    ],
    terminology: {
      'Container orchestrator': 'Azure Container Apps environment',
      'Deployment version': 'Revision',
    },
    architecturalNotes: [
      'Runs on a managed Kubernetes substrate that is not directly exposed to the application team — the Kubernetes API itself is not something Container Apps users interact with',
    ],
    limitations: ['Less low-level control than directly managing a Kubernetes cluster — by design, in exchange for a simpler operating model'],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/container-apps/overview',
  },
};

const awsEcsFargate: Lesson = {
  id: 'aws-ecs-fargate',
  title: 'AWS ECS and Fargate',
  kind: 'provider',
  providerId: 'aws',
  learningObjectives: ['Distinguish the EC2 launch type from the Fargate launch type within Amazon ECS'],
  sections: [
    {
      heading: 'ECS as the orchestrator, Fargate as a launch type',
      blocks: [
        {
          type: 'paragraph',
          text: 'Amazon ECS (Elastic Container Service) is AWS’s own container orchestrator. It schedules container "tasks" (one or more related containers) onto compute capacity, handles service-level scaling, and integrates with other AWS services for load balancing and service discovery. Critically, ECS supports two distinct launch types for where that compute capacity comes from, and the choice is explicit, not automatic.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'EC2 launch type', 'Fargate launch type'],
          rows: [
            ['Who manages the underlying hosts', 'You do — you provision and scale the EC2 instances ECS schedules tasks onto', 'AWS does — no EC2 instances to manage at all'],
            ['Billing unit', 'The underlying EC2 instances, regardless of how fully packed with tasks they are', 'The vCPU/memory each task actually requests'],
            ['When it fits', 'Workloads needing specific instance types, GPUs, or maximum cost control at high, steady utilization', 'Variable or unpredictable load, or teams that want zero host management'],
          ],
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'Amazon ECS (with the Fargate launch type)',
    keyFeatures: [
      'Task definitions describing one or more containers to run together',
      'Service-level scaling with Application Load Balancer integration',
      'Two launch types: EC2 (self-managed hosts) and Fargate (serverless compute)',
    ],
    terminology: {
      'Container orchestrator': 'Amazon ECS',
      'Group of related containers': 'Task',
      'Serverless compute layer': 'Fargate',
    },
    architecturalNotes: [
      'ECS is a distinct service from Amazon EKS (Elastic Kubernetes Service) — ECS uses AWS’s own task/service model rather than the Kubernetes API, and EKS is out of scope here as a Kubernetes-domain topic',
    ],
    limitations: ['Fargate has less control over the exact underlying instance type than the EC2 launch type'],
    documentationUrl: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html',
  },
};

const containersComparison: Lesson = {
  id: 'containers-architecture-comparison',
  title: 'Architecture Comparison: Azure Container Apps vs. AWS ECS/Fargate',
  kind: 'comparison',
  learningObjectives: ['Compare Azure Container Apps and AWS ECS/Fargate honestly, including where the mapping is asymmetric'],
  sections: [
    {
      heading: 'The comparison is asymmetric, not 1:1',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Container Apps bundles orchestration, scaling, and a serverless compute layer into one product with one operating model. AWS splits the same overall capability into two composable pieces: ECS (the orchestrator) and a choice of launch type (EC2 or Fargate, for where compute comes from). The closest like-for-like comparison is Azure Container Apps vs. "ECS with the Fargate launch type" — comparing Container Apps to ECS alone, without specifying a launch type, is not a complete comparison.',
        },
        {
          type: 'comparisonTable',
          headers: ['Dimension', 'Azure Container Apps', 'ECS + Fargate'],
          rows: [
            ['Host management', 'Fully abstracted — no launch-type decision to make', 'Fargate abstracts hosts too, but EC2 launch type remains available as a separate choice'],
            ['Scale-to-zero', 'Built in, via KEDA', 'Not built in the same way — minimum running task counts are typically kept above zero'],
            ['Traffic splitting', 'Built-in revision-based traffic splitting', 'Achieved via external load balancer configuration, not a native ECS concept'],
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'containers-compare-kc-1',
      type: 'single-choice',
      prompt: 'Why is comparing "Azure Container Apps" directly to "AWS ECS" (without specifying a launch type) an incomplete comparison?',
      difficulty: 'advanced',
      learningObjective: 'Compare Azure Container Apps and AWS ECS/Fargate honestly, including where the mapping is asymmetric',
      options: [
        {
          id: 'a',
          label: 'ECS is only the orchestration layer — whether compute is self-managed (EC2 launch type) or serverless (Fargate) is a separate decision Azure Container Apps does not require you to make',
          correct: true,
          explanation: 'Correct — Container Apps bundles what ECS splits into two layers, so the fair comparison point is specifically ECS+Fargate.',
        },
        {
          id: 'b',
          label: 'ECS does not support containers at all',
          correct: false,
          explanation: 'ECS is fundamentally a container orchestrator — this is not the source of the asymmetry.',
        },
        {
          id: 'c',
          label: 'Azure Container Apps and ECS are identical, so any comparison is automatically complete',
          correct: false,
          explanation: 'They are not identical — that is exactly the asymmetry this lesson covers.',
        },
      ],
    },
  ],
};

const localContainerLab: LabDefinition = {
  id: 'run-and-inspect-a-container-locally',
  title: 'Run and Inspect a Container Locally',
  type: 'hands-on',
  difficulty: 'beginner',
  estimatedTime: '15 minutes',
  description: 'Run a container on your own machine and inspect how it isolates processes and resources, using Docker.',
  learningObjectives: ['Observe container isolation and resource limits directly, rather than only conceptually'],
  prerequisites: [
    { type: 'tool', label: 'Docker Desktop (or Docker Engine on Linux)', description: 'Required to run containers locally.', installUrl: 'https://docs.docker.com/get-docker/' },
  ],
  content: {
    environment: [
      { tool: 'Docker', installUrl: 'https://docs.docker.com/get-docker/', verifyCommand: 'docker --version' },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Run a container',
        instructions: 'Start an Nginx container in the background, publishing port 8080 on your machine to port 80 inside the container.',
        commands: [
          { command: 'docker run -d --name atlas-nginx -p 8080:80 nginx:alpine', platform: 'any', description: 'Starts the container detached.', expectedOutput: 'A long container ID is printed.' },
        ],
        expectedOutput: 'Visiting http://localhost:8080 in a browser shows the default Nginx welcome page.',
        hints: ['If port 8080 is already in use on your machine, publish a different host port, e.g. -p 8081:80.'],
        validationChecklist: ['The container appears in `docker ps` with status "Up"', 'http://localhost:8080 loads the Nginx welcome page'],
      },
      {
        id: 'task-2',
        title: 'Inspect its isolation',
        instructions: 'Compare the process list inside the container to the process list on your host machine.',
        commands: [
          { command: 'docker exec atlas-nginx ps aux', platform: 'any', description: 'Lists processes as seen from inside the container.', expectedOutput: 'Only nginx-related processes are listed — not your host’s full process list.' },
        ],
        hints: ['The short process list inside the container is the namespace isolation from the Introduction to Containers lesson, made observable.'],
        validationChecklist: ['The process list from inside the container is much shorter than your host’s own process list'],
      },
      {
        id: 'task-3',
        title: 'Stop and remove the container',
        instructions: 'Clean up the container once you are done inspecting it.',
        commands: [
          { command: 'docker stop atlas-nginx && docker rm atlas-nginx', platform: 'any', description: 'Stops and removes the container.' },
        ],
        hints: [],
        validationChecklist: ['`docker ps -a` no longer lists atlas-nginx'],
      },
    ],
    cleanupInstructions: 'Task 3 removes the container. Optionally run `docker image rm nginx:alpine` to remove the downloaded image as well.',
  },
};

export const containers: ConceptMeta = {
  id: 'containers',
  title: 'Containers',
  description: 'Lightweight, portable execution environments that package applications with their dependencies.',
  status: 'available',
  learningObjectives: [
    'Explain how containers isolate workloads without a hypervisor or guest kernel',
    'Explain why running containers at scale requires an orchestrator',
    'Compare Azure Container Apps and AWS ECS/Fargate without assuming a 1:1 mapping',
  ],
  prerequisites: ['virtual-machines'],
  relatedConcepts: ['virtual-machines', 'serverless-functions'],
  estimatedMinutes: 55,
  lessons: [introductionToContainers, containerArchitecture, azureContainerServices, awsEcsFargate, containersComparison],
  labs: [localContainerLab],
};
