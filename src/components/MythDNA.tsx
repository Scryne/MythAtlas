'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MythData } from '@/lib/myth-data';
import {
  DNA_ARCHETYPE_UNIVERSE,
  DNA_ELEMENT_UNIVERSE,
  formatDNAKeyLabel,
  getDNAFingerprint,
} from '@/lib/dna';

type MythDNASize = 'full' | 'compact' | 'mini';

interface MythDNAProps {
  myth: MythData;
  size?: MythDNASize;
  className?: string;
  showRadar?: boolean;
  showFingerprint?: boolean;
  showHoverLegend?: boolean;
}

interface DNABarProps {
  myth: MythData;
  size?: MythDNASize;
  showHoverLegend?: boolean;
}

interface ArchetypeRadarProps {
  myth: MythData;
  size?: MythDNASize;
}

interface FingerprintProps {
  myth: MythData;
}

const SIZE_STYLES: Record<MythDNASize, { segmentHeight: string; segmentGap: string }> = {
  full: { segmentHeight: 'h-6', segmentGap: 'gap-1.5' },
  compact: { segmentHeight: 'h-4', segmentGap: 'gap-1' },
  mini: { segmentHeight: 'h-5', segmentGap: 'gap-[2px]' },
};

export function DNABar({ myth, size = 'full', showHoverLegend = false }: DNABarProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const present = useMemo(() => new Set(myth.dna.elements || []), [myth.dna.elements]);

  useEffect(() => {
    setVisibleCount(0);
    const timers = DNA_ELEMENT_UNIVERSE.map((_, index) =>
      window.setTimeout(() => {
        setVisibleCount(index + 1);
      }, index * 30)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [myth.id]);

  const presentLabels = DNA_ELEMENT_UNIVERSE.filter((item) => present.has(item)).map(formatDNAKeyLabel);

  return (
    <div className={`group relative ${size === 'mini' ? 'min-h-[20px]' : ''}`}>
      <div className={`flex w-full ${SIZE_STYLES[size].segmentGap}`}>
        {DNA_ELEMENT_UNIVERSE.map((element, index) => {
          const filled = present.has(element);
          const revealed = index < visibleCount;

          return (
            <div
              key={`${myth.id}-${element}`}
              title={formatDNAKeyLabel(element)}
              className={`${SIZE_STYLES[size].segmentHeight} flex-1 rounded-sm border border-gold/20 transition-all duration-300`}
              style={{
                backgroundColor: revealed
                  ? filled
                    ? 'rgba(233, 190, 94, 0.9)'
                    : 'rgba(27, 20, 12, 0.92)'
                  : 'rgba(11, 9, 7, 0.85)',
                boxShadow: revealed && filled ? '0 0 8px rgba(233,190,94,0.35)' : 'none',
              }}
            />
          );
        })}
      </div>

      {showHoverLegend && presentLabels.length > 0 && (
        <div className="pointer-events-none absolute left-0 right-0 top-full z-20 mt-1 max-h-28 overflow-y-auto rounded-md border border-gold/20 bg-[#0f0a06]/95 p-2 text-[10px] text-gold-light opacity-0 transition-opacity group-hover:opacity-100">
          {presentLabels.join(' · ')}
        </div>
      )}
    </div>
  );
}

export function ArchetypeRadar({ myth, size = 'full' }: ArchetypeRadarProps) {
  const [expanded, setExpanded] = useState(0);
  const archetypes = useMemo(() => new Set(myth.dna.archetypes || []), [myth.dna.archetypes]);

  useEffect(() => {
    setExpanded(0);
    const frame = window.requestAnimationFrame(() => setExpanded(1));
    return () => window.cancelAnimationFrame(frame);
  }, [myth.id]);

  const boxSize = size === 'full' ? 260 : 200;
  const center = boxSize / 2;
  const radius = size === 'full' ? 92 : 70;

  const points = DNA_ARCHETYPE_UNIVERSE.map((archetype, index) => {
    const angle = (-Math.PI / 2) + (index / DNA_ARCHETYPE_UNIVERSE.length) * Math.PI * 2;
    const value = archetypes.has(archetype) ? 1 : 0.16;
    const r = radius * value;

    return {
      archetype,
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      axisX: center + Math.cos(angle) * radius,
      axisY: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * (radius + 16),
      labelY: center + Math.sin(angle) * (radius + 16),
    };
  });

  const polygon = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${boxSize} ${boxSize}`} className="h-auto w-full max-w-[280px]">
      {[0.25, 0.5, 0.75, 1].map((step) => {
        const ring = DNA_ARCHETYPE_UNIVERSE.map((_, index) => {
          const angle = (-Math.PI / 2) + (index / DNA_ARCHETYPE_UNIVERSE.length) * Math.PI * 2;
          const x = center + Math.cos(angle) * radius * step;
          const y = center + Math.sin(angle) * radius * step;
          return `${x},${y}`;
        }).join(' ');

        return <polygon key={`ring-${step}`} points={ring} fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="1" />;
      })}

      {points.map((point) => (
        <line key={`axis-${point.archetype}`} x1={center} y1={center} x2={point.axisX} y2={point.axisY} stroke="rgba(201,168,76,0.16)" strokeWidth="1" />
      ))}

      <polygon
        points={polygon}
        fill="rgba(233,190,94,0.4)"
        stroke="rgba(233,190,94,0.95)"
        strokeWidth="2"
        style={{
          transformOrigin: `${center}px ${center}px`,
          transform: `scale(${expanded})`,
          transition: 'transform 700ms cubic-bezier(0.22,1,0.36,1)',
        }}
      />

      {size === 'full' &&
        points.map((point) => (
          <text
            key={`label-${point.archetype}`}
            x={point.labelX}
            y={point.labelY}
            fontSize="9"
            textAnchor="middle"
            fill="rgba(240,213,141,0.72)"
          >
            {formatDNAKeyLabel(point.archetype)}
          </text>
        ))}
    </svg>
  );
}

export function DNAFingerprint({ myth }: FingerprintProps) {
  const [copied, setCopied] = useState(false);
  const fingerprint = getDNAFingerprint(myth);

  const copyFingerprint = async () => {
    try {
      await navigator.clipboard.writeText(fingerprint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded-md border border-gold/20 bg-black/30 px-3 py-2 font-mono text-xs md:text-sm">
          {fingerprint.split('').map((char, index) => (
            <span
              key={`${myth.id}-fp-${index}`}
              style={{
                color: char === '1' ? '#f0d58d' : '#3a2a16',
                textShadow: char === '1' ? '0 0 6px rgba(240,213,141,0.5)' : 'none',
              }}
            >
              {char}
            </span>
          ))}
        </code>
        <button
          type="button"
          onClick={copyFingerprint}
          className="rounded-full border border-gold/30 px-3 py-1 text-xs text-gold-light hover:border-gold/55"
        >
          {copied ? 'Kopyalandi' : 'Parmak izi kopyala'}
        </button>
      </div>
      {copied && (
        <div className="fixed bottom-4 right-4 z-50 rounded-md border border-emerald-300/45 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100">
          Parmak izi kopyalandi
        </div>
      )}
    </div>
  );
}

export default function MythDNA({
  myth,
  size = 'full',
  className,
  showRadar = true,
  showFingerprint = true,
  showHoverLegend = false,
}: MythDNAProps) {
  if (!myth.dna) return null;

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <DNABar myth={myth} size={size} showHoverLegend={showHoverLegend} />
      {showRadar && size !== 'mini' && <ArchetypeRadar myth={myth} size={size} />}
      {showFingerprint && size !== 'mini' && <DNAFingerprint myth={myth} />}
    </div>
  );
}

