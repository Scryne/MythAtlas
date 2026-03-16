'use client';

import { useEffect, useState } from 'react';

const DISCOVERY_COUNT_KEY = 'mythatlas:discovered-count';

function readCount(): number {
  try {
    const raw = window.localStorage.getItem(DISCOVERY_COUNT_KEY);
    const value = Number(raw || 0);
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  } catch {
    return 0;
  }
}

function writeCount(value: number) {
  try {
    window.localStorage.setItem(DISCOVERY_COUNT_KEY, String(Math.max(0, Math.floor(value))));
  } catch {
    // ignore storage failures
  }
}

export function IncrementDiscoveryCounter() {
  useEffect(() => {
    const current = readCount();
    writeCount(current + 1);
  }, []);

  return null;
}

export function DiscoveryCounterBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(readCount());

    const sync = () => setCount(readCount());
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs text-gold-light">
      {count} icerik kesfettin
    </span>
  );
}
