import type { SceneDefinition } from '../../../engines/visualization/types';

export const federationScene: SceneDefinition = {
  id: 'workload-identity-federation',
  type: 'sequence',
  title: 'A CI/CD pipeline deploys with no stored cloud secret',
  nodes: [
    { id: 'job', type: 'function', label: 'Pipeline job', position: { x: 0, y: 0 }, data: { Runs: 'In a CI/CD platform such as GitHub Actions', Holds: 'No cloud credential at all before it starts' } },
    {
      id: 'ciIdp',
      type: 'identity',
      label: 'CI platform OIDC issuer',
      position: { x: 0, y: 0 },
      data: { Issues: 'A short-lived OIDC token describing this job: repository, branch or environment, workflow' },
    },
    {
      id: 'sts',
      type: 'identity',
      label: 'Cloud token service',
      position: { x: 0, y: 0 },
      data: { Azure: 'Microsoft Entra ID, checking a federated identity credential', AWS: 'AWS STS AssumeRoleWithWebIdentity, checking the role trust policy' },
    },
    { id: 'api', type: 'gateway', label: 'Cloud API', position: { x: 0, y: 0 }, data: { Does: 'Authorizes the deployment using the workload’s role assignments or policies' } },
  ],
  edges: [
    { id: 'w1', source: 'job', target: 'ciIdp', label: 'request an OIDC token' },
    { id: 'w2', source: 'ciIdp', target: 'job', label: 'signed token: repo, ref, audience' },
    { id: 'w3', source: 'job', target: 'sts', label: 'exchange the OIDC token' },
    { id: 'w4', source: 'sts', target: 'job', label: 'short-lived cloud credential' },
    { id: 'w5', source: 'job', target: 'api', label: 'deploy + credential' },
    { id: 'w6', source: 'api', target: 'job', label: 'allowed by the workload’s permissions' },
  ],
  states: [
    {
      id: 'wf0',
      label: 'No secret to steal',
      description:
        'The pipeline needs to deploy to the cloud. Instead of storing a cloud access key or client secret in the CI system, the cloud has been configured in advance to trust tokens from the CI platform’s OIDC issuer — but only for a specific repository and branch or environment.',
    },
    {
      id: 'wf1',
      label: 'The job asks its platform for an identity token',
      description: 'While running, the job requests an OIDC token from its own platform. In GitHub Actions this needs the id-token: write permission in the workflow.',
    },
    {
      id: 'wf2',
      label: 'A signed statement of who this job is',
      description:
        'The CI platform issues a short-lived token whose claims identify the job: the issuer, a subject naming the repository and branch or environment, and an audience meant for the cloud provider.',
    },
    {
      id: 'wf3',
      label: 'Exchange at the cloud’s token service',
      description:
        'The job presents that token to the cloud’s token service. It validates the signature against the issuer’s published keys and checks the issuer, subject, and audience against the trust configured for the workload identity.',
    },
    {
      id: 'wf4',
      label: 'A short-lived cloud credential',
      description:
        'If everything matches, the token service issues a cloud credential that expires on its own — an access token on Azure, temporary role credentials on AWS. A job from a different repository or branch fails this check.',
    },
    { id: 'wf5', label: 'Deploy', description: 'The job calls the cloud API with the temporary credential.' },
    {
      id: 'wf6',
      label: 'Authorization still applies',
      description:
        'Federation established who the job is; the deployment is still limited by the role assignments or policies granted to that workload identity. Scope them to what the pipeline deploys.',
    },
  ],
};

