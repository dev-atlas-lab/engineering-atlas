import type { SceneDefinition } from '../../../engines/visualization/types';

export const governanceLoopScene: SceneDefinition = {
  id: 'governance-loop',
  type: 'sequence',
  title: 'Guardrails, detection, and response around one change',
  nodes: [
    { id: 'eng', type: 'user', label: 'Engineer or pipeline', position: { x: 0, y: 0 }, data: { Makes: 'Configuration changes through the control plane' } },
    { id: 'guard', type: 'policy', label: 'Policy guardrails', position: { x: 0, y: 0 }, data: { Azure: 'Azure Policy (deny), RBAC', AWS: 'SCPs, RCPs, account-level settings, proactive controls' } },
    { id: 'res', type: 'server', label: 'Cloud resources', position: { x: 0, y: 0 }, data: { Emit: 'Configuration state and audit events' } },
    { id: 'posture', type: 'policy', label: 'Posture and compliance', position: { x: 0, y: 0 }, data: { Azure: 'Azure Policy (audit), Defender for Cloud', AWS: 'AWS Config, Security Hub CSPM' } },
    { id: 'team', type: 'user', label: 'Security / on-call team', position: { x: 0, y: 0 }, data: { Owns: 'Triage, remediation, and lessons learned' } },
  ],
  edges: [
    { id: 'g1', source: 'eng', target: 'guard', label: 'request: change config' },
    { id: 'g2', source: 'guard', target: 'res', label: 'allowed: within policy' },
    { id: 'g3', source: 'res', target: 'posture', label: 'config + audit events' },
    { id: 'g4', source: 'posture', target: 'res', label: 'auto-remediate drift' },
    { id: 'g5', source: 'posture', target: 'team', label: 'finding: prioritised alert' },
    { id: 'g6', source: 'team', target: 'guard', label: 'post-incident: new guardrail' },
  ],
  states: [
    { id: 'gl0', label: 'Controls around the change path', description: 'Every configuration change passes through the control plane. Guardrails sit in front of it; posture management watches what results; people close the loop.' },
    { id: 'gl1', label: 'Preventive: checked before it happens', description: 'The change is evaluated against preventive policies. A change that violates one — making storage public, deleting audit logs — is denied outright.' },
    { id: 'gl2', label: 'The change is applied', description: 'This change is within policy, so it is applied. Not everything can be prevented without blocking legitimate work, so many risks are handled by the next layers.' },
    { id: 'gl3', label: 'Detective: continuous evaluation', description: 'Configuration changes and audit events flow to posture management, which evaluates resources against baselines such as the Microsoft cloud security benchmark or the AWS Foundational Security Best Practices standard.' },
    { id: 'gl4', label: 'Corrective: automatic remediation', description: 'For well-understood drift — a missing diagnostic setting, a disabled default — an automated remediation restores the baseline.' },
    { id: 'gl5', label: 'Findings reach people', description: 'Findings that need judgement are prioritised — by severity, internet exposure, and the data at risk — and routed to someone who can act, not just left on a dashboard.' },
    { id: 'gl6', label: 'Learn and prevent', description: 'After an incident or repeated finding, the team asks whether a guardrail could have prevented it, and adds one. Over time, more risks move from “detected” to “prevented”.' },
  ],
};
