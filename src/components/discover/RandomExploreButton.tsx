'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRandomExploreTarget } from '@/lib/insights';

export default function RandomExploreButton() {
  const router = useRouter();
  const [label, setLabel] = useState('Beni sasirt');
  const [spinning, setSpinning] = useState(false);

  const onClick = () => {
    if (spinning) return;
    const target = getRandomExploreTarget();
    setLabel(`${target.label} ->`);
    setSpinning(true);
    window.setTimeout(() => {
      router.push(target.href);
      setSpinning(false);
    }, 420);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-5 py-2 text-sm tracking-[0.08em] text-gold-light transition hover:border-gold/55 hover:bg-gold/20"
    >
      <span className={spinning ? 'inline-block animate-spin' : 'inline-block'}>✦</span>
      {label}
    </button>
  );
}
