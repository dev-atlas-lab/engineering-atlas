import { describe, it, expect } from 'vitest';
import type { SimulationDefinition, SimulationParams } from '../../engines/simulation/types';
import {
  cniNetworkingSimulation,
  ingressRoutingSimulation,
  networkPolicySimulation,
  rbacPermissionSimulation,
  workloadSecuritySimulation,
  tracePacket,
  routeRequest,
  evaluateConnectivity,
  labelsMatch,
  evaluateRbac,
  evaluateWorkloadSecurity,
  admissionForProfile,
} from './security-simulations';
import type {
  CniNetworkState,
  IngressState,
  NpState,
  RbacState,
  WorkloadSecurityState,
  SecurityContext,
} from './security-simulations';

function runAll<T>(sim: SimulationDefinition<T>, params: SimulationParams): T {
  let state = sim.createInitialState(params);
  for (const step of sim.steps(params)) {
    state = step.apply(state, params);
  }
  return state;
}

// --- CNI networking -------------------------------------------------------

describe('cniNetworkingSimulation', () => {
  it('same-node packet is delivered in any mode', () => {
    const state = runAll<CniNetworkState>(cniNetworkingSimulation, {
      mode: 'bridge', source: 'pod-a', destination: 'pod-b', breakRouting: false,
    });
    expect(state.delivered).toBe(true);
    expect(state.failureReason).toBeNull();
  });

  it('cross-node packet in bridge mode is dropped', () => {
    const state = runAll<CniNetworkState>(cniNetworkingSimulation, {
      mode: 'bridge', source: 'pod-a', destination: 'pod-c', breakRouting: false,
    });
    expect(state.delivered).toBe(false);
    expect(state.failureReason).toBeTruthy();
  });

  it('VXLAN delivers cross-node with encap/decap hops', () => {
    const state = runAll<CniNetworkState>(cniNetworkingSimulation, {
      mode: 'vxlan', source: 'pod-a', destination: 'pod-c', breakRouting: false,
    });
    expect(state.delivered).toBe(true);
    expect(state.hops.some((h) => h.kind === 'vxlan-encap')).toBe(true);
    expect(state.hops.some((h) => h.kind === 'vxlan-decap')).toBe(true);
  });

  it('BGP delivers without encapsulation', () => {
    const state = runAll<CniNetworkState>(cniNetworkingSimulation, {
      mode: 'bgp', source: 'pod-a', destination: 'pod-c', breakRouting: false,
    });
    expect(state.delivered).toBe(true);
    expect(state.hops.some((h) => h.kind === 'bgp-route')).toBe(true);
    expect(state.hops.some((h) => h.kind === 'vxlan-encap')).toBe(false);
  });

  it('routing failure drops cross-node traffic', () => {
    const state = runAll<CniNetworkState>(cniNetworkingSimulation, {
      mode: 'bgp', source: 'pod-a', destination: 'pod-c', breakRouting: true,
    });
    expect(state.delivered).toBe(false);
    expect(state.failureReason).toBeTruthy();
  });

  it('tracePacket is deterministic', () => {
    const nodes = cniNetworkingSimulation.createInitialState({
      mode: 'vxlan', source: 'pod-a', destination: 'pod-c', breakRouting: false,
    }).nodes;
    const pods = cniNetworkingSimulation.createInitialState({
      mode: 'vxlan', source: 'pod-a', destination: 'pod-c', breakRouting: false,
    }).pods;
    const a = tracePacket('vxlan', 'pod-a', 'pod-c', nodes, pods);
    const b = tracePacket('vxlan', 'pod-a', 'pod-c', nodes, pods);
    expect(a).toStrictEqual(b);
  });
});

// --- Ingress routing ------------------------------------------------------

