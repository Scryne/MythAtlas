'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';
import AncientImage from '@/components/common/AncientImage';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import {
  CONNECTION_TYPE_COLORS,
  CONNECTION_TYPE_LABELS,
  CONSENSUS_LABELS,
  getFamilyTreeNodes,
  getMythologyName,
  mythologyConnections,
  parseYearFromText,
  type AcademicConsensus,
  type FamilyEraBucket,
  type FamilyTreeMythologyNode,
  type MythologyConnection,
  type MythologyConnectionType,
} from '@/lib/family-tree-data';
import { getDisplayImageSrc } from '@/lib/image-proxy';
import { startLoad } from '@/lib/start-load';

interface SimNode extends FamilyTreeMythologyNode, SimulationNodeDatum {
  x: number;
  y: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  source: string | SimNode;
  target: string | SimNode;
  strength: 1 | 2 | 3;
}

const WIDTH = 1640;
const HEIGHT = 920;
const EDGE_LABEL_OFFSET = 10;

const ALL_TYPES = Object.keys(CONNECTION_TYPE_COLORS) as MythologyConnectionType[];
const ALL_CONSENSUS: AcademicConsensus[] = ['established', 'debated', 'theory'];
const ALL_ERAS: FamilyEraBucket[] = ['ancient', 'classical', 'medieval'];
const ERA_LABELS: Record<FamilyEraBucket, string> = { ancient: 'Antik', classical: 'Klasik', medieval: 'Orta Çağ' };
const COMPLETENESS_LABELS = { complete: 'Tam', partial: 'Kısmı', sparse: 'Sınırlı' } as const;

function nodeRadius(node: FamilyTreeMythologyNode): number {
  return 22 + Math.min(30, node.mythCount * 1.1 + node.deityCount * 0.9 + node.siteCount * 0.5);
}

function connectionWidth(strength: MythologyConnection['strength']): number {
  if (strength === 1) return 1.6;
  if (strength === 2) return 2.8;
  return 4.2;
}

function edgeDash(connection: MythologyConnection): string | undefined {
  if (connection.academicConsensus === 'theory') return '2 7';
  if (connection.academicConsensus === 'debated') return '8 6';
  if (connection.type === 'parallel_development') return '9 6';
  return undefined;
}

function toSvgPoint(svg: SVGSVGElement, event: PointerEvent | React.PointerEvent<SVGSVGElement>) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const transformed = point.matrixTransform(matrix.inverse());
  return { x: transformed.x, y: transformed.y };
}

function curvePath(from: { x: number; y: number }, to: { x: number; y: number }, seed = 0): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const bend = Math.max(18, Math.min(70, length * 0.18)) * (seed % 2 === 0 ? 1 : -1);
  const cx = (from.x + to.x) / 2 + nx * bend;
  const cy = (from.y + to.y) / 2 + ny * bend;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

function strengthStars(strength: 1 | 2 | 3): string {
  return '★'.repeat(strength) + '☆'.repeat(3 - strength);
}

function yearLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

