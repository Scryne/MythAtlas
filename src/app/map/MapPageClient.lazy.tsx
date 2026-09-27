'use client';

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const MapPageClient = dynamic(() => import('@/components/map/MapPageClient'), {
  ssr: false,
  loading: () => (
    <div className="skeleton-warm flex min-h-screen items-center justify-center bg-background text-foreground/80">
      <LoadingSpinner text="Harita yukleniyor..." />
    </div>
  ),
});

export default MapPageClient;
