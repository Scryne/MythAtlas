import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Harita',
  description: 'Mitolojileri, kutsal alanları ve mitlerin geçtiği yerleri dünya haritasında görün.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
