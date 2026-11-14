'use client';

import { useMemo } from 'react';
import type { MythologyHeatDatum } from '@/lib/insights';
import { countryAt } from '@/lib/worldMap';
import WorldChoropleth, { type ChoroplethPoint, type ChoroplethRegion } from '@/components/stats/WorldChoropleth';

interface ChoroplethProps {
  data: MythologyHeatDatum[];
}

/**
 * Her mitoloji, köken noktasının düştüğü bugünkü ülkeye sayılır; bir ülkeye düşen mitolojilerin mit sayıları toplanır.
 * Köken noktası hiçbir ülke çokgeninde değilse (ada, açık deniz) mitoloji nokta olarak çizilir.
 * Önceden mitolojilerin sınır kutuları kaba bir kıta silüeti üstüne dikdörtgen olarak çiziliyordu.
 */
export default function MythologyChoropleth({ data }: ChoroplethProps) {
  const { regions, points } = useMemo(() => {
    const grouped = new Map<string, { value: number; names: string[] }>();
    const loose: ChoroplethPoint[] = [];
    for (const item of data) {
      const country = countryAt(item.origin.lng, item.origin.lat);
      if (!country) {
        loose.push({ id: item.id, label: item.name, lng: item.origin.lng, lat: item.origin.lat, value: item.mythCount });
        continue;
      }
      const bucket = grouped.get(country) ?? { value: 0, names: [] };
      bucket.value += item.mythCount;
      bucket.names.push(item.name);
      grouped.set(country, bucket);
    }
    const rows: ChoroplethRegion[] = [...grouped.entries()].map(([country, bucket]) => ({
      country,
      value: bucket.value,
      detail: bucket.names.join(', '),
    }));
    return { regions: rows, points: loose };
  }, [data]);

  return (
    <WorldChoropleth
      regions={regions}
      points={points}
      unit="mit"
      tone="myth"
      ariaLabel="Mitolojilerin köken ülkelerine göre mit sayısı haritası"
      note="Ülke: mitolojinin köken noktasının bugünkü ülkesi. Daha koyu ton = daha fazla mit."
    />
  );
}
