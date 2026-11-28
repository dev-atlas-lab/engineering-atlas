import type { ConceptMeta } from '../../types';

export const networkModel: ConceptMeta = {
  id: 'kubernetes-network-model',
  title: 'Kubernetes Network Model',
  description: 'The three invariants every conforming Kubernetes cluster must satisfy, and why they matter.',
  status: 'available',
  learningObjectives: [
    'State the three required properties of the Kubernetes network model',
    'Explain why no-NAT Pod-to-Pod addressing was chosen over port-forwarding',
  ],
  prerequisites: ['pod-networking'],
  relatedConcepts: ['pod-networking', 'service', 'container-network-interface'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'the-three-rules', title: 'The Three Rules', kind: 'concept' },
    { id: 'why-no-nat', title: 'Why "No NAT" Matters', kind: 'concept' },
  ],
};

export const containerNetworkInterface: ConceptMeta = {
  id: 'container-network-interface',
  title: 'Container Network Interface (CNI)',
  description: 'The spec that lets the kubelet delegate Pod networking to a plugin — ADD, DEL, CHECK, and IPAM.',
  status: 'available',
  learningObjectives: [
    'Describe the CNI invocation lifecycle on Pod sandbox create/delete',
    'Enumerate the four CNI operations the kubelet calls',
    'Explain IPAM\'s responsibility within a CNI plugin',
  ],
  prerequisites: ['kubernetes-network-model', 'pod'],
  relatedConcepts: ['cni-plugin-architecture', 'kubelet'],
  estimatedMinutes: 25,
  lessons: [
    { id: 'what-cni-is', title: 'What CNI Is and Why It Exists', kind: 'concept' },
    { id: 'add-del-check', title: 'ADD, DEL, CHECK — the Plugin Contract', kind: 'concept' },
    { id: 'ipam-responsibility', title: 'IPAM Inside a CNI Plugin', kind: 'concept' },
  ],
  labs: [
    { id: 'cni-networking-explorer', title: 'CNI Networking Explorer', type: 'simulation' },
  ],
};

export const cniPluginArchitecture: ConceptMeta = {
  id: 'cni-plugin-architecture',
  title: 'CNI Plugin Architecture',
  description: 'How real CNI plugins are structured — agent, dataplane, API server integration — and the differences between Calico, Cilium, and Flannel.',
  status: 'available',
  learningObjectives: [
    'Describe the agent/dataplane split in production CNIs',
    'Compare Calico, Cilium, and Flannel architecturally',
  ],
  prerequisites: ['container-network-interface'],
  relatedConcepts: ['container-network-interface', 'network-routing-and-encapsulation'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'agent-and-dataplane', title: 'Agent, Dataplane, and the API Server', kind: 'concept' },
    { id: 'three-families', title: 'Three Reference Architectures', kind: 'concept' },
  ],
};

export const podToPodCommunication: ConceptMeta = {
  id: 'pod-to-pod-communication',
  title: 'Pod-to-Pod Communication',
  description: 'How a packet travels between two Pods on the same node — veth pairs, host bridge, and the local forwarding decision.',
  status: 'available',
  learningObjectives: [
    'Trace a same-node Pod-to-Pod packet hop by hop',
    'Describe the role of veth pairs and the CNI bridge',
  ],
  prerequisites: ['container-network-interface'],
  relatedConcepts: ['cross-node-pod-networking', 'pod-networking'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'the-same-node-path', title: 'The Same-Node Path', kind: 'concept' },
  ],
};

export const crossNodePodNetworking: ConceptMeta = {
  id: 'cross-node-pod-networking',
  title: 'Cross-Node Pod Networking',
  description: 'How a packet reaches a Pod on another node — overlay encapsulation, route distribution, or underlay routing.',
  status: 'available',
  learningObjectives: [
    'Trace a cross-node packet under VXLAN overlay vs BGP routing',
    'Identify where cross-node communication typically breaks',
  ],
  prerequisites: ['pod-to-pod-communication'],
  relatedConcepts: ['network-routing-and-encapsulation', 'cni-plugin-architecture'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'cross-node-path', title: 'The Cross-Node Path', kind: 'concept' },
    { id: 'where-it-breaks', title: 'Common Failure Modes', kind: 'concept' },
  ],
};

export const networkRoutingAndEncapsulation: ConceptMeta = {
  id: 'network-routing-and-encapsulation',
  title: 'Network Routing and Encapsulation',
  description: 'The three dataplane styles — flat L2 bridge, overlay (VXLAN/Geneve), and native routing (BGP) — and their tradeoffs.',
  status: 'available',
  learningObjectives: [
    'Compare overlay and native-routing dataplanes',
    'Explain the MTU implications of overlay encapsulation',
  ],
  prerequisites: ['cross-node-pod-networking'],
  relatedConcepts: ['cross-node-pod-networking', 'cni-plugin-architecture'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'overlay-vs-routing', title: 'Overlay vs Native Routing', kind: 'concept' },
    { id: 'mtu-and-performance', title: 'MTU, Overhead, and Performance', kind: 'concept' },
  ],
};

export const kubeProxyRouting: ConceptMeta = {
  id: 'kube-proxy-and-service-routing',
  title: 'kube-proxy and Service Routing',
  description: 'How ClusterIP, NodePort, and LoadBalancer Services are implemented at the node level — kube-proxy programs iptables or IPVS rules.',
  status: 'available',
  learningObjectives: [
    'Describe what kube-proxy actually does (and does not)',
    'Trace a Service → Pod DNAT in iptables mode',
  ],
  prerequisites: ['kube-proxy', 'service'],
  relatedConcepts: ['iptables-vs-ipvs', 'service', 'clusterip'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'kube-proxy-does-not-proxy', title: 'kube-proxy Does Not Proxy', kind: 'concept' },
    { id: 'service-dnat-trace', title: 'Tracing a Service DNAT', kind: 'concept' },
  ],
};

export const iptablesVsIpvs: ConceptMeta = {
  id: 'iptables-vs-ipvs',
  title: 'iptables vs IPVS',
  description: 'The two kube-proxy backends and why IPVS scales better on clusters with many Services.',
  status: 'available',
  learningObjectives: [
    'Compare iptables and IPVS on rule structure and scaling',
    'Describe when switching to IPVS is worthwhile',
  ],
  prerequisites: ['kube-proxy-and-service-routing'],
  relatedConcepts: ['kube-proxy-and-service-routing', 'kube-proxy'],
  estimatedMinutes: 15,
  lessons: [
    { id: 'rule-structure', title: 'Why iptables Lists Scale Poorly', kind: 'concept' },
    { id: 'ipvs-tradeoffs', title: 'IPVS Tradeoffs', kind: 'concept' },
  ],
};

export const networkTroubleshooting: ConceptMeta = {
  id: 'network-troubleshooting-fundamentals',
  title: 'Network Troubleshooting Fundamentals',
  description: 'A deterministic ladder for diagnosing Pod → Pod and Pod → Service failures.',
  status: 'available',
  learningObjectives: [
    'Walk a diagnostic ladder from "can the Pod resolve DNS" to "does kube-proxy have an endpoint for this Service"',
    'Interpret common error states (ImagePullBackOff, EndpointSlice empty, routes missing)',
  ],
  prerequisites: ['kube-proxy-and-service-routing', 'network-routing-and-encapsulation'],
  relatedConcepts: ['service-discovery', 'coredns'],
  estimatedMinutes: 20,
  lessons: [
    { id: 'the-ladder', title: 'A Deterministic Diagnostic Ladder', kind: 'concept' },
  ],
};
