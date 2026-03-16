import mythologyConnectionsJson from '../../data/mythology-connections.json';
import deityEvolutionJson from '../../data/deity-evolution.json';
import {
  deities,
  getMythologyBundle,
  mythologies,
  type DeityData,
  type MythologyBundleCompleteness,
  type MythologyBundleSection,
  type MythologyData,
} from '@/lib/myth-data';

export type MythologyConnectionType =
  | 'influenced'
  | 'evolved_from'
  | 'absorbed'
  | 'parallel_development'
  | 'trade_contact'
  | 'conquest'
  | 'syncretism';

export type AcademicConsensus = 'established' | 'debated' | 'theory';
export type FamilyEraBucket = 'ancient' | 'classical' | 'medieval';

export interface MythologyConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: MythologyConnectionType;
  strength: 1 | 2 | 3;
  description: string;
  examples: string[];
  period: string;
  academicConsensus: AcademicConsensus;
  sources: string[];
}

export interface DeityEvolutionStep {
  deityId: string;
  mythologyId: string;
  period: string;
  changes: string[];
}

export interface DeityEvolutionLineage {
  id: string;
  name: string;
  chain: DeityEvolutionStep[];
}

export interface FamilyTreeMythologyNode {
  id: string;
  name: string;
  region: string;
  culture: string;
  era: string;
  origin: { lat: number; lng: number };
  color: string;
  imageUrl: string;
  mythCount: number;
  deityCount: number;
  siteCount: number;
  canonicalPantheonSize: number;
  missingSections: MythologyBundleSection[];
  completeness: MythologyBundleCompleteness;
  eraBucket: FamilyEraBucket;
  isSynthetic: boolean;
}

interface SyntheticMythologyNode {
  id: string;
  name: string;
  region: string;
  culture: string;
  era: string;
  origin: { lat: number; lng: number };
  color: string;
  imageUrl: string;
  mythCountHint: number;
  deityCountHint: number;
}

const SYNTHETIC_NODES: SyntheticMythologyNode[] = [
  {
    id: 'sumerian',
    name: 'Sumerian Mythology',
    region: 'Southern Mesopotamia',
    culture: 'Sumerian',
    era: 'c. 3500-1900 BCE',
    origin: { lat: 31.3, lng: 46.1 },
    color: '#b9894a',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Ziggurat_of_Ur.jpg/1280px-Ziggurat_of_Ur.jpg',
    mythCountHint: 14,
    deityCountHint: 12,
  },
  {
    id: 'babylonian',
    name: 'Babylonian Mythology',
    region: 'Central Mesopotamia',
    culture: 'Akkadian/Babylonian',
    era: 'c. 2000-500 BCE',
    origin: { lat: 32.5, lng: 44.4 },
    color: '#7a4f28',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Ishtar_Gate_at_Berlin_Museum.jpg/1280px-Ishtar_Gate_at_Berlin_Museum.jpg',
    mythCountHint: 18,
    deityCountHint: 14,
  },
  {
    id: 'biblical-hebrew',
    name: 'Biblical/Hebrew Tradition',
    region: 'Levant',
    culture: 'Ancient Israel/Judah',
    era: 'c. 1200-200 BCE',
    origin: { lat: 31.8, lng: 35.2 },
    color: '#8f7a52',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Jerusalem_night_WLM14.jpg/1280px-Jerusalem_night_WLM14.jpg',
    mythCountHint: 9,
    deityCountHint: 3,
  },
  {
    id: 'proto-indo-european',
    name: 'Proto-Indo-European Tradition',
    region: 'Pontic-Caspian Steppe',
    culture: 'Proto-Indo-European',
    era: 'Prehistory',
    origin: { lat: 49, lng: 35 },
    color: '#6c5c95',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Steppe_in_kazakhstan.jpg/1280px-Steppe_in_kazakhstan.jpg',
    mythCountHint: 6,
    deityCountHint: 6,
  },
  {
    id: 'hellenistic-syncretic',
    name: 'Hellenistic Syncretic Cults',
    region: 'Eastern Mediterranean',
    culture: 'Hellenistic Multi-Ethnic',
    era: 'c. 330 BCE-300 CE',
    origin: { lat: 31.2, lng: 29.9 },
    color: '#7c3aed',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Library_of_Celsus%2C_Ephesus.jpg/1280px-Library_of_Celsus%2C_Ephesus.jpg',
    mythCountHint: 11,
    deityCountHint: 9,
  },
  {
    id: 'southeast-asian',
    name: 'Southeast Asian Mythologies',
    region: 'Southeast Asia',
    culture: 'Khmer/Thai/Javanese and others',
    era: 'c. 200 BCE-1900 CE',
    origin: { lat: 13.7, lng: 100.5 },
    color: '#4b9f74',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Angkor_Wat_temple.jpg/1280px-Angkor_Wat_temple.jpg',
    mythCountHint: 12,
    deityCountHint: 10,
  },
  {
    id: 'estonian',
    name: 'Estonian Mythology',
    region: 'Baltic Region',
    culture: 'Estonian/Finnic',
    era: 'c. 500 BCE-1800 CE',
    origin: { lat: 59.4, lng: 24.7 },
    color: '#3b82f6',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Tallinn_old_town_from_toompea.jpg/1280px-Tallinn_old_town_from_toompea.jpg',
    mythCountHint: 8,
    deityCountHint: 6,
  },
];

