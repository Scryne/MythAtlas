import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arkeoloji Merkezi',
  description: 'Kazı alanları, buluntular ve müze koleksiyonlarıyla mitolojinin maddi izleri.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
