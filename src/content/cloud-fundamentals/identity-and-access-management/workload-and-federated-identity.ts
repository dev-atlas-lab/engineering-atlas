import type { ConceptContentModule, LabBody, LessonBody } from '../../types';
import { federationScene, instanceRoleScene, managedIdentityScene } from './workload-and-federated-identity.scenes';
import { credentialLifecycleSimulation, type CredentialState } from './credential-lifecycle';
import { renderCredentialState } from './credential-lifecycle-view';
import { bindSimulation } from '../../../engines/lab/bind-simulation';

const workloadIdentityFundamentals: LessonBody = {
  learningObjectives: [
    'Explain why long-lived credentials embedded in applications are dangerous',
    'Rank workload authentication options from most to least exposed',
    'Explain how platform-managed identities remove stored secrets, and what they still depend on',
  ],
  analogy:
    'Handing a contractor a copy of the master key is a long-lived credential: it works until you change the locks, and you never know how many copies exist. Having the front desk issue a badge that expires at 6 p.m. — after checking who they are — is a managed, temporary credential.',
  sections: [
    {
      heading: 'Software needs identity too',
      blocks: [
        {
          type: 'paragraph',
          text: 'An application that reads a database, writes to object storage, or calls another service must authenticate just like a person — but it cannot type a password or approve an MFA prompt. Historically the answer was to give it a secret: a password, an API key, or a cloud access key placed in configuration. That secret becomes the most valuable thing in the deployment, and it is copied everywhere the configuration goes.',
        },
      ],
    },
    {
      heading: 'Why long-lived keys in configuration are dangerous',
      blocks: [
        {
          type: 'list',
          items: [
            'They spread: configuration ends up in source repositories, container image layers, CI variables, backups, crash dumps, and logs. Deleting a file does not remove it from git history or from an image layer that was already pushed.',
            'They do not expire: a key copied two years ago still works today unless someone rotated it.',
            'They are hard to rotate: changing the key requires updating every system that uses it at the same moment, so rotation is often postponed indefinitely.',
            'They blur accountability: if several apps or people share a key, the audit log cannot tell them apart.',
            'They are actively hunted: public repositories and container registries are continuously scanned by automated tools for cloud keys, and exposed keys are often tried quickly.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'If a long-lived key has ever been committed to a repository, treat it as compromised: revoke or rotate it first, then clean the history. Cleaning history alone does not invalidate copies that were already made.',
        },
      ],
    },
    {
      heading: 'A spectrum of options',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['Approach', 'What is stored with the app', 'Exposure if copied'],
          rows: [
            ['Key hardcoded in source code', 'The key, in every clone of the repository', 'Until manually rotated — and everyone with repo access has it'],
            ['Key in a configuration file or environment variable', 'The key, on every host and in every image or deployment manifest', 'Until manually rotated'],
            ['Key in a secret store, fetched at runtime', 'A credential to reach the secret store (“secret zero”)', 'Reduced, if retrieval uses a managed identity'],
            ['Platform-managed identity (managed identity, IAM role for the service)', 'Nothing: the platform issues short-lived credentials', 'A stolen credential is useful only until it expires'],
            ['Workload identity federation', 'Nothing: an external token is exchanged for a cloud credential', 'Bounded by the token lifetimes, and by how narrowly the trust is configured'],
          ],
        },
        {
          type: 'paragraph',
          text: 'The goal is “secretless” authentication: the workload proves who it is through something the platform already knows — the VM or container it runs on, or a signed token from its CI platform or Kubernetes cluster — and receives a credential that expires on its own.',
        },
      ],
    },
    {
      heading: 'What managed identities still depend on',
      blocks: [
        {
          type: 'paragraph',
          text: 'Platform-managed credentials are delivered through a local metadata endpoint at the link-local address 169.254.169.254 on both Azure and AWS. Anything that can make requests from inside the compute resource can obtain the identity’s credentials. That is why server-side request forgery (SSRF) — tricking an application into fetching an attacker-chosen URL — is a serious risk for cloud workloads.',
        },
        {
          type: 'list',
          items: [
            'Azure’s metadata service requires a Metadata: true header, which simple SSRF payloads cannot set.',
            'AWS IMDSv2 requires a session token obtained with a PUT request; requiring IMDSv2 and disabling IMDSv1 blocks most SSRF-based credential theft.',
            'Least privilege still matters most: a managed identity with Owner on the subscription is as dangerous as an Owner key, just harder to steal.',
          ],
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'wif-kc-1',
      type: 'scenario',
      prompt:
        'A developer finds an AWS access key committed to a public repository six months ago. They delete the file and force-push the history. What is still required?',
      difficulty: 'intermediate',
      learningObjective: 'Explain why long-lived credentials embedded in applications are dangerous',
      options: [
        { id: 'a', label: 'Deactivate or rotate the key and review its usage in audit logs — cleaning history does not invalidate existing copies', correct: true, explanation: 'Correct — assume the key was copied while it was public.' },
        { id: 'b', label: 'Nothing — once removed from history, the key is safe', correct: false, explanation: 'Clones, forks, caches, and scanners may already hold it; the key itself still works.' },
        { id: 'c', label: 'Make the repository private', correct: false, explanation: 'This hides it from new viewers but does not invalidate copies already taken.' },
      ],
    },
    {
      id: 'wif-kc-2',
      type: 'single-choice',
      prompt: 'Why is server-side request forgery (SSRF) a particular risk for workloads that use managed identities or instance roles?',
      difficulty: 'advanced',
      learningObjective: 'Explain how platform-managed identities remove stored secrets, and what they still depend on',
      options: [
        { id: 'a', label: 'Credentials are served by a local metadata endpoint; if an attacker can make the app fetch from it, they can obtain the identity’s temporary credentials', correct: true, explanation: 'Correct — which is why Azure requires the Metadata header and AWS offers IMDSv2 session tokens.' },
        { id: 'b', label: 'Managed identities store their secrets in the app’s source code', correct: false, explanation: 'They store no secret with the app at all.' },
        { id: 'c', label: 'SSRF disables token expiry', correct: false, explanation: 'Stolen temporary credentials still expire; the risk is that new ones can be fetched while the vulnerability exists.' },
      ],
    },
    {
      id: 'wif-kc-3',
      type: 'multi-select',
      prompt: 'Which of these leave a long-lived credential somewhere it can be copied? Select all that apply.',
      difficulty: 'beginner',
      learningObjective: 'Rank workload authentication options from most to least exposed',
      options: [
        { id: 'a', label: 'An access key in a Dockerfile ENV instruction', correct: true, explanation: 'Correct — it is baked into an image layer that anyone who can pull the image can read.' },
        { id: 'b', label: 'A client secret in a CI/CD variable', correct: true, explanation: 'Correct — it is long-lived and readable by anyone who can change or debug the pipeline.' },
        { id: 'c', label: 'A VM using a managed identity', correct: false, explanation: 'No secret is stored; credentials are issued on demand and expire.' },
        { id: 'd', label: 'A pipeline using workload identity federation', correct: false, explanation: 'It exchanges a short-lived token; nothing long-lived is stored.' },
      ],
    },
  ],
};

const temporaryCredentialsAndFederation: LessonBody = {
  learningObjectives: [
    'Explain how a token exchange turns an external identity into a short-lived cloud credential',
    'Configure a federation trust narrowly enough that only the intended workload can use it',
    'Describe credential expiration and refresh, and a realistic service-to-service authentication flow',
  ],
  sections: [
    {
      heading: 'Trust, then exchange',
      blocks: [
        {
          type: 'paragraph',
          text: 'Workload identity federation lets a workload outside the cloud — a CI/CD job, a Kubernetes pod, an app in another cloud — authenticate without any cloud secret. The cloud is configured to trust an external OIDC issuer for one specific identity. At runtime, the workload presents a token from that issuer, and the cloud’s token service exchanges it for a short-lived cloud credential.',
        },
        {
          type: 'comparisonTable',
          headers: ['Claim checked', 'Why it matters'],
          rows: [
            ['Issuer (iss)', 'Only tokens from the configured issuer are trusted — for example GitHub’s token issuer or one specific Kubernetes cluster.'],
            ['Subject (sub)', 'Identifies the exact workload: a repository and branch or environment, or a Kubernetes namespace and service account.'],
            ['Audience (aud)', 'Confirms the token was minted for this cloud’s token exchange, not for some other service.'],
            ['Signature and expiry', 'Proves the issuer signed it and that it is still valid.'],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'The subject condition is the security boundary. Trusting “any branch of this repository” lets any branch — including one an attacker pushes — deploy with production permissions. Bind production trust to a protected branch or a deployment environment that requires approval.',
        },
      ],
    },
    {
      heading: 'Expiration and refresh',
      blocks: [
        {
          type: 'paragraph',
          text: 'Every credential in this flow expires: the CI token after minutes, the cloud credential after a configured lifetime. Long-running workloads rely on their SDK to obtain fresh credentials before expiry. A common bug is fetching a credential once at startup and caching it forever — the application then fails hours later with “token expired” errors that look like permission problems but are not.',
        },
        {
          type: 'list',
          items: [
            'AWS: AssumeRole and AssumeRoleWithWebIdentity sessions last one hour by default, up to the role’s configured maximum session duration (at most 12 hours). A session obtained by role chaining — using one role’s credentials to assume another — is limited to one hour.',
            'Azure: access tokens from Microsoft Entra ID have limited lifetimes, and the Azure Identity libraries cache and renew them automatically. Managed identity tokens are cached by the platform as well.',
          ],
        },
      ],
    },
    {
      heading: 'A realistic service-to-service flow',
      blocks: [
        {
          type: 'list',
          ordered: true,
          items: [
            'The Orders service runs with its own workload identity — a managed identity on Azure or a task or pod role on AWS.',
            'It needs to call the Payments API. On Azure, it requests an access token whose audience is the Payments API’s application ID; on AWS, it signs the request with its role credentials (for example to an API Gateway endpoint that uses IAM authorization).',
            'Payments validates the caller: the token’s signature, issuer, audience, and expiry — or the request signature, through the AWS service.',
            'Payments authorizes the specific caller: only the Orders identity holds the app role or IAM permission to create charges.',
            'Both sides log the call with the caller identity, so the audit trail shows which service did what.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Network placement is not identity. Being inside the same virtual network should never be what authorizes one service to call another; a compromised neighbour is inside that network too.',
        },
      ],
    },
  ],
  visualization: federationScene,
  knowledgeCheck: [
    {
      id: 'fed-kc-1',
      type: 'scenario',
      prompt:
        'A cloud role trusts GitHub’s OIDC issuer with the subject condition “repo:contoso/web:*”. The role has permission to deploy to production. What is the risk?',
      difficulty: 'advanced',
      learningObjective: 'Configure a federation trust narrowly enough that only the intended workload can use it',
      options: [
        { id: 'a', label: 'Any branch, tag, or pull request workflow in that repository that can request a token may assume the production role', correct: true, explanation: 'Correct — narrow the subject to a protected branch or an environment with required approvals.' },
        { id: 'b', label: 'None — only contoso/web can use it, which is the intended repository', correct: false, explanation: 'The repository is right, but the wildcard admits every ref and workflow within it.' },
        { id: 'c', label: 'The tokens never expire', correct: false, explanation: 'They do expire; the problem is who can obtain them.' },
      ],
    },
    {
      id: 'fed-kc-2',
      type: 'scenario',
      prompt:
        'A service works for the first hour after each deployment, then every call fails with an “expired token” error until it is restarted. What is the most likely cause?',
      difficulty: 'intermediate',
      learningObjective: 'Describe credential expiration and refresh, and a realistic service-to-service authentication flow',
      options: [
        { id: 'a', label: 'The app fetched a temporary credential at startup and caches it instead of letting the SDK refresh it', correct: true, explanation: 'Correct — use the SDK’s credential provider, which refreshes before expiry.' },
        { id: 'b', label: 'The identity’s role assignment is removed every hour', correct: false, explanation: 'That would produce authorization (403) errors, not expired-token errors, and restarts would not fix it.' },
        { id: 'c', label: 'The network blocks traffic after an hour', correct: false, explanation: 'The error is about the token, not connectivity.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Microsoft Entra workload identity federation', url: 'https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation' },
    { label: 'AWS: Create a role for OpenID Connect federation', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html' },
  ],
};

const azureManagedIdentities: LessonBody = {
  learningObjectives: [
    'Choose between system-assigned and user-assigned managed identities',
    'Trace how a managed identity obtains a token and how Azure RBAC authorizes its calls',
    'Explain when to use service principals and federated identity credentials instead',
  ],
  sections: [
    {
      heading: 'Two kinds of managed identity',
      blocks: [
        {
          type: 'comparisonTable',
          headers: ['', 'System-assigned', 'User-assigned'],
          rows: [
            ['Lifecycle', 'Created with the resource and deleted with it', 'A standalone Azure resource with its own lifecycle'],
            ['Sharing', 'Belongs to exactly one resource', 'Can be attached to many resources'],
            ['Good for', 'One resource that needs its own identity and permissions', 'Fleets of identical resources, or permissions that must exist before the resource is created'],
          ],
        },
        {
          type: 'paragraph',
          text: 'Both are service principals in Microsoft Entra ID whose credentials Azure creates and rotates. They work with VMs, App Service, Azure Functions, Container Apps, AKS, and many other services, and can call any service that accepts Microsoft Entra authentication.',
        },
      ],
    },
    {
      heading: 'Getting and using a token',
      blocks: [
        {
          type: 'paragraph',
          text: 'Applications use the Azure Identity libraries (for example DefaultAzureCredential or ManagedIdentityCredential), which request tokens from the local endpoint, cache them, and renew them. On a VM the endpoint is the Instance Metadata Service; App Service, Functions, and Container Apps expose an equivalent local identity endpoint.',
        },
        {
          type: 'code',
          language: 'bash',
          code: 'curl -s -H "Metadata: true" \\\n  "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://vault.azure.net"',
          caption: 'What the SDK does under the hood on a VM — runnable only from inside an Azure VM with a managed identity.',
        },
        {
          type: 'paragraph',
          text: 'A token only proves identity. The managed identity must also hold a role assignment on the target — for example Storage Blob Data Reader on a storage account or Key Vault Secrets User on a vault — scoped as narrowly as possible.',
        },
      ],
    },
    {
      heading: 'Service principals and federation',
      blocks: [
        {
          type: 'paragraph',
          text: 'Workloads that run outside Azure cannot use a managed identity directly. The traditional alternative is an app registration’s service principal with a client secret or certificate — a long-lived credential to protect and rotate. Prefer federated identity credentials instead: configure an app registration or a user-assigned managed identity to trust an external OIDC issuer (GitHub Actions, a Kubernetes cluster, another cloud), and the workload exchanges that issuer’s token for an Entra access token with no secret at all. Up to 20 federated identity credentials can be added to one application or user-assigned managed identity.',
        },
        {
          type: 'paragraph',
          text: 'Microsoft Entra Workload ID for AKS uses this mechanism: a Kubernetes service account is federated with a user-assigned managed identity, so pods receive Entra tokens through the cluster’s own OIDC issuer.',
        },
      ],
    },
  ],
  visualization: managedIdentityScene,
  providerDetails: {
    providerId: 'azure',
    serviceName: 'Managed identities for Azure resources',
    keyFeatures: [
      'System-assigned and user-assigned managed identities',
      'Credentials created and rotated by Azure; never visible to the workload',
      'Tokens obtained from a local endpoint (IMDS on VMs) through the Azure Identity libraries',
      'Federated identity credentials for workloads outside Azure, including GitHub Actions and Kubernetes',
      'Authorized with Azure RBAC like any other security principal',
    ],
    terminology: {
      'Platform-managed workload identity': 'Managed identity (system- or user-assigned)',
      'Application identity with its own credential': 'Service principal (from an app registration)',
      'Trust for an external token issuer': 'Federated identity credential',
      'Local credential endpoint': 'Instance Metadata Service (VMs) or the service’s identity endpoint',
    },
    architecturalNotes: [
      'A managed identity is a special service principal; permissions are granted with role assignments.',
      'User-assigned identities decouple permissions from the lifecycle of individual resources.',
      'Federated identity credentials remove secrets for workloads running outside Azure.',
    ],
    limitations: [
      'Managed identities only work for code running on Azure resources that support them (or through federation).',
      'Up to 20 federated identity credentials per application or user-assigned managed identity.',
      'Anything able to call the local endpoint from inside the resource can obtain its tokens.',
    ],
    documentationUrl: 'https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview',
  },
  knowledgeCheck: [
    {
      id: 'ami-kc-1',
      type: 'scenario',
      prompt:
        'Fifty identical VMs in a scale set need read access to the same storage account, and the permission must be in place before the VMs are created. Which identity fits best?',
      difficulty: 'intermediate',
      learningObjective: 'Choose between system-assigned and user-assigned managed identities',
      options: [
        { id: 'a', label: 'One user-assigned managed identity, granted the role once and attached to the scale set', correct: true, explanation: 'Correct — its lifecycle and permissions are independent of the VMs.' },
        { id: 'b', label: 'A system-assigned identity on each VM', correct: false, explanation: 'Each would need its own role assignment, created only after the VM exists.' },
        { id: 'c', label: 'A service principal with a client secret in each VM’s configuration', correct: false, explanation: 'This reintroduces a long-lived secret on fifty machines.' },
      ],
    },
    {
      id: 'ami-kc-2',
      type: 'single-choice',
      prompt: 'A VM’s managed identity obtains a token for Azure Storage but receives 403 when reading a blob. What is missing?',
      difficulty: 'beginner',
      learningObjective: 'Trace how a managed identity obtains a token and how Azure RBAC authorizes its calls',
      options: [
        { id: 'a', label: 'A data-plane role assignment, such as Storage Blob Data Reader, for the identity on the account or container', correct: true, explanation: 'Correct — authentication succeeded; authorization did not.' },
        { id: 'b', label: 'A client secret for the managed identity', correct: false, explanation: 'Managed identities never use a secret you manage.' },
        { id: 'c', label: 'A public IP on the VM', correct: false, explanation: 'Network reachability is not the issue; the error is 403.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'How to use managed identities on a VM to acquire an access token', url: 'https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/how-to-use-vm-token' },
  ],
};

const awsRolesForWorkloads: LessonBody = {
  learningObjectives: [
    'Identify the role mechanism each AWS compute service uses',
    'Explain why IMDSv2 matters for EC2 credentials',
    'Choose between EKS Pod Identity, IRSA, OIDC federation, and IAM Roles Anywhere',
  ],
  sections: [
    {
      heading: 'One idea, several attachment points',
      blocks: [
        {
          type: 'paragraph',
          text: 'On AWS, workloads get permissions by running as an IAM role. The service obtains temporary credentials for that role from AWS STS and makes them available to the code, and the SDK’s default credential provider chain picks them up automatically.',
        },
        {
          type: 'comparisonTable',
          headers: ['Compute', 'Mechanism', 'Notes'],
          rows: [
            ['EC2', 'Instance profile containing a role', 'Credentials served by instance metadata; require IMDSv2'],
            ['Lambda', 'Execution role', 'Credentials provided to the function’s environment for each execution environment'],
            ['ECS and Fargate', 'Task role', 'The task role is for the application; the separate task execution role is for ECS itself (pulling images, fetching secrets)'],
            ['EKS', 'EKS Pod Identity (recommended) or IAM roles for service accounts (IRSA)', 'Maps a Kubernetes service account to a role'],
            ['Outside AWS', 'OIDC federation (AssumeRoleWithWebIdentity) or IAM Roles Anywhere (X.509 certificates)', 'For CI/CD, other clouds, and on-premises servers'],
          ],
        },
      ],
    },
    {
      heading: 'EC2 and IMDSv2',
      blocks: [
        {
          type: 'paragraph',
          text: 'Instance metadata is reachable at 169.254.169.254 from inside the instance. With IMDSv1, a simple GET returned the role’s credentials — so a server-side request forgery bug could leak them. IMDSv2 requires first obtaining a session token with a PUT request and sending it as a header, which most SSRF vectors cannot do. Requiring IMDSv2 (and setting the response hop limit appropriately for containers) is a standard hardening step.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Pods and containers on an EC2 node can often reach the node’s instance metadata, and with it the node’s role. Give the node role minimal permissions and block pod access to instance metadata where pods have their own roles.',
        },
      ],
    },
    {
      heading: 'Kubernetes and external workloads',
      blocks: [
        {
          type: 'list',
          items: [
            'EKS Pod Identity: an agent on each node exchanges pod identity for role credentials. No per-cluster OIDC provider is needed, the role trusts the EKS service principal once, and credentials carry session tags such as namespace and cluster name for attribute-based policies.',
            'IRSA: the pod’s projected service account token is exchanged with AssumeRoleWithWebIdentity against the cluster’s OIDC provider. It also works on self-managed Kubernetes, and remains supported.',
            'OIDC federation for CI/CD: the role’s trust policy names the issuer and conditions on the token’s sub and aud claims, for example a specific GitHub repository and branch.',
            'IAM Roles Anywhere: servers outside AWS present an X.509 certificate from a trusted certificate authority to receive temporary credentials.',
          ],
        },
      ],
    },
  ],
  visualization: instanceRoleScene,
  providerDetails: {
    providerId: 'aws',
    serviceName: 'IAM roles for AWS workloads (with AWS STS)',
    keyFeatures: [
      'Instance profiles, Lambda execution roles, ECS task roles, and EKS Pod Identity or IRSA',
      'Temporary credentials issued by AWS STS and refreshed automatically by the SDKs',
      'IMDSv2 session-token protection for EC2 instance metadata',
      'OIDC federation through AssumeRoleWithWebIdentity',
      'IAM Roles Anywhere for workloads outside AWS',
    ],
    terminology: {
      'Platform-managed workload identity': 'IAM role attached to the compute (instance profile, execution role, task role)',
      'Token exchange service': 'AWS Security Token Service (STS)',
      'Trust for an external token issuer': 'IAM OIDC identity provider plus a role trust policy',
      'Local credential endpoint': 'Instance metadata service (IMDSv2) or the container credentials endpoint',
    },
    architecturalNotes: [
      'Who may use a role is controlled by its trust policy; what it may do by its permissions policies.',
      'Passing a role to a service requires iam:PassRole, which should be scoped to specific roles.',
      'Default session duration is one hour; role chaining limits a session to one hour.',
    ],
    limitations: [
      'Pods on EC2 nodes may reach the node role through instance metadata unless blocked.',
      'EKS Pod Identity is specific to Amazon EKS and does not cover every node type; IRSA remains available.',
    ],
    documentationUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html',
  },
  knowledgeCheck: [
    {
      id: 'awsrole-kc-1',
      type: 'single-choice',
      prompt: 'An ECS task needs to write to an S3 bucket. Which role should hold the s3:PutObject permission?',
      difficulty: 'intermediate',
      learningObjective: 'Identify the role mechanism each AWS compute service uses',
      options: [
        { id: 'a', label: 'The task role', correct: true, explanation: 'Correct — it is the identity the application code runs as.' },
        { id: 'b', label: 'The task execution role', correct: false, explanation: 'That role is used by ECS to pull images and fetch secrets, not by the application.' },
        { id: 'c', label: 'The EC2 node’s instance profile', correct: false, explanation: 'Granting it there gives every task on the node the permission.' },
      ],
    },
    {
      id: 'awsrole-kc-2',
      type: 'single-choice',
      prompt: 'Why does requiring IMDSv2 reduce the impact of a server-side request forgery bug in an EC2-hosted app?',
      difficulty: 'advanced',
      learningObjective: 'Explain why IMDSv2 matters for EC2 credentials',
      options: [
        { id: 'a', label: 'Credentials can only be read with a session token obtained by a PUT request, which typical SSRF vectors cannot send', correct: true, explanation: 'Correct.' },
        { id: 'b', label: 'IMDSv2 encrypts the credentials with the app’s password', correct: false, explanation: 'There is no app password; the protection is the session-token handshake.' },
        { id: 'c', label: 'IMDSv2 makes credentials permanent so they cannot be stolen', correct: false, explanation: 'Credentials remain temporary; IMDSv2 changes how they are requested.' },
      ],
    },
  ],
  furtherReading: [
    { label: 'Use IMDSv2', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html' },
    { label: 'EKS Pod Identity and IRSA', url: 'https://docs.aws.amazon.com/eks/latest/userguide/service-accounts.html' },
  ],
};

const workloadIdentityComparison: LessonBody = {
  learningObjectives: ['Compare Azure managed identities with AWS IAM roles for workloads, including their federation options'],
  sections: [
    {
      heading: 'Same goal, different objects',
      blocks: [
        {
          type: 'paragraph',
          text: 'Both platforms let compute authenticate without stored secrets. Azure models the workload’s identity as a principal in the directory (a managed identity) that is then granted roles. AWS models it as a role that the compute assumes, with a trust policy saying who may assume it.',
        },
        {
          type: 'comparisonTable',
          headers: ['Aspect', 'Azure', 'AWS'],
          rows: [
            ['Workload identity object', 'Managed identity (a service principal)', 'IAM role'],
            ['Shareable across resources', 'User-assigned managed identity', 'The same role used by several instances, functions, or tasks'],
            ['Credential delivered as', 'Microsoft Entra access token for a specific audience', 'Temporary access key, secret key, and session token'],
            ['Local endpoint on VMs', 'IMDS with Metadata: true header', 'IMDSv2 with session token'],
            ['Who may use it', 'Whatever resource it is attached to', 'Principals allowed by the role’s trust policy'],
            ['Federation for external workloads', 'Federated identity credentials on an app registration or user-assigned identity', 'IAM OIDC identity provider plus role trust policy (AssumeRoleWithWebIdentity); IAM Roles Anywhere for X.509'],
            ['Kubernetes', 'Microsoft Entra Workload ID for AKS', 'EKS Pod Identity or IRSA'],
            ['Long-lived fallback to avoid', 'Service principal client secret', 'IAM user access key'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'An Azure token is scoped to one audience (resource) per request; AWS role credentials sign requests to any AWS service, with the role’s policies deciding what is allowed. Both approaches still depend on least-privilege permissions for safety.',
        },
      ],
    },
  ],
  knowledgeCheck: [
    {
      id: 'wicmp-kc-1',
      type: 'single-choice',
      prompt: 'What plays the role of the AWS role trust policy for an Azure user-assigned managed identity used by a GitHub Actions workflow?',
      difficulty: 'advanced',
      learningObjective: 'Compare Azure managed identities with AWS IAM roles for workloads, including their federation options',
      options: [
        { id: 'a', label: 'A federated identity credential naming GitHub’s issuer, the workflow’s subject, and the audience', correct: true, explanation: 'Correct — both define which external tokens may be exchanged.' },
        { id: 'b', label: 'A client secret stored in GitHub', correct: false, explanation: 'Federation exists precisely to avoid this.' },
        { id: 'c', label: 'An Azure Policy assignment', correct: false, explanation: 'Azure Policy governs resource configuration, not token exchange.' },
      ],
    },
  ],
};

const credentialLab: LabBody = {
  difficulty: 'intermediate',
  estimatedTime: '20 minutes',
  description:
    'Follow an application’s credential over three hours. Compare an Azure managed identity, an AWS instance role, and a long-lived key; break credential refresh; remove the permission; and leak the credential to see how long an attacker could use it. Lifetimes are illustrative and everything is simulated in your browser — no cloud resources or credentials are involved.',
  learningObjectives: [
    'Explain how temporary credentials are refreshed and why caching them breaks applications',
    'Distinguish an authentication failure from an authorization failure',
    'Compare the exposure of a leaked temporary credential with a leaked long-lived key',
  ],
  prerequisites: [
    { type: 'concept', id: 'workload-identity-fundamentals', label: 'Workload Identity: How Software Authenticates', description: 'Why long-lived keys are dangerous.' },
  ],
  content: {
    simulationId: credentialLifecycleSimulation.id,
    instructions: [
      { id: 'healthy', label: '1. A healthy workload', description: 'Run the default managed identity scenario. Note the silent refreshes at minutes 45, 90, 135, and 180.' },
      { id: 'cached', label: '2. Break refresh', description: 'Choose “fetched once at startup”. The app fails at minute 90 even though nothing about its permissions changed.' },
      { id: 'forbidden', label: '3. Authenticated but forbidden', description: 'Restore SDK refresh and remove the permission. Authentication succeeds every time; every call still fails.' },
      { id: 'leak-temp', label: '4. Leak a temporary credential', description: 'Restore the permission and turn on the leak. The attacker’s copy works briefly, then expires.' },
      { id: 'leak-key', label: '5. Leak a long-lived key', description: 'Switch to the long-lived access key with the leak still on. Compare how long the attacker keeps access.' },
    ],
    parameters: [],
    validationRules: [
      {
        id: 'healthy',
        label: 'A temporary credential was refreshed automatically and every app call succeeded',
        check: (state) => {
          const s = state as CredentialState;
          return s.config.mechanism !== 'static-key' && s.config.refresh === 'sdk' && s.summary !== null && s.summary.appCallsFailed === 0;
        },
      },
      {
        id: 'expired',
        label: 'Observed an app break because it cached a temporary credential past its expiry',
        check: (state) => (state as CredentialState).summary?.failureCause === 'expired',
      },
      {
        id: 'bounded-leak',
        label: 'A leaked temporary credential stopped working when it expired',
        check: (state) => {
          const s = state as CredentialState;
          return s.summary?.leakExposure === 'until-expiry' && s.events.some((e) => e.actor === 'attacker' && e.label.endsWith('expired'));
        },
      },
      {
        id: 'unbounded-leak',
        label: 'A leaked long-lived key kept working for the attacker',
        check: (state) => {
          const s = state as CredentialState;
          return s.summary?.leakExposure === 'until-manually-revoked' && s.summary.attackerCallsSucceeded === 2;
        },
      },
    ],
  },
};

export const content: ConceptContentModule = {
  lessons: {
    'workload-identity-fundamentals': workloadIdentityFundamentals,
    'temporary-credentials-and-federation': temporaryCredentialsAndFederation,
    'azure-managed-identities': azureManagedIdentities,
    'aws-iam-roles-for-workloads': awsRolesForWorkloads,
    'workload-identity-comparison': workloadIdentityComparison,
  },
  labs: {
    'workload-credential-lab': credentialLab,
  },
  simulations: {
    'workload-credential-lab': bindSimulation(credentialLifecycleSimulation, renderCredentialState),
  },
};
