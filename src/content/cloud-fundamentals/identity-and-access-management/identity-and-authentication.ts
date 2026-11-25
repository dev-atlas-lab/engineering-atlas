import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { accessLifecycleScene, oidcSsoScene } from './identity-and-authentication.scenes';

const iamFundamentals: LessonBody = {
  learningObjectives: [
    'Trace an access request through identification, authentication, authorization, and audit',
    'Distinguish authentication from authorization',
    'Distinguish human identities from workload identities and explain why each needs different controls',
  ],
  analogy:
    'An office building checks your badge photo at the door (authentication), but the badge only opens the floors you were granted (authorization). The door logs every swipe, including the ones that were refused (audit).',
  sections: [
    {
      heading: 'The problem identity and access management solves',
      blocks: [
        {
          type: 'paragraph',
          text: 'A cloud account exposes thousands of operations through APIs reachable from anywhere on the internet: create a VM, read a database, delete a backup, change a firewall rule. Every one of those calls has to answer the same questions before it runs — who is calling, can we trust that claim, and are they allowed to do this to that resource? Identity and access management (IAM) is the system that answers them consistently for every request, and records the answer.',
        },
        {
          type: 'paragraph',
          text: 'In a datacenter, a large part of security came from physical and network position: being inside the building or on the corporate network implied some trust. In the cloud, the management plane is a public API. Identity is therefore the primary security boundary — a stolen credential with broad permissions is equivalent to a stolen master key, no matter how the network is configured.',
        },
      ],
    },
    {
      heading: 'Principals: who or what can make a request',
      blocks: [
        {
          type: 'paragraph',
          text: 'A principal is any identity that can be authenticated and then granted permissions. Two families of principal behave very differently, and mixing their controls is a common source of incidents.',
        },
        {
          type: 'comparisonTable',
          headers: ['', 'Human identities', 'Workload identities'],
          rows: [
            ['Examples', 'Engineers, operators, support staff, external partners', 'Applications, VMs, functions, containers, CI/CD pipelines, scripts'],
            ['How they authenticate', 'Interactively: password or passkey, plus MFA, often through single sign-on', 'Non-interactively: a platform-issued token, a federated token, a certificate, or (worst case) a stored secret'],
            ['Typical risks', 'Phishing, password reuse, over-broad standing access, accounts left behind when people leave', 'Long-lived keys copied into code or images, permissions far wider than the workload needs'],
            ['Key controls', 'MFA, conditional access, time-limited elevation, access reviews, offboarding', 'Platform-managed credentials, short lifetimes, least privilege, no secrets in code'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Principals are usually grouped so permissions can be managed in bulk: users into groups, workloads behind roles or managed identities. Permissions should be attached to those groupings rather than to individuals wherever possible, so that access follows a person’s job, not their history.',
        },
      ],
    },
    {
      heading: 'Authentication is not authorization',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'Authentication (AuthN)', 'Authorization (AuthZ)'],
          rows: [
            ['Question', 'Who are you, and can you prove it?', 'What may you do, to which resource?'],
            ['Inputs', 'Credentials: password, MFA, certificate, federated token', 'The authenticated identity, the requested action, the target resource, and the policies or role assignments that apply'],
            ['Output', 'A verified identity — typically a signed token', 'Allow or deny for one specific request'],
            ['Typical failure', '401 Unauthorized — identity not established', '403 Forbidden — identity known, permission missing'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A successful sign-in grants nothing on its own. Treating “authenticated” as “trusted” — for example, letting any signed-in user call an admin API — is one of the most common authorization bugs in applications and cloud configurations alike.',
        },
      ],
    },
    {
      heading: 'The access decision lifecycle',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every request to a cloud API passes through the same sequence of questions. The diagram above walks through one request that is authenticated successfully and then denied.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Who or what is requesting access? A human, or a workload acting on its own behalf.',
            'How is the identity established? The identity provider verifies credentials and issues a signed, expiring token.',
            'What resource is being accessed? Identified precisely — for example by an Azure resource ID or an AWS ARN — including where it sits in the resource hierarchy.',
            'Which permissions apply? Role assignments or policies attached to the identity, to its groups, to the resource, and to the containers above it.',
            'How is the decision evaluated? By fixed rules: deny by default, explicit denies win, and every applicable guardrail must allow the action.',
            'Why is access granted or denied? The decision can always be traced to a specific assignment or statement — or to the absence of one.',
            'How is access audited and reviewed? Each decision is logged, and standing permissions are periodically reviewed and removed when no longer needed.',
          ],
        },
      ],
    },
    {
      heading: 'Ownership and access boundaries',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every resource lives inside an administrative boundary — an Azure subscription inside a Microsoft Entra tenant, or an AWS account inside an organization. The boundary decides which identity system is trusted, who can administer it, and where audit logs are written. Access across boundaries never happens by accident: it requires an explicit trust, such as a role that another account is allowed to assume or a guest identity invited into a tenant.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Separate boundaries for production and non-production are an IAM control, not just an organizational nicety: a credential leaked from a test environment then cannot touch production at all.',
        },
      ],
    },
    {
      heading: 'Common failures',
      blocks: [
        {
          type: 'list',
          items: [
            'Shared accounts: several people use one login, so the audit log cannot say who did what and the credential cannot be revoked for one person.',
            'Orphaned identities: accounts and keys that outlive the person or project that needed them.',
            'Standing administrator access: permanent, broad rights used for everyday work, so one phished session can do anything.',
            'Long-lived workload secrets: keys pasted into configuration or source code, which end up in repositories, images, and logs.',
            'No audit trail, or one nobody reads: misuse goes unnoticed until its effects are.',
          ],
        },
      ],
    },
  ],
  visualization: accessLifecycleScene,
  knowledgeCheck: [
    {
      id: 'iamf-kc-1',
      type: 'scenario',
      prompt:
        'A developer signs in successfully with MFA, then receives “403 Forbidden” when deleting a storage account. Which statement best explains this?',
      difficulty: 'beginner',
      learningObjective: 'Distinguish authentication from authorization',
      options: [
        { id: 'a', label: 'Authentication succeeded; no permission that applies to this resource allows the delete action', correct: true, explanation: 'Correct — 403 means the identity is known but not authorized. A failed authentication would be a 401.' },
        { id: 'b', label: 'The MFA step failed silently', correct: false, explanation: 'If authentication had failed, there would be no valid token and the error would be 401, not 403.' },
        { id: 'c', label: 'The storage account does not exist', correct: false, explanation: 'Services typically return a not-found error for a missing resource. The error here is about permission.' },
      ],
    },
    {
      id: 'iamf-kc-2',
      type: 'multi-select',
      prompt: 'Which of these are workload identities? Select all that apply.',
      difficulty: 'beginner',
      learningObjective: 'Distinguish human identities from workload identities and explain why each needs different controls',
      options: [
        { id: 'a', label: 'A CI/CD pipeline that deploys infrastructure', correct: true, explanation: 'Correct — it acts without a person signing in interactively.' },
        { id: 'b', label: 'A function that reads messages from a queue', correct: true, explanation: 'Correct — software calling cloud APIs on its own behalf.' },
        { id: 'c', label: 'An on-call engineer using the portal', correct: false, explanation: 'This is a human identity signing in interactively.' },
        { id: 'd', label: 'A VM that writes backups to object storage', correct: true, explanation: 'Correct — the VM needs its own identity to authenticate to the storage service.' },
      ],
    },
    {
      id: 'iamf-kc-3',
      type: 'single-choice',
      prompt: 'Why is identity often called the primary security boundary in the cloud?',
      difficulty: 'intermediate',
      learningObjective: 'Trace an access request through identification, authentication, authorization, and audit',
      options: [
        { id: 'a', label: 'Because the cloud management plane is an internet-reachable API, so network position cannot protect it — every call is decided by identity and permissions', correct: true, explanation: 'Correct — a valid credential with broad permissions works from anywhere.' },
        { id: 'b', label: 'Because cloud providers do not support network firewalls', correct: false, explanation: 'They do; network controls still matter for data-plane traffic. They just do not protect the management API.' },
        { id: 'c', label: 'Because encryption replaces the need for networks', correct: false, explanation: 'Encryption and network controls are separate layers; neither replaces identity.' },
      ],
    },
  ],
};

