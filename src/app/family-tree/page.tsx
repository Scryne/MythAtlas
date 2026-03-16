import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const metadata: Metadata = {
  title: 'Mythology Family Tree | MythAtlas',
  description:
    'Interactive influence network showing how mythologies shaped, borrowed from, and evolved across history.',
};

const FamilyTreePageClient = dynamic(() => import('@/components/family-tree/FamilyTreePageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner text="Mythology Family Tree yukleniyor..." />
    </div>
  ),
});

export default function FamilyTreePage() {
  return <FamilyTreePageClient />;
}
