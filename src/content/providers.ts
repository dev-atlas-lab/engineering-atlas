import type { ProviderId } from './types';

export interface Provider {
  id: ProviderId;
  name: string;
}

export const providers: Provider[] = [
  { id: 'azure', name: 'Microsoft Azure' },
  { id: 'aws', name: 'Amazon Web Services' },
];

export function findProvider(id: ProviderId): Provider {
  const provider = providers.find((p) => p.id === id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);
  return provider;
}
