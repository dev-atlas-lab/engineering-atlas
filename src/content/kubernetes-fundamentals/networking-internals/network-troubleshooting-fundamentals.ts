import type { ConceptContentModule, LessonBody } from '../../types';

const theLadder: LessonBody = {
  learningObjectives: [
    'Walk a deterministic diagnostic ladder from DNS to endpoint selection',
    'Choose the right kubectl command at each rung',
  ],
  sections: [
    {
      heading: 'A ladder with eight rungs',
      blocks: [
        {
          type: 'paragraph',
          text: 'When "Pod A cannot reach Service B," climb this ladder in order. Each rung tests one hypothesis and rules it out before the next.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Does the caller even exist and is it Ready? `kubectl get pod <caller>` — if not Ready, fix that first.',
            'Can the caller resolve the Service DNS? Exec into the Pod and `nslookup <svc>`. No answer → CoreDNS is unhealthy or a NetworkPolicy blocks the Pod → CoreDNS.',
            'Is the Service object present and spelled correctly? `kubectl get svc <svc>` in the right namespace.',
            'Does the Service have Ready endpoints? `kubectl get endpointslice -l kubernetes.io/service-name=<svc>`. Empty → no backing Pods are Ready (readiness probe or label-selector mismatch).',
            'Can the caller reach the ClusterIP? `exec` and `curl` the ClusterIP directly. If this fails but the Service has endpoints, kube-proxy on the caller\'s node is unhealthy.',
            'Can the caller reach a Pod IP directly? `curl` one of the EndpointSlice IPs. Fails → CNI/dataplane problem (cross-node, MTU, firewall).',
            'Is NetworkPolicy allowing the traffic? If a NetworkPolicy selects the backend and no "from" matches the caller, you get a connection refused. Temporarily delete the policy to confirm.',
            'Is the backend serving on the expected port? `exec` the backend Pod and `netstat -lntp` (or ss). targetPort mismatch is a common oversight.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Save the output of each step before moving on. "The endpoints were empty, then I restarted the backend, now they\'re not — was that the fix or an unrelated change?" is a frequent self-inflicted confusion.',
        },
      ],
    },
    {
      heading: 'Useful one-liners',
      blocks: [
        {
          type: 'code',
          language: 'bash',
          code: `# Does the Pod have a route to anywhere?
kubectl exec pod -- ip route

# What does the Pod see as its own IP?
kubectl exec pod -- ip -o -4 addr show eth0 | awk '{print $4}'

# Who are the Service's endpoints right now?
kubectl get endpointslice -l kubernetes.io/service-name=web

# Which kube-proxy modes are deployed?
kubectl logs -n kube-system -l k8s-app=kube-proxy --tail=10 | grep -i mode

# Trace to a Pod IP through the node's routing table (needs an admin container on the node)
traceroute -n <pod-ip>`,
        },
      ],
    },
  ],
};

export const content: ConceptContentModule = {
  lessons: {
    'the-ladder': theLadder,
  },
  labs: {},
  simulations: {},
};
