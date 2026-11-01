import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kutsal Alanlar',
  description: 'Dünya üzerindeki tapınaklar, kutsal dağlar ve ritüel alanları.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
