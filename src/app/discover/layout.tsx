import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Keşfet',
  description: 'Günün miti, rastgele tanrılar ve kültürler arası bağlantılarla atlası keşfedin.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