const SYNTHETIC_NODE_BY_ID = new Map(SYNTHETIC_NODES.map((item) => [item.id, item]));

const DEITY_NAME_OVERRIDES: Record<string, string> = {
  inanna: 'Inanna',
  dyeus: 'Dyeus',
  tiwaz: 'Tiwaz',
  attis: 'Attis',
  mithras: 'Mithras',
  yahweh: 'Yahweh',
};

const mythologyById = new Map(mythologies.map((item) => [item.id, item]));
const deitiesById = new Map(deities.map((item) => [item.id, item]));

export const mythologyConnections = mythologyConnectionsJson as MythologyConnection[];
export const deityEvolutionLineages = deityEvolutionJson as DeityEvolutionLineage[];

export const CONNECTION_TYPE_COLORS: Record<MythologyConnectionType, string> = {
  influenced: '#c9a84c',
  evolved_from: '#ffd700',
  absorbed: '#8b2e2e',
  syncretism: '#7c3aed',
  parallel_development: '#3b82f6',
  trade_contact: '#16a34a',
  conquest: '#991b1b',
};

export const CONNECTION_TYPE_LABELS: Record<MythologyConnectionType, string> = {
  influenced: 'Influenced',
  evolved_from: 'Evolved From',
  absorbed: 'Absorbed',
  syncretism: 'Syncretism',
  parallel_development: 'Parallel Development',
  trade_contact: 'Trade Contact',
  conquest: 'Conquest',
};

export const CONSENSUS_LABELS: Record<AcademicConsensus, string> = {
  established: 'Established',
  debated: 'Debated',
  theory: 'Theory',
};

function normalizeToMapEraBucket(year: number): 'ancient' | 'medieval' | 'modern' {
  if (year <= 500) return 'ancient';
  if (year <= 1500) return 'medieval';
  return 'modern';
}

export function inferFamilyEraBucket(text: string): FamilyEraBucket {
  const lower = text.toLowerCase();
  if (lower.includes('classical')) return 'classical';
  if (lower.includes('medieval')) return 'medieval';
  const year = parseYearFromText(text);
  if (year <= -500) return 'ancient';
  if (year <= 500) return 'classical';
  return 'medieval';
}

export function parseYearFromText(text: string): number {
  const normalized = text.replace(/CE/gi, ' CE').replace(/BCE/gi, ' BCE');
  const match = normalized.match(/(\d{1,4})\s*(BCE|CE)?/i);
  if (!match) return 0;
  const year = Number(match[1]);
  if (!Number.isFinite(year)) return 0;
  if ((match[2] || '').toUpperCase() === 'BCE') return -year;
  return year;
}

