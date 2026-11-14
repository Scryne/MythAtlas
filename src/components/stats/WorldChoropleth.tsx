'use client';

import { useMemo, useState } from 'react';
import { WORLD_COUNTRIES, WORLD_HEIGHT, WORLD_WIDTH, projectPoint } from '@/lib/worldMap';

export interface ChoroplethRegion {
  /** Haritadaki (Natural Earth) ülke adı. */
  country: string;
  value: number;
  /** Ayrıntı satırı, ör. bu ülkeye düşen mitolojiler. */
  detail?: string;
}

export interface ChoroplethPoint {
  id: string;
  label: string;
  lng: number;
  lat: number;
  value: number;
}

interface WorldChoroplethProps {
  regions: ChoroplethRegion[];
  /** Hiçbir ülke çokgenine düşmeyenler (küçük adalar, açık deniz) nokta olarak çizilir. */
  points?: ChoroplethPoint[];
  unit: string;
  ariaLabel: string;
  /** `--rgb-…` token adı: dolgu ve nokta rengi. */
  tone: 'myth' | 'artifact';
  note: string;
}

interface Tooltip {
  x: number;
  y: number;
  title: string;
  value: number;
  detail?: string;
}

const TONE_VAR = {
  myth: '--rgb-choropleth-myth',
  artifact: '--rgb-choropleth-artifact',
} as const;

function alphaFor(min: number, max: number, value: number): number {
  if (max <= min) return 0.75;
  return 0.28 + ((value - min) / (max - min)) * 0.67;
}

export default function WorldChoropleth({ regions, points = [], unit, ariaLabel, tone, note }: WorldChoroplethProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const toneVar = TONE_VAR[tone];

  const byCountry = useMemo(() => new Map(regions.map((region) => [region.country, region])), [regions]);
  const values = useMemo(() => [...regions.map((r) => r.value), ...points.map((p) => p.value)], [regions, points]);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;

  const ranked = useMemo(
    () =>
      [
        ...regions.map((r) => ({ key: r.country, label: r.country, value: r.value, detail: r.detail })),
        ...points.map((p) => ({ key: `nokta-${p.id}`, label: p.label, value: p.value, detail: undefined })),
      ].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
    [regions, points]
  );

  const show = (event: React.MouseEvent<SVGElement>, title: string, value: number, detail?: string) => {
    const bounds = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    setTooltip({ x: event.clientX - bounds.left + 14, y: event.clientY - bounds.top + 14, title, value, detail });
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-gold/20 bg-[color:var(--color-map-frame)] p-3">
      <svg
        viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
        role="img"
        aria-label={ariaLabel}
        className="block h-auto w-full"
        onMouseLeave={() => setTooltip(null)}
      >
        <rect x={0} y={0} width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="var(--color-map-sea)" />
        {WORLD_COUNTRIES.map((country) => {
          const region = byCountry.get(country.name);
          return (
            <path
              key={country.name}
              d={country.d}
              fill={region ? `rgb(var(${toneVar}) / ${alphaFor(min, max, region.value).toFixed(3)})` : 'var(--color-map-land-1)'}
              stroke={region ? `rgb(var(${toneVar}) / 0.9)` : 'rgb(var(--rgb-map-continent) / 0.18)'}
              strokeWidth={region ? 0.9 : 0.5}
              strokeLinejoin="round"
              onMouseMove={region ? (event) => show(event, country.name, region.value, region.detail) : undefined}
              onMouseLeave={region ? () => setTooltip(null) : undefined}
            />
          );
        })}
        {points.map((point) => {
          const [cx, cy] = projectPoint(point.lng, point.lat);
          return (
            <circle
              key={point.id}
              cx={cx}
              cy={cy}
              r={5}
              fill={`rgb(var(${toneVar}) / ${alphaFor(min, max, point.value).toFixed(3)})`}
              stroke={`rgb(var(${toneVar}) / 0.95)`}
              strokeWidth={1.2}
              onMouseMove={(event) => show(event, point.label, point.value)}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[11px] text-foreground/60">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span>{min}</span>
          <span
            className="h-2 w-24 rounded-full"
            style={{ background: `linear-gradient(90deg, rgb(var(${toneVar}) / 0.28), rgb(var(${toneVar}) / 0.95))` }}
          />
          <span>
            {max} {unit}
          </span>
        </div>
        <span>{note}</span>
      </div>

      <ol className="mt-3 grid grid-cols-1 gap-x-5 gap-y-1 text-xs text-foreground/75 sm:grid-cols-2">
        {ranked.slice(0, 6).map((row, index) => (
          <li key={row.key} className="flex min-w-0 items-baseline gap-2">
            <span className="w-4 shrink-0 tabular-nums text-foreground/45">{index + 1}</span>
            <span className="min-w-0 truncate" title={row.detail}>
              {row.label}
            </span>
            <span className="ml-auto shrink-0 tabular-nums text-gold-light">
              {row.value} {unit}
            </span>
          </li>
        ))}
      </ol>

      {ranked.length > 6 && (
        <details className="mt-2 text-xs text-foreground/70">
          <summary className="cursor-pointer text-foreground/60 hover:text-gold-light">Tümünü tablo olarak göster ({ranked.length})</summary>
          <table className="mt-2 w-full text-left">
            <thead className="text-foreground/50">
              <tr>
                <th scope="col" className="py-1 font-normal">Yer</th>
                <th scope="col" className="py-1 text-right font-normal">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row) => (
                <tr key={row.key} className="border-t border-gold/10">
                  <td className="py-1">
                    {row.label}
                    {row.detail && <span className="block text-[11px] text-foreground/45">{row.detail}</span>}
                  </td>
                  <td className="py-1 text-right tabular-nums">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      {tooltip && (
        <div
          className="pointer-events-none absolute max-w-[16rem] rounded-md border border-gold/20 bg-black/85 px-2 py-1 text-xs text-foreground"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="text-gold-light">{tooltip.title}</p>
          <p className="text-foreground/70">
            {tooltip.value} {unit}
          </p>
          {tooltip.detail && <p className="text-foreground/55">{tooltip.detail}</p>}
        </div>
      )}
    </div>
  );
}
