import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kaynakça',
  description: 'Atlasta kullanılan birincil ve ikincil kaynakların tam listesi.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
