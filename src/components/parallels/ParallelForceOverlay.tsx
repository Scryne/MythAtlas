'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ParallelVersion } from '@/lib/parallels-data';

interface PositionedNode extends ParallelVersion {
  x: number;
  y: number;
}

interface ParallelForceOverlayProps {
  versions: ParallelVersion[];
  color: string;
}

const WIDTH = 520;
const HEIGHT = 240;

export default function ParallelForceOverlay({ versions, color }: ParallelForceOverlayProps) {
  const [nodes, setNodes] = useState<PositionedNode[]>([]);

  const seedNodes = useMemo(
    () =>
      versions.slice(0, 12).map((version, index) => ({
        ...version,
        x: (WIDTH / Math.max(versions.length, 1)) * index + 30,
        y: HEIGHT / 2,
      })),
    [versions]
  );

  useEffect(() => {
    let stopped = false;

    const run = async () => {
      const { forceCenter, forceCollide, forceManyBody, forceSimulation } = await import('d3-force');
      if (stopped) return;

      const local = seedNodes.map((node) => ({ ...node }));
      const simulation = forceSimulation(local as any)
        .force('charge', forceManyBody().strength(-120))
        .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
        .force('collision', forceCollide().radius(20))
        .alphaDecay(0.06);

      simulation.on('tick', () => {
        setNodes(local.map((node) => ({ ...node })));
      });

      window.setTimeout(() => {
        simulation.stop();
        setNodes(local.map((node) => ({ ...node })));
      }, 700);
    };

    run();
    return () => {
      stopped = true;
    };
  }, [seedNodes]);

  if (!nodes.length) {
    return <div className="h-[240px] w-full rounded-lg border border-gold/15 bg-black/20" />;
  }

  return (
    <div className="rounded-lg border border-gold/15 bg-black/20 p-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[240px] w-full" role="img" aria-label="Parallel myth force network">
        <rect width={WIDTH} height={HEIGHT} fill="#0b0907" rx={12} />
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x},${node.y})`}>
            <circle r={8} fill={color} fillOpacity={0.32} stroke={color} strokeWidth={1} />
            <text y={-12} textAnchor="middle" className="fill-[#e8d6ac] text-[9px]" fontFamily="var(--font-inter)">
              {node.mythName.slice(0, 10)}
            </text>
          </g>
        ))}
      </svg>
      <p className="meta-text mt-1 text-xs">D3 force yerlesimi, tema varyantlarinin yogunluk desenini gosterir.</p>
    </div>
  );
}
