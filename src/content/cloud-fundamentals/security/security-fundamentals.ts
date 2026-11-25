import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { defenseInDepthScene } from './security-fundamentals.scenes';

const securityPrinciples: LessonBody = {
  learningObjectives: [
    'Use confidentiality, integrity, and availability to describe what a control protects',
    'Apply basic threat modelling to a cloud architecture',
    'Explain the zero trust principles and what zero trust is not',
  ],
  sections: [
    {
      heading: 'What are we protecting, and from what?',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Property', 'Means', 'Cloud example of a failure'],
          rows: [
            ['Confidentiality', 'Only authorized parties can read the data', 'A storage bucket made public; a leaked access key'],
            ['Integrity', 'Data and systems are changed only in authorized ways', 'An attacker alters a deployment pipeline or tampers with records'],
            ['Availability', 'Systems and data are usable when needed', 'A DDoS attack; ransomware deleting backups; an expired certificate'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Threat modelling asks four questions about a design: what are we building, what can go wrong, what are we going to do about it, and did we do a good enough job? For cloud systems the most productive starting points are usually the identities that can change things, the data stores, anything reachable from the internet, and the paths between them. Frameworks such as STRIDE (spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege) help make “what can go wrong” systematic.',
        },
      ],
    },
    {
      heading: 'Least privilege, again',
      blocks: [
        {
          type: 'paragraph',
          text: 'Least privilege — covered in depth in Authorization and Policies — is the principle with the widest reach: every identity, network path, and key permission should allow only what its job requires, for only as long as required. It turns many potential breaches into contained incidents.',
        },
      ],
    },
    {
      heading: 'Zero trust',
      blocks: [
        {
          type: 'paragraph',
          text: 'Zero trust replaces “trusted inside, untrusted outside” with explicit verification of every request, wherever it comes from. Microsoft summarises it as three principles, and NIST SP 800-207 describes the same model in more detail:',
        },
        {
          type: 'list',
          items: [
            'Verify explicitly: authenticate and authorize every request using all available signals — identity, device health, location, the resource being accessed.',
            'Use least-privilege access: just-in-time and just-enough access, scoped to the task.',
            'Assume breach: limit blast radius with segmentation, encrypt end to end, and invest in detection and response — design as if an attacker is already inside.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Zero trust is a strategy, not a product. A VPN replacement or a firewall marketed as “zero trust” helps only if requests are still individually authenticated and authorized behind it.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'secp-kc-1',
      type: 'single-choice',
      prompt: 'Ransomware encrypts a company’s databases and deletes its backups. Which property is primarily lost?',
      difficulty: 'beginner',
      learningObjective: 'Use confidentiality, integrity, and availability to describe what a control protects',
      options: [
        { id: 'a', label: 'Availability — the data can no longer be used', correct: true, explanation: 'Correct — and integrity too, since data was changed without authorization. Immutable backups are the classic control.' },
        { id: 'b', label: 'Confidentiality only', correct: false, explanation: 'Many ransomware groups also steal data, but the defining impact here is that the data is unusable.' },
        { id: 'c', label: 'None — the data still exists', correct: false, explanation: 'Data you cannot use is unavailable.' },
      ],
    },
    {
      id: 'secp-kc-2',
      type: 'scenario',
      prompt:
        'Two internal services on the same private network call each other without authentication, “because the network is trusted”. Which zero trust principle does this violate most directly?',
      difficulty: 'intermediate',
      learningObjective: 'Explain the zero trust principles and what zero trust is not',
      options: [
        { id: 'a', label: 'Verify explicitly — network location is being used in place of authentication and authorization', correct: true, explanation: 'Correct — and it also ignores “assume breach”: a compromised neighbour inherits that trust.' },
        { id: 'b', label: 'None — private networks are outside the scope of zero trust', correct: false, explanation: 'Zero trust exists precisely to remove implicit trust in network location.' },
        { id: 'c', label: 'Encryption at rest', correct: false, explanation: 'That is a data control, not a zero trust principle.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'NIST SP 800-207: Zero Trust Architecture', url: 'https://csrc.nist.gov/pubs/sp/800/207/final' },
    { label: 'Microsoft: What is Zero Trust?', url: 'https://learn.microsoft.com/en-us/security/zero-trust/zero-trust-overview' },
  ],
};

const sharedResponsibility: LessonBody = {
  learningObjectives: [
    'Explain how security responsibilities shift between provider and customer across IaaS, PaaS, and SaaS',
    'Identify the responsibilities that always remain with the customer',
  ],
  sections: [
    {
      heading: 'Security of the cloud, security in the cloud',
      blocks: [
        {
          type: 'paragraph',
          text: 'AWS phrases the split as security “of” the cloud (the provider: facilities, hardware, the virtualization layer, the services themselves) versus security “in” the cloud (the customer: what they build and configure). Microsoft describes the same model as responsibilities that are always the customer’s, always Microsoft’s, or vary by service type.',
        },
        {
          type: 'comparisonTable',
          headers: ['Responsibility', 'IaaS (VMs)', 'PaaS (managed databases, app platforms)', 'SaaS'],
          rows: [
            ['Physical datacenter, hosts, and network', 'Provider', 'Provider', 'Provider'],
            ['Operating system patching', 'Customer', 'Provider', 'Provider'],
            ['Network controls around the resource', 'Customer', 'Shared — the customer configures firewall rules, private endpoints, and public access', 'Mostly provider'],
            ['Application code and configuration', 'Customer', 'Customer', 'Provider (configuration settings remain the customer’s)'],
            ['Identities and access', 'Customer', 'Customer', 'Customer'],
            ['Data classification and protection', 'Customer', 'Customer', 'Customer'],
            ['Devices and accounts used to access the service', 'Customer', 'Customer', 'Customer'],
          ],
        },
      ],
    },
    {
      heading: 'What never moves',
      blocks: [
        {
          type: 'paragraph',
          text: 'Whatever the service model, the customer remains responsible for who has access, how data is classified and protected, and the configuration choices the service exposes. This is where most cloud security incidents originate: publicly exposed storage, leaked credentials, over-broad permissions, and unpatched internet-facing VMs — not failures of the provider’s infrastructure.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Provider compliance certifications cover the provider’s side of the model. They are necessary evidence, not proof that your workload is compliant — your configuration and processes are assessed separately.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'srm-kc-1',
      type: 'multi-select',
      prompt: 'A company moves from VMs running its own database to a managed database service. Which responsibilities remain with the company? Select all that apply.',
      difficulty: 'intermediate',
      learningObjective: 'Identify the responsibilities that always remain with the customer',
      options: [
        { id: 'a', label: 'Deciding who can connect and with which permissions', correct: true, explanation: 'Correct — identity and access always stay with the customer.' },
        { id: 'b', label: 'Whether the database accepts connections from the public internet', correct: true, explanation: 'Correct — network exposure is a configuration choice the customer makes.' },
        { id: 'c', label: 'Patching the database server’s operating system', correct: false, explanation: 'That moves to the provider with a managed service.' },
        { id: 'd', label: 'Classifying and protecting the data stored in it', correct: true, explanation: 'Correct — data is always the customer’s responsibility.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'AWS Shared Responsibility Model', url: 'https://aws.amazon.com/compliance/shared-responsibility-model/' },
    { label: 'Microsoft: Shared responsibility in the cloud', url: 'https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility' },
  ],
};

const defenseInDepth: LessonBody = {
  learningObjectives: [
    'Describe the layers of a defense-in-depth cloud architecture',
    'Trace an attack through layered controls and identify which layer stops each step',
    'Distinguish preventive, detective, and corrective controls',
  ],
  sections: [
    {
      heading: 'Layers that fail independently',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every control eventually fails: a rule is misconfigured, a zero-day bypasses a filter, a credential is phished. Defense in depth stacks independent controls so that one failure does not become a breach. The diagram follows one attack through the layers.',
        },
        {
          type: 'comparisonTable',
          headers: ['Layer', 'Example controls'],
          rows: [
            ['Identity', 'Phishing-resistant MFA, just-in-time admin access, workload identities instead of keys'],
            ['Perimeter', 'DDoS protection, web application firewall, a minimal set of public endpoints'],
            ['Network', 'Segmented subnets, security rules that allow only required paths, private endpoints for data services'],
            ['Compute', 'Patched, hardened images; no inbound management ports from the internet'],
            ['Application', 'Input validation, parameterized queries, application-level authorization, dependency updates'],
            ['Data', 'Encryption in transit and at rest, key access control, backups that attackers cannot delete'],
            ['Detection and response', 'Central audit logs, alerts on high-risk operations, rehearsed incident response'],
          ],
        },
      ],
    },
    {
      heading: 'Three kinds of control',
      blocks: [
        {
          type: 'list',
          items: [
            'Preventive controls stop something from happening: a deny policy, a security rule, MFA.',
            'Detective controls notice that something happened or is wrong: audit logs, configuration compliance checks, threat detection alerts.',
            'Corrective controls restore a good state: automatic remediation of a misconfiguration, restoring from backup, revoking a credential.',
          ],
        },
        {
          type: 'paragraph',
          text: 'A mature design uses all three. Prevention alone fails silently when it is bypassed; detection alone only tells you about damage after the fact. Security Monitoring and Compliance explores how these controls are implemented as cloud governance.',
        },
      ],
    },
    {
      heading: 'An attack chain, layer by layer',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'An access key is committed to a public repository. Prevention: workload identities instead of keys; secret scanning on push.',
            'An attacker uses the key to list storage. Prevention: least-privilege permissions on that identity. Detection: alerts on unusual API calls from unfamiliar locations.',
            'The attacker finds a backup bucket and tries to delete backups. Prevention: an explicit deny on deleting backups; immutable or soft-deleted backups. Detection: alerts on deletions.',
            'The team responds. Correction: revoke the key, review what it accessed using audit logs, restore anything changed.',
          ],
        },
      ],
    },
  ],
  visualization: defenseInDepthScene,
  knowledgeCheck: [
    {
      id: 'did-kc-1',
      type: 'scenario',
      prompt:
        'A web server is compromised through an unknown vulnerability. Which control most directly stops the attacker connecting to the database from that server?',
      difficulty: 'intermediate',
      learningObjective: 'Trace an attack through layered controls and identify which layer stops each step',
      options: [
        { id: 'a', label: 'A database rule allowing connections only from the app subnet, with no route or rule from the web tier', correct: true, explanation: 'Correct — segmentation limits lateral movement after a breach.' },
        { id: 'b', label: 'The WAF in front of the web tier', correct: false, explanation: 'The WAF inspects inbound internet traffic; it does not see the compromised server’s internal connections.' },
        { id: 'c', label: 'Encryption at rest on the database', correct: false, explanation: 'An authorized connection would read data decrypted; encryption at rest does not block connections.' },
      ],
    },
    {
      id: 'did-kc-2',
      type: 'multi-select',
      prompt: 'Which of these are detective controls? Select all that apply.',
      difficulty: 'beginner',
      learningObjective: 'Distinguish preventive, detective, and corrective controls',
      options: [
        { id: 'a', label: 'An alert when an audit log trail is disabled', correct: true, explanation: 'Correct — it notices that something happened.' },
        { id: 'b', label: 'A configuration rule reporting storage accounts that allow public access', correct: true, explanation: 'Correct — it reports, rather than prevents.' },
        { id: 'c', label: 'An organization policy denying deletion of audit logs', correct: false, explanation: 'That prevents the action — a preventive control.' },
        { id: 'd', label: 'Automatic removal of a public IP added to a database VM', correct: false, explanation: 'That restores a good state — a corrective control.' },
      ],
    },
  ],
};

const securityBuildingBlocks: LessonBody = {
  learningObjectives: ['Map the main Azure and AWS security services to the layer and control type they implement'],
  sections: [
    {
      heading: 'A map, not an equivalence table',
      blocks: [
        {
          type: 'paragraph',
          text: 'Both providers offer services for every layer. The pairs below solve the same problem; their scope, integration, and limits differ, and the other concepts in this category explain those differences.',
        },
        {
          type: 'comparisonTable',
          headers: ['Layer / control', 'Azure', 'AWS', 'Covered in'],
          rows: [
            ['Workforce identity', 'Microsoft Entra ID, Conditional Access', 'IAM Identity Center, IAM', 'Identity and Authentication'],
            ['Authorization', 'Azure RBAC', 'AWS IAM policies, SCPs', 'Authorization and Policies'],
            ['Workload identity', 'Managed identities', 'IAM roles for workloads', 'Workload and Federated Identity'],
            ['Keys and secrets', 'Key Vault, Managed HSM', 'KMS, CloudHSM, Secrets Manager', 'Encryption and Key Management'],
            ['Network firewall', 'Azure Firewall', 'AWS Network Firewall', 'Network Security'],
            ['Web application firewall', 'Azure Web Application Firewall', 'AWS WAF', 'Network Security'],
            ['DDoS protection', 'Azure DDoS Protection', 'AWS Shield', 'Network Security'],
            ['Configuration governance', 'Azure Policy', 'AWS Config, Organizations policies', 'Security Monitoring and Compliance'],
            ['Posture and threat protection', 'Microsoft Defender for Cloud', 'AWS Security Hub, Amazon GuardDuty', 'Security Monitoring and Compliance'],
            ['Audit logs', 'Azure Activity Log, resource logs', 'AWS CloudTrail', 'Security Monitoring and Compliance'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Both providers publish security guidance as part of their Well-Architected Frameworks (the security pillar), and benchmarks such as the Microsoft cloud security benchmark and the AWS Foundational Security Best Practices standard turn those principles into checkable controls.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'sbb-kc-1',
      type: 'single-choice',
      prompt: 'Which pairing describes services that solve the same problem at the same layer?',
      difficulty: 'beginner',
      learningObjective: 'Map the main Azure and AWS security services to the layer and control type they implement',
      options: [
        { id: 'a', label: 'Azure Web Application Firewall and AWS WAF', correct: true, explanation: 'Correct — both filter HTTP(S) requests at layer 7, with different attachment points and rule formats.' },
        { id: 'b', label: 'Azure Policy and AWS WAF', correct: false, explanation: 'Azure Policy governs resource configuration; AWS WAF filters web requests.' },
        { id: 'c', label: 'Microsoft Entra ID and AWS Shield', correct: false, explanation: 'One is an identity provider, the other DDoS protection.' },
      ],
    },
  ],
};

const defenseChallenge: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '25 minutes',
  description:
    'Review a cloud application with several deliberate security weaknesses and choose the controls you would apply across identity, secrets, network, perimeter, data, and auditability. Every option has authored feedback; only a few exact combinations have an authored overall verdict, and the lab says clearly when yours does not. Nothing is deployed — this is a design exercise.',
  learningObjectives: [
    'Identify weaknesses across several layers of one architecture',
    'Choose controls that address each weakness, and recognise ones that only appear to',
  ],
  prerequisites: [
    { type: 'concept', id: 'defense-in-depth', label: 'Defense in Depth', description: 'Layers and control types.' },
  ],
  content: {
    scenario:
      'A ticket-booking company runs its site on two web VMs with public IP addresses. SSH is open to the internet so engineers can fix problems quickly. The web VMs call an app tier, which uses a managed SQL database that has public network access enabled and a strong admin password.\n\nThe app reads a storage account key from a configuration file. That file was committed to the company’s Git repository a year ago. Five engineers share one administrator account with Owner on the subscription; it has no MFA. Audit logs are not exported anywhere. A penetration test recently found — and the team fixed — a SQL injection bug in the search page.',
    requirements: [
      'No single compromised credential or server should expose all customer data',
      'Engineers can still administer production when needed',
      'Misuse can be detected and investigated afterwards',
    ],
    constraints: [
      'A small team with no dedicated security operations center',
      'The booking site must remain reachable from the internet',
      'Changes must not require rewriting the application',
    ],
    decisions: [
      {
        id: 'identity',
        question: 'Identity and administrator access',
        type: 'multi-choice',
        options: [
          { id: 'id-mfa', label: 'Phishing-resistant MFA for administrators', description: 'Require FIDO2 keys or passkeys for every admin sign-in.', feedback: { rating: 'effective', text: 'Admin credentials are the highest-value phishing target; phishing-resistant MFA defeats relayed codes and MFA-fatigue attacks.' } },
          { id: 'id-jit', label: 'Personal accounts with just-in-time Owner access', description: 'Each engineer signs in as themselves and activates elevated roles only when needed.', feedback: { rating: 'effective', text: 'Restores accountability (the audit log names a person) and removes standing Owner access that one phished session could abuse.' } },
          { id: 'id-shared', label: 'Keep the shared account but change its password', description: 'Rotate the shared password every month.', feedback: { rating: 'ineffective', text: 'A shared account still cannot be attributed in logs or revoked for one person, and without MFA a new password is just as phishable.' } },
          { id: 'id-owner-devs', label: 'Give every developer Owner so nobody is blocked', description: 'Avoid friction during incidents.', feedback: { rating: 'ineffective', text: 'This multiplies the number of credentials that can do anything — the opposite of least privilege.' } },
        ],
      },
      {
        id: 'secrets',
        question: 'The storage account key',
        type: 'multi-choice',
        options: [
          { id: 'sec-identity', label: 'Replace the key with the app’s managed identity', description: 'Grant the identity a data role on the one container the app uses.', feedback: { rating: 'effective', text: 'Removes the long-lived secret entirely; access is now scoped, temporary, and attributable.' } },
          { id: 'sec-rotate', label: 'Rotate the exposed key now, then disable shared key access', description: 'Invalidate the committed key, and turn off key-based access once the migration is complete.', feedback: { rating: 'effective', text: 'The key has been in Git history for a year, so it must be treated as compromised. Disabling shared key access afterwards closes the bypass around role-based access.' } },
          { id: 'sec-private-repo', label: 'Make the repository private', description: 'Stop new people from seeing the file.', feedback: { rating: 'partial', text: 'Reduces future exposure, but every existing clone and copy still holds a working key. On its own it fixes nothing — the key must be rotated.' } },
          { id: 'sec-encode', label: 'Base64-encode the key in the configuration', description: 'So it is not stored in plain text.', feedback: { rating: 'ineffective', text: 'Base64 is an encoding, not encryption; anyone can decode it instantly.' } },
        ],
      },
      {
        id: 'network',
        question: 'Network boundaries',
        type: 'multi-choice',
        options: [
          { id: 'net-private-db', label: 'Private endpoint for the database, public access disabled', description: 'Only the app subnet can reach it.', feedback: { rating: 'effective', text: 'Removes the database from the internet and limits which tier can reach it — the segmentation that contains a compromised web server.' } },
          { id: 'net-bastion', label: 'Close SSH from the internet; use a bastion or just-in-time access', description: 'Administer through a managed bastion service or time-limited rules.', feedback: { rating: 'effective', text: 'Internet-exposed management ports are among the most scanned and attacked; this removes the exposure without blocking administration.' } },
          { id: 'net-db-password', label: 'Keep the database public, with a longer password', description: 'Increase the admin password length.', feedback: { rating: 'ineffective', text: 'The database stays exposed to every attacker on the internet, and a password is still a single factor.' } },
          { id: 'net-flat', label: 'Put all tiers in one subnet to simplify rules', description: 'Fewer rules to maintain.', feedback: { rating: 'ineffective', text: 'A flat network gives a compromised web server direct paths to everything else.' } },
        ],
      },
      {
        id: 'perimeter',
        question: 'Perimeter protection',
        type: 'multi-choice',
        options: [
          { id: 'per-waf', label: 'A WAF in front of the web tier', description: 'Start in detection mode to tune false positives, then switch to prevention.', feedback: { rating: 'effective', text: 'Blocks common web attacks and gives virtual patching while bugs are fixed. Tuning first avoids blocking real customers.' } },
          { id: 'per-ddos', label: 'Enhanced DDoS protection on public endpoints', description: 'A paid tier tuned to the application’s traffic.', feedback: { rating: 'partial', text: 'Both clouds already include baseline DDoS protection. The enhanced tiers add tuning, telemetry, and response support — worthwhile for business-critical public endpoints, but a cost decision rather than a fix for any weakness listed here.' } },
          { id: 'per-waf-authz', label: 'Use WAF rules to keep users out of admin pages', description: 'Block /admin for everyone except office IP addresses.', feedback: { rating: 'ineffective', text: 'A WAF does not know who a user is. Admin pages need authentication and authorization in the application; IP rules are at best an extra layer.' } },
        ],
      },
      {
        id: 'data',
        question: 'Data protection',
        type: 'multi-choice',
        options: [
          { id: 'data-tls', label: 'Enforce TLS for every connection', description: 'Including app to database and app to storage.', feedback: { rating: 'effective', text: 'Protects credentials and data on every network path, including internal ones — consistent with assuming breach.' } },
          { id: 'data-cmk', label: 'Switch storage encryption to customer-managed keys', description: 'Use a key the company controls in a key vault.', feedback: { rating: 'partial', text: 'Useful when the company must control or revoke keys, and it adds key-usage audit. It does not fix the exposed account key or public access: authorized reads are still decrypted transparently.' } },
          { id: 'data-at-rest-enough', label: 'Rely on encryption at rest to protect the public database', description: 'The data is encrypted on disk already.', feedback: { rating: 'ineffective', text: 'Encryption at rest is transparent to anyone who can connect and authenticate; it does not reduce exposure of a public database.' } },
        ],
      },
      {
        id: 'audit',
        question: 'Auditability',
        type: 'multi-choice',
        options: [
          { id: 'aud-central', label: 'Central audit logs with alerts', description: 'Export control-plane, sign-in, and data-access logs to a central workspace with retention and alerts on high-risk operations.', feedback: { rating: 'effective', text: 'Makes misuse detectable and investigable, and keeps evidence out of reach of an attacker on a compromised VM.' } },
          { id: 'aud-review', label: 'Regular access reviews of privileged roles', description: 'A quarterly review of who can activate Owner and similar roles.', feedback: { rating: 'effective', text: 'Catches access that is no longer needed before it becomes an attacker’s path.' } },
          { id: 'aud-local', label: 'Keep logs on each VM’s local disk', description: 'No extra service needed.', feedback: { rating: 'ineffective', text: 'Logs disappear with the VM, are hard to search across machines, and can be wiped by whoever compromises the VM.' } },
        ],
      },
    ],
    solutions: [
      {
        id: 'layered',
        decisionValues: {
          identity: ['id-mfa', 'id-jit'],
          secrets: ['sec-identity', 'sec-rotate'],
          network: ['net-private-db', 'net-bastion'],
          perimeter: ['per-waf'],
          data: ['data-tls'],
          audit: ['aud-central', 'aud-review'],
        },
        assessment: 'optimal',
        explanation:
          'Every weakness is addressed at its own layer: accountable, phishing-resistant admin access; no long-lived storage key, and the exposed one invalidated; the database and management ports off the internet; a tuned WAF; encryption on every path; and central evidence with alerts. A compromised web server or a phished engineer no longer exposes all customer data.',
        tradeoffs: 'Just-in-time activation and a bastion add a little friction to emergency work, and the WAF needs ongoing tuning. Enhanced DDoS protection and customer-managed keys remain options if criticality or regulation demands them.',
      },
      {
        id: 'layered-plus',
        decisionValues: {
          identity: ['id-mfa', 'id-jit'],
          secrets: ['sec-identity', 'sec-rotate'],
          network: ['net-private-db', 'net-bastion'],
          perimeter: ['per-waf', 'per-ddos'],
          data: ['data-tls', 'data-cmk'],
          audit: ['aud-central', 'aud-review'],
        },
        assessment: 'acceptable',
        explanation:
          'The same layered design, plus enhanced DDoS protection and customer-managed keys. Both are legitimate choices, but neither addresses a weakness in this scenario, and both add cost and operational responsibility for a small team.',
        tradeoffs: 'Customer-managed keys make the team responsible for key availability: a deleted or inaccessible key makes the storage unreadable.',
      },
      {
        id: 'cosmetic',
        decisionValues: {
          identity: ['id-shared'],
          secrets: ['sec-encode'],
          network: ['net-db-password'],
          perimeter: ['per-waf-authz'],
          data: ['data-at-rest-enough'],
          audit: ['aud-local'],
        },
        assessment: 'problematic',
        explanation:
          'Each choice looks like a security measure but leaves the underlying weakness in place: the shared account, the exposed key, the public database, missing authorization, and evidence an attacker can erase.',
        tradeoffs: 'Low effort, but the original attack paths all remain open.',
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'security-principles': securityPrinciples,
    'shared-responsibility-for-security': sharedResponsibility,
    'defense-in-depth': defenseInDepth,
    'security-building-blocks-comparison': securityBuildingBlocks,
  },
  labs: {
    'defense-in-depth-challenge': defenseChallenge,
  },
  simulations: {},
};
