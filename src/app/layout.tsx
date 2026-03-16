import type { Metadata } from 'next';
import { Cinzel, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import PwaBridge from '@/components/pwa/PwaBridge';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mythatlas.app'),
  title: {
    default: 'MythAtlas - Canli Mitoloji Atlasi',
    template: '%s | MythAtlas',
  },
  description:
    'Kadim medeniyetlerin mitlerini, tanrilarini ve kutsal alanlarini tek bir interaktif atlas uzerinden kesfedin.',
  keywords: [
    'mythology',
    'atlas',
    'interactive map',
    'Greek mythology',
    'Norse mythology',
    'Egyptian mythology',
    'mitoloji',
    'harita',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MythAtlas - Canli Mitoloji Atlasi',
    description: 'Kadim medeniyetlerin mitlerini, tanrilarini ve kutsal alanlarini tek bir interaktif atlas uzerinden kesfedin.',
    type: 'website',
    locale: 'tr_TR',
    alternateLocale: 'en_US',
    images: [
      {
        url: 'https://mythatlas.app/og/site/default',
        width: 1200,
        height: 630,
        alt: 'MythAtlas cover',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MythAtlas - Canli Mitoloji Atlasi',
    description: 'Kadim medeniyetlerin mitlerini, tanrilarini ve kutsal alanlarini tek bir interaktif atlas uzerinden kesfedin.',
    images: ['https://mythatlas.app/og/site/default'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`dark ${cinzel.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AppShell>{children}</AppShell>
        <PwaBridge />
      </body>
    </html>
  );
}