export default function FamilyTreePageClient() {
  const searchParams = useSearchParams();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<any>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const nodeByIdRef = useRef<Map<string, SimNode>>(new Map());
  const [zoom, setZoom] = useState(1);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [allowMobileGraph, setAllowMobileGraph] = useState(false);

  const [selectedTypes, setSelectedTypes] = useState<MythologyConnectionType[]>(ALL_TYPES);
  const [selectedConsensus, setSelectedConsensus] = useState<AcademicConsensus[]>(ALL_CONSENSUS);
  const [selectedEras, setSelectedEras] = useState<FamilyEraBucket[]>(ALL_ERAS);
  const [highlightRegion, setHighlightRegion] = useState<string>('all');
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [timelineMode, setTimelineMode] = useState(false);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);

  const [timelineYear, setTimelineYear] = useState(0);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobileViewport(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    simNodesRef.current = simNodes;
  }, [simNodes]);

  const allNodes = useMemo(() => getFamilyTreeNodes(), []);
  const nodeMetaById = useMemo(() => new Map(allNodes.map((node) => [node.id, node])), [allNodes]);
  const regionOptions = useMemo(
    () => Array.from(new Set(allNodes.map((node) => node.region))).sort(),
    [allNodes]
  );

  const filteredConnections = useMemo(() => {
    const eraEligibleIds = new Set(
      allNodes.filter((node) => selectedEras.includes(node.eraBucket)).map((node) => node.id)
    );

    return mythologyConnections.filter((connection) => {
      if (!selectedTypes.includes(connection.type)) return false;
      if (!selectedConsensus.includes(connection.academicConsensus)) return false;
      if (!eraEligibleIds.has(connection.sourceId) || !eraEligibleIds.has(connection.targetId)) {
        return false;
      }
      return true;
    });
  }, [allNodes, selectedConsensus, selectedEras, selectedTypes]);

  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    filteredConnections.forEach((connection) => {
      ids.add(connection.sourceId);
      ids.add(connection.targetId);
    });
    return ids;
  }, [filteredConnections]);

  const visibleNodes = useMemo(
    () => allNodes.filter((node) => visibleNodeIds.has(node.id)),
    [allNodes, visibleNodeIds]
  );

  const visibleNodeById = useMemo(
    () => new Map(visibleNodes.map((node) => [node.id, node])),
    [visibleNodes]
  );

  const selectedConnection = useMemo(
    () => filteredConnections.find((connection) => connection.id === selectedConnectionId) ?? null,
    [filteredConnections, selectedConnectionId]
  );

  const selectedNode = useMemo(
    () => (selectedNodeId ? visibleNodeById.get(selectedNodeId) ?? null : null),
    [selectedNodeId, visibleNodeById]
  );

  const incomingForSelectedNode = useMemo(
    () =>
      selectedNode
        ? filteredConnections.filter((connection) => connection.targetId === selectedNode.id)
        : [],
    [filteredConnections, selectedNode]
  );

  const outgoingForSelectedNode = useMemo(
    () =>
      selectedNode
        ? filteredConnections.filter((connection) => connection.sourceId === selectedNode.id)
        : [],
    [filteredConnections, selectedNode]
  );

  const timelineBounds = useMemo(() => {
    const years = filteredConnections.map((connection) => parseYearFromText(connection.period));
    if (!years.length) return { min: -1500, max: 1500 };
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [filteredConnections]);

  // Zaman aralığı değişince imleç başa döner: render sırasında, önceki alt sınır izlenerek.
  const [boundsMin, setBoundsMin] = useState(timelineBounds.min);
  if (boundsMin !== timelineBounds.min) {
    setBoundsMin(timelineBounds.min);
    setTimelineYear(timelineBounds.min);
  }

  useEffect(() => {
    const focusId = searchParams.get('mythologyId');
    if (!focusId) return;
    if (visibleNodeById.has(focusId)) {
      startLoad(() => {
        setSelectedNodeId(focusId);
        setSelectedConnectionId(null);
      });
    }
  }, [searchParams, visibleNodeById]);

  useEffect(() => {
    if (!timelinePlaying || !timelineMode) return;
    const timer = window.setInterval(() => {
      setTimelineYear((current) => {
        const next = current + 35;
        if (next >= timelineBounds.max) {
          setTimelinePlaying(false);
          return timelineBounds.max;
        }
        return next;
      });
    }, 160);
    return () => window.clearInterval(timer);
  }, [timelineBounds.max, timelineMode, timelinePlaying]);

  const timelineLayout = useMemo(() => {
    const regionOrder = Array.from(new Set(visibleNodes.map((node) => node.region))).sort();
    const regionIndex = new Map(regionOrder.map((name, index) => [name, index]));
    const totalRows = Math.max(1, regionOrder.length - 1);
    const range = Math.max(1, timelineBounds.max - timelineBounds.min);

    const nodeYear = new Map<string, number>();
    visibleNodes.forEach((node) => {
      const linked = filteredConnections
        .filter((connection) => connection.sourceId === node.id || connection.targetId === node.id)
        .map((connection) => parseYearFromText(connection.period));
      const average = linked.length
        ? Math.round(linked.reduce((sum, year) => sum + year, 0) / linked.length)
        : parseYearFromText(node.era);
      nodeYear.set(node.id, average);
    });

    return visibleNodes.map((node) => {
      const year = nodeYear.get(node.id) ?? timelineBounds.min;
      const ratio = (year - timelineBounds.min) / range;
      const x = 120 + ratio * (WIDTH - 240);
      const regionRow = regionIndex.get(node.region) ?? 0;
      const y = 130 + (regionRow / totalRows) * (HEIGHT - 320);
      return { ...node, x, y, year };
    });
  }, [filteredConnections, timelineBounds.max, timelineBounds.min, visibleNodes]);

  useEffect(() => {
    if (timelineMode) {
      startLoad(() =>
        setSimNodes(
          timelineLayout.map((node) => ({
            ...node,
            x: node.x,
            y: node.y,
          }))
        )
      );
      if (simulationRef.current) simulationRef.current.stop();
      return;
    }

    const previous = new Map(simNodesRef.current.map((node) => [node.id, node]));
    const nodes: SimNode[] = visibleNodes.map((node) => ({
      ...node,
      x: previous.get(node.id)?.x ?? WIDTH / 2 + (Math.random() - 0.5) * 180,
      y: previous.get(node.id)?.y ?? HEIGHT / 2 + (Math.random() - 0.5) * 160,
    }));

    const links: SimLink[] = filteredConnections
      .filter((connection) => visibleNodeById.has(connection.sourceId) && visibleNodeById.has(connection.targetId))
      .map((connection) => ({
        id: connection.id,
        source: connection.sourceId,
        target: connection.targetId,
        strength: connection.strength,
      }));

    nodeByIdRef.current = new Map(nodes.map((node) => [node.id, node]));
    let cancelled = false;
    let simulation: any = null;
    let freezeTimer: number | null = null;
    let bootTimer: number | null = null;

    const bootSimulation = async () => {
      const { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } =
        await import('d3-force');
      if (cancelled) return;

      simulation = forceSimulation(nodes)
        .force(
          'link',
          forceLink<SimNode, SimLink>(links)
            .id((node: SimNode) => node.id)
            .distance((link: SimLink) => 240 - link.strength * 48)
            .strength((link: SimLink) => 0.08 + link.strength * 0.09)
        )
        .force('charge', forceManyBody().strength(-580))
        .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
        .force('collision', forceCollide<SimNode>().radius((node: SimNode) => nodeRadius(node) + 8))
        .alpha(1)
        .alphaDecay(0.035);

      simulationRef.current = simulation;
      simulation.on('tick', () => {
        setSimNodes(nodes.map((node) => ({ ...node })));
      });

      freezeTimer = window.setTimeout(() => {
        simulation.stop();
        setSimNodes(nodes.map((node) => ({ ...node })));
      }, 2400);
    };

    bootTimer = window.setTimeout(() => {
      void bootSimulation();
    }, 120);

    return () => {
      cancelled = true;
      if (bootTimer) window.clearTimeout(bootTimer);
      if (freezeTimer) window.clearTimeout(freezeTimer);
      if (simulation) simulation.stop();
    };
  }, [filteredConnections, timelineLayout, timelineMode, visibleNodeById, visibleNodes]);

  const positionedNodeById = useMemo(
    () => new Map(simNodes.map((node) => [node.id, node])),
    [simNodes]
  );

  const renderedEdges = useMemo(
    () =>
      filteredConnections
        .map((connection, index) => {
          const source = positionedNodeById.get(connection.sourceId);
          const target = positionedNodeById.get(connection.targetId);
          if (!source || !target) return null;
          const year = parseYearFromText(connection.period);
          return { connection, source, target, index, year };
        })
        .filter(
          (
            value
          ): value is {
            connection: MythologyConnection;
            source: SimNode;
            target: SimNode;
            index: number;
            year: number;
          } => Boolean(value)
        ),
    [filteredConnections, positionedNodeById]
  );

  const focusedConnectionId = hoveredConnectionId || selectedConnectionId;
  const focusedNodeIds = useMemo(() => {
    if (!focusedConnectionId) return new Set<string>();
    const edge = filteredConnections.find((connection) => connection.id === focusedConnectionId);
    if (!edge) return new Set<string>();
    return new Set([edge.sourceId, edge.targetId]);
  }, [filteredConnections, focusedConnectionId]);

  const activeViewBox = `${(1 - 1 / zoom) * (WIDTH / 2)} ${(1 - 1 / zoom) * (HEIGHT / 2)} ${WIDTH / zoom} ${HEIGHT / zoom}`;

  const onGraphPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingId || !svgRef.current || timelineMode) return;
    const node = nodeByIdRef.current.get(draggingId);
    if (!node) return;
    const point = toSvgPoint(svgRef.current, event);
    node.fx = point.x;
    node.fy = point.y;
    if (simulationRef.current) simulationRef.current.alphaTarget(0.18).restart();
  };

  const onGraphPointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingId || timelineMode) return;
    const node = nodeByIdRef.current.get(draggingId);
    if (node) {
      // Keep dragged nodes pinned at the released position.
      node.fx = node.x;
      node.fy = node.y;
    }
    if (simulationRef.current) simulationRef.current.alphaTarget(0);
    setDraggingId(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (isMobileViewport && !allowMobileGraph) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void px-4 pt-16 text-parchment">
        <div className="w-full max-w-md rounded-xl border border-gold/30 bg-background/95 p-5 text-center">
          <p className="text-lg text-gold-pale">Aile ağacı masaüstünde daha iyi görüntülenir</p>
          <p className="mt-2 text-sm text-parchment-dim">
            Mobilde devam etmek isterseniz grafik dokunmatik kaydırma ve yakınlaştırma ile kullanılabilir.
          </p>
          <button
            type="button"
            onClick={() => setAllowMobileGraph(true)}
            className="mt-4 rounded-full border border-gold/45 bg-gold-deep px-4 py-2 text-xs tracking-[0.12em] text-gold-pale"
          >
            Devam et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-void pt-16 text-parchment">
      <div className="pointer-events-auto absolute left-4 top-4 z-40 flex flex-wrap items-center gap-2 rounded-xl border border-gold/30 bg-background/90 px-3 py-2 backdrop-blur-md">
        <HoverPrefetchLink href="/" className="rounded-md border border-gold/25 px-2 py-1 text-xs text-parchment-dim">
          Ana sayfa
        </HoverPrefetchLink>
        <HoverPrefetchLink href="/map" className="rounded-md border border-gold/25 px-2 py-1 text-xs text-parchment-dim">
          Harita
        </HoverPrefetchLink>
        <HoverPrefetchLink href="/family-tree/deities" className="rounded-md border border-gold/25 px-2 py-1 text-xs text-gold-pale">
          Tanrı zincirleri
        </HoverPrefetchLink>
      </div>

      <div className="pointer-events-auto absolute right-4 top-4 z-40 flex max-w-[70vw] flex-wrap items-center justify-end gap-2 rounded-xl border border-gold/25 bg-background/92 px-3 py-2 backdrop-blur-md">
        {ALL_TYPES.map((type) => {
          const active = selectedTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() =>
                setSelectedTypes((current) =>
                  current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
                )
              }
              className={`rounded-full border px-2 py-1 text-[11px] ${active ? 'border-gold-pale bg-gold-deep text-gold-pale' : 'border-gold/25 text-parchment-muted'}`}
            >
              <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CONNECTION_TYPE_COLORS[type] }} />
              {CONNECTION_TYPE_LABELS[type]}
            </button>
          );
        })}
        {ALL_CONSENSUS.map((consensus) => {
          const active = selectedConsensus.includes(consensus);
          return (
            <button
              key={consensus}
              type="button"
              onClick={() =>
                setSelectedConsensus((current) =>
                  current.includes(consensus)
                    ? current.filter((item) => item !== consensus)
                    : [...current, consensus]
                )
              }
              className={`rounded-full border px-2 py-1 text-[11px] ${active ? 'border-rel-cyan/75 bg-rel-cyan-deep text-rel-cyan-light' : 'border-rel-cyan/25 text-rel-cyan-muted'}`}
            >
              {CONSENSUS_LABELS[consensus]}
            </button>
          );
        })}
        {ALL_ERAS.map((era) => {
          const active = selectedEras.includes(era);
          return (
            <button
              key={era}
              type="button"
              onClick={() =>
                setSelectedEras((current) =>
                  current.includes(era) ? current.filter((item) => item !== era) : [...current, era]
                )
              }
              className={`rounded-full border px-2 py-1 text-[11px] ${active ? 'border-rel-green/70 bg-rel-green-deep text-rel-green-light' : 'border-rel-green/25 text-rel-green'}`}
            >
              {ERA_LABELS[era]}
            </button>
          );
        })}
        <select
          value={highlightRegion}
          onChange={(event) => setHighlightRegion(event.target.value)}
          className="rounded-md border border-gold/25 bg-background px-2 py-1 text-[11px] text-gold-pale"
        >
          <option value="all">Bölge vurgula</option>
          {regionOptions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowEdgeLabels((value) => !value)}
          className={`rounded-md border px-2 py-1 text-[11px] ${showEdgeLabels ? 'border-gold-pale/70 bg-gold-deep text-gold-pale' : 'border-gold/25 text-parchment-muted'}`}
        >
          Bağlantı etiketleri
        </button>
        <button
          type="button"
          onClick={() => {
            setTimelineMode((value) => !value);
            setTimelinePlaying(false);
          }}
          className={`rounded-md border px-2 py-1 text-[11px] ${timelineMode ? 'border-rel-cyan/70 bg-rel-cyan-deep text-rel-cyan-light' : 'border-rel-cyan/25 text-rel-cyan-muted'}`}
        >
          Zaman çizelgesi
        </button>
        <div className="ml-1 flex items-center gap-1">
          <button
            type="button"
            aria-label="Yakınlaştır"
            onClick={() => setZoom((current) => Math.min(2.2, Number((current + 0.15).toFixed(2))))}
            className="h-6 w-6 rounded-md border border-gold/30 text-xs text-gold-pale"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Uzaklaştır"
            onClick={() => setZoom((current) => Math.max(0.6, Number((current - 0.15).toFixed(2))))}
            className="h-6 w-6 rounded-md border border-gold/30 text-xs text-gold-pale"
          >
            -
          </button>
          <button
            type="button"
            aria-label="Grafiği ekrana sığdır"
            onClick={() => setZoom(1)}
            className="rounded-md border border-gold/30 px-2 py-1 text-[11px] text-gold-pale"
          >
            Sığdır
          </button>
        </div>
      </div>

      {timelineMode && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-40 w-[min(92vw,920px)] -translate-x-1/2 rounded-xl border border-rel-cyan/35 bg-rel-cyan-deep/93 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs tracking-[0.1em] text-rel-cyan-light">Zaman çizelgesi: {yearLabel(timelineYear)}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimelinePlaying((value) => !value)}
                className="rounded-md border border-rel-cyan/45 px-2 py-1 text-xs text-rel-cyan-light"
              >
                {timelinePlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimelinePlaying(false);
                  setTimelineYear(timelineBounds.min);
                }}
                className="rounded-md border border-rel-cyan/35 px-2 py-1 text-xs text-rel-cyan-light"
              >
                Sıfırla
              </button>
            </div>
          </div>
          <input
            type="range"
            min={timelineBounds.min}
            max={timelineBounds.max}
            step={10}
            value={timelineYear}
            onChange={(event) => {
              setTimelinePlaying(false);
              setTimelineYear(Number(event.target.value));
            }}
            className="w-full accent-rel-cyan"
          />
          <div className="mt-2 flex justify-between text-[10px] text-rel-cyan-muted">
            <span>{yearLabel(timelineBounds.min)}</span>
            <span>{yearLabel(Math.round((timelineBounds.min + timelineBounds.max) / 2))}</span>
            <span>{yearLabel(timelineBounds.max)}</span>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={activeViewBox}
        className="h-[calc(100vh-2rem)] w-full"
        aria-label="Mitoloji aile ağacı grafiği"
        onPointerMove={onGraphPointerMove}
        onPointerUp={onGraphPointerUp}
        onPointerLeave={onGraphPointerUp}
      >
        <defs>
          {ALL_TYPES.map((type) => (
            <marker
              key={`marker-${type}`}
              id={`arrow-${type}`}
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 9 3.5, 0 7" fill={CONNECTION_TYPE_COLORS[type]} />
            </marker>
          ))}

          {simNodes.map((node) => (
            <clipPath key={`clip-${node.id}`} id={`clip-${node.id}`}>
              <circle r={nodeRadius(node) - 4} cx={0} cy={0} />
            </clipPath>
          ))}
        </defs>

        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-void)" />
        {renderedEdges.map(({ connection, source, target, index, year }) => {
          const color = CONNECTION_TYPE_COLORS[connection.type];
          const dimByRegion =
            highlightRegion !== 'all' &&
            source.region !== highlightRegion &&
            target.region !== highlightRegion;
          const inTimelineWindow = !timelineMode || year <= timelineYear;
          const focusDimming =
            focusedConnectionId && focusedConnectionId !== connection.id ? 0.12 : undefined;
          const opacity = !inTimelineWindow
            ? 0.08
            : focusDimming ?? (dimByRegion ? 0.15 : connection.academicConsensus === 'established' ? 0.7 : 0.55);
          const path = curvePath(source, target, index);
          const markerEnd =
            connection.type === 'evolved_from' || connection.type === 'conquest'
              ? `url(#arrow-${connection.type})`
              : undefined;

          return (
            <g key={connection.id}>
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={connectionWidth(connection.strength)}
                strokeDasharray={edgeDash(connection)}
                strokeOpacity={opacity}
                markerEnd={markerEnd}
                onMouseEnter={() => setHoveredConnectionId(connection.id)}
                onMouseLeave={() => setHoveredConnectionId(null)}
                onClick={() => {
                  setSelectedConnectionId(connection.id);
                  setSelectedNodeId(null);
                }}
                className="cursor-pointer"
              />
              {showEdgeLabels && inTimelineWindow && (
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - EDGE_LABEL_OFFSET}
                  textAnchor="middle"
                  className="fill-parchment-dim text-[10px]"
                >
                  {CONNECTION_TYPE_LABELS[connection.type]}
                </text>
              )}
            </g>
          );
        })}

        {simNodes.map((node) => {
          const hovered = hoveredNodeId === node.id;
          const selected = selectedNodeId === node.id;
          const inFocusedEdge = focusedNodeIds.has(node.id);
          const dimByRegion = highlightRegion !== 'all' && node.region !== highlightRegion;
          const dimByEdge = focusedNodeIds.size > 0 && !inFocusedEdge;
          const opacity = dimByRegion || dimByEdge ? 0.2 : 1;
          const radius = nodeRadius(node);
          const imageSize = (radius - 4) * 2;
          const nodeImageSrc = getDisplayImageSrc(node.imageUrl, node.name);

          return (
            <g
              key={node.id}
              transform={`translate(${node.x},${node.y})`}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onPointerDown={(event) => {
                if (timelineMode || !svgRef.current) return;
                const native = event.nativeEvent as PointerEvent;
                const point = toSvgPoint(svgRef.current, native);
                const targetNode = nodeByIdRef.current.get(node.id);
                if (targetNode) {
                  targetNode.fx = point.x;
                  targetNode.fy = point.y;
                }
                setDraggingId(node.id);
                event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
              }}
              onClick={() => {
                setSelectedNodeId(node.id);
                setSelectedConnectionId(null);
              }}
              className="cursor-pointer"
              style={{ opacity }}
            >
              <circle
                r={radius + (hovered || selected ? 5 : 0)}
                fill={node.color}
                fillOpacity={hovered || selected ? 0.36 : 0.18}
                stroke={node.color}
                strokeWidth={hovered || selected ? 2.2 : 1.2}
              />
              <image
                href={nodeImageSrc}
                x={-imageSize / 2}
                y={-imageSize / 2}
                width={imageSize}
                height={imageSize}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#clip-${node.id})`}
              />
              <circle r={radius - 4} fill="none" stroke={node.color} strokeOpacity={0.9} strokeWidth={1} />
              <text
                y={radius + 18}
                textAnchor="middle"
                className="fill-parchment text-[12px]"
                style={{ textShadow: '0 0 8px rgba(0,0,0,0.8)' }}
              >
                {node.name.replace(' Mythology', '')}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredNodeId && !selectedConnectionId && (
        <div className="pointer-events-none absolute bottom-10 left-6 z-40 rounded-lg border border-gold/35 bg-surface/95 px-3 py-2 text-xs text-parchment-dim">
          {(() => {
            const node = nodeMetaById.get(hoveredNodeId);
            if (!node) return null;
            return (
              <>
                <p className="text-gold-pale">{node.name}</p>
                <p>Mitler: {node.mythCount}</p>
                <p>Tanrılar: {node.deityCount}</p>
                <p>Alanlar: {node.siteCount}</p>
                <p>Dönem: {node.era}</p>
                <p>Veri durumu: {COMPLETENESS_LABELS[node.completeness.label]}</p>
              </>
            );
          })()}
        </div>
      )}

      {hoveredConnectionId && !selectedConnectionId && (
        <div className="pointer-events-none absolute bottom-10 left-6 z-40 max-w-xl rounded-lg border border-rel-cyan/35 bg-rel-cyan-deep/95 px-3 py-2 text-xs text-rel-cyan-light">
          {(() => {
            const connection = filteredConnections.find((item) => item.id === hoveredConnectionId);
            if (!connection) return null;
            return (
              <>
                <p className="text-rel-cyan-light">
                  {getMythologyName(connection.sourceId)} {' to '} {getMythologyName(connection.targetId)}
                </p>
                <p className="mt-1 line-clamp-2">{connection.description}</p>
              </>
            );
          })()}
        </div>
      )}

      <aside
        className={`pointer-events-auto absolute right-0 top-0 z-50 h-full w-full transform border-l border-gold/20 bg-background/96 backdrop-blur-xl transition-transform duration-300 sm:w-[min(92vw,430px)] ${selectedNode || selectedConnection ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-gold/20 px-4 py-3">
          <h2 className="text-sm tracking-[0.14em] text-gold-pale">
            {selectedConnection ? 'Bağlantı ayrıntısı' : 'Mitoloji ayrıntısı'}
          </h2>
          <button
            type="button"
            onClick={() => {
              setSelectedConnectionId(null);
              setSelectedNodeId(null);
            }}
            className="text-xs text-parchment-muted hover:text-gold-pale"
          >
            Kapat
          </button>
        </div>

        <div className="h-[calc(100%-56px)] space-y-4 overflow-y-auto p-4 text-sm text-parchment-dim">
          {selectedConnection && (
            <>
              <p className="text-gold-pale">
                {getMythologyName(selectedConnection.sourceId)} {' to '} {getMythologyName(selectedConnection.targetId)}
              </p>
              <p className="inline-flex rounded-full border border-rel-cyan/35 bg-rel-cyan-deep px-2 py-0.5 text-xs text-rel-cyan-light">
                {CONNECTION_TYPE_LABELS[selectedConnection.type]}
              </p>
              <p className="text-parchment">Bağ gücü: {strengthStars(selectedConnection.strength)}</p>
              <p className="leading-relaxed">{selectedConnection.description}</p>
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.14em] text-parchment-muted">Örnekler</p>
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  {selectedConnection.examples.map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </div>
              <p className="text-xs">
                Period: <span className="text-parchment-dim">{selectedConnection.period}</span>
              </p>
              <p className="text-xs">
                Academic Consensus:{' '}
                <span
                  className={`rounded-full border px-2 py-0.5 ${
                    selectedConnection.academicConsensus === 'established'
                      ? 'border-rel-green/45 text-rel-green-light'
                      : selectedConnection.academicConsensus === 'debated'
                        ? 'border-gold-pale/45 text-gold-pale'
                        : 'border-parchment-dim/45 text-foreground'
                  }`}
                >
                  {CONSENSUS_LABELS[selectedConnection.academicConsensus]}
                </span>
              </p>
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.14em] text-parchment-muted">Kaynaklar</p>
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  {selectedConnection.sources.map((source) => (
                    <li key={source}>{source}</li>
                  ))}
                </ul>
              </div>
              <HoverPrefetchLink
                href={`/compare?left=${selectedConnection.sourceId}&right=${selectedConnection.targetId}`}
                className="inline-flex rounded-full border border-rel-cyan/45 bg-rel-cyan-mid px-4 py-2 text-xs tracking-[0.1em] text-rel-cyan-light hover:bg-rel-cyan-mid"
              >
                Her iki mitolojiyi karşılaştır
              </HoverPrefetchLink>
            </>
          )}

          {selectedNode && (
            <>
              <div className="relative h-44 overflow-hidden rounded-lg border border-gold/20">
                <AncientImage
                  src={selectedNode.imageUrl}
                  alt={selectedNode.name}
                  fill
                  sizes="(max-width: 768px) 92vw, 420px"
                  className="object-cover opacity-75"
                  fallbackLabel={selectedNode.name}
                />
              </div>
              <p className="text-lg text-gold-pale">{selectedNode.name}</p>
              <p className="text-xs text-parchment-muted">
                {selectedNode.region} · {selectedNode.era}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border border-gold/20 bg-surface p-2">
                  <p className="text-parchment-muted">Mitler</p>
                  <p className="text-gold-pale">{selectedNode.mythCount}</p>
                </div>
                <div className="rounded-md border border-gold/20 bg-surface p-2">
                  <p className="text-parchment-muted">Tanrılar</p>
                  <p className="text-gold-pale">{selectedNode.deityCount}</p>
                </div>
                <div className="rounded-md border border-gold/20 bg-surface p-2">
                  <p className="text-parchment-muted">Alanlar</p>
                  <p className="text-gold-pale">{selectedNode.siteCount}</p>
                </div>
                <div className="rounded-md border border-gold/20 bg-surface p-2">
                  <p className="text-parchment-muted">Etkiledikleri</p>
                  <p className="text-gold-pale">{outgoingForSelectedNode.length}</p>
                </div>
                <div className="rounded-md border border-gold/20 bg-surface p-2">
                  <p className="text-parchment-muted">Etkilendikleri</p>
                  <p className="text-gold-pale">{incomingForSelectedNode.length}</p>
                </div>
              </div>
              <div className="rounded-md border border-gold/18 bg-surface p-3 text-xs text-parchment-dim">
                <p>
                  Veri durumu: <span className="text-gold-pale">{COMPLETENESS_LABELS[selectedNode.completeness.label]}</span>
                </p>
                <p className="mt-1">Kanonik panteon genisligi: {selectedNode.canonicalPantheonSize || 'bilinmiyor'}</p>
                {selectedNode.missingSections.length > 0 ? (
                  <p className="mt-1">Eksik alanlar: {selectedNode.missingSections.join(', ')}</p>
                ) : null}
              </div>
              {selectedNode.isSynthetic || selectedNode.missingSections.length > 0 ? (
                <div className="rounded-md border border-gold-pale/25 bg-gold-deep p-3 text-xs text-parchment-dim">
                  Bu düğüm için ayrıntı verisi sınırlı olabilir; gösterilen sayaçlar yalnızca mevcut veri setinden gelir.
                </div>
              ) : null}
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.14em] text-parchment-muted">Etkilediği Mitolojiler</p>
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  {outgoingForSelectedNode.map((connection) => (
                    <li key={connection.id}>
                      {getMythologyName(connection.targetId)} ({CONNECTION_TYPE_LABELS[connection.type]})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.14em] text-parchment-muted">Etkilendikleri</p>
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  {incomingForSelectedNode.map((connection) => (
                    <li key={connection.id}>
                      {getMythologyName(connection.sourceId)} ({CONNECTION_TYPE_LABELS[connection.type]})
                    </li>
                  ))}
                </ul>
              </div>
              {!selectedNode.isSynthetic && (
                <HoverPrefetchLink
                  href={`/mythology/${selectedNode.id}`}
                  className="inline-flex rounded-full border border-gold/40 px-4 py-2 text-xs tracking-[0.1em] text-gold-pale"
                >
                  Mitoloji ayrıntı sayfası
                </HoverPrefetchLink>
              )}
              <HoverPrefetchLink
                href={`/family-tree?mythologyId=${selectedNode.id}`}
                className="inline-flex rounded-full border border-rel-cyan/40 px-4 py-2 text-xs tracking-[0.1em] text-rel-cyan-light"
              >
                Grafiği bu düğüme ortala
              </HoverPrefetchLink>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
