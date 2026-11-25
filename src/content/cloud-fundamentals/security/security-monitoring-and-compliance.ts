import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { governanceLoopScene } from './security-monitoring-and-compliance.scenes';
import { controlResponseSimulation, type ControlState } from './control-response';
import { renderControlState } from './control-response-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const controlsAndGovernance: LessonBody = {
  learningObjectives: [
    'Distinguish preventive, detective, and corrective controls and the trade-offs of each',
    'Explain security baselines, secure defaults, and policy as code',
  ],
  analogy:
    'A building can stop fires three ways: fire-resistant materials so fires cannot start (preventive), smoke detectors (detective), and sprinklers (corrective). A building with only smoke detectors burns down with everyone well informed.',
  sections: [
    {
      heading: 'Three kinds of control',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Control', 'Acts', 'Cloud examples', 'Trade-off'],
          rows: [
            ['Preventive', 'Before the change exists', 'Deny policies, organization guardrails, least-privilege permissions, account-level defaults such as blocking public storage', 'Can block legitimate work; needs an exemption process and careful rollout'],
            ['Detective', 'After the change, by evaluating state or events', 'Configuration compliance rules, posture recommendations, alerts on audit events, threat detection', 'Exposure lasts until someone acts; only as good as the routing of findings'],
            ['Corrective', 'After detection, by restoring a good state', 'Automatic remediation, redeploying from infrastructure as code, revoking credentials, restoring backups', 'Automated fixes can break things if they are wrong; reserve them for well-understood cases'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Mature environments combine all three: prevent what must never happen, detect what cannot reasonably be prevented, and correct well-understood drift automatically. The Misconfiguration Response lab lets you compare the exposure window each combination leaves.',
        },
      ],
    },
    {
      heading: 'Baselines, secure defaults, and policy as code',
      blocks: [
        {
          type: 'list',
          items: [
            'A security baseline is a written set of required configurations — for example “no storage accounts with public access, audit logs exported to the central workspace, TLS 1.2 or later”. Benchmarks such as the Microsoft cloud security benchmark, the AWS Foundational Security Best Practices standard, and the CIS benchmarks are common starting points.',
            'Secure defaults make the safe choice the easy one: new environments (“landing zones”) arrive with logging, guardrails, and network structure already in place, so teams do not have to remember them.',
            'Policy as code stores guardrails and compliance rules in version control, reviewed and deployed like application code, so that changes to the rules are themselves controlled and auditable.',
          ],
        },
      ],
    },
    {
      heading: 'Misconfiguration is the common case',
      blocks: [
        {
          type: 'paragraph',
          text: 'Many cloud security incidents involve no exotic exploit — just a configuration that exposed something: public storage, an open management port, a disabled log, an over-privileged identity. Because every configuration is an API call, these mistakes can be checked automatically and at scale. That is the core idea behind cloud governance.',
        },
      ],
    },
  ],
  visualization: governanceLoopScene,
  knowledgeCheck: [
    {
      id: 'ctl-kc-1',
      type: 'scenario',
      prompt:
        'A team adds a rule that reports storage accounts allowing public access, but nobody is notified, and findings are reviewed monthly. What is the main weakness?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish preventive, detective, and corrective controls and the trade-offs of each',
      options: [
        { id: 'a', label: 'Detection without routing: an exposure can last up to a month before anyone acts', correct: true, explanation: 'Correct — add alerting for high-severity findings, prevention where possible, or automatic remediation.' },
        { id: 'b', label: 'Detective rules cannot evaluate storage accounts', correct: false, explanation: 'They can; the problem is what happens with the finding.' },
        { id: 'c', label: 'There is no weakness — monthly review is sufficient', correct: false, explanation: 'Public data can be found and copied within hours.' },
      ],
    },
    {
      id: 'ctl-kc-2',
      type: 'single-choice',
      prompt: 'Why should a new deny policy usually be rolled out in audit mode first?',
      difficulty: 'intermediate',
      learningObjective: 'Explain security baselines, secure defaults, and policy as code',
      options: [
        { id: 'a', label: 'To see what existing resources and deployments it would block before it starts blocking them', correct: true, explanation: 'Correct — the same reasoning as running a WAF in detection mode first.' },
        { id: 'b', label: 'Because deny policies cannot be assigned directly', correct: false, explanation: 'They can; auditing first is a rollout practice.' },
        { id: 'c', label: 'Audit mode is more secure than deny', correct: false, explanation: 'Audit only reports; deny prevents.' },
      ],
    },
  ],
};

