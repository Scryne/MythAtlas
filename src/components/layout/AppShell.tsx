'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RouteTransition from '@/components/ui/RouteTransition';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';

interface AppShellProps {
  children: React.ReactNode;
}

const footerlessRoutePatterns = [/^\/map(?:\/.*)?$/];

const SearchModal = dynamic(() => import('@/components/SearchModal'), {
  ssr: false,
  loading: () => null,
});

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const showFooter = useMemo(
    () => !footerlessRoutePatterns.some((pattern) => pattern.test(pathname)),
    [pathname]
  );

  useEffect(() => {
    if (pathname === '/map') return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <>
      <div className="flex min-h-screen flex-col texture-overlay">
        <Header />
        <main className="relative z-0 flex-1">
          <RouteTransition>{children}</RouteTransition>
        </main>
        {showFooter ? <Footer /> : null}
      </div>
      <ScrollToTopButton />
      <SearchModal />
    </>
  );
}
