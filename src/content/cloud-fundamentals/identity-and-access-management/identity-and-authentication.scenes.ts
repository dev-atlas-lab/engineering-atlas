import type { SceneDefinition } from '../../../engines/visualization/types';

export const accessLifecycleScene: SceneDefinition = {
  id: 'access-decision-lifecycle',
  type: 'sequence',
  title: 'One request, from sign-in to audit record',
  nodes: [
    { id: 'user', type: 'user', label: 'Engineer', position: { x: 0, y: 0 }, data: { 'Principal type': 'Human identity', Wants: 'To restart a production VM' } },
    {
      id: 'idp',
      type: 'identity',
      label: 'Identity provider',
      position: { x: 0, y: 0 },
      data: { Does: 'Checks credentials and MFA, then issues signed tokens', Examples: 'Microsoft Entra ID, IAM Identity Center, an external IdP' },
    },
    {
      id: 'api',
      type: 'gateway',
      label: 'Cloud control plane',
      position: { x: 0, y: 0 },
      data: { Does: 'Receives every management request and enforces the access decision', Examples: 'Azure Resource Manager, AWS service APIs' },
    },
    {
      id: 'authz',
      type: 'policy',
      label: 'Authorization engine',
      position: { x: 0, y: 0 },
      data: { Evaluates: 'Role assignments or policies that apply to this principal, action, and resource', Default: 'Deny unless something allows' },
    },
    {
      id: 'log',
      type: 'storage',
      label: 'Audit log',
      position: { x: 0, y: 0 },
      data: { Records: 'Who, what action, which resource, when, from where, and the result', Examples: 'Azure Activity Log, AWS CloudTrail' },
    },
  ],
  edges: [
    { id: 'l1', source: 'user', target: 'idp', label: 'sign in: password + MFA' },
    { id: 'l2', source: 'idp', target: 'user', label: 'signed access token (expires)' },
    { id: 'l3', source: 'user', target: 'api', label: 'restart vm-prod-01 + token' },
    { id: 'l4', source: 'api', target: 'authz', label: 'principal, action, resource?' },
    { id: 'l5', source: 'authz', target: 'api', label: 'deny: no permission at this scope', flow: 'deny' },
    { id: 'l6', source: 'api', target: 'log', label: 'record request and decision' },
    { id: 'l7', source: 'api', target: 'user', label: '403 Forbidden', flow: 'deny' },
  ],
  states: [
    {
      id: 's0',
      label: 'Who or what is asking?',
      description:
        'An engineer wants to restart a production virtual machine. Before anything happens, the platform has to establish who is asking, whether they are allowed, and leave a record either way.',
    },
    {
      id: 's1',
      label: 'Authentication starts at the identity provider',
      description:
        'The engineer proves who they are to the identity provider — something they know (a password) plus something they have (a phone or security key). The cloud API never sees the password.',
    },
    {
      id: 's2',
      label: 'The identity provider issues a token',
      description:
        'After verifying the credentials, the identity provider issues a signed, short-lived token that says who the caller is. The token is the result of authentication; it does not by itself grant any permission.',
    },
    {
      id: 's3',
      label: 'The request carries the token',
      description:
        'The engineer’s tool sends the management request — “restart vm-prod-01” — with the token attached. The control plane verifies the token’s signature, issuer, audience, and expiry before trusting anything in it.',
    },
    {
      id: 's4',
      label: 'Authorization: principal, action, resource',
      description:
        'The control plane asks the authorization engine one precise question: may this principal perform this action on this resource? It gathers the role assignments or policies that apply.',
    },
    {
      id: 's5',
      label: 'The decision and its reason',
      description:
        'The engineer has read-only access on the production subscription. Nothing grants the restart action at any scope that contains this VM, so the default applies: deny. Authentication succeeded; authorization did not.',
    },
    {
      id: 's6',
      label: 'The attempt is audited',
      description:
        'The request is logged with the caller, action, resource, time, source address, and result — including the denial. Denied attempts are often the most useful audit records: they reveal misconfigurations and probing.',
    },
    {
      id: 's7',
      label: 'The caller receives the result',
      description:
        'The engineer receives a 403 Forbidden error. To fix it, someone with authority grants a role or policy at the right scope — ideally narrowly and for a limited time — and that change is itself audited.',
    },
  ],
};

