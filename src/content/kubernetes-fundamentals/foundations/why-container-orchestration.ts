import type { ConceptContentModule, LessonBody } from '../../types';

const scalingByHand: LessonBody = {
  learningObjectives: [
    'Identify the failure modes a single Docker host cannot handle',
    'Trace what happens when "docker run" has to span multiple machines',
  ],
  sections: [
    {
      heading: 'One container is easy. A fleet of them is not.',
      blocks: [
        {
          type: 'paragraph',
          text: 'A container runtime like Docker is excellent at starting and stopping a container on one machine. As soon as you need more than one machine — because you want redundancy, or because the workload no longer fits on one host — the operational problems multiply and none of them are inside Docker\'s remit.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Placement: which host has enough spare CPU and memory right now?',
            'Discovery: where is service X running this minute, and how do callers find it when its IP keeps changing?',
            'Recovery: a host just went down — who starts those containers again, and where?',
            'Rollout: how do you upgrade 40 instances of a service without downtime or a flap?',
            'Scaling: how do you add 10 instances when traffic doubles, and remove them when it drops?',
          ],
        },
      ],
    },
    {
      heading: 'The DIY path and why it ends at an orchestrator',
      blocks: [
        {
          type: 'paragraph',
          text: 'You can attempt the above with scripts: an Ansible playbook decides placement, a config management tool updates a load balancer, a cron job restarts failed containers. Teams do this, sometimes successfully. What breaks it is the interactions — the moment two scripts try to react to the same failure, or one of them is out of date because another ran without it, you have a distributed-systems problem dressed up as a sysadmin problem.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'An orchestrator is not just automation. It is a single, authoritative, continuously-running control loop that owns every placement and recovery decision — so no two scripts fight each other and there is no ambiguity about whose job it is to fix something.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'orchestration-kc-1',
      type: 'single-choice',
      prompt: 'Why does running containers across many hosts eventually require more than just a container runtime and shell scripts?',
      difficulty: 'beginner',
      learningObjective: 'Identify the failure modes a single Docker host cannot handle',
      options: [
        { id: 'a', label: 'Placement, service discovery, and failure recovery each require a single authoritative controller — multiple scripts reacting independently fight each other', correct: true, explanation: 'Correct. The core argument for orchestration is unifying these decisions under one control loop.' },
        { id: 'b', label: 'Container runtimes become slower once you run more than one on a host', correct: false, explanation: 'They do not — this is not the reason orchestrators exist.' },
        { id: 'c', label: 'Docker cannot run more than one container per machine', correct: false, explanation: 'Docker can run many containers per host; the problem is coordinating across hosts.' },
      ],
    },
  ],
};

const orchestratorResponsibilities: LessonBody = {
  learningObjectives: ['Enumerate the responsibilities every orchestrator takes over from the operator'],
  sections: [
    {
      heading: 'What any orchestrator owns',
      blocks: [
        {
          type: 'paragraph',
          text: 'The specific responsibilities Kubernetes takes over are not unique to Kubernetes — Nomad, ECS, Mesos all own a similar set. Understanding the responsibilities first makes it easier to recognize Kubernetes\'s specific implementation choices later.',
        },
        {
          type: 'comparisonTable',
          headers: ['Responsibility', 'Without an orchestrator', 'With an orchestrator'],
          rows: [
            ['Placement', 'A human or script picks a host', 'The scheduler picks a host based on resource requests and constraints'],
            ['Health', 'An external monitor notices a failure and a script reacts', 'Continuous liveness/readiness probes; the control plane replaces unhealthy instances automatically'],
            ['Discovery', 'Clients hardcode IPs or depend on a side system (Consul, DNS entries updated by hand)', 'The orchestrator provides a stable name/IP that always resolves to healthy instances'],
            ['Scaling', 'Add hosts, run scripts, pray', 'Change a number (replicas = N); the orchestrator reconciles'],
            ['Rollout', 'SSH into each host and restart', 'The orchestrator rolls instances over in a controlled, policy-driven sequence'],
          ],
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'scaling-containers-by-hand': scalingByHand,
    'responsibilities-of-an-orchestrator': orchestratorResponsibilities,
  },
  labs: {},
  simulations: {},
};
