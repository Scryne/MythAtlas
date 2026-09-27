import type { Metadata } from 'next';
import DeityEvolutionPageClient from './DeityEvolutionPageClient.lazy';

export const metadata: Metadata = {
  title: 'Deity Evolution Chains | MythAtlas',
  description: 'Track how deity identities evolved and transformed across mythological traditions.',
};

export default function DeityEvolutionPage() {
  return <DeityEvolutionPageClient />;
}
