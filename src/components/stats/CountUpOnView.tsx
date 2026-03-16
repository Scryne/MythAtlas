'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpOnViewProps {
  value: number;
  durationMs?: number;
}

export default function CountUpOnView({ value, durationMs = 900 }: CountUpOnViewProps) {
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || started) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (media?.matches) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    let frame: number | null = null;

    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [durationMs, started, value]);

  return <span ref={hostRef}>{display}</span>;
}
