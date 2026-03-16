'use client';

import { timelinePointsFromEra } from '@/lib/myth-utils';

interface TimelineChartProps {
  era: string;
}

export default function TimelineChart({ era }: TimelineChartProps) {
  const points = timelinePointsFromEra(era);
  const years = points.map((point) => point.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const span = Math.max(1, maxYear - minYear);

  return (
    <div className="ancient-card p-4">
      <h3 className="mb-3 text-sm uppercase tracking-[0.2em] text-gold/80">
        Historical Timeline
      </h3>
      <div className="rounded-lg border border-gold/15 bg-black/20 p-4">
        <div className="relative h-16">
          <div className="absolute left-0 right-0 top-8 h-[2px] rounded-full bg-gold/25" />
          {points.map((point) => {
            const left = ((point.year - minYear) / span) * 100;
            return (
              <div
                key={point.label}
                className="absolute -translate-x-1/2"
                style={{ left: `${left}%`, top: '16px' }}
                title={`${point.label}: ${point.displayYear}`}
              >
                <div className="h-3 w-3 rounded-full border-2 border-[#2a1f14] bg-[#f0d68e]" />
                <p className="mt-2 whitespace-nowrap text-[11px] text-[#d3bf93]">{point.label}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-foreground/55">
          <span>{points[0]?.displayYear}</span>
          <span>{points[points.length - 1]?.displayYear}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-foreground/50">{era}</p>
    </div>
  );
}