describe('ingressRoutingSimulation', () => {
  it('matches a longer prefix over a shorter one', () => {
    const state = runAll<IngressState>(ingressRoutingSimulation, {
      scheme: 'https', host: 'shop.example.com', path: '/api/orders',
      tlsEnabled: true, apiBackendHealthy: true, adminBackendExists: true,
    });
    expect(state.decision?.responseCode).toBe(200);
    expect(state.decision?.rule?.backendService).toBe('api');
  });

  it('falls through to the / rule when /api does not prefix the path', () => {
    const state = runAll<IngressState>(ingressRoutingSimulation, {
      scheme: 'https', host: 'shop.example.com', path: '/products',
      tlsEnabled: true, apiBackendHealthy: true, adminBackendExists: true,
    });
    expect(state.decision?.rule?.backendService).toBe('web');
  });

  it('returns 404 when no host matches', () => {
    const state = runAll<IngressState>(ingressRoutingSimulation, {
      scheme: 'https', host: 'other.example.com', path: '/',
      tlsEnabled: true, apiBackendHealthy: true, adminBackendExists: true,
    });
    expect(state.decision?.responseCode).toBe(404);
  });

  it('returns 502 when the backend has no Ready endpoints', () => {
    const state = runAll<IngressState>(ingressRoutingSimulation, {
      scheme: 'https', host: 'shop.example.com', path: '/api',
      tlsEnabled: true, apiBackendHealthy: false, adminBackendExists: true,
    });
    expect(state.decision?.responseCode).toBe(502);
  });

  it('routeRequest handles the TLS-cert-missing case', () => {
    const rules = ingressRoutingSimulation.createInitialState({
      scheme: 'https', host: 'shop.example.com', path: '/api',
      tlsEnabled: true, apiBackendHealthy: true, adminBackendExists: true,
    }).rules;
    const backends = ingressRoutingSimulation.createInitialState({
      scheme: 'https', host: 'shop.example.com', path: '/api',
      tlsEnabled: true, apiBackendHealthy: true, adminBackendExists: true,
    }).backends;
    const decision = routeRequest(rules, backends, { scheme: 'https', host: 'shop.example.com', path: '/api' }, false);
    expect(decision.responseCode).toBe(421);
  });
});

// --- NetworkPolicy --------------------------------------------------------

describe('networkPolicySimulation', () => {
  it('labelsMatch requires all selector keys', () => {
    expect(labelsMatch({ a: '1' }, { a: '1', b: '2' })).toBe(true);
    expect(labelsMatch({ a: '1', b: '2' }, { a: '1' })).toBe(false);
  });

  it('no policies: traffic flows', () => {
    const state = runAll<NpState>(networkPolicySimulation, {
      scenario: 'none', source: 'web', destination: 'api',
    });
    expect(state.decision?.allowed).toBe(true);
  });

  it('default-deny ingress blocks web → api', () => {
    const state = runAll<NpState>(networkPolicySimulation, {
      scenario: 'default-deny', source: 'web', destination: 'api',
    });
    expect(state.decision?.allowed).toBe(false);
  });

  it('allow-frontend permits web → api but not analytics → api', () => {
    const allow = runAll<NpState>(networkPolicySimulation, {
      scenario: 'allow-frontend', source: 'web', destination: 'api',
    });
    expect(allow.decision?.allowed).toBe(true);

    const deny = runAll<NpState>(networkPolicySimulation, {
      scenario: 'allow-frontend', source: 'analytics', destination: 'api',
    });
    expect(deny.decision?.allowed).toBe(false);
  });

  it('egress restriction confines web to the api target', () => {
    const okEgress = runAll<NpState>(networkPolicySimulation, {
      scenario: 'restrict-egress', source: 'web', destination: 'api',
    });
    expect(okEgress.decision?.allowed).toBe(true);
    const badEgress = runAll<NpState>(networkPolicySimulation, {
      scenario: 'restrict-egress', source: 'web', destination: 'db',
    });
    expect(badEgress.decision?.allowed).toBe(false);
  });

  it('evaluateConnectivity is deterministic', () => {
    const state = networkPolicySimulation.createInitialState({
      scenario: 'allow-frontend', source: 'web', destination: 'api',
    });
    const src = state.pods.find((p) => p.id === state.source)!;
    const dst = state.pods.find((p) => p.id === state.destination)!;
    const a = evaluateConnectivity({ source: src, destination: dst, policies: state.policies, namespaces: state.namespaces });
    const b = evaluateConnectivity({ source: src, destination: dst, policies: state.policies, namespaces: state.namespaces });
    expect(a).toStrictEqual(b);
  });
});

// --- RBAC -----------------------------------------------------------------

