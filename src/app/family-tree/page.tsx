import type { Metadata } from 'next';
import FamilyTreePageClient from './FamilyTreePageClient.lazy';

export const metadata: Metadata = {
  title: 'Mitoloji Aile Ağacı',
  description:
    'Mitolojilerin tarih boyunca birbirini nasıl biçimlendirdiğini, birbirinden neler aldığını ve nasıl evrildiğini gösteren etkileşimli etki ağı.',
};

export default function FamilyTreePage() {
  return <FamilyTreePageClient />;
}
