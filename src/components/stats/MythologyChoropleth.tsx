'use client';

import { useMemo, useState } from 'react';
import type { MythologyHeatDatum } from '@/lib/insights';

interface ChoroplethProps {
  data: MythologyHeatDatum[];
}

interface TooltipState {
  x: number;
  y: number;
  name: string;
  count: number;
}

const WIDTH = 920;
const HEIGHT = 420;

function projectLng(lng: number): number {
  return ((lng + 180) / 360) * WIDTH;
}

function projectLat(lat: number): number {
  return ((90 - lat) / 180) * HEIGHT;
}

function intensity(min: number, max: number, value: number): number {
  if (max <= min) return 0.55;
  return 0.2 + ((value - min) / (max - min)) * 0.8;
}

export default function MythologyChoropleth({ data }: ChoroplethProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const stats = useMemo(() => {
    const counts = data.map((item) => item.mythCount);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    return { min, max };
  }, [data]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-gold/20 bg-[#0d0b08] p-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Mythologies by region choropleth"
        className="h-[380px] w-full"
      >
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#0b0907" />

        <path d="M62 94 L255 66 L308 152 L252 210 L76 194 Z" fill="#15120e" />
        <path d="M272 70 L496 66 L598 152 L536 224 L368 246 L292 173 Z" fill="#14110d" />
        <path d="M300 224 L389 213 L431 348 L327 362 Z" fill="#13100c" />
        <path d="M548 270 L772 266 L846 331 L781 376 L582 358 Z" fill="#14110d" />
        <path d="M713 147 L828 132 L876 189 L826 238 L732 224 Z" fill="#15120e" />

        {data.map((item) => {
          const [west, south, east, north] = item.boundingBox;
          const x = projectLng(west);
          const y = projectLat(north);
          const w = Math.max(4, projectLng(east) - projectLng(west));
          const h = Math.max(4, projectLat(south) - projectLat(north));

          const alpha = intensity(stats.min, stats.max, item.mythCount);
          const fill = `rgba(201, 168, 76, ${alpha.toFixed(3)})`;

          return (
            <rect
              key={item.id}
              x={x}
              y={y}
              width={w}
              height={h}
              fill={fill}
              stroke="rgba(255,230,160,0.45)"
              strokeWidth={0.8}
              onMouseMove={(event) => {
                const bounds = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setTooltip({
                  x: event.clientX - bounds.left + 14,
                  y: event.clientY - bounds.top + 14,
                  name: item.name,
                  count: item.mythCount,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-between text-[11px] text-foreground/45">
        <span>Daha koyu ton = daha fazla mit</span>
        <span>
          Min: {stats.min} · Max: {stats.max}
        </span>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none absolute rounded-md border border-gold/20 bg-black/85 px-2 py-1 text-xs text-foreground"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="text-gold-light">{tooltip.name}</p>
          <p className="text-foreground/70">{tooltip.count} mit</p>
        </div>
      )}
    </div>
  );
}

