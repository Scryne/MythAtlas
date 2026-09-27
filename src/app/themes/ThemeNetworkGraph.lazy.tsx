'use client';

import dynamic from 'next/dynamic';

const ThemeNetworkGraph = dynamic(() => import('@/components/themes/ThemeNetworkGraph'), {
  ssr: false,
  loading: () => <div className="skeleton-warm h-[460px] w-full rounded-xl border border-gold/20 bg-black/25" />,
});

export default ThemeNetworkGraph;
