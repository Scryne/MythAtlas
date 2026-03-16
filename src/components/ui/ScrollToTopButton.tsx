'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTopButton() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (pathname === '/map') return null;

  return (
    <button
      type="button"
      aria-label="Sayfa basina don"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`app-button app-button-icon fixed bottom-5 right-5 z-40 h-11 w-11 shadow-[var(--shadow-card)] transition-all ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      ↑
    </button>
  );
}