export const oidcSsoScene: SceneDefinition = {
  id: 'oidc-single-sign-on',
  type: 'sequence',
  title: 'Single sign-on with OpenID Connect (authorization code flow)',
  nodes: [
    { id: 'user', type: 'user', label: 'User’s browser', position: { x: 0, y: 0 }, data: { Holds: 'Only a session cookie for each site — never the app’s client secret' } },
    {
      id: 'app',
      type: 'server',
      label: 'Web application',
      position: { x: 0, y: 0 },
      data: { Role: 'Relying party: trusts the identity provider instead of storing passwords', Registered: 'With the identity provider, including allowed redirect URLs' },
    },
    {
      id: 'idp',
      type: 'identity',
      label: 'Identity provider',
      position: { x: 0, y: 0 },
      data: { Role: 'Authenticates the user and issues tokens', 'Single sign-on': 'Its own session means the user signs in once for many apps' },
    },
  ],
  edges: [
    { id: 'o1', source: 'user', target: 'app', label: 'open the app' },
    { id: 'o2', source: 'app', target: 'user', label: 'redirect to the IdP' },
    { id: 'o3', source: 'user', target: 'idp', label: 'sign in (MFA) or reuse IdP session' },
    { id: 'o4', source: 'idp', target: 'user', label: 'redirect back with one-time code' },
    { id: 'o5', source: 'user', target: 'app', label: 'deliver the code' },
    { id: 'o6', source: 'app', target: 'idp', label: 'exchange code (app authenticates)' },
    { id: 'o7', source: 'idp', target: 'app', label: 'ID token (+ access token)' },
    { id: 'o8', source: 'app', target: 'user', label: 'app session established' },
  ],
  states: [
    {
      id: 'f0',
      label: 'An app that stores no passwords',
      description:
        'The web application is registered with an identity provider and trusts it to authenticate users. The app never sees or stores a password.',
    },
    { id: 'f1', label: 'The user opens the app', description: 'The user has no session with the app yet.' },
    {
      id: 'f2',
      label: 'Redirect to the identity provider',
      description:
        'The app redirects the browser to the identity provider with its client ID, the scopes it wants (at least “openid”), and a redirect URL that must match one registered in advance.',
    },
    {
      id: 'f3',
      label: 'The identity provider authenticates the user',
      description:
        'The user signs in with MFA — or, if they already have a session with the identity provider, is not prompted at all. That reuse of one session across many apps is single sign-on.',
    },
    {
      id: 'f4',
      label: 'A one-time authorization code',
      description:
        'The identity provider redirects back to the registered URL with a short-lived, single-use code. The code alone is not a token; it travels through the browser, so it is designed to be useless on its own.',
    },
    { id: 'f5', label: 'The browser delivers the code', description: 'The browser follows the redirect, handing the code to the app.' },
    {
      id: 'f6',
      label: 'Back-channel code exchange',
      description:
        'The app sends the code directly to the identity provider over TLS and authenticates itself (with a credential or a federated assertion, plus PKCE). This server-to-server step is what stops a stolen code from being redeemed by someone else.',
    },
    {
      id: 'f7',
      label: 'Tokens are issued',
      description:
        'The identity provider returns an ID token describing the user (issuer, subject, audience, expiry) and optionally an access token for calling an API. The app validates the ID token’s signature and claims.',
    },
    {
      id: 'f8',
      label: 'The app creates its own session',
      description:
        'The app sets its own session cookie. Disabling the user at the identity provider stops new sign-ins everywhere at once — although sessions and tokens already issued stay valid until they expire or are revoked.',
    },
  ],
  boundaries: [{ id: 'idp-trust', label: 'Trusted identity provider', kind: 'trust', nodeIds: ['idp'] }],
};
