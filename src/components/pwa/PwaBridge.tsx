'use client';

import { useEffect, useState } from 'react';

export default function PwaBridge() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();

    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[70] w-[min(92vw,560px)] -translate-x-1/2 rounded-lg border border-gold/35 bg-ink/95 px-4 py-2 text-center text-sm text-parchment shadow-gold">
      Çevrimdışı modda sınırlı içerik mevcut
    </div>
  );
}
