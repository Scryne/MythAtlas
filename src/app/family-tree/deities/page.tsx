import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const metadata: Metadata = {
  title: 'Deity Evolution Chains | MythAtlas',
  description: 'Track how deity identities evolved and transformed across mythological traditions.',
};

const DeityEvolutionPageClient = dynamic(
  () => import('@/components/family-tree/DeityEvolutionPageClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner text="Deity evolution zincirleri yukleniyor..." />
      </div>
    ),
  }
);

export default function DeityEvolutionPage() {
  return <DeityEvolutionPageClient />;
}
