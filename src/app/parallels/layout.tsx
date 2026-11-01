import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ortak Hikâye Haritası',
  description: 'Farklı kültürlerde tekrar eden mit kalıpları ve paralel anlatılar.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
