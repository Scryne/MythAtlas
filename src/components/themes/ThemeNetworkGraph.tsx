'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import type { ThemeNetworkEdge, ThemeNetworkNode } from '@/lib/insights';

interface GraphProps {
  nodes: ThemeNetworkNode[];
  edges: ThemeNetworkEdge[];
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  label: string;
  icon: string;
  count: number;
}

interface SimEdge extends SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
  weight: number;
}

const WIDTH = 940;
const HEIGHT = 540;

function nodeRadius(value: number): number {
  return 14 + Math.min(22, value * 0.5);
}

export default function ThemeNetworkGraph({ nodes, edges }: GraphProps) {
  const [tick, setTick] = useState(0);

  const simNodes = useMemo<SimNode[]>(
    () =>
      nodes.map((node) => ({
        id: node.id,
        label: node.label,
        icon: node.icon,
        count: node.count,
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
      })),
    [nodes]
  );

  const simEdges = useMemo<SimEdge[]>(
    () =>
      edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
      })),
    [edges]
  );

  useEffect(() => {
    if (!simNodes.length || !simEdges.length) return;

    const simulation = forceSimulation(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimEdge>(simEdges)
          .id((node: SimNode) => node.id)
          .distance((link: SimEdge) => 170 - Math.min(90, link.weight * 9))
          .strength((link: SimEdge) => 0.1 + Math.min(0.35, link.weight / 20))
      )
      .force('charge', forceManyBody().strength(-260))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        'collision',
        forceCollide<SimNode>().radius((node: SimNode) => nodeRadius(node.count) + 8)
      )
      .alpha(1)
      .alphaDecay(0.035);

    simulation.on('tick', () => setTick((value) => value + 1));
    return () => simulation.stop();
  }, [simEdges, simNodes]);

  if (!nodes.length || !edges.length) {
    return (
      <div className="rounded-xl border border-gold/20 bg-black/25 p-6 text-sm text-foreground/60">
        Tema baglantisi olusturmak icin yeterli veri yok.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gold/20 bg-black/25 p-4">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[460px] w-full">
        <rect width={WIDTH} height={HEIGHT} fill="#0b0907" rx={18} />

        <g>
          {simEdges.map((edge, index) => {
            const source = typeof edge.source === 'string' ? simNodes.find((node) => node.id === edge.source) : edge.source;
            const target = typeof edge.target === 'string' ? simNodes.find((node) => node.id === edge.target) : edge.target;
            if (!source || !target) return null;

            return (
              <line
                key={`edge-${index}-${tick}`}
                x1={source.x || 0}
                y1={source.y || 0}
                x2={target.x || 0}
                y2={target.y || 0}
                stroke="rgba(210,176,98,0.35)"
                strokeWidth={Math.max(1, edge.weight * 0.35)}
              />
            );
          })}
        </g>

        <g>
          {simNodes.map((node) => (
            <g key={`node-${node.id}-${tick}`} transform={`translate(${node.x || 0}, ${node.y || 0})`}>
              <circle
                r={nodeRadius(node.count)}
                fill="rgba(201, 168, 76, 0.18)"
                stroke="rgba(244, 214, 141, 0.62)"
                strokeWidth={1.5}
              />
              <text
                textAnchor="middle"
                y={4}
                className="fill-[#f1dba7] text-[12px]"
                fontFamily="Inter, sans-serif"
              >
                {node.icon}
              </text>
              <text
                textAnchor="middle"
                y={nodeRadius(node.count) + 16}
                className="fill-[#e7d4ad] text-[11px]"
                fontFamily="Inter, sans-serif"
              >
                {node.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <p className="mt-2 text-xs text-foreground/50">
        Kenar kalinligi iki temanin birlikte gorulme sikligini gosterir.
      </p>
    </div>
  );
}
