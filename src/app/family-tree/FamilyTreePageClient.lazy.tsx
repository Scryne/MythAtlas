'use client';

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const FamilyTreePageClient = dynamic(() => import('@/components/family-tree/FamilyTreePageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner text="Mythology Family Tree yukleniyor..." />
    </div>
  ),
});

export default FamilyTreePageClient;