export const managedIdentityScene: SceneDefinition = {
  id: 'azure-managed-identity-flow',
  type: 'sequence',
  title: 'An Azure VM reads a Key Vault secret with its managed identity',
  nodes: [
    { id: 'app', type: 'server', label: 'App on the VM', position: { x: 0, y: 0 }, data: { Holds: 'No credential in code, configuration, or image' } },
    {
      id: 'imds',
      type: 'gateway',
      label: 'Instance Metadata Service',
      position: { x: 0, y: 0 },
      data: { Address: '169.254.169.254 — reachable only from inside the VM', Requires: 'The header Metadata: true' },
    },
    { id: 'entra', type: 'identity', label: 'Microsoft Entra ID', position: { x: 0, y: 0 }, data: { Holds: 'The managed identity’s service principal; Azure manages its credentials' } },
    { id: 'kv', type: 'key', label: 'Key Vault', position: { x: 0, y: 0 }, data: { 'Permission model': 'Azure RBAC', 'Role assigned to the identity': 'Key Vault Secrets User on this vault' } },
  ],
  edges: [
    { id: 'm1', source: 'app', target: 'imds', label: 'GET token for vault.azure.net' },
    { id: 'm2', source: 'imds', target: 'entra', label: 'request on the VM’s behalf' },
    { id: 'm3', source: 'entra', target: 'imds', label: 'access token (expires)' },
    { id: 'm4', source: 'imds', target: 'app', label: 'access token' },
    { id: 'm5', source: 'app', target: 'kv', label: 'get secret + bearer token' },
    { id: 'm6', source: 'kv', target: 'app', label: 'secret value (RBAC allowed)' },
  ],
  states: [
    {
      id: 'mi0',
      label: 'An identity attached to the VM',
      description:
        'The VM has a managed identity — system-assigned (created and deleted with the VM) or user-assigned (a standalone resource that can be attached to several resources). Azure creates and rotates its underlying credentials; no one ever sees them.',
    },
    {
      id: 'mi1',
      label: 'Ask the local metadata endpoint',
      description:
        'The app — usually through an Azure SDK credential class — calls the Instance Metadata Service at a link-local address, naming the resource it wants a token for and sending the Metadata: true header, which helps block server-side request forgery.',
    },
    { id: 'mi2', label: 'The platform authenticates the VM', description: 'The platform knows which VM the request came from and requests a token from Microsoft Entra ID for that VM’s managed identity.' },
    { id: 'mi3', label: 'Entra issues an access token', description: 'Microsoft Entra ID issues an access token for the Key Vault audience. Tokens are cached and the SDK obtains new ones before they expire.' },
    { id: 'mi4', label: 'The token reaches the app', description: 'The app receives the token. It never handled a password, client secret, or certificate.' },
    { id: 'mi5', label: 'Call Key Vault', description: 'The app calls Key Vault with the token as a bearer credential.' },
    {
      id: 'mi6',
      label: 'Authorization by Azure RBAC',
      description:
        'Key Vault validates the token, then checks Azure RBAC: the identity holds Key Vault Secrets User on this vault, which includes the data action to read secrets. Without that assignment, a valid token still gets 403 Forbidden.',
    },
  ],
};

export const instanceRoleScene: SceneDefinition = {
  id: 'aws-instance-role-flow',
  type: 'sequence',
  title: 'An EC2 instance reads from S3 with its IAM role',
  nodes: [
    { id: 'app', type: 'server', label: 'App on EC2', position: { x: 0, y: 0 }, data: { Holds: 'No access key in code, configuration, or image' } },
    { id: 'imds', type: 'gateway', label: 'Instance metadata (IMDSv2)', position: { x: 0, y: 0 }, data: { Address: '169.254.169.254 — link-local, reachable only from the instance', Requires: 'A session token obtained with PUT' } },
    { id: 'sts', type: 'identity', label: 'AWS STS', position: { x: 0, y: 0 }, data: { Issues: 'Temporary credentials for the role in the instance profile' } },
    { id: 's3', type: 'storage', label: 'Amazon S3', position: { x: 0, y: 0 }, data: { Authorizes: 'With the role’s identity policies plus any bucket policy' } },
  ],
  edges: [
    { id: 'e1', source: 'app', target: 'imds', label: 'PUT /latest/api/token' },
    { id: 'e2', source: 'imds', target: 'app', label: 'IMDSv2 session token' },
    { id: 'e3', source: 'app', target: 'imds', label: 'GET role credentials + session token' },
    { id: 'e4', source: 'sts', target: 'imds', label: 'temporary credentials (rotated)' },
    { id: 'e5', source: 'imds', target: 'app', label: 'key ID, secret, session token, expiry' },
    { id: 'e6', source: 'app', target: 's3', label: 'signed GetObject request' },
    { id: 'e7', source: 's3', target: 'app', label: 'object (policy allowed)' },
  ],
  states: [
    {
      id: 'ir0',
      label: 'A role attached through an instance profile',
      description:
        'The instance was launched with an instance profile containing an IAM role. Launching an instance with a role requires iam:PassRole — a permission worth guarding, because it decides which roles new compute may run as.',
    },
    {
      id: 'ir1',
      label: 'Start an IMDSv2 session',
      description:
        'The SDK first sends a PUT request to the instance metadata service for a session token. Requiring IMDSv2 (session tokens) blocks many server-side request forgery attacks that can only send simple GET requests.',
    },
    { id: 'ir2', label: 'Session token issued', description: 'The metadata service returns a session token with a lifetime the caller chose.' },
    { id: 'ir3', label: 'Request the role credentials', description: 'The SDK asks for the role’s credentials, presenting the session token in a header.' },
    {
      id: 'ir4',
      label: 'Credentials come from STS',
      description: 'The credentials are temporary security credentials for the role. AWS rotates them automatically and makes new ones available before the old ones expire.',
    },
    { id: 'ir5', label: 'Temporary credentials delivered', description: 'The app receives an access key ID, a secret access key, a session token, and an expiration time. The SDK caches and refreshes them.' },
    { id: 'ir6', label: 'Signed request to S3', description: 'The SDK signs the S3 request with the temporary credentials (Signature Version 4).' },
    {
      id: 'ir7',
      label: 'Authorization by IAM policy',
      description:
        'S3 evaluates the role session’s policies and the bucket policy. The role allows s3:GetObject on this bucket, so the request succeeds. Valid credentials alone would not be enough.',
    },
  ],
};
