'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import maplibregl, { GeoJSONSource, MapMouseEvent } from 'maplibre-gl';
import AncientImage from '@/components/common/AncientImage';
import HoverPrefetchLink from '@/components/common/HoverPrefetchLink';
import {
  DNA_ELEMENT_UNIVERSE,
  formatDNAKeyLabel,
  mythMatchesDNAFilters,
  parseDNAQueryFilters,
} from '@/lib/dna';
import {
  deities as deitiesCatalog,
  getMythologyBundle,
  getMythologyBundles,
  mythologies as mythologiesCatalog,
  myths as mythsCatalog,
  sacredSites as sacredSitesCatalog,
  siteArchaeologyPeriod,
  siteArtifactCount,
  siteExcavationStatus,
  siteHasForeignMuseumHoldings,
  siteProtectionStatus,
  type MythData,
  type SiteData,
} from '@/lib/myth-data';
import { mapParallelConnections, parallelThemeColorById } from '@/lib/parallels-data';
import {
  CONNECTION_TYPE_LABELS,
  CONSENSUS_LABELS,
  getInfluenceMapGeoJson,
  type InfluenceMapFeatureProperties,
} from '@/lib/family-tree-data';
import type { Deity, Mythology } from '@/types/mythology';

export const dynamic = 'force-dynamic';

const MAP_STYLE = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json';
const MAP_STYLE_FALLBACK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const INITIAL_CENTER: [number, number] = [20, 20];
const INITIAL_ZOOM = 2;

const SOURCES = {
  regions: 'regions-source',
  sites: 'sites-source',
  myths: 'myths-source',
  deities: 'deities-source',
  parallelConnections: 'parallel-connections-source',
  parallelHeat: 'parallel-heat-source',
  influenceConnections: 'influence-connections-source',
} as const;

const LAYERS = {
  regionsFill: 'regions-fill',
  regionsLine: 'regions-line',
  siteGlow: 'site-glow',
  siteClusters: 'site-clusters',
  siteClusterCount: 'site-cluster-count',
  sites: 'sites',
  siteArchaeologyUnesco: 'site-archaeology-unesco',
  siteArchaeologyActive: 'site-archaeology-active',
  siteArchaeologyForeign: 'site-archaeology-foreign',
  mythGlow: 'myth-glow',
  myths: 'myths',
  deities: 'deities',
  parallelConnections: 'parallel-connections',
  parallelConnectionsAnimated: 'parallel-connections-animated',
  parallelHeat: 'parallel-heat',
  influenceConnections: 'influence-connections',
  influenceArrows: 'influence-arrows',
} as const;

const FEATURED_MYTHOLOGIES = new Set(['greek', 'egyptian', 'norse', 'hindu', 'mesopotamian']);

const MYTH_TYPE_COLORS: Record<string, string> = {
  creation: 'rgb(201, 168, 76)',
  hero: 'rgb(232, 201, 106)',
  trickster: 'rgb(181, 68, 68)',
  love: 'rgb(244, 228, 193)',
  war: 'rgb(139, 46, 46)',
  afterlife: 'rgb(168, 152, 128)',
  nature: 'rgb(138, 111, 50)',
  cosmology: 'rgb(240, 230, 211)',
  transformation: 'rgb(181, 68, 68)',
  quest: 'rgb(232, 201, 106)',
};

const SITE_TYPES = {
  temple: { icon: '⛩', label: 'Temple', bg: 'rgb(46, 37, 32)', stroke: 'rgb(201, 168, 76)' },
  oracle: { icon: '👁', label: 'Oracle', bg: 'rgb(36, 29, 23)', stroke: 'rgb(232, 201, 106)' },
  battlefield: { icon: '⚔', label: 'Battlefield', bg: 'rgb(139, 46, 46)', stroke: 'rgb(181, 68, 68)' },
  burial: { icon: '☽', label: 'Burial', bg: 'rgb(26, 21, 16)', stroke: 'rgb(168, 152, 128)' },
  natural: { icon: '🌿', label: 'Natural', bg: 'rgb(36, 29, 23)', stroke: 'rgb(138, 111, 50)' },
  ruins: { icon: '🏛', label: 'Ruins', bg: 'rgb(26, 21, 16)', stroke: 'rgb(240, 230, 211)' },
  default: { icon: '✦', label: 'Site', bg: 'rgb(46, 37, 32)', stroke: 'rgb(201, 168, 76)' },
} as const;

type EraBucket = 'ancient' | 'medieval' | 'modern';
type ArchaeologyPeriodBucket = 'prehistoric' | 'ancient' | 'classical' | 'medieval' | 'early_modern';
type TabKey = 'overview' | 'myths' | 'deities' | 'sites';

const ARCHAEOLOGY_PERIOD_OPTIONS: Array<{ key: ArchaeologyPeriodBucket; label: string }> = [
  { key: 'prehistoric', label: 'Prehistoric' },
  { key: 'ancient', label: 'Ancient' },
  { key: 'classical', label: 'Classical' },
  { key: 'medieval', label: 'Medieval' },
  { key: 'early_modern', label: 'Early Modern' },
];

interface SearchResult {
  kind: 'mythology' | 'myth' | 'deity' | 'site';
  id: string;
  title: string;
  subtitle: string;
  mythologyId?: string;
  coordinates?: [number, number];
}

interface DetailTarget {
  kind: 'myth' | 'deity' | 'site';
  id: string;
}

interface ResolvedParallelConnection {
  id: string;
  themeId: string;
  similarity: number;
  rationale: string;
  themeColor: string;
  fromMyth: MythData;
  toMyth: MythData;
}

interface ResolvedInfluenceConnection extends InfluenceMapFeatureProperties {}

function normalizeEraBucket(value?: string): EraBucket {
  const text = String(value || '').toLowerCase();
  if (text.includes('ancient') || text.includes('m\u00f6') || text.includes('bc')) return 'ancient';
  if (text.includes('modern') || text.includes('present')) return 'modern';
  if (text.includes('medieval')) return 'medieval';
  const msMatch = text.match(/ms\s*(\d{1,4})/);
  if (msMatch) {
    const year = Number(msMatch[1]);
    if (year >= 1500) return 'modern';
    if (year >= 500) return 'medieval';
  }
  return 'ancient';
}

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 100) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function computeScale(map: maplibregl.Map) {
  const lat = map.getCenter().lat;
  const zoom = map.getZoom();
  const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  const maxPx = 120;
  const raw = Math.max(1, metersPerPixel * maxPx);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / pow;
  const nice = normalized >= 5 ? 5 * pow : normalized >= 2 ? 2 * pow : 1 * pow;
  const width = Math.max(30, Math.min(maxPx, Math.round(nice / metersPerPixel)));
  const label = nice >= 1000 ? `${nice / 1000 >= 10 ? Math.round(nice / 1000) : (nice / 1000).toFixed(1)} km` : `${Math.round(nice)} m`;
  return { width, label };
}

