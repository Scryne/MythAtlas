'use client';

import { useMemo } from 'react';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import {
  CONNECTION_TYPE_COLORS,
  CONNECTION_TYPE_LABELS,
  getIncomingConnections,
  getMythologyName,
  getMythologyNode,
  getOutgoingConnections,
} from '@/lib/family-tree-data';

interface MythologyInfluenceMiniGraphProps {
  mythologyId: string;
}

const WIDTH = 680;
const HEIGHT = 320;

export default function MythologyInfluenceMiniGraph({ mythologyId }: MythologyInfluenceMiniGraphProps) {
  const centerNode = useMemo(() => getMythologyNode(mythologyId), [mythologyId]);
  const incoming = useMemo(() => getIncomingConnections(mythologyId), [mythologyId]);
  const outgoing = useMemo(() => getOutgoingConnections(mythologyId), [mythologyId]);

  const oneHopIds = useMemo(() => {
    const ids = new Set<string>();
    incoming.forEach((connection) => ids.add(connection.sourceId));
    outgoing.forEach((connection) => ids.add(connection.targetId));
    return Array.from(ids);
  }, [incoming, outgoing]);

  const miniNodes = useMemo(() => {
    const radius = 110;
    const count = Math.max(1, oneHopIds.length);
    return oneHopIds.map((id, index) => {
      const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
      const x = WIDTH / 2 + Math.cos(angle) * radius;
      const y = HEIGHT / 2 + Math.sin(angle) * radius;
      return {
        id,
        name: getMythologyName(id),
        x,
        y,
      };
    });
  }, [oneHopIds]);

  const miniNodeById = useMemo(
    () => new Map(miniNodes.map((node) => [node.id, node])),
    [miniNodes]
  );

  if (!centerNode) {
    return (
      <div className="rounded-xl border border-gold/20 bg-black/20 p-4 text-sm text-foreground/65">
        Etkilesim verisi bulunamadi.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-gold/20 bg-black/20 p-3">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-72 w-full min-w-[620px]">
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#0b0907" rx={14} />

          {[...incoming, ...outgoing].map((connection) => {
            const fromId = connection.sourceId;
            const toId = connection.targetId;
            const source =
              fromId === mythologyId ? { x: WIDTH / 2, y: HEIGHT / 2 } : miniNodeById.get(fromId);
            const target =
              toId === mythologyId ? { x: WIDTH / 2, y: HEIGHT / 2 } : miniNodeById.get(toId);
            if (!source || !target) return null;

            return (
              <line
                key={connection.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={CONNECTION_TYPE_COLORS[connection.type]}
                strokeWidth={1 + connection.strength}
                strokeOpacity={0.75}
                strokeDasharray={
                  connection.academicConsensus === 'theory'
                    ? '2 6'
                    : connection.academicConsensus === 'debated'
                      ? '6 5'
                      : undefined
                }
              />
            );
          })}

          {miniNodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x},${node.y})`}>
              <circle r={18} fill="#111" stroke="#d4b871" strokeWidth={1.2} />
              <text y={30} textAnchor="middle" className="fill-[#d9c69c] text-[10px]">
                {node.name.replace(' Mythology', '')}
              </text>
            </g>
          ))}

          <g transform={`translate(${WIDTH / 2},${HEIGHT / 2})`}>
            <circle r={30} fill={centerNode.color} fillOpacity={0.28} stroke={centerNode.color} strokeWidth={2} />
            <text y={48} textAnchor="middle" className="fill-[#f3ddb1] text-[11px]">
              {centerNode.name.replace(' Mythology', '')}
            </text>
          </g>
        </svg>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gold/20 bg-black/20 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-gold-light">Influenced Mythologies</p>
          <ul className="space-y-1 text-sm text-foreground/75">
            {outgoing.map((connection) => (
              <li key={connection.id}>
                {getMythologyName(connection.targetId)} · {CONNECTION_TYPE_LABELS[connection.type]}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-gold/20 bg-black/20 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-gold-light">Influenced By</p>
          <ul className="space-y-1 text-sm text-foreground/75">
            {incoming.map((connection) => (
              <li key={connection.id}>
                {getMythologyName(connection.sourceId)} · {CONNECTION_TYPE_LABELS[connection.type]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <HoverPrefetchLink
        href={`/family-tree?mythologyId=${mythologyId}`}
        className="inline-flex rounded-full border border-gold/40 px-4 py-2 text-xs tracking-[0.14em] text-gold-light"
      >
        Full family tree'de ac
      </HoverPrefetchLink>
    </div>
  );
}
