import type { ConceptContentModule, LessonBody } from '../../types';

const flatNetworkModel: LessonBody = {
  learningObjectives: [
    'State the Kubernetes network model and what it requires',
    'Explain why this model simplifies application networking',
  ],
  sections: [
    {
      heading: 'One flat network, no NAT between Pods',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes assumes a particular network model: every Pod gets its own unique IP, every Pod can reach every other Pod directly by that IP, and nothing between them does NAT. That is the entire specification — anything that satisfies those three points is a valid Kubernetes network.',
        },
        {
          type: 'list',
          items: [
            'Pods can talk to each other without knowing whether they are on the same node or different nodes.',
            'A Pod\'s own view of its IP is the IP other Pods use to reach it — no "advertised" vs "actual" address confusion.',
            'Nodes can also reach Pods on any node by the Pod IP.',
            'This has nothing to do with how traffic reaches the cluster from outside — that is the Service concept.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The model is called "flat" because there is no networking topology to reason about at the application layer. "Call Pod X" is the same operation whether X is on the same node or across a datacenter — application code does not care.',
        },
      ],
    },
  ],
};

const cniPlugins: LessonBody = {
  learningObjectives: ['Explain why Kubernetes delegates network implementation to a CNI plugin'],
  sections: [
    {
      heading: 'CNI — pluggable networking',
      blocks: [
        {
          type: 'paragraph',
          text: 'Kubernetes does not implement Pod networking itself. It specifies the model above, and delegates the "how" to a CNI (Container Network Interface) plugin: Calico, Cilium, Flannel, AWS VPC CNI, Azure CNI, and many others. Each plugin takes a different approach — overlay networks (VXLAN tunnels between nodes), underlay routing (Pod IPs are first-class in the VPC), or eBPF-based routing — but every one satisfies the same four rules above.',
        },
        {
          type: 'paragraph',
          text: 'The kubelet calls the CNI plugin when a Pod starts: "allocate an IP, attach a network interface to this Pod\'s network namespace." The plugin handles the rest. The kubelet never thinks about tunnels or route tables; that is all plugin responsibility.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Managed Kubernetes services pick a sensible default plugin: EKS uses AWS VPC CNI (Pod IPs come from the VPC), GKE uses its own, AKS defaults to Azure CNI. You can swap the plugin out, but it is a disruptive operation — pick carefully at cluster creation.',
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-flat-network-model': flatNetworkModel,
    'cni-plugins': cniPlugins,
  },
  labs: {},
  simulations: {},
};
