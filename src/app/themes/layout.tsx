import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tema Gezgini',
  description: 'Yaratılış, ölüm, tufan, kahramanlık gibi temalara göre mitler.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
