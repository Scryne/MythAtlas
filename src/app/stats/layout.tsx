import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'İstatistik ve İçgörüler',
  description: 'Atlas verisinin dağılımı: mitolojiler, tanrılar, alanlar ve kaynaklar.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
