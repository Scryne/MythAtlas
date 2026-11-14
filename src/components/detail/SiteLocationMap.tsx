'use client';

import { toWorldMapPoint } from '@/lib/myth-utils';
import { WORLD_COUNTRIES, WORLD_HEIGHT, WORLD_WIDTH } from '@/lib/worldMap';

interface NearbyMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

interface SiteLocationMapProps {
  center: { lat: number; lng: number };
  label: string;
  nearby?: NearbyMarker[];
}

const WIDTH = 460;
const HEIGHT = 260;
// Konum haritası alanın çevresini 3 kat yakın gösterir (önceden beş kaba kıta çokgenli bütün dünyaydı).
const ZOOM = 3;
const VIEW_W = WIDTH / ZOOM;
const VIEW_H = HEIGHT / ZOOM;
// Ülke yolları 1000×394 eşdikdörtgende, 84°K–58°G; bu harita 90°K–90°G.
const COUNTRY_TRANSFORM = `translate(0 ${((90 - 84) * HEIGHT) / 180}) scale(${WIDTH / WORLD_WIDTH} ${((84 + 58) * HEIGHT) / (180 * WORLD_HEIGHT)})`;

export default function SiteLocationMap({ center, label, nearby = [] }: SiteLocationMapProps) {
  const centerPoint = toWorldMapPoint(center.lat, center.lng, WIDTH, HEIGHT);
  const viewX = Math.min(Math.max(centerPoint.x - VIEW_W / 2, 0), WIDTH - VIEW_W);
  const viewY = Math.min(Math.max(centerPoint.y - VIEW_H / 2, 0), HEIGHT - VIEW_H);

  return (
    <div className="ancient-card overflow-hidden">
      <svg
        viewBox={`${viewX} ${viewY} ${VIEW_W} ${VIEW_H}`}
        className="h-64 w-full"
        role="img"
        aria-label={`${label} çevresi haritası`}
      >
        <defs>
          <linearGradient id="site-map-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-bg-surface)" />
            <stop offset="100%" stopColor="var(--color-bg-primary)" />
          </linearGradient>
        </defs>

        <rect width={WIDTH} height={HEIGHT} fill="url(#site-map-bg)" />

        <g
          transform={COUNTRY_TRANSFORM}
          fill="rgb(var(--rgb-map-continent) / 0.2)"
          stroke="rgb(var(--rgb-gold) / 0.35)"
          strokeWidth={0.6}
          strokeLinejoin="round"
        >
          {WORLD_COUNTRIES.map((country) => (
            <path key={country.name} d={country.d} />
          ))}
        </g>

        {[...Array(8)].map((_, index) => (
          <line
            key={`lat-${index}`}
            x1={0}
            x2={WIDTH}
            y1={(HEIGHT / 7) * index}
            y2={(HEIGHT / 7) * index}
            stroke="rgb(var(--rgb-gold) / 0.1)"
            strokeWidth={0.7 / ZOOM}
          />
        ))}

        {[...Array(10)].map((_, index) => (
          <line
            key={`lng-${index}`}
            x1={(WIDTH / 9) * index}
            x2={(WIDTH / 9) * index}
            y1={0}
            y2={HEIGHT}
            stroke="rgb(var(--rgb-gold) / 0.09)"
            strokeWidth={0.7 / ZOOM}
          />
        ))}

        {nearby.map((item) => {
          const point = toWorldMapPoint(item.lat, item.lng, WIDTH, HEIGHT);
          return (
            <g key={item.id}>
              <circle cx={point.x} cy={point.y} r={4.2 / ZOOM} fill="rgb(var(--rgb-gold-light))" fillOpacity={0.22} />
              <circle cx={point.x} cy={point.y} r={2.2 / ZOOM} fill="rgb(var(--rgb-gold-light))" stroke="var(--color-bg-primary)" strokeWidth={0.8 / ZOOM} />
              <title>{item.label}</title>
            </g>
          );
        })}

        <circle cx={centerPoint.x} cy={centerPoint.y} r={10 / ZOOM} fill="var(--color-gold)" fillOpacity={0.26} />
        <circle cx={centerPoint.x} cy={centerPoint.y} r={4.2 / ZOOM} fill="var(--color-gold-light)" stroke="var(--color-bg-surface)" strokeWidth={1.1 / ZOOM} />
      </svg>
    </div>
  );
}