describe('rbacPermissionSimulation', () => {
  it('alice can get pods in team-a', () => {
    const state = runAll<RbacState>(rbacPermissionSimulation, {
      subjectKind: 'User', subjectName: 'alice', subjectNamespace: 'tooling',
      verb: 'get', resource: 'pods', namespace: 'team-a',
    });
    expect(state.decision?.allowed).toBe(true);
    expect(state.decision?.matchedBinding).toBe('alice-pod-reader');
  });

  it('alice cannot delete pods', () => {
    const state = runAll<RbacState>(rbacPermissionSimulation, {
      subjectKind: 'User', subjectName: 'alice', subjectNamespace: 'tooling',
      verb: 'delete', resource: 'pods', namespace: 'team-a',
    });
    expect(state.decision?.allowed).toBe(false);
  });

  it('alice cannot get pods in team-b', () => {
    const state = runAll<RbacState>(rbacPermissionSimulation, {
      subjectKind: 'User', subjectName: 'alice', subjectNamespace: 'tooling',
      verb: 'get', resource: 'pods', namespace: 'team-b',
    });
    expect(state.decision?.allowed).toBe(false);
  });

  it('platform-ops group gets cluster-admin everywhere', () => {
    const state = runAll<RbacState>(rbacPermissionSimulation, {
      subjectKind: 'Group', subjectName: 'platform-ops', subjectNamespace: 'tooling',
      verb: 'delete', resource: 'nodes', namespace: '',
    });
    expect(state.decision?.allowed).toBe(true);
    expect(state.decision?.matchedRole).toBe('cluster-admin');
  });

  it('carol has no bindings', () => {
    const state = runAll<RbacState>(rbacPermissionSimulation, {
      subjectKind: 'User', subjectName: 'carol', subjectNamespace: 'tooling',
      verb: 'get', resource: 'pods', namespace: 'team-a',
    });
    expect(state.decision?.allowed).toBe(false);
  });

  it('evaluateRbac is deterministic', () => {
    const state = rbacPermissionSimulation.createInitialState({
      subjectKind: 'User', subjectName: 'alice', subjectNamespace: 'tooling',
      verb: 'get', resource: 'pods', namespace: 'team-a',
    });
    const a = evaluateRbac(state.roles, state.bindings, state.request);
    const b = evaluateRbac(state.roles, state.bindings, state.request);
    expect(a).toStrictEqual(b);
  });
});

// --- Workload security ----------------------------------------------------

describe('workloadSecuritySimulation', () => {
  const secureCtx: SecurityContext = {
    runAsUser: 1000, runAsNonRoot: true, readOnlyRootFilesystem: true,
    allowPrivilegeEscalation: false, privileged: false,
    capabilitiesAdd: [], capabilitiesDrop: ['ALL'],
    seccompProfile: 'runtime/default',
  };
  const insecureCtx: SecurityContext = {
    runAsUser: 0, runAsNonRoot: false, readOnlyRootFilesystem: false,
    allowPrivilegeEscalation: true, privileged: true,
    capabilitiesAdd: ['SYS_ADMIN'], capabilitiesDrop: [],
    seccompProfile: 'unconfined',
  };

  it('secure config has only the info finding', () => {
    const findings = evaluateWorkloadSecurity(secureCtx);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe('info');
  });

  it('insecure config has multiple serious findings', () => {
    const findings = evaluateWorkloadSecurity(insecureCtx);
    expect(findings.some((f) => f.severity === 'critical')).toBe(true);
    expect(findings.some((f) => f.id === 'privileged')).toBe(true);
    expect(findings.some((f) => f.id === 'caps-add')).toBe(true);
  });

  it('restricted profile admits the secure config', () => {
    expect(admissionForProfile(secureCtx, 'restricted').allowed).toBe(true);
  });
  it('restricted profile rejects the insecure config', () => {
    expect(admissionForProfile(insecureCtx, 'restricted').allowed).toBe(false);
  });
  it('baseline admits a non-privileged config without SYS_ADMIN', () => {
    expect(admissionForProfile({ ...insecureCtx, privileged: false, capabilitiesAdd: ['NET_ADMIN'] }, 'baseline').allowed).toBe(true);
  });
  it('privileged profile admits everything', () => {
    expect(admissionForProfile(insecureCtx, 'privileged').allowed).toBe(true);
  });

  it('simulation produces findings after the scan step', () => {
    const state = runAll<WorkloadSecurityState>(workloadSecuritySimulation, {
      runAsUser: 1000, runAsNonRoot: true, readOnlyRootFilesystem: true,
      allowPrivilegeEscalation: false, privileged: false,
      dropAll: true, addNetAdmin: false, addSysAdmin: false,
      seccomp: 'runtime/default', admissionProfile: 'restricted',
    });
    expect(state.findings.length).toBeGreaterThan(0);
    expect(state.admissionAllowed).toBe(true);
  });
});