function titleFromId(id: string): string {
  return id
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const EMPTY_COMPLETENESS: MythologyBundleCompleteness = {
  hasMyths: false,
  hasDeities: false,
  hasSites: false,
  hasConnections: false,
  hasComparableData: false,
  score: 0,
  ratio: 0,
  label: 'sparse',
};

export function getMythologyName(id: string): string {
  return mythologyById.get(id)?.name ?? SYNTHETIC_NODE_BY_ID.get(id)?.name ?? titleFromId(id);
}

export function getMythologyNode(id: string): FamilyTreeMythologyNode | null {
  const bundle = getMythologyBundle(id);
  if (bundle) {
    const existing = bundle.mythology;
    return {
      id: existing.id,
      name: existing.name,
      region: existing.region,
      culture: existing.culture,
      era: existing.era,
      origin: existing.origin,
      color: existing.color,
      imageUrl: existing.imageUrl,
      mythCount: bundle.datasetCounts.myths,
      deityCount: bundle.datasetCounts.deities,
      siteCount: bundle.datasetCounts.sites,
      canonicalPantheonSize: bundle.datasetCounts.canonicalPantheonSize,
      missingSections: bundle.missingSections,
      completeness: bundle.completeness,
      eraBucket: inferFamilyEraBucket(existing.era),
      isSynthetic: false,
    };
  }

  const synthetic = SYNTHETIC_NODE_BY_ID.get(id);
  if (!synthetic) return null;
  return {
    id: synthetic.id,
    name: synthetic.name,
    region: synthetic.region,
    culture: synthetic.culture,
    era: synthetic.era,
    origin: synthetic.origin,
    color: synthetic.color,
    imageUrl: synthetic.imageUrl,
    mythCount: 0,
    deityCount: 0,
    siteCount: 0,
    canonicalPantheonSize: 0,
    missingSections: ['myths', 'deities', 'sites', 'connections', 'parallels', 'comparable'],
    completeness: EMPTY_COMPLETENESS,
    eraBucket: inferFamilyEraBucket(synthetic.era),
    isSynthetic: true,
  };
}

export function getFamilyTreeNodes(): FamilyTreeMythologyNode[] {
  const ids = new Set<string>(mythologies.map((item) => item.id));
  mythologyConnections.forEach((connection) => {
    ids.add(connection.sourceId);
    ids.add(connection.targetId);
  });

  return Array.from(ids)
    .map((id) => getMythologyNode(id))
    .filter((node): node is FamilyTreeMythologyNode => Boolean(node))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getConnectionsForMythology(mythologyId: string): MythologyConnection[] {
  return mythologyConnections.filter(
    (connection) => connection.sourceId === mythologyId || connection.targetId === mythologyId
  );
}

export function getOutgoingConnections(mythologyId: string): MythologyConnection[] {
  return mythologyConnections.filter((connection) => connection.sourceId === mythologyId);
}

export function getIncomingConnections(mythologyId: string): MythologyConnection[] {
  return mythologyConnections.filter((connection) => connection.targetId === mythologyId);
}

function normalizeLng(value: number): number {
  let normalized = value;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function buildArcCoordinates(from: [number, number], to: [number, number], segments = 56): [number, number][] {
  let [lng1, lat1] = from;
  let [lng2, lat2] = to;
  if (Math.abs(lng2 - lng1) > 180) {
    if (lng1 > lng2) lng2 += 360;
    else lng1 += 360;
  }

  const distance = Math.hypot(lng2 - lng1, lat2 - lat1);
  const arcLift = Math.max(2, Math.min(15, distance * 0.08));
  const coords: [number, number][] = [];
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const lng = normalizeLng(lng1 + (lng2 - lng1) * t);
    const curvedLat = lat1 + (lat2 - lat1) * t + Math.sin(Math.PI * t) * arcLift;
    coords.push([lng, Math.max(-84, Math.min(84, curvedLat))]);
  }
  return coords;
}

export interface InfluenceMapFeatureProperties extends MythologyConnection {
  sourceName: string;
  targetName: string;
  color: string;
  linePattern: 'solid' | 'dash' | 'dot';
  arrow: boolean;
  eraBucket: 'ancient' | 'medieval' | 'modern';
}

export interface InfluenceMapGeoJson {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'LineString'; coordinates: [number, number][] };
    properties: InfluenceMapFeatureProperties;
  }>;
}

function resolveLinePattern(connection: MythologyConnection): 'solid' | 'dash' | 'dot' {
  if (connection.academicConsensus === 'theory') return 'dot';
  if (connection.academicConsensus === 'debated') return 'dash';
  if (connection.type === 'parallel_development') return 'dash';
  return 'solid';
}

export function getInfluenceMapGeoJson(): InfluenceMapGeoJson {
  const features: InfluenceMapGeoJson['features'] = [];

  mythologyConnections.forEach((connection) => {
    const source = getMythologyNode(connection.sourceId);
    const target = getMythologyNode(connection.targetId);
    if (!source || !target) return;
    const year = parseYearFromText(connection.period);
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: buildArcCoordinates(
          [source.origin.lng, source.origin.lat],
          [target.origin.lng, target.origin.lat]
        ),
      },
      properties: {
        ...connection,
        sourceName: source.name,
        targetName: target.name,
        color: CONNECTION_TYPE_COLORS[connection.type],
        linePattern: resolveLinePattern(connection),
        arrow: connection.type === 'evolved_from' || connection.type === 'conquest',
        eraBucket: normalizeToMapEraBucket(year),
      },
    });
  });

  return { type: 'FeatureCollection', features };
}

export function getDeityName(deityId: string): string {
  if (DEITY_NAME_OVERRIDES[deityId]) return DEITY_NAME_OVERRIDES[deityId];
  const deity = deitiesById.get(deityId);
  if (deity) return deity.name;
  return titleFromId(deityId);
}

export function getDeityRecord(deityId: string): DeityData | null {
  return deitiesById.get(deityId) ?? null;
}

export function getMythologyRecord(id: string): MythologyData | null {
  return mythologyById.get(id) ?? null;
}
