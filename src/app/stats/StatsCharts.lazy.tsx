'use client';

import dynamic from 'next/dynamic';

const StatsCharts = dynamic(() => import('@/components/stats/StatsCharts'), {
  ssr: false,
  loading: () => (
    <div className="ancient-card skeleton-warm p-6 text-sm text-foreground/65">
      İstatistik grafikler yükleniyor...
    </div>
  ),
});

export default StatsCharts;