function buildIconSvg(icon: string, bg: string, stroke: string) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
    <circle cx="26" cy="26" r="16" fill="${bg}" stroke="${stroke}" stroke-width="2.8"/>
    <text x="26" y="31" text-anchor="middle" font-size="16" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji">${icon}</text>
  </svg>`;
}

function addSvgImage(map: maplibregl.Map, id: string, svg: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image(52, 52);
    image.onload = () => {
      try { if (!map.hasImage(id)) map.addImage(id, image, { pixelRatio: 2 }); } catch (e) {}
      resolve();
    };
    image.onerror = () => reject(new Error(`Icon failed: ${id}`));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function normalizeLng(value: number) {
  let normalized = value;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function buildArcCoordinates(from: [number, number], to: [number, number], segments = 72): [number, number][] {
  let [lng1, lat1] = from;
  let [lng2, lat2] = to;
  if (Math.abs(lng2 - lng1) > 180) {
    if (lng1 > lng2) lng2 += 360;
    else lng1 += 360;
  }

  const coords: [number, number][] = [];
  const distance = Math.hypot(lng2 - lng1, lat2 - lat1);
  const arcLift = Math.max(2, Math.min(16, distance * 0.08));

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const lng = normalizeLng(lng1 + (lng2 - lng1) * t);
    const curvedLat = lat1 + (lat2 - lat1) * t + Math.sin(Math.PI * t) * arcLift;
    const lat = Math.max(-84, Math.min(84, curvedLat));
    coords.push([lng, lat]);
  }

  return coords;
}

function simplifyLine(points: [number, number][], targetRatio = 0.7) {
  if (points.length <= 3) return points;
  const step = Math.max(2, Math.round(1 / Math.max(0.1, 1 - targetRatio)));
  const result: [number, number][] = [];
  for (let index = 0; index < points.length; index += 1) {
    if (index === 0 || index === points.length - 1 || index % step === 0) {
      result.push(points[index]);
    }
  }
  return result;
}

function simplifyGeometry(geometry: any) {
  if (!geometry?.type || !geometry?.coordinates) return geometry;
  if (geometry.type === 'Polygon') {
    return {
      ...geometry,
      coordinates: (geometry.coordinates as [number, number][][]).map((ring) =>
        simplifyLine(ring as [number, number][], 0.7)
      ),
    };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: (geometry.coordinates as [number, number][][][]).map((polygon) =>
        polygon.map((ring) => simplifyLine(ring as [number, number][], 0.7))
      ),
    };
  }
  return geometry;
}

export default function MapPage() {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoverRegionRef = useRef<string | number | null>(null);
  const appliedQueryRef = useRef<string>('');
  const parallelAnimationRef = useRef<number | null>(null);
  const mapReadyRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const focusMythologyRef = useRef<(mythologyId: string) => void>(() => undefined);
  const mythologyByIdRef = useRef<Map<string, Mythology>>(new Map());
  const parallelGeoJsonRef = useRef<any>(null);
  const parallelHeatGeoJsonRef = useRef<any>(null);
  const influenceGeoJsonRef = useRef<any>(null);
  const prefetchedMythologiesRef = useRef<Set<string>>(new Set());

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [parallelMode, setParallelMode] = useState(false);
  const [influenceMode, setInfluenceMode] = useState(false);
  const [connectionHeatmap, setConnectionHeatmap] = useState(false);
  const [archaeologyLayerEnabled, setArchaeologyLayerEnabled] = useState(false);
  const [selectedParallelConnectionId, setSelectedParallelConnectionId] = useState<string | null>(null);
  const [hoveredParallelConnectionId, setHoveredParallelConnectionId] = useState<string | null>(null);
  const [selectedInfluenceConnectionId, setSelectedInfluenceConnectionId] = useState<string | null>(null);
  const [hoveredInfluenceConnectionId, setHoveredInfluenceConnectionId] = useState<string | null>(null);

  const [selectedMythologyId, setSelectedMythologyId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('overview');
  const [detail, setDetail] = useState<DetailTarget | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [tooltip, setTooltip] = useState<{ title: string; subtitle?: string; x: number; y: number } | null>(null);
  const [coords, setCoords] = useState(INITIAL_CENTER);
  const [bearing, setBearing] = useState(0);
  const [scale, setScale] = useState({ width: 80, label: '100 km' });
  const [reducedMotion, setReducedMotion] = useState(false);

  const [mythologyFilters, setMythologyFilters] = useState<string[]>([]);
  const [mythTypeFilters, setMythTypeFilters] = useState<string[]>([]);
  const [eraFilters, setEraFilters] = useState<EraBucket[]>([]);
  const [archaeologyPeriodFilters, setArchaeologyPeriodFilters] = useState<ArchaeologyPeriodBucket[]>([]);
  const [themeFilters, setThemeFilters] = useState<string[]>([]);
  const [dnaElementFilters, setDnaElementFilters] = useState<string[]>([]);
  const [querySignature, setQuerySignature] = useState('');

  const [contentVisibility, setContentVisibility] = useState({
    sites: true,
    myths: true,
    deities: true,
  });

  const [layerVisibility, setLayerVisibility] = useState({
    regions: true,
    sites: true,
    myths: true,
    deities: true,
  });

  useEffect(() => {
    mapReadyRef.current = mapReady;
  }, [mapReady]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  const bundles = useMemo(() => getMythologyBundles(), []);
  const mythologies = useMemo(() => mythologiesCatalog as Mythology[], []);
  const myths = useMemo(() => mythsCatalog, []);
  const deities = useMemo(() => deitiesCatalog as Deity[], []);
  const sites = useMemo(() => sacredSitesCatalog as SiteData[], []);

  const mythologyById = useMemo(() => new Map(mythologies.map((m) => [m.id, m])), [mythologies]);
  const mythById = useMemo(() => new Map(myths.map((m) => [m.id, m])), [myths]);
  const deityById = useMemo(() => new Map(deities.map((d) => [d.id, d])), [deities]);
  const siteById = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites]);
  const siteArchaeologyMetaById = useMemo(
    () =>
      new Map(
        sites.map((site) => [
          site.id,
          {
            protectionStatus: siteProtectionStatus(site) || 'unprotected',
            excavationStatus: siteExcavationStatus(site) || 'protected',
            artifactCount: siteArtifactCount(site),
            hasForeignMuseums: siteHasForeignMuseumHoldings(site),
            archaeologyPeriod: siteArchaeologyPeriod(site),
          },
        ])
      ),
    [sites]
  );

  const selectedBundle = useMemo(
    () => (selectedMythologyId ? getMythologyBundle(selectedMythologyId) ?? null : null),
    [selectedMythologyId]
  );
  const selectedMythology = selectedBundle?.mythology ?? null;
  const selectedMyths = selectedBundle?.myths ?? [];
  const selectedDeities = selectedBundle?.deities ?? [];
  const selectedSites = selectedBundle?.sites ?? [];

  const countsByMythology = useMemo(() => {
    const mythCounts = new Map<string, number>();
    const deityCounts = new Map<string, number>();
    bundles.forEach((bundle) => {
      mythCounts.set(bundle.mythology.id, bundle.datasetCounts.myths);
      deityCounts.set(bundle.mythology.id, bundle.datasetCounts.deities);
    });
    return { mythCounts, deityCounts };
  }, [bundles]);

  useEffect(() => {
    let previous = '';
    const sync = () => {
      const next = window.location.search || '';
      if (next !== previous) {
        previous = next;
        setQuerySignature(next);
      }
    };

    sync();
    const intervalId = window.setInterval(sync, 250);
    window.addEventListener('popstate', sync);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const resolvedParallelConnections = useMemo(
    () =>
      mapParallelConnections
        .map((connection) => {
          const fromMyth = mythById.get(connection.fromMythId);
          const toMyth = mythById.get(connection.toMythId);
          if (!fromMyth || !toMyth) return null;
          return {
            id: connection.id,
            themeId: connection.themeId,
            similarity: connection.similarity,
            rationale: connection.rationale,
            themeColor: parallelThemeColorById[connection.themeId] ?? 'rgb(201, 168, 76)',
            fromMyth,
            toMyth,
          } satisfies ResolvedParallelConnection;
        })
        .filter((connection): connection is ResolvedParallelConnection => connection !== null)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 50),
    [mythById]
  );

  const parallelConnectionGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: resolvedParallelConnections.map((connection) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: buildArcCoordinates(
            [connection.fromMyth.origin.lng, connection.fromMyth.origin.lat],
            [connection.toMyth.origin.lng, connection.toMyth.origin.lat]
          ),
        },
        properties: {
          id: connection.id,
          themeId: connection.themeId,
          themeColor: connection.themeColor,
          similarity: connection.similarity,
          rationale: connection.rationale,
          fromMythId: connection.fromMyth.id,
          toMythId: connection.toMyth.id,
          fromMythName: connection.fromMyth.name,
          toMythName: connection.toMyth.name,
        },
      })),
    }),
    [resolvedParallelConnections]
  );

  const parallelConnectionById = useMemo(
    () => new Map(resolvedParallelConnections.map((connection) => [connection.id, connection])),
    [resolvedParallelConnections]
  );

  const activeParallelConnection = useMemo(
    () =>
      selectedParallelConnectionId
        ? parallelConnectionById.get(selectedParallelConnectionId) ?? null
        : null,
    [parallelConnectionById, selectedParallelConnectionId]
  );

  const hoveredParallelConnection = useMemo(
    () =>
      hoveredParallelConnectionId
        ? parallelConnectionById.get(hoveredParallelConnectionId) ?? null
        : null,
    [hoveredParallelConnectionId, parallelConnectionById]
  );

  const emphasizedMythIds = useMemo(() => {
    const selected = hoveredParallelConnection || activeParallelConnection;
    if (!selected) return [] as string[];
    return [selected.fromMyth.id, selected.toMyth.id];
  }, [activeParallelConnection, hoveredParallelConnection]);

  const connectionHeatGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: resolvedParallelConnections.flatMap((connection) => {
        const from = [connection.fromMyth.origin.lng, connection.fromMyth.origin.lat] as [number, number];
        const to = [connection.toMyth.origin.lng, connection.toMyth.origin.lat] as [number, number];
        const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2] as [number, number];
        return [from, to, mid].map((coords, index) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: coords },
          properties: {
            id: `${connection.id}-${index}`,
            weight: Math.max(1, connection.similarity / 12),
          },
        }));
      }),
    }),
    [resolvedParallelConnections]
  );

  const influenceGeoJson = useMemo(() => getInfluenceMapGeoJson(), []);

  const influenceConnectionById = useMemo(
    () =>
      new Map(
        influenceGeoJson.features.map((feature) => [feature.properties.id, feature.properties as ResolvedInfluenceConnection])
      ),
    [influenceGeoJson.features]
  );

  const activeInfluenceConnection = useMemo(
    () =>
      selectedInfluenceConnectionId
        ? influenceConnectionById.get(selectedInfluenceConnectionId) ?? null
        : null,
    [influenceConnectionById, selectedInfluenceConnectionId]
  );

  const hoveredInfluenceConnection = useMemo(
    () =>
      hoveredInfluenceConnectionId
        ? influenceConnectionById.get(hoveredInfluenceConnectionId) ?? null
        : null,
    [hoveredInfluenceConnectionId, influenceConnectionById]
  );

  const canCompareInfluenceConnection = useMemo(
    () =>
      activeInfluenceConnection
        ? mythologyById.has(activeInfluenceConnection.sourceId) &&
          mythologyById.has(activeInfluenceConnection.targetId)
        : false,
    [activeInfluenceConnection, mythologyById]
  );

  useEffect(() => {
    mythologyByIdRef.current = mythologyById;
  }, [mythologyById]);

  useEffect(() => {
    parallelGeoJsonRef.current = parallelConnectionGeoJson;
  }, [parallelConnectionGeoJson]);

  useEffect(() => {
    parallelHeatGeoJsonRef.current = connectionHeatGeoJson;
  }, [connectionHeatGeoJson]);

  useEffect(() => {
    influenceGeoJsonRef.current = influenceGeoJson;
  }, [influenceGeoJson]);

  const mythTypes = useMemo(() => Array.from(new Set(myths.map((m) => m.type))).sort(), [myths]);
  const themeTags = useMemo(() => {
    const freq = new Map<string, number>();
    myths.forEach((myth) => {
      myth.themes?.forEach((theme) => {
        const key = theme.toLowerCase();
        freq.set(key, (freq.get(key) ?? 0) + 1);
      });
    });
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([key]) => key);
  }, [myths]);

  const activeFilterCount = useMemo(() => {
    let count =
      mythologyFilters.length +
      mythTypeFilters.length +
      eraFilters.length +
      archaeologyPeriodFilters.length +
      themeFilters.length +
      dnaElementFilters.length;
    if (!contentVisibility.sites) count += 1;
    if (!contentVisibility.myths) count += 1;
    if (!contentVisibility.deities) count += 1;
    return count;
  }, [
    contentVisibility,
    archaeologyPeriodFilters.length,
    dnaElementFilters.length,
    eraFilters.length,
    mythologyFilters.length,
    mythTypeFilters.length,
    themeFilters.length,
  ]);

  const mythsMatchingDNAElements = useMemo(() => {
    if (!dnaElementFilters.length) return [] as string[];
    return myths
      .filter((myth) => dnaElementFilters.every((element) => myth.dna.elements.includes(element)))
      .map((myth) => myth.id);
  }, [dnaElementFilters, myths]);

  const searchResults = useMemo(() => {
    const dnaFilters = parseDNAQueryFilters(searchQuery);
    const q = dnaFilters.remainingQuery.trim().toLowerCase();
    const hasDNAFilters = dnaFilters.elements.length > 0 || dnaFilters.archetypes.length > 0;
    if (!hasDNAFilters && q.length < 2) return [] as SearchResult[];

    const nameOf = (id?: string) => mythologyById.get(id || '')?.name ?? id ?? 'Unknown';
    const results: SearchResult[] = [];

    mythologies
      .filter((m) => q.length > 0 && m.name.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((m) => results.push({ kind: 'mythology', id: m.id, title: m.name, subtitle: `${m.region} · ${m.era}`, mythologyId: m.id }));

    const mythMatches = myths
      .filter((m) => (q.length > 0 ? m.name.toLowerCase().includes(q) : true))
      .filter((m) => (!hasDNAFilters ? true : mythMatchesDNAFilters(m, dnaFilters)))
      .map((myth) => ({
        myth,
        dnaScore:
          dnaFilters.elements.filter((item) => myth.dna.elements.includes(item)).length * 2 +
          dnaFilters.archetypes.filter((item) => myth.dna.archetypes.includes(item)).length,
      }))
      .sort((a, b) => b.dnaScore - a.dnaScore)
      .slice(0, hasDNAFilters && q.length === 0 ? 10 : 4);

    mythMatches.forEach(({ myth }) =>
      results.push({
        kind: 'myth',
        id: myth.id,
        title: myth.name,
        subtitle: nameOf(myth.mythologyId),
        mythologyId: myth.mythologyId,
        coordinates: [myth.origin.lng, myth.origin.lat],
      })
    );

    deities
      .filter((d) => q.length > 0 && d.name.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((d) =>
        results.push({
          kind: 'deity',
          id: d.id,
          title: d.name,
          subtitle: nameOf(d.mythologyId),
          mythologyId: d.mythologyId,
          coordinates: [d.origin.lng, d.origin.lat],
        })
      );

    sites
      .filter((s) => q.length > 0 && s.name.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((s) =>
        results.push({
          kind: 'site',
          id: s.id,
          title: s.name,
          subtitle: nameOf(s.mythologyId),
          mythologyId: s.mythologyId,
          coordinates: [s.coordinates.lng, s.coordinates.lat],
        })
      );

    return results.slice(0, 12);
  }, [deities, mythologies, myths, mythologyById, searchQuery, sites]);

  const detailData = useMemo(() => {
    if (!detail) return null;
    const subtitle = (id?: string) => mythologyById.get(id || '')?.name ?? 'Unknown mythology';

    if (detail.kind === 'myth') {
      const myth = mythById.get(detail.id);
      if (!myth) return null;
      return {
        title: myth.name,
        subtitle: subtitle(myth.mythologyId),
        description: myth.summary,
        imageUrl: myth.imageUrl,
        chips: [myth.type, ...(myth.themes || []).slice(0, 5)],
      };
    }

    if (detail.kind === 'deity') {
      const deity = deityById.get(detail.id);
      if (!deity) return null;
      return {
        title: deity.name,
        subtitle: subtitle(deity.mythologyId),
        description: deity.description,
        imageUrl: deity.imageUrl,
        chips: [deity.type, ...(deity.domain || []).slice(0, 5)],
      };
    }

    const site = siteById.get(detail.id);
    if (!site) return null;
    return {
      title: site.name,
      subtitle: subtitle(site.mythologyId),
      description: site.description,
      imageUrl: site.imageUrl || '',
      chips: [site.type, ...(site.tags || []).slice(0, 4)],
      meta: site.modernStatus || '',
    };
  }, [deityById, detail, mythById, mythologyById, siteById]);

  const focusMythology = useCallback(
    (mythologyId: string) => {
      const map = mapRef.current;
      const mythology = mythologyById.get(mythologyId);
      if (!map || !mythology) return;
      const [w, s, e, n] = mythology.boundingBox;
      setSelectedMythologyId(mythologyId);
      setTab('overview');
      setDetail(null);
      setFilterOpen(false);
      map.fitBounds(
        [
          [w, s],
          [e, n],
        ],
        {
          duration: reducedMotion ? 0 : 1000,
          maxZoom: 5,
          padding: { left: 80, right: 430, top: 90, bottom: 80 },
        }
      );

      const flashOnArrival = () => {
        if (!map.getSource(SOURCES.regions)) return;
        const regionFeature = map
          .querySourceFeatures(SOURCES.regions)
          .find((feature) => String(feature.properties?.id ?? feature.id ?? '') === mythologyId);
        const regionFeatureId = regionFeature?.id;
        if (regionFeatureId == null) return;
        map.setFeatureState({ source: SOURCES.regions, id: regionFeatureId }, { flash: true });
        window.setTimeout(() => {
          if (map.getSource(SOURCES.regions)) {
            map.setFeatureState({ source: SOURCES.regions, id: regionFeatureId }, { flash: false });
          }
        }, 680);
      };

      map.once('moveend', flashOnArrival);
    },
    [mythologyById, reducedMotion]
  );

  useEffect(() => {
    focusMythologyRef.current = focusMythology;
  }, [focusMythology]);

  const resetView = useCallback(() => {
    mapRef.current?.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      bearing: 0,
      duration: reducedMotion ? 0 : 900,
    });
  }, [reducedMotion]);

  const flyToCoordinates = useCallback(
    (coordinates: [number, number], zoom = 5.5) => {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({
        center: coordinates,
        zoom,
        duration: reducedMotion ? 0 : 760,
      });
    },
    [reducedMotion]
  );

  const selectSearch = useCallback(
    (result: SearchResult) => {
      const map = mapRef.current;
      if (!map) return;

      if (result.kind === 'mythology' && result.mythologyId) {
        focusMythology(result.mythologyId);
      } else {
        if (result.coordinates) {
          flyToCoordinates(result.coordinates, 5.3);
        }
        if (result.kind === 'myth') setDetail({ kind: 'myth', id: result.id });
        if (result.kind === 'deity') setDetail({ kind: 'deity', id: result.id });
        if (result.kind === 'site') setDetail({ kind: 'site', id: result.id });
        if (result.mythologyId) setSelectedMythologyId(result.mythologyId);
      }

      setSearchOpen(false);
      setSearchQuery('');
    },
    [flyToCoordinates, focusMythology]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 1.5,
      maxZoom: 10,
      bearing: 0,
      pitch: 0,
      attributionControl: false,
    });
    map.doubleClickZoom.enable();

    mapRef.current = map;

    let initialized = false;
    let fallbackActivated = false;
    let disposed = false;
    const deferredChunkTimeouts: number[] = [];

    const syncHud = debounce(() => {
      setBearing(map.getBearing());
      setScale(computeScale(map));
    }, 80);

    const onCursor = (event: MapMouseEvent) => {
      setCoords([event.lngLat.lng, event.lngLat.lat]);
    };

    const init = async () => {
      if (initialized) return;
      initialized = true;

      try {
        const manifestResponse = await fetch('/data/by-mythology/manifest.json');
        if (!manifestResponse.ok) throw new Error('GeoJSON manifest failed');
        const manifest = (await manifestResponse.json()) as { mythologies: string[] };

        const emptyFeatureCollection = {
          type: 'FeatureCollection',
          features: [],
        } as any;
        const regionsFeatures: any[] = [];
        const sitesFeatures: any[] = [];
        const mythsFeatures: any[] = [];
        const deitiesFeatures: any[] = [];

        const mythologyLoadOrder = [...manifest.mythologies].sort((a, b) => {
          const aMythology = mythologyByIdRef.current.get(a);
          const bMythology = mythologyByIdRef.current.get(b);
          const aDistance = aMythology
            ? Math.hypot(aMythology.origin.lat - INITIAL_CENTER[1], aMythology.origin.lng - INITIAL_CENTER[0])
            : Number.MAX_SAFE_INTEGER;
          const bDistance = bMythology
            ? Math.hypot(bMythology.origin.lat - INITIAL_CENTER[1], bMythology.origin.lng - INITIAL_CENTER[0])
            : Number.MAX_SAFE_INTEGER;
          return aDistance - bDistance;
        });
        const initialLoadIds = mythologyLoadOrder.slice(0, 8);
        const deferredLoadIds = mythologyLoadOrder.slice(8);

        await Promise.all(
          Object.entries(SITE_TYPES).map(([type, config]) =>
            addSvgImage(map, `site-${type}`, buildIconSvg(config.icon, config.bg, config.stroke))
          )
        );

        map.addSource(SOURCES.regions, { type: 'geojson', data: emptyFeatureCollection });
        map.addLayer({
          id: LAYERS.regionsFill,
          type: 'fill',
          source: SOURCES.regions,
          paint: {
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'flash'], false],
              'rgb(232, 201, 106)',
              ['coalesce', ['get', 'color'], 'rgb(168, 152, 128)'],
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'flash'], false],
              0.64,
              ['boolean', ['feature-state', 'hover'], false],
              0.6,
              0.3,
            ],
          },
        });
        map.addLayer({
          id: LAYERS.regionsLine,
          type: 'line',
          source: SOURCES.regions,
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'flash'], false],
              'rgb(232, 201, 106)',
              ['coalesce', ['get', 'color'], 'rgb(240, 230, 211)'],
            ],
            'line-opacity': 0.55,
            'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 1],
            'line-dasharray': [1.5, 1.8],
          },
        });

        map.addSource(SOURCES.sites, {
          type: 'geojson',
          data: emptyFeatureCollection,
          cluster: true,
          clusterMaxZoom: 4,
          clusterRadius: 46,
        });
        map.addLayer({
          id: LAYERS.siteClusters,
          type: 'circle',
          source: SOURCES.sites,
          filter: ['has', 'point_count'],
          maxzoom: 4,
          paint: {
            'circle-color': ['step', ['get', 'point_count'], 'rgb(201, 168, 76)', 25, 'rgb(232, 201, 106)', 80, 'rgb(244, 228, 193)'],
            'circle-radius': ['step', ['get', 'point_count'], 15, 25, 18, 80, 22],
            'circle-stroke-width': 1.4,
            'circle-stroke-color': 'rgb(244, 228, 193)',
            'circle-opacity': 0.9,
          },
        });
        map.addLayer({
          id: LAYERS.siteClusterCount,
          type: 'symbol',
          source: SOURCES.sites,
          filter: ['has', 'point_count'],
          maxzoom: 4,
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 11 },
          paint: { 'text-color': 'rgb(13, 10, 7)' },
        });
        map.addLayer({
          id: LAYERS.siteGlow,
          type: 'circle',
          source: SOURCES.sites,
          filter: ['!', ['has', 'point_count']],
          minzoom: 4,
          paint: {
            'circle-color': 'rgba(0,0,0,0)',
            'circle-stroke-color': 'rgb(232, 201, 106)',
            'circle-stroke-width': 1.3,
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 4.5, 7, 7, 10, 10.5],
            'circle-blur': 0.4,
            'circle-opacity': 0.28,
          },
        });
        map.addLayer({
          id: LAYERS.sites,
          type: 'symbol',
          source: SOURCES.sites,
          filter: ['!', ['has', 'point_count']],
          minzoom: 4,
          layout: {
            'icon-image': [
              'match',
              ['get', 'type'],
              'temple',
              'site-temple',
              'oracle',
              'site-oracle',
              'battlefield',
              'site-battlefield',
              'burial',
              'site-burial',
              'natural',
              'site-natural',
              'ruins',
              'site-ruins',
              'site-ruins',
            ],
            'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.55, 7, 0.75, 10, 0.95],
            'icon-allow-overlap': true,
          },
        });
        map.addLayer({
          id: LAYERS.siteArchaeologyUnesco,
          type: 'symbol',
          source: SOURCES.sites,
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'protectionStatus'], 'UNESCO']],
          minzoom: 4,
          layout: {
            'text-field': '★',
            'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 10, 14],
            'text-offset': [0.7, -0.8],
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': 'rgb(232, 201, 106)',
            'text-halo-color': 'rgb(26, 21, 16)',
            'text-halo-width': 0.8,
          },
        });
        map.addLayer({
          id: LAYERS.siteArchaeologyActive,
          type: 'circle',
          source: SOURCES.sites,
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'excavationStatus'], 'active_excavation']],
          minzoom: 4,
          paint: {
            'circle-color': 'rgba(0,0,0,0)',
            'circle-stroke-color': 'rgb(232, 201, 106)',
            'circle-stroke-width': 1.2,
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 7, 10, 12],
            'circle-opacity': 0.55,
          },
        });
        map.addLayer({
          id: LAYERS.siteArchaeologyForeign,
          type: 'circle',
          source: SOURCES.sites,
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'hasForeignMuseums'], 'true']],
          minzoom: 4,
          paint: {
            'circle-color': 'rgb(181, 68, 68)',
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 1.4, 10, 2.4],
            'circle-stroke-color': 'rgb(244, 228, 193)',
            'circle-stroke-width': 0.6,
            'circle-translate': [8, 8],
            'circle-opacity': 0.85,
          },
        });

        map.addSource(SOURCES.myths, { type: 'geojson', data: emptyFeatureCollection });
        map.addLayer({
          id: LAYERS.mythGlow,
          type: 'circle',
          source: SOURCES.myths,
          minzoom: 3,
          paint: {
            'circle-color': [
              'match',
              ['get', 'type'],
              ...Object.entries(MYTH_TYPE_COLORS).flat(),
              'rgb(168, 152, 128)',
            ] as any,
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 6, 7, 9, 10, 12],
            'circle-blur': 1,
            'circle-opacity': 0.45,
          },
        });
        map.addLayer({
          id: LAYERS.myths,
          type: 'circle',
          source: SOURCES.myths,
          minzoom: 3,
          paint: {
            'circle-color': [
              'match',
              ['get', 'type'],
              ...Object.entries(MYTH_TYPE_COLORS).flat(),
              'rgb(240, 230, 211)',
            ] as any,
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 2.2, 7, 3.6, 10, 5],
            'circle-stroke-color': 'rgb(244, 228, 193)',
            'circle-stroke-width': 0.8,
            'circle-opacity': 0.98,
          },
        });

        map.addSource(SOURCES.deities, { type: 'geojson', data: emptyFeatureCollection });
        map.addLayer({
          id: LAYERS.deities,
          type: 'circle',
          source: SOURCES.deities,
          minzoom: 4,
          paint: {
            'circle-color': ['coalesce', ['get', 'color'], 'rgb(201, 168, 76)'],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 2, 7, 3, 10, 4],
            'circle-stroke-color': 'rgb(244, 228, 193)',
            'circle-stroke-width': 0.9,
            'circle-opacity': 0.82,
          },
        });

        map.addSource(SOURCES.parallelConnections, {
          type: 'geojson',
            data: parallelGeoJsonRef.current as any,
        });
        map.addLayer({
          id: LAYERS.parallelConnections,
          type: 'line',
          source: SOURCES.parallelConnections,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            visibility: 'none',
          },
          paint: {
            'line-color': ['coalesce', ['get', 'themeColor'], 'rgb(201, 168, 76)'],
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              1.5,
              ['*', ['get', 'similarity'], 0.028],
              6,
              ['*', ['get', 'similarity'], 0.052],
            ],
            'line-opacity': 0.34,
            'line-blur': 1.2,
          },
        });
        map.addLayer({
          id: LAYERS.parallelConnectionsAnimated,
          type: 'line',
          source: SOURCES.parallelConnections,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            visibility: 'none',
          },
          paint: {
            'line-color': ['coalesce', ['get', 'themeColor'], 'rgb(232, 201, 106)'],
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              1.5,
              ['*', ['get', 'similarity'], 0.012],
              6,
              ['*', ['get', 'similarity'], 0.028],
            ],
            'line-opacity': 0.92,
            'line-dasharray': [0, 2.2, 3.2, 2],
          },
        });

        map.addSource(SOURCES.parallelHeat, {
          type: 'geojson',
          data: parallelHeatGeoJsonRef.current as any,
        });
        map.addLayer({
          id: LAYERS.parallelHeat,
          type: 'heatmap',
          source: SOURCES.parallelHeat,
          layout: { visibility: 'none' },
          paint: {
            'heatmap-weight': ['coalesce', ['get', 'weight'], 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 1.5, 0.6, 6, 1.4],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(0,0,0,0)',
              0.25,
              'rgba(202,131,55,0.25)',
              0.5,
              'rgba(232,165,64,0.55)',
              0.8,
              'rgba(247,212,120,0.85)',
              1,
              'rgba(255,234,176,0.95)',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 1.5, 18, 6, 36],
            'heatmap-opacity': 0.74,
          },
        });

        map.addSource(SOURCES.influenceConnections, {
          type: 'geojson',
          data: influenceGeoJsonRef.current as any,
        });
        map.addLayer({
          id: LAYERS.influenceConnections,
          type: 'line',
          source: SOURCES.influenceConnections,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            visibility: 'none',
          },
          paint: {
            'line-color': ['coalesce', ['get', 'color'], 'rgb(201, 168, 76)'],
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              1.5,
              ['*', ['get', 'strength'], 0.8],
              6,
              ['*', ['get', 'strength'], 1.8],
            ],
            'line-dasharray': [
              'match',
              ['get', 'linePattern'],
              'dash',
              ['literal', [7, 5]],
              'dot',
              ['literal', [2, 6]],
              ['literal', [1, 0]],
            ] as any,
            'line-opacity': 0.68,
          },
        });
        map.addLayer({
          id: LAYERS.influenceArrows,
          type: 'symbol',
          source: SOURCES.influenceConnections,
          layout: {
            visibility: 'none',
            'symbol-placement': 'line',
            'symbol-spacing': 90,
            'text-field': '▶',
            'text-size': 10,
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': ['coalesce', ['get', 'color'], 'rgb(201, 168, 76)'],
            'text-opacity': ['case', ['==', ['get', 'arrow'], true], 0.92, 0],
          },
        });

        const setSourceData = (sourceId: string, features: any[]) => {
          if (disposed) return;
          const source = map.getSource(sourceId) as GeoJSONSource | undefined;
          if (!source) return;
          source.setData({
            type: 'FeatureCollection',
            features,
          } as any);
        };

        const loadMythologyChunk = async (chunk: string[]) => {
          if (disposed) return;
          const chunkResponses = await Promise.all(
            chunk.map(async (mythologyId) => {
              if (disposed) return null;
              const [regionsChunk, sitesChunk, mythsChunk, deitiesChunk] = await Promise.all([
                fetch(`/data/by-mythology/${mythologyId}/region.geojson`),
                fetch(`/data/by-mythology/${mythologyId}/sites.geojson`),
                fetch(`/data/by-mythology/${mythologyId}/myths.geojson`),
                fetch(`/data/by-mythology/${mythologyId}/deities.geojson`),
              ]);
              if (!regionsChunk.ok || !sitesChunk.ok || !mythsChunk.ok || !deitiesChunk.ok) {
                throw new Error(`GeoJSON chunk failed for ${mythologyId}`);
              }

              const [regionsData, sitesData, mythsData, deitiesData] = await Promise.all([
                regionsChunk.json(),
                sitesChunk.json(),
                mythsChunk.json(),
                deitiesChunk.json(),
              ]);
              return { regionsData, sitesData, mythsData, deitiesData };
            })
          );

          chunkResponses.forEach((bundle) => {
            if (!bundle) return;
            regionsFeatures.push(
              ...((bundle.regionsData?.features || []) as any[]).map((feature) => ({
                ...feature,
                geometry: simplifyGeometry(feature.geometry),
              }))
            );
            sitesFeatures.push(
              ...((bundle.sitesData?.features || []) as any[]).map((feature) => {
                const siteId = String(feature?.properties?.id || '');
                const siteRecord = siteById.get(siteId);
                const meta = siteArchaeologyMetaById.get(siteId);
                const protectionStatus = meta?.protectionStatus || 'unprotected';
                const excavationStatus = meta?.excavationStatus || 'protected';
                const artifactCount = meta?.artifactCount || 0;
                const hasForeignMuseums = meta?.hasForeignMuseums ? 'true' : 'false';
                const archaeologyPeriod = meta?.archaeologyPeriod || 'ancient';
                return {
                  ...feature,
                  properties: {
                    ...feature.properties,
                    protectionStatus,
                    excavationStatus,
                    artifactCount,
                    hasForeignMuseums,
                    archaeologyPeriod,
                    country: siteRecord?.country || feature?.properties?.country || '',
                  },
                };
              })
            );
            mythsFeatures.push(...(bundle.mythsData?.features || []));
            deitiesFeatures.push(...(bundle.deitiesData?.features || []));
          });

          setSourceData(SOURCES.regions, regionsFeatures);
          setSourceData(SOURCES.sites, sitesFeatures);
          setSourceData(SOURCES.myths, mythsFeatures);
          setSourceData(SOURCES.deities, deitiesFeatures);
        };

        await loadMythologyChunk(initialLoadIds);

        if (deferredLoadIds.length > 0) {
          const chunkSize = 5;
          for (let offset = 0; offset < deferredLoadIds.length; offset += chunkSize) {
            const chunk = deferredLoadIds.slice(offset, offset + chunkSize);
            const sequence = Math.floor(offset / chunkSize);
            const timerId = window.setTimeout(() => {
              if (disposed) return;
              loadMythologyChunk(chunk).catch(() => undefined);
            }, 260 + sequence * 160);
            deferredChunkTimeouts.push(timerId);
          }
        }

        const setPointer = () => {
          map.getCanvas().style.cursor = 'pointer';
        };
        const resetPointer = () => {
          map.getCanvas().style.cursor = '';
        };
        [
          LAYERS.regionsFill,
          LAYERS.siteClusters,
          LAYERS.siteGlow,
          LAYERS.sites,
          LAYERS.siteArchaeologyUnesco,
          LAYERS.siteArchaeologyActive,
          LAYERS.siteArchaeologyForeign,
          LAYERS.myths,
          LAYERS.deities,
          LAYERS.parallelConnections,
          LAYERS.parallelConnectionsAnimated,
          LAYERS.influenceConnections,
          LAYERS.influenceArrows,
        ].forEach((id) => {
          map.on('mouseenter', id, setPointer);
          map.on('mouseleave', id, resetPointer);
        });

        map.on('mousemove', LAYERS.regionsFill, (event) => {
          const feature = event.features?.[0];
          if (!feature) return;
          const next = (feature.id ?? feature.properties?.id) as string | number | undefined;
          if (next == null) return;
          const mythologyId = String(feature.properties?.id ?? next);
          if (hoverRegionRef.current != null && hoverRegionRef.current !== next) {
            map.setFeatureState({ source: SOURCES.regions, id: hoverRegionRef.current }, { hover: false });
          }
          hoverRegionRef.current = next;
          map.setFeatureState({ source: SOURCES.regions, id: next }, { hover: true });
          setTooltip({
            title: String(feature.properties?.name ?? 'Unknown mythology'),
            subtitle: 'Mythology region',
            x: event.point.x,
            y: event.point.y,
          });
          if (mythologyId && !prefetchedMythologiesRef.current.has(mythologyId)) {
            prefetchedMythologiesRef.current.add(mythologyId);
            router.prefetch(`/mythology/${mythologyId}`);
          }
        });

        map.on('mouseleave', LAYERS.regionsFill, () => {
          if (hoverRegionRef.current != null) {
            map.setFeatureState({ source: SOURCES.regions, id: hoverRegionRef.current }, { hover: false });
          }
          hoverRegionRef.current = null;
          setTooltip(null);
        });

        map.on('mousemove', LAYERS.sites, (event) => {
          const feature = event.features?.[0];
          if (!feature) return;
          const name = String(feature.properties?.name || 'Unknown site');
          const protection = String(feature.properties?.protectionStatus || 'unprotected');
          const excavation = String(feature.properties?.excavationStatus || 'protected');
          const artifacts = Number(feature.properties?.artifactCount || 0);
          setTooltip({
            title: name,
            subtitle: `${protection} · ${excavation} · artifacts: ${artifacts}`,
            x: event.point.x,
            y: event.point.y,
          });
        });

        map.on('mouseleave', LAYERS.sites, () => {
          setTooltip(null);
        });

        map.on('click', LAYERS.regionsFill, (event) => {
          const feature = event.features?.[0];
          const id = String(feature?.properties?.id ?? feature?.id ?? '');
          if (id) focusMythologyRef.current(id);
        });

        map.on('click', LAYERS.siteClusters, (event) => {
          const feature = event.features?.[0];
          if (!feature) return;
          const clusterId = Number(feature.properties?.cluster_id);
          if (!Number.isFinite(clusterId)) return;
          const source = map.getSource(SOURCES.sites) as GeoJSONSource;
          source
            .getClusterExpansionZoom(clusterId)
            .then((zoom) => {
            const point = feature.geometry as any;
            map.easeTo({
              center: point.coordinates,
              zoom,
              duration: reducedMotionRef.current ? 0 : 500,
            });
            })
            .catch(() => undefined);
        });

        map.on('click', LAYERS.sites, (event) => {
          const feature = event.features?.[0];
          const id = String(feature?.properties?.id ?? '');
          const mythologyId = String(feature?.properties?.mythologyId ?? '');
          if (!id) return;
          setDetail({ kind: 'site', id });
          if (mythologyId) setSelectedMythologyId(mythologyId);
        });

        map.on('click', LAYERS.myths, (event) => {
          const feature = event.features?.[0];
          const id = String(feature?.properties?.id ?? '');
          const mythologyId = String(feature?.properties?.mythologyId ?? '');
          if (!id) return;
          setDetail({ kind: 'myth', id });
          if (mythologyId) setSelectedMythologyId(mythologyId);
        });

        map.on('click', LAYERS.deities, (event) => {
          const feature = event.features?.[0];
          const id = String(feature?.properties?.id ?? '');
          const mythologyId = String(feature?.properties?.mythologyId ?? '');
          if (!id) return;
          setDetail({ kind: 'deity', id });
          if (mythologyId) setSelectedMythologyId(mythologyId);
        });

        map.on('click', LAYERS.parallelConnectionsAnimated, (event) => {
          const feature = event.features?.[0];
          const connectionId = String(feature?.properties?.id ?? '');
          if (!connectionId) return;
          setSelectedParallelConnectionId(connectionId);
          setDetail(null);
        });

        map.on('click', LAYERS.parallelConnections, (event) => {
          const feature = event.features?.[0];
          const connectionId = String(feature?.properties?.id ?? '');
          if (!connectionId) return;
          setSelectedParallelConnectionId(connectionId);
          setDetail(null);
        });

        map.on('click', LAYERS.influenceConnections, (event) => {
          const feature = event.features?.[0];
          const connectionId = String(feature?.properties?.id ?? '');
          if (!connectionId) return;
          setSelectedInfluenceConnectionId(connectionId);
          setDetail(null);
        });

        map.on('click', LAYERS.influenceArrows, (event) => {
          const feature = event.features?.[0];
          const connectionId = String(feature?.properties?.id ?? '');
          if (!connectionId) return;
          setSelectedInfluenceConnectionId(connectionId);
          setDetail(null);
        });

        map.on('click', (event) => {
          const features = map.queryRenderedFeatures(event.point, {
            layers: [
              LAYERS.regionsFill,
              LAYERS.sites,
              LAYERS.siteClusters,
              LAYERS.myths,
              LAYERS.deities,
              LAYERS.parallelConnections,
              LAYERS.parallelConnectionsAnimated,
              LAYERS.influenceConnections,
              LAYERS.influenceArrows,
            ],
          });
          if (features.length > 0) return;
          setDetail(null);
          setSelectedParallelConnectionId(null);
          setSelectedInfluenceConnectionId(null);
        });

        const onParallelHover = (event: any) => {
          const feature = event.features?.[0];
          const connectionId = String(feature?.properties?.id ?? '');
          if (!connectionId) return;
          setHoveredParallelConnectionId(connectionId);
        };
        const onParallelLeave = () => setHoveredParallelConnectionId(null);

        map.on('mousemove', LAYERS.parallelConnectionsAnimated, onParallelHover);
        map.on('mousemove', LAYERS.parallelConnections, onParallelHover);
        map.on('mouseleave', LAYERS.parallelConnectionsAnimated, onParallelLeave);
        map.on('mouseleave', LAYERS.parallelConnections, onParallelLeave);

        const onInfluenceHover = (event: any) => {
          const feature = event.features?.[0];
          const connectionId = String(feature?.properties?.id ?? '');
          if (!connectionId) return;
          setHoveredInfluenceConnectionId(connectionId);
        };
        const onInfluenceLeave = () => setHoveredInfluenceConnectionId(null);

        map.on('mousemove', LAYERS.influenceConnections, onInfluenceHover);
        map.on('mousemove', LAYERS.influenceArrows, onInfluenceHover);
        map.on('mouseleave', LAYERS.influenceConnections, onInfluenceLeave);
        map.on('mouseleave', LAYERS.influenceArrows, onInfluenceLeave);

        syncHud();
        setMapError(null);
        setMapReady(true);
      } catch (_error) {
        setMapError('Map data failed to load. Please refresh.');
      }
    };

    map.on('error', (event) => {
      const msg = event.error?.message ?? '';
      if (!fallbackActivated && (msg.includes('401') || msg.includes('403'))) {
        fallbackActivated = true;
        map.setStyle(MAP_STYLE_FALLBACK);
        return;
      }
      if (!mapReadyRef.current) setMapError('Map style failed to load.');
    });

    map.on('load', init);
    map.on('move', syncHud);
    map.on('zoom', syncHud);
    map.on('rotate', syncHud);
    map.on('mousemove', onCursor);

    return () => {
      disposed = true;
      map.off('move', syncHud);
      map.off('zoom', syncHud);
      map.off('rotate', syncHud);
      map.off('mousemove', onCursor);
      deferredChunkTimeouts.forEach((timerId) => window.clearTimeout(timerId));
      if (parallelAnimationRef.current != null) {
        cancelAnimationFrame(parallelAnimationRef.current);
        parallelAnimationRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, [router, siteArchaeologyMetaById, siteById]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const source = mapRef.current.getSource(SOURCES.parallelConnections) as GeoJSONSource | undefined;
    if (source) source.setData(parallelConnectionGeoJson as any);
    const heatSource = mapRef.current.getSource(SOURCES.parallelHeat) as GeoJSONSource | undefined;
    if (heatSource) heatSource.setData(connectionHeatGeoJson as any);
    const influenceSource = mapRef.current.getSource(SOURCES.influenceConnections) as
      | GeoJSONSource
      | undefined;
    if (influenceSource) influenceSource.setData(influenceGeoJson as any);
  }, [connectionHeatGeoJson, influenceGeoJson, mapReady, parallelConnectionGeoJson]);

  useEffect(() => {
    if (!querySignature) return;
    const params = new URLSearchParams(querySignature.replace(/^\?/, ''));
    const signature = params.toString();
    if (!signature || signature === appliedQueryRef.current) return;

    const requestedThemes = (params.get('theme') || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    if (requestedThemes.length) setThemeFilters(requestedThemes);

    const requestedDNAElements = (params.get('dnaElements') || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => (DNA_ELEMENT_UNIVERSE as readonly string[]).includes(item));
    if (requestedDNAElements.length) setDnaElementFilters(requestedDNAElements);

    const mythologyId = params.get('mythologyId');
    if (mythologyId && mythologyById.has(mythologyId) && mapReady) {
      focusMythology(mythologyId);
    }

    if (mapReady && mapRef.current) {
      const focusKind = params.get('focusKind');
      const focusId = params.get('focusId');
      const lat = Number(params.get('lat'));
      const lng = Number(params.get('lng'));

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 5.4, duration: reducedMotion ? 0 : 850 });
      }

      if (focusId && focusKind === 'myth') setDetail({ kind: 'myth', id: focusId });
      if (focusId && focusKind === 'deity') setDetail({ kind: 'deity', id: focusId });
      if (focusId && focusKind === 'site') setDetail({ kind: 'site', id: focusId });

      if (mythologyId) setSelectedMythologyId(mythologyId);
    }

    appliedQueryRef.current = signature;
  }, [focusMythology, mapReady, mythologyById, querySignature, reducedMotion]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (parallelAnimationRef.current != null) {
      cancelAnimationFrame(parallelAnimationRef.current);
      parallelAnimationRef.current = null;
    }

    if (reducedMotion || !parallelMode || !map.getLayer(LAYERS.parallelConnectionsAnimated)) return;

    let phase = 0;
    const animate = () => {
      phase = (phase + 0.02) % 1;
      const lead = 1.8 + phase * 2.8;
      if (map.getLayer(LAYERS.parallelConnectionsAnimated)) {
        map.setPaintProperty(
          LAYERS.parallelConnectionsAnimated,
          'line-dasharray',
          [0, lead, 3.4, 2] as any
        );
      }
      parallelAnimationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (parallelAnimationRef.current != null) {
        cancelAnimationFrame(parallelAnimationRef.current);
        parallelAnimationRef.current = null;
      }
    };
  }, [mapReady, parallelMode, reducedMotion]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const dimExpression = archaeologyPeriodFilters.length
      ? ([
          'case',
          ['in', ['get', 'archaeologyPeriod'], ['literal', archaeologyPeriodFilters]],
          0.22,
          0.06,
        ] as any)
      : (0.22 as any);

    if (reducedMotion) {
      if (map.getLayer(LAYERS.mythGlow)) {
        map.setPaintProperty(LAYERS.mythGlow, 'circle-radius', [
          'interpolate',
          ['linear'],
          ['zoom'],
          3,
          6,
          7,
          9,
          10,
          12,
        ] as any);
      }
      if (map.getLayer(LAYERS.siteGlow)) {
        map.setPaintProperty(LAYERS.siteGlow, 'circle-opacity', dimExpression);
      }
      if (map.getLayer(LAYERS.siteArchaeologyActive)) {
        map.setPaintProperty(LAYERS.siteArchaeologyActive, 'circle-radius', ['interpolate', ['linear'], ['zoom'], 4, 8, 10, 12] as any);
        map.setPaintProperty(LAYERS.siteArchaeologyActive, 'circle-opacity', 0.45 as any);
      }
      return;
    }

    let frame: number | null = null;
    let phase = 0;

    const animate = () => {
      phase += 0.052;
      const mythPulse = 8 + Math.sin(phase) * 2;
      const sitePulse = 6 + Math.sin(phase * 0.9 + 0.8) * 1.5;
      const regionHoverOpacity = 0.54 + Math.sin(phase * 1.35) * 0.09;

      if (map.getLayer(LAYERS.mythGlow)) {
        map.setPaintProperty(LAYERS.mythGlow, 'circle-radius', [
          'interpolate',
          ['linear'],
          ['zoom'],
          3,
          mythPulse - 2,
          7,
          mythPulse,
          10,
          mythPulse + 2.4,
        ] as any);
      }

      if (map.getLayer(LAYERS.siteGlow)) {
        map.setPaintProperty(LAYERS.siteGlow, 'circle-radius', [
          'interpolate',
          ['linear'],
          ['zoom'],
          4,
          sitePulse - 1,
          7,
          sitePulse,
          10,
          sitePulse + 2,
        ] as any);
        map.setPaintProperty(
          LAYERS.siteGlow,
          'circle-opacity',
          archaeologyPeriodFilters.length
            ? ([
                'case',
                ['in', ['get', 'archaeologyPeriod'], ['literal', archaeologyPeriodFilters]],
                0.24 + Math.sin(phase) * 0.04,
                0.06,
              ] as any)
            : ((0.22 + Math.sin(phase) * 0.05) as any)
        );
      }

      if (map.getLayer(LAYERS.siteArchaeologyActive)) {
        map.setPaintProperty(LAYERS.siteArchaeologyActive, 'circle-radius', [
          'interpolate',
          ['linear'],
          ['zoom'],
          4,
          7 + Math.sin(phase * 1.6) * 1.1,
          10,
          11.5 + Math.sin(phase * 1.6) * 1.3,
        ] as any);
        map.setPaintProperty(
          LAYERS.siteArchaeologyActive,
          'circle-opacity',
          0.38 + Math.sin(phase * 1.35) * 0.17 as any
        );
      }

      if (map.getLayer(LAYERS.regionsLine)) {
        const lead = 1.1 + ((Math.sin(phase) + 1) / 2) * 2.2;
        map.setPaintProperty(LAYERS.regionsLine, 'line-dasharray', [0.6, lead] as any);
      }

      if (map.getLayer(LAYERS.regionsFill)) {
        map.setPaintProperty(LAYERS.regionsFill, 'fill-opacity', [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          regionHoverOpacity,
          0.28,
        ] as any);
      }

      frame = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [archaeologyPeriodFilters, mapReady, reducedMotion]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    const hasValues = (field: string, values: readonly string[]) => ['in', ['get', field], ['literal', values]];
    const makeAll = (clauses: any[]) => (clauses.length ? (['all', ...clauses] as any) : null);

    const regionClauses: any[] = [];
    if (mythologyFilters.length) regionClauses.push(hasValues('id', mythologyFilters));
    if (eraFilters.length) regionClauses.push(hasValues('eraBucket', eraFilters));

    const mythClauses: any[] = [];
    if (mythologyFilters.length) mythClauses.push(hasValues('mythologyId', mythologyFilters));
    if (mythTypeFilters.length) mythClauses.push(hasValues('type', mythTypeFilters));
    if (eraFilters.length) mythClauses.push(hasValues('eraBucket', eraFilters));
    if (themeFilters.length) {
      mythClauses.push([
        'any',
        ...themeFilters.map((tag) => [
          '>=',
          ['index-of', tag.toLowerCase(), ['downcase', ['coalesce', ['get', 'themes'], '']]],
          0,
        ]),
      ]);
    }
    if (dnaElementFilters.length) {
      mythClauses.push(
        mythsMatchingDNAElements.length
          ? hasValues('id', mythsMatchingDNAElements)
          : (['==', ['get', 'id'], '__dna_no_match__'] as any)
      );
    }

    const siteClauses: any[] = [];
    if (mythologyFilters.length) siteClauses.push(hasValues('mythologyId', mythologyFilters));
    if (eraFilters.length) siteClauses.push(hasValues('eraBucket', eraFilters));

    const deityClauses: any[] = [];
    if (mythologyFilters.length) deityClauses.push(hasValues('mythologyId', mythologyFilters));
    if (eraFilters.length) deityClauses.push(hasValues('eraBucket', eraFilters));

    const influenceClauses: any[] = [];
    if (mythologyFilters.length) {
      influenceClauses.push([
        'any',
        hasValues('sourceId', mythologyFilters),
        hasValues('targetId', mythologyFilters),
      ]);
    }
    if (eraFilters.length) influenceClauses.push(hasValues('eraBucket', eraFilters));

    const regionFilter = makeAll(regionClauses);
    const mythFilter = makeAll(mythClauses);
    const siteFilter = makeAll(siteClauses);
    const deityFilter = makeAll(deityClauses);
    const influenceFilter = makeAll(influenceClauses);

    if (map.getLayer(LAYERS.regionsFill)) map.setFilter(LAYERS.regionsFill, regionFilter);
    if (map.getLayer(LAYERS.regionsLine)) map.setFilter(LAYERS.regionsLine, regionFilter);

    if (map.getLayer(LAYERS.siteClusters)) map.setFilter(LAYERS.siteClusters, siteFilter);
    if (map.getLayer(LAYERS.siteClusterCount)) map.setFilter(LAYERS.siteClusterCount, siteFilter);
    if (map.getLayer(LAYERS.sites)) map.setFilter(LAYERS.sites, siteFilter);
    if (map.getLayer(LAYERS.siteArchaeologyUnesco)) {
      map.setFilter(
        LAYERS.siteArchaeologyUnesco,
        siteFilter
          ? ([
              'all',
              ['!', ['has', 'point_count']],
              ['==', ['get', 'protectionStatus'], 'UNESCO'],
              siteFilter,
            ] as any)
          : (['all', ['!', ['has', 'point_count']], ['==', ['get', 'protectionStatus'], 'UNESCO']] as any)
      );
    }
    if (map.getLayer(LAYERS.siteArchaeologyActive)) {
      map.setFilter(
        LAYERS.siteArchaeologyActive,
        siteFilter
          ? ([
              'all',
              ['!', ['has', 'point_count']],
              ['==', ['get', 'excavationStatus'], 'active_excavation'],
              siteFilter,
            ] as any)
          : (['all', ['!', ['has', 'point_count']], ['==', ['get', 'excavationStatus'], 'active_excavation']] as any)
      );
    }
    if (map.getLayer(LAYERS.siteArchaeologyForeign)) {
      map.setFilter(
        LAYERS.siteArchaeologyForeign,
        siteFilter
          ? ([
              'all',
              ['!', ['has', 'point_count']],
              ['==', ['get', 'hasForeignMuseums'], 'true'],
              siteFilter,
            ] as any)
          : (['all', ['!', ['has', 'point_count']], ['==', ['get', 'hasForeignMuseums'], 'true']] as any)
      );
    }

    const siteOpacityExpression = archaeologyPeriodFilters.length
      ? ([
          'case',
          ['in', ['get', 'archaeologyPeriod'], ['literal', archaeologyPeriodFilters]],
          1,
          0.2,
        ] as any)
      : (1 as any);
    if (map.getLayer(LAYERS.sites)) {
      map.setPaintProperty(LAYERS.sites, 'icon-opacity', siteOpacityExpression);
    }

    if (map.getLayer(LAYERS.mythGlow)) map.setFilter(LAYERS.mythGlow, mythFilter);
    if (map.getLayer(LAYERS.myths)) map.setFilter(LAYERS.myths, mythFilter);

    if (map.getLayer(LAYERS.deities)) map.setFilter(LAYERS.deities, deityFilter);
    if (map.getLayer(LAYERS.influenceConnections)) map.setFilter(LAYERS.influenceConnections, influenceFilter);
    if (map.getLayer(LAYERS.influenceArrows)) map.setFilter(LAYERS.influenceArrows, influenceFilter);

    const focusedConnectionId = hoveredParallelConnectionId || selectedParallelConnectionId;
    if (map.getLayer(LAYERS.parallelConnections)) {
      map.setPaintProperty(
        LAYERS.parallelConnections,
        'line-opacity',
        focusedConnectionId
          ? ([
              'case',
              ['==', ['get', 'id'], focusedConnectionId],
              0.82,
              0.08,
            ] as any)
          : (0.34 as any)
      );
    }
    if (map.getLayer(LAYERS.parallelConnectionsAnimated)) {
      map.setPaintProperty(
        LAYERS.parallelConnectionsAnimated,
        'line-opacity',
        focusedConnectionId
          ? ([
              'case',
              ['==', ['get', 'id'], focusedConnectionId],
              1,
              0.14,
            ] as any)
          : (0.92 as any)
      );
    }

    const focusedInfluenceId = hoveredInfluenceConnectionId || selectedInfluenceConnectionId;
    if (map.getLayer(LAYERS.influenceConnections)) {
      map.setPaintProperty(
        LAYERS.influenceConnections,
        'line-opacity',
        focusedInfluenceId
          ? ([
              'case',
              ['==', ['get', 'id'], focusedInfluenceId],
              0.95,
              0.12,
            ] as any)
          : (0.68 as any)
      );
    }
    if (map.getLayer(LAYERS.influenceArrows)) {
      map.setPaintProperty(
        LAYERS.influenceArrows,
        'text-opacity',
        focusedInfluenceId
          ? ([
              'case',
              ['==', ['get', 'id'], focusedInfluenceId],
              0.95,
              0.15,
            ] as any)
          : ([
              'case',
              ['==', ['get', 'arrow'], true],
              0.92,
              0,
            ] as any)
      );
    }
    if (map.getLayer(LAYERS.myths)) {
      map.setPaintProperty(
        LAYERS.myths,
        'circle-opacity',
        parallelMode && emphasizedMythIds.length
          ? ([
              'case',
              ['in', ['get', 'id'], ['literal', emphasizedMythIds]],
              1,
              0.24,
            ] as any)
          : (0.98 as any)
      );
    }
    if (map.getLayer(LAYERS.mythGlow)) {
      map.setPaintProperty(
        LAYERS.mythGlow,
        'circle-opacity',
        parallelMode && emphasizedMythIds.length
          ? ([
              'case',
              ['in', ['get', 'id'], ['literal', emphasizedMythIds]],
              0.64,
              0.12,
            ] as any)
          : (0.45 as any)
      );
    }

    const visible = {
      regions: layerVisibility.regions,
      sites: layerVisibility.sites && contentVisibility.sites,
      myths: layerVisibility.myths && contentVisibility.myths,
      deities: layerVisibility.deities && contentVisibility.deities,
    };

    const setVisibility = (layerId: string, isVisible: boolean) => {
      if (!map.getLayer(layerId)) return;
      map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
    };

    setVisibility(LAYERS.regionsFill, visible.regions);
    setVisibility(LAYERS.regionsLine, visible.regions);
    setVisibility(LAYERS.siteClusters, visible.sites);
    setVisibility(LAYERS.siteClusterCount, visible.sites);
    setVisibility(LAYERS.siteGlow, visible.sites);
    setVisibility(LAYERS.sites, visible.sites);
    setVisibility(LAYERS.siteArchaeologyUnesco, visible.sites && archaeologyLayerEnabled);
    setVisibility(LAYERS.siteArchaeologyActive, visible.sites && archaeologyLayerEnabled);
    setVisibility(LAYERS.siteArchaeologyForeign, visible.sites && archaeologyLayerEnabled);
    setVisibility(LAYERS.mythGlow, visible.myths);
    setVisibility(LAYERS.myths, visible.myths);
    setVisibility(LAYERS.deities, visible.deities);
    setVisibility(LAYERS.parallelConnections, parallelMode);
    setVisibility(LAYERS.parallelConnectionsAnimated, parallelMode);
    setVisibility(LAYERS.parallelHeat, parallelMode && connectionHeatmap);
    setVisibility(LAYERS.influenceConnections, influenceMode);
    setVisibility(LAYERS.influenceArrows, influenceMode);
  }, [
    archaeologyLayerEnabled,
    archaeologyPeriodFilters,
    connectionHeatmap,
    contentVisibility,
    emphasizedMythIds,
    eraFilters,
    hoveredInfluenceConnectionId,
    hoveredParallelConnectionId,
    influenceMode,
    layerVisibility,
    mapReady,
    mythologyFilters,
    mythTypeFilters,
    mythsMatchingDNAElements,
    parallelMode,
    selectedInfluenceConnectionId,
    selectedParallelConnectionId,
    dnaElementFilters,
    themeFilters,
  ]);

  const clearFilters = () => {
    setMythologyFilters([]);
    setMythTypeFilters([]);
    setEraFilters([]);
    setArchaeologyPeriodFilters([]);
    setThemeFilters([]);
    setDnaElementFilters([]);
    setContentVisibility({ sites: true, myths: true, deities: true });
  };

  useEffect(() => {
    if (!parallelMode) {
      setSelectedParallelConnectionId(null);
      setHoveredParallelConnectionId(null);
    }
  }, [parallelMode]);

  useEffect(() => {
    if (!influenceMode) {
      setSelectedInfluenceConnectionId(null);
      setHoveredInfluenceConnectionId(null);
    }
  }, [influenceMode]);

  const panelTabs: TabKey[] = ['overview', 'myths', 'deities', 'sites'];
  const activePanelTabIndex = panelTabs.indexOf(tab);

  return (
    <div className="relative h-[calc(100vh-var(--header-height))] w-full overflow-hidden bg-background">
      <div
        ref={mapContainerRef}
        className="map-container absolute inset-0"
        role="application"
        aria-label="Interactive mythology map"
        tabIndex={0}
      />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_55%_42%,rgba(201,168,76,0.08),rgba(9,7,5,0.22)_55%,rgba(7,6,5,0.38)_100%)]" />
      <div className="map-sepia-overlay" />

      <div className="sr-only">
        <h2>Mythology regions on map</h2>
        <ul>
          {mythologies.map((mythology) => (
            <li key={`sr-${mythology.id}`}>
              {mythology.name} region near {mythology.region}
            </li>
          ))}
        </ul>
      </div>

      {tooltip && (
        <div
          className="tooltip-surface pointer-events-none absolute z-30"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <p>{tooltip.title}</p>
          {tooltip.subtitle && <p className="mt-0.5 text-[10px] text-secondary">{tooltip.subtitle}</p>}
        </div>
      )}

      {!mapReady && !mapError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="ancient-card w-[min(92vw,360px)] p-5 text-center">
            <p className="font-heading text-lg text-gold">Harita hazirlaniyor</p>
            <p className="mt-2 text-sm text-secondary">
              Katmanlar yukleniyor, kutsal alanlar ve mit cografyasi yerlesiyor.
            </p>
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-50 overflow-y-auto bg-background/95 p-6 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 rounded-card border border-red/35 bg-red/20 p-4 text-parchment">
              <p className="font-heading text-lg">Map load issue</p>
              <p className="mt-1 text-sm">
                Harita yuklenemedi. Liste gorunumune otomatik gecildi.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {mythologies.map((mythology, index) => (
                <HoverPrefetchLink
                  key={`fallback-${mythology.id}`}
                  href={`/mythology/${mythology.id}`}
                  className="stagger-card ancient-card block p-4"
                  style={
                    {
                      animationDelay: `${index * 28}ms`,
                      borderColor: 'rgba(201,168,76,0.2)',
                    } as any
                  }
                  onMouseEnter={(event) => {
                    (event.currentTarget as HTMLElement).style.borderColor = `${mythology.color}aa`;
                  }}
                  onMouseLeave={(event) => {
                    (event.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.2)';
                  }}
                >
                  <p className="text-gold-light">
                    {mythology.name} {FEATURED_MYTHOLOGIES.has(mythology.id) ? '♕' : ''}
                  </p>
                  <p className="mt-1 text-xs text-secondary">
                    {mythology.region} · {mythology.era}
                  </p>
                  <div className="mt-2 flex gap-2 text-[11px]">
                    <span className="rounded-full border border-gold/25 px-2 py-0.5 text-primary">
                      📜 {countsByMythology.mythCounts.get(mythology.id) || 0}
                    </span>
                    <span className="rounded-full border border-gold/25 px-2 py-0.5 text-primary">
                      ⚡ {countsByMythology.deityCounts.get(mythology.id) || 0}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-primary">{mythology.description}</p>
                </HoverPrefetchLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {parallelMode && !activeParallelConnection && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-lg border border-[color:var(--color-border-hover)] bg-elevated/90 px-4 py-2 text-xs tracking-[0.08em] text-primary">
          Paralel Mitler Modu aktif: bağlantı çizgisine tıklayarak iki miti yan yana incele.
        </div>
      )}

      {influenceMode && !activeInfluenceConnection && (
        <div className="pointer-events-none absolute left-1/2 top-32 z-30 -translate-x-1/2 rounded-lg border border-gold/45 bg-surface/90 px-4 py-2 text-xs tracking-[0.08em] text-gold-light">
          Etki Agi aktif: bir baglanti yayina tiklayarak tarihsel etkilesim detayini ac.
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="pointer-events-auto absolute left-4 top-4 flex items-center gap-3 rounded-xl border border-gold/25 bg-surface/85 px-3 py-2 backdrop-blur-md">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/50 bg-overlay text-gold-light">✧</div>
          <div>
            <p className="font-heading text-sm tracking-[0.14em] text-gold-light">MythAtlas</p>
            <HoverPrefetchLink href="/" className="text-[11px] text-secondary hover:text-gold-light">← Back to Home</HoverPrefetchLink>
          </div>
        </div>

        <div className="pointer-events-auto absolute right-4 top-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            aria-label="Toggle parallel myths mode"
            onClick={() =>
              setParallelMode((value) => {
                const next = !value;
                if (next) {
                  setInfluenceMode(false);
                  setSelectedInfluenceConnectionId(null);
                }
                return next;
              })
            }
            className={`rounded-lg border px-3 py-2 text-xs ${parallelMode ? 'border-[color:var(--color-border-hover)] bg-elevated/90 text-primary' : 'border-[color:var(--color-border)] bg-surface/85 text-secondary hover:bg-overlay'}`}
          >
            {parallelMode ? 'Paralel Modu: Acik' : 'Paralel Mitler Modu'}
          </button>
          <button
            type="button"
            aria-label="Toggle influence network"
            onClick={() =>
              setInfluenceMode((value) => {
                const next = !value;
                if (next) {
                  setParallelMode(false);
                  setSelectedParallelConnectionId(null);
                  setHoveredParallelConnectionId(null);
                }
                return next;
              })
            }
            className={`rounded-lg border px-3 py-2 text-xs ${influenceMode ? 'border-gold/70 bg-overlay/90 text-gold-light' : 'border-gold/25 bg-surface/90 text-secondary hover:bg-overlay'}`}
          >
            {influenceMode ? 'Etki Agi: Acik' : 'Etki Agi'}
          </button>
          <button
            type="button"
            aria-label="Toggle connection density heatmap"
            onClick={() => setConnectionHeatmap((value) => !value)}
            className={`rounded-lg border px-3 py-2 text-xs ${connectionHeatmap ? 'border-gold/70 bg-overlay/90 text-gold-light' : 'border-gold/25 bg-surface/90 text-secondary'}`}
          >
            Baglanti Yogunlugu
          </button>
          <button
            type="button"
            aria-label="Toggle archaeology layer"
            onClick={() => setArchaeologyLayerEnabled((value) => !value)}
            className={`rounded-lg border px-3 py-2 text-xs ${
              archaeologyLayerEnabled
                ? 'border-gold/70 bg-overlay/90 text-gold-light'
                : 'border-gold/25 bg-surface/90 text-secondary'
            }`}
          >
            Arkeoloji Katmani
          </button>
          <button
            type="button"
            aria-label="Open search panel"
            onClick={() => {
              setSearchOpen((v) => !v);
              setLegendOpen(false);
            }}
            className="rounded-lg border border-gold/25 bg-surface/85 px-3 py-2 text-xs text-primary hover:bg-overlay"
          >
            Search
          </button>
          <button
            type="button"
            aria-label="Open filter panel"
            onClick={() => {
              setFilterOpen((v) => !v);
              setLegendOpen(false);
            }}
            className="relative rounded-lg border border-gold/25 bg-surface/85 px-3 py-2 text-xs text-primary hover:bg-overlay"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -right-2 -top-2 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-background">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            aria-label="Open legend panel"
            onClick={() => {
              setLegendOpen((v) => !v);
              setFilterOpen(false);
            }}
            className="rounded-lg border border-gold/25 bg-surface/85 px-3 py-2 text-xs text-primary hover:bg-overlay"
          >
            Legend
          </button>
          <HoverPrefetchLink href="/parallels" className="rounded-lg border border-gold/25 bg-surface/85 px-3 py-2 text-xs text-primary hover:bg-overlay">
            Parallels
          </HoverPrefetchLink>
          <HoverPrefetchLink href="/compare" className="rounded-lg border border-gold/25 bg-surface/85 px-3 py-2 text-xs text-primary hover:bg-overlay">
            Compare
          </HoverPrefetchLink>
        </div>

        <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-col gap-2 rounded-xl border border-gold/25 bg-surface/90 p-2 backdrop-blur-md">
          <button type="button" onClick={() => mapRef.current?.zoomIn({ duration: reducedMotion ? 0 : 250 })} aria-label="Zoom in" className="h-8 w-8 rounded-md border border-gold/20 text-gold-light hover:bg-overlay">+</button>
          <button type="button" onClick={() => mapRef.current?.zoomOut({ duration: reducedMotion ? 0 : 250 })} aria-label="Zoom out" className="h-8 w-8 rounded-md border border-gold/20 text-gold-light hover:bg-overlay">−</button>
          <button type="button" onClick={resetView} aria-label="Reset map view" className="rounded-md border border-gold/20 px-2 py-1 text-[11px] text-gold-light hover:bg-overlay">Reset</button>
          <button type="button" onClick={() => mapRef.current?.easeTo({ bearing: 0, duration: reducedMotion ? 0 : 450 })} aria-label="Reset map bearing" className="flex h-8 w-8 items-center justify-center rounded-md border border-gold/20 hover:bg-overlay"><span className="inline-block text-gold-light" style={{ transform: `rotate(${-bearing}deg)` }}>▲</span></button>
        </div>

        <div className="pointer-events-none absolute bottom-4 right-4 rounded-xl border border-gold/25 bg-surface/90 p-3 text-primary backdrop-blur-md">
          <div className="mb-2 text-[11px] uppercase tracking-[0.15em] text-secondary">Scale</div>
          <div className="mb-1 h-[4px] rounded-full bg-gold-light" style={{ width: `${scale.width}px` }} />
          <div className="text-[11px] text-primary">{scale.label}</div>
          <div className="mt-2 border-t border-gold/15 pt-2 font-mono text-[11px] text-secondary">{coords[1].toFixed(4)}, {coords[0].toFixed(4)}</div>
        </div>
      </div>

      <div tabIndex={0} aria-label="Map legend panel" className={`pointer-events-auto absolute left-0 top-0 z-30 h-full w-full transform border-r border-gold/20 bg-background/95 backdrop-blur-xl transition-transform duration-300 ease-out sm:w-[min(92vw,340px)] ${legendOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
          <h2 className="font-heading text-sm tracking-[0.2em] text-gold-light">Legend</h2>
          <button type="button" onClick={() => setLegendOpen(false)} className="text-xs text-secondary hover:text-gold-light">Close</button>
        </div>

        <div className="h-[calc(100%-56px)] space-y-5 overflow-y-auto px-4 py-4 text-sm text-primary">
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">Mythology Regions</h3>
            <div className="space-y-1.5">
              {mythologies.map((m) => (<div key={m.id} className="flex items-center gap-2 text-xs"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} /><span>{m.name}</span></div>))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">Myth Type Colors</h3>
            <div className="space-y-1.5">
              {Object.entries(MYTH_TYPE_COLORS).map(([type, color]) => (<div key={type} className="flex items-center gap-2 text-xs"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} /><span className="capitalize">{type}</span></div>))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">Site Icons</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(SITE_TYPES).filter(([k]) => k !== 'default').map(([k, v]) => (<div key={k} className="flex items-center gap-2"><span>{v.icon}</span><span>{v.label}</span></div>))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">Archaeology Overlay</h3>
            <div className="space-y-1.5 text-xs text-primary">
              <p>★ UNESCO koruma isareti</p>
              <p>⛏ Mavi halka = aktif kazi</p>
              <p>• Turuncu nokta = eserler birden fazla ulkede</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">Layer On/Off</h3>
            <div className="space-y-2 text-xs">
              {[{ key: 'regions', label: 'Mythology Regions' }, { key: 'sites', label: 'Sacred Sites' }, { key: 'myths', label: 'Myth Origins' }, { key: 'deities', label: 'Deity Origins' }].map((item) => (
                <label key={item.key} className="flex items-center justify-between"><span>{item.label}</span><input type="checkbox" checked={layerVisibility[item.key as keyof typeof layerVisibility]} onChange={() => setLayerVisibility((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))} className="accent-gold" /></label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div tabIndex={0} aria-label="Map filters panel" className={`pointer-events-auto absolute right-0 top-0 z-30 h-full w-full transform border-l border-gold/20 bg-background/95 backdrop-blur-xl transition-transform duration-300 ease-out sm:w-[min(94vw,360px)] ${filterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3"><h2 className="font-heading text-sm tracking-[0.2em] text-gold-light">Filters</h2><button type="button" onClick={() => setFilterOpen(false)} className="text-xs text-secondary hover:text-gold-light">Close</button></div>

        <div className="h-[calc(100%-56px)] space-y-5 overflow-y-auto px-4 py-4 text-sm text-primary">
          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">Mythology Systems</h3>
            <div className="flex flex-wrap gap-2">
              {mythologies.map((m) => {
                const active = mythologyFilters.includes(m.id);
                return (<button key={m.id} type="button" onClick={() => setMythologyFilters((prev) => (prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]))} className={`rounded-full border px-3 py-1 text-xs ${active ? 'border-gold bg-overlay text-gold-light' : 'border-gold/25 text-secondary'}`}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />{m.name}</button>);
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">Content Type</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[{ key: 'sites', label: 'Sacred Sites' }, { key: 'myths', label: 'Myths' }, { key: 'deities', label: 'Deities' }].map((item) => {
                const active = contentVisibility[item.key as keyof typeof contentVisibility];
                return (<button key={item.key} type="button" onClick={() => setContentVisibility((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))} className={`rounded-md border px-2 py-2 ${active ? 'border-gold/60 bg-overlay text-gold-light' : 'border-gold/20 text-secondary'}`}>{item.label}</button>);
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">Myth Type</h3>
            <div className="flex flex-wrap gap-2">
              {mythTypes.map((type) => {
                const active = mythTypeFilters.includes(type);
                return (<button key={type} type="button" onClick={() => setMythTypeFilters((prev) => (prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]))} className={`rounded-full border px-3 py-1 text-xs capitalize ${active ? 'border-gold bg-overlay text-gold-light' : 'border-gold/25 text-secondary'}`}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: MYTH_TYPE_COLORS[type] ?? 'rgb(168, 152, 128)' }} />{type}</button>);
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">Era</h3>
            <div className="flex flex-wrap gap-2">{(['ancient', 'medieval', 'modern'] as EraBucket[]).map((era) => { const active = eraFilters.includes(era); return (<button key={era} type="button" onClick={() => setEraFilters((prev) => (prev.includes(era) ? prev.filter((x) => x !== era) : [...prev, era]))} className={`rounded-full border px-3 py-1 text-xs ${active ? 'border-gold bg-overlay text-gold-light' : 'border-gold/25 text-secondary'}`}>{era}</button>); })}</div>
          </div>

          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">Archaeological Periods</h3>
            <div className="flex flex-wrap gap-2">
              {ARCHAEOLOGY_PERIOD_OPTIONS.map((period) => {
                const active = archaeologyPeriodFilters.includes(period.key);
                return (
                  <button
                    key={period.key}
                    type="button"
                    onClick={() =>
                      setArchaeologyPeriodFilters((prev) =>
                        prev.includes(period.key) ? prev.filter((item) => item !== period.key) : [...prev, period.key]
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      active ? 'border-gold bg-overlay text-gold-light' : 'border-gold/25 text-secondary'
                    }`}
                  >
                    {period.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-secondary">Secildiginde diger donem siteleri haritada soldurulur.</p>
          </div>

          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">Theme Tags</h3>
            <div className="flex flex-wrap gap-2">{themeTags.map((theme) => { const active = themeFilters.includes(theme); return (<button key={theme} type="button" onClick={() => setThemeFilters((prev) => (prev.includes(theme) ? prev.filter((x) => x !== theme) : [...prev, theme]))} className={`rounded-full border px-3 py-1 text-xs ${active ? 'border-gold bg-overlay text-gold-light' : 'border-gold/25 text-secondary'}`}>{theme}</button>); })}</div>
          </div>

          <div>
            <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-secondary">DNA Elementleri</h3>
            <div className="flex flex-wrap gap-2">
              {DNA_ELEMENT_UNIVERSE.map((element) => {
                const active = dnaElementFilters.includes(element);
                return (
                  <button
                    key={element}
                    type="button"
                    onClick={() =>
                      setDnaElementFilters((prev) =>
                        prev.includes(element) ? prev.filter((item) => item !== element) : [...prev, element]
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      active
                        ? 'border-gold bg-overlay text-gold-light'
                        : 'border-gold/25 text-secondary'
                    }`}
                  >
                    {formatDNAKeyLabel(element)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gold/15 pt-3"><button type="button" onClick={clearFilters} className="rounded-md border border-gold/30 px-3 py-2 text-xs text-gold-light hover:bg-overlay">Clear all filters</button></div>
        </div>
      </div>

      <div
        tabIndex={0}
        aria-label="Selected mythology panel"
        className={`panel-gradient-top pointer-events-auto absolute right-0 top-0 z-40 h-full w-full transform border-l border-gold/20 bg-background/95 backdrop-blur-xl transition-transform duration-300 ease-out sm:w-[min(94vw,400px)] ${selectedMythology ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedMythology && (
          <>
            <div
              className="h-[3px] w-full"
              style={{
                background: `linear-gradient(90deg, rgba(0,0,0,0), ${selectedMythology.color}, rgba(0,0,0,0))`,
              }}
            />
            <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
              <div>
                <h2 className="font-heading text-sm tracking-[0.15em] text-gold-light">
                  {selectedMythology.name}
                </h2>
                <p className="text-xs text-secondary">
                  {selectedMythology.region} · {selectedMythology.era}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMythologyId(null);
                  setDetail(null);
                }}
                className="text-xs text-secondary hover:text-gold-light"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100%-56px)] overflow-y-auto">
              <div className="relative h-44 w-full overflow-hidden border-b border-gold/10">
                <AncientImage
                  src={selectedMythology.imageUrl}
                  alt={selectedMythology.name}
                  fill
                  sizes="(max-width: 1024px) 94vw, 400px"
                  className="h-full w-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              </div>
              <div className="space-y-4 px-4 py-4 text-sm text-primary">
                <p className="leading-relaxed text-primary">{selectedMythology.description}</p>
                <p className="leading-relaxed text-secondary">{selectedMythology.significance}</p>

                <div className="panel-ornament border-t border-gold/12 pt-3" />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md border border-gold/20 bg-surface/70 p-2">
                    <p className="text-secondary">Kanonik panteon</p>
                    <p className="mt-1 text-base text-gold-light">{selectedBundle?.datasetCounts.canonicalPantheonSize ?? selectedMythology.pantheonSize}</p>
                  </div>
                  <div className="rounded-md border border-gold/20 bg-surface/70 p-2">
                    <p className="text-secondary">Myths</p>
                    <p className="mt-1 text-base text-gold-light">{selectedBundle?.datasetCounts.myths ?? selectedMyths.length}</p>
                  </div>
                  <div className="rounded-md border border-gold/20 bg-surface/70 p-2">
                    <p className="text-secondary">Deities</p>
                    <p className="mt-1 text-base text-gold-light">{selectedBundle?.datasetCounts.deities ?? selectedDeities.length}</p>
                  </div>
                  <div className="rounded-md border border-gold/20 bg-surface/70 p-2">
                    <p className="text-secondary">Kutsal mekanlar</p>
                    <p className="mt-1 text-base text-gold-light">{selectedBundle?.datasetCounts.sites ?? selectedSites.length}</p>
                  </div>
                </div>
                <div className="rounded-md border border-gold/20 bg-surface/70 p-3 text-xs text-primary">
                  <p>
                    Veri durumu:{' '}
                    <span className="text-gold-light">
                      {selectedBundle ? { complete: 'Tam', partial: 'Kismi', sparse: 'Sinirli' }[selectedBundle.completeness.label] : 'Bilinmiyor'}
                    </span>
                  </p>
                  {selectedBundle && selectedBundle.missingSections.length > 0 ? (
                    <p className="mt-1">Eksik alanlar: {selectedBundle.missingSections.join(', ')}</p>
                  ) : null}
                </div>

                <div className="relative border-b border-gold/10 pb-2 text-xs">
                  <span
                    className="absolute bottom-0 left-0 h-[2px] rounded-full bg-gold transition-all duration-300"
                    style={{
                      width: `${100 / panelTabs.length}%`,
                      transform: `translateX(${Math.max(0, activePanelTabIndex) * 100}%)`,
                    }}
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {panelTabs.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTab(key)}
                        className={`rounded-full px-2 py-1 capitalize ${tab === key ? 'text-gold-light' : 'text-secondary hover:text-gold-light'}`}
                      >
                        {key === 'sites' ? 'Sacred Sites' : key}
                      </button>
                    ))}
                  </div>
                </div>

                {tab === 'overview' && (
                  <div className="space-y-2 text-xs text-secondary">
                    <p>Culture: {selectedMythology.culture}</p>
                    <p>Primary language: {selectedMythology.primaryLanguage}</p>
                    <p>Tags: {selectedMythology.tags.join(', ')}</p>
                  </div>
                )}

                {tab === 'myths' && (
                  <div className="space-y-2">
                    {selectedMyths.length === 0 ? (
                      <div className="rounded-md border border-gold/15 bg-surface/80 p-3 text-xs text-secondary">
                        Bu mitoloji icin mit listesi henuz tamamlanmadi.
                      </div>
                    ) : selectedMyths.map((myth, index) => (
                      <div
                        key={myth.id}
                        className="stagger-card w-full rounded-md border border-gold/15 bg-surface/80 p-2 text-left hover:border-gold/35"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <p className="text-sm text-primary">{myth.name}</p>
                        <p className="text-xs capitalize text-secondary">{myth.type}</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDetail({ kind: 'myth', id: myth.id })}
                            className="rounded-md border border-gold/25 px-2 py-1 text-[11px] text-gold-light"
                          >
                            Detay
                          </button>
                          <button
                            type="button"
                            onClick={() => flyToCoordinates([myth.origin.lng, myth.origin.lat])}
                            className="rounded-md border border-gold/25 px-2 py-1 text-[11px] text-gold-light"
                          >
                            Haritada goster
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 'deities' && (
                  <div className="space-y-2">
                    {selectedDeities.length === 0 ? (
                      <div className="rounded-md border border-gold/15 bg-surface/80 p-3 text-xs text-secondary">
                        Bu mitoloji icin panteon kayitlari henuz tamamlanmadi.
                      </div>
                    ) : selectedDeities.map((deity, index) => (
                      <div
                        key={deity.id}
                        className="stagger-card w-full rounded-md border border-gold/15 bg-surface/80 p-2 text-left hover:border-gold/35"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <p className="text-sm text-primary">{deity.name}</p>
                        <p className="text-xs capitalize text-secondary">{deity.type}</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDetail({ kind: 'deity', id: deity.id })}
                            className="rounded-md border border-gold/25 px-2 py-1 text-[11px] text-gold-light"
                          >
                            Detay
                          </button>
                          <button
                            type="button"
                            onClick={() => flyToCoordinates([deity.origin.lng, deity.origin.lat])}
                            className="rounded-md border border-gold/25 px-2 py-1 text-[11px] text-gold-light"
                          >
                            Haritada goster
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 'sites' && (
                  <div className="space-y-2">
                    {selectedSites.length === 0 ? (
                      <div className="rounded-md border border-gold/15 bg-surface/80 p-3 text-xs text-secondary">
                        Bu mitoloji icin kutsal mekan kayitlari henuz tamamlanmadi.
                      </div>
                    ) : selectedSites.map((site, index) => (
                      <div
                        key={site.id}
                        className="stagger-card w-full rounded-md border border-gold/15 bg-surface/80 p-2 text-left hover:border-gold/35"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <p className="text-sm text-primary">{site.name}</p>
                        <p className="text-xs capitalize text-secondary">{site.type}</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDetail({ kind: 'site', id: site.id })}
                            className="rounded-md border border-gold/25 px-2 py-1 text-[11px] text-gold-light"
                          >
                            Detay
                          </button>
                          <button
                            type="button"
                            onClick={() => flyToCoordinates([site.coordinates.lng, site.coordinates.lat])}
                            className="rounded-md border border-gold/25 px-2 py-1 text-[11px] text-gold-light"
                          >
                            Haritada goster
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <HoverPrefetchLink
                  href={`/mythology/${selectedMythology.id}`}
                  className="inline-flex rounded-full border border-gold/40 px-4 py-2 text-xs tracking-[0.14em] text-gold-light hover:bg-overlay"
                >
                  Daha fazla kesfet
                </HoverPrefetchLink>
              </div>
            </div>
          </>
        )}
      </div>

      <div tabIndex={0} aria-label="Entity detail panel" className={`pointer-events-auto absolute right-0 top-0 z-50 h-full w-full transform border-l border-gold/20 bg-background/95 backdrop-blur-xl transition-transform duration-300 ease-out sm:w-[min(92vw,360px)] ${detailData ? 'translate-x-0' : 'translate-x-full'}`}>
        {detailData && (<><div className="flex items-center justify-between border-b border-gold/15 px-4 py-3"><h2 className="font-heading text-sm tracking-[0.14em] text-gold-light">Detail</h2><button type="button" onClick={() => setDetail(null)} className="text-xs text-secondary hover:text-gold-light">Close</button></div><div className="h-[calc(100%-56px)] overflow-y-auto px-4 py-4 text-sm text-primary">{detailData.imageUrl && <AncientImage src={detailData.imageUrl} alt={detailData.title} width={560} height={240} sizes="(max-width: 768px) 90vw, 560px" className="mb-3 h-44 w-full rounded-md object-cover" />}<h3 className="font-heading text-base text-gold-light">{detailData.title}</h3><p className="mb-3 text-xs text-secondary">{detailData.subtitle}</p><p className="leading-relaxed text-primary">{detailData.description}</p>{'meta' in detailData && detailData.meta && <p className="mt-3 text-xs text-secondary">{detailData.meta}</p>}<div className="mt-4 flex flex-wrap gap-2 text-xs">{detailData.chips.map((chip) => (<span key={chip} className="rounded-full border border-gold/25 px-2 py-1 text-secondary">{chip}</span>))}</div></div></>)}
      </div>

      {parallelMode && activeParallelConnection && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-40 w-[min(96vw,820px)] -translate-x-1/2 rounded-2xl border border-gold/35 bg-background/95 p-4 shadow-[var(--shadow-gold)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-gold-light">Paralel Baglanti</p>
              <p className="text-sm text-primary">
                {activeParallelConnection.fromMyth.name} ↔ {activeParallelConnection.toMyth.name}
              </p>
            </div>
            <button type="button" onClick={() => setSelectedParallelConnectionId(null)} className="rounded-full border border-gold/35 px-3 py-1 text-xs text-gold-light hover:bg-overlay">Kapat</button>
          </div>

          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-overlay">
            <div className="h-full rounded-full" style={{ width: `${activeParallelConnection.similarity}%`, backgroundColor: activeParallelConnection.themeColor }} />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-gold/20 bg-surface/85 p-3">
              <p className="text-sm text-primary">{activeParallelConnection.fromMyth.name}</p>
              <p className="text-xs text-secondary">{mythologyById.get(activeParallelConnection.fromMyth.mythologyId)?.name ?? activeParallelConnection.fromMyth.mythologyId}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-6 text-primary">{activeParallelConnection.fromMyth.summary}</p>
            </div>
            <div className="rounded-lg border border-gold/20 bg-surface/85 p-3">
              <p className="text-sm text-primary">{activeParallelConnection.toMyth.name}</p>
              <p className="text-xs text-secondary">{mythologyById.get(activeParallelConnection.toMyth.mythologyId)?.name ?? activeParallelConnection.toMyth.mythologyId}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-6 text-primary">{activeParallelConnection.toMyth.summary}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-secondary">
              Benzerlik skoru: <span className="font-semibold text-primary">{activeParallelConnection.similarity}</span> · {activeParallelConnection.rationale}
            </p>
            <HoverPrefetchLink
              href={`/compare?left=${activeParallelConnection.fromMyth.id}&right=${activeParallelConnection.toMyth.id}`}
              className="rounded-full border border-gold/45 bg-overlay px-4 py-1.5 text-xs tracking-[0.1em] text-gold-light hover:bg-elevated"
            >
              Karsilastirma Ac
            </HoverPrefetchLink>
          </div>
        </div>
      )}

      {influenceMode && activeInfluenceConnection && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-40 w-[min(96vw,860px)] -translate-x-1/2 rounded-2xl border border-gold/35 bg-background/95 p-4 shadow-[var(--shadow-gold)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-secondary">Etki Baglantisi</p>
              <p className="text-sm text-primary">
                {activeInfluenceConnection.sourceName} {'\u2192'} {activeInfluenceConnection.targetName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedInfluenceConnectionId(null)}
              className="rounded-full border border-gold/35 px-3 py-1 text-xs text-gold-light hover:bg-overlay"
            >
              Kapat
            </button>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span
              className="rounded-full border px-2 py-1"
              style={{
                borderColor: `${activeInfluenceConnection.color}99`,
                color: activeInfluenceConnection.color,
                backgroundColor: `${activeInfluenceConnection.color}22`,
              }}
            >
              {CONNECTION_TYPE_LABELS[activeInfluenceConnection.type]}
            </span>
            <span className="rounded-full border border-gold/30 px-2 py-1 text-gold-light">
              Guc: {'★'.repeat(activeInfluenceConnection.strength)}
              {'☆'.repeat(Math.max(0, 3 - activeInfluenceConnection.strength))}
            </span>
            <span
              className={`rounded-full border px-2 py-1 ${
                activeInfluenceConnection.academicConsensus === 'established'
                  ? 'border-gold/40 bg-elevated text-primary'
                  : activeInfluenceConnection.academicConsensus === 'debated'
                    ? 'border-gold/35 bg-overlay text-secondary'
                    : 'border-gold/30 bg-surface text-secondary'
              }`}
            >
              {CONSENSUS_LABELS[activeInfluenceConnection.academicConsensus]}
            </span>
            <span className="rounded-full border border-gold/30 px-2 py-1 text-secondary">
              Donem: {activeInfluenceConnection.period}
            </span>
          </div>

          <p className="mb-3 text-sm leading-6 text-primary">{activeInfluenceConnection.description}</p>

          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-gold/20 bg-surface/80 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-secondary">Ornekler</p>
              <ul className="space-y-1 text-xs text-primary">
                {activeInfluenceConnection.examples.map((example) => (
                  <li key={example}>• {example}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-gold/20 bg-surface/80 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-secondary">Akademik Kaynaklar</p>
              <ul className="space-y-1 text-xs text-primary">
                {activeInfluenceConnection.sources.map((source) => (
                  <li key={source}>• {source}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-secondary">
              {activeInfluenceConnection.sourceName} ile {activeInfluenceConnection.targetName} arasindaki etkilesim
              seviyesi: {activeInfluenceConnection.strength}/3.
            </p>
            {canCompareInfluenceConnection ? (
              <HoverPrefetchLink
                href={`/compare?left=${activeInfluenceConnection.sourceId}&right=${activeInfluenceConnection.targetId}`}
                className="rounded-full border border-gold/45 bg-overlay px-4 py-1.5 text-xs tracking-[0.1em] text-gold-light hover:bg-elevated"
              >
                Her iki mitolojiyi karsilastir
              </HoverPrefetchLink>
            ) : (
              <span className="rounded-full border border-gold/35 px-3 py-1 text-[11px] text-secondary">
                Karsilastirma bu cift icin mevcut degil
              </span>
            )}
          </div>
        </div>
      )}

      {searchOpen && (<div className="pointer-events-auto absolute right-4 top-16 z-40 w-[min(92vw,340px)] rounded-xl border border-gold/20 bg-background/95 p-3 backdrop-blur-md"><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search... or elements:flood archetypes:hero" className="w-full rounded-md border border-gold/20 bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-gold/60" /><div className="mt-2 max-h-80 overflow-y-auto">{searchResults.length === 0 && searchQuery.trim().length > 1 && <p className="px-1 py-2 text-xs text-secondary">No results.</p>}{searchResults.map((result) => (<button key={`${result.kind}-${result.id}`} type="button" onClick={() => selectSearch(result)} className="w-full rounded-md px-2 py-2 text-left hover:bg-overlay"><p className="text-sm text-primary">{result.title}</p><p className="text-xs capitalize text-secondary">{result.kind} · {result.subtitle}</p></button>))}</div></div>)}

      
    </div>
  );
}











