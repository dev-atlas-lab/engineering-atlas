// Eager metadata for this category's concepts: ids, titles, status, and
// lesson/lab ids, titles, and order. Never import concept content modules
// from here — they load per concept through ../concept-loaders.ts.

import type { ConceptMeta } from '../../types';

export const virtualMachines: ConceptMeta = {
  id: 'virtual-machines',
  title: 'Virtual Machines',
  description: 'Virtualized servers that provide full OS-level control over compute resources.',
  status: 'available',
  learningObjectives: [
    'Explain what a virtual machine is and why hypervisor-based virtualization exists',
    'Describe how host resources are allocated and isolated across VMs',
    'Compare Azure Virtual Machines and AWS EC2 at an architectural level',
  ],
  prerequisites: [],
  relatedConcepts: ['containers', 'serverless-functions', 'high-availability', 'regions-and-availability-zones'],
  estimatedMinutes: 90,
  lessons: [
    { id: 'introduction-to-virtual-machines', title: 'Introduction to Virtual Machines', kind: 'concept' },
    { id: 'virtualization-fundamentals', title: 'Virtualization Fundamentals and Hypervisors', kind: 'concept' },
    { id: 'vm-architecture', title: 'VM Architecture', kind: 'concept' },
    { id: 'compute-memory-and-storage-allocation', title: 'Compute, Memory, and Storage Allocation', kind: 'concept' },
    { id: 'vm-networking-and-security', title: 'VM Networking and Security', kind: 'concept' },
    { id: 'azure-virtual-machines', title: 'Azure Virtual Machines', kind: 'provider', providerId: 'azure' },
    { id: 'aws-ec2', title: 'AWS EC2', kind: 'provider', providerId: 'aws' },
    { id: 'architecture-comparison', title: 'Architecture Comparison: Azure VMs vs. AWS EC2', kind: 'comparison' },
  ],
  labs: [
    { id: 'vm-resource-allocation-lab', title: 'Design a VM Architecture', type: 'simulation' },
  ],
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
  lessons: [
    { id: 'introduction-to-containers', title: 'Introduction to Containers', kind: 'concept' },
    { id: 'container-architecture', title: 'Container Architecture and Orchestration', kind: 'concept' },
    { id: 'azure-container-apps', title: 'Azure Container Apps', kind: 'provider', providerId: 'azure' },
    { id: 'aws-ecs-fargate', title: 'AWS ECS and Fargate', kind: 'provider', providerId: 'aws' },
    { id: 'containers-architecture-comparison', title: 'Architecture Comparison: Azure Container Apps vs. AWS ECS/Fargate', kind: 'comparison' },
  ],
  labs: [
    { id: 'run-and-inspect-a-container-locally', title: 'Run and Inspect a Container Locally', type: 'hands-on' },
  ],
};

export const serverlessFunctions: ConceptMeta = {
  id: 'serverless-functions',
  title: 'Serverless Functions',
  description: 'Event-driven compute that runs code without managing servers, scaling automatically per invocation.',
  status: 'available',
  learningObjectives: [
    'Explain what "serverless" means architecturally and when it fits a workload',
    'Trace a request through a serverless platform, including cold starts',
    'Compare Azure Functions and AWS Lambda, including their differing approaches to workflow orchestration',
  ],
  prerequisites: ['virtual-machines'],
  relatedConcepts: ['containers', 'virtual-machines'],
  estimatedMinutes: 50,
  // No lab in this slice — deferred and documented, not silently dropped
  // (docs/M1B_DESIGN_DECISIONS.md pattern: deferral is explicit, not an
  // empty placeholder pretending to be complete).
  lessons: [
    { id: 'introduction-to-serverless', title: 'Introduction to Serverless Computing', kind: 'concept' },
    { id: 'event-driven-compute', title: 'Event-Driven Compute and Cold Starts', kind: 'concept' },
    { id: 'azure-functions', title: 'Azure Functions', kind: 'provider', providerId: 'azure' },
    { id: 'aws-lambda', title: 'AWS Lambda', kind: 'provider', providerId: 'aws' },
    { id: 'serverless-architecture-comparison', title: 'Architecture Comparison: Azure Functions vs. AWS Lambda', kind: 'comparison' },
  ],
};
