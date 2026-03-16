'use client';

import { toWorldMapPoint } from '@/lib/myth-utils';

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

export default function MiniWorldMap({
  markers,
  title = 'World Context',
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
        className="h-auto w-full rounded-md border border-gold/20 bg-[#100d09]"
        role="img"
        aria-label={title}
      >
        <defs>
          <linearGradient id="map-ocean" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#16120e" />
            <stop offset="100%" stopColor="#0d0a07" />
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
              stroke="rgba(201,168,76,0.12)"
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
              stroke="rgba(201,168,76,0.1)"
              strokeWidth={0.8}
            />
          );
        })}

        <g fill="rgba(188,162,107,0.2)" stroke="rgba(201,168,76,0.25)" strokeWidth={0.8}>
          <path d="M28 34 L65 26 L94 40 L102 66 L86 88 L54 98 L30 80 L18 54 Z" />
          <path d="M96 92 L112 110 L116 142 L102 165 L86 142 L90 110 Z" />
          <path d="M126 36 L162 26 L204 32 L238 44 L262 62 L250 84 L216 82 L188 92 L168 112 L144 106 L128 78 Z" />
          <path d="M170 92 L196 96 L214 114 L208 146 L182 168 L160 154 L154 126 Z" />
          <path d="M258 112 L280 118 L298 132 L292 150 L268 152 L254 134 Z" />
        </g>

        {box && (
          <rect
            x={Math.min(box.leftTop.x, box.rightBottom.x)}
            y={Math.min(box.leftTop.y, box.rightBottom.y)}
            width={Math.abs(box.rightBottom.x - box.leftTop.x)}
            height={Math.abs(box.rightBottom.y - box.leftTop.y)}
            fill="rgba(201,168,76,0.12)"
            stroke="rgba(224,200,120,0.7)"
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
                fill={marker.color || '#f0d58d'}
                opacity={0.2}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={3}
                fill={marker.color || '#f0d58d'}
                stroke="#1a140d"
                strokeWidth={1}
              />
              <title>{marker.label}</title>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-foreground/45">
        {markers.length} marked location{markers.length === 1 ? '' : 's'}
      </p>
    </div>
  );
}
