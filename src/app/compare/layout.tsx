import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mitler Arası Karşılaştırma',
  description: 'İki mitolojiyi tanrılar, temalar ve anlatı öğeleri üzerinden yan yana karşılaştırın.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
