import type { SceneDefinition } from '../../../engines/visualization/types';

export const dnsResolutionScene: SceneDefinition = {
  id: 'dns-resolution',
  type: 'sequence',
  title: 'Recursive resolution of www.example.com',
  nodes: [
    { id: 'client', type: 'client', label: 'Client', position: { x: 0, y: 0 }, data: { Runs: 'A stub resolver that asks one recursive resolver and waits' } },
    {
      id: 'resolver',
      type: 'server',
      label: 'Recursive resolver',
      position: { x: 0, y: 0 },
      data: { Does: 'Follows referrals on the client’s behalf and caches answers for their TTL', 'In the cloud': 'Provided inside every virtual network' },
    },
    { id: 'root', type: 'server', label: 'Root server', position: { x: 0, y: 0 }, data: { Knows: 'Which servers are authoritative for each top-level domain' } },
    { id: 'tld', type: 'server', label: '.com TLD server', position: { x: 0, y: 0 }, data: { Knows: 'Which servers are authoritative for each .com domain' } },
    {
      id: 'auth',
      type: 'server',
      label: 'Authoritative server',
      position: { x: 0, y: 0 },
      data: { Holds: 'The example.com zone and its records', 'In the cloud': 'Azure DNS or Amazon Route 53 can host this zone' },
    },
  ],
  edges: [
    { id: 'd1', source: 'client', target: 'resolver', label: 'www.example.com A?' },
    { id: 'd2', source: 'resolver', target: 'root', label: 'www.example.com A?' },
    { id: 'd3', source: 'root', target: 'resolver', label: 'referral: .com servers' },
    { id: 'd4', source: 'resolver', target: 'tld', label: 'www.example.com A?' },
    { id: 'd5', source: 'tld', target: 'resolver', label: 'referral: example.com servers' },
    { id: 'd6', source: 'resolver', target: 'auth', label: 'www.example.com A?' },
    { id: 'd7', source: 'auth', target: 'resolver', label: 'A 203.0.113.80, TTL 300' },
    { id: 'd8', source: 'resolver', target: 'client', label: 'A 203.0.113.80' },
  ],
  states: [
    { id: 'r0', label: 'Nothing cached', description: 'The client wants the IPv4 address (an A record) for www.example.com, and the resolver has no cached answer.' },
    { id: 'r1', label: 'Client asks its resolver', description: 'The client sends one query to its configured recursive resolver and leaves the rest of the work to it.' },
    { id: 'r2', label: 'Resolver asks a root server', description: 'With nothing cached, the resolver starts at the root of the DNS hierarchy.' },
    { id: 'r3', label: 'Referral to .com', description: 'The root does not know the answer; it refers the resolver to the servers responsible for .com. Resolvers cache this referral, so this step is rarely repeated.' },
    { id: 'r4', label: 'Resolver asks the .com servers', description: 'The resolver repeats the question to a .com server.' },
    { id: 'r5', label: 'Referral to example.com', description: 'The .com servers refer the resolver to the name servers listed for example.com — the delegation you configure at your domain registrar.' },
    { id: 'r6', label: 'Resolver asks the authoritative server', description: 'Finally the resolver asks a server that holds the example.com zone.' },
    { id: 'r7', label: 'Authoritative answer', description: 'The authoritative server returns the record and its time to live (TTL): resolvers may cache this answer for 300 seconds.' },
    { id: 'r8', label: 'Answer returned and cached', description: 'The client gets the address. For the next 300 seconds, any client of this resolver gets the cached answer immediately — which is also why changing a record takes up to its TTL to be seen everywhere.' },
  ],
};
