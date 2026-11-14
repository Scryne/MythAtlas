'use client';

import { toWorldMapPoint } from '@/lib/myth-utils';
import { WORLD_COUNTRIES, WORLD_HEIGHT, WORLD_WIDTH } from '@/lib/worldMap';

export interface MiniWorldMapMarker {
  id: string;
  label: string;
  lat: number;
  lng: number;
  color?: string;
}

interface MiniWorldMapProps {
  markers: MiniWorldMapMarker[];
  title?: string;
  highlightBox?: [number, number, number, number];
  className?: string;
}

const WIDTH = 360;
const HEIGHT = 180;

// Ülke yolları 1000×394 eşdikdörtgende, 84°K–58°G (src/data/world-110m.json); bu harita 360×180, 90°K–90°G.
const COUNTRY_TRANSFORM = `translate(0 ${90 - 84}) scale(${WIDTH / WORLD_WIDTH} ${(84 + 58) / WORLD_HEIGHT})`;

export default function MiniWorldMap({
  markers,
  title = 'Dünya bağlamı',
  highlightBox,
  className,
}: MiniWorldMapProps) {
  const box = highlightBox
    ? {
        leftTop: toWorldMapPoint(highlightBox[3], highlightBox[0], WIDTH, HEIGHT),
        rightBottom: toWorldMapPoint(highlightBox[1], highlightBox[2], WIDTH, HEIGHT),
      }
    : null;

  return (
    <div className={`ancient-card p-3 ${className || ''}`}>
      <h3 className="mb-2 text-sm uppercase tracking-[0.2em] text-gold/80">{title}</h3>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full rounded-md border border-gold/20 bg-[color:var(--color-map-mini-frame)]"
        role="img"
        aria-label={title}
      >
        <defs>
          <linearGradient id="map-ocean" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-map-mini-ocean)" />
            <stop offset="100%" stopColor="var(--color-bg-primary)" />
          </linearGradient>
        </defs>

        <rect width={WIDTH} height={HEIGHT} fill="url(#map-ocean)" />

        {[...Array(6)].map((_, idx) => {
          const y = 30 * (idx + 1);
          return (
            <line
              key={`lat-${y}`}
              x1={0}
              x2={WIDTH}
              y1={y}
              y2={y}
              stroke="rgb(var(--rgb-gold) / 0.12)"
              strokeWidth={0.8}
            />
          );
        })}

        {[...Array(11)].map((_, idx) => {
          const x = 30 * (idx + 1);
          return (
            <line
              key={`lng-${x}`}
              x1={x}
              x2={x}
              y1={0}
              y2={HEIGHT}
              stroke="rgb(var(--rgb-gold) / 0.1)"
              strokeWidth={0.8}
            />
          );
        })}

        {/* Önceden beş kaba kıta çokgeniydi; artık Natural Earth 1:110m ülke sınırları. */}
        <g
          transform={COUNTRY_TRANSFORM}
          fill="rgb(var(--rgb-map-continent) / 0.2)"
          stroke="rgb(var(--rgb-gold) / 0.3)"
          strokeWidth={1.4}
          strokeLinejoin="round"
        >
          {WORLD_COUNTRIES.map((country) => (
            <path key={country.name} d={country.d} />
          ))}
        </g>

        {box && (
          <rect
            x={Math.min(box.leftTop.x, box.rightBottom.x)}
            y={Math.min(box.leftTop.y, box.rightBottom.y)}
            width={Math.abs(box.rightBottom.x - box.leftTop.x)}
            height={Math.abs(box.rightBottom.y - box.leftTop.y)}
            fill="rgb(var(--rgb-gold) / 0.12)"
            stroke="rgb(var(--rgb-map-focus-box) / 0.7)"
            strokeDasharray="4 3"
          />
        )}

        {markers.map((marker) => {
          const point = toWorldMapPoint(marker.lat, marker.lng, WIDTH, HEIGHT);
          return (
            <g key={marker.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={6}
                fill={marker.color || 'var(--color-map-marker)'}
                opacity={0.2}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={3}
                fill={marker.color || 'var(--color-map-marker)'}
                stroke="var(--color-map-marker-stroke)"
                strokeWidth={1}
              />
              <title>{marker.label}</title>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-foreground/45">
        {markers.length} işaretli konum
      </p>
    </div>
  );
}
