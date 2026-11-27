import type { ConceptContentModule, LessonBody } from '../../types';

const loadBalancerMechanics: LessonBody = {
  learningObjectives: [
    'Describe how a LoadBalancer Service layers on top of NodePort',
    'Explain who provisions the external load balancer and how',
  ],
  sections: [
    {
      heading: 'LoadBalancer — NodePort + an external load balancer',
      blocks: [
        {
          type: 'paragraph',
          text: 'A LoadBalancer Service is a NodePort Service with an external load balancer in front, provisioned by the cloud provider. Kubernetes allocates the NodePort; the cloud controller manager asks the cloud provider to create a load balancer (AWS NLB/ALB, Azure Load Balancer, Google Cloud Load Balancer) that forwards to that NodePort on every node. The result is an external IP that is stable and reachable from anywhere.',
        },
        {
          type: 'list',
          items: [
            'kubectl apply creates a Service with type: LoadBalancer.',
            'The Service initially has no external IP (status says <pending>).',
            'The cloud controller manager sees it, calls the cloud API to provision a load balancer pointing at the NodePort on each node.',
            'The cloud returns the load balancer\'s public IP; Kubernetes writes it to service.status.loadBalancer.ingress.',
            'kubectl get svc now shows the external IP. Anything that resolves to it reaches the Service.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Without a cloud controller manager (self-hosted clusters on bare metal), LoadBalancer Services sit with <pending> forever. MetalLB is the usual answer — it hands out IPs from a pool and advertises them via ARP or BGP, letting bare-metal clusters have real LoadBalancer Services.',
        },
      ],
    },
    {
      heading: 'LoadBalancer vs Ingress',
      blocks: [
        {
          type: 'paragraph',
          text: 'A LoadBalancer Service gives one external IP per Service. For dozens of Services each needing to be external, that is dozens of load balancers (and dozens of monthly charges). An Ingress is one load balancer plus an HTTP router (nginx, Traefik, HAProxy) that fans out to many internal Services based on host/path rules — the more economical pattern for HTTP traffic at scale.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'lb-kc-1',
      type: 'single-choice',
      prompt: 'Why does a LoadBalancer Service created on an on-prem cluster without MetalLB stay stuck in <pending>?',
      difficulty: 'intermediate',
      learningObjective: 'Describe how a LoadBalancer Service layers on top of NodePort',
      options: [
        { id: 'a', label: 'LoadBalancer Services need a cloud controller or equivalent to actually provision the external load balancer', correct: true, explanation: 'Correct. Kubernetes writes the intent, but something has to carry it out — on cloud it is the cloud controller manager, on bare metal it is MetalLB or similar.' },
        { id: 'b', label: 'The cluster is misconfigured and the Service will never work', correct: false, explanation: 'Fixable — installing an LB implementation resolves it.' },
        { id: 'c', label: 'LoadBalancer Services are supported only on AWS', correct: false, explanation: 'All cloud providers have one; bare metal needs an implementation installed.' },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'loadbalancer-mechanics': loadBalancerMechanics,
  },
  labs: {},
  simulations: {},
};
