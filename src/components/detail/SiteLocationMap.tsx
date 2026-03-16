'use client';

import { toWorldMapPoint } from '@/lib/myth-utils';

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

export default function SiteLocationMap({ center, label, nearby = [] }: SiteLocationMapProps) {
  const centerPoint = toWorldMapPoint(center.lat, center.lng, WIDTH, HEIGHT);

  return (
    <div className="ancient-card overflow-hidden">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-64 w-full"
        role="img"
        aria-label={`Map around ${label}`}
      >
        <defs>
          <linearGradient id="site-map-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-bg-surface)" />
            <stop offset="100%" stopColor="var(--color-bg-primary)" />
          </linearGradient>
        </defs>

        <rect width={WIDTH} height={HEIGHT} fill="url(#site-map-bg)" />

        <g fill="rgba(188,162,107,0.2)" stroke="rgba(201,168,76,0.25)" strokeWidth={0.7}>
          <path d="M35 50 L105 38 L138 62 L132 95 L92 120 L44 102 L30 72 Z" />
          <path d="M128 138 L146 162 L142 216 L118 226 L104 178 Z" />
          <path d="M166 52 L246 40 L306 58 L328 92 L304 108 L244 108 L210 122 L176 102 Z" />
          <path d="M240 132 L276 136 L292 172 L278 220 L236 232 L220 188 Z" />
          <path d="M328 148 L374 154 L404 182 L398 214 L352 220 L332 182 Z" />
        </g>

        {[...Array(8)].map((_, index) => (
          <line
            key={`lat-${index}`}
            x1={0}
            x2={WIDTH}
            y1={(HEIGHT / 7) * index}
            y2={(HEIGHT / 7) * index}
            stroke="rgba(201,168,76,0.1)"
            strokeWidth={0.7}
          />
        ))}

        {[...Array(10)].map((_, index) => (
          <line
            key={`lng-${index}`}
            x1={(WIDTH / 9) * index}
            x2={(WIDTH / 9) * index}
            y1={0}
            y2={HEIGHT}
            stroke="rgba(201,168,76,0.09)"
            strokeWidth={0.7}
          />
        ))}

        {nearby.map((item) => {
          const point = toWorldMapPoint(item.lat, item.lng, WIDTH, HEIGHT);
          return (
            <g key={item.id}>
              <circle cx={point.x} cy={point.y} r={4.2} fill="rgb(var(--rgb-gold-light))" fillOpacity={0.22} />
              <circle cx={point.x} cy={point.y} r={2.2} fill="rgb(var(--rgb-gold-light))" stroke="var(--color-bg-primary)" strokeWidth={0.8} />
              <title>{item.label}</title>
            </g>
          );
        })}

        <circle cx={centerPoint.x} cy={centerPoint.y} r={10} fill="var(--color-gold)" fillOpacity={0.26} />
        <circle cx={centerPoint.x} cy={centerPoint.y} r={4.2} fill="var(--color-gold-light)" stroke="var(--color-bg-surface)" strokeWidth={1.1} />
      </svg>
    </div>
  );
}
