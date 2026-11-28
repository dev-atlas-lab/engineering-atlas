import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { cniLifecycleScene } from '../security-scenes';
import { cniNetworkingSimulation } from '../security-simulations';
import { renderCniNetworkState } from '../security-simulation-views';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const whatCniIs: LessonBody = {
  learningObjectives: [
    'Describe CNI\'s role between the kubelet and the Pod network',
    'Explain why Kubernetes delegates networking to a plugin instead of implementing it',
  ],
  sections: [
    {
      heading: 'A thin contract, not an implementation',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Container Network Interface (CNI) is a specification maintained by the CNCF. It defines how a container runtime tells a "network plugin" to configure a container\'s network namespace. In Kubernetes, the kubelet is the runtime side; the CNI plugin binary on the node is the plugin side.',
        },
        {
          type: 'list',
          items: [
            'The CNI binary is a plain executable on disk (/opt/cni/bin/calico, /opt/cni/bin/flannel). The kubelet invokes it as a subprocess, passing arguments on stdin as JSON.',
            'The binary mutates the Pod netns — creates interfaces, assigns IPs, programs routes, firewall rules — and returns a JSON "Result" describing what it did.',
            'Multiple CNI binaries can be chained via a "conflist" file (/etc/cni/net.d/*.conflist). Each handles one concern (loopback, bridge, port mapping, firewall).',
          ],
        },
      ],
    },
    {
      heading: 'Why a plugin and not built-in?',
      blocks: [
        {
          type: 'paragraph',
          text: 'Networking is the most environment-specific part of a cluster. A plug-in model lets the same Kubernetes distribution work on bare metal (BGP), public cloud (VPC-aware CNIs), and lab environments (Flannel). The upstream project does not have to pick winners; operators pick the CNI that fits their underlay.',
        },
      ],
    },
  ],
  visualization: cniLifecycleScene,
};

const addDelCheck: LessonBody = {
  learningObjectives: [
    'Enumerate the four CNI operations the kubelet calls',
    'Describe when each operation fires in a Pod\'s life',
  ],
  sections: [
    {
      heading: 'The four operations',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Operation', 'When', 'What the plugin does'],
          rows: [
            ['ADD', 'Pod sandbox created', 'Creates interfaces in the Pod netns, assigns IPs, programs node-level rules'],
            ['DEL', 'Pod sandbox deleted', 'Releases IP, removes veth, undoes any node-level changes'],
            ['CHECK', 'Health check (1.0+)', 'Verifies that what ADD set up still exists and is correct'],
            ['VERSION', 'Discovery', 'Reports which CNI spec versions the plugin supports'],
          ],
        },
        {
          type: 'paragraph',
          text: 'ADD and DEL are the critical pair — they must be idempotent and must cleanly undo each other. A CNI plugin whose DEL leaks IPs or routes degrades the cluster slowly: scheduled Pod starts begin failing because IPAM runs out of addresses even though apparent usage is low.',
        },
        {
          type: 'code',
          language: 'bash',
          code: `# What the kubelet actually sends on stdin to the plugin:
{
  "cniVersion": "1.0.0",
  "name": "k8s-pod-network",
  "type": "calico",
  "args": {
    "cni": {
      "containerId": "f3...",
      "netns": "/var/run/netns/cni-f3...",
      "ifName": "eth0",
      "args": "K8S_POD_NAMESPACE=app;K8S_POD_NAME=web-abc;..."
    }
  }
}`,
        },
      ],
    },
    {
      heading: 'Exit code and result',
      blocks: [
        {
          type: 'paragraph',
          text: 'A successful ADD exits 0 and emits a Result on stdout — a JSON object listing the interfaces created and IP addresses assigned. The kubelet parses this and surfaces failures as Pod sandbox errors (visible as "failed to set up sandbox container" in kubectl describe pod).',
        },
      ],
    },
  ],
};

const ipamResponsibility: LessonBody = {
  learningObjectives: ['Describe IPAM\'s role within a CNI plugin and the choices it makes'],
  sections: [
    {
      heading: 'IPAM: allocate and remember',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every CNI plugin needs an IP Address Management (IPAM) component. It has two tasks: pick an available IP from a defined pool, and record the allocation so DEL can return the address. Different plugins choose very different IPAM strategies.',
        },
        {
          type: 'comparisonTable',
          headers: ['IPAM style', 'How it allocates', 'Trade-off'],
          rows: [
            ['host-local (Flannel default)', 'Each node owns a slice of the Pod CIDR and allocates from a local file', 'Simple but wastes addresses — slices do not shrink'],
            ['calico-ipam', 'Blocks of /26 are claimed per node from a global pool; returned when a node leaves', 'More efficient; needs a central store (Kubernetes datastore or etcd)'],
            ['VPC-native (AWS VPC CNI, Azure CNI)', 'Pod IPs come from cloud VPC subnets; cloud API is the IPAM', 'Cluster size bounded by the subnet size; Pods are first-class cloud citizens'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'IP exhaustion is the single most common silent CNI failure. Monitor the per-node available-address count. Flannel\'s host-local is especially prone — a node that churned through many short-lived Pods may be holding stale allocations that the kubelet\'s DEL did not clear.',
        },
      ],
    },
  ],
};

const cniLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Trace a packet between two Pods under three CNI dataplane styles. See why bridge mode fails cross-node and how VXLAN and BGP differ.',
  learningObjectives: [
    'See the hop-by-hop path a Pod packet takes under three dataplane styles',
    'Diagnose a cross-node connectivity failure',
  ],
  prerequisites: [
    { type: 'knowledge', label: 'Pod networking', description: 'You should know what a Pod IP is and that it is per-Pod, not per-container.' },
  ],
  content: {
    simulationId: 'cni-networking-explorer',
    instructions: [
      { id: 'step-1', label: 'Same-node traffic', description: 'Pick pod-a → pod-b (both on node-1). Trace it in any mode — the path is identical and does not leave the node.' },
      { id: 'step-2', label: 'Cross-node in bridge mode', description: 'Switch to bridge and pick pod-a → pod-c. The packet is dropped at the source node: a flat bridge has no cross-node fabric.' },
      { id: 'step-3', label: 'Cross-node in VXLAN', description: 'Switch to vxlan with the same source/destination. See the encap/decap hops — outer IPs are node IPs.' },
      { id: 'step-4', label: 'Cross-node in BGP', description: 'Switch to bgp. No encap — the plain Pod packet is routed by the underlay because every node advertises its Pod CIDR.' },
      { id: 'step-5', label: 'Break routing', description: 'Enable "simulate routing failure" and run again in BGP or VXLAN. The destination node is unreachable; the packet is dropped with a diagnostic reason.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'delivered-or-reason',
        label: 'Every trace either delivers or reports a failure reason',
        check: (state) => {
          const s = state as { hops: unknown[]; delivered: boolean; failureReason: string | null };
          return s.hops.length === 0 || s.delivered || s.failureReason !== null;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'what-cni-is': whatCniIs,
    'add-del-check': addDelCheck,
    'ipam-responsibility': ipamResponsibility,
  },
  labs: {
    'cni-networking-explorer': cniLab,
  },
  simulations: {
    'cni-networking-explorer': bindSimulation(cniNetworkingSimulation, renderCniNetworkState),
  },
};