const postureAndMisconfiguration: LessonBody = {
  learningObjectives: [
    'Explain cloud security posture management and how findings are prioritised',
    'Distinguish configuration, vulnerability, and exposure management',
  ],
  sections: [
    {
      heading: 'Cloud security posture management',
      blocks: [
        {
          type: 'paragraph',
          text: 'Cloud security posture management (CSPM) continuously inventories resources across subscriptions or accounts and evaluates them against baselines, producing findings and an overall score. It answers “how far is our environment from what we said it should be?” — and, because it runs continuously, catches drift introduced by manual changes, new services, and new teams.',
        },
      ],
    },
    {
      heading: 'Three related disciplines',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Discipline', 'Looks for', 'Examples'],
          rows: [
            ['Configuration management', 'Settings that violate the baseline', 'Public storage, logging disabled, weak TLS settings'],
            ['Vulnerability management', 'Known flaws in software', 'Unpatched OS packages, vulnerable container image libraries'],
            ['Exposure management', 'Which weaknesses are actually reachable and what they lead to', 'An internet-facing VM with a critical vulnerability and an identity that can read customer data'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Findings always outnumber the people available to fix them, so prioritisation matters more than volume. A medium-severity issue on an internet-reachable resource with access to sensitive data deserves attention before a critical one on an isolated test VM. Attack-path analysis features in posture tools combine configuration, vulnerability, network, and identity data to find exactly these chains.',
        },
      ],
    },
    {
      heading: 'Secure scores and their limits',
      blocks: [
        {
          type: 'paragraph',
          text: 'Posture tools summarise compliance as a score or percentage. Scores are useful for tracking trends and comparing teams, but they weight controls generically. Track the score, and also track whether your specific highest-risk findings are getting fixed.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'pos-kc-1',
      type: 'scenario',
      prompt:
        'Which finding should a small team fix first?',
      difficulty: 'intermediate',
      learningObjective: 'Explain cloud security posture management and how findings are prioritised',
      options: [
        { id: 'a', label: 'A medium-severity vulnerability on an internet-facing VM whose identity can read the customer database', correct: true, explanation: 'Correct — reachability plus access to sensitive data makes it the most likely real attack path.' },
        { id: 'b', label: 'A critical vulnerability on an isolated, empty test VM with no identity', correct: false, explanation: 'Severity alone ignores exposure and impact.' },
        { id: 'c', label: 'A low-severity recommendation to add resource tags', correct: false, explanation: 'Useful hygiene, but not a risk.' },
      ],
    },
  ],
};

const auditComplianceAndResponse: LessonBody = {
  learningObjectives: [
    'Explain what audit logs record, which are enabled by default, and how to keep them trustworthy',
    'Explain compliance frameworks, evidence, and the limits of provider attestations',
    'Describe the incident response lifecycle',
  ],
  sections: [
    {
      heading: 'Audit logs',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Log', 'Records', 'Default'],
          rows: [
            ['Control-plane (management) activity', 'Who created, changed, or deleted resources and permissions', 'Recorded by default: Azure Activity Log and AWS CloudTrail event history keep 90 days'],
            ['Sign-in and identity logs', 'Authentications, failures, MFA, token issuance', 'Available in the identity provider; retention and export vary'],
            ['Data-plane access', 'Reads and writes of objects, secrets, and keys', 'Often not enabled by default — Azure resource logs need diagnostic settings; CloudTrail data events must be configured'],
          ],
        },
        {
          type: 'list',
          items: [
            'Export logs to a central workspace or archive with longer retention than the defaults.',
            'Keep that destination in a separate account or subscription that workload administrators cannot modify, and protect it from deletion.',
            'Alert on the events that signal trouble: disabling logging, changing permissions on sensitive resources, sign-ins by emergency-access accounts.',
          ],
        },
      ],
    },
    {
      heading: 'Compliance fundamentals',
      blocks: [
        {
          type: 'paragraph',
          text: 'Compliance frameworks — for example ISO/IEC 27001, SOC 2, PCI DSS, or sector and national regulations — define controls an organization must operate and the evidence it must produce. In the cloud, evidence splits along the shared responsibility model: providers publish audit reports and certifications for their side (through the Microsoft Service Trust Portal and AWS Artifact), and the customer must evidence its own controls, typically with policy compliance results, configuration history, and audit logs.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Running on a certified platform does not make a workload compliant. A compliance dashboard in a posture tool maps technical checks to framework controls, but many controls — processes, training, risk assessments — cannot be checked automatically at all.',
        },
      ],
    },
    {
      heading: 'Incident response',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'Preparation: logging in place, contacts and escalation paths agreed, emergency access tested, playbooks written.',
            'Detection and analysis: alerts are triaged; responders establish what happened, using audit logs to scope it.',
            'Containment: stop the spread — disable compromised credentials, isolate resources, block network paths — while preserving evidence such as disk snapshots.',
            'Eradication and recovery: remove the attacker’s access and artifacts, rotate secrets, restore clean systems and data.',
            'Post-incident activity: a blameless review of what failed, followed by new preventive or detective controls.',
          ],
        },
        {
          type: 'paragraph',
          text: 'These phases follow the incident handling lifecycle long described in NIST’s incident handling guidance (SP 800-61). Deep monitoring, alerting, and observability practices are covered in the Monitoring and Observability category.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'aud-kc-1',
      type: 'scenario',
      prompt:
        'After a suspected leak, investigators need to know which identity read objects from a storage bucket last week. Management event logging was on; nothing else was configured. What will they find?',
      difficulty: 'advanced',
      learningObjective: 'Explain what audit logs record, which are enabled by default, and how to keep them trustworthy',
      options: [
        { id: 'a', label: 'Changes to the bucket’s configuration, but not the individual object reads — data-plane logging was not enabled', correct: true, explanation: 'Correct — enable data-plane logs for sensitive data before you need them.' },
        { id: 'b', label: 'Every object read, because all access is logged by default', correct: false, explanation: 'Data-plane access logging is typically opt-in.' },
        { id: 'c', label: 'Nothing at all', correct: false, explanation: 'Management events such as policy changes are recorded by default.' },
      ],
    },
    {
      id: 'aud-kc-2',
      type: 'single-choice',
      prompt: 'An auditor asks for evidence that the company’s cloud workload meets a framework. Is the provider’s certification sufficient?',
      difficulty: 'intermediate',
      learningObjective: 'Explain compliance frameworks, evidence, and the limits of provider attestations',
      options: [
        { id: 'a', label: 'No — it covers the provider’s controls; the company must evidence its own configuration and processes', correct: true, explanation: 'Correct — compliance follows the shared responsibility model.' },
        { id: 'b', label: 'Yes — certified platforms make every workload compliant', correct: false, explanation: 'Your configuration and processes are assessed separately.' },
        { id: 'c', label: 'Certifications are irrelevant to auditors', correct: false, explanation: 'They are part of the evidence, just not all of it.' },
      ],
    },
    {
      id: 'aud-kc-3',
      type: 'single-choice',
      prompt: 'During containment of a compromised VM, why take a disk snapshot before rebuilding it?',
      difficulty: 'intermediate',
      learningObjective: 'Describe the incident response lifecycle',
      options: [
        { id: 'a', label: 'To preserve evidence for analysis of how the attacker got in and what they did', correct: true, explanation: 'Correct — rebuilding destroys the evidence.' },
        { id: 'b', label: 'To restore the compromised VM later', correct: false, explanation: 'Restoring a compromised system reintroduces the attacker.' },
        { id: 'c', label: 'Snapshots remove malware', correct: false, explanation: 'A snapshot copies the disk as-is.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'NIST SP 800-61: Incident response recommendations', url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final' },
  ],
};

const azureSecurityGovernance: LessonBody = {
  learningObjectives: ['Describe Azure Policy, Microsoft Defender for Cloud, and Azure audit logging and how they combine'],
  sections: [
    {
      heading: 'Azure Policy',
      blocks: [
        {
          type: 'paragraph',
          text: 'Azure Policy evaluates resource configurations against policy definitions, grouped into initiatives and assigned at management group, subscription, or resource group scope. The effect decides what happens: deny blocks non-compliant requests; audit and auditIfNotExists report; modify and append change request properties; deployIfNotExists deploys a missing related resource such as a diagnostic setting; denyAction blocks specific actions such as deletion. Existing non-compliant resources can be fixed with remediation tasks for modify and deployIfNotExists policies, and exemptions record approved exceptions.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Azure Policy governs what resources look like; Azure RBAC governs who may act. They complement each other: RBAC might allow a team to create storage accounts, while Azure Policy denies creating them with public access.',
        },
      ],
    },
    {
      heading: 'Microsoft Defender for Cloud',
      blocks: [
        {
          type: 'list',
          items: [
            'Foundational CSPM, available at no additional cost: security recommendations and secure score, assessed against the Microsoft cloud security benchmark by default.',
            'Defender CSPM, a paid plan: adds capabilities such as attack path analysis and agentless scanning.',
            'Workload protection plans (for servers, storage, databases, containers, and more): threat detection and vulnerability assessment for specific resource types.',
            'Regulatory compliance dashboards map recommendations to frameworks, and Defender for Cloud can also assess AWS and GCP environments.',
          ],
        },
      ],
    },
    {
      heading: 'Audit logging',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Activity Log records control-plane operations for each subscription and retains them for 90 days; diagnostic settings export it — and resource logs, which are not collected by default — to a Log Analytics workspace, storage account, or event hub. Microsoft Sentinel, a SIEM built on Log Analytics, correlates these with identity and other signals for detection and response.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Azure Policy, Microsoft Defender for Cloud, and Azure Monitor logs',
    keyFeatures: [
      'Azure Policy definitions, initiatives, and assignments with deny, audit, modify, deployIfNotExists, and denyAction effects',
      'Remediation tasks and exemptions',
      'Defender for Cloud secure score and recommendations based on the Microsoft cloud security benchmark',
      'Defender CSPM attack path analysis and workload protection plans',
      'Activity Log, diagnostic settings, and Microsoft Sentinel',
    ],
    terminology: {
      'Preventive configuration guardrail': 'Azure Policy with the deny effect',
      'Detective compliance rule': 'Azure Policy with audit or auditIfNotExists',
      'Automatic remediation': 'Remediation task (modify or deployIfNotExists)',
      'Posture management': 'Microsoft Defender for Cloud (CSPM)',
      'Control-plane audit log': 'Azure Activity Log',
    },
    architecturalNotes: [
      'Policies assigned at a management group apply to every subscription beneath it.',
      'Azure Policy and Azure RBAC answer different questions and are used together.',
      'Resource logs require diagnostic settings; the Activity Log alone does not record data-plane access.',
    ],
    limitations: [
      'Some capabilities, such as attack path analysis, require paid Defender plans.',
      'Remediation tasks apply only to modify and deployIfNotExists effects.',
    ],
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/governance/policy/overview',
  },
  knowledgeCheck: [
    {
      id: 'azgov-kc-1',
      type: 'single-choice',
      prompt: 'Which Azure Policy effect automatically adds a missing diagnostic setting to resources?',
      difficulty: 'intermediate',
      learningObjective: 'Describe Azure Policy, Microsoft Defender for Cloud, and Azure audit logging and how they combine',
      options: [
        { id: 'a', label: 'deployIfNotExists', correct: true, explanation: 'Correct — with a remediation task for existing resources.' },
        { id: 'b', label: 'audit', correct: false, explanation: 'Audit only reports.' },
        { id: 'c', label: 'deny', correct: false, explanation: 'Deny blocks requests; it does not deploy anything.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Azure Policy effects', url: 'https://learn.microsoft.com/en-us/azure/governance/policy/concepts/effect-basics' },
    { label: 'Microsoft Defender for Cloud overview', url: 'https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction' },
  ],
};

const awsSecurityGovernance: LessonBody = {
  learningObjectives: ['Describe AWS Organizations policies, AWS Config, AWS Security Hub, Amazon GuardDuty, and AWS CloudTrail and how they combine'],
  sections: [
    {
      heading: 'Preventive: organization policies and controls',
      blocks: [
        {
          type: 'paragraph',
          text: 'SCPs and RCPs set maximum permissions across member accounts, so they are the main preventive tool for actions such as disabling CloudTrail or leaving approved Regions. Account-level settings such as S3 Block Public Access prevent specific exposures. AWS Control Tower packages controls as preventive (implemented with organization policies), detective (implemented with AWS Config rules), and proactive (checking infrastructure-as-code templates before deployment).',
        },
      ],
    },
    {
      heading: 'Detective and corrective: AWS Config',
      blocks: [
        {
          type: 'paragraph',
          text: 'AWS Config records resource configurations and their history, and evaluates them with managed or custom rules — individually or as conformance packs. Non-compliant resources can be remediated automatically or on demand with Systems Manager Automation documents. Configuration history also serves as compliance evidence.',
        },
      ],
    },
    {
      heading: 'Posture, threats, and audit',
      blocks: [
        {
          type: 'list',
          items: [
            'AWS Security Hub CSPM (the service previously named Security Hub) runs automated checks against standards such as AWS Foundational Security Best Practices, CIS, PCI DSS, and NIST SP 800-53, and aggregates findings.',
            'The newer AWS Security Hub, generally available since December 2025, correlates signals from Amazon GuardDuty, Amazon Inspector, Amazon Macie, and Security Hub CSPM to prioritise risks.',
            'Amazon GuardDuty detects threats from CloudTrail, VPC flow logs, DNS logs, and other sources; Amazon Inspector finds software vulnerabilities and unintended network exposure.',
            'AWS CloudTrail records management events by default (90 days in event history); a trail or event data store keeps them longer and can add data events. An organization trail captures every account centrally.',
          ],
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS Organizations policies, AWS Config, AWS Security Hub, Amazon GuardDuty, and AWS CloudTrail',
    keyFeatures: [
      'SCPs and RCPs as preventive organization guardrails',
      'AWS Config rules, conformance packs, configuration history, and Systems Manager Automation remediation',
      'Security Hub CSPM security standards and the unified Security Hub',
      'GuardDuty threat detection and Inspector vulnerability management',
      'CloudTrail management and data events, with organization trails',
    ],
    terminology: {
      'Preventive configuration guardrail': 'SCPs, RCPs, account-level settings, Control Tower preventive and proactive controls',
      'Detective compliance rule': 'AWS Config rule (or Control Tower detective control)',
      'Automatic remediation': 'AWS Config remediation with Systems Manager Automation',
      'Posture management': 'AWS Security Hub CSPM',
      'Control-plane audit log': 'AWS CloudTrail management events',
    },
    architecturalNotes: [
      'Preventive guardrails are expressed mainly as permission ceilings (SCPs and RCPs) rather than as configuration rules.',
      'Detection is spread across specialised services and aggregated by Security Hub.',
      'Organization trails and delegated administrator accounts centralise logging and findings.',
    ],
    limitations: [
      'SCPs cannot express every configuration rule; some need Config rules or proactive controls instead.',
      'CloudTrail data events are not recorded unless configured.',
    ],
    documentationUrl: 'https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html',
  },
  knowledgeCheck: [
    {
      id: 'awsgov-kc-1',
      type: 'single-choice',
      prompt: 'Which combination provides prevention, detection, and correction for “CloudTrail must stay enabled” across an organization?',
      difficulty: 'advanced',
      learningObjective: 'Describe AWS Organizations policies, AWS Config, AWS Security Hub, Amazon GuardDuty, and AWS CloudTrail and how they combine',
      options: [
        { id: 'a', label: 'An SCP denying StopLogging and DeleteTrail, a Config rule checking that a trail is enabled, and remediation that re-enables it', correct: true, explanation: 'Correct — each control type covers the others’ gaps.' },
        { id: 'b', label: 'GuardDuty alone', correct: false, explanation: 'GuardDuty detects threats; it neither prevents nor corrects configuration changes.' },
        { id: 'c', label: 'A permissions boundary on one administrator role', correct: false, explanation: 'Other principals would remain unrestricted.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'AWS Security Hub CSPM', url: 'https://aws.amazon.com/security-hub/cspm/' },
    { label: 'AWS Control Tower controls', url: 'https://docs.aws.amazon.com/controltower/latest/controlreference/controls.html' },
  ],
};

const governanceComparison: LessonBody = {
  learningObjectives: ['Compare Azure and AWS governance and posture services by control type'],
  sections: [
    {
      heading: 'Side by side',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Need', 'Azure', 'AWS', 'Difference'],
          rows: [
            ['Preventive guardrails', 'Azure Policy (deny, denyAction), RBAC', 'SCPs, RCPs, account settings, proactive controls', 'Azure expresses guardrails mainly as configuration rules; AWS mainly as permission ceilings'],
            ['Detective compliance rules', 'Azure Policy (audit, auditIfNotExists)', 'AWS Config rules and conformance packs', 'One service on Azure handles prevention and detection; AWS splits them'],
            ['Automatic remediation', 'Remediation tasks (modify, deployIfNotExists)', 'Config remediation with Systems Manager Automation', 'Comparable outcome, different mechanisms'],
            ['Posture management', 'Defender for Cloud (CSPM)', 'Security Hub CSPM / Security Hub', 'Default benchmarks: Microsoft cloud security benchmark vs. AWS Foundational Security Best Practices'],
            ['Threat detection', 'Defender for Cloud workload protection plans', 'GuardDuty, Inspector, Macie', 'Azure bundles per-resource plans; AWS uses separate services'],
            ['Control-plane audit', 'Activity Log (90 days)', 'CloudTrail event history (90 days)', 'Both need export for long-term retention'],
            ['SIEM', 'Microsoft Sentinel', 'Third-party or partner SIEMs; Security Hub for aggregation', 'Different scope: Sentinel is a full SIEM'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The pairs are conceptual and the services evolve quickly — AWS restructured Security Hub in 2025, for example. Confirm current capabilities before designing around them.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'govcmp-kc-1',
      type: 'single-choice',
      prompt: 'A team wants a single policy engine that both denies non-compliant deployments and reports existing non-compliant resources. On which platform is that one service?',
      difficulty: 'intermediate',
      learningObjective: 'Compare Azure and AWS governance and posture services by control type',
      options: [
        { id: 'a', label: 'Azure, with Azure Policy’s deny and audit effects', correct: true, explanation: 'Correct — on AWS the same goal combines organization policies or proactive controls with AWS Config.' },
        { id: 'b', label: 'AWS, with GuardDuty', correct: false, explanation: 'GuardDuty detects threats rather than evaluating configuration policy.' },
        { id: 'c', label: 'Neither platform can do either', correct: false, explanation: 'Both can, with different service boundaries.' },
      ],
    },
  ],
};

const controlLab: LabBody = {
  difficulty: 'beginner',
  estimatedTime: '15 minutes',
  description:
    'Make a risky configuration change — public storage, open SSH, or deleted audit logs — and choose which preventive, detective, corrective, and alerting controls exist. Compare how long each combination leaves the exposure open. Timings are illustrative; everything is simulated and no cloud account is involved.',
  learningObjectives: [
    'Compare the exposure window left by preventive, detective, and corrective controls',
    'Explain why detection must be routed to people or automation to be useful',
  ],
  prerequisites: [
    { type: 'concept', id: 'preventive-detective-corrective-controls', label: 'Preventive, Detective, and Corrective Controls', description: 'Control types and their trade-offs.' },
  ],
  content: {
    simulationId: controlResponseSimulation.id,
    instructions: [
      { id: 'dashboard', label: '1. Detection only', description: 'Run the default: a detective rule with no alerting. How long does the exposure last?' },
      { id: 'alert', label: '2. Route to people', description: 'Turn on alerting. Then turn on automatic remediation as well.' },
      { id: 'nothing', label: '3. Remove detection', description: 'Turn off the detective rule but leave remediation on. Why does remediation never run?' },
      { id: 'prevent', label: '4. Prevent', description: 'Turn on the preventive guardrail. What does the trade-off note say about legitimate exceptions?' },
      { id: 'others', label: '5. Other changes', description: 'Repeat with open SSH and deleted audit logs, reading each control’s provider examples.' },
    ],
    parameters: [],
    validationRules: [
      { id: 'prevented', label: 'A preventive guardrail stopped a change before any exposure', check: (state) => (state as ControlState).summary?.outcome === 'prevented' },
      { id: 'auto', label: 'Detection plus automatic remediation closed the exposure within minutes', check: (state) => (state as ControlState).summary?.outcome === 'auto-remediated' },
      { id: 'review', label: 'Saw an unrouted finding leave an exposure open for days', check: (state) => (state as ControlState).summary?.outcome === 'found-in-review' },
      { id: 'undetected', label: 'Saw that remediation without detection never runs', check: (state) => (state as ControlState).summary?.outcome === 'undetected' && (state as ControlState).config.corrective },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'preventive-detective-corrective-controls': controlsAndGovernance,
    'posture-and-misconfiguration': postureAndMisconfiguration,
    'audit-compliance-and-incident-response': auditComplianceAndResponse,
    'azure-security-governance': azureSecurityGovernance,
    'aws-security-governance': awsSecurityGovernance,
    'governance-comparison': governanceComparison,
  },
  labs: {
    'misconfiguration-response-lab': controlLab,
  },
  simulations: {
    'misconfiguration-response-lab': bindSimulation(controlResponseSimulation, renderControlState),
  },
};
