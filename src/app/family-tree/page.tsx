import type { Metadata } from 'next';
import FamilyTreePageClient from './FamilyTreePageClient.lazy';

export const metadata: Metadata = {
  title: 'Mythology Family Tree | MythAtlas',
  description:
    'Interactive influence network showing how mythologies shaped, borrowed from, and evolved across history.',
};

export default function FamilyTreePage() {
  return <FamilyTreePageClient />;
}
