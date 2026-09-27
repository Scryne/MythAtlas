'use client';

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

export default DeityEvolutionPageClient;
