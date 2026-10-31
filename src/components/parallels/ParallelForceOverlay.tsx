'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ParallelVersion } from '@/lib/parallels-data';

interface PositionedNode extends ParallelVersion {
  x: number;
  y: number;
}

interface MotifLink {
  source: string;
  target: string;
  shared: number;
}

interface ParallelForceOverlayProps {
  versions: ParallelVersion[];
  color: string;
}

const WIDTH = 520;
const HEIGHT = 260;
const MAX_NODES = 12;

/** İki varyantın ortak motif sayısı; bağ kalınlığı buna göre. */
function sharedMotifs(a: ParallelVersion, b: ParallelVersion): number {
  const set = new Set(a.motifs.map((m) => m.toLocaleLowerCase('tr')));
  return b.motifs.filter((m) => set.has(m.toLocaleLowerCase('tr'))).length;
}

export default function ParallelForceOverlay({ versions, color }: ParallelForceOverlayProps) {
  const [nodes, setNodes] = useState<PositionedNode[]>([]);

  // Düğümler daire üzerinde başlar. Eskiden hepsi aynı y'de başlıyordu; itme ve merkez kuvvetleri
  // simetrik olduğu için düşey bileşen hiç oluşmuyor, "ağ" kalıcı olarak düz bir çizgi kalıyordu.
  const seedNodes = useMemo(() => {
    const list = versions.slice(0, MAX_NODES);
    return list.map((version, index) => {
      const angle = (index / Math.max(list.length, 1)) * Math.PI * 2;
      return { ...version, x: WIDTH / 2 + Math.cos(angle) * 90, y: HEIGHT / 2 + Math.sin(angle) * 70 };
    });
  }, [versions]);

  // Ortak motifi olan varyantlar bağlanır: ağın yoğunluğu temanın ne kadar ortak dil taşıdığını gösterir.
  const links = useMemo<MotifLink[]>(() => {
    const out: MotifLink[] = [];
    for (let i = 0; i < seedNodes.length; i += 1) {
      for (let j = i + 1; j < seedNodes.length; j += 1) {
        const shared = sharedMotifs(seedNodes[i], seedNodes[j]);
        if (shared > 0) out.push({ source: seedNodes[i].id, target: seedNodes[j].id, shared });
      }
    }
    return out;
  }, [seedNodes]);

  useEffect(() => {
    let stopped = false;

    const run = async () => {
      const { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } = await import('d3-force');
      if (stopped) return;

      const local = seedNodes.map((node) => ({ ...node }));
      const simLinks = links.map((link) => ({ ...link }));
      const simulation = forceSimulation(local as never)
        .force('charge', forceManyBody().strength(-140))
        .force(
          'link',
          forceLink(simLinks as never)
            .id((d: unknown) => (d as PositionedNode).id)
            .distance((l: unknown) => 120 - Math.min(3, (l as MotifLink).shared) * 20)
        )
        .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
        .force('collision', forceCollide().radius(26))
        .stop();

      // Yerleşim ekranda oynatılmadan hesaplanır: hareket bilgi taşımıyor, yalnız sonuç önemli.
      for (let i = 0; i < 220; i += 1) simulation.tick();
      if (stopped) return;
      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
      setNodes(local.map((node) => ({ ...node, x: clamp(node.x, 40, WIDTH - 40), y: clamp(node.y, 24, HEIGHT - 16) })));
    };

    void run();
    return () => {
      stopped = true;
    };
  }, [seedNodes, links]);

  if (!nodes.length) {
    return <div className="h-[260px] w-full rounded-lg border border-gold/15 bg-black/20" />;
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div className="rounded-lg border border-gold/15 bg-black/20 p-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[260px] w-full" role="img" aria-label="Ortak motif ağı">
        <rect width={WIDTH} height={HEIGHT} fill="var(--color-bg-primary)" rx={12} />
        {links.map((link) => {
          const a = byId.get(link.source);
          const b = byId.get(link.target);
          if (!a || !b) return null;
          return (
            <line
              key={`${link.source}-${link.target}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={color}
              strokeOpacity={0.18 + Math.min(3, link.shared) * 0.14}
              strokeWidth={Math.min(3, link.shared)}
            />
          );
        })}
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x},${node.y})`}>
            <title>{`${node.mythName} · ${node.culture}`}</title>
            <circle r={8} fill={color} fillOpacity={0.32} stroke={color} strokeWidth={1} />
            <text y={-12} textAnchor="middle" className="fill-parchment-dim text-[9px]" fontFamily="var(--font-inter)">
              {node.mythName.length > 16 ? `${node.mythName.slice(0, 15)}…` : node.mythName}
            </text>
          </g>
        ))}
      </svg>
      <p className="meta-text mt-1 text-xs">
        Çizgiler ortak motifleri gösterir; kalınlık ortak motif sayısıyla artar. Bağı çok olan tema, kültürler arasında
        aynı dili konuşur.
      </p>
    </div>
  );
}
