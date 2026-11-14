'use client';

import { useMemo } from 'react';
import type { ArtifactCountryDatum } from '@/lib/insights';
import { matchCountry } from '@/lib/worldMap';
import WorldChoropleth, { type ChoroplethRegion } from '@/components/stats/WorldChoropleth';

interface ArtifactCountryChoroplethProps {
  data: ArtifactCountryDatum[];
}

/** Müze koleksiyonlarındaki öne çıkan eserler, müzenin bugünkü ülkesine göre; ülke sınırları Natural Earth 1:110m. */
export default function ArtifactCountryChoropleth({ data }: ArtifactCountryChoroplethProps) {
  const regions = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const item of data) {
      const country = matchCountry(item.country);
      if (!country || item.artifactCount <= 0) continue;
      grouped.set(country, (grouped.get(country) ?? 0) + item.artifactCount);
    }
    return [...grouped.entries()].map(([country, value]): ChoroplethRegion => ({ country, value }));
  }, [data]);

  return (
    <WorldChoropleth
      regions={regions}
      unit="eser"
      tone="artifact"
      ariaLabel="Müzelerin bugünkü ülkesine göre eser sayısı haritası"
      note="Daha koyu ton = daha fazla kayıtlı eser."
    />
  );
}