const howAuthenticationWorks: LessonBody = {
  learningObjectives: [
    'Explain why passwords alone are insufficient and which MFA methods resist phishing',
    'Describe what a token is, what its claims mean, and why tokens expire',
    'Recognize common authentication attacks and the controls that counter them',
  ],
  sections: [
    {
      heading: 'Factors and why passwords are not enough',
      blocks: [
        {
          type: 'paragraph',
          text: 'Authentication factors fall into three groups: something you know (a password or PIN), something you have (a phone, a hardware security key, a device with a stored key), and something you are (a fingerprint or face, usually used to unlock a local key rather than sent anywhere). Multi-factor authentication (MFA) requires factors from at least two groups.',
        },
        {
          type: 'paragraph',
          text: 'Passwords on their own fail in predictable ways: they are reused across sites, so a breach elsewhere leaks them (credential stuffing); they can be guessed at scale across many accounts (password spraying); and users can be tricked into typing them into a fake sign-in page (phishing). MFA defeats most of these because a stolen password is no longer sufficient.',
        },
        {
          type: 'comparisonTable',
          headers: ['MFA method', 'Resists phishing?', 'Notes'],
          rows: [
            ['SMS or voice one-time code', 'No', 'Can be relayed by a fake site; vulnerable to SIM swapping. Better than nothing.'],
            ['Authenticator app code or push approval', 'No', 'Codes can be relayed; push prompts can be spammed until a tired user approves (“MFA fatigue”). Number matching reduces this.'],
            ['FIDO2 security key or passkey', 'Yes', 'The key signs a challenge bound to the real site’s origin, so a look-alike domain gets nothing usable.'],
            ['Certificate-based authentication (smart card, device certificate)', 'Yes', 'The private key never leaves the card or device.'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Administrators and other privileged users are the highest-value phishing targets. Requiring phishing-resistant methods for them first gives the largest risk reduction per user.',
        },
      ],
    },
    {
      heading: 'Tokens: the result of authentication',
      blocks: [
        {
          type: 'paragraph',
          text: 'Cloud APIs do not check your password on every call. After authentication, the identity provider issues a signed token, and the client presents that token with each request. Two token types appear constantly in cloud identity systems:',
        },
        {
          type: 'list',
          items: [
            'ID token (OpenID Connect): tells an application who signed in. Its audience is the application itself. It is for the app to read, not to send to APIs.',
            'Access token (OAuth 2.0): presented to an API to call it on someone’s behalf. Its audience is that API. The API validates it and then performs its own authorization.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Many identity providers issue tokens as JSON Web Tokens (JWTs): three base64url-encoded parts — header, payload, signature — separated by dots. The payload carries claims; the signature lets the receiver verify the token came from the expected issuer and was not modified.',
        },
        {
          type: 'code',
          language: 'json',
          code: '{\n  "iss": "https://login.example.com/tenant-1234",   // issuer: who signed it\n  "sub": "8f3c…",                                     // subject: the identity\n  "aud": "api://orders-api",                          // audience: who it is for\n  "iat": 1767225600,                                  // issued at (Unix time)\n  "exp": 1767229200,                                  // expires: one hour later\n  "roles": ["Orders.Read"]                            // app-specific claims\n}',
          caption: 'An illustrative access token payload. Receivers must check the signature, issuer, audience, and expiry before trusting any claim.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Most access tokens are bearer tokens: whoever holds one can use it until it expires. That is why they are short-lived, why they must only travel over TLS, and why logging full tokens is a real leak.',
        },
      ],
    },
    {
      heading: 'Sessions, refresh, and revocation',
      blocks: [
        {
          type: 'paragraph',
          text: 'Short-lived access tokens limit how long a stolen token is useful, but users should not re-enter credentials every hour. Clients therefore also hold a longer-lived refresh token (or rely on the identity provider’s own session) to obtain new access tokens silently. Revocation acts on that renewal: disabling an account, resetting its credentials, or revoking its sessions stops new tokens from being issued — while access tokens already issued generally remain valid until they expire, unless the service supports continuous access evaluation.',
        },
        {
          type: 'paragraph',
          text: 'Token lifetime is therefore a trade-off: shorter lifetimes reduce the window for misuse after compromise or offboarding, at the cost of more token requests.',
        },
      ],
    },
    {
      heading: 'Attack patterns and their defenses',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Attack', 'What happens', 'Primary defenses'],
          rows: [
            ['Credential stuffing', 'Passwords leaked elsewhere are tried against your sign-in page', 'MFA; blocking known-breached passwords; sign-in risk detection'],
            ['Password spraying', 'A few common passwords are tried across many accounts to avoid lockouts', 'MFA; banned-password lists; monitoring for distributed failures'],
            ['Phishing', 'A fake sign-in page captures the password and relays the MFA code', 'Phishing-resistant MFA bound to the real domain'],
            ['MFA fatigue', 'Repeated push prompts until the user approves one', 'Number matching; phishing-resistant methods; alerts on repeated prompts'],
            ['Token theft', 'A token or session cookie is stolen from a device or log and replayed', 'Short lifetimes; device-bound sessions where supported; never logging tokens; revoking sessions after compromise'],
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'authn-kc-1',
      type: 'single-choice',
      prompt: 'Why does a FIDO2 security key resist phishing when an authenticator-app code does not?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why passwords alone are insufficient and which MFA methods resist phishing',
      options: [
        { id: 'a', label: 'The key signs a challenge bound to the real site’s origin, so a response captured by a look-alike site cannot be used on the real one', correct: true, explanation: 'Correct — origin binding is what makes it phishing-resistant. A six-digit code is valid wherever it is typed.' },
        { id: 'b', label: 'Hardware keys use longer passwords', correct: false, explanation: 'FIDO2 uses public-key cryptography, not a longer shared secret.' },
        { id: 'c', label: 'The key encrypts the network connection', correct: false, explanation: 'TLS encrypts the connection either way; that does not stop the user typing a code into the wrong site.' },
      ],
    },
    {
      id: 'authn-kc-2',
      type: 'scenario',
      prompt:
        'An engineer leaves the company and their account is disabled at 10:00. A copy of an access token issued to them at 09:50, valid for 60 minutes, was saved in a script. What is the most accurate statement?',
      difficulty: 'advanced',
      learningObjective: 'Describe what a token is, what its claims mean, and why tokens expire',
      options: [
        { id: 'a', label: 'Without continuous access evaluation, the token may still be accepted until it expires around 10:50; disabling the account stops new tokens', correct: true, explanation: 'Correct — this is why token lifetimes are kept short and why sessions are revoked as part of offboarding.' },
        { id: 'b', label: 'The token stops working at 10:00 automatically, everywhere', correct: false, explanation: 'Bearer tokens are validated locally by each service using the signature and expiry; most services do not check account status on every call.' },
        { id: 'c', label: 'The token works forever because it was issued before the account was disabled', correct: false, explanation: 'The exp claim limits it to its lifetime.' },
      ],
    },
    {
      id: 'authn-kc-3',
      type: 'single-choice',
      prompt: 'An API receives an access token whose audience (aud) is a different application. What should it do?',
      difficulty: 'intermediate',
      learningObjective: 'Describe what a token is, what its claims mean, and why tokens expire',
      options: [
        { id: 'a', label: 'Reject it — a token issued for another audience must not be accepted, even with a valid signature', correct: true, explanation: 'Correct — skipping the audience check lets a token for one app be replayed against another.' },
        { id: 'b', label: 'Accept it if the signature is valid', correct: false, explanation: 'Signature validity proves who issued it, not who it was issued for.' },
        { id: 'c', label: 'Accept it if it has not expired', correct: false, explanation: 'Expiry is one check of several; the audience must also match.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'OpenID Connect Core 1.0', url: 'https://openid.net/specs/openid-connect-core-1_0.html' },
    { label: 'RFC 7519: JSON Web Token (JWT)', url: 'https://www.rfc-editor.org/rfc/rfc7519' },
  ],
};

const identityProvidersAndSso: LessonBody = {
  learningObjectives: [
    'Explain what an identity provider does and why centralizing identity improves security',
    'Describe federation and single sign-on with OpenID Connect and SAML',
    'Explain identity lifecycle management and why emergency-access accounts are handled differently',
  ],
  sections: [
    {
      heading: 'What an identity provider does',
      blocks: [
        {
          type: 'paragraph',
          text: 'An identity provider (IdP) holds a directory of identities, authenticates them, and issues tokens or assertions that other systems trust. Applications and cloud platforms that rely on it — relying parties or service providers — never handle passwords themselves; they validate what the identity provider signs.',
        },
        {
          type: 'paragraph',
          text: 'Centralizing on one identity provider is a security control in itself: MFA and sign-in policies are enforced in one place, a leaver is disabled once instead of in every system, and every sign-in lands in one log.',
        },
      ],
    },
    {
      heading: 'Federation and single sign-on',
      blocks: [
        {
          type: 'paragraph',
          text: 'Federation is a configured trust between an identity provider and a service: the service accepts identities asserted by the identity provider, verified by signature. Single sign-on (SSO) is the user-visible result — one sign-in to the identity provider gives access to many federated applications without signing in to each one.',
        },
        {
          type: 'comparisonTable',
          headers: ['Protocol', 'Format', 'Typical use'],
          rows: [
            ['OpenID Connect (OIDC)', 'JSON Web Tokens over OAuth 2.0 flows', 'Modern web and mobile apps, APIs, and workload federation'],
            ['SAML 2.0', 'Signed XML assertions', 'Enterprise SSO to established SaaS and cloud consoles'],
            ['SCIM', 'REST API for users and groups', 'Not sign-in: automatically provisioning and deprovisioning accounts in the target system'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The diagram walks through the OpenID Connect authorization code flow. Note the two channels: the browser carries only redirects and a one-time code, while tokens are obtained by the application directly from the identity provider.',
        },
      ],
    },
    {
      heading: 'Identity lifecycle: joiners, movers, and leavers',
      blocks: [
        {
          type: 'list',
          items: [
            'Joiners: accounts are created from an authoritative source (often the HR system) and placed in groups that match their role.',
            'Movers: when someone changes team, access from the old role is removed — not just new access added. Accumulated access (“privilege creep”) is a common audit finding.',
            'Leavers: the account is disabled, sessions revoked, and any credentials the person created — access keys, tokens, app secrets — are found and rotated.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Provisioning with SCIM matters as much as SSO. Federation stops a disabled user from signing in, but accounts that were provisioned separately in the target system may still exist and still hold their own credentials.',
        },
      ],
    },
    {
      heading: 'Emergency access and local accounts',
      blocks: [
        {
          type: 'paragraph',
          text: 'If the identity provider is unavailable or misconfigured, administrators can be locked out of everything that depends on it. Organizations therefore keep a small number of emergency-access (“break-glass”) accounts that do not depend on the normal sign-in path. Because they bypass everyday controls, they are protected with phishing-resistant credentials stored securely, excluded from automation, monitored so that any use raises an alert, and tested periodically.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Any account that bypasses the identity provider — a cloud root user, a local admin, a forgotten service account with a password — also bypasses its MFA policies and centralized logging. Inventory these accounts deliberately.',
        },
      ],
    },
  ],
  visualization: oidcSsoScene,
  knowledgeCheck: [
    {
      id: 'sso-kc-1',
      type: 'single-choice',
      prompt: 'In the OpenID Connect authorization code flow, why does the application exchange the code for tokens directly with the identity provider?',
      difficulty: 'intermediate',
      learningObjective: 'Describe federation and single sign-on with OpenID Connect and SAML',
      options: [
        { id: 'a', label: 'So that tokens never pass through the browser’s URL, and only the registered application (which authenticates itself) can redeem the code', correct: true, explanation: 'Correct — the browser only ever carries a single-use code that is useless without the app’s own authentication.' },
        { id: 'b', label: 'Because browsers cannot store cookies', correct: false, explanation: 'Browsers store cookies fine; the point is keeping tokens off the front channel.' },
        { id: 'c', label: 'To check the user’s password a second time', correct: false, explanation: 'The application never sees the password at all.' },
      ],
    },
    {
      id: 'sso-kc-2',
      type: 'scenario',
      prompt:
        'A user is disabled in the identity provider. A SaaS tool used SSO, but accounts there were also created manually with local passwords. What is the remaining risk?',
      difficulty: 'intermediate',
      learningObjective: 'Explain identity lifecycle management and why emergency-access accounts are handled differently',
      options: [
        { id: 'a', label: 'The local account may still sign in with its password, bypassing the identity provider entirely', correct: true, explanation: 'Correct — federation only controls sign-ins that go through the identity provider. Automated deprovisioning (for example with SCIM) and disabling local sign-in close this gap.' },
        { id: 'b', label: 'None — disabling the user in the identity provider disables every account they have', correct: false, explanation: 'Only sign-ins that rely on the identity provider are affected.' },
        { id: 'c', label: 'The identity provider will delete the SaaS account automatically', correct: false, explanation: 'Only if provisioning is configured; SSO alone does not do this.' },
      ],
    },
  ],
};

const microsoftEntraId: LessonBody = {
  learningObjectives: [
    'Describe how a Microsoft Entra tenant relates to Azure subscriptions',
    'Distinguish Microsoft Entra roles from Azure roles',
    'Explain where MFA, Conditional Access, and Privileged Identity Management apply',
  ],
  sections: [
    {
      heading: 'Tenants and subscriptions',
      blocks: [
        {
          type: 'paragraph',
          text: 'Microsoft Entra ID (formerly Azure Active Directory) is Microsoft’s cloud identity provider. A tenant is one instance of it: a directory of users, groups, and application identities belonging to one organization. Each Azure subscription trusts exactly one tenant for authentication, while a tenant can be trusted by many subscriptions. The same tenant also authenticates users to Microsoft 365 and to thousands of federated SaaS applications.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Identity and resources are separate in Azure: the tenant holds identities, subscriptions hold resources. Authorization to Azure resources is then granted with Azure RBAC role assignments, covered in the next concept.',
        },
      ],
    },
    {
      heading: 'Users, groups, and application identities',
      blocks: [
        {
          type: 'list',
          items: [
            'Users: members of the organization, or guests invited from other tenants and email domains (B2B collaboration).',
            'Groups: security groups that can be targets of role assignments, Conditional Access policies, and app access.',
            'App registrations and service principals: an app registration is the global definition of an application; a service principal is its local identity in a tenant, which is what actually receives permissions. Managed identities are a special kind of service principal whose credentials Azure manages.',
          ],
        },
      ],
    },
    {
      heading: 'Two kinds of roles',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'Microsoft Entra roles', 'Azure roles (Azure RBAC)'],
          rows: [
            ['Control', 'The directory itself: users, groups, app registrations, tenant settings', 'Azure resources: VMs, storage, networks, Key Vaults'],
            ['Examples', 'Global Administrator, User Administrator, Application Administrator', 'Owner, Contributor, Reader, Key Vault Secrets User'],
            ['Scope', 'The tenant, or an administrative unit within it', 'Management group, subscription, resource group, or resource'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A Global Administrator does not automatically have access to Azure resources — but can elevate themselves to User Access Administrator at the root of all subscriptions. Highly privileged directory roles are therefore effectively privileged over Azure as well, and need the strongest protection.',
        },
      ],
    },
    {
      heading: 'Sign-in protection',
      blocks: [
        {
          type: 'list',
          items: [
            'MFA: supports authenticator apps, FIDO2 security keys and passkeys, certificate-based authentication, and Windows Hello for Business. Microsoft enforces MFA for sign-ins to Azure management tools such as the portal and CLI.',
            'Conditional Access: if-then policies evaluated at sign-in — for example, “for admin roles, require phishing-resistant MFA from a compliant device” or “block legacy authentication”. It requires Microsoft Entra ID P1 or higher.',
            'Privileged Identity Management (PIM): makes privileged roles eligible rather than permanent; users activate them for a limited time, optionally with approval and justification. It requires Microsoft Entra ID P2 or Microsoft Entra ID Governance licensing.',
          ],
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Microsoft Entra ID',
    keyFeatures: [
      'Cloud directory and identity provider for Azure, Microsoft 365, and federated SaaS applications',
      'Supports OpenID Connect, OAuth 2.0, and SAML 2.0, plus SCIM provisioning to applications',
      'Conditional Access policies evaluated at sign-in',
      'Privileged Identity Management for time-limited role activation',
      'B2B guest access across tenants',
    ],
    terminology: {
      'Identity provider instance': 'Tenant',
      'Application identity': 'App registration (definition) and service principal (instance in a tenant)',
      'Platform-managed workload identity': 'Managed identity',
      'Directory administrator roles': 'Microsoft Entra roles',
      'Resource permissions': 'Azure roles (Azure RBAC)',
      'Sign-in policy': 'Conditional Access policy',
    },
    architecturalNotes: [
      'One tenant can be trusted by many subscriptions; each subscription trusts one tenant.',
      'Entra roles and Azure roles are separate systems with separate assignments.',
      'Conditional Access evaluates at token issuance; already-issued tokens follow their lifetime unless continuous access evaluation applies.',
    ],
    limitations: [
      'Conditional Access requires Microsoft Entra ID P1 or higher; PIM requires P2 or Entra ID Governance.',
      'Moving a subscription to another tenant removes existing Azure role assignments, which must be recreated.',
    ],
    documentationUrl: 'https://learn.microsoft.com/en-us/entra/fundamentals/whatis',
  },
  knowledgeCheck: [
    {
      id: 'entra-kc-1',
      type: 'single-choice',
      prompt: 'An engineer is a Microsoft Entra User Administrator. Can they restart VMs in a subscription that trusts the tenant?',
      difficulty: 'intermediate',
      learningObjective: 'Distinguish Microsoft Entra roles from Azure roles',
      options: [
        { id: 'a', label: 'Not by virtue of that role — Entra roles manage the directory; VM operations need an Azure role assignment', correct: true, explanation: 'Correct — the two role systems are separate.' },
        { id: 'b', label: 'Yes, any Entra administrator role includes Azure resource access', correct: false, explanation: 'Entra roles do not grant Azure resource permissions. (A Global Administrator can elevate access, which is a separate, audited action.)' },
        { id: 'c', label: 'Only if the VM is in the same region as the tenant', correct: false, explanation: 'Tenants are not regional resources in this sense, and region has nothing to do with authorization.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Microsoft Entra roles vs. Azure roles', url: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/rbac-and-directory-admin-roles' },
    { label: 'What is Conditional Access?', url: 'https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview' },
  ],
};

const awsIamIdentities: LessonBody = {
  learningObjectives: [
    'Distinguish the root user, IAM users, groups, and roles',
    'Explain how IAM Identity Center provides workforce sign-in across many accounts',
    'Explain why AWS recommends temporary credentials over long-term access keys',
  ],
  sections: [
    {
      heading: 'The account is the boundary',
      blocks: [
        {
          type: 'paragraph',
          text: 'In AWS, IAM is scoped to an account: users and roles are created in an account, and by default can only be granted access to that account’s resources. Organizations with many accounts group them with AWS Organizations and provide workforce sign-in across all of them with IAM Identity Center.',
        },
      ],
    },
    {
      heading: 'IAM identity types',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Identity', 'Credentials', 'Use it for'],
          rows: [
            ['Root user', 'Email and password (plus MFA); unrestricted within the account', 'Only the few tasks that require it. Protect with MFA and do not use day to day.'],
            ['IAM user', 'Long-term: password and/or access keys', 'Specific cases that cannot use federation or roles. AWS recommends federation for people and roles for workloads.'],
            ['IAM group', 'None — groups cannot sign in', 'Attaching the same policies to several IAM users. A group cannot be named as a principal in a resource policy.'],
            ['IAM role', 'None stored: callers assume it and receive temporary credentials from AWS STS', 'Workloads, federated users, and cross-account access'],
          ],
        },
        {
          type: 'paragraph',
          text: 'A role has two policies that matter: a trust policy saying who may assume it, and permissions policies saying what the resulting session may do. Assuming a role returns an access key ID, a secret access key, and a session token that expire — by default after one hour, configurable up to the role’s maximum session duration.',
        },
      ],
    },
    {
      heading: 'IAM Identity Center for people',
      blocks: [
        {
          type: 'paragraph',
          text: 'IAM Identity Center is the recommended way to give people access to AWS accounts. Identities come from its own directory or from an external identity provider such as Microsoft Entra ID or Okta, connected with SAML for sign-in and SCIM for provisioning. Administrators define permission sets and assign them to users or groups for specific accounts; Identity Center creates a corresponding IAM role in each account, and users receive short-term credentials when they choose an account and permission set.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The result: no long-term IAM users for the workforce, central MFA and offboarding at the identity provider, and CloudTrail records that identify the person behind each role session.',
        },
      ],
    },
    {
      heading: 'Why long-term access keys are discouraged',
      blocks: [
        {
          type: 'paragraph',
          text: 'An IAM user’s access key works from anywhere until someone deactivates it. Keys are copied into scripts, laptops, CI systems, and occasionally public repositories, where automated scanners find them quickly. Temporary credentials from roles and Identity Center expire on their own, which bounds the damage of a leak. Where access keys are unavoidable, rotate them, scope them narrowly, and monitor their use.',
        },
      ],
    },
  ],
  providerDetails: {
    providerId: 'aws',
    serviceName: 'AWS IAM and IAM Identity Center',
    keyFeatures: [
      'IAM users, groups, and roles scoped to an AWS account',
      'Roles issue temporary credentials through AWS STS',
      'IAM Identity Center: workforce sign-in across accounts in AWS Organizations, with permission sets',
      'External identity providers via SAML 2.0 and SCIM, or OIDC federation for workloads',
      'MFA for the root user, IAM users, and Identity Center users',
    ],
    terminology: {
      'Administrative boundary': 'AWS account (grouped by AWS Organizations)',
      'Workforce identity provider': 'IAM Identity Center or an external IdP federated to it',
      'Reusable permission bundle for people': 'Permission set',
      'Assumable identity with temporary credentials': 'IAM role',
      'Token service': 'AWS Security Token Service (STS)',
    },
    architecturalNotes: [
      'Identity and resources live in the same account, unlike Azure’s separate tenant.',
      'Permission sets are provisioned into each assigned account as IAM roles managed by Identity Center.',
      'Cross-account access requires trust from the target account, usually through a role trust policy.',
    ],
    limitations: [
      'IAM users with access keys remain possible and must be governed explicitly.',
      'IAM groups cannot be referenced as principals in resource-based policies.',
    ],
    documentationUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id.html',
  },
  knowledgeCheck: [
    {
      id: 'awsid-kc-1',
      type: 'scenario',
      prompt: 'A team of 40 engineers needs access to 12 AWS accounts. What does AWS recommend?',
      difficulty: 'intermediate',
      learningObjective: 'Explain how IAM Identity Center provides workforce sign-in across many accounts',
      options: [
        { id: 'a', label: 'IAM Identity Center connected to the company identity provider, with permission sets assigned per account', correct: true, explanation: 'Correct — central identities, temporary credentials, no IAM users to manage in each account.' },
        { id: 'b', label: 'An IAM user per engineer in each account, with access keys', correct: false, explanation: '480 sets of long-term credentials to rotate and offboard — the pattern AWS recommends against.' },
        { id: 'c', label: 'One shared IAM user per account', correct: false, explanation: 'Shared credentials destroy accountability and cannot be revoked for one person.' },
      ],
    },
    {
      id: 'awsid-kc-2',
      type: 'single-choice',
      prompt: 'What does an IAM role’s trust policy control?',
      difficulty: 'beginner',
      learningObjective: 'Distinguish the root user, IAM users, groups, and roles',
      options: [
        { id: 'a', label: 'Which principals are allowed to assume the role', correct: true, explanation: 'Correct — the trust policy is a resource-based policy on the role itself.' },
        { id: 'b', label: 'Which AWS services the role may call', correct: false, explanation: 'That is the role’s permissions policies.' },
        { id: 'c', label: 'How often the role’s password is rotated', correct: false, explanation: 'Roles have no password or long-term credentials.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'What is IAM Identity Center?', url: 'https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html' },
    { label: 'Security best practices in IAM', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html' },
  ],
};

const identityComparison: LessonBody = {
  learningObjectives: [
    'Compare how Azure and AWS separate identity from resources',
    'Map workforce sign-in, workload identity, and administrator roles across both platforms',
  ],
  sections: [
    {
      heading: 'Where identity lives',
      blocks: [
        {
          type: 'paragraph',
          text: 'The biggest architectural difference is placement. In Azure, identities live in a Microsoft Entra tenant that sits above and apart from subscriptions. In AWS, IAM identities live inside each account, and IAM Identity Center adds a central workforce layer across an organization’s accounts. Both reach the same goal — central sign-in with temporary access to many environments — by different routes.',
        },
        {
          type: 'comparisonTable',
          headers: ['Need', 'Azure', 'AWS'],
          rows: [
            ['Workforce identity provider', 'Microsoft Entra ID (tenant)', 'IAM Identity Center (own directory or external IdP)'],
            ['Administrative boundary for resources', 'Subscription (under management groups)', 'Account (under AWS Organizations)'],
            ['Human access to many environments', 'Azure role assignments for Entra users and groups at management group or subscription scope', 'Permission sets assigned per account, provisioned as roles'],
            ['Platform-managed workload identity', 'Managed identity', 'IAM role for the service (instance profile, task role, execution role)'],
            ['Long-term credential for an app', 'Service principal with a client secret or certificate', 'IAM user access key'],
            ['Time-limited admin elevation', 'Privileged Identity Management', 'No single built-in equivalent: short role sessions, plus temporary elevated access patterns that AWS documents for Identity Center'],
            ['Sign-in policy', 'Conditional Access', 'Policies at the external IdP; MFA settings in Identity Center'],
          ],
        },
      ],
    },
    {
      heading: 'Common multi-cloud pattern',
      blocks: [
        {
          type: 'paragraph',
          text: 'Organizations using both clouds often make Microsoft Entra ID the single workforce identity provider and federate it into IAM Identity Center with SAML and SCIM. People then have one identity, one MFA policy, and one offboarding step for both clouds, while authorization remains native to each platform: Azure RBAC on one side, permission sets and IAM policies on the other.',
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'The mappings are conceptual. An Entra tenant and an IAM Identity Center instance both centralize workforce sign-in, but they differ in scope (Entra also serves Microsoft 365 and SaaS apps), in role model, and in how permissions are provisioned.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'idcmp-kc-1',
      type: 'single-choice',
      prompt: 'Which statement about identity placement is accurate?',
      difficulty: 'intermediate',
      learningObjective: 'Compare how Azure and AWS separate identity from resources',
      options: [
        { id: 'a', label: 'Azure identities live in a tenant separate from subscriptions; AWS IAM identities live inside each account', correct: true, explanation: 'Correct — and IAM Identity Center adds an organization-wide workforce layer on the AWS side.' },
        { id: 'b', label: 'Both platforms store identities inside each resource group', correct: false, explanation: 'Neither does; resource groups and accounts hold resources, not the directory.' },
        { id: 'c', label: 'AWS has no way to centralize workforce identities across accounts', correct: false, explanation: 'IAM Identity Center does exactly that.' },
      ],
    },
  ],
};

// A teaching token: the signature segment is the base64url text
// "EXAMPLE-SIGNATURE-NOT-VALID", so it can never verify against any key.
const exampleToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImV4YW1wbGUta2V5LTEifQ.eyJpc3MiOiJodHRwczovL2xvZ2luLmV4YW1wbGUuY29tLzdmMmMxZDllL3YyLjAiLCJzdWIiOiJhMWIyYzNkNC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEiLCJhdWQiOiJhcGk6Ly9vcmRlcnMtYXBpIiwiaWF0IjoxNzY3MjI1NjAwLCJuYmYiOjE3NjcyMjU2MDAsImV4cCI6MTc2NzIyOTIwMCwibmFtZSI6IkV4YW1wbGUgVXNlciIsInJvbGVzIjpbIk9yZGVycy5SZWFkIl19.RVhBTVBMRS1TSUdOQVRVUkUtTk9ULVZBTElE';

const inspectTokenLab: LabBody = {
  difficulty: 'beginner',
  estimatedTime: '15 minutes',
  description:
    'Decode a sample JSON Web Token on your own machine, read its claims, and see for yourself why decoding a token is not the same as trusting it. You run every command; the page runs nothing and cannot check your results. The token is a teaching example with an invalid signature — never paste real tokens into tools you do not control.',
  learningObjectives: [
    'Decode the header and payload of a JWT and interpret its standard claims',
    'Explain why a service must verify the signature, issuer, audience, and expiry before trusting a token',
  ],
  prerequisites: [
    { type: 'concept', id: 'how-authentication-works', label: 'How Authentication Works', description: 'Tokens, claims, and bearer-token risks.' },
    { type: 'tool', label: 'A terminal: bash (Linux, macOS, Git Bash) or PowerShell', description: 'Uses only built-in tools: cut, tr, and base64, or .NET methods from PowerShell.' },
  ],
  content: {
    environment: [
      { tool: 'bash with base64 (Linux, macOS, or Git Bash on Windows)', installUrl: 'https://git-scm.com/downloads', verifyCommand: 'echo aGVsbG8= | base64 -d' },
      { tool: 'PowerShell (alternative)', installUrl: 'https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell', verifyCommand: '$PSVersionTable.PSVersion' },
    ],
    starterFiles: [
      {
        filename: 'token.txt',
        content: exampleToken,
        description: 'Save this single line as token.txt in an empty folder. It is a teaching example: the issuer is a documentation domain and the signature is deliberately invalid.',
      },
    ],
    tasks: [
      {
        id: 'payload',
        title: 'Decode the payload',
        instructions:
          'A JWT is three base64url segments separated by dots. Take the second segment, convert base64url to standard base64 (- becomes +, _ becomes /, then pad with = to a multiple of four characters), and decode it.',
        commands: [
          {
            command: 'payload=$(cut -d. -f2 token.txt | tr \'_-\' \'/+\'); while [ $(( ${#payload} % 4 )) -ne 0 ]; do payload="$payload="; done; echo "$payload" | base64 -d',
            platform: 'bash',
            description: 'Decode the payload in bash.',
            expectedOutput: '{"iss":"https://login.example.com/7f2c1d9e/v2.0","sub":"a1b2c3d4-…","aud":"api://orders-api","iat":1767225600,"nbf":1767225600,"exp":1767229200,"name":"Example User","roles":["Orders.Read"]}',
          },
          {
            command: "$p = (Get-Content token.txt).Split('.')[1].Replace('-','+').Replace('_','/'); $p = $p.PadRight($p.Length + (4 - $p.Length % 4) % 4, '='); [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($p))",
            platform: 'powershell',
            description: 'The same in PowerShell.',
            expectedOutput: 'The same JSON payload.',
          },
        ],
        hints: ['If base64 reports invalid input, check that you took the second segment and padded it to a multiple of four characters.'],
        validationChecklist: ['You can see the iss, sub, aud, iat, nbf, and exp claims', 'You identified the audience as api://orders-api'],
      },
      {
        id: 'claims',
        title: 'Interpret the claims',
        instructions:
          'Convert iat and exp from Unix time to dates and work out the token’s lifetime. Then answer: which API should accept this token, and what would a different API have to do if it received it?',
        commands: [
          { command: 'date -u -d @1767229200', platform: 'bash', description: 'Convert exp to a UTC date (GNU date; on macOS use date -u -r 1767229200).', expectedOutput: 'Thu Jan  1 01:00:00 UTC 2026' },
          { command: '[DateTimeOffset]::FromUnixTimeSeconds(1767229200).UtcDateTime', platform: 'powershell', description: 'The same in PowerShell.', expectedOutput: 'Thursday, January 1, 2026 1:00:00 AM' },
        ],
        hints: ['iat is 1767225600 — exactly one hour before exp.', 'A different API must reject the token because the aud claim does not name it.'],
        validationChecklist: ['You found a one-hour lifetime (issued 00:00 UTC, expires 01:00 UTC on 1 January 2026)', 'You can explain why an API must reject a token whose audience is not itself'],
      },
      {
        id: 'header',
        title: 'Decoding is not verifying',
        instructions:
          'Decode the first segment (the header) the same way. It names the algorithm (RS256) and a key ID (kid). Then consider: you could edit the payload — change roles to ["Orders.Admin"] — and re-encode it with no key at all. What stops an API from accepting that edited token?',
        commands: [
          {
            command: 'header=$(cut -d. -f1 token.txt | tr \'_-\' \'/+\'); while [ $(( ${#header} % 4 )) -ne 0 ]; do header="$header="; done; echo "$header" | base64 -d',
            platform: 'bash',
            description: 'Decode the header.',
            expectedOutput: '{"alg":"RS256","typ":"JWT","kid":"example-key-1"}',
          },
        ],
        hints: [
          'The receiver fetches the issuer’s public keys (published at the issuer’s metadata endpoint), selects the one matching kid, and verifies the signature over the header and payload. An edited payload no longer matches its signature.',
          'This sample’s signature is deliberately invalid, so it would fail verification even unedited.',
        ],
        validationChecklist: [
          'You can explain that anyone can read a JWT’s claims without a key',
          'You can explain that only signature verification (plus issuer, audience, and expiry checks) makes the claims trustworthy',
        ],
      },
    ],
    cleanupInstructions: 'Delete token.txt. Never paste real access tokens into online decoders: a valid bearer token is a live credential until it expires.',
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'iam-fundamentals': iamFundamentals,
    'how-authentication-works': howAuthenticationWorks,
    'identity-providers-and-sso': identityProvidersAndSso,
    'microsoft-entra-id': microsoftEntraId,
    'aws-iam-identities': awsIamIdentities,
    'identity-comparison': identityComparison,
  },
  labs: {
    'inspect-a-token-lab': inspectTokenLab,
  },
  simulations: {},
};
